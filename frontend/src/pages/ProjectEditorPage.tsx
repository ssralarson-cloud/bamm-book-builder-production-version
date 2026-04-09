import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, BookOpen, FileDown,
  Wand2, Sparkles, ChevronLeft, ChevronRight, Eye, PenLine, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProject, useUpdateProject, useProjectImages, useAddImage, useKDPValidation } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { useGrokImagesForProject } from '../hooks/useGrokImagesForProject';
import { useGenerateGrokImage } from '../hooks/useGenerateGrokImage';
import { KDPComplianceBadge } from '../components/KDPComplianceBadge';
import { KDPProgressIndicator } from '../components/KDPProgressIndicator';
import { PageCanvas } from '../components/PageCanvas';
import { OwlLogo } from '../components/OwlLogo';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useActor } from '../hooks/useActorExtended';
import type { ProjectDTO, PageDTO } from '../lib/exportUtils';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function validateImageForKdp(width: number, height: number): { warning?: string } {
  const effectiveDpi = Math.min(width / 8.5, height / 8.5);
  if (effectiveDpi < 300) {
    return { warning: `Image is ~${Math.round(effectiveDpi)} DPI. Amazon recommends 300 DPI, but you can still use it.` };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProjectEditorPage() {
  const { projectId } = useParams({ from: '/project/$projectId' });
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated } = useActor();
  const { data: project, isLoading } = useProject(projectId);
  const { data: validation } = useKDPValidation(projectId);
  const { mutate: updateProject, isPending: isSaving } = useUpdateProject();
  const { data: images } = useProjectImages(projectId);
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: addImage } = useAddImage();
  const { generateImage, isGenerating: isGeneratingSingle } = useGenerateGrokImage();

  const [localProject, setLocalProject] = useState<ProjectDTO | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [autoSplitCount, setAutoSplitCount] = useState(10);
  const [activeTab, setActiveTab] = useState('story');

  // Per-page illustration prompts (local state — not persisted to backend)
  const [illustrationPrompts, setIllustrationPrompts] = useState<Record<number, string>>({});
  // Track which page is currently generating
  const [generatingPages, setGeneratingPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      toast.error('Please log in to edit projects');
      navigate({ to: '/' });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (project) {
      setLocalProject(project);
    }
  }, [project]);

  /* ── Save ─────────────────────────────────────────── */
  const handleSave = () => {
    if (!localProject || !isInitialized || !isAuthenticated) return;
    updateProject(localProject, {
      onSuccess: () => toast.success('Project saved!'),
      onError: (err: any) => toast.error(err.message || 'Failed to save'),
    });
  };

  /* ── Story text ───────────────────────────────────── */
  const handleStoryChange = (story: string) => {
    if (!localProject) return;
    setLocalProject({ ...localProject, story, updatedAt: Date.now() });
  };

  const handleAutoSplit = () => {
    if (!localProject || !localProject.story.trim()) {
      toast.error('Please enter a story first');
      return;
    }
    const words = localProject.story.trim().split(/\s+/);
    const wordsPerPage = Math.ceil(words.length / autoSplitCount);
    const newPages: PageDTO[] = [];

    for (let i = 0; i < autoSplitCount; i++) {
      const start = i * wordsPerPage;
      const end = Math.min(start + wordsPerPage, words.length);
      const pageText = words.slice(start, end).join(' ');
      if (pageText.trim()) {
        newPages.push({
          pageNumber: i + 1,
          text: pageText,
          imageUrl: undefined,
          layout: {
            textPosition: { x: 0.1, y: 0.6, width: 0.8, height: 0.3 },
            imagePosition: { x: 0.1, y: 0.1, width: 0.8, height: 0.4 },
          },
        });
      }
    }

    setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
    setIllustrationPrompts({});
    toast.success(`Story split into ${newPages.length} pages`);
    // Auto-switch to page setup tab
    setActiveTab('pages');
  };

  /* ── Page management ──────────────────────────────── */
  const handlePageTextChange = (index: number, text: string) => {
    if (!localProject) return;
    const newPages = [...localProject.pages];
    newPages[index] = { ...newPages[index], text };
    setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
  };

  const handleAddPage = () => {
    if (!localProject) return;
    const newPage: PageDTO = {
      pageNumber: localProject.pages.length + 1,
      text: '',
      imageUrl: undefined,
      layout: {
        textPosition: { x: 0.1, y: 0.6, width: 0.8, height: 0.3 },
        imagePosition: { x: 0.1, y: 0.1, width: 0.8, height: 0.4 },
      },
    };
    setLocalProject({ ...localProject, pages: [...localProject.pages, newPage], updatedAt: Date.now() });
    setSelectedPageIndex(localProject.pages.length);
  };

  const handleDeletePage = (index: number) => {
    if (!localProject) return;
    const newPages = localProject.pages.filter((_, i) => i !== index);
    const renumbered = newPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setLocalProject({ ...localProject, pages: renumbered, updatedAt: Date.now() });
    if (selectedPageIndex >= renumbered.length) {
      setSelectedPageIndex(Math.max(0, renumbered.length - 1));
    }
  };

  /* ── Illustration prompt per page ─────────────────── */
  const setIllustrationPrompt = (index: number, prompt: string) => {
    setIllustrationPrompts((prev) => ({ ...prev, [index]: prompt }));
  };

  /* ── Generate illustration for a single page ──────── */
  const handleGenerateForPage = async (pageIndex: number) => {
    if (!localProject) return;
    const prompt = illustrationPrompts[pageIndex]?.trim() || localProject.pages[pageIndex]?.text?.trim();
    if (!prompt) {
      toast.error('Add page text or an illustration description first');
      return;
    }

    setGeneratingPages((prev) => new Set(prev).add(pageIndex));

    try {
      const imageUrl = await generateImage(projectId, prompt);
      if (imageUrl) {
        const newPages = [...localProject.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], imageUrl };
        setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
        toast.success(`Illustration generated for page ${pageIndex + 1}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate illustration');
    } finally {
      setGeneratingPages((prev) => {
        const next = new Set(prev);
        next.delete(pageIndex);
        return next;
      });
    }
  };

  /* ── Image upload ─────────────────────────────────── */
  const handleImageUpload = async (file: File, pageIndex: number) => {
    if (!localProject || !isInitialized || !isAuthenticated) return;

    try {
      const imagePath = `projects/${projectId}/pages/${pageIndex}/${file.name}`;
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectUrl;
      });

      const val = validateImageForKdp(img.naturalWidth, img.naturalHeight);
      const effectiveDpi = Math.min(img.naturalWidth / 8.5, img.naturalHeight / 8.5);
      URL.revokeObjectURL(objectUrl);

      await uploadFile(imagePath, file);

      await new Promise<string>((resolve, reject) => {
        addImage(
          { projectId, path: imagePath, dpi: effectiveDpi },
          { onSuccess: (id) => resolve(id), onError: reject },
        );
      });

      const newPages = [...localProject.pages];
      newPages[pageIndex] = { ...newPages[pageIndex], imageUrl: imagePath };
      setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });

      if (val.warning) toast.warning(val.warning, { duration: 6000 });
      else toast.success(`Image uploaded (${Math.round(effectiveDpi)} DPI)`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    }
  };

  /* ── Insert generated image ───────────────────────── */
  const handleInsertGeneratedImage = (imageUrl: string) => {
    if (!localProject) return;
    const newPages = [...localProject.pages];
    newPages[selectedPageIndex] = { ...newPages[selectedPageIndex], imageUrl };
    setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
    toast.success('Image inserted into page!');
  };

  /* ── Loading state ────────────────────────────────── */
  if (!isInitialized || isLoading || !localProject) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const progressSteps = [
    { label: 'Story text added', completed: localProject.story.length > 0 },
    { label: 'Pages created', completed: localProject.pages.length > 0 },
    { label: 'Illustrations added', completed: localProject.pages.some((p) => p.imageUrl) },
    { label: 'Cover designed', completed: !!(localProject.cover.front.imageUrl || localProject.cover.back.imageUrl) },
    { label: 'Validation passed', completed: validation?.isValid ?? false, hasIssue: validation?.isValid === false },
  ];

  const currentPage = localProject.pages[selectedPageIndex];

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="container py-6">
      {/* ── Top Bar ──────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <OwlLogo size={28} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-cream-900">{localProject.title}</h1>
              <KDPComplianceBadge
                isValid={validation?.isValid ?? null}
                errors={validation?.errors}
                warnings={validation?.warnings}
              />
            </div>
            <p className="text-xs text-cream-600">8.5 x 8.5" square format &middot; Amazon KDP ready</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-cream-300 text-cream-700 hover:bg-cream-100"
            onClick={() => navigate({ to: '/project/$projectId/cover', params: { projectId } })}
          >
            <BookOpen className="mr-1.5 h-4 w-4" />
            Cover
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-cream-300 text-cream-700 hover:bg-cream-100"
            onClick={() => navigate({ to: '/project/$projectId/export', params: { projectId } })}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600"
            onClick={handleSave}
            disabled={isSaving || !isInitialized}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ── Three-Tab Layout ─────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 rounded-full bg-cream-100 p-1">
          <TabsTrigger value="story" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <PenLine className="h-4 w-4" />
            Write Story
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Layers className="h-4 w-4" />
            Page Setup
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4" />
            Book Preview
          </TabsTrigger>
        </TabsList>

        {/* ━━━━━━ TAB 1: WRITE STORY ━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="story">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-cream-200 shadow-boho">
                <CardHeader>
                  <CardTitle className="font-display text-cream-900">Your Story</CardTitle>
                  <CardDescription>Write or paste your full story, then split it across pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Once upon a time, in a cozy little forest..."
                    value={localProject.story}
                    onChange={(e) => handleStoryChange(e.target.value)}
                    className="min-h-[400px] rounded-xl border-cream-200 bg-cream-50 font-serif text-base leading-relaxed focus:border-terracotta-300 focus:ring-terracotta-200"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pageCount" className="text-sm text-cream-700">Split into</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        min="1"
                        max="50"
                        value={autoSplitCount}
                        onChange={(e) => setAutoSplitCount(parseInt(e.target.value) || 10)}
                        className="w-20 rounded-lg border-cream-200"
                      />
                      <span className="text-sm text-cream-600">pages</span>
                    </div>
                    <Button
                      onClick={handleAutoSplit}
                      className="gap-2 rounded-full bg-sage-500 text-white hover:bg-sage-600"
                    >
                      <Wand2 className="h-4 w-4" />
                      Split Story into Pages
                    </Button>
                  </div>
                  {localProject.story && (
                    <p className="text-xs text-cream-500">
                      {localProject.story.split(/\s+/).filter(Boolean).length} words
                      {localProject.pages.length > 0 && ` across ${localProject.pages.length} pages`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <KDPProgressIndicator steps={progressSteps} />
            </div>
          </div>
        </TabsContent>

        {/* ━━━━━━ TAB 2: PAGE SETUP ━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="pages">
          {localProject.pages.length === 0 ? (
            <Card className="border-2 border-dashed border-cream-300 bg-cream-50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <OwlLogo size={64} className="mb-4 opacity-60" />
                <h3 className="mb-2 font-display text-xl font-semibold text-cream-800">No pages yet</h3>
                <p className="mb-6 max-w-sm text-cream-600">
                  Write your story first, then split it into pages. Or create pages one at a time.
                </p>
                <div className="flex gap-3">
                  <Button
                    className="gap-2 rounded-full bg-sage-500 text-white hover:bg-sage-600"
                    onClick={() => setActiveTab('story')}
                  >
                    <PenLine className="h-4 w-4" />
                    Write Story First
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full border-cream-300"
                    onClick={handleAddPage}
                  >
                    <Plus className="h-4 w-4" />
                    Add Blank Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-4">
              {/* ── Page list sidebar ── */}
              <div className="lg:col-span-1">
                <Card className="border-cream-200 shadow-boho">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-cream-800">Pages</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 rounded-full text-xs text-sage-600 hover:bg-sage-50"
                        onClick={handleAddPage}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-1.5">
                        {localProject.pages.map((page, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPageIndex(index)}
                            className={`group w-full rounded-xl p-2.5 text-left transition-all ${
                              selectedPageIndex === index
                                ? 'bg-terracotta-50 ring-2 ring-terracotta-300'
                                : 'hover:bg-cream-100'
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-cream-800">Page {index + 1}</span>
                              <div className="flex items-center gap-1">
                                {page.imageUrl && (
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage-100">
                                    <ImageIcon className="h-2.5 w-2.5 text-sage-600" />
                                  </span>
                                )}
                                {illustrationPrompts[index] && (
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-100">
                                    <Sparkles className="h-2.5 w-2.5 text-terracotta-500" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-[11px] leading-tight text-cream-600">
                              {page.text || 'Empty page'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* ── Page editor (center + right) ── */}
              <div className="space-y-4 lg:col-span-3">
                {currentPage && (
                  <PageEditorCard
                    page={currentPage}
                    pageIndex={selectedPageIndex}
                    totalPages={localProject.pages.length}
                    illustrationPrompt={illustrationPrompts[selectedPageIndex] || ''}
                    isGenerating={generatingPages.has(selectedPageIndex)}
                    isUploading={isUploading}
                    onTextChange={(text) => handlePageTextChange(selectedPageIndex, text)}
                    onPromptChange={(prompt) => setIllustrationPrompt(selectedPageIndex, prompt)}
                    onGenerate={() => handleGenerateForPage(selectedPageIndex)}
                    onImageUpload={(file) => handleImageUpload(file, selectedPageIndex)}
                    onDelete={() => handleDeletePage(selectedPageIndex)}
                    onPrev={() => setSelectedPageIndex(Math.max(0, selectedPageIndex - 1))}
                    onNext={() => setSelectedPageIndex(Math.min(localProject.pages.length - 1, selectedPageIndex + 1))}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ━━━━━━ TAB 3: BOOK PREVIEW ━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="preview">
          <BookPreview
            pages={localProject.pages}
            title={localProject.title}
            onEditPage={(index) => {
              setSelectedPageIndex(index);
              setActiveTab('pages');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================================================================== */
/*  PageEditorCard — the per-page editing card                        */
/* ================================================================== */

interface PageEditorCardProps {
  page: PageDTO;
  pageIndex: number;
  totalPages: number;
  illustrationPrompt: string;
  isGenerating: boolean;
  isUploading: boolean;
  onTextChange: (text: string) => void;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onImageUpload: (file: File) => void;
  onDelete: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function PageEditorCard({
  page, pageIndex, totalPages, illustrationPrompt, isGenerating, isUploading,
  onTextChange, onPromptChange, onGenerate, onImageUpload, onDelete, onPrev, onNext,
}: PageEditorCardProps) {
  return (
    <Card className="border-cream-200 shadow-boho">
      {/* Card header with page navigation */}
      <CardHeader className="border-b border-cream-100 bg-cream-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={pageIndex === 0}
                onClick={onPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[80px] text-center font-display text-lg font-bold text-cream-900">
                Page {pageIndex + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={pageIndex >= totalPages - 1}
                onClick={onNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-cream-500">of {totalPages}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-full text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left: Text + Illustration Description ── */}
          <div className="space-y-5">
            {/* Page text */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-cream-800">
                <PenLine className="h-3.5 w-3.5 text-cream-500" />
                Page Text
              </Label>
              <Textarea
                value={page.text || ''}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="What happens on this page..."
                className="min-h-[140px] rounded-xl border-cream-200 bg-cream-50 font-serif text-sm leading-relaxed focus:border-terracotta-300 focus:ring-terracotta-200"
              />
            </div>

            {/* Illustration description */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-cream-800">
                <Sparkles className="h-3.5 w-3.5 text-terracotta-400" />
                Illustration Description
              </Label>
              <Textarea
                value={illustrationPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Describe what you want the illustration to look like... e.g. 'A friendly owl sitting in a tree reading a book to baby animals, watercolor style, warm colors'"
                className="min-h-[100px] rounded-xl border-terracotta-100 bg-terracotta-50/30 text-sm leading-relaxed focus:border-terracotta-300 focus:ring-terracotta-200"
              />
              <p className="text-[11px] text-cream-500">
                Leave blank to use your page text as the prompt
              </p>
            </div>

            {/* Generate button */}
            <Button
              onClick={onGenerate}
              disabled={isGenerating || (!illustrationPrompt.trim() && !page.text?.trim())}
              className="w-full gap-2 rounded-full bg-terracotta-500 py-5 text-sm font-bold text-white shadow-boho hover:bg-terracotta-600 hover:shadow-boho-lg"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Illustration...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Illustration for This Page
                </>
              )}
            </Button>

            {/* Or upload manually */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-cream-500">or upload manually</span>
              <Separator className="flex-1" />
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
              }}
              disabled={isUploading}
              className="rounded-lg border-cream-200 text-sm file:rounded-full file:border-0 file:bg-cream-100 file:text-xs file:font-semibold file:text-cream-700 hover:file:bg-cream-200"
            />
          </div>

          {/* ── Right: Illustration Preview ── */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold text-cream-800">
              <ImageIcon className="h-3.5 w-3.5 text-sage-500" />
              Illustration Preview
            </Label>
            <div className="overflow-hidden rounded-2xl border-2 border-cream-200 bg-cream-50">
              <PageImagePreview
                pageIndex={pageIndex}
                imageUrl={page.imageUrl}
              />
            </div>
            <p className="text-center text-[11px] text-cream-500">
              8.5 x 8.5" print area &middot; 300 DPI recommended
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  PageImagePreview — renders the page image with safe zones         */
/* ================================================================== */

function PageImagePreview({ pageIndex, imageUrl }: { pageIndex: number; imageUrl?: string }) {
  const { data: fileUrl } = useFileUrl(imageUrl || '');
  // Use the raw imageUrl as src if it starts with data: (base64 from Grok)
  const src = imageUrl?.startsWith('data:') ? imageUrl : fileUrl;

  if (src) {
    return (
      <PageCanvas trimSize="8.5x8.5" bleed showGuides>
        <img src={src} alt={`Page ${pageIndex + 1}`} className="h-full w-full object-contain" />
      </PageCanvas>
    );
  }

  return (
    <div className="flex aspect-square w-full items-center justify-center bg-cream-50">
      <div className="text-center">
        <OwlLogo size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-cream-400">No illustration yet</p>
        <p className="mt-1 text-xs text-cream-400">Generate or upload one</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  BookPreview — full book spread view before export                  */
/* ================================================================== */

interface BookPreviewProps {
  pages: PageDTO[];
  title: string;
  onEditPage: (index: number) => void;
}

function BookPreview({ pages, title, onEditPage }: BookPreviewProps) {
  if (pages.length === 0) {
    return (
      <Card className="border-2 border-dashed border-cream-300 bg-cream-50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <OwlLogo size={64} className="mb-4 opacity-50" />
          <h3 className="mb-2 font-display text-xl font-semibold text-cream-800">Nothing to preview yet</h3>
          <p className="text-cream-600">Write your story and add pages to see a full book preview.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Book title banner */}
      <div className="rounded-2xl bg-cream-900 p-6 text-center shadow-boho-lg">
        <OwlLogo size={40} className="mx-auto mb-2 brightness-200" />
        <h2 className="font-display text-2xl font-bold text-cream-100">{title}</h2>
        <p className="mt-1 text-sm text-cream-400">{pages.length} pages &middot; 8.5 x 8.5" format</p>
      </div>

      {/* Page spread grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page, index) => (
          <BookPreviewPage
            key={index}
            page={page}
            pageIndex={index}
            onEdit={() => onEditPage(index)}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-sm text-sage-700">
          <ImageIcon className="h-4 w-4" />
          {pages.filter((p) => p.imageUrl).length} of {pages.length} illustrated
        </div>
        <div className="flex items-center gap-2 rounded-full bg-cream-100 px-4 py-2 text-sm text-cream-700">
          <PenLine className="h-4 w-4" />
          {pages.filter((p) => p.text?.trim()).length} of {pages.length} have text
        </div>
      </div>
    </div>
  );
}

function BookPreviewPage({ page, pageIndex, onEdit }: { page: PageDTO; pageIndex: number; onEdit: () => void }) {
  const { data: fileUrl } = useFileUrl(page.imageUrl || '');
  const src = page.imageUrl?.startsWith('data:') ? page.imageUrl : fileUrl;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border-2 border-cream-200 bg-white shadow-sm transition-all hover:shadow-boho hover:border-terracotta-200"
      onClick={onEdit}
    >
      {/* Illustration area */}
      <div className="relative aspect-square bg-cream-50">
        {src ? (
          <img src={src} alt={`Page ${pageIndex + 1}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-cream-300" />
              <p className="mt-2 text-xs text-cream-400">No illustration</p>
            </div>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-cream-900/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cream-900 shadow-lg">
            Edit Page
          </span>
        </div>
        {/* Page number badge */}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-cream-900/70 text-xs font-bold text-white">
          {pageIndex + 1}
        </span>
      </div>

      {/* Text preview area */}
      <div className="border-t border-cream-100 p-3">
        <p className="line-clamp-3 font-serif text-xs leading-relaxed text-cream-700">
          {page.text || <span className="italic text-cream-400">No text yet</span>}
        </p>
      </div>
    </div>
  );
}
