import { getServerSession } from "next-auth";
import NavMenu from "./NavMenu";
import NavLinks from "./NavLinks";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { API_URL } from "@/config/api";

export default async function NavBar() {
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

    return (
        <div className="fixed h-[40px] bg-white dark:bg-neutral-950 w-full px-4 flex justify-between items-center border-b borderColor">
            <div className="flex items-center space-x-4">
                <img src="/images/logoBlack.svg" className="w-[60px] block dark:hidden" />
                <img src="/images/logoWhite.svg" className="w-[60px] hidden dark:block" />
                <div className="w-[1px] h-[25px] bg-neutral-300 dark:bg-neutral-800" />
                <div className="flex items-center space-x-2">
                    <img src={empresa ? empresa.logo_url : ''} className="w-[17px] h-auto" />
                    <span className="font-light text-[14px]">{empresa ? empresa.nome_fantasia : 'Carregando...'}</span>
                </div>
            </div>
            <div className="absolute flex justify-center left-1/2 transform -translate-x-1/2">
                <NavLinks userCargo={session?.user?.cargo} />
            </div>
            <div className="flex items-center space-x-2">
                <div className="hover:bg-neutral-200 dark:hover:bg-neutral-800 p-[2px] flex items-center justify-center w-[28px] h-[28px] rounded cursor-pointer">
                    <span className="material-symbols-outlined !text-[21px]">
                        notifications
                    </span>
                </div>
                <NavMenu />
                <div className="flex flex-col leading-[1.0] text-right hidden">
                    <span className="text-[14px] text-neutral-800">{session?.user?.nome || 'Usuário'}</span>
                    <span className="text-[11px] text-neutral-500 tracking-wide">{session?.user?.cargo ? session.user.cargo : 'N/A'}</span>
                </div>
                <div className="buttonHover rounded-full w-[29px] h-[29px] ml-1 overflow-hidden bg-blue-500 text-white flex items-center justify-center">
                    <img src={session?.user?.img_url || ''} className="w-[40px] h-[40px] object-cover object-center" />
                </div>
            </div>
        </div>
    )
}