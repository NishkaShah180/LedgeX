import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Repeat,
  Sparkles,
  Target,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            LX
          </div>
          <p className="text-lg font-semibold text-slate-900">LedgeX</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out
          w-64 md:w-20 lg:w-64 md:static md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 md:px-0 lg:px-6 py-5 md:h-16 lg:h-auto lg:py-5 md:justify-center lg:justify-start">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              LX
            </div>
            <div className="md:hidden lg:block">
              <p className="text-lg font-semibold text-slate-900">LedgeX</p>
              <p className="text-xs text-slate-500 whitespace-nowrap">Personal Finance</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 md:px-2 lg:px-3 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 md:px-0 lg:px-3 py-2.5 md:py-3 lg:py-2.5 text-sm font-medium transition-colors md:justify-center lg:justify-start group',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
              title={label}
            >
              <Icon className="h-5 w-5 shrink-0 md:h-6 md:w-6 lg:h-5 lg:w-5" />
              <span className="md:hidden lg:block whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 md:p-2 lg:p-4">
          <div className="md:hidden lg:block">
            {user && (
              <p className="mb-3 truncate px-1 text-sm text-slate-500">
                {user.email || user.name || 'Signed in'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 md:px-0 lg:px-3 py-2.5 md:py-3 lg:py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 md:justify-center lg:justify-start group"
            title="Logout"
          >
            <LogOut className="h-5 w-5 shrink-0 md:h-6 md:w-6 lg:h-5 lg:w-5" />
            <span className="md:hidden lg:block whitespace-nowrap">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
