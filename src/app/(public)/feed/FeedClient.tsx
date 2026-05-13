"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../../lib/supabase";
import styles from "./feed.module.css";

interface Emprendimiento {
  id: number;
  nombre: string;
  rubro: string;
  slug: string;
  images?: string[];
}

interface Respuesta {
  id: number;
  contenido: string;
  created_at: string;
  emprendimientos: Emprendimiento | Emprendimiento[] | null;
}

interface Post {
  id: number;
  tipo: "win" | "pregunta" | "tip";
  contenido: string;
  likes: number;
  created_at: string;
  emprendimientos: Emprendimiento | Emprendimiento[] | null;
  respuestas?: Respuesta[];
}

interface MiEmp {
  id: number;
  nombre: string;
  plan: string;
}

const PALABRAS_PROHIBIDAS = [
  "crypto", "bitcoin", "ganar dinero rápido",
  "forex", "trading", "esquema", "pirámide",
];

const TIPO_CONFIG = {
  win:      { label: "🏆 Win",      color: "#6B7A5A", bg: "#EFF2EB", desc: "Compartí un logro" },
  pregunta: { label: "❓ Pregunta", color: "#4A90D9", bg: "#EBF3FB", desc: "Preguntale a la comunidad" },
  tip:      { label: "💡 Tip",      color: "#C9A84C", bg: "#FBF5E8", desc: "Compartí algo que aprendiste" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function validarPost(contenido: string): string | null {
  if (contenido.length < 20) return "El post debe tener al menos 20 caracteres";
  if (contenido.length > 300) return "El post no puede superar los 300 caracteres";
  const lower = contenido.toLowerCase();
  for (const palabra of PALABRAS_PROHIBIDAS) {
    if (lower.includes(palabra)) return `No se permiten posts con "${palabra}"`;
  }
  return null;
}

function getEmp(raw: Emprendimiento | Emprendimiento[] | null): Emprendimiento | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

function Avatar({ emp, size = 40 }: { emp: Emprendimiento; size?: number }) {
  const avatar = emp.images?.[0];
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {avatar ? (
        <Image src={avatar} alt={emp.nombre} fill style={{ objectFit: "cover" }} sizes="40px" />
      ) : (
        emp.nombre.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function RespuestaItem({ respuesta, isAdmin, onEliminar }: {
  respuesta: Respuesta; isAdmin: boolean; onEliminar: (id: number) => void;
}) {
  const emp = getEmp(respuesta.emprendimientos);
  if (!emp) return null;
  return (
    <div className={styles.respuestaItem}>
      <Avatar emp={emp} size={30} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link href={`/emprendimiento/${emp.slug}`} className={styles.respuestaAutor}>{emp.nombre}</Link>
          <span className={styles.respuestaTiempo}>{timeAgo(respuesta.created_at)}</span>
          {isAdmin && (
            <button onClick={() => onEliminar(respuesta.id)} className={styles.eliminarBtn} style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>🗑️</button>
          )}
        </div>
        <p className={styles.respuestaContenido}>{respuesta.contenido}</p>
      </div>
    </div>
  );
}

function PostCard({ post, miEmprendimiento, userId, isAdmin, onLike, onReportar, onEliminarPost, likedPosts }: {
  post: Post; miEmprendimiento: MiEmp | null; userId: string | null; isAdmin: boolean;
  onLike: (id: number) => void; onReportar: (id: number) => void;
  onEliminarPost: (id: number) => void; likedPosts: Set<number>;
}) {
  const [showRespuestas, setShowRespuestas] = useState(false);
  const [respuestas, setRespuestas] = useState<Respuesta[]>(post.respuestas ?? []);
  const [respondiendo, setRespondiendo] = useState(false);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [savingResp, setSavingResp] = useState(false);
  const supabase = createClient();

  const cfg = TIPO_CONFIG[post.tipo];
  const emp = getEmp(post.emprendimientos);
  const liked = likedPosts.has(post.id);
  if (!emp) return null;

  async function handleResponder() {
    if (!miEmprendimiento || !textoRespuesta.trim()) return;
    setSavingResp(true);
    const { data, error } = await supabase
      .from("respuestas")
      .insert({ post_id: post.id, emprendimiento_id: miEmprendimiento.id, contenido: textoRespuesta.trim() })
      .select(`id, contenido, created_at, emprendimientos (id, nombre, slug, images)`)
      .single();
    if (!error && data) {
      setRespuestas(prev => [...prev, data as unknown as Respuesta]);
      setTextoRespuesta(""); setRespondiendo(false); setShowRespuestas(true);
    }
    setSavingResp(false);
  }

  async function handleEliminarRespuesta(id: number) {
    if (!isAdmin) return;
    await supabase.from("respuestas").delete().eq("id", id);
    setRespuestas(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className={`${styles.postCard} ${isAdmin ? styles.postCardAdmin : ""}`}>
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <Avatar emp={emp} />
          <div>
            <Link href={`/emprendimiento/${emp.slug}`} className={styles.postAuthorName}>{emp.nombre}</Link>
            <p className={styles.postAuthorMeta}>{emp.rubro} · {timeAgo(post.created_at)}</p>
          </div>
        </div>
        <span className={styles.tipoBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
          {cfg.label}
        </span>
      </div>

      <p className={styles.postContenido}>{post.contenido}</p>

      {respuestas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button className={styles.respuestasToggle} onClick={() => setShowRespuestas(!showRespuestas)}>
            {showRespuestas ? "▲ Ocultar" : `▼ Ver ${respuestas.length} respuesta${respuestas.length > 1 ? "s" : ""}`}
          </button>
          {showRespuestas && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {respuestas.map(r => <RespuestaItem key={r.id} respuesta={r} isAdmin={isAdmin} onEliminar={handleEliminarRespuesta} />)}
            </div>
          )}
        </div>
      )}

      {respondiendo && miEmprendimiento && (
        <div className={styles.respuestaForm}>
          <textarea className={styles.respuestaTextarea} value={textoRespuesta}
            onChange={e => setTextoRespuesta(e.target.value)}
            placeholder="Escribí tu respuesta..." maxLength={200} />
          <div className={styles.respuestaFormFooter}>
            <button className={styles.cancelBtn} onClick={() => setRespondiendo(false)}>Cancelar</button>
            <button className={`${styles.responderBtn} ${savingResp || !textoRespuesta.trim() ? styles.responderBtnDisabled : styles.responderBtnActive}`}
              onClick={handleResponder} disabled={savingResp || !textoRespuesta.trim()}>
              {savingResp ? "Enviando..." : "Responder"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.postFooter}>
        <button className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : styles.likeBtnInactive}`} onClick={() => onLike(post.id)}>
          {liked ? "✅" : "👍"} {post.likes}
        </button>
        {miEmprendimiento && (
          <button className={styles.responderToggleBtn} onClick={() => setRespondiendo(!respondiendo)}>
            💬 Responder
          </button>
        )}
        <div className={styles.postFooterRight}>
          {userId && miEmprendimiento && emp.id !== miEmprendimiento.id && (
            <button className={styles.reportarBtn} onClick={() => onReportar(post.id)}>Reportar</button>
          )}
          {isAdmin && (
            <button className={styles.eliminarBtn} onClick={() => onEliminarPost(post.id)}>🗑️ Eliminar</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedClient({ posts: initialPosts, miEmprendimiento, userId, isAdmin }: {
  posts: Post[]; miEmprendimiento: MiEmp | null; userId: string | null; isAdmin: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [tipo, setTipo] = useState<"win" | "pregunta" | "tip">("win");
  const [contenido, setContenido] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "win" | "pregunta" | "tip">("todos");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const supabase = createClient();

  const filtered = filtro === "todos" ? posts : posts.filter(p => p.tipo === filtro);

  async function handlePost() {
    if (!miEmprendimiento) return;
    setError(null);
    const validationError = validarPost(contenido);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const { data, error: dbError } = await supabase.from("posts")
      .insert({ emprendimiento_id: miEmprendimiento.id, tipo, contenido: contenido.trim() })
      .select(`id, tipo, contenido, likes, created_at, emprendimientos (id, nombre, rubro, slug, images)`)
      .single();
    if (dbError) { setError("Error al publicar. Intentá de nuevo."); }
    else if (data) { setPosts(prev => [{ ...(data as unknown as Post), respuestas: [] }, ...prev]); setContenido(""); }
    setSaving(false);
  }

  async function handleLike(postId: number) {
    if (likedPosts.has(postId)) return;
    setLikedPosts(prev => new Set([...prev, postId]));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    await supabase.rpc("increment_post_likes", { post_id: postId });
  }

  async function handleReportar(postId: number) {
    if (!userId) return;
    await supabase.from("post_reportes").insert({ post_id: postId, emprendimiento_id: miEmprendimiento?.id });
    alert("Post reportado. Lo revisaremos pronto.");
  }

  async function handleEliminarPost(postId: number) {
    if (!isAdmin) return;
    if (!confirm("¿Eliminás este post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/directorio" className={styles.navLogo}>
          Viko<span className={styles.navDot}>.</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/directorio" className={styles.navLink}>Directorio</Link>
          {isAdmin && <Link href="/admin" className={styles.navAdmin}>Admin</Link>}
          {userId
            ? <Link href="/dashboard" className={styles.navBtn}>Mi panel</Link>
            : <Link href="/register" className={styles.navBtn}>Publicar</Link>
          }
        </div>
      </nav>

      <div className={styles.inner}>
        <div style={{ marginBottom: 32 }}>
          <p className={styles.headerLabel}>Comunidad Viko</p>
          <h1 className={styles.headerTitle}>Feed de emprendedores</h1>
          <p className={styles.headerSub}>Wins, tips y preguntas de la comunidad. Solo emprendedores registrados pueden publicar.</p>
        </div>

        {miEmprendimiento ? (
          <div className={styles.formulario}>
            <p className={styles.formularioLabel}>
              Publicar como <span className={styles.formularioNombre}>{miEmprendimiento.nombre}</span>
            </p>
            <div className={styles.tipoRow}>
              {(Object.entries(TIPO_CONFIG) as [typeof tipo, typeof TIPO_CONFIG[typeof tipo]][]).map(([key, cfg]) => (
                <button key={key} className={styles.tipoBtn} onClick={() => setTipo(key)}
                  style={{
                    border: `1.5px solid ${tipo === key ? cfg.color : "var(--border)"}`,
                    background: tipo === key ? cfg.bg : "transparent",
                    color: tipo === key ? cfg.color : "var(--muted)",
                  }}>
                  {cfg.label}
                </button>
              ))}
            </div>
            <textarea className={styles.textarea} value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder={TIPO_CONFIG[tipo].desc + "..."} maxLength={300} />
            <div className={styles.formularioFooter}>
              <span className={contenido.length > 280 ? styles.charCountWarn : styles.charCount}>
                {contenido.length}/300
              </span>
              {error && <span className={styles.errorMsg}>⚠️ {error}</span>}
              <button className={`${styles.publishBtn} ${saving || !contenido.trim() ? styles.publishBtnDisabled : styles.publishBtnActive}`}
                onClick={handlePost} disabled={saving || !contenido.trim()}>
                {saving ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        ) : !userId ? (
          <div className={styles.registerCta}>
            <p className={styles.registerCtaText}>¿Tenés un emprendimiento? Registrate para participar en la comunidad.</p>
            <Link href="/register" className={styles.registerCtaBtn}>Publicar mi emprendimiento →</Link>
          </div>
        ) : null}

        <div className={styles.filtros}>
          {(["todos", "win", "pregunta", "tip"] as const).map(f => (
            <button key={f} className={`${styles.filtroBtn} ${filtro === f ? styles.filtroBtnActive : styles.filtroBtnInactive}`}
              onClick={() => setFiltro(f)}>
              {f === "todos" ? "✦ Todos" : TIPO_CONFIG[f].label}
            </button>
          ))}
        </div>

        <div className={styles.postsList}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>💬</p>
              <p className={styles.emptyTitle}>No hay posts todavía</p>
              <p className={styles.emptySub}>Sé el primero en compartir algo con la comunidad.</p>
            </div>
          ) : (
            filtered.map(post => (
              <PostCard key={post.id} post={post} miEmprendimiento={miEmprendimiento}
                userId={userId} isAdmin={isAdmin} onLike={handleLike}
                onReportar={handleReportar} onEliminarPost={handleEliminarPost} likedPosts={likedPosts} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}