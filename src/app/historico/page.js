import { getServerSession } from "next-auth";
export const metadata = { title: "Histórico de Vendas" };
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NavBar from "../components/navbar/NavBar";
import HistoricoVendasTable from "../components/HistoricoVendasTable";

export default async function HistoricoVendas() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-100">
      <NavBar />
      <div className="pt-[40px]">
        <HistoricoVendasTable apiToken={session?.user?.apiToken} />
      </div>
    </div>
  );
}
