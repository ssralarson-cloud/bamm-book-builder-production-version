import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Heart } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Welcome to the BAM family!");
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center fade-in">
        {/* Decorative dots */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div
            className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-terracotta-200 animate-float"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute -right-3 top-2 h-3 w-3 rounded-full bg-sage-200 animate-float"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute -bottom-1 left-0 h-3.5 w-3.5 rounded-full bg-blush-200 animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-100 shadow-boho">
            <CheckCircle className="h-10 w-10 text-sage-600" />
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-cream-900">
          You're All Set!
        </h1>
        <p className="mt-3 text-lg text-cream-700">
          Your subscription is active. Time to create something magical.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-4 py-1.5 text-sm font-semibold text-sage-700">
          <Heart className="h-3.5 w-3.5 fill-sage-400 text-sage-400" />
          Full access to all features
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={() => navigate({ to: "/home" })}
            size="lg"
            className="w-full gap-2 rounded-full bg-terracotta-500 py-6 text-base font-bold shadow-boho hover:bg-terracotta-600 hover:shadow-boho-lg"
            data-ocid="success-start-creating-btn"
          >
            Start Creating
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate({ to: "/subscribe" })}
            variant="ghost"
            className="w-full rounded-full text-cream-600 hover:text-cream-800"
          >
            View Subscription Details
          </Button>
        </div>
      </div>
    </div>
  );
}
