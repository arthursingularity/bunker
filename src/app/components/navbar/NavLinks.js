"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ userCargo }) {
    const pathname = usePathname();

    const links = [
        { href: "/caixa", label: "Caixa" },
    ];

    if (userCargo === "administrador") {
        links.push({ href: "/operacao", label: "Operação" });
        links.push({ href: "/estoque", label: "Estoque" });
        links.push({ href: "/servicos", label: "Serviços" });
        links.push({ href: "/historico", label: "Histórico" });
    }

    if (userCargo === "fundador") {
        links.push({ href: "/empresas", label: "Empresas" });
        links.push({ href: "/usuarios", label: "Usuarios" });
    }

    return (
        <div className="flex space-x-6 text-neutral-800 dark:text-white text-[14px]">
            {links.map((link) => {
                // Ativa a rota se for exatamente a rota ou uma subrota (ex: /caixa/novo)
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                
                return (
                    <Link key={link.href} href={link.href} className="relative group">
                        {link.label}
                        <span 
                            className={`absolute -bottom-[2px] left-0 w-full h-[1px] bg-current transition-all duration-200 origin-center rounded-full ${
                                isActive 
                                ? "opacity-100 scale-x-100" 
                                : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"
                            }`} 
                        />
                    </Link>
                );
            })}
        </div>
    );
}
