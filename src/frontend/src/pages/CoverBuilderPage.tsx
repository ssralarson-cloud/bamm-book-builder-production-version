import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Ruler, Save, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { KDPComplianceBadge } from "../components/KDPComplianceBadge";
import { KDPEducationalPanel } from "../components/KDPEducationalPanel";
import { KDPProgressIndicator } from "../components/KDPProgressIndicator";
import { PageCanvas } from "../components/PageCanvas";
import type { TrimSizePreset } from "../components/SafeZoneOverlay";
import {
  useAddImage,
  useKDPValidation,
  useProject,
  useUpdateProject,
} from "../hooks/useQueries";
import type { ProjectDTO } from "../lib/exportUtils";

const TRIM_SIZE = 8.5;
const BLEED = 0.125;

// Helper function to get aspect ratio class based on trim size
function _aspectClassForTrimSize(trimSize: TrimSizePreset): string {
  switch (trimSize) {
    case "8.5x8.5":
      return "aspect-[1/1]";
    case "8x10":
      return "aspect-[4/5]";
    case "10x8":
      return "aspect-[5/4]";
    default:
      return "aspect-square";
  }
}

/**
 * Helper function to validate cover image for Amazon KDP print requirements.
 * Computes effective DPI from image pixel dimensions (width/8.75 and height/8.75).
 * Returns a soft warning if below 300 DPI but does NOT block upload.
 * 300 DPI is treated as a recommendation, not a hard requirement.
 */
function validateCoverImageForKdp(
  width: number,
  height: number,
  coverType: "front" | "back",
): { warning?: string; dpi: number } {
  // For 8.5x8.5" format with 0.125" bleed on all sides
  const targetInches = TRIM_SIZE + BLEED * 2; // 8.75 inches
  const effectiveDpiWidth = width / targetInches;
  const effectiveDpiHeight = height / targetInches;
  const effectiveDpi = Math.min(effectiveDpiWidth, effectiveDpiHeight);

  console.log("[validateCoverImageForKdp] Cover type:", coverType);
  console.log(
    "[validateCoverImageForKdp] Image dimensions:",
    width,
    "x",
    height,
    "pixels",
  );
  console.log(
    "[validateCoverImageForKdp] Target size with bleed:",
    targetInches,
    "x",
    targetInches,
    "inches",
  );
  console.log(
    "[validateCoverImageForKdp] Effective DPI (width):",
    Math.round(effectiveDpiWidth),
  );
  console.log(
    "[validateCoverImageForKdp] Effective DPI (height):",
    Math.round(effectiveDpiHeight),
  );
  console.log(
    "[validateCoverImageForKdp] Effective DPI (minimum):",
    Math.round(effectiveDpi),
  );

  // Return warning if below 300 DPI, but allow upload to continue
  if (effectiveDpi < 300) {
    const warningMessage = `⚠️ This image is approximately ${Math.round(effectiveDpi)} DPI at 8.75×8.75 inches. Amazon recommends 300 DPI for best print quality, but you can still use it.`;
    console.warn("[validateCoverImageForKdp] DPI Warning:", warningMessage);
    return {
      warning: warningMessage,
      dpi: effectiveDpi,
    };
  }

  console.log(
    "[validateCoverImageForKdp] ✓ Image meets 300 DPI recommendation",
  );
  return { dpi: effectiveDpi };
}

