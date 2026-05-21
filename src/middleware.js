import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Exporta uma função nativa padrão que o Next.js reconhece perfeitamente
export async function middleware(req) {
  // Puxa o token do cookie do navegador
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Se o usuário tentar acessar a rota /sistema ou sub-rotas e NÃO tiver o token
  if (!token && req.nextUrl.pathname.startsWith("/sistema")) {
    // Redireciona ele para a tela de login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Se estiver tudo certo, deixa o usuário seguir em frente
  return NextResponse.next();
}

export const config = {
  // Define quais rotas o middleware vai ficar vigiando
  matcher: ["/inicio/:path*"],
};