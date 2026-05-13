'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase'
import Image from 'next/image'

interface Emprendimiento {
  id: number
  nombre: string
  rubro: string
  slug: string
  images?: string[]
}

interface Respuesta {
  id: number
  contenido: string
  created_at: string
  emprendimientos: Emprendimiento | Emprendimiento[] | null
}

interface Post {
  id: number
  tipo: 'win' | 'pregunta' | 'tip'
  contenido: string
  likes: number
  created_at: string
  emprendimientos: Emprendimiento | Emprendimiento[] | null
  respuestas?: Respuesta[]
}

interface MiEmp {
  id: number
  nombre: string
  plan: string
}

const PALABRAS_PROHIBIDAS = [
  'crypto', 'bitcoin', 'ganar dinero rápido',
  'forex', 'trading', 'esquema', 'pirámide',
]

const TIPO_CONFIG = {
  win:      { label: '🏆 Win',      color: '#6B7A5A', bg: '#EFF2EB', desc: 'Compartí un logro' },
  pregunta: { label: '❓ Pregunta', color: '#4A90D9', bg: '#EBF3FB', desc: 'Preguntale a la comunidad' },
  tip:      { label: '💡 Tip',      color: '#C9A84C', bg: '#FBF5E8', desc: 'Compartí algo que aprendiste' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function validarPost(contenido: string): string | null {
  if (contenido.length < 20) return 'El post debe tener al menos 20 caracteres'
  if (contenido.length > 300) return 'El post no puede superar los 300 caracteres'
  const lower = contenido.toLowerCase()
  for (const palabra of PALABRAS_PROHIBIDAS) {
    if (lower.includes(palabra)) return `No se permiten posts con "${palabra}"`
  }
  return null
}

function getEmp(raw: Emprendimiento | Emprendimiento[] | null): Emprendimiento | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] : raw
}

function Avatar({ emp, size = 40 }: { emp: Emprendimiento; size?: number }) {
  const avatar = emp.images?.[0]
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      overflow: 'hidden', background: '#EDE8DC', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: '#6B7A5A',
    }}>
      {avatar
        ? <Image src={avatar} alt={emp.nombre} fill style={{ objectFit: 'cover' }} sizes="40px" />
        : emp.nombre.slice(0, 2).toUpperCase()
      }
    </div>
  )
}

function RespuestaItem({ respuesta, isAdmin, onEliminar }: {
  respuesta: Respuesta
  isAdmin: boolean
  onEliminar: (id: number) => void
}) {
  const emp = getEmp(respuesta.emprendimientos)
  if (!emp) return null
  return (
    <div style={{
      display: 'flex', gap: 10, paddingTop: 12,
      borderTop: '1px solid rgba(26,24,20,0.06)',
    }}>
      <Avatar emp={emp} size={30} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Link href={`/emprendimiento/${emp.slug}`} style={{ fontSize: 12, fontWeight: 700, color: '#1A1814', textDecoration: 'none' }}>
            {emp.nombre}
          </Link>
          <span style={{ fontSize: 11, color: '#9A958A' }}>{timeAgo(respuesta.created_at)}</span>
          {isAdmin && (
            <button onClick={() => onEliminar(respuesta.id)} style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              fontSize: 10, color: '#C4664A', cursor: 'pointer',
            }}>🗑️</button>
          )}
        </div>
        <p style={{ fontSize: 13, color: '#2D2B26', lineHeight: 1.6 }}>{respuesta.contenido}</p>
      </div>
    </div>
  )
}

