import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success('Subscription activated successfully!');
  }, []);

  return (
    <div className="container py-10 max-w-2xl mx-auto">
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-20 w-20 text-green-600" />
          </div>
          <CardTitle className="font-display text-3xl">Subscription Activated!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">
            Thank you for subscribing to Bamm Book Builder Premium!
          </p>
          <p className="text-muted-foreground">
            You now have access to all premium features. Start creating amazing children's books today.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={() => navigate({ to: '/home' })} size="lg" className="w-full">
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate({ to: '/subscribe' })}
            variant="outline"
            className="w-full"
          >
            View Subscription Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
