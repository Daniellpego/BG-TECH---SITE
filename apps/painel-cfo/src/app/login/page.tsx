'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })

    setLoading(false)
    if (error) {
      setError('Erro ao enviar email de recuperação.')
      return
    }
    setResetSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-navy px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="gradient-cyan rounded-2xl p-4">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary">BG TECH</h1>
            <p className="text-xs font-semibold text-brand-cyan tracking-widest uppercase mt-1">
              Painel CFO
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={resetMode ? handleResetPassword : handleLogin}
          className="card-glass space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="gustavo@bgtech.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {!resetMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-status-negative text-center">{error}</p>
          )}

          {resetSent && (
            <p className="text-sm text-status-positive text-center">
              Email de recuperação enviado. Verifique sua caixa de entrada.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {resetMode ? 'Enviar Email de Recuperação' : 'Entrar no Painel'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setResetMode(!resetMode)
              setError(null)
              setResetSent(false)
            }}
            className="text-xs text-text-secondary hover:text-brand-cyan transition-colors w-full text-center"
          >
            {resetMode ? 'Voltar ao login' : 'Esqueci a senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
