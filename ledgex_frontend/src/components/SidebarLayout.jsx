import { NavLink, Outlet } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Repeat,
  Sparkles,
  Target,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
]

export default function SidebarLayout() {
  const { logout, user } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              LX
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">LedgeX</p>
              <p className="text-xs text-slate-500">Personal Finance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {user && (
            <p className="mb-3 truncate px-1 text-sm text-slate-500">
              {user.email || user.name || 'Signed in'}
            </p>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
