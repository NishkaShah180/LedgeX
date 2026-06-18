import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleDevLogin() {
    login('dev-token', { email: 'demo@ledgex.com', name: 'Demo User' })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to your LedgeX account
        </p>

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={handleDevLogin}
            className="mt-8 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Continue as demo user
          </button>
        )}
      </div>
    </div>
  )
}
