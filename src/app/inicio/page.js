import { getServerSession } from "next-auth";
export const metadata = { title: "Dashboard" };
import { authOptions } from "../api/auth/[...nextauth]/route";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import NavBar from "../components/navbar/NavBar";
import { API_URL } from "@/config/api";

export default async function Inicio() {
  const session = await getServerSession(authOptions);

  let empresa = null;
  try {
    const res = await fetch(`${API_URL}/api/empresas/${session?.user?.empresa_id}`, {
      headers: {
        Authorization: `Bearer ${session?.user?.apiToken}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      empresa = await res.json();
    }
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
  }

  // 3. Renderiza um Dashboard no padrão macOS HIG (System Colors, Sidebar, Toolbar)
  return (
    <div>
      <NavBar />
      <div className="hidden flex h-screen w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased overflow-hidden selection:bg-blue-500/30">
        {/* Sidebar (Mac OS Style) */}
        <aside className="w-[260px] hidden flex-shrink-0 bg-[#ebebeb]/80 dark:bg-[#2c2c2e]/80 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 flex flex-col justify-between">
          <div className="p-4">
            {/* Brand/App Title */}
            <div className="flex items-center gap-3 px-2 mb-6 mt-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-semibold shadow-sm text-sm">
                {empresa ? empresa.nome_fantasia.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[13px] leading-tight">
                  {empresa ? empresa.nome_fantasia : 'Carregando Loja...'}
                </span>
                <span className="text-[11px] text-black/50 dark:text-white/50 font-medium">Conta Corporativa</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              <Link href="/sistema" className="px-2 py-1.5 rounded-md bg-blue-500 text-white text-[13px] font-medium shadow-sm block">
                Visão Geral
              </Link>
              <Link href="/sistema/produtos" className="px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[13px] font-medium transition-colors text-black/80 dark:text-white/80 block">
                Produtos
              </Link>
              <div className="px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[13px] font-medium transition-colors cursor-default text-black/80 dark:text-white/80 block">
                Vendas
              </div>
              <div className="px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[13px] font-medium transition-colors cursor-default text-black/80 dark:text-white/80 block">
                Relatórios
              </div>
            </nav>
          </div>

          {/* User Info / Bottom Section */}
          <div className="p-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium leading-tight">{session?.user?.nome || 'Usuário'}</span>
                <span className="text-[11px] text-black/50 dark:text-white/50">{session?.user?.cargo ? session.user.cargo.replace('_', ' ') : 'N/A'}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative z-0 bg-[#f5f5f7] dark:bg-[#1c1c1e]">
          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">

              <h2 className="text-[28px] font-semibold mb-6 tracking-tight">Estatísticas</h2>

              {/* Dashboard Cards (Native panels) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white dark:bg-[#2c2c2e] p-5 rounded-xl border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between h-[120px]">
                  <h3 className="text-[13px] text-black/50 dark:text-white/50 font-medium">Vendas Hoje</h3>
                  <p className="text-3xl font-semibold tracking-tight">R$ 0,00</p>
                </div>
                <div className="bg-white dark:bg-[#2c2c2e] p-5 rounded-xl border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between h-[120px]">
                  <h3 className="text-[13px] text-black/50 dark:text-white/50 font-medium">Produtos Ativos</h3>
                  <p className="text-3xl font-semibold tracking-tight">0</p>
                </div>
              </div>

              {/* Mac Data Table Style */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold">Atividades Recentes</h3>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10">
                        <th className="px-4 py-2 text-[12px] font-medium text-black/50 dark:text-white/50">Data</th>
                        <th className="px-4 py-2 text-[12px] font-medium text-black/50 dark:text-white/50">Descrição</th>
                        <th className="px-4 py-2 text-[12px] font-medium text-black/50 dark:text-white/50">Status</th>
                        <th className="px-4 py-2 text-[12px] font-medium text-black/50 dark:text-white/50 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[13px]">17/05/2026</td>
                        <td className="px-4 py-3 text-[13px] font-medium">Venda de Produto A</td>
                        <td className="px-4 py-3 text-[13px]">
                          <span className="flex items-center gap-1.5 text-black/60 dark:text-white/60">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></span> Concluído
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right">R$ 150,00</td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[13px]">16/05/2026</td>
                        <td className="px-4 py-3 text-[13px] font-medium">Venda de Produto B</td>
                        <td className="px-4 py-3 text-[13px]">
                          <span className="flex items-center gap-1.5 text-black/60 dark:text-white/60">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm"></span> Pendente
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right">R$ 89,90</td>
                      </tr>
                      <tr className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[13px]">15/05/2026</td>
                        <td className="px-4 py-3 text-[13px] font-medium">Cancelamento de Compra</td>
                        <td className="px-4 py-3 text-[13px]">
                          <span className="flex items-center gap-1.5 text-black/60 dark:text-white/60">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span> Cancelado
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right">- R$ 45,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>

  );
}