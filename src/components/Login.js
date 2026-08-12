'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos.')
    setLoading(false)
  }

  const puedeEntrar = email.trim() && password.trim() && !loading

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="bg-white border border-hairline rounded-xl px-11 py-12 shadow-[0_2px_16px_rgba(0,0,0,.05)]">

          {/* Logo */}
          <div className="mb-8">
            <img src="/logo-deve.png" alt="Devé" className="h-[52px] w-auto block" />
            <p className="text-slate text-sm mt-3 leading-snug">
              Sistema interno · Higiene y Seguridad
            </p>
          </div>

          {/* Email */}
          <label className="block text-[13px] font-semibold text-slate mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && puedeEntrar && handleLogin()}
            placeholder="nombre@deve.ar"
            className="w-full px-3.5 py-3 mb-[18px] text-base text-ink bg-white border-[1.5px] border-hairline rounded-md outline-none transition-colors focus:border-accent placeholder:text-slate-400"
          />

          {/* Password */}
          <label className="block text-[13px] font-semibold text-slate mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && puedeEntrar && handleLogin()}
            placeholder="••••••••"
            className="w-full px-3.5 py-3 mb-6 text-base text-ink bg-white border-[1.5px] border-hairline rounded-md outline-none transition-colors focus:border-accent placeholder:text-slate-400"
          />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-danger-light border border-red-200 text-danger px-3.5 py-2.5 rounded-md text-sm mb-4">
              <AlertCircle className="w-[18px] h-[18px] shrink-0 mt-px" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={handleLogin}
            disabled={!puedeEntrar}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-base font-semibold text-white transition-colors bg-accent hover:bg-accent-hover disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-[18px] h-[18px] animate-spin" strokeWidth={2} />
                Ingresando...
              </>
            ) : (
              <>
                <LogIn className="w-[18px] h-[18px]" strokeWidth={2} />
                Ingresar
              </>
            )}
          </button>

          <p className="text-slate-400 text-[13px] text-center mt-7">
            Acceso restringido al equipo Devé
          </p>
        </div>
      </div>
    </div>
  )
}
