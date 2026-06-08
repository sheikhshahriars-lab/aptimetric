'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email ?? '')
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400 tracking-widest uppercase">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Top nav */}
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold tracking-tight text-black">APTIMETRIC</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs border border-gray-300 px-3 py-1.5 text-black hover:bg-black hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-black tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm">Welcome to Aptimetric. Your assessment platform is ready.</p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Tests Taken</p>
            <p className="text-2xl font-bold text-black">0</p>
          </div>
          <div className="border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">IQ Score</p>
            <p className="text-2xl font-bold text-black">—</p>
          </div>
          <div className="border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Percentile</p>
            <p className="text-2xl font-bold text-black">—</p>
          </div>
        </div>

        {/* CTA */}
        <div className="border border-black p-8 text-center">
          <h2 className="text-lg font-semibold text-black mb-2">Ready to measure your intelligence?</h2>
          <p className="text-sm text-gray-500 mb-6">The full assessment takes 20–40 minutes across 6 cognitive domains.</p>
          <button
            disabled
            className="bg-black text-white text-sm font-medium px-8 py-3 opacity-40 cursor-not-allowed"
          >
            Begin Assessment — Coming Soon
          </button>
        </div>
      </div>

    </main>
  )
}