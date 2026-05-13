'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../../../styles/auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          Viko<span className={styles.logoDot}>.</span>
        </div>
        <h1 className={styles.authTitle}>Bienvenido de vuelta</h1>
        <p className={styles.authSub}>Ingresá a tu panel de emprendedor</p>

        <form onSubmit={handleLogin} className={styles.authForm}>
          <div className={styles.fieldGroup}>
            <label className="field-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="hola@tuemprendimiento.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className="field-label">Contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-olive ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al panel →'}
          </button>
        </form>

        <p className={styles.authFooter}>
          ¿No tenés cuenta?{' '}
          <Link href="/register" className={styles.authLink}>
            Publicá tu emprendimiento
          </Link>
        </p>
        <Link href="/directorio" className={styles.backLink}>
          ← Volver al directorio
        </Link>
      </div>

      <div className={styles.authDecor}>
        <div className={styles.decorQuote}>
          <p className={styles.decorText}>
            &quot;Presencia online profesional en 15 minutos.&quot;
          </p>
          <p className={styles.decorSub}>Miles de emprendedores en LATAM ya están en Viko.</p>
        </div>
      </div>
    </div>
  )
}
