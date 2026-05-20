import { createClient } from "../../../../lib/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ml=error`
    );
  }

  try {
    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code,
        redirect_uri: `https://www.viko.com.ar/api/ml/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("ML TOKEN RESPONSE:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ml=error`
      );
    }

    const supabase = await createClient();
    await supabase
      .from("emprendimientos")
      .update({
        ml_access_token: tokenData.access_token,
        ml_refresh_token: tokenData.refresh_token,
        ml_connected: true,
        ml_user_id: tokenData.user_id?.toString(),
      })
      .eq("user_id", userId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?view=mercadolibre&ml=conectado`
    );
  } catch (e) {
    console.log("ML CALLBACK ERROR:", e);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?ml=error`
    );
  }
}