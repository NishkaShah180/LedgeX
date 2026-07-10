import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { parseApiError } from '../utils/apiError'
import { parseAuthResponse } from '../utils/authResponse'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = parseAuthResponse(response)
      login(token, user)
      navigate('/')
    } catch (err) {
      setError(parseApiError(err, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  function handleDevLogin() {
    login('dev-token', { email: 'demo@ledgex.com', name: 'Demo User' })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gray-950 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-xl transition-colors duration-200">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="LedgeX Logo" className="h-16 w-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500 transition-colors duration-200">LedgeX</h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white transition-colors duration-200">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-200">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 transition-colors duration-200">
            {Array.isArray(error) ? (
              <ul className="list-disc pl-5 space-y-1">
                {error.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            ) : (
              <p>{error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900 dark:text-gray-200 transition-colors duration-200">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 px-3 bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-gray-700 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-900 dark:text-gray-200 transition-colors duration-200">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-gray-700 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400 transition-colors duration-200">
          Not a member?{' '}
          <Link to="/register" className="font-semibold leading-6 text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Create an account
          </Link>
        </p>

        {import.meta.env.DEV && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-gray-800 transition-colors duration-200">
            <button
              type="button"
              onClick={handleDevLogin}
              className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-200 dark:hover:bg-gray-700"
            >
              Continue as demo user
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
