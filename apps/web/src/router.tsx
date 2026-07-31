import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { MessagingPage } from '@/pages/MessagingPage';
import { PhonesPage } from '@/pages/PhonesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LegalPage } from '@/pages/LegalPage';
import { WebhooksPage } from '@/pages/WebhooksPage';
import { SchedulesPage } from '@/pages/SchedulesPage';
import { BulkPage } from '@/pages/BulkPage';
import { HeartbeatsPage } from '@/pages/HeartbeatsPage';
import { BillingPage } from '@/pages/BillingPage';
import { SearchPage } from '@/pages/SearchPage';

function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-slate-500">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
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

const indexRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/mensajes', search: { owner: undefined, contact: undefined, nuevo: undefined } });
  },
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

const routeTree = rootRoute.addChildren([
  loginRoute,
  legalRoute,
  protectedLayout.addChildren([
    indexRoute,
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
    searchRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
