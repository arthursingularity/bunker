import { getServerSession } from "next-auth";
export const metadata = { title: "Usuários" };
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import NavBar from "../components/navbar/NavBar";
import UsersTable from "../components/UsersTable";
import { API_URL } from "@/config/api";

export default async function UsuariosPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.cargo !== "fundador") {
        redirect("/inicio");
    }

    let usuarios = [];

    try {
        const res = await fetch(`${API_URL}/api/usuarios`, {
            headers: { Authorization: `Bearer ${session?.user?.apiToken}` },
            cache: 'no-store'
        });
        
        if (res.ok) {
            usuarios = await res.json();
        } else {
            console.error("Failed to fetch usuarios", res.status);
        }
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
    }

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <NavBar />
            <div className="pt-[80px] px-8 max-w-[1400px] mx-auto">
                <div className="flex flex-col space-y-6">
                    <div>
                        <h1 className="text-2xl font-medium text-neutral-900 dark:text-white tracking-tight">Usuários</h1>
                        <p className="text-sm text-neutral-500 font-light mt-1">Gerencie os usuários, cargos e permissões do sistema.</p>
                    </div>
                    
                    <UsersTable initialUsers={usuarios} />
                </div>
            </div>
        </main>
    );
}