export default function CoverBuilderPage() {
  const { projectId } = useParams({ from: "/project/$projectId/cover" });
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { data: validation } = useKDPValidation(projectId);
  const { mutate: updateProject, isPending: isSaving } = useUpdateProject();
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: addImage } = useAddImage();

  const [localProject, setLocalProject] = useState<ProjectDTO | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [dpiWarning, setDpiWarning] = useState<{
    front?: string;
    back?: string;
  }>({});
  const [coverImageUrls, setCoverImageUrls] = useState<{
    front?: string;
    back?: string;
  }>({});

  useEffect(() => {
    if (project) {
      const updatedProject: ProjectDTO = {
        ...project,
        cover: {
          ...project.cover,
          dimensions: { width: TRIM_SIZE, height: TRIM_SIZE },
          bleed: { top: BLEED, bottom: BLEED, left: BLEED, right: BLEED },
          spine: {
            ...project.cover.spine,
            width: validation?.spineWidth || project.cover.spine.width,
          },
        },
      };
      setLocalProject(updatedProject);
    }
  }, [project, validation]);

  const handleSave = () => {
    if (!localProject) return;

    updateProject(localProject, {
      onSuccess: () => {
        toast.success("Cover saved successfully with Amazon KDP compliance!");
      },
      onError: () => {
        toast.error("Failed to save cover");
      },
    });
  };

  const handleImageUpload = async (file: File, type: "front" | "back") => {
    if (!localProject) return;

    try {
      console.log("[CoverBuilderPage] ═══════════════════════════════════════");
      console.log("[CoverBuilderPage] Starting cover image upload");
      console.log("[CoverBuilderPage] Cover type:", type);
      console.log("[CoverBuilderPage] File name:", file.name);
      console.log("[CoverBuilderPage] File size:", file.size, "bytes");
      console.log("[CoverBuilderPage] File type:", file.type);

      const imagePath = `projects/${projectId}/cover/${type}/${file.name}`;
      console.log("[CoverBuilderPage] Upload path:", imagePath);

      // Load image to get dimensions and validate
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      console.log("[CoverBuilderPage] Created object URL:", imageUrl);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("[CoverBuilderPage] ✓ Image loaded successfully");
          console.log(
            "[CoverBuilderPage] Image dimensions:",
            img.naturalWidth,
            "x",
            img.naturalHeight,
            "pixels",
          );
          resolve();
        };
        img.onerror = (error) => {
          console.error("[CoverBuilderPage] ✗ Image load error:", error);
          reject(
            new Error(
              "Failed to load image file. The file may be corrupted or in an unsupported format.",
            ),
          );
        };
        img.src = imageUrl;
      });

      // Validate image and compute effective DPI
      const validation = validateCoverImageForKdp(
        img.naturalWidth,
        img.naturalHeight,
        type,
      );
      const effectiveDpi = validation.dpi;

      console.log(
        "[CoverBuilderPage] Computed effective DPI:",
        Math.round(effectiveDpi),
      );

      // Display DPI warning if below 300, but continue with upload
      if (validation.warning) {
        console.warn("[CoverBuilderPage] DPI Warning:", validation.warning);
        setDpiWarning((prev) => ({ ...prev, [type]: validation.warning }));
        toast.warning(validation.warning, { duration: 6000 });
      } else {
        console.log("[CoverBuilderPage] ✓ Image meets 300 DPI recommendation");
        setDpiWarning((prev) => ({ ...prev, [type]: undefined }));
      }

      // Clean up object URL
      URL.revokeObjectURL(imageUrl);
      console.log("[CoverBuilderPage] Object URL revoked");

      // Upload file to blob storage
      console.log("[CoverBuilderPage] Uploading file to blob storage...");
      const uploadResult = await uploadFile(imagePath, file);
      console.log("[CoverBuilderPage] ✓ File uploaded successfully");
      console.log("[CoverBuilderPage] Upload result:", uploadResult);

      // Get the file URL from upload result (property is 'url', not 'fileUrl')
      const uploadedUrl = uploadResult.url;
      console.log("[CoverBuilderPage] Uploaded file URL:", uploadedUrl);

      // Register image with backend
      console.log("[CoverBuilderPage] Registering image with backend...");
      await new Promise<string>((resolve, reject) => {
        addImage(
          { projectId, path: imagePath, dpi: effectiveDpi },
          {
            onSuccess: (id) => {
              console.log("[CoverBuilderPage] ✓ Image registered successfully");
              console.log("[CoverBuilderPage] Image ID:", id);
              resolve(id);
            },
            onError: (error) => {
              console.error(
                "[CoverBuilderPage] ✗ Image registration error:",
                error,
              );
              reject(error);
            },
          },
        );
      });

      // Update local project state with imageUrl (path)
      const newCover = { ...localProject.cover };
      if (type === "front") {
        newCover.front = { ...newCover.front, imageUrl: imagePath };
      } else {
        newCover.back = { ...newCover.back, imageUrl: imagePath };
      }

      setLocalProject({
        ...localProject,
        cover: newCover,
        updatedAt: Date.now(),
      });

      // Update cover preview image URL immediately
      setCoverImageUrls((prev) => ({ ...prev, [type]: uploadedUrl }));
      console.log(
        "[CoverBuilderPage] ✓ Cover preview updated with URL:",
        uploadedUrl,
      );

      // Show success message
      if (!validation.warning) {
        toast.success(
          `${type === "front" ? "Front" : "Back"} cover uploaded successfully with print-ready resolution (${Math.round(effectiveDpi)} DPI)!`,
        );
      }

      console.log("[CoverBuilderPage] ═══════════════════════════════════════");
      console.log("[CoverBuilderPage] ✓ Cover upload completed successfully");
      console.log("[CoverBuilderPage] ═══════════════════════════════════════");
    } catch (error: any) {
      console.error(
        "[CoverBuilderPage] ═══════════════════════════════════════",
      );
      console.error("[CoverBuilderPage] ✗ Cover image upload error:", error);
      console.error("[CoverBuilderPage] Error message:", error.message);
      console.error("[CoverBuilderPage] Error stack:", error.stack);
      console.error(
        "[CoverBuilderPage] ═══════════════════════════════════════",
      );

      // Only show error for true failures (broken files, network issues)
      toast.error(
        `Failed to upload image: ${error.message || "Unknown error"}`,
      );
    }
  };

  const handleTextChange = (type: "front" | "back", text: string) => {
    if (!localProject) return;
    const newCover = { ...localProject.cover };
    if (type === "front") {
      newCover.front = { ...newCover.front, text };
    } else {
      newCover.back = { ...newCover.back, text };
    }
    setLocalProject({
      ...localProject,
      cover: newCover,
      updatedAt: Date.now(),
    });
  };

  const handleSpineTextChange = (text: string) => {
    if (!localProject) return;
    setLocalProject({
      ...localProject,
      cover: {
        ...localProject.cover,
        spine: { ...localProject.cover.spine, text },
      },
      updatedAt: Date.now(),
    });
  };

  // Guard: Show loading state while fetching or if project is null
  if (isLoading || !project || !localProject) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const spineWidth = validation?.spineWidth || localProject.cover.spine.width;
  const totalCoverWidth = TRIM_SIZE * 2 + spineWidth + BLEED * 2;
  const totalCoverHeight = TRIM_SIZE + BLEED * 2;

  const progressSteps = [
    {
      label: "Front cover image",
      completed: !!localProject.cover.front.imageUrl,
    },
    {
      label: "Back cover image",
      completed: !!localProject.cover.back.imageUrl,
    },
    {
      label: "Spine text added",
      completed: localProject.cover.spine.text.length > 0,
    },
    { label: "Bleed configured", completed: true },
    {
      label: "Print validation passed",
      completed: validation?.isValid ?? false,
      hasIssue: validation?.isValid === false,
    },
  ];

  // Normalize bleed prop to boolean
  const bleedEnabled = Boolean(localProject.cover.bleed);

  // Determine trim size preset (currently hardcoded to 8.5x8.5)
  const trimSizePreset: TrimSizePreset = "8.5x8.5";

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({ to: "/project/$projectId", params: { projectId } })
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Cover Builder</h1>
              <KDPComplianceBadge
                isValid={validation?.isValid ?? null}
                errors={validation?.errors}
                warnings={validation?.warnings}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Design your Amazon KDP print-ready cover with automatic formatting
              (8.5×8.5" format)
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Cover"}
        </Button>
      </div>

      {/* Format Alert */}
      <Alert className="mb-6 border-primary bg-primary/5">
        <img
          src="/assets/generated/amazon-kdp-single-badge-boho-transparent.png"
          alt=""
          className="h-4 w-6"
        />
        <AlertTitle>Amazon KDP Print Compliance Active</AlertTitle>
        <AlertDescription>
          Your cover is automatically configured for Amazon KDP with 8.5×8.5"
          trim size, 0.125" bleed, and calculated spine width of{" "}
          {spineWidth.toFixed(3)}" based on {localProject.pages.length} pages.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cover Editor */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="front" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="front">Front Cover</TabsTrigger>
              <TabsTrigger value="back">Back Cover</TabsTrigger>
              <TabsTrigger value="spine">Spine</TabsTrigger>
            </TabsList>

            <TabsContent value="front" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Front Cover</CardTitle>
                  <CardDescription>
                    Upload an image and add text with automatic safe zone
                    positioning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CoverImageUpload
                    imageUrl={localProject.cover.front.imageUrl}
                    previewUrl={coverImageUrls.front}
                    onUpload={(file) => handleImageUpload(file, "front")}
                    isUploading={isUploading}
                    label="Front Cover Image"
                    showGuides={showGuides}
                    trimSize={trimSizePreset}
                    bleed={bleedEnabled}
                    dpiWarning={dpiWarning.front}
                  />
                  <div className="space-y-2">
                    <Label>Front Cover Text</Label>
                    <Textarea
                      value={localProject.cover.front.text}
                      onChange={(e) =>
                        handleTextChange("front", e.target.value)
                      }
                      placeholder="Enter title and subtitle..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text will be positioned within safe margins automatically
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="back" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Back Cover</CardTitle>
                  <CardDescription>
                    Upload an image and add text with automatic safe zone
                    positioning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CoverImageUpload
                    imageUrl={localProject.cover.back.imageUrl}
                    previewUrl={coverImageUrls.back}
                    onUpload={(file) => handleImageUpload(file, "back")}
                    isUploading={isUploading}
                    label="Back Cover Image"
                    showGuides={showGuides}
                    trimSize={trimSizePreset}
                    bleed={bleedEnabled}
                    dpiWarning={dpiWarning.back}
                  />
                  <div className="space-y-2">
                    <Label>Back Cover Text</Label>
                    <Textarea
                      value={localProject.cover.back.text}
                      onChange={(e) => handleTextChange("back", e.target.value)}
                      placeholder="Enter description, author bio, etc..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text will be positioned within safe margins automatically
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spine" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spine</CardTitle>
                  <CardDescription>
                    Configure the spine text (width is auto-calculated)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Ruler className="h-4 w-4" />
                    <AlertTitle>Auto-Calculated Spine Width</AlertTitle>
                    <AlertDescription>
                      Based on {localProject.pages.length} pages, your spine
                      width is {spineWidth.toFixed(3)} inches. This is
                      calculated automatically using Amazon KDP's standard
                      formula (0.002252" per page).
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>Spine Text</Label>
                    <Input
                      value={localProject.cover.spine.text}
                      onChange={(e) => handleSpineTextChange(e.target.value)}
                      placeholder="Book title"
                    />
                    <p className="text-xs text-muted-foreground">
                      {localProject.pages.length < 24
                        ? "Note: Spine text recommended for books with 24+ pages"
                        : "Keep text short and centered for best results"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Indicator */}
          <KDPProgressIndicator steps={progressSteps} title="Cover Readiness" />

          {/* Cover Specifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Amazon KDP Cover Specs</CardTitle>
                  <CardDescription>
                    Standard 8.5×8.5" square format
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-guides" className="text-xs">
                    Show Guides
                  </Label>
                  <Switch
                    id="show-guides"
                    checked={showGuides}
                    onCheckedChange={setShowGuides}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="text-sm font-medium">Trim Size:</span>
                  <Badge variant="secondary">
                    {TRIM_SIZE}" × {TRIM_SIZE}"
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="text-sm font-medium">Bleed:</span>
                  <Badge variant="secondary">{BLEED}" all sides</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="text-sm font-medium">Spine Width:</span>
                  <Badge variant="secondary">{spineWidth.toFixed(3)}"</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="text-sm font-medium">
                    Total Cover Width:
                  </span>
                  <Badge variant="secondary">
                    {totalCoverWidth.toFixed(3)}"
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="text-sm font-medium">
                    Total Cover Height:
                  </span>
                  <Badge variant="secondary">
                    {totalCoverHeight.toFixed(3)}"
                  </Badge>
                </div>
              </div>

              {/* Cover Layout Preview */}
              <div className="relative aspect-[2/1] rounded-lg border bg-gradient-to-br from-primary/5 to-accent/5 p-2">
                {showGuides && (
                  <>
                    <div className="absolute inset-0 border-2 border-dashed border-kdp-bleed opacity-50" />
                    <div
                      className="absolute border-2 border-dashed border-kdp-trim opacity-50"
                      style={{
                        left: `${(BLEED / totalCoverWidth) * 100}%`,
                        right: `${(BLEED / totalCoverWidth) * 100}%`,
                        top: `${(BLEED / totalCoverHeight) * 100}%`,
                        bottom: `${(BLEED / totalCoverHeight) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute border-2 border-dashed border-kdp-safe opacity-50"
                      style={{
                        left: `${((BLEED + 0.5) / totalCoverWidth) * 100}%`,
                        right: `${((BLEED + 0.5) / totalCoverWidth) * 100}%`,
                        top: `${((BLEED + 0.5) / totalCoverHeight) * 100}%`,
                        bottom: `${((BLEED + 0.5) / totalCoverHeight) * 100}%`,
                      }}
                    />
                  </>
                )}

                <div className="flex h-full items-center justify-center gap-1">
                  <div className="flex h-full flex-1 items-center justify-center border-r border-dashed border-muted-foreground/30 bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground">
                      BACK
                    </span>
                  </div>
                  <div
                    className="flex h-full items-center justify-center bg-muted/40"
                    style={{
                      width: `${(spineWidth / totalCoverWidth) * 100}%`,
                    }}
                  >
                    <span className="text-[8px] font-semibold text-muted-foreground">
                      SPINE
                    </span>
                  </div>
                  <div className="flex h-full flex-1 items-center justify-center border-l border-dashed border-muted-foreground/30 bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground">
                      FRONT
                    </span>
                  </div>
                </div>
              </div>

              {showGuides && (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-dashed border-kdp-bleed" />
                    <span className="text-muted-foreground">
                      Bleed Zone (0.125")
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-dashed border-kdp-trim" />
                    <span className="text-muted-foreground">
                      Trim Line (8.5×8.5")
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-dashed border-kdp-safe" />
                    <span className="text-muted-foreground">
                      Safe Zone (0.5" margin)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Panel */}
          <KDPEducationalPanel />
        </div>
      </div>
    </div>
  );
}

function CoverImageUpload({
  imageUrl,
  previewUrl,
  onUpload,
  isUploading,
  label,
  showGuides,
  trimSize,
  bleed,
  dpiWarning,
}: {
  imageUrl?: string;
  previewUrl?: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
  label: string;
  showGuides: boolean;
  trimSize: TrimSizePreset;
  bleed: boolean;
  dpiWarning?: string;
}) {
  const { data: fileUrl } = useFileUrl(imageUrl || "");

  // Use previewUrl if available (immediately after upload), otherwise use fileUrl from storage
  const coverImageUrl = useMemo(
    () => previewUrl || fileUrl,
    [previewUrl, fileUrl],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {coverImageUrl ? (
          <PageCanvas trimSize={trimSize} bleed={bleed} showGuides={showGuides}>
            <img
              src={coverImageUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          </PageCanvas>
        ) : (
          <PageCanvas trimSize={trimSize} bleed={bleed} showGuides={showGuides}>
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No image uploaded
                </p>
                <p className="text-xs text-muted-foreground">
                  300 DPI recommended
                </p>
              </div>
            </div>
          </PageCanvas>
        )}
        {/* DPI Warning Display - positioned near preview */}
        {dpiWarning && coverImageUrl && (
          <Alert className="mt-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
              {dpiWarning}
            </AlertDescription>
          </Alert>
        )}
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <p className="text-xs text-muted-foreground">
        Recommended: 2625×2625 pixels or higher for 300 DPI at 8.75×8.75" (8.5"
        + 0.125" bleed on each side). Lower resolution images will show a
        warning but can still be used.
      </p>
    </div>
  );
}
