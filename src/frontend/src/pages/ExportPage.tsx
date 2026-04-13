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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileDown,
  Info,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StorageClient } from "../blob-storage/StorageClient";
import { KDPComplianceBadge } from "../components/KDPComplianceBadge";
import { KDPProgressIndicator } from "../components/KDPProgressIndicator";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActorExtended";
import { useKDPValidation, useProject } from "../hooks/useQueries";
import { exportProjectAsJSON } from "../lib/exportUtils";
import { generateCoverPDF, generateInteriorPDF } from "../lib/pdfExport";

export default function ExportPage() {
  const { projectId } = useParams({ from: "/project/$projectId/export" });
  const navigate = useNavigate();
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: validation, isLoading: isLoadingValidation } =
    useKDPValidation(projectId);
  const { actor } = useActor();
  const [isExporting, setIsExporting] = useState(false);

  const buildStorageClient = async () => {
    if (!actor) throw new Error("Backend not available");
    const config = await loadConfig();
    const agent = new HttpAgent({ host: config.backend_host });
    if (config.backend_host?.includes("localhost")) {
      await agent.fetchRootKey().catch(console.warn);
    }
    return new StorageClient(
      actor,
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
  };

  const handleExportInterior = async () => {
    if (!project || !validation?.isValid || !actor || isExporting) {
      if (!validation?.isValid)
        toast.error("Please fix all validation errors before exporting");
      return;
    }
    const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}_Interior_KDP.pdf`;
    setIsExporting(true);
    toast.info("Generating interior PDF…", {
      id: "pdf-interior",
      duration: Number.POSITIVE_INFINITY,
    });
    try {
      const storageClient = await buildStorageClient();
      const resolveImageUrl = (path: string) =>
        storageClient.getDirectURL(path);
      const pdfBlob = await generateInteriorPDF(
        project.pages,
        resolveImageUrl,
        (pct) =>
          toast.info(`Generating interior PDF… ${pct}%`, {
            id: "pdf-interior",
            duration: Number.POSITIVE_INFINITY,
          }),
      );
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Interior PDF exported: ${filename}`, {
        id: "pdf-interior",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Interior PDF export failed: ${msg}`, { id: "pdf-interior" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCover = async () => {
    if (!project || !validation?.isValid || !actor || isExporting) {
      if (!validation?.isValid)
        toast.error("Please fix all validation errors before exporting");
      return;
    }
    const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}_Cover_KDP.pdf`;
    setIsExporting(true);
    toast.info("Generating cover PDF…", {
      id: "pdf-cover",
      duration: Number.POSITIVE_INFINITY,
    });
    try {
      const storageClient = await buildStorageClient();
      const resolveImageUrl = (path: string) =>
        storageClient.getDirectURL(path);
      const pdfBlob = await generateCoverPDF(
        project.cover,
        validation.spineWidth,
        resolveImageUrl,
        (pct) =>
          toast.info(`Generating cover PDF… ${pct}%`, {
            id: "pdf-cover",
            duration: Number.POSITIVE_INFINITY,
          }),
      );
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Cover PDF exported: ${filename}`, { id: "pdf-cover" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Cover PDF export failed: ${msg}`, { id: "pdf-cover" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!project) {
      toast.error("Project data not available");
      return;
    }

    try {
      const jsonString = exportProjectAsJSON(project, validation || null);

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}_Export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Project data exported successfully!", {
        description: `JSON file size: ${(jsonString.length / 1024).toFixed(2)} KB`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[ExportPage] JSON export failed:", error);
      toast.error(`Failed to export JSON: ${msg}`);
    }
  };

  if (isLoadingProject || isLoadingValidation || !project || !validation) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const progressSteps = [
    {
      label: "Story completed",
      completed: project.story.length > 0 && project.pages.length > 0,
    },
    {
      label: "Images uploaded",
      completed: project.pages.some((p) => p.imageUrl),
    },
    {
      label: "Cover designed",
      completed: !!(
        project.cover.front.imageUrl || project.cover.back.imageUrl
      ),
    },
    {
      label: "All validations passed",
      completed: validation.isValid,
      hasIssue: !validation.isValid,
    },
    { label: "Ready for export", completed: validation.isValid },
  ];

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
              <h1 className="text-3xl font-bold">Export for Amazon KDP</h1>
              <KDPComplianceBadge
                isValid={validation.isValid}
                errors={validation.errors}
                warnings={validation.warnings}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Generate print-ready PDFs for Amazon KDP
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Options */}
        <div className="space-y-6 lg:col-span-2">
          {/* Validation Status */}
          {validation.isValid ? (
            <Alert className="border-kdp-success bg-kdp-success/10">
              <CheckCircle2 className="h-4 w-4 text-kdp-success" />
              <AlertTitle className="text-kdp-success">
                Amazon KDP Export Ready
              </AlertTitle>
              <AlertDescription className="text-kdp-success/90">
                Your project meets all Amazon KDP requirements. You can now
                generate your print-ready PDFs with confidence.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Requirements Not Met</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validation.errors.map((error, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                Quality Warnings
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validation.warnings.map((warning, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static list
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  These won't prevent export, but may affect print quality.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Print Specifications Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img
                  src="/assets/generated/amazon-kdp-only-badge-boho-transparent.png"
                  alt=""
                  className="h-5 w-5"
                />
                Amazon KDP Print Format Specifications
              </CardTitle>
              <CardDescription>
                Your book is configured with Amazon KDP print-compliant settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Trim Size
                  </h4>
                  <p className="text-2xl font-bold text-primary">
                    {validation.trimSize.width}" × {validation.trimSize.height}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Square children's book format
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Bleed
                  </h4>
                  <p className="text-2xl font-bold text-primary">
                    {validation.bleed.top}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All sides (Amazon KDP standard)
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Safe Margins
                  </h4>
                  <p className="text-2xl font-bold text-primary">
                    {validation.margin.top}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Minimum safe area
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Spine Width
                  </h4>
                  <p className="text-2xl font-bold text-primary">
                    {validation.spineWidth.toFixed(3)}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on {project.pages.length} pages
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Format Details:</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Interior Pages:
                    </span>
                    <Badge variant="secondary">{project.pages.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cover Total Width:
                    </span>
                    <Badge variant="secondary">
                      {(
                        validation.trimSize.width * 2 +
                        validation.spineWidth +
                        (validation.bleed.left + validation.bleed.right)
                      ).toFixed(3)}
                      "
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cover Total Height:
                    </span>
                    <Badge variant="secondary">
                      {(
                        validation.trimSize.height +
                        validation.bleed.top +
                        validation.bleed.bottom
                      ).toFixed(3)}
                      "
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Resolution Requirement:
                    </span>
                    <Badge variant="secondary">300 DPI minimum</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color Space:</span>
                    <Badge variant="secondary">RGB (converts to CMYK)</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <Badge variant="secondary">Amazon KDP</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interior PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img
                  src="/assets/generated/export-pdf-icon-transparent.png"
                  alt=""
                  className="h-5 w-5"
                />
                Interior PDF
              </CardTitle>
              <CardDescription>
                Export the book's interior pages as a print-ready PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">Interior Specifications:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Pages: {project.pages.length}</li>
                  <li>
                    • Trim Size: {validation.trimSize.width}" ×{" "}
                    {validation.trimSize.height}"
                  </li>
                  <li>• Bleed: {validation.bleed.top}" on all sides</li>
                  <li>• Safe Margins: {validation.margin.top}" minimum</li>
                  <li>
                    • Font: {project.settings.font} at{" "}
                    {project.settings.fontSize}pt
                  </li>
                  <li>• Line Spacing: {project.settings.lineSpacing}</li>
                  <li>• Embedded fonts and flattened transparency</li>
                  <li>• Compatible: Amazon KDP</li>
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleExportInterior}
                disabled={!validation.isValid || isExporting}
                data-ocid="export-interior-btn"
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? "Generating…" : "Export Interior PDF"}
              </Button>
              {!validation.isValid && (
                <p className="text-center text-xs text-muted-foreground">
                  Fix validation errors to enable export
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cover PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img
                  src="/assets/generated/cover-builder-icon-transparent.png"
                  alt=""
                  className="h-5 w-5"
                />
                Cover PDF
              </CardTitle>
              <CardDescription>
                Export the book's cover as a print-ready PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">Cover Specifications:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • Front Cover: {validation.trimSize.width}" ×{" "}
                    {validation.trimSize.height}"
                  </li>
                  <li>
                    • Spine Width: {validation.spineWidth.toFixed(3)}" (
                    {project.pages.length} pages)
                  </li>
                  <li>
                    • Back Cover: {validation.trimSize.width}" ×{" "}
                    {validation.trimSize.height}"
                  </li>
                  <li>
                    • Total Width:{" "}
                    {(
                      validation.trimSize.width * 2 +
                      validation.spineWidth +
                      (validation.bleed.left + validation.bleed.right)
                    ).toFixed(3)}
                    "
                  </li>
                  <li>
                    • Total Height:{" "}
                    {(
                      validation.trimSize.height +
                      validation.bleed.top +
                      validation.bleed.bottom
                    ).toFixed(3)}
                    "
                  </li>
                  <li>• Bleed: {validation.bleed.top}" on all sides</li>
                  <li>
                    • Front Image:{" "}
                    {project.cover.front.imageUrl ? "✓ Uploaded" : "✗ Missing"}
                  </li>
                  <li>
                    • Back Image:{" "}
                    {project.cover.back.imageUrl ? "✓ Uploaded" : "✗ Missing"}
                  </li>
                  <li>• Trim marks and safe zone guides included</li>
                  <li>• Compatible: Amazon KDP</li>
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleExportCover}
                disabled={!validation.isValid || isExporting}
                data-ocid="export-cover-btn"
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? "Generating…" : "Export Cover PDF"}
              </Button>
              {!validation.isValid && (
                <p className="text-center text-xs text-muted-foreground">
                  Fix validation errors to enable export
                </p>
              )}
            </CardContent>
          </Card>

          {/* JSON Export */}
          <Card>
            <CardHeader>
              <CardTitle>Export Project Data (JSON)</CardTitle>
              <CardDescription>
                Download project data for backup or external processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleExportJSON}
                data-ocid="export-json-btn"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Indicator */}
          <KDPProgressIndicator
            steps={progressSteps}
            title="Export Readiness"
          />

          {/* Export Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Amazon KDP Upload Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold text-sm">
                  Before Exporting:
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li
                    className={
                      project.pages.length > 0 ? "text-kdp-success" : ""
                    }
                  >
                    {project.pages.length > 0 ? "✓" : "○"} Complete all pages
                  </li>
                  <li
                    className={
                      project.pages.some((p) => p.imageUrl)
                        ? "text-kdp-success"
                        : ""
                    }
                  >
                    {project.pages.some((p) => p.imageUrl) ? "✓" : "○"} Add
                    images to pages
                  </li>
                  <li
                    className={
                      project.cover.front.imageUrl ||
                      project.cover.back.imageUrl
                        ? "text-kdp-success"
                        : ""
                    }
                  >
                    {project.cover.front.imageUrl || project.cover.back.imageUrl
                      ? "✓"
                      : "○"}{" "}
                    Design your cover
                  </li>
                  <li className="text-kdp-success">
                    ✓ Print format configured
                  </li>
                  <li className={validation.isValid ? "text-kdp-success" : ""}>
                    {validation.isValid ? "✓" : "○"} Pass all validations
                  </li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 font-semibold text-sm">After Exporting:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Review PDFs carefully</li>
                  <li>2. Check image quality (300 DPI)</li>
                  <li>3. Verify text is within safe margins</li>
                  <li>4. Ensure bleed extends properly</li>
                  <li>5. Upload to Amazon KDP</li>
                  <li>6. Order a proof copy</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 font-semibold text-sm">
                  Amazon KDP Resources:
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href="https://kdp.amazon.com/en_US/help/topic/G201834180"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Amazon KDP Print Specifications
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href="https://kdp.amazon.com/en_US/help/topic/G201953020"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      KDP Cover Calculator
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Naming */}
          <Card>
            <CardHeader>
              <CardTitle>Amazon KDP File Naming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-1 font-mono text-xs font-semibold">
                  Interior:
                </p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {project.title.replace(/[^a-z0-9]/gi, "_")}_Interior_KDP.pdf
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-1 font-mono text-xs font-semibold">Cover:</p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {project.title.replace(/[^a-z0-9]/gi, "_")}_Cover_KDP.pdf
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
