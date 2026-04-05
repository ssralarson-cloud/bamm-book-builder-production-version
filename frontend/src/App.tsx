import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ProjectEditorPage from './pages/ProjectEditorPage';
import CoverBuilderPage from './pages/CoverBuilderPage';
import ExportPage from './pages/ExportPage';
import TestPage from './pages/TestPage';
import SubscribePage from './pages/SubscribePage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import Layout from './components/Layout';

const rootRoute = createRootRoute({
  component: Layout,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: HomePage,
});

const projectEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/project/$projectId',
  component: ProjectEditorPage,
});

const coverBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/project/$projectId/cover',
  component: CoverBuilderPage,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/project/$projectId/export',
  component: ExportPage,
});

const testRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test',
  component: TestPage,
});

const subscribeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscribe',
  component: SubscribePage,
});

const subscriptionSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscription-success',
  component: SubscriptionSuccessPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  homeRoute,
  projectEditorRoute,
  coverBuilderRoute,
  exportRoute,
  testRoute,
  subscribeRoute,
  subscriptionSuccessRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
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
