import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileDown, CheckCircle2, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProject, useKDPValidation } from '../hooks/useQueries';
import { KDPComplianceBadge } from '../components/KDPComplianceBadge';
import { KDPProgressIndicator } from '../components/KDPProgressIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { exportProjectAsJSON } from '../lib/exportUtils';
import { generateInteriorPDF } from '../lib/pdfExport';
import { generateCoverPDF } from '../lib/coverPdfExport';

export default function ExportPage() {
  const { projectId } = useParams({ from: '/project/$projectId/export' });
  const navigate = useNavigate();
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: validation, isLoading: isLoadingValidation } = useKDPValidation(projectId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportInterior = async () => {
    if (!project || !validation?.isValid) {
      toast.error('Please fix all validation errors before exporting');
      return;
    }
    if (isExporting) return;

    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Interior_KDP.pdf`;
    setIsExporting(true);
    toast.info('Generating interior PDF...', { duration: Infinity, id: 'pdf-export' });

    try {
      const pdfBlob = await generateInteriorPDF(
        project.pages as any[],
        async (p) => p,
        (percent) => {
          toast.info(`Generating PDF... ${percent}%`, { id: 'pdf-export' });
        },
      );

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Interior PDF exported: ${filename}`, { id: 'pdf-export' });
    } catch (error: any) {
      console.error('[ExportPage] Interior PDF export failed:', error);
      toast.error(`PDF export failed: ${error.message}`, { id: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCover = async () => {
    if (!project || !validation?.isValid) {
      toast.error('Please fix all validation errors before exporting');
      return;
    }
    if (isExporting) return;

    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Cover_KDP.pdf`;
    setIsExporting(true);
    toast.info('Generating cover PDF...', { duration: Infinity, id: 'cover-export' });

    try {
      const frontImageUrl =
        Array.isArray(project.cover.front.imageUrl) && project.cover.front.imageUrl.length > 0
          ? project.cover.front.imageUrl[0]
          : typeof project.cover.front.imageUrl === 'string'
          ? project.cover.front.imageUrl
          : undefined;
      const backImageUrl =
        Array.isArray(project.cover.back.imageUrl) && project.cover.back.imageUrl.length > 0
          ? project.cover.back.imageUrl[0]
          : typeof project.cover.back.imageUrl === 'string'
          ? project.cover.back.imageUrl
          : undefined;

      const pdfBlob = await generateCoverPDF({
        frontImageUrl,
        backImageUrl,
        title: project.title,
        validation,
        onProgress: (percent) => {
          toast.info(`Generating cover... ${percent}%`, { id: 'cover-export' });
        },
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Cover PDF exported: ${filename}`, { id: 'cover-export' });
    } catch (error: any) {
      console.error('[ExportPage] Cover PDF export failed:', error);
      toast.error(`Cover PDF export failed: ${error.message}`, { id: 'cover-export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!project) {
      toast.error('Project data not available');
      return;
    }

    try {
      const jsonString = exportProjectAsJSON(project, validation || null);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Project data exported successfully!', {
        description: `JSON file size: ${(jsonString.length / 1024).toFixed(2)} KB`,
      });
    } catch (error: any) {
      console.error('[ExportPage] JSON export failed:', error);
      toast.error(`Failed to export JSON: ${error.message}`);
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
    { label: 'Story completed', completed: project.story.length > 0 && project.pages.length > 0 },
    { label: 'Images uploaded', completed: project.pages.some((p: any) => p.imageUrl) },
    { label: 'Cover designed', completed: !!(project.cover.front.imageUrl || project.cover.back.imageUrl) },
    { label: 'All validations passed', completed: validation.isValid, hasIssue: !validation.isValid },
    { label: 'Ready for export', completed: validation.isValid },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/project/$projectId', params: { projectId } })}>
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
            <p className="text-sm text-muted-foreground">Generate print-ready PDFs for Amazon KDP</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {validation.isValid ? (
            <Alert className="border-kdp-success bg-kdp-success/10">
              <CheckCircle2 className="h-4 w-4 text-kdp-success" />
              <AlertTitle className="text-kdp-success">Amazon KDP Export Ready</AlertTitle>
              <AlertDescription className="text-kdp-success/90">
                Your project meets all Amazon KDP requirements. Generate your print-ready PDFs now.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Requirements Not Met</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validation.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Quality Warnings</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validation.warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Amazon KDP Print Specifications
              </CardTitle>
              <CardDescription>Your book is configured with Amazon KDP print-compliant settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Trim Size
                  </h4>
                  <p className="text-2xl font-bold text-primary">
                    {validation.trimSize.width}" x {validation.trimSize.height}"
                  </p>
                  <p className="text-xs text-muted-foreground">Square children's book format</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Bleed
                  </h4>
                  <p className="text-2xl font-bold text-primary">{validation.bleed.top}"</p>
                  <p className="text-xs text-muted-foreground">All sides (Amazon KDP standard)</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Safe Margins
                  </h4>
                  <p className="text-2xl font-bold text-primary">{validation.margin.top}"</p>
                  <p className="text-xs text-muted-foreground">Minimum safe area</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    Spine Width
                  </h4>
                  <p className="text-2xl font-bold text-primary">{validation.spineWidth.toFixed(3)}"</p>
                  <p className="text-xs text-muted-foreground">Based on {project.pages.length} pages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interior PDF</CardTitle>
              <CardDescription>Export the book's interior pages as a print-ready PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleExportInterior}
                disabled={!validation.isValid || isExporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Generating PDF...' : 'Export Interior PDF'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover PDF</CardTitle>
              <CardDescription>Export the book's cover as a print-ready PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleExportCover}
                disabled={!validation.isValid || isExporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Generating PDF...' : 'Export Cover PDF'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Project Data (JSON)</CardTitle>
              <CardDescription>Download project data for backup or external processing</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={handleExportJSON}>
                <FileDown className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <KDPProgressIndicator steps={progressSteps} title="Export Readiness" />

          <Card>
            <CardHeader>
              <CardTitle>Amazon KDP Upload Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold text-sm">After Exporting:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Review PDFs carefully</li>
                  <li>2. Check image quality (300 DPI)</li>
                  <li>3. Verify text is within safe margins</li>
                  <li>4. Upload to Amazon KDP</li>
                  <li>5. Order a proof copy</li>
                </ul>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href="https://kdp.amazon.com/en_US/help/topic/G201834180" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    KDP Print Specifications
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
