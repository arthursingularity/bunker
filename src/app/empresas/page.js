"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmpresasPage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/operacao");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-light text-neutral-400">Redirecionando...</p>
            </div>
        </div>
    );
}
