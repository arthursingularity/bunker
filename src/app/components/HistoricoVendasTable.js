"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

export default function HistoricoVendasTable({ apiToken }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPayment, setFilterPayment] = useState("");
    const [filterDate, setFilterDate] = useState(""); // "today", "7days", "30days", ""
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch sales
    const fetchSales = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/vendas`, {
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSales(data);
            } else {
                console.error("Erro ao buscar histórico de vendas");
            }
        } catch (err) {
            console.error("Erro na requisição de vendas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [apiToken]);

    // Flat-map sales into individual sold item/service rows for complete granular history
    const rows = sales.flatMap(sale => {
        const dateObj = new Date(sale.createdAt);
        
        // Mapeia produtos da venda
        const productRows = (sale.produtos_vendas || []).map(item => {
            const varInfo = item.variacoes || {};
            const prodInfo = varInfo.produtos || {};
            return {
                rowId: `p-${sale.id}-${item.id}`,
                saleId: sale.id,
                itemId: item.id,
                isService: false,
                codigo: prodInfo.codigo || "-",
                nome: prodInfo.nome || "Produto Removido",
                marca: prodInfo.marca || "-",
                variacao: varInfo.cor && varInfo.tamanho ? `${varInfo.cor} / ${varInfo.tamanho}` : "Sem variação",
                quantidade: item.quantidade,
                preco_unitario: parseFloat(item.preco_unitario) || 0,
                subtotal: (parseFloat(item.preco_unitario) || 0) * item.quantidade,
                forma_pagamento: sale.forma_pagamento,
                total_venda: parseFloat(sale.valor_total) || 0,
                data: sale.createdAt,
                dateObj: dateObj
            };
        });

        // Mapeia serviços finalizados na venda
        const serviceRows = (sale.servicos || []).map(serv => {
            return {
                rowId: `s-${sale.id}-${serv.id}`,
                saleId: sale.id,
                itemId: serv.id,
                isService: true,
                codigo: `OS-${serv.id}`,
                nome: serv.descricao,
                marca: "Ordem de Serviço",
                variacao: `Cliente: ${serv.clientes?.nome_completo || "Desconhecido"}`,
                quantidade: 1,
                preco_unitario: parseFloat(serv.preco) || 0,
                subtotal: parseFloat(serv.preco) || 0,
                forma_pagamento: sale.forma_pagamento,
                total_venda: parseFloat(sale.valor_total) || 0,
                data: sale.createdAt,
                dateObj: dateObj
            };
        });

        return [...productRows, ...serviceRows];
    });

    // Real-time filtering
    const filteredRows = rows.filter(row => {
        // Text Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesNome = row.nome.toLowerCase().includes(query);
            const matchesMarca = row.marca.toLowerCase().includes(query);
            const matchesCodigo = row.codigo.toLowerCase().includes(query);
            const matchesVariacao = row.variacao.toLowerCase().includes(query);
            const matchesPagamento = row.forma_pagamento.toLowerCase().includes(query);
            const matchesId = `sale-${row.saleId}`.includes(query) || String(row.saleId).includes(query);

            if (!matchesNome && !matchesMarca && !matchesCodigo && !matchesVariacao && !matchesPagamento && !matchesId) {
                return false;
            }
        }

        // Payment Method Filter
        if (filterPayment && row.forma_pagamento !== filterPayment) {
            return false;
        }

        // Date Range Filter
        if (filterDate) {
            const now = new Date();
            const timeDiff = now.getTime() - row.dateObj.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;

            if (filterDate === "today" && timeDiff > oneDayMs) return false;
            if (filterDate === "7days" && timeDiff > 7 * oneDayMs) return false;
            if (filterDate === "30days" && timeDiff > 30 * oneDayMs) return false;
        }

        return true;
    });

    // Row selection control
    const toggleRow = (rowId) => {
        setSelectedRows(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    const toggleAll = () => {
        const allSelected = filteredRows.length > 0 && filteredRows.every(row => selectedRows[row.rowId]);
        if (allSelected) {
            setSelectedRows(prev => {
                const copy = { ...prev };
                filteredRows.forEach(row => {
                    delete copy[row.rowId];
                });
                return copy;
            });
        } else {
            setSelectedRows(prev => {
                const copy = { ...prev };
                filteredRows.forEach(row => {
                    copy[row.rowId] = true;
                });
                return copy;
            });
        }
    };

    const isAllSelected = filteredRows.length > 0 && filteredRows.every(row => selectedRows[row.rowId]);
    const selectedCount = Object.keys(selectedRows).filter(id => selectedRows[id]).length;

    // Handle Sale Cancellation (Delete)
    const handleDeleteSale = async () => {
        if (!apiToken || !saleToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/vendas/${saleToDelete.saleId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });

            if (res.ok) {
                setSelectedRows({});
                fetchSales();
                setDeleteModalOpen(false);
                setSaleToDelete(null);
            } else {
                alert("Erro ao estornar venda.");
            }
        } catch (error) {
            console.error("Erro ao estornar venda:", error);
            alert("Erro de comunicação com o servidor.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Bulk Delete helper for selected rows
    const handleTriggerBulkDelete = () => {
        // Collect distinct sale IDs
        const distinctSaleIds = new Set();
        rows.forEach(row => {
            if (selectedRows[row.rowId]) {
                distinctSaleIds.add(row.saleId);
            }
        });
        const selectedList = Array.from(distinctSaleIds);
        if (selectedList.length > 0) {
            // Cancel first selected or prompt for support
            const firstId = selectedList[0];
            const firstRow = rows.find(r => r.saleId === firstId);
            setSaleToDelete(firstRow);
            setDeleteModalOpen(true);
        }
    };

    const handleTriggerSingleDelete = (row) => {
        setSaleToDelete(row);
        setDeleteModalOpen(true);
    };

    // Currency Formatter
    const formatCurrency = (val) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(val);
    };

    // Date Formatter
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

    // Dynamic stats summaries
    const totalRevenue = sales.reduce((acc, sale) => acc + (parseFloat(sale.valor_total) || 0), 0);
    const totalItemsSold = rows.reduce((acc, row) => acc + row.quantidade, 0);
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

    return (
        <div className="w-full px-5 py-4">
            
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Revenue Card */}
                <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Faturamento Total</span>
                        <span className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">{formatCurrency(totalRevenue)}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                        <span className="material-symbols-outlined !text-[24px]">payments</span>
                    </div>
                </div>

                {/* Items Sold Card */}
                <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Produtos Vendidos</span>
                        <span className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">{totalItemsSold} unid.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined !text-[24px]">inventory_2</span>
                    </div>
                </div>

                {/* Transaction Count Card */}
                <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Total de Vendas</span>
                        <span className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">{sales.length} transações</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400">
                        <span className="material-symbols-outlined !text-[24px]">receipt_long</span>
                    </div>
                </div>

                {/* Average Ticket Card */}
                <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">Ticket Médio</span>
                        <span className="text-xl font-bold mt-1 text-neutral-900 dark:text-white">{formatCurrency(averageTicket)}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined !text-[24px]">analytics</span>
                    </div>
                </div>
            </div>

            {/* Top Toolbar: Search and Filters (Identical visual pattern as EstoqueTable) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                {selectedCount > 0 ? (
                    <div className="flex-1 flex flex-wrap items-center gap-3 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 px-4 py-1.5 rounded-lg animate-in slide-in-from-top-2 duration-200">
                        <span className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            {selectedCount} {selectedCount === 1 ? "variação selecionada" : "variações selecionadas"}
                        </span>
                        <div className="h-4 w-[1px] bg-indigo-500/20 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleTriggerBulkDelete}
                                className="px-3 py-1 bg-rose-500 text-white rounded-md text-[12px] hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            >
                                <span className="material-symbols-outlined !text-[16px]">cancel</span>
                                <span>Estornar Venda</span>
                            </button>
                            <button
                                onClick={() => setSelectedRows({})}
                                className="px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-md text-[12px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                        {/* Searching input */}
                        <div className="w-full sm:w-[240px] relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar produto ou venda..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none placeholder-neutral-500 focus:border-neutral-400 dark:focus:border-neutral-600 transition"
                            />
                        </div>

                        {/* Payment Selector */}
                        <select
                            value={filterPayment}
                            onChange={(e) => setFilterPayment(e.target.value)}
                            className="w-full sm:w-[160px] px-3 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="">Todos Pagamentos</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Pix">Pix</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Cartão de Débito">Cartão de Débito</option>
                        </select>

                        {/* Date Filter */}
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full sm:w-[160px] px-3 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="">Período: Total</option>
                            <option value="today">Hoje</option>
                            <option value="7days">Últimos 7 dias</option>
                            <option value="30days">Últimos 30 dias</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Table Area (Replicating EstoqueTable Style exactly) */}
            <div className="w-full overflow-x-auto rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950">
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
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Venda / Transação</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Nome do Produto</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Variação</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Qtd Vendida</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Preço Unitário</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Subtotal</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Pagamento</span>
                            </th>
                            <th className="px-4 text-center text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold">
                                <span>Data da Venda</span>
                            </th>
                            <th className="px-5 text-center text-[12px] text-black dark:text-white tracking-wider py-3 font-semibold w-[80px]">
                                <span>Ações</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300 dark:divide-neutral-800 bg-transparent">
                        {loading ? (
                            <tr>
                                <td colSpan="10" className="py-12 text-center text-neutral-400">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[13px] font-light">Carregando histórico...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="py-16 text-center text-neutral-400">
                                    <p className="text-[14px] font-light text-neutral-800 dark:text-neutral-200">Nenhuma venda encontrada no histórico.</p>
                                    <p className="text-[12px] text-neutral-500 font-light mt-1">
                                        {searchQuery || filterPayment || filterDate
                                            ? "Tente ajustar seus filtros de pesquisa."
                                            : "As vendas concluídas no módulo de caixa constarão aqui."}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => {
                                const isChecked = !!selectedRows[row.rowId];
                                return (
                                    <tr
                                        key={row.rowId}
                                        className={`hover:bg-neutral-200/20 dark:hover:bg-neutral-800/20 transition-colors ${isChecked ? "bg-[#4F46E5]/5" : ""}`}
                                    >
                                        {/* Checkbox */}
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

                                        {/* Sale Transaction ID */}
                                        <td className="px-4 text-[13px] font-mono text-[#A1A1AA]">
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                #{row.saleId}
                                            </span>
                                        </td>

                                        {/* Product Details */}
                                        <td className="px-4">
                                            <div className="flex flex-col leading-[1.1]">
                                                <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                                    {row.nome}
                                                </span>
                                                <span className="text-[11px] text-neutral-500 font-light">
                                                    {row.marca}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Variation Info */}
                                        <td className="px-4">
                                            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium tracking-wide border border-neutral-700/30 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/50">
                                                {row.variacao}
                                            </span>
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-4 text-[13px] text-neutral-900 dark:text-neutral-100 font-medium">
                                            {row.quantidade} {row.quantidade === 1 ? "unid." : "unid."}
                                        </td>

                                        {/* Unit Price */}
                                        <td className="px-4 text-[13px] text-neutral-600 dark:text-[#E4E4E7]">
                                            {formatCurrency(row.preco_unitario)}
                                        </td>

                                        {/* Subtotal */}
                                        <td className="px-4 text-[13px] font-bold text-neutral-900 dark:text-[#E4E4E7]">
                                            {formatCurrency(row.subtotal)}
                                        </td>

                                        {/* Payment Mode */}
                                        <td className="px-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                {row.forma_pagamento}
                                            </span>
                                        </td>

                                        {/* Sale Date */}
                                        <td className="px-4 text-[12px] text-center text-neutral-500 dark:text-[#A1A1AA]">
                                            {formatDate(row.data)}
                                        </td>

                                        {/* Actions: Cancel Sale */}
                                        <td className="px-5 text-center py-2">
                                            <button
                                                onClick={() => handleTriggerSingleDelete(row)}
                                                className="hover:bg-rose-500/20 p-1.5 rounded transition text-neutral-500 hover:text-rose-500 cursor-pointer flex items-center justify-center mx-auto"
                                                title="Estornar Venda Completa"
                                            >
                                                <span className="material-symbols-outlined !text-[20px]">
                                                    cancel
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Premium Confirmation Delete Modal (Refunding Sale) */}
            {deleteModalOpen && saleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-[440px] bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-5 shadow-2xl animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 text-rose-500 mb-3">
                            <span className="material-symbols-outlined text-[32px]">warning</span>
                            <h3 className="text-lg font-bold">Estornar Venda Completa?</h3>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                            Você tem certeza que deseja estornar a venda <span className="font-semibold text-neutral-900 dark:text-white">#{saleToDelete.saleId}</span>? 
                            Esta ação irá devolver automaticamente todos os produtos desta transação de volta ao estoque e apagar o registro de faturamento permanentemente.
                        </p>
                        
                        <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5 mb-5 max-h-[140px] overflow-y-auto">
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1">Itens que retornarão ao estoque:</span>
                            {sales.find(s => s.id === saleToDelete.saleId)?.produtos_vendas?.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-xs text-neutral-700 dark:text-neutral-300 py-1">
                                    <span className="truncate max-w-[70%] font-medium">
                                        {item.variacoes?.produtos?.nome || "Produto"} ({item.variacoes?.cor} / {item.variacoes?.tamanho})
                                    </span>
                                    <span className="font-semibold">+{item.quantidade} unid.</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 font-medium">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setSaleToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-md text-[13px] transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteSale}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[13px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>Estornando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined !text-[16px]">verified_user</span>
                                        <span>Confirmar Estorno</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
