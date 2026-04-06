import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, BookOpen, FileDown, Wand2, Sparkles } from 'lucide-react';
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
import { KDPComplianceBadge } from '../components/KDPComplianceBadge';
import { KDPProgressIndicator } from '../components/KDPProgressIndicator';
import { KDPEducationalPanel } from '../components/KDPEducationalPanel';
import { PageCanvas } from '../components/PageCanvas';
import { AIPromptSuggestion } from '../components/AIPromptSuggestion';
import { AIIllustrationsPanel } from '../components/AIIllustrationsPanel';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useActor } from '../hooks/useActorExtended';
import type { ProjectDTO, PageDTO } from '../lib/exportUtils';

/**
 * Helper function to validate image for Amazon KDP print requirements.
 * Returns a warning message if DPI is below 300, but does NOT block upload.
 * 300 DPI is treated as a recommendation, not a requirement.
 */
function validateImageForKdp(width: number, height: number): { warning?: string } {
  // Compute effective DPI based on pixel dimensions for 8.5×8.5" trim size
  const effectiveDpiWidth = width / 8.5;
  const effectiveDpiHeight = height / 8.5;
  const effectiveDpi = Math.min(effectiveDpiWidth, effectiveDpiHeight);
  
  console.log('[validateImageForKdp] Image dimensions:', width, 'x', height);
  console.log('[validateImageForKdp] Effective DPI:', Math.round(effectiveDpi));
  
  // Return warning if below 300 DPI, but allow upload to continue
  if (effectiveDpi < 300) {
    return {
      warning: `⚠️ This image is approximately ${Math.round(effectiveDpi)} DPI at 8.5×8.5". Amazon recommends 300 DPI, but you can still use it.`
    };
  }
  
  return {};
}

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
  const { generateGrokImagesForProject, isGenerating: isGeneratingGrok, error: grokError } = useGrokImagesForProject();

  const [localProject, setLocalProject] = useState<ProjectDTO | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [autoSplitCount, setAutoSplitCount] = useState(10);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('[ProjectEditorPage] User not authenticated, redirecting to home');
      toast.error('Please log in to edit projects');
      navigate({ to: '/' });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (project) {
      console.log('[ProjectEditorPage] Project loaded:', project.title, 'with', project.pages.length, 'pages');
      setLocalProject(project);
    }
  }, [project]);

  const handleSave = () => {
    if (!localProject) return;
    
    if (!isInitialized || !isAuthenticated) {
      toast.error('Please wait for session to initialize');
      return;
    }

    console.log('[ProjectEditorPage] Saving project:', localProject.title);
    updateProject(localProject, {
      onSuccess: () => {
        toast.success('Project saved successfully!');
      },
      onError: (error: any) => {
        console.error('[ProjectEditorPage] Save error:', error);
        toast.error(error.message || 'Failed to save project');
      },
    });
  };

  const handleStoryChange = (story: string) => {
    if (!localProject) return;
    setLocalProject({ ...localProject, story, updatedAt: Date.now() });
  };

  const handleAutoSplit = () => {
    if (!localProject || !localProject.story.trim()) {
      toast.error('Please enter a story first');
      return;
    }

    console.log('[ProjectEditorPage] Auto-splitting story into', autoSplitCount, 'pages');
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
    toast.success(`Story split into ${newPages.length} pages with print-safe margins`);
  };

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
    const renumberedPages = newPages.map((page, i) => ({ ...page, pageNumber: i + 1 }));
    setLocalProject({ ...localProject, pages: renumberedPages, updatedAt: Date.now() });
    if (selectedPageIndex >= renumberedPages.length) {
      setSelectedPageIndex(Math.max(0, renumberedPages.length - 1));
    }
  };

  const handleImageUpload = async (file: File, pageIndex: number) => {
    if (!localProject) return;
    
    if (!isInitialized || !isAuthenticated) {
      toast.error('Please wait for session to initialize');
      return;
    }

    console.log('[ProjectEditorPage] Uploading image for page', pageIndex, ':', file.name);

    try {
      const imagePath = `projects/${projectId}/pages/${pageIndex}/${file.name}`;
      
      // Load image to get dimensions
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image file. The file may be corrupted or in an unsupported format.'));
        img.src = imageUrl;
      });
      
      // Validate image and get warning if any (non-blocking)
      const validation = validateImageForKdp(img.naturalWidth, img.naturalHeight);
      
      // Compute effective DPI for backend storage
      const effectiveDpi = Math.min(img.naturalWidth / 8.5, img.naturalHeight / 8.5);
      
      URL.revokeObjectURL(imageUrl);
      
      console.log('[ProjectEditorPage] Uploading file to blob storage:', imagePath);
      // Upload file to blob storage
      const uploadResult = await uploadFile(imagePath, file);
      console.log('[ProjectEditorPage] File uploaded successfully:', uploadResult);
      
      // Register image with backend (backend method: addImage)
      console.log('[ProjectEditorPage] Registering image with backend via addImage method');
      const imageId = await new Promise<string>((resolve, reject) => {
        addImage(
          { projectId, path: imagePath, dpi: effectiveDpi },
          {
            onSuccess: (id) => {
              console.log('[ProjectEditorPage] Image registered successfully with ID:', id);
              resolve(id);
            },
            onError: (error) => {
              console.error('[ProjectEditorPage] Image registration error:', error);
              reject(error);
            },
          }
        );
      });
      
      // Update local project state with imageUrl (path)
      const newPages = [...localProject.pages];
      newPages[pageIndex] = { ...newPages[pageIndex], imageUrl: imagePath };
      setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
      
      // Show non-blocking warning or success message
      if (validation.warning) {
        toast.warning(validation.warning, { duration: 6000 });
      } else {
        toast.success(`Image uploaded successfully with print-ready resolution (${Math.round(effectiveDpi)} DPI)!`);
      }
    } catch (error: any) {
      console.error('[ProjectEditorPage] Image upload error:', error);
      // Only show error for true failures (broken files, network issues)
      toast.error(error.message || 'Failed to upload image');
    }
  };

  const handleGenerateGrokImages = async () => {
    if (!localProject) return;
    
    if (!isInitialized || !isAuthenticated) {
      toast.error('Please wait for session to initialize');
      return;
    }

    console.log('[ProjectEditorPage] Starting Grok image generation');
    
    const result = await generateGrokImagesForProject(localProject);
    
    if (result.success) {
      toast.success(result.message, {
        description: result.generatedCount > 0 ? `${result.generatedCount} images generated` : undefined,
      });
    } else {
      toast.error(result.message, {
        description: 'Please ensure the Grok service is running on http://localhost:4001',
      });
    }
  };

  const handleInsertGeneratedImage = (imageUrl: string) => {
    if (!localProject) return;
    
    console.log('[ProjectEditorPage] Inserting generated image into page', selectedPageIndex);
    const newPages = [...localProject.pages];
    newPages[selectedPageIndex] = { ...newPages[selectedPageIndex], imageUrl };
    setLocalProject({ ...localProject, pages: newPages, updatedAt: Date.now() });
    
    toast.success('Image inserted into page!');
  };

  // Show loading state while initializing
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
    { label: 'Images uploaded', completed: localProject.pages.some(p => p.imageUrl) },
    { label: 'Cover designed', completed: !!(localProject.cover.front.imageUrl || localProject.cover.back.imageUrl) },
    { label: 'Print validation passed', completed: validation?.isValid ?? false, hasIssue: validation?.isValid === false },
  ];

  const unillustratedPagesCount = localProject.pages.filter(p => !p.imageUrl).length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{localProject.title}</h1>
              <KDPComplianceBadge 
                isValid={validation?.isValid ?? null}
                errors={validation?.errors}
                warnings={validation?.warnings}
              />
            </div>
            <p className="text-sm text-muted-foreground">Smart formatting with automatic Amazon KDP print compliance (8.5×8.5" format)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/project/$projectId/cover', params: { projectId } })}>
            <BookOpen className="mr-2 h-4 w-4" />
            Cover Builder
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/project/$projectId/export', params: { projectId } })}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isInitialized}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Format Info */}
      <Alert className="mb-6 border-primary bg-primary/5">
        <img 
          src="/assets/generated/trim-lines-icon-transparent.png" 
          alt="" 
          className="h-4 w-4"
        />
        <AlertTitle>Amazon KDP Print Format Active</AlertTitle>
        <AlertDescription>
          Your book uses the standard 8.5×8.5" square format with 0.125" bleed and 0.5" safe margins. Perfect for Amazon KDP printing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="story" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="story">Story Text</TabsTrigger>
              <TabsTrigger value="pages">Page Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Story Content</CardTitle>
                  <CardDescription>Write your story here, then use smart formatting to split into print-ready pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Once upon a time..."
                    value={localProject.story}
                    onChange={(e) => handleStoryChange(e.target.value)}
                    className="min-h-[400px] font-serif text-base"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pageCount">Pages:</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        min="1"
                        max="50"
                        value={autoSplitCount}
                        onChange={(e) => setAutoSplitCount(parseInt(e.target.value) || 10)}
                        className="w-20"
                      />
                    </div>
                    <Button onClick={handleAutoSplit}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Smart Auto-Split
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Smart formatting automatically applies print-safe margins and safe zones to all pages
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              {localProject.pages.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <img
                      src="/assets/generated/edit-page-icon-transparent.png"
                      alt="No pages"
                      className="mb-4 h-24 w-24 opacity-50"
                    />
                    <h3 className="mb-2 text-xl font-semibold">No pages yet</h3>
                    <p className="mb-4 text-muted-foreground">
                      Add your story and use smart formatting to split into pages, or create pages manually
                    </p>
                    <Button onClick={handleAddPage}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Page
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Grok Image Generation Card */}
                  {unillustratedPagesCount > 0 && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <img
                            src="/assets/generated/grok-ai-mascot-boho-transparent.dim_200x200.png"
                            alt="Grok AI"
                            className="h-12 w-12"
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">AI Image Generation with Grok</CardTitle>
                            <CardDescription>
                              {unillustratedPagesCount} {unillustratedPagesCount === 1 ? 'page needs' : 'pages need'} illustrations
                            </CardDescription>
                          </div>
                          <Button
                            onClick={handleGenerateGrokImages}
                            disabled={isGeneratingGrok || !isInitialized}
                            className="gap-2"
                          >
                            <img
                              src="/assets/generated/generate-grok-images-icon-transparent.dim_64x64.png"
                              alt=""
                              className="h-4 w-4"
                            />
                            {isGeneratingGrok ? 'Generating...' : 'Generate Images with Grok'}
                          </Button>
                        </div>
                      </CardHeader>
                      {grokError && (
                        <CardContent>
                          <Alert variant="destructive">
                            <AlertDescription>{grokError}</AlertDescription>
                          </Alert>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Page {selectedPageIndex + 1} of {localProject.pages.length}</CardTitle>
                          <CardDescription>Edit text and add images with automatic safe zone positioning</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddPage}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Page
                          </Button>
                          {localProject.pages.length > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePage(selectedPageIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Page Text (Auto-positioned in safe zone)</Label>
                        <Textarea
                          value={localProject.pages[selectedPageIndex]?.text || ''}
                          onChange={(e) => handlePageTextChange(selectedPageIndex, e.target.value)}
                          className="min-h-[200px] font-serif"
                          placeholder="Enter text for this page..."
                        />
                      </div>

                      <Separator />

                      {/* AI Prompt Suggestion Component */}
                      <AIPromptSuggestion
                        projectId={projectId}
                        pageText={localProject.pages[selectedPageIndex]?.text || ''}
                        projectContext={localProject.title}
                        onGenerateImage={(file) => handleImageUpload(file, selectedPageIndex)}
                        isUploading={isUploading}
                      />

                      <Separator />

                      <div className="space-y-2">
                        <Label>Page Image (Auto-fitted with bleed)</Label>
                        <PageImageUpload
                          pageIndex={selectedPageIndex}
                          imageUrl={localProject.pages[selectedPageIndex]?.imageUrl}
                          onUpload={(file) => handleImageUpload(file, selectedPageIndex)}
                          isUploading={isUploading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Indicator */}
          <KDPProgressIndicator steps={progressSteps} />

          {/* AI Illustrations Panel */}
          {localProject.pages.length > 0 && (
            <AIIllustrationsPanel
              projectId={projectId}
              currentPageText={localProject.pages[selectedPageIndex]?.text || ''}
              onInsertImage={handleInsertGeneratedImage}
            />
          )}

          {/* Page Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Pages</CardTitle>
              <CardDescription>{localProject.pages.length} pages</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {localProject.pages.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPageIndex(index)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedPageIndex === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold">Page {index + 1}</span>
                        {page.imageUrl && <ImageIcon className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {page.text || 'Empty page'}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Educational Panel */}
          <KDPEducationalPanel />
        </div>
      </div>
    </div>
  );
}

function PageImageUpload({
  pageIndex,
  imageUrl,
  onUpload,
  isUploading,
}: {
  pageIndex: number;
  imageUrl?: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const { data: fileUrl } = useFileUrl(imageUrl || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[PageImageUpload] File selected:', file.name);
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      {fileUrl ? (
        <PageCanvas trimSize="8.5x8.5" bleed={true} showGuides={true}>
          <img 
            src={fileUrl} 
            alt={`Page ${pageIndex + 1}`} 
            className="h-full w-full object-contain" 
          />
        </PageCanvas>
      ) : (
        <PageCanvas trimSize="8.5x8.5" bleed={true} showGuides={true}>
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No image uploaded</p>
              <p className="text-xs text-muted-foreground">300 DPI recommended</p>
            </div>
          </div>
        </PageCanvas>
      )}
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <p className="text-xs text-muted-foreground">
        Recommended: 2550×2550 pixels or higher for 300 DPI at 8.5×8.5". Lower resolution images will show a warning but can still be used.
      </p>
    </div>
  );
}
