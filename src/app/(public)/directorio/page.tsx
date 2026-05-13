import { createClient } from '../../../lib/server'
import DirectorioClient from './DirectorioClient'

export const metadata = {
  title: 'Viko — Directorio de Emprendimientos',
  description: 'Descubrí marcas independientes con identidad propia.',
}

export default async function DirectorioPage() {
  const supabase = await createClient()

  const { data: emprendimientos } = await supabase
    .from('emprendimientos')
    .select('id, nombre, rubro, tagline, ubicacion, envios, whatsapp, instagram, web, images, plan, destacadoSemana, descripcion, slug')
    .eq('visible', true)
    .order('plan', { ascending: true })

  return <DirectorioClient emprendimientos={emprendimientos ?? []} />
}
