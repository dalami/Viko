import { createClient } from "../../../../lib/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_BASE_URL!)
  );

  const clientId = process.env.ML_CLIENT_ID!;
  const redirectUri = `https://viko.com.ar/api/ml/callback`;

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.id}`;

  return NextResponse.redirect(authUrl);
}