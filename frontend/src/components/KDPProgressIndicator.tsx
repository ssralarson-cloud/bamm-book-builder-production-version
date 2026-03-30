import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface KDPProgressStep {
  label: string;
  completed: boolean;
  hasIssue?: boolean;
}

interface KDPProgressIndicatorProps {
  steps: KDPProgressStep[];
  title?: string;
  description?: string;
}

export function KDPProgressIndicator({ 
  steps, 
  title = "KDP Readiness",
  description = "Complete all steps for export"
}: KDPProgressIndicatorProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <img 
                src="/assets/generated/progress-boho-indicator-transparent.png" 
                alt="" 
                className="h-5 w-5"
              />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-foreground">
              {completedCount}/{steps.length}
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-2" />
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-kdp-success" />
              ) : step.hasIssue ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              )}
              <span className={`text-sm ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
