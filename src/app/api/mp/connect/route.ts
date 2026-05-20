import { createClient } from "../../../../lib/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_BASE_URL!),
    );

  const clientId = process.env.MP_CLIENT_ID!;
  const redirectUri = `https://www.viko.com.ar/api/mp/callback`;

  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`

  return NextResponse.redirect(authUrl);
}