function PostCard({ post, miEmprendimiento, userId, isAdmin, onLike, onReportar, onEliminarPost, likedPosts }: {
  post: Post
  miEmprendimiento: MiEmp | null
  userId: string | null
  isAdmin: boolean
  onLike: (id: number) => void
  onReportar: (id: number) => void
  onEliminarPost: (id: number) => void
  likedPosts: Set<number>
}) {
  const [showRespuestas, setShowRespuestas] = useState(false)
  const [respuestas, setRespuestas] = useState<Respuesta[]>(post.respuestas ?? [])
  const [respondiendo, setRespondiendo] = useState(false)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [savingResp, setSavingResp] = useState(false)
  const supabase = createClient()

  const cfg = TIPO_CONFIG[post.tipo]
  const emp = getEmp(post.emprendimientos)
  const liked = likedPosts.has(post.id)
  if (!emp) return null

  async function handleResponder() {
    if (!miEmprendimiento || !textoRespuesta.trim()) return
    setSavingResp(true)
    const { data, error } = await supabase
      .from('respuestas')
      .insert({
        post_id: post.id,
        emprendimiento_id: miEmprendimiento.id,
        contenido: textoRespuesta.trim(),
      })
      .select(`id, contenido, created_at, emprendimientos (id, nombre, slug, images)`)
      .single()

    if (!error && data) {
      setRespuestas(prev => [...prev, data as unknown as Respuesta])
      setTextoRespuesta('')
      setRespondiendo(false)
      setShowRespuestas(true)
    }
    setSavingResp(false)
  }

  async function handleEliminarRespuesta(id: number) {
    if (!isAdmin) return
    await supabase.from('respuestas').delete().eq('id', id)
    setRespuestas(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{
      background: '#FAFAF7', borderRadius: 20, padding: '20px 24px',
      border: `1px solid ${isAdmin ? 'rgba(196,102,74,0.15)' : 'rgba(26,24,20,0.08)'}`,
      boxShadow: '0 2px 8px rgba(26,24,20,0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar emp={emp} />
          <div>
            <Link href={`/emprendimiento/${emp.slug}`} style={{ fontSize: 14, fontWeight: 700, color: '#1A1814', textDecoration: 'none' }}>
              {emp.nombre}
            </Link>
            <p style={{ fontSize: 11, color: '#9A958A', marginTop: 1 }}>
              {emp.rubro} · {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '4px 10px',
          borderRadius: 100, background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}30`,
        }}>{cfg.label}</span>
      </div>

      {/* Contenido */}
      <p style={{ fontSize: 15, color: '#2D2B26', lineHeight: 1.7, marginBottom: 16 }}>
        {post.contenido}
      </p>

      {/* Respuestas */}
      {respuestas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowRespuestas(!showRespuestas)} style={{
            background: 'transparent', border: 'none',
            fontSize: 12, color: '#6B7A5A', cursor: 'pointer', fontWeight: 600,
            padding: 0, marginBottom: showRespuestas ? 12 : 0,
          }}>
            {showRespuestas ? '▲ Ocultar' : `▼ Ver ${respuestas.length} respuesta${respuestas.length > 1 ? 's' : ''}`}
          </button>
          {showRespuestas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {respuestas.map(r => (
                <RespuestaItem key={r.id} respuesta={r} isAdmin={isAdmin} onEliminar={handleEliminarRespuesta} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario respuesta */}
      {respondiendo && miEmprendimiento && (
        <div style={{ marginBottom: 12, padding: '12px 16px', background: '#F5F0E8', borderRadius: 12 }}>
          <textarea
            value={textoRespuesta}
            onChange={e => setTextoRespuesta(e.target.value)}
            placeholder="Escribí tu respuesta..."
            maxLength={200}
            style={{
              width: '100%', minHeight: 70, padding: '8px 12px',
              border: '1.5px solid rgba(26,24,20,0.12)', borderRadius: 10,
              fontFamily: "'Syne', sans-serif", fontSize: 13, color: '#1A1814',
              background: '#FAFAF7', resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setRespondiendo(false)} style={{
              background: 'transparent', border: 'none', fontSize: 12,
              color: '#9A958A', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleResponder} disabled={savingResp || !textoRespuesta.trim()} style={{
              background: savingResp || !textoRespuesta.trim() ? '#EDE8DC' : '#6B7A5A',
              color: savingResp || !textoRespuesta.trim() ? '#9A958A' : '#FAFAF7',
              border: 'none', borderRadius: 100, padding: '6px 16px',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>{savingResp ? 'Enviando...' : 'Responder'}</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(26,24,20,0.06)' }}>
        <button onClick={() => onLike(post.id)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: liked ? '#EFF2EB' : 'transparent',
          border: `1px solid ${liked ? '#6B7A5A' : 'rgba(26,24,20,0.12)'}`,
          borderRadius: 100, padding: '5px 12px',
          fontSize: 12, fontWeight: 600,
          color: liked ? '#6B7A5A' : '#7A756A',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {liked ? '✅' : '👍'} {post.likes}
        </button>

        {miEmprendimiento && (
          <button onClick={() => setRespondiendo(!respondiendo)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent',
            border: '1px solid rgba(26,24,20,0.12)',
            borderRadius: 100, padding: '5px 12px',
            fontSize: 12, fontWeight: 600, color: '#7A756A',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            💬 Responder
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {userId && miEmprendimiento && emp.id !== miEmprendimiento.id && (
            <button onClick={() => onReportar(post.id)} style={{
              background: 'transparent', border: 'none',
              fontSize: 11, color: '#9A958A', cursor: 'pointer',
            }}>Reportar</button>
          )}
          {isAdmin && (
            <button onClick={() => onEliminarPost(post.id)} style={{
              background: '#C4664A', border: 'none', borderRadius: 100,
              padding: '4px 12px', fontSize: 11, fontWeight: 700,
              color: '#FAFAF7', cursor: 'pointer',
            }}>🗑️ Eliminar</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FeedClient({ posts: initialPosts, miEmprendimiento, userId, isAdmin }: {
  posts: Post[]
  miEmprendimiento: MiEmp | null
  userId: string | null
  isAdmin: boolean
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [tipo, setTipo] = useState<'win' | 'pregunta' | 'tip'>('win')
  const [contenido, setContenido] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'win' | 'pregunta' | 'tip'>('todos')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const supabase = createClient()
  const filtered = filtro === 'todos' ? posts : posts.filter(p => p.tipo === filtro)

  async function handlePost() {
    if (!miEmprendimiento) return
    setError(null)
    const validationError = validarPost(contenido)
    if (validationError) { setError(validationError); return }

    setSaving(true)
    const { data, error: dbError } = await supabase
      .from('posts')
      .insert({ emprendimiento_id: miEmprendimiento.id, tipo, contenido: contenido.trim() })
      .select(`id, tipo, contenido, likes, created_at, emprendimientos (id, nombre, rubro, slug, images)`)
      .single()

    if (dbError) { setError('Error al publicar. Intentá de nuevo.') }
    else if (data) { setPosts(prev => [{ ...(data as unknown as Post), respuestas: [] }, ...prev]); setContenido('') }
    setSaving(false)
  }

  async function handleLike(postId: number) {
    if (likedPosts.has(postId)) return
    setLikedPosts(prev => new Set([...prev, postId]))
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    await supabase.rpc('increment_post_likes', { post_id: postId })
  }

  async function handleReportar(postId: number) {
    if (!userId) return
    await supabase.from('post_reportes').insert({ post_id: postId, emprendimiento_id: miEmprendimiento?.id })
    alert('Post reportado. Lo revisaremos pronto.')
  }

  async function handleEliminarPost(postId: number) {
    if (!isAdmin) return
    if (!confirm('¿Eliminás este post?')) return
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5vw', height: 60,
        background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26,24,20,0.10)',
      }}>
        <Link href="/directorio" style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 22,
          color: '#1A1814', textDecoration: 'none', letterSpacing: '-0.5px',
        }}>
          Viko<span style={{ color: '#6B7A5A' }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/directorio" style={{ fontSize: 13, color: '#7A756A', textDecoration: 'none' }}>Directorio</Link>
          {isAdmin && (
            <Link href="/admin" style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: '#C4664A', color: '#fff', textDecoration: 'none' }}>
              Admin
            </Link>
          )}
          {userId ? (
            <Link href="/dashboard" style={{
              background: '#1A1814', color: '#FAFAF7', padding: '8px 18px',
              borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>Mi panel</Link>
          ) : (
            <Link href="/register" style={{
              background: '#1A1814', color: '#FAFAF7', padding: '8px 18px',
              borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>Publicar</Link>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 5vw' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#6B7A5A', marginBottom: 8 }}>
            Comunidad Viko
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#1A1814', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Feed de emprendedores
          </h1>
          <p style={{ fontSize: 15, color: '#7A756A', lineHeight: 1.6 }}>
            Wins, tips y preguntas de la comunidad. Solo emprendedores registrados pueden publicar.
          </p>
        </div>

        {/* FORMULARIO */}
        {miEmprendimiento ? (
          <div style={{
            background: '#FAFAF7', borderRadius: 20, padding: 24,
            border: '1px solid rgba(26,24,20,0.10)', marginBottom: 28,
            boxShadow: '0 2px 12px rgba(26,24,20,0.06)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1814', marginBottom: 14 }}>
              Publicar como <span style={{ color: '#6B7A5A' }}>{miEmprendimiento.nombre}</span>
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(Object.entries(TIPO_CONFIG) as [typeof tipo, typeof TIPO_CONFIG[typeof tipo]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setTipo(key)} style={{
                  padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${tipo === key ? cfg.color : 'rgba(26,24,20,0.12)'}`,
                  background: tipo === key ? cfg.bg : 'transparent',
                  color: tipo === key ? cfg.color : '#7A756A',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{cfg.label}</button>
              ))}
            </div>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)}
              placeholder={TIPO_CONFIG[tipo].desc + '...'} maxLength={300}
              style={{
                width: '100%', minHeight: 90, padding: '12px 16px',
                border: '1.5px solid rgba(26,24,20,0.12)', borderRadius: 12,
                fontFamily: "'Syne', sans-serif", fontSize: 14, color: '#1A1814',
                background: '#FAFAF7', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: contenido.length > 280 ? '#C4664A' : '#9A958A' }}>
                {contenido.length}/300
              </span>
              {error && <span style={{ fontSize: 12, color: '#C4664A' }}>⚠️ {error}</span>}
              <button onClick={handlePost} disabled={saving || !contenido.trim()} style={{
                background: saving || !contenido.trim() ? '#EDE8DC' : '#1A1814',
                color: saving || !contenido.trim() ? '#9A958A' : '#FAFAF7',
                border: 'none', borderRadius: 100, padding: '9px 22px',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                cursor: saving || !contenido.trim() ? 'default' : 'pointer',
              }}>{saving ? 'Publicando...' : 'Publicar'}</button>
            </div>
          </div>
        ) : !userId ? (
          <div style={{
            background: '#FAFAF7', borderRadius: 20, padding: 24, marginBottom: 28,
            border: '1px solid rgba(26,24,20,0.10)', textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#7A756A', marginBottom: 14 }}>
              ¿Tenés un emprendimiento? Registrate para participar en la comunidad.
            </p>
            <Link href="/register" style={{
              background: '#6B7A5A', color: '#FAFAF7', padding: '10px 24px',
              borderRadius: 100, fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>Publicar mi emprendimiento →</Link>
          </div>
        ) : null}

        {/* FILTROS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['todos', 'win', 'pregunta', 'tip'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${filtro === f ? '#1A1814' : 'rgba(26,24,20,0.12)'}`,
              background: filtro === f ? '#1A1814' : 'transparent',
              color: filtro === f ? '#FAFAF7' : '#7A756A', cursor: 'pointer',
            }}>
              {f === 'todos' ? '✦ Todos' : TIPO_CONFIG[f].label}
            </button>
          ))}
        </div>

        {/* POSTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#7A756A' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1814', marginBottom: 6 }}>No hay posts todavía</p>
              <p style={{ fontSize: 13 }}>Sé el primero en compartir algo con la comunidad.</p>
            </div>
          ) : (
            filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                miEmprendimiento={miEmprendimiento}
                userId={userId}
                isAdmin={isAdmin}
                onLike={handleLike}
                onReportar={handleReportar}
                onEliminarPost={handleEliminarPost}
                likedPosts={likedPosts}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}