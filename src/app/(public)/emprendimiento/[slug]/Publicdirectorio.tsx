'use client'
import Link from 'next/link'
import Image from 'next/image'
import styles from './public.module.css'

interface Emprendimiento {
  id: string
  nombre: string
  rubro: string
  tagline: string
  ubicacion?: string
  envios?: boolean
  whatsapp: string
  instagram?: string
  images?: string[]
  plan?: string
  slug: string
}

interface Props {
  emprendimientos: Emprendimiento[]
  titulo: string
}

function buildWA(whatsapp: string, nombre: string) {
  return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(
    `Hola ${nombre}! Vi tu perfil en Viko.`
  )}`
}

export default function PublicDirectorio({ emprendimientos, titulo }: Props) {
  return (
    <section className={styles.directorioSection}>
      <div className={styles.directorioInner}>
        <p className={styles.directorioLabel}>Seguí explorando</p>
        <h2 className={styles.directorioTitle}>{titulo}</h2>

        <div className={styles.directorioGrid}>
          {emprendimientos.map((e) => {
            const img = e.images?.[0]
            return (
              <div key={e.id} className={styles.dirCard}>
                <Link
                  href={`/emprendimiento/${e.slug}`}
                  className={styles.dirCardMain}
                >
                  <div className={styles.dirCardImg}>
                    {img ? (
                      <Image
                        src={img}
                        alt={e.nombre}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 700px) 100vw, 33vw"
                      />
                    ) : (
                      <div className={styles.dirCardImgPlaceholder}>📷</div>
                    )}
                    <span className={styles.dirCardBadge}>{e.rubro}</span>
                    {e.plan === 'premium' && (
                      <span className={styles.dirCardPremium}>Premium</span>
                    )}
                  </div>
                  <div className={styles.dirCardBody}>
                    <p className={styles.dirCardName}>{e.nombre}</p>
                    <p className={styles.dirCardTag}>{e.tagline}</p>
                    {e.ubicacion && (
                      <p className={styles.dirCardMeta}>
                        📍 {e.ubicacion} · {e.envios ? '🚚 Envíos' : '🏪 Local'}
                      </p>
                    )}
                  </div>
                </Link>

                <div className={styles.dirCardLinks}>
                  <a
                    href={buildWA(e.whatsapp, e.nombre)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.dirCardBtn}
                  >
                    💬
                  </a>
                  {e.instagram && (
                    <a
                      href={`https://instagram.com/${e.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.dirCardBtn}
                    >
                      📷
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.directorioFooter}>
          <Link href="/directorio" className="btn btn-outline">
            Ver todos los emprendimientos →
          </Link>
        </div>
      </div>
    </section>
  )
}