import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import CoverBuilderPage from "./pages/CoverBuilderPage";
import ExportPage from "./pages/ExportPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import SubscribePage from "./pages/SubscribePage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import TestPage from "./pages/TestPage";

const rootRoute = createRootRoute({
  component: Layout,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: HomePage,
});

const projectEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project/$projectId",
  component: ProjectEditorPage,
});

const coverBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project/$projectId/cover",
  component: CoverBuilderPage,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/project/$projectId/export",
  component: ExportPage,
});

const subscribeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscribe",
  component: SubscribePage,
});

const subscriptionSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscription-success",
  component: SubscriptionSuccessPage,
});

const testRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test",
  component: TestPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  homeRoute,
  projectEditorRoute,
  coverBuilderRoute,
  exportRoute,
  subscribeRoute,
  subscriptionSuccessRoute,
  testRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // 60 seconds stale time: prevents queries from being marked stale and
      // re-fetched immediately when navigating between pages. This is the
      // key guard against the "listProjects works then fails after navigation"
      // race condition — a query that already succeeded won't re-fire during
      // the brief window when isFetching flickers during a route transition.
      staleTime: 60_000,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <InternetIdentityProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </InternetIdentityProvider>
    </ThemeProvider>
  );
}
