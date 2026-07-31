import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { MessagingPage } from '@/pages/MessagingPage';
import { PhonesPage } from '@/pages/PhonesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LegalPage } from '@/pages/LegalPage';
import { WebhooksPage } from '@/pages/WebhooksPage';
import { SchedulesPage } from '@/pages/SchedulesPage';
import { BulkPage } from '@/pages/BulkPage';
import { HeartbeatsPage } from '@/pages/HeartbeatsPage';
import { DocsPage } from '@/pages/DocsPage';
import { BillingPage } from '@/pages/BillingPage';
import { SearchPage } from '@/pages/SearchPage';
import type { ReactNode } from 'react';

function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        search={{ redirect: location.pathname + location.searchStr || undefined }}
      />
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function GuestGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    return (
      <Navigate
        to="/mensajes"
        search={{ owner: undefined, contact: undefined, nuevo: undefined }}
      />
    );
  }
  return children;
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
  component: () => (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
  component: () => (
    <GuestGuard>
      <RegisterPage />
    </GuestGuard>
  ),
});

const legalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal',
  component: LegalPage,
});

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: AuthGuard,
});

const messagingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/mensajes',
  component: MessagingPage,
  validateSearch: (search: Record<string, unknown>) => ({
    owner: (search.owner as string) || undefined,
    contact: (search.contact as string) || undefined,
    nuevo: (search.nuevo as string) || undefined,
  }),
});

const threadsRedirect = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/threads',
  beforeLoad: () => {
    throw redirect({ to: '/mensajes', search: { owner: undefined, contact: undefined, nuevo: undefined } });
  },
});

const threadDetailRedirect = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/threads/$owner/$contact',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/mensajes',
      search: { owner: params.owner, contact: params.contact, nuevo: undefined },
    });
  },
});

const phonesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/phones',
  component: PhonesPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/settings',
  component: SettingsPage,
});

const webhooksRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/webhooks',
  component: WebhooksPage,
});

const schedulesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/schedules',
  component: SchedulesPage,
});

const bulkRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/bulk',
  component: BulkPage,
});

const heartbeatsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/heartbeats',
  component: HeartbeatsPage,
});

const docsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/documentacion',
  component: DocsPage,
});

const billingRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/billing',
  component: BillingPage,
});

const searchRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/search',
  component: SearchPage,
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  registerRoute,
  legalRoute,
  catchAllRoute,
  protectedLayout.addChildren([
    messagingRoute,
    threadsRedirect,
    threadDetailRedirect,
    phonesRoute,
    settingsRoute,
    webhooksRoute,
    schedulesRoute,
    bulkRoute,
    heartbeatsRoute,
    billingRoute,
    docsRoute,
    searchRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
