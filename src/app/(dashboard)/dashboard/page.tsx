import { createClient } from '../../../lib/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: emprendimiento } = await supabase
    .from('emprendimientos')
    .select(`
      id, nombre, rubro, tagline, descripcion, ubicacion,
      whatsapp, instagram, email, web, envios, visible,
      images, plan, slug,
      historia_origen, historia_diferencia, historia_cliente,
      highlights, mp_connected, mp_access_token,
      transferencia_activa, transferencia_cbu, efectivo_activo, plantilla
    `)
    .eq('user_id', user.id)
    .single()

  if (!emprendimiento) redirect('/register')

  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, precio, precio_descuento, stock, tags, orden, descripcion, categoria, imagen, variantes, activo, emprendimiento_id')
    .eq('emprendimiento_id', emprendimiento.id)
    .order('orden', { ascending: true })

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email }}
      emprendimiento={emprendimiento}
      productos={productos ?? []}
    />
  )
}