import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import NavBar from "../components/navbar/NavBar";
import ServicosDashboard from "../components/ServicosDashboard";

export const metadata = {
    title: "Serviços — Painel Técnico",
    description: "Central de ordens de serviço, manutenção, consertos e cadastro unificado de clientes."
};

export default async function ServicosPage() {
    const session = await getServerSession(authOptions);

    // Se não estiver logado, redireciona para a página de login
    if (!session) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100 transition-colors duration-200">
            <NavBar />
            <div className="pt-[80px] pb-12 px-8 max-w-[1400px] mx-auto">
                <ServicosDashboard apiToken={session?.user?.apiToken} />
            </div>
        </main>
    );
}