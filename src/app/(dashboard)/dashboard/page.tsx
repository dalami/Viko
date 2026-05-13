import { createClient } from '../../../lib/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: emprendimiento } = await supabase
    .from('emprendimientos')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('emprendimiento_id', emprendimiento?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email }}
      emprendimiento={emprendimiento ?? {
        id: '', nombre: '', rubro: '', tagline: '', desc: '',
        ubicacion: '', whatsapp: '', instagram: '', email: '',
        web: '', envios: false, visible: true, images: [], plan: 'basic'
      }}
      productos={productos ?? []}
    />
  )
}
