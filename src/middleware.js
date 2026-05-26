import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Exporta uma função nativa padrão que o Next.js reconhece perfeitamente
export async function middleware(req) {
  // Puxa o token do cookie do navegador
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Lista de rotas que exigem autenticação
  const rotasProtegidas = ["/caixa", "/operacao", "/historico", "/estoque", "/usuarios", "/empresas", "/servicos"];

  // Verifica se a rota atual começa com alguma das rotas protegidas
  const ehRotaProtegida = rotasProtegidas.some((rota) => pathname.startsWith(rota));

  // Se o usuário tentar acessar uma rota protegida e NÃO tiver o token
  if (ehRotaProtegida && !token) {
    // Redireciona ele para a tela de login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Se o usuário estiver autenticado e tentar acessar a tela de login, redireciona para a home do sistema 
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/operacao", req.url));
  }

  // Se estiver tudo certo, deixa o usuário seguir em frente
  return NextResponse.next();
}

export const config = {
  // Define quais rotas o middleware vai ficar vigiando
  matcher: [
    "/caixa/:path*",
    "/operacao/:path*",
    "/historico/:path*",
    "/estoque/:path*",
    "/usuarios/:path*",
    "/empresas/:path*",
    "/servicos/:path*",
    "/login"
  ],
};