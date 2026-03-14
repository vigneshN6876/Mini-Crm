'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Lead, Profile } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['New', 'Contacted', 'Follow-Up Required', 'Converted', 'Lost']
const LEAD_SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Outreach', 'Event', 'Other']
const SERVICES = ['SEO Package', 'PPC Campaign', 'Social Media Mgmt', 'Content Writing', 'Email Marketing', 'Full Suite']
const TONES = ['Friendly', 'Professional', 'Urgent']

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-sky-100 text-sky-700 border-sky-200',
  'Contacted': 'bg-amber-100 text-amber-700 border-amber-200',
  'Follow-Up Required': 'bg-orange-100 text-orange-700 border-orange-200',
  'Converted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Lost': 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_BAR: Record<string, string> = {
  'New': '#0ea5e9', 'Contacted': '#f59e0b',
  'Follow-Up Required': '#f97316', 'Converted': '#10b981', 'Lost': '#ef4444',
}

// ─── AI Call (via secure server-side API route) ───────────────────────────────
async function callAI(prompt: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'AI request failed')
  return data.text
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    leads: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    ai: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
    logout: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
    plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
    edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
    trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
    sparkle: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 3.5L10 8l-3.5 1.5L5 13l-1.5-3.5L0 8l3.5-1.5zm14 10l1 2.5 2.5 1-2.5 1L19 20l-1-2.5L15.5 16.5l2.5-1zm-7-7l.75 1.75L10.5 9l-1.75.75L8 8.25l1.75-.75L11 6l.75 1.75z"/></svg>,
    clock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    copy: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
    check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
    close: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
    shield: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  }
  return icons[name] || null
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) { setError(err.message); setLoading(false); return }
        onLogin(data.user)
      } else {
        if (!name || !email || !password) { setError('All fields are required.'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }
        const { error: err } = await supabase.auth.signUp({
          email, password, options: { data: { name, role: 'user' } }
        })
        if (err) { setError(err.message); setLoading(false); return }
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login'); setName('')
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0d0d14 0%, #1a1025 50%, #0d0d14 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '420px', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6f57ee, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white' }}>
            <Icon name="shield" />
          </div>
          <div className="font-display" style={{ color: 'white', fontSize: '22px', fontWeight: 700 }}>LeadFlow CRM</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '4px' }}>AI-Powered Mini CRM</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', borderRadius: '11px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Cabinet Grotesk, sans-serif', transition: 'all 0.2s', background: mode === m ? 'rgba(111,87,238,0.5)' : 'transparent', color: mode === m ? 'white' : 'rgba(255,255,255,0.35)' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <input style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', padding: '12px 16px', width: '100%', outline: 'none', fontSize: '14px', fontFamily: 'Cabinet Grotesk, sans-serif' }}
              placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input type="email" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', padding: '12px 16px', width: '100%', outline: 'none', fontSize: '14px', fontFamily: 'Cabinet Grotesk, sans-serif' }}
            placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', padding: '12px 16px', width: '100%', outline: 'none', fontSize: '14px', fontFamily: 'Cabinet Grotesk, sans-serif' }}
            placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

          {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9px', padding: '10px 14px', color: '#fca5a5', fontSize: '13px' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '9px', padding: '10px 14px', color: '#6ee7b7', fontSize: '13px' }}>{success}</div>}

          <button disabled={loading} onClick={handleSubmit}
            style={{ width: '100%', padding: '13px', background: '#6f57ee', color: 'white', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Cabinet Grotesk, sans-serif', marginTop: '4px' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ user, profile, tab, setTab, onLogout, children, toast }: {
  user: User; profile: Profile | null; tab: string; setTab: (t: string) => void
  onLogout: () => void; children: React.ReactNode; toast: string | null
}) {
  const isAdmin = profile?.role === 'admin'
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', icon: 'leads' },
    { id: 'ai', label: 'AI Tools', icon: 'ai' },
    ...(isAdmin ? [{ id: 'users', label: 'Users', icon: 'users' }] : []),
  ]
  const displayName = profile?.name || user?.email || 'User'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div className="sidebar" style={{ width: '220px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #6f57ee, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
              <Icon name="shield" />
            </div>
            <span className="font-display" style={{ color: 'white', fontSize: '17px', fontWeight: 700 }}>LeadFlow</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginLeft: '41px', fontWeight: 500 }}>Mini CRM • Supabase</div>
        </div>

        <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {nav.map(n => (
            <div key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              <Icon name={n.icon} />{n.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6f57ee, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
              {displayName[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: '11px', color: isAdmin ? '#c4b5fd' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{isAdmin ? 'Admin' : 'Sales User'}</div>
            </div>
          </div>
          <div className="nav-item" onClick={onLogout}>
            <Icon name="logout" />Sign Out
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f3f8' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #ede9f9', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div className="font-display" style={{ fontSize: '19px', fontWeight: 700, color: '#1a1a2e', textTransform: 'capitalize' }}>{tab}</div>
            <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '1px' }}>
              {tab === 'dashboard' && 'Your pipeline at a glance'}
              {tab === 'leads' && 'Manage your customer leads'}
              {tab === 'ai' && 'AI-powered sales assistant'}
              {tab === 'users' && 'System users & roles'}
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(111,87,238,0.08)', border: '1px solid rgba(111,87,238,0.2)', color: '#6f57ee', fontSize: '12.5px', fontWeight: 700 }}>
              <Icon name="shield" />Admin View
            </div>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {children}
        </main>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ profile, leads, loading }: { profile: Profile | null; leads: Lead[]; loading: boolean }) {
  const stats = [
    { label: 'Total Leads', value: leads.length, accent: '#6f57ee', bg: '#f5f3ff' },
    { label: 'New', value: leads.filter(l => l.status === 'New').length, accent: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Converted', value: leads.filter(l => l.status === 'Converted').length, accent: '#10b981', bg: '#ecfdf5' },
    { label: 'Follow-Ups', value: leads.filter(l => l.status === 'Follow-Up Required').length, accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Conv. Rate', value: leads.length ? `${Math.round(leads.filter(l => l.status === 'Converted').length / leads.length * 100)}%` : '0%', accent: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {profile?.role === 'admin' && (
        <div style={{ padding: '12px 18px', borderRadius: '12px', background: 'rgba(111,87,238,0.07)', border: '1px solid rgba(111,87,238,0.18)', color: '#5b21b6', fontSize: '13.5px' }}>
          🛡️ Admin view — showing all {leads.length} leads across all users
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: s.accent }} />
            </div>
            <div className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e' }}>
              {loading ? <span className="pulse">—</span> : s.value}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '18px' }}>Pipeline Breakdown</div>
          {loading ? <div className="pulse" style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {STATUS_OPTIONS.map(s => {
                const count = leads.filter(l => l.status === s).length
                const pct = leads.length ? count / leads.length * 100 : 0
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${STATUS_COLORS[s]}`} style={{ minWidth: '130px', justifyContent: 'center' }}>{s}</span>
                    <div style={{ flex: 1, height: '6px', background: '#f0ebff', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: STATUS_BAR[s], borderRadius: '3px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280', minWidth: '20px', textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '18px' }}>Recent Leads</div>
          {loading ? <div className="pulse" style={{ color: '#9ca3af', fontSize: '13px' }}>Loading...</div> :
            leads.length === 0 ? <div style={{ color: '#9ca3af', fontSize: '13.5px' }}>No leads yet. Add your first lead!</div> : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {leads.slice(0, 6).map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f3ff' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1a1a2e' }}>{l.name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{l.interested_service}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

// ─── Lead Modal ───────────────────────────────────────────────────────────────
function LeadModal({ lead, userId, onSave, onClose, saving }: {
  lead: Lead | null; userId: string; onSave: (d: Partial<Lead>) => void
  onClose: () => void; saving: boolean
}) {
  const [form, setForm] = useState<Partial<Lead>>(lead || {
    name: '', email: '', phone: '', lead_source: 'Website',
    interested_service: 'SEO Package', status: 'New', notes: '', last_contacted_at: ''
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>{lead ? 'Edit Lead' : 'Add New Lead'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}><Icon name="close" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {([['name', 'Full Name *', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text']] as const).map(([k, label, type]) => (
            <div key={k} style={{ gridColumn: k === 'name' ? '1 / -1' : 'auto' }}>
              <label className="form-label">{label}</label>
              <input type={type} className="form-input" value={(form as any)[k] || ''} onChange={e => set(k, e.target.value)} placeholder={label.replace(' *', '')} />
            </div>
          ))}
          {([['lead_source', 'Lead Source', LEAD_SOURCES], ['interested_service', 'Service', SERVICES], ['status', 'Status', STATUS_OPTIONS]] as const).map(([k, label, opts]) => (
            <div key={k}>
              <label className="form-label">{label}</label>
              <select className="form-input" value={(form as any)[k] || ''} onChange={e => set(k, e.target.value)}>
                {opts.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="form-label">Last Contacted</label>
            <input type="date" className="form-input" value={form.last_contacted_at || ''} onChange={e => set('last_contacted_at', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes</label>
            <textarea className="form-input" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notes about this lead..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => {
            if (!form.name) { alert('Name is required'); return }
            onSave({ ...form, user_id: lead?.user_id || userId })
          }}>
            {saving ? 'Saving...' : <><Icon name="check" />{lead ? 'Save Changes' : 'Add Lead'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Leads View ───────────────────────────────────────────────────────────────
function LeadsView({ user, leads, loading, onAdd, onEdit, onDelete, onStatusChange, saving }: {
  user: User; leads: Lead[]; loading: boolean; saving: boolean
  onAdd: (d: Partial<Lead>) => Promise<void>; onEdit: (d: Lead) => Promise<void>
  onDelete: (id: string) => Promise<void>; onStatusChange: (id: string, s: string) => Promise<void>
}) {
  const [modal, setModal] = useState<null | 'add' | Lead>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = leads.filter(l =>
    (filter === 'All' || l.status === filter) &&
    (l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: '260px' }} placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...STATUS_OPTIONS].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setModal('add')}>
          <Icon name="plus" />Add Lead
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }} className="pulse">Loading from Supabase...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f0ebff' }}>
                {['Name', 'Contact', 'Source', 'Service', 'Status', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  {leads.length === 0 ? 'No leads yet — click Add Lead to get started!' : 'No leads match this filter'}
                </td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="table-row" style={{ borderBottom: '1px solid #f5f3ff' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{lead.name}</div>
                    {lead.notes && <div style={{ fontSize: '11.5px', color: '#9ca3af', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.notes}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ color: '#4b5563' }}>{lead.email}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{lead.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280' }}>{lead.lead_source}</td>
                  <td style={{ padding: '14px 16px', color: '#4b5563', fontSize: '12.5px', fontWeight: 600 }}>{lead.interested_service}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <select className={`badge ${STATUS_COLORS[lead.status]}`} style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                      value={lead.status} onChange={e => onStatusChange(lead.id, e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: '12px' }}>
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => setModal(lead)}><Icon name="edit" /></button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }} onClick={() => onDelete(lead.id)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ebff', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
          {loading ? 'Loading...' : `${filtered.length} of ${leads.length} leads · RLS enforced · Supabase PostgreSQL`}
        </div>
      </div>

      {modal && (
        <LeadModal
          lead={modal === 'add' ? null : modal as Lead}
          userId={user?.id ?? ""}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal === 'add') await onAdd(data)
            else await onEdit(data as Lead)
            setModal(null)
          }}
        />
      )}
    </div>
  )
}

// ─── AI Tools ─────────────────────────────────────────────────────────────────
function AITools({ leads }: { leads: Lead[] }) {
  const [selId, setSelId] = useState(leads[0]?.id || '')
  const [tone, setTone] = useState('Professional')
  const [msgLoad, setMsgLoad] = useState(false)
  const [timeLoad, setTimeLoad] = useState(false)
  const [msg, setMsg] = useState('')
  const [editMsg, setEditMsg] = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [copied, setCopied] = useState(false)
  const [approved, setApproved] = useState(false)

  const lead = leads.find(l => l.id === selId)

  const genMsg = async () => {
    if (!lead) return
    setMsgLoad(true); setMsg(''); setEditMsg(''); setApproved(false)
    try {
      const text = await callAI(`You are a professional sales assistant inside a CRM system.
Generate a short, polite, clear follow-up message for this lead:
- Lead Name: ${lead.name}
- Interested Service: ${lead.interested_service}
- Current Status: ${lead.status}
- Tone: ${tone}
Do not be pushy. End with a soft call-to-action. Keep it under 100 words. Write only the message body.`)
      setMsg(text); setEditMsg(text)
    } catch { setMsg('Error — check your AI API key in .env.local'); setEditMsg('') }
    setMsgLoad(false)
  }

  const genTime = async () => {
    if (!lead) return
    setTimeLoad(true); setTimeOut('')
    try {
      const text = await callAI(`You are a sales strategy expert. Suggest the best time to follow up based on sales best practices.
- Lead Source: ${lead.lead_source}
- Created: ${lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Unknown'}
- Last Contacted: ${lead.last_contacted_at || 'Never'}
- Status: ${lead.status}
- Service: ${lead.interested_service}
Respond in 2-3 sentences. Be specific about timing.`)
      setTimeOut(text)
    } catch { setTimeOut('Error — check your AI API key in .env.local') }
    setTimeLoad(false)
  }

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '14px' }}>Select Lead</div>
        {leads.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>Add leads first to use AI tools.</div>
        ) : (
          <>
            <select className="form-input" style={{ maxWidth: '400px' }} value={selId}
              onChange={e => { setSelId(e.target.value); setMsg(''); setEditMsg(''); setTimeOut(''); setApproved(false) }}>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.interested_service} ({l.status})</option>)}
            </select>
            {lead && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
                {([['Source', lead.lead_source], ['Status', lead.status], ['Last Contact', lead.last_contacted_at || 'Never']] as const).map(([k, v]) => (
                  <div key={k} style={{ background: '#faf8ff', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{k}</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1a1a2e' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Icon name="ai" />
          <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>AI Follow-Up Message</div>
        </div>
        <div style={{ fontSize: '12.5px', color: '#9ca3af', marginBottom: '18px' }}>Calls <code>/api/ai</code> — API key stays server-side, never exposed to client</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Tone:</span>
          {TONES.map(t => (
            <button key={t} className={`btn btn-sm ${tone === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTone(t)}>{t}</button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={genMsg} disabled={msgLoad || !lead}>
          {msgLoad ? <><span className="spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Generating...</> : <><Icon name="sparkle" />Generate Message</>}
        </button>

        {msg && (
          <div style={{ marginTop: '18px' }}>
            <div className="ai-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Generated — Edit & Approve</span>
                {approved && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 700 }}><Icon name="check" />Approved</span>}
              </div>
              <textarea style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '13.5px', color: '#374151', lineHeight: '1.6', resize: 'vertical', minHeight: '90px', fontFamily: 'Cabinet Grotesk, sans-serif' }}
                value={editMsg} onChange={e => { setEditMsg(e.target.value); setApproved(false) }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(editMsg); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                <Icon name={copied ? 'check' : 'copy'} />{copied ? 'Copied!' : 'Copy'}
              </button>
              <button className={`btn btn-sm ${approved ? 'btn-ghost' : 'btn-primary'}`} disabled={approved} onClick={() => setApproved(true)}>
                <Icon name="check" />{approved ? 'Approved ✓' : 'Approve & Use'}
              </button>
            </div>
            {!approved && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><Icon name="shield" />AI never auto-sends — your review is required</div>}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Icon name="clock" />
          <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>Best Follow-Up Time</div>
        </div>
        <div style={{ fontSize: '12.5px', color: '#9ca3af', marginBottom: '18px' }}>Smart timing recommendation based on lead data</div>
        <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }} onClick={genTime} disabled={timeLoad || !lead}>
          {timeLoad ? <><span className="spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Analyzing...</> : <><Icon name="clock" />Suggest Best Time</>}
        </button>
        {timeOut && (
          <div style={{ marginTop: '18px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>AI Recommendation</div>
            <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.65' }}>{timeOut}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Users View ───────────────────────────────────────────────────────────────
function UsersView({ leads }: { leads: Lead[] }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      setProfiles((data as Profile[]) || [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ebff' }}>
          <div className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>System Users</div>
          <div style={{ fontSize: '12.5px', color: '#9ca3af' }}>Registered via Supabase Auth · Roles managed via profiles table</div>
        </div>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }} className="pulse">Loading users...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #f0ebff' }}>
                {['User', 'Role', 'Leads', 'Converted', 'Rate'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const ul = leads.filter(l => l.user_id === p.id)
                const conv = ul.filter(l => l.status === 'Converted').length
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f5f3ff' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6f57ee, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                          {(p.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{p.name || '—'}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{p.id.slice(0, 14)}…</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge" style={p.role === 'admin' ? { background: '#f5f3ff', color: '#6f57ee', border: '1px solid #c4b5fd' } : { background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                        {p.role === 'admin' ? 'Admin' : 'Sales User'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1a1a2e' }}>{ul.length}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#10b981' }}>{conv}</td>
                    <td style={{ padding: '14px 20px', color: '#6b7280' }}>{ul.length ? `${Math.round(conv / ul.length * 100)}%` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px' }}>
        <strong>To grant Admin:</strong> In Supabase SQL Editor run: <code style={{ background: 'rgba(0,0,0,0.07)', padding: '2px 6px', borderRadius: '4px' }}>UPDATE public.profiles SET role = &apos;admin&apos; WHERE id = &apos;&lt;uuid&gt;&apos;;</code>
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchProfile = async (uid: string, email: string): Promise<Profile> => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (data) return data as Profile
    } catch {}
    return { id: uid, name: email, role: 'user', created_at: '' }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        setAuthUser(u)
        const p = await fetchProfile(u.id, u.email || '')
        setProfile(p)
      }
      setBooting(false)
    }).catch(() => setBooting(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthUser(null); setProfile(null); setLeads([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads((data as Lead[]) || [])
    setLeadsLoading(false)
  }, [])

  useEffect(() => { if (authUser) loadLeads() }, [authUser, loadLeads])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthUser(null); setProfile(null); setLeads([]); setTab('dashboard')
  }

 const handleAdd = async (data: Partial<Lead>) => {
  setSaving(true)

  const { data: newLead, error } = await supabase
    .from('leads')
    .insert([{ ...data, user_id: authUser?.id ?? "" }])
    .select()
    .single()

  if (error) {
    console.error(error)
    showToast('❌ Error adding lead')
  } else {
    setLeads(prev => [newLead as Lead, ...prev])
    showToast('✅ Lead added!')
  }

  setSaving(false)
}

  const handleEdit = async (data: Lead) => {
  setSaving(true)

  const { id, created_at, user_id, ...fields } = data

  const { data: updated, error } = await supabase
    .from('leads')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    showToast('❌ Error updating lead')
  } else {
    setLeads(prev =>
      prev.map(l => l.id === id ? updated as Lead : l)
    )
    showToast('✅ Lead updated!')
  }

  setSaving(false)
}

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) showToast('❌ Error deleting lead')
    else { setLeads(prev => prev.filter(l => l.id !== id)); showToast('🗑️ Lead deleted') }
  }
const handleStatusChange = async (id: string, status: string) => {

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)

  if (error) {
    showToast('❌ Status update failed')
    return
  }

  setLeads(prev =>
    prev.map(l =>
      l.id === id ? { ...l, status: status as Lead['status'] } : l
    )
  )

  showToast('✅ Status updated')
}

 


  if (booting) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d14' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(111,87,238,0.2)', borderTopColor: '#6f57ee', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontFamily: 'sans-serif' }}>Connecting to Supabase...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!authUser) return (
    <AuthScreen onLogin={async (user) => {
      setAuthUser(user)
      const p = await fetchProfile(user.id, user.email || '')
      setProfile(p)
    }} />
  )

  // Extra safety — don't render Layout until profile is ready
  if (!profile) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d14' }}>
      <div style={{ width: '44px', height: '44px', border: '3px solid rgba(111,87,238,0.2)', borderTopColor: '#6f57ee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <Layout user={authUser} profile={profile} tab={tab} setTab={setTab} onLogout={handleLogout} toast={toast}>
      {tab === 'dashboard' && <Dashboard profile={profile} leads={leads} loading={leadsLoading} />}
      {tab === 'leads' && <LeadsView user={authUser} leads={leads} loading={leadsLoading} saving={saving} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />}
      {tab === 'ai' && <AITools leads={leads} />}
      {tab === 'users' && profile?.role === 'admin' && <UsersView leads={leads} />}
    </Layout>
  )
}
