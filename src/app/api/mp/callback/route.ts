import { createClient } from '../../../../lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?mp=error`)
  }

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('MP OAuth error:', tokenData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?mp=error`)
    }

    // Guardar token en el emprendimiento del usuario
    const supabase = await createClient()
    await supabase
      .from('emprendimientos')
      .update({
        mp_access_token: tokenData.access_token,
        mp_connected: true,
      })
      .eq('user_id', userId)

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?mp=conectado`)

  } catch (err) {
    console.error('MP callback error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?mp=error`)
  }
}