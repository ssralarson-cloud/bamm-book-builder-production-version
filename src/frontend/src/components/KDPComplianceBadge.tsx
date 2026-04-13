import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface KDPComplianceBadgeProps {
  isValid: boolean | null;
  isLoading?: boolean;
  errors?: string[];
  warnings?: string[];
  showDetails?: boolean;
}

export function KDPComplianceBadge({
  isValid,
  isLoading = false,
  errors = [],
  warnings = [],
  showDetails = true,
}: KDPComplianceBadgeProps) {
  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1.5 border border-border">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (isValid === null) {
    return (
      <Badge variant="secondary" className="border border-border">
        Not Validated
      </Badge>
    );
  }

  const content = (
    <Badge
      variant={isValid ? "default" : "destructive"}
      className={
        isValid
          ? "border border-border bg-kdp-success hover:bg-kdp-success/90"
          : "border border-border"
      }
    >
      {isValid ? (
        <>
          <CheckCircle2 className="mr-1 h-3 w-3" />
          KDP Ready
        </>
      ) : (
        <>
          <AlertCircle className="mr-1 h-3 w-3" />
          Issues Found
        </>
      )}
    </Badge>
  );

  if (!showDetails || (errors.length === 0 && warnings.length === 0)) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-xs border-2 border-border">
          {errors.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-destructive">Errors:</p>
              <ul className="list-inside list-disc text-xs">
                {errors.slice(0, 3).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground">Warnings:</p>
              <ul className="list-inside list-disc text-xs">
                {warnings.slice(0, 3).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
