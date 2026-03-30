import { useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeploymentUrl } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function DeploymentInfo() {
  const { data: deploymentUrl, isLoading } = useDeploymentUrl();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!deploymentUrl) return;

    try {
      await navigator.clipboard.writeText(deploymentUrl);
      setCopied(true);
      toast.success('Deployment URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy URL');
    }
  };

  const handleVisit = () => {
    if (!deploymentUrl) return;
    window.open(deploymentUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <Card className="border card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Deployment Information
          </CardTitle>
          <CardDescription>Loading deployment details...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!deploymentUrl) {
    return null;
  }

  return (
    <Card className="border card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          Deployment Information
        </CardTitle>
        <CardDescription>
          Your application is live and accessible at the following URL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-md border bg-secondary/20 p-3">
          <code className="flex-1 text-sm font-mono text-foreground break-all">
            {deploymentUrl}
          </code>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleVisit}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit Site
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
