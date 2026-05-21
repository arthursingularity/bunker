import { getServerSession } from "next-auth";
export const metadata = { title: "Estoque" };
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NavBar from "../components/navbar/NavBar";
import EstoqueTable from "../components/EstoqueTable";

export default async function Estoque() {
  const session = await getServerSession(authOptions);

  let empresa = null;
  try {
    const res = await fetch(`http://localhost:3001/api/empresas/${session?.user?.empresa_id}`, {
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

  return (
    <div className=" min-h-screen">
      <NavBar />
      <div className="pt-[40px]">
        <EstoqueTable apiToken={session?.user?.apiToken} />
      </div>
    </div>
  );
}
