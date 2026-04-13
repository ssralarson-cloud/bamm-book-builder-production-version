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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  FileCheck,
  Image as ImageIcon,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useActor } from "../hooks/useActorExtended";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useTestFlow } from "../hooks/useTestFlow";

export default function TestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const { runTests, testResults, testLogs, progress, currentStep } =
    useTestFlow();

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      await runTests();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (
    status: "pending" | "running" | "passed" | "failed" | "warning",
  ) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-kdp-success" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "running":
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        );
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "project":
        return <BookOpen className="h-5 w-5" />;
      case "page":
        return <FileCheck className="h-5 w-5" />;
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "export":
        return <Download className="h-5 w-5" />;
      case "validation":
        return <FileCheck className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const allTestsPassed = testResults.every(
    (r) => r.status === "passed" || r.status === "warning",
  );
  const hasFailures = testResults.some((r) => r.status === "failed");

  return (
    <div className="container py-8">
      {/* Dev Admin Backdoor */}
      <DevAdminPanel />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display mb-2 text-4xl">
          Amazon KDP End-to-End Test Suite
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive validation of the complete workflow from project
          creation through export file generation
        </p>
      </div>

      {/* Test Control */}
      <Card className="mb-8 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-6 w-6" />
            Test Execution
          </CardTitle>
          <CardDescription>
            Run the complete test flow to verify all Amazon KDP workflow
            functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            onClick={handleRunTests}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Complete Amazon KDP Test Suite
              </>
            )}
          </Button>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentStep && (
                <p className="text-sm text-muted-foreground">
                  Current: {currentStep}
                </p>
              )}
            </div>
          )}

          {!isRunning && testResults.length > 0 && (
            <Alert
              variant={hasFailures ? "destructive" : "default"}
              className="border-2"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Test Results</AlertTitle>
              <AlertDescription>
                {allTestsPassed
                  ? "All tests passed successfully! The Amazon KDP workflow is functioning correctly."
                  : hasFailures
                    ? "Some tests failed. Please review the results below."
                    : "Tests completed with warnings. Review the details below."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Results Summary */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed status of each workflow step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={result.name || index} className="space-y-2">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStepIcon(result.step)}
                            <h4 className="font-semibold">{result.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>
                          {result.details && (
                            <div className="mt-2 space-y-1">
                              {result.details.map((detail) => (
                                <div
                                  key={detail}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    •
                                  </span>
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {result.error && (
                            <p className="mt-2 text-sm text-destructive">
                              {result.error}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            result.status === "passed"
                              ? "default"
                              : result.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                      {index < testResults.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Test Logs */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>
                Detailed execution logs with step-by-step transparency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 font-mono text-xs">
                  {testLogs.map((log) => (
                    <div
                      key={`${log.timestamp}-${log.message}`}
                      className={`rounded border-l-2 p-2 ${
                        log.level === "error"
                          ? "border-destructive bg-destructive/10"
                          : log.level === "warning"
                            ? "border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
                            : log.level === "success"
                              ? "border-kdp-success bg-kdp-success/10"
                              : "border-muted bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  {testLogs.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No logs yet. Run tests to see output.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Amazon KDP Compliance Specifications */}
      <Card className="mt-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src="/assets/generated/amazon-kdp-only-badge-boho-transparent.png"
              alt=""
              className="h-6 w-6"
            />
            Amazon KDP Print Compliance Requirements
          </CardTitle>
          <CardDescription>
            Standard specifications validated by the test suite (8.5×8.5"
            format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Format Specifications</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Trim Size: 8.5 × 8.5 inches (square)</li>
                <li>• Bleed: 0.125 inches (all sides)</li>
                <li>• Safe Margins: 0.5 inches (all sides)</li>
                <li>• Spine Width: 0.002252" per page</li>
                <li>• Total Cover Width: (8.5 × 2) + spine + 0.25"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Image Requirements</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Minimum DPI: 300</li>
                <li>• Interior: 2625×2625 pixels minimum</li>
                <li>• Cover: 2625×2625 pixels minimum</li>
                <li>• Formats: JPEG, PNG</li>
                <li>• Color Space: RGB (converts to CMYK)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Export Validation</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• PDF format with embedded fonts</li>
                <li>• Proper bleed and trim marks</li>
                <li>• Flattened transparency</li>
                <li>• Amazon KDP metadata compliance</li>
                <li>• Print-standard file naming</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Workflow Steps Tested</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Project creation with format setup</li>
                <li>• Page editing with safe zones</li>
                <li>• Image upload with DPI validation</li>
                <li>• Spine width calculation</li>
                <li>• Format validation checks</li>
                <li>• Export file generation (simulated)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Dev Admin Backdoor Panel ────────────────────────────────────────────────
// Temporary panel for testing — allows the first logged-in user to claim admin.
// Remove when Stripe billing is live and admin is managed via canister.

function DevAdminPanel() {
  const { actor, isInitialized, isAuthenticated } = useActor();
  const { identity } = useInternetIdentity();
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const myPrincipal = identity?.getPrincipal().toString() ?? null;

  const refreshRole = useCallback(async () => {
    if (!actor || !isInitialized || !isAuthenticated) return;
    try {
      const role = await actor.getCallerUserRole();
      setCurrentRole(role);
    } catch {
      setCurrentRole("unknown");
    }
  }, [actor, isInitialized, isAuthenticated]);

  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  const handleClaimAdmin = async () => {
    if (!actor) return;
    setIsBusy(true);
    try {
      await actor._initializeAccessControl();
      toast.success("Admin role claimed! You are now admin.");
      await refreshRole();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Claim admin failed: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGrantSelf = async () => {
    if (!actor || !identity) return;
    setIsBusy(true);
    try {
      await actor.assignCallerUserRole(identity.getPrincipal(), UserRole.admin);
      toast.success("Admin role assigned to your account.");
      await refreshRole();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Assign admin failed: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Card className="mb-8 border-2 border-orange-300 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
          <ShieldCheck className="h-5 w-5" />
          Dev Admin Backdoor
          <Badge variant="secondary" className="text-xs">
            TESTING ONLY
          </Badge>
        </CardTitle>
        <CardDescription>
          Temporary admin access while Stripe billing is being set up. Remove
          before production launch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Your Principal:</span>
            <span className="font-mono text-xs break-all">
              {myPrincipal ?? "Not logged in"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Role:</span>
            <Badge
              variant={
                currentRole === "admin"
                  ? "default"
                  : currentRole === "user"
                    ? "secondary"
                    : "outline"
              }
            >
              {currentRole ?? "checking…"}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClaimAdmin}
            disabled={isBusy || !isInitialized || currentRole === "admin"}
            data-ocid="dev-claim-admin-btn"
            className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
          >
            {isBusy ? "Working…" : "Claim Admin (first caller)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGrantSelf}
            disabled={isBusy || !isInitialized || currentRole !== "admin"}
            data-ocid="dev-grant-self-admin-btn"
            className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
            title="Only works if you are already admin"
          >
            Re-grant Admin to Self
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={refreshRole}
            disabled={isBusy}
            data-ocid="dev-refresh-role-btn"
          >
            Refresh Role
          </Button>
        </div>

        {currentRole !== "admin" && (
          <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-300">
              Not yet admin
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-400 text-sm">
              Click &quot;Claim Admin (first caller)&quot; to become admin on
              this canister. This works once per fresh canister deployment — the
              first logged-in user to click it gets admin.
            </AlertDescription>
          </Alert>
        )}

        {currentRole === "admin" && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Admin access active
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
              You have full admin access. The book creation flow, export, and
              all features are unlocked for testing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
