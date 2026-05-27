"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { API_URL } from "@/config/api";

export default function GarantiaPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [service, setService] = useState(null);
    const [error, setError] = useState(null);

    // Get search parameters passed from the PDV checkout flow
    const prazoGarantia = searchParams.get("garantia") || "3 Meses";
    const naoCobre = searchParams.get("naoCobre") || "Arranhões, trincado, água.";

    useEffect(() => {
        if (!id) return;
        
        const fetchGarantia = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/servicos/public-garantia/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setService(data);
                } else {
                    const errData = await res.json();
                    setError(errData.erro || "Falha ao carregar a nota de garantia.");
                }
            } catch (err) {
                console.error("Erro na busca de garantia:", err);
                setError("Erro de conexão ao carregar a nota.");
            } finally {
                setLoading(false);
            }
        };

        fetchGarantia();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-neutral-800 border-t-emerald-500 animate-spin"></div>
                <span className="text-xs font-mono tracking-wider text-neutral-500 uppercase">Consultando registro...</span>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-rose-500 !text-[44px]">error_outline</span>
                    <h2 className="text-sm font-semibold text-white tracking-tight uppercase">Comprovante Inexistente</h2>
                    <p className="text-xs text-neutral-400">{error || "Esta nota de garantia não pôde ser encontrada no sistema."}</p>
                    <a href="/login" className="mt-2 text-xs text-neutral-500 hover:text-white underline font-mono transition">Acessar Sistema</a>
                </div>
            </div>
        );
    }

    const precoFinal = parseFloat(service.preco_venda || service.preco || 0);

    return (
        <div className="min-h-screen bg-black text-neutral-100 font-sans flex flex-col items-center justify-start py-12 px-4 selection:bg-neutral-800 selection:text-white">
            
            {/* Custom styles for clean, technical paper-size printing */}
            <style jsx global>{`
                @media print {
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-card {
                        border: 1px solid #e5e5e5 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        border-radius: 8px !important;
                        margin: 0 auto !important;
                        max-width: 100% !important;
                    }
                    .print-text-white {
                        color: #000000 !important;
                    }
                    .print-text-muted {
                        color: #525252 !important;
                    }
                    .print-divider {
                        border-color: #e5e5e5 !important;
                    }
                    .print-badge {
                        background: #f5f5f5 !important;
                        border-color: #e5e5e5 !important;
                        color: #000000 !important;
                    }
                    .print-header-bg {
                        background: #000000 !important;
                        color: #ffffff !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[480px] flex flex-col gap-6">
                
                {/* Print/Back Action Bar (Invisible during print) */}
                <div className="no-print flex items-center justify-between bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Status: Garantia Ativa</span>
                    </div>
                    
                    <button
                        onClick={handlePrint}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse-subtle"
                    >
                        <span className="material-symbols-outlined !text-[15px]">print</span>
                        <span>Imprimir / PDF</span>
                    </button>
                </div>

                {/* SLICK VERCEL-STYLE WARRANTY CARD */}
                <div className="print-card bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl transition duration-300">
                    
                    {/* Dark Premium Technical Header */}
                    <div className="print-header-bg bg-neutral-900/60 border-b border-neutral-800 px-6 py-5 flex flex-col items-center text-center gap-1">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-400 uppercase font-mono">
                            Comprovante de Garantia Oficial
                        </span>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase font-mono mt-1">
                            GARANTIA
                        </h1>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 flex flex-col gap-5">
                        
                        {/* 1. Loja Details */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">storefront</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Loja</span>
                                <span className="print-text-white text-sm font-bold text-white uppercase truncate">
                                    {service.empresas?.nome_fantasia || "Imports Klein"}
                                </span>
                                <span className="print-text-muted text-[10px] text-neutral-400 mt-0.5 font-mono">
                                    CNPJ: {service.empresas?.cnpj || "62.818.946/0001-17"}
                                </span>
                            </div>
                        </div>

                        <hr className="print-divider border-neutral-800/80" />

                        {/* 2. Cliente Details */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">person</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Cliente</span>
                                <span className="print-text-white text-sm font-bold text-white uppercase truncate">
                                    {service.clientes?.nome_completo || "Cliente Não Informado"}
                                </span>
                                {service.clientes?.telefone && (
                                    <span className="print-text-muted text-[10px] text-neutral-400 mt-0.5 font-mono">
                                        WhatsApp: {service.clientes.telefone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <hr className="print-divider border-neutral-800/80" />

                        {/* 3. Modelo / Aparelho */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">smartphone</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Modelo / Aparelho</span>
                                <span className="print-text-white text-sm font-bold text-white uppercase truncate">
                                    {service.produto || "Aparelho Geral"}
                                </span>
                            </div>
                        </div>

                        <hr className="print-divider border-neutral-800/80" />

                        {/* 4. Serviço Realizado */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">build</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Serviço</span>
                                <span className="print-text-white text-sm font-bold text-white uppercase truncate">
                                    {service.descricao}
                                </span>
                            </div>
                        </div>

                        <hr className="print-divider border-neutral-800/80" />

                        {/* 5. Período Vigência */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">verified_user</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">Prazo de Vigência</span>
                                <span className="print-text-white text-sm font-bold text-emerald-400 uppercase font-mono tracking-wide">
                                    {prazoGarantia.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <hr className="print-divider border-neutral-800/80" />

                        {/* 6. Exclusões / O que não cobre */}
                        <div className="flex gap-4 items-start">
                            <div className="print-badge shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined !text-[20px]">cancel</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">A Garantia Não Cobre</span>
                                <span className="print-text-white text-xs font-medium text-neutral-300 mt-1 leading-relaxed">
                                    {naoCobre}
                                </span>
                            </div>
                        </div>

                        {/* Technical Footer Pricing read-out */}
                        <div className="print-divider border-t border-neutral-800/80 pt-5 mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-neutral-500 font-mono text-[10px] uppercase">
                                <span className="material-symbols-outlined !text-[13px]">sell</span>
                                <span>Valor do Serviço</span>
                            </div>
                            <div className="print-text-white text-2xl font-bold text-white font-mono tracking-tight">
                                R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Public footer note */}
                <div className="no-print text-center flex flex-col gap-1 mt-2">
                    <p className="text-[10px] text-neutral-600 font-mono">Bunker Digital Certification Service &copy; 2026</p>
                    <p className="text-[9px] text-neutral-700">Este documento possui validade jurídica como termo de garantia.</p>
                </div>

            </div>
        </div>
    );
}
