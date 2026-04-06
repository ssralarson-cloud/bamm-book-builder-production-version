import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useGenerateGrokImage } from '../hooks/useGenerateGrokImage';
import { toast } from 'sonner';
import type { CarouselApi } from '@/components/ui/carousel';

interface AIIllustrationsPanelProps {
  projectId: string;
  currentPageText: string;
  onInsertImage: (imageUrl: string) => void;
}

export function AIIllustrationsPanel({ projectId, currentPageText, onInsertImage }: AIIllustrationsPanelProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  
  const { generateImage, isGenerating } = useGenerateGrokImage();

  // Listen to carousel selection changes
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const handleGenerateIllustration = async () => {
    if (!customPrompt.trim() && !currentPageText.trim()) {
      toast.error('Please enter a description or add text to the current page');
      return;
    }

    const prompt = customPrompt.trim() || currentPageText.trim();
    console.log('[AIIllustrationsPanel] Generating illustration with prompt:', prompt);

    try {
      const imageUrl = await generateImage(projectId, prompt);
      
      if (imageUrl) {
        setGeneratedImages(prev => [...prev, imageUrl]);
        setSelectedImageIndex(generatedImages.length);
        toast.success('Illustration generated successfully!');
      }
    } catch (error: any) {
      console.error('[AIIllustrationsPanel] Generation error:', error);
      toast.error(error.message || 'Failed to generate illustration');
    }
  };

  const handleInsertImage = () => {
    if (generatedImages.length === 0) {
      toast.error('No images to insert');
      return;
    }

    const imageUrl = generatedImages[selectedImageIndex];
    setUndoStack(prev => [...prev, imageUrl]);
    onInsertImage(imageUrl);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.error('Nothing to undo');
      return;
    }

    const lastImage = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    // Remove the last inserted image from the page
    onInsertImage('');
    toast.success('Image insertion undone');
  };

  const handleDragStart = (e: React.DragEvent, imageUrl: string) => {
    e.dataTransfer.setData('text/plain', imageUrl);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card className="relative z-[1001] overflow-visible" style={{ zIndex: 1001 }}>
      <CardHeader className="bg-[url('/assets/generated/linen-texture-background.dim_256x256.png')] bg-repeat">
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/ai-illustration-icon-boho-transparent.dim_64x64.png"
            alt="AI Illustrations"
            className="h-8 w-8"
          />
          <div>
            <CardTitle className="text-lg">AI Illustrations</CardTitle>
            <CardDescription>Generate custom images with Grok AI</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Custom Description Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-prompt" className="text-sm font-semibold">
            Image Description
          </Label>
          <Textarea
            id="custom-prompt"
            placeholder="Describe the illustration you want to generate... (or leave blank to use current page text)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[100px] resize-none bg-[url('/assets/generated/linen-texture-background.dim_256x256.png')] bg-repeat font-serif"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateIllustration}
          disabled={isGenerating}
          className="w-full gap-2 rounded-lg bg-[#4A2E1A] text-[#F5F1E8] shadow-boho transition-all hover:bg-[#3A1E0A] hover:shadow-boho-lg active:scale-95 disabled:opacity-50"
          style={{
            animation: isGenerating ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Illustration'}
        </Button>

        {/* Preview Carousel */}
        {generatedImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Generated Images</Label>
              <span className="text-xs text-muted-foreground">
                {selectedImageIndex + 1} of {generatedImages.length}
              </span>
            </div>
            
            <div className="relative rounded-lg border-2 border-border bg-muted/20 p-2">
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                className="w-full"
                setApi={setCarouselApi}
              >
                <CarouselContent>
                  {generatedImages.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                      <div
                        className="group relative aspect-square cursor-move overflow-hidden rounded-md border-2 border-border bg-background"
                        draggable
                        onDragStart={(e) => handleDragStart(e, imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated illustration ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <img
                            src="/assets/generated/drag-drop-cursor-boho-transparent.dim_32x32.png"
                            alt="Drag to insert"
                            className="h-8 w-8"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleInsertImage}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Insert into Page
              </Button>
              <Button
                onClick={handleUndo}
                variant="outline"
                disabled={undoStack.length === 0}
                className="gap-2"
              >
                <img
                  src="/assets/generated/undo-icon-boho-transparent.dim_32x32.png"
                  alt=""
                  className="h-4 w-4"
                />
                Undo
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Drag generated images directly onto the page canvas, or use the "Insert into Page" button. 
            Images are optimized for 8.5×8.5" print format.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
