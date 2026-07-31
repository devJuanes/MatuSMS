import { Link } from '@tanstack/react-router';
import {
  MessageSquarePlus,
  Phone,
  Search,
  Settings,
  Upload,
  Webhook,
  Calendar,
  Activity,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const nav = [
  { to: '/mensajes', label: 'Mensajes', icon: MessageSquarePlus },
  { to: '/search', label: 'Buscar', icon: Search },
  { to: '/phones', label: 'Teléfonos', icon: Phone },
  { to: '/bulk', label: 'Envío masivo', icon: Upload },
  { to: '/schedules', label: 'Horarios', icon: Calendar },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/heartbeats', label: 'Estado', icon: Activity },
  { to: '/billing', label: 'Facturación', icon: CreditCard },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white shadow-md shadow-brand/30">
            M
          </div>
          <div>
            <p className="font-semibold text-slate-900">MatuSMS</p>
            <p className="text-xs text-slate-500">Mensajería SMS</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-brand-light hover:text-brand [&.active]:bg-brand-light [&.active]:text-brand"
              activeOptions={{ exact: to === '/mensajes' }}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => logout()}
          className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
