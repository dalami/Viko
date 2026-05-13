import { createClient } from '../../lib/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar que sea admin
  const { data: adminData } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminData) redirect('/directorio')

  // Traer posts para moderar
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, tipo, contenido, likes, visible, created_at,
      emprendimientos (id, nombre, rubro, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Traer reportes
  const { data: reportes } = await supabase
    .from('post_reportes')
    .select('post_id')

  // Traer emprendimientos
  const { data: emprendimientos } = await supabase
    .from('emprendimientos')
    .select('id, nombre, rubro, plan, visible, slug, created_at')
    .order('created_at', { ascending: false })

  // Contar reportes por post
  const reportesPorPost: Record<number, number> = {}
  reportes?.forEach(r => {
    reportesPorPost[r.post_id] = (reportesPorPost[r.post_id] || 0) + 1
  })

  return (
    <AdminClient
      posts={posts ?? []}
      emprendimientos={emprendimientos ?? []}
      reportesPorPost={reportesPorPost}
    />
  )
}