import { redirect } from "next/navigation";

export const metadata = { title: "Início" };

export default function Home() {
  // O redirecionamento ocorre no lado do servidor antes da renderização
  redirect("/login");
}