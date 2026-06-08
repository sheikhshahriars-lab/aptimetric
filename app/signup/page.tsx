'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Account created! Check your email to confirm your account, then log in.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black">APTIMETRIC</h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">Measure What Matters</p>
        </div>

        {/* Card */}
        <div className="border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-black mb-1">Create account</h2>
          <p className="text-sm text-gray-500 mb-6">Start your assessment journey</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:border-black transition-colors"
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
            )}

            {message && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">{message}</p>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-black text-white text-sm font-medium py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-black font-medium underline">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}