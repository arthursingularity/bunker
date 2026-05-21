"use client";

import React, { useState, useEffect } from "react";
import CadastroProdutoModal from "./CadastroProdutoModal";

export default function EstoqueTable({ apiToken }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProducts = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/api/produtos", {
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                console.error("Erro ao buscar produtos");
            }
        } catch (err) {
            console.error("Erro na requisição de produtos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [apiToken]);

    // Flat-map products and their variations to row list
    const rows = products.flatMap(product => {
        if (!product.variacoes || product.variacoes.length === 0) {
            return [{
                rowId: `p-${product.id}`,
                productId: product.id,
                codigo: product.codigo || "-",
                nome: product.nome,
                marca: product.marca,
                variacao: "Sem variação",
                preco_custo: 0,
                preco_venda: 0,
                qtd_estoque: 0,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }];
        }
        return product.variacoes.map(v => ({
            rowId: `v-${v.id}`,
            productId: product.id,
            variationId: v.id,
            codigo: product.codigo || "-",
            nome: product.nome,
            marca: product.marca,
            variacao: `${v.tamanho} / ${v.cor}`,
            preco_custo: parseFloat(v.preco_custo) || 0,
            preco_venda: parseFloat(v.preco_venda) || 0,
            qtd_estoque: v.qtd_estoque,
            createdAt: v.createdAt || product.createdAt,
            updatedAt: v.updatedAt || product.updatedAt
        }));
    });

    const toggleRow = (rowId) => {
        setSelectedRows(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    const toggleAll = () => {
        const allSelected = rows.length > 0 && rows.every(row => selectedRows[row.rowId]);
        if (allSelected) {
            setSelectedRows({});
        } else {
            const newSelected = {};
            rows.forEach(row => {
                newSelected[row.rowId] = true;
            });
            setSelectedRows(newSelected);
        }
    };

    const isAllSelected = rows.length > 0 && rows.every(row => selectedRows[row.rowId]);

    // Formatters
    const formatCurrency = (val) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }).format(d).replace(".", "");
        } catch (e) {
            return "-";
        }
    };

    return (
        <div className="w-full px-5 py-4">
            <div className="h-[27px] mb-4">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="font-light dark:bg-white bg-black dark:text-black buttonHover text-white rounded pr-4 pl-1.5 space-x-1 text-[14px] h-full flex items-center justify-center cursor-pointer"
                >
                    <span className="material-symbols-outlined !text-[26px]">
                        add
                    </span>
                    <p>Produto</p>
                </button>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-neutral-300 dark:border-neutral-800">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-neutral-400 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-900">
                            <th className="py-3 pl-5 pr-2 w-[40px]">
                                <div
                                    onClick={toggleAll}
                                    className={`w-[15px] h-[15px] rounded border flex items-center justify-center cursor-pointer ${isAllSelected
                                        ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                                        : "border-neutral-700 hover:border-neutral-500 bg-transparent"
                                        }`}
                                >
                                    {isAllSelected && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Codigo</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Nome</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Variação</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Preço Custo</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Preço Venda</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Estoque Atual</span>
                            </th>
                            <th className="px-4 font-normal text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Cadastrado</span>
                            </th>
                            <th className="px-5 font-normal text-[12px] text-black dark:text-white tracking-wider text-right py-3">
                                <span>Atualizado</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300 dark:divide-neutral-800 bg-transparent">
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="py-12 text-center text-neutral-400">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[13px] font-light">Carregando estoque...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="py-16 text-center text-neutral-400">
                                    <p className="text-[14px] font-light text-neutral-200">Nenhum produto em estoque.</p>
                                    <p className="text-[12px] text-neutral-500 font-light mt-1">Clique em "+ Produto" para cadastrar seu primeiro produto.</p>
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => {
                                const isChecked = !!selectedRows[row.rowId];
                                return (
                                    <tr
                                        key={row.rowId}
                                        className={`hover:bg-neutral-200/20 dark:hover:bg-neutral-800/20 transition-colors ${isChecked ? "bg-[#4F46E5]/5" : ""}`}
                                    >
                                        <td className="py-3 pl-5 pr-2">
                                            <div
                                                onClick={() => toggleRow(row.rowId)}
                                                className={`w-[15px] h-[15px] rounded border flex items-center justify-center cursor-pointer ${isChecked
                                                    ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                                                    : "border-neutral-800 hover:border-neutral-700 bg-transparent"
                                                    }`}
                                            >
                                                {isChecked && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 text-[13px] font-mono text-[#A1A1AA]">
                                            {row.codigo}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {row.nome}
                                                </span>
                                                <span className="text-[10.5px] text-neutral-500 font-light">
                                                    {row.marca}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4">
                                            <span className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium tracking-wide border border-neutral-700/30 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/50">
                                                {row.variacao}
                                            </span>
                                        </td>
                                        <td className="px-4 text-[13px] text-neutral-600 dark:text-[#E4E4E7] font-normal">
                                            {formatCurrency(row.preco_custo)}
                                        </td>
                                        <td className="px-4 text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">
                                            {formatCurrency(row.preco_venda)}
                                        </td>
                                        <td className="px-4">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[10.5px] font-semibold border ${
                                                row.qtd_estoque === 0
                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                    : row.qtd_estoque < 5
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            }`}>
                                                {row.qtd_estoque} un
                                            </span>
                                        </td>
                                        <td className="px-4 text-[13px] text-neutral-500 dark:text-[#A1A1AA] font-light">
                                            {formatDate(row.createdAt)}
                                        </td>
                                        <td className="px-5 text-[13px] text-neutral-500 dark:text-[#A1A1AA] font-light text-right">
                                            {formatDate(row.updatedAt)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Componente Modular do Modal de Cadastro */}
            <CadastroProdutoModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                apiToken={apiToken}
                onSuccess={fetchProducts}
            />
        </div>
    );
}
