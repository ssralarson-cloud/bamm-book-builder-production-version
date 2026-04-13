import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGenerateImagePrompt } from "../hooks/useQueries";

interface AIPromptSuggestionProps {
  projectId: string;
  pageText: string;
  projectContext: string;
  onGenerateImage: (file: File) => void;
  isUploading: boolean;
}

export function AIPromptSuggestion({
  projectId,
  pageText,
  projectContext,
  onGenerateImage: _onGenerateImage,
  isUploading,
}: AIPromptSuggestionProps) {
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [adjustedPrompt, setAdjustedPrompt] = useState<string>("");
  const [showSuggestion, setShowSuggestion] = useState(false);

  const { mutate: generatePrompt, isPending: isGenerating } =
    useGenerateImagePrompt();

  const handleSuggestPrompt = () => {
    if (!pageText.trim()) {
      toast.error("Please enter some text for this page first");
      return;
    }

    console.log(
      "[AIPromptSuggestion] Requesting AI prompt suggestion for text:",
      `${pageText.substring(0, 50)}...`,
    );

    generatePrompt(
      { projectId, pageText, projectContext },
      {
        onSuccess: (suggestion) => {
          console.log(
            "[AIPromptSuggestion] AI suggestion received:",
            suggestion,
          );

          setAiSuggestion(suggestion);
          setAdjustedPrompt(suggestion);
          setShowSuggestion(true);

          toast.success("AI prompt suggestion generated!", {
            description:
              "Review and adjust the prompt before generating an illustration.",
            duration: 4000,
          });
        },
        onError: (error: any) => {
          console.error("[AIPromptSuggestion] Error generating prompt:", error);

          if (error.message.includes("rate limit")) {
            toast.error("Rate limit reached", {
              description:
                "Please wait a moment before requesting another suggestion.",
              duration: 5000,
            });
          } else {
            toast.error("Failed to generate prompt suggestion", {
              description: error.message || "Please try again later.",
              duration: 5000,
            });
          }
        },
      },
    );
  };

  const handleGenerateIllustration = () => {
    if (!adjustedPrompt.trim()) {
      toast.error("Please enter or adjust the prompt first");
      return;
    }

    // For now, show a message that this would trigger image generation
    // In a full implementation, this would call IC Panda's image generation API
    toast.info("Image generation coming soon", {
      description:
        "This feature will generate illustrations using IC Panda AI. For now, please upload an image manually.",
      duration: 6000,
    });

    console.log(
      "[AIPromptSuggestion] Would generate image with prompt:",
      adjustedPrompt,
    );
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/ai-prompt-suggestion-icon-transparent.dim_64x64.png"
            alt="AI"
            className="h-6 w-6"
          />
          <CardTitle className="text-lg">AI Illustration Assistant</CardTitle>
        </div>
        <CardDescription>
          Powered by IC Panda - Get AI-generated prompt suggestions for your
          page illustrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showSuggestion ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src="/assets/generated/ic-panda-mascot-boho-transparent.dim_200x200.png"
              alt="IC Panda"
              className="h-24 w-24 opacity-80"
            />
            <Button
              onClick={handleSuggestPrompt}
              disabled={isGenerating || !pageText.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Suggestion...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Suggest Illustration Prompt
                </>
              )}
            </Button>
            {!pageText.trim() && (
              <p className="text-center text-xs text-muted-foreground">
                Add text to your page to get AI-powered illustration suggestions
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-sm">
                AI has analyzed your page text and generated a visual prompt
                suggestion below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <img
                  src="/assets/generated/ai-brain-creative-icon-transparent.dim_64x64.png"
                  alt=""
                  className="h-4 w-4"
                />
                AI-Generated Suggestion
              </Label>
              <Textarea
                value={aiSuggestion}
                readOnly
                className="min-h-[80px] bg-muted/50 font-serif text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustedPrompt">Adjust Prompt (Optional)</Label>
              <Textarea
                id="adjustedPrompt"
                value={adjustedPrompt}
                onChange={(e) => setAdjustedPrompt(e.target.value)}
                className="min-h-[100px] font-serif"
                placeholder="Refine the AI suggestion to match your vision..."
              />
              <p className="text-xs text-muted-foreground">
                Edit the prompt to add specific details, style preferences, or
                artistic direction
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateIllustration}
                disabled={isUploading || !adjustedPrompt.trim()}
                className="flex-1"
              >
                <img
                  src="/assets/generated/generate-illustration-icon-transparent.dim_64x64.png"
                  alt=""
                  className="mr-2 h-4 w-4"
                />
                Generate Illustration
              </Button>
              <Button
                variant="outline"
                onClick={handleSuggestPrompt}
                disabled={isGenerating}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                New Suggestion
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Illustration generation powered by IC Panda AI on the Internet
              Computer
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
