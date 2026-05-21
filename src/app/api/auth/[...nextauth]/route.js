import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Exportamos a configuração para podermos usá-la em Server Components depois
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "admin@loja.com" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:3001/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              senha: credentials?.senha,
            }),
          });
          const data = await res.json();
          if (res.ok && data) return data;
          throw new Error(data?.erro || "Erro de autenticação");
        } catch (error) {
          throw new Error(error.message || "Falha na comunicação com o servidor.");
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nome = user.nome; // Adicionado!
        token.cargo = user.cargo;
        token.empresa_id = user.empresa_id; // Adicionado!
        token.apiToken = user.token; 
        token.img_url = user.img_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.nome = token.nome; // Adicionado!
        session.user.cargo = token.cargo;
        session.user.empresa_id = token.empresa_id; // Adicionado!
        session.user.apiToken = token.apiToken; 
        session.user.img_url = token.img_url;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };