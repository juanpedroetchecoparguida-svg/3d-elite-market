import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    // TRUCO: "as any" para silenciar el error de tipos de Vercel
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirigir a la home
  return NextResponse.redirect(requestUrl.origin)
}