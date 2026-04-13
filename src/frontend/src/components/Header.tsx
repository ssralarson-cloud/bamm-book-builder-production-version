import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActorExtended";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { isInitialized } = useActor();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isInitializing =
    loginStatus === "initializing" || (isAuthenticated && !isInitialized);
  const isLoggingIn = loginStatus === "logging-in";
  const disabled = isLoggingIn || isInitializing;

  const buttonText = isLoggingIn
    ? "Logging in..."
    : isInitializing
      ? "Preparing..."
      : isAuthenticated
        ? "Logout"
        : "Login";

  const handleAuth = async () => {
    if (isAuthenticated) {
      console.log("[Header] Logging out");
      await clear();
      queryClient.clear();
      toast.success("Logged out successfully");
      navigate({ to: "/" });
    } else {
      try {
        console.log("[Header] Initiating login");
        await login();
        toast.success("Welcome!");
      } catch (error: any) {
        console.error("[Header] Login error:", error);
        if (error.message === "User is already authenticated") {
          console.log(
            "[Header] User already authenticated, clearing and retrying",
          );
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error("Could not log in. Please try again.");
        }
      }
    }
  };

  return (
    <header className="simple-header">
      <div className="container flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <span className="simple-title">Bamm Book Builder</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="simple-nav-button"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/test" })}
            className="simple-nav-button"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            Tests
          </Button>
          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuth}
            disabled={disabled}
            className="simple-auth-button"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buttonText}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
