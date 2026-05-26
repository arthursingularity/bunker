import { getServerSession } from "next-auth";
export const metadata = { title: "Caixa" };
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NavBar from "../components/navbar/NavBar";
import CaixaPDV from "../components/CaixaPDV";

export default async function Caixa() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors duration-200">
      <NavBar />
      <div className="pt-[40px]">
        <CaixaPDV apiToken={session?.user?.apiToken} />
      </div>
    </div>
  );
}