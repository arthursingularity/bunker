"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

export default function FinanceiroDashboard({ apiToken }) {
    const [activeTab, setActiveTab] = useState("caixa"); // caixa | pagar | receber | estoque
    const [loading, setLoading] = useState(true);

    // States for data
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [contasPagar, setContasPagar] = useState([]);
    const [contasReceber, setContasReceber] = useState([]);
    const [movimentacoesEstoque, setMovimentacoesEstoque] = useState([]);
    const [clientes, setClientes] = useState([]);

    // Forms states
    const [formPagar, setFormPagar] = useState({ descricao: "", valor: "", data_vencimento: "" });
    const [formReceber, setFormReceber] = useState({ descricao: "", valor: "", data_vencimento: "", cliente_id: "" });
    const [formManual, setFormManual] = useState({
        tipo: "entrada",
        categoria: "Saldo Inicial",
        descricao: "Saldo Inicial de Abertura",
        valor: "",
        forma_pagamento: "Dinheiro"
    });
    const [showManualForm, setShowManualForm] = useState(false);
    const [formaPgSelect, setFormaPgSelect] = useState({}); // Stores selected payment method per account being liquidated
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Load data from endpoints
    const fetchData = async () => {
        if (!apiToken) return;
        setLoading(true);
        setErrorMsg("");
        try {
            const headers = { Authorization: `Bearer ${apiToken}` };
            const [movRes, pagarRes, receberRes, estRes, cliRes] = await Promise.all([
                fetch(`${API_URL}/api/financeiro`, { headers }),
                fetch(`${API_URL}/api/financeiro/contas-pagar`, { headers }),
                fetch(`${API_URL}/api/financeiro/contas-receber`, { headers }),
                fetch(`${API_URL}/api/financeiro/movimentacoes-estoque`, { headers }),
                fetch(`${API_URL}/api/clientes`, { headers })
            ]);

            if (movRes.ok) setMovimentacoes(await movRes.json());
            if (pagarRes.ok) setContasPagar(await pagarRes.json());
            if (receberRes.ok) setContasReceber(await receberRes.json());
            if (estRes.ok) setMovimentacoesEstoque(await estRes.json());
            if (cliRes.ok) setClientes(await cliRes.json());
        } catch (err) {
            console.error("Erro ao carregar dados financeiros:", err);
            setErrorMsg("Ocorreu um erro ao carregar os dados financeiros do servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiToken]);

    const showToast = (type, text) => {
        if (type === "success") {
            setSuccessMsg(text);
            setTimeout(() => setSuccessMsg(""), 4000);
        } else {
            setErrorMsg(text);
            setTimeout(() => setErrorMsg(""), 4000);
        }
    };

    // Calculate aggregated metrics
    const totalEntradas = movimentacoes
        .filter(m => m.tipo === "entrada")
        .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);

    const totalSaidas = movimentacoes
        .filter(m => m.tipo === "saida")
        .reduce((sum, m) => sum + parseFloat(m.valor || 0), 0);

    const saldoConsolidado = totalEntradas - totalSaidas;

    const contasPagarPendentes = contasPagar
        .filter(c => c.status === "Pendente")
        .reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

    const contasReceberPendentes = contasReceber
        .filter(c => c.status === "Pendente")
        .reduce((sum, c) => sum + parseFloat(c.valor || 0), 0);

    // Form handlers
    const handleAddContaPagar = async (e) => {
        e.preventDefault();
        if (!formPagar.descricao || !formPagar.valor || !formPagar.data_vencimento) {
            showToast("error", "Preencha todos os campos do contas a pagar.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/financeiro/contas-pagar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(formPagar)
            });

            if (res.ok) {
                showToast("success", "Conta a pagar cadastrada com sucesso!");
                setFormPagar({ descricao: "", valor: "", data_vencimento: "" });
                await fetchData();
            } else {
                const data = await res.json();
                showToast("error", data.erro || "Erro ao cadastrar conta a pagar.");
            }
        } catch (err) {
            showToast("error", "Erro de conexão com o servidor.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddContaReceber = async (e) => {
        e.preventDefault();
        if (!formReceber.descricao || !formReceber.valor || !formReceber.data_vencimento) {
            showToast("error", "Preencha todos os campos obrigatórios do contas a receber.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/financeiro/contas-receber`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({
                    descricao: formReceber.descricao,
                    valor: formReceber.valor,
                    data_vencimento: formReceber.data_vencimento,
                    cliente_id: formReceber.cliente_id || null
                })
            });

            if (res.ok) {
                showToast("success", "Conta a receber cadastrada com sucesso!");
                setFormReceber({ descricao: "", valor: "", data_vencimento: "", cliente_id: "" });
                await fetchData();
            } else {
                const data = await res.json();
                showToast("error", data.erro || "Erro ao cadastrar conta a receber.");
            }
        } catch (err) {
            showToast("error", "Erro de conexão com o servidor.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddManualMovimentacao = async (e) => {
        e.preventDefault();
        if (!formManual.tipo || !formManual.categoria || !formManual.valor) {
            showToast("error", "Preencha o tipo, categoria e valor da movimentação.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/financeiro`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(formManual)
            });

            if (res.ok) {
                showToast("success", `Movimentação de ${formManual.categoria} lançada com sucesso!`);
                setFormManual({
                    tipo: "entrada",
                    categoria: "Saldo Inicial",
                    descricao: "Saldo Inicial de Abertura",
                    valor: "",
                    forma_pagamento: "Dinheiro"
                });
                setShowManualForm(false);
                await fetchData();
            } else {
                const data = await res.json();
                showToast("error", data.erro || "Erro ao lançar movimentação.");
            }
        } catch (err) {
            showToast("error", "Erro de conexão com o servidor.");
        } finally {
            setSubmitting(false);
        }
    };

    // Liquidation Handlers
    const handlePagarConta = async (id) => {
        const method = formaPgSelect[id] || "Dinheiro";
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/financeiro/contas-pagar/${id}/pagar`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({ forma_pagamento: method })
            });

            if (res.ok) {
                showToast("success", "Conta liquidada com sucesso!");
                await fetchData();
            } else {
                const data = await res.json();
                showToast("error", data.erro || "Erro ao liquidar conta a pagar.");
            }
        } catch (err) {
            showToast("error", "Erro ao conectar com o servidor.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceberConta = async (id) => {
        const method = formaPgSelect[id] || "Dinheiro";
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/financeiro/contas-receber/${id}/receber`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({ forma_pagamento: method })
            });

            if (res.ok) {
                showToast("success", "Conta recebida com sucesso!");
                await fetchData();
            } else {
                const data = await res.json();
                showToast("error", data.erro || "Erro ao liquidar conta a receber.");
            }
        } catch (err) {
            showToast("error", "Erro ao conectar com o servidor.");
        } finally {
            setSubmitting(false);
        }
    };

    // Format utility
    const fmtCurrency = (val) => {
        return parseFloat(val || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    };

    const fmtDate = (dString) => {
        if (!dString) return "-";
        const date = new Date(dString);
        return date.toLocaleDateString("pt-BR");
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-8 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financeiro & Estoque</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                        Controle de fluxo de caixa, contas a pagar/receber e histórico de estoque.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-3.5 pl-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                        <span className={`material-symbols-outlined !text-[18px] ${loading ? "animate-spin" : ""}`}>
                            refresh
                        </span>
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Toast Alert */}
            {successMsg && (
                <div className="mb-6 p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 text-sm font-medium">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="mb-6 p-4 rounded-xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 text-sm font-medium">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    {errorMsg}
                </div>
            )}

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <div className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[12px] font-medium uppercase tracking-wider mb-2">
                        <span>Saldo em Caixa</span>
                        <span className={`h-2 w-2 rounded-full ${saldoConsolidado >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${saldoConsolidado >= 0 ? "text-neutral-900 dark:text-neutral-100" : "text-rose-600 dark:text-rose-400"}`}>
                        {fmtCurrency(saldoConsolidado)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500 mt-2 font-mono">
                        <span className="text-emerald-500 font-semibold">▲ Entradas: {fmtCurrency(totalEntradas)}</span>
                        <span className="text-neutral-500">▼ Saídas: {fmtCurrency(totalSaidas)}</span>
                    </div>
                </div>

                {/* Receivables Card */}
                <div className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-5 shadow-sm">
                    <div className="text-neutral-500 dark:text-neutral-400 text-[12px] font-medium uppercase tracking-wider mb-2">
                        Contas a Receber Pendentes
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
                        {fmtCurrency(contasReceberPendentes)}
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
                        Soma dos títulos em aberto a receber de clientes
                    </p>
                </div>

                {/* Payables Card */}
                <div className="bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-5 shadow-sm">
                    <div className="text-neutral-500 dark:text-neutral-400 text-[12px] font-medium uppercase tracking-wider mb-2">
                        Contas a Pagar Pendentes
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
                        {fmtCurrency(contasPagarPendentes)}
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2 text-rose-500/80">
                        Títulos em aberto aguardando quitação financeira
                    </p>
                </div>
            </div>

            {/* Elegant Vercel Style Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto scrollbar-none gap-2">
                {[
                    { id: "caixa", label: "Fluxo de Caixa (Extrato)", icon: "account_balance_wallet" },
                    { id: "pagar", label: "Contas a Pagar", icon: "arrow_outward" },
                    { id: "receber", label: "Contas a Receber", icon: "call_received" },
                    { id: "estoque", label: "Histórico de Estoque", icon: "inventory" }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition cursor-pointer select-none ${
                                isActive
                                    ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                                    : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            }`}
                        >
                            <span className="material-symbols-outlined !text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENTS */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/10">
                    <div className="h-6 w-6 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-600 dark:border-t-white animate-spin"></div>
                    <span className="text-xs">Carregando dados financeiros...</span>
                </div>
            ) : (
                <div>

                    {/* 1. TAB: FLUXO DE CAIXA */}
                    {activeTab === "caixa" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">Transações Recentes</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowManualForm(!showManualForm)}
                                        className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[11px] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 font-medium cursor-pointer select-none"
                                    >
                                        <span className="material-symbols-outlined !text-[15px]">add_circle</span>
                                        Saldo Inicial / Ajuste Manual
                                    </button>
                                    <span className="text-[11px] text-neutral-400 font-mono">{movimentacoes.length} registros</span>
                                </div>
                            </div>

                            {showManualForm && (
                                <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Definir Saldo Inicial ou Lançamento Manual</h4>
                                    <form onSubmit={handleAddManualMovimentacao} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-[10px] text-neutral-400 uppercase tracking-wide">Tipo de Movimento</label>
                                            <select
                                                value={formManual.tipo}
                                                onChange={(e) => setFormManual({...formManual, tipo: e.target.value})}
                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 text-xs rounded-lg px-3 py-1.5 h-[35px] text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
                                            >
                                                <option value="entrada">Entrada (+)</option>
                                                <option value="saida">Saída (-)</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-[10px] text-neutral-400 uppercase tracking-wide">Categoria</label>
                                            <select
                                                value={formManual.categoria}
                                                onChange={(e) => setFormManual({...formManual, categoria: e.target.value})}
                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 text-xs rounded-lg px-3 py-1.5 h-[35px] text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
                                            >
                                                <option value="Saldo Inicial">Saldo Inicial</option>
                                                <option value="Ajuste">Ajuste de Caixa</option>
                                                <option value="Retirada">Retirada / Pró-labore</option>
                                                <option value="Infraestrutura">Infraestrutura / Custos</option>
                                                <option value="Receita">Receita Avulsa</option>
                                                <option value="Despesa">Despesa Avulsa</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-[10px] text-neutral-400 uppercase tracking-wide">Descrição</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ex: Saldo Inicial de Caixa"
                                                value={formManual.descricao}
                                                onChange={(e) => setFormManual({...formManual, descricao: e.target.value})}
                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-[10px] text-neutral-400 uppercase tracking-wide">Valor (R$)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0,00"
                                                value={formManual.valor}
                                                onChange={(e) => setFormManual({...formManual, valor: e.target.value})}
                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="h-[35px] bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer select-none active:scale-98 transition duration-150 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined !text-[21px]">done</span>
                                            Lançar
                                        </button>
                                    </form>
                                </div>
                            )}

                            {movimentacoes.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 bg-neutral-50 dark:bg-neutral-900/5">
                                    <span className="material-symbols-outlined text-[36px] text-neutral-400 dark:text-neutral-700 mb-2">
                                        receipt_long
                                    </span>
                                    <p className="text-xs font-medium">Nenhuma transação lançada no caixa</p>
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">Vendas PDV e contas liquidadas aparecerão aqui</p>
                                </div>
                            ) : (
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-50 dark:bg-neutral-950/20">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                                                    <th className="px-4 py-2.5">Tipo</th>
                                                    <th className="px-4 py-2.5">Categoria</th>
                                                    <th className="px-4 py-2.5">Descrição</th>
                                                    <th className="px-4 py-2.5 text-right">Valor</th>
                                                    <th className="px-4 py-2.5">Forma Pgto</th>
                                                    <th className="px-4 py-2.5">Data Lançamento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                                {movimentacoes.map((item) => {
                                                    const isEntrada = item.tipo === "entrada";
                                                    return (
                                                        <tr key={item.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/20 transition-colors duration-100">
                                                            <td className="px-4 py-3 font-semibold">
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                                    isEntrada
                                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                                }`}>
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                                                    {isEntrada ? "Entrada" : "Saída"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide text-[10px]">
                                                                {item.categoria}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 max-w-xs truncate" title={item.descricao}>
                                                                {item.descricao || "Sem descrição"}
                                                            </td>
                                                            <td className={`px-4 py-3 text-right font-mono font-bold ${isEntrada ? "text-neutral-900 dark:text-white" : "text-rose-600 dark:text-rose-400"}`}>
                                                                {isEntrada ? "+" : "-"} {fmtCurrency(item.valor)}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                                                                {item.forma_pagamento || "Outro"}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                {fmtDate(item.createdAt)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. TAB: CONTAS A PAGAR */}
                    {activeTab === "pagar" && (
                        <div className="space-y-6">
                            {/* Inline Form */}
                            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Lançar Nova Conta a Pagar</h4>
                                <form onSubmit={handleAddContaPagar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Descrição</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Fornecedor de tecidos"
                                            value={formPagar.descricao}
                                            onChange={(e) => setFormPagar({...formPagar, descricao: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Valor (R$)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formPagar.valor}
                                            onChange={(e) => setFormPagar({...formPagar, valor: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Vencimento</label>
                                        <input
                                            type="date"
                                            required
                                            value={formPagar.data_vencimento}
                                            onChange={(e) => setFormPagar({...formPagar, data_vencimento: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-[35px] bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer select-none active:scale-98 transition duration-150 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Lançar Conta
                                    </button>
                                </form>
                            </div>

                            {/* Table */}
                            <div>
                                <h3 className="text-sm font-semibold tracking-wide uppercase text-neutral-500 mb-3">Títulos a Pagar</h3>
                                {contasPagar.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 bg-neutral-50 dark:bg-neutral-900/5">
                                        <span className="material-symbols-outlined text-[36px] text-neutral-400 dark:text-neutral-700 mb-2">
                                            check_circle
                                        </span>
                                        <p className="text-xs font-medium">Nenhuma despesa ou conta a pagar cadastrada</p>
                                    </div>
                                ) : (
                                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-50 dark:bg-neutral-950/20">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                                                        <th className="px-4 py-2.5">Descrição</th>
                                                        <th className="px-4 py-2.5">Vencimento</th>
                                                        <th className="px-4 py-2.5 text-right">Valor</th>
                                                        <th className="px-4 py-2.5">Status</th>
                                                        <th className="px-4 py-2.5">Forma Pgto</th>
                                                        <th className="px-4 py-2.5">Data Pgto</th>
                                                        <th className="px-4 py-2.5 text-center">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                                    {contasPagar.map((item) => {
                                                        const isPago = item.status === "Pago";
                                                        return (
                                                            <tr key={item.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/20 transition-colors duration-100">
                                                                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                                                                    {item.descricao}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                    {fmtDate(item.data_vencimento)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                                                                    {fmtCurrency(item.valor)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                        isPago
                                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500"
                                                                    }`}>
                                                                        {isPago ? "Quitado" : "Aguardando"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                                                                    {item.forma_pagamento || "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                    {item.data_pagamento ? fmtDate(item.data_pagamento) : "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {isPago ? (
                                                                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">done_all</span>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <select
                                                                                value={formaPgSelect[item.id] || "Dinheiro"}
                                                                                onChange={(e) => setFormaPgSelect({
                                                                                    ...formaPgSelect,
                                                                                    [item.id]: e.target.value
                                                                                })}
                                                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 text-[10px] rounded px-1.5 py-1 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer"
                                                                            >
                                                                                <option value="Dinheiro">Dinheiro</option>
                                                                                <option value="Pix">Pix</option>
                                                                                <option value="Cartão de Crédito">Crédito</option>
                                                                                <option value="Cartão de Débito">Débito</option>
                                                                            </select>
                                                                            <button
                                                                                onClick={() => handlePagarConta(item.id)}
                                                                                disabled={submitting}
                                                                                className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer disabled:opacity-50 select-none active:scale-95 transition"
                                                                            >
                                                                                Quitar
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. TAB: CONTAS A RECEBER */}
                    {activeTab === "receber" && (
                        <div className="space-y-6">
                            {/* Inline Form */}
                            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">Lançar Nova Conta a Receber</h4>
                                <form onSubmit={handleAddContaReceber} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Descrição</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Contrato de costura mensal"
                                            value={formReceber.descricao}
                                            onChange={(e) => setFormReceber({...formReceber, descricao: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Valor (R$)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formReceber.valor}
                                            onChange={(e) => setFormReceber({...formReceber, valor: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Vencimento</label>
                                        <input
                                            type="date"
                                            required
                                            value={formReceber.data_vencimento}
                                            onChange={(e) => setFormReceber({...formReceber, data_vencimento: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5 col-span-1 md:col-span-3">
                                        <label className="text-[11px] text-neutral-400 uppercase tracking-wide">Vincular Cliente (Opcional)</label>
                                        <select
                                            value={formReceber.cliente_id}
                                            onChange={(e) => setFormReceber({...formReceber, cliente_id: e.target.value})}
                                            className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-1.5 h-[35px] text-xs text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
                                        >
                                            <option value="">Nenhum - Cliente Avulso</option>
                                            {clientes.map(cli => (
                                                <option key={cli.id} value={cli.id}>{cli.nome_completo} ({cli.email || "Sem e-mail"})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-[35px] bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-850 dark:hover:bg-neutral-100 font-semibold text-xs tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer select-none active:scale-98 transition duration-150 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Lançar Conta
                                    </button>
                                </form>
                            </div>

                            {/* Table */}
                            <div>
                                <h3 className="text-sm font-semibold tracking-wide uppercase text-neutral-500 mb-3">Títulos a Receber</h3>
                                {contasReceber.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 bg-neutral-50 dark:bg-neutral-900/5">
                                        <span className="material-symbols-outlined text-[36px] text-neutral-400 dark:text-neutral-700 mb-2">
                                            account_balance
                                        </span>
                                        <p className="text-xs font-medium">Nenhuma receita ou conta a receber pendente</p>
                                    </div>
                                ) : (
                                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-50 dark:bg-neutral-950/20">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                                                        <th className="px-4 py-2.5">Descrição</th>
                                                        <th className="px-4 py-2.5">Cliente</th>
                                                        <th className="px-4 py-2.5">Vencimento</th>
                                                        <th className="px-4 py-2.5 text-right">Valor</th>
                                                        <th className="px-4 py-2.5">Status</th>
                                                        <th className="px-4 py-2.5">Forma Pgto</th>
                                                        <th className="px-4 py-2.5">Data Recbto</th>
                                                        <th className="px-4 py-2.5 text-center">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                                    {contasReceber.map((item) => {
                                                        const isRecebido = item.status === "Recebido";
                                                        return (
                                                            <tr key={item.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/20 transition-colors duration-100">
                                                                <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                                                                    {item.descricao}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                                                                    {item.clientes?.nome_completo || "Cliente Avulso"}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                    {fmtDate(item.data_vencimento)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                                                                    {fmtCurrency(item.valor)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                        isRecebido
                                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500"
                                                                    }`}>
                                                                        {isRecebido ? "Recebido" : "Pendente"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                                                                    {item.forma_pagamento || "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                    {item.data_recebimento ? fmtDate(item.data_recebimento) : "-"}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {isRecebido ? (
                                                                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">done_all</span>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <select
                                                                                value={formaPgSelect[item.id] || "Dinheiro"}
                                                                                onChange={(e) => setFormaPgSelect({
                                                                                    ...formaPgSelect,
                                                                                    [item.id]: e.target.value
                                                                                })}
                                                                                className="bg-white dark:bg-[#0a0a0a] border border-neutral-300 dark:border-neutral-800 text-[10px] rounded px-1.5 py-1 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer"
                                                                            >
                                                                                <option value="Dinheiro">Dinheiro</option>
                                                                                <option value="Pix">Pix</option>
                                                                                <option value="Cartão de Crédito">Crédito</option>
                                                                                <option value="Cartão de Débito">Débito</option>
                                                                            </select>
                                                                            <button
                                                                                onClick={() => handleReceberConta(item.id)}
                                                                                disabled={submitting}
                                                                                className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer disabled:opacity-50 select-none active:scale-95 transition"
                                                                            >
                                                                                Receber
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. TAB: HISTÓRICO DE ESTOQUE */}
                    {activeTab === "estoque" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">Histórico de Movimentações de Estoque</h3>
                                <span className="text-[11px] text-neutral-400 font-mono">{movimentacoesEstoque.length} logs</span>
                            </div>

                            {movimentacoesEstoque.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 bg-neutral-50 dark:bg-neutral-900/5">
                                    <span className="material-symbols-outlined text-[36px] text-neutral-400 dark:text-neutral-700 mb-2">
                                        history
                                    </span>
                                    <p className="text-xs font-medium">Nenhum histórico de estoque registrado</p>
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">Vendas e reabastecimentos de produtos criarão logs automáticos</p>
                                </div>
                            ) : (
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-50 dark:bg-neutral-950/20">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                                                    <th className="px-4 py-2.5">Produto</th>
                                                    <th className="px-4 py-2.5">Marca</th>
                                                    <th className="px-4 py-2.5">Variação</th>
                                                    <th className="px-4 py-2.5">Movimento</th>
                                                    <th className="px-4 py-2.5 text-right">Qtd</th>
                                                    <th className="px-4 py-2.5">Motivo</th>
                                                    <th className="px-4 py-2.5">Data Lançamento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs divide-y divide-neutral-200 dark:divide-neutral-800/80">
                                                {movimentacoesEstoque.map((item) => {
                                                    const isEntrada = item.tipo === "entrada";
                                                    const prod = item.variacoes?.produtos || {};
                                                    return (
                                                        <tr key={item.id} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/20 transition-colors duration-100">
                                                            <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                                                                {prod.nome || "Produto Desconhecido"}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[10px]">
                                                                {prod.marca || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-500 dark:text-neutral-300 font-mono">
                                                                {item.variacoes ? `${item.variacoes.cor} / ${item.variacoes.tamanho}` : "-"}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                    isEntrada
                                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                                                }`}>
                                                                    {isEntrada ? "Acréscimo" : "Baixa"}
                                                                </span>
                                                            </td>
                                                            <td className={`px-4 py-3 text-right font-mono font-bold ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                                {isEntrada ? "+" : "-"} {item.quantidade}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                                                                {item.motivo || "Não especificado"}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral-400 dark:text-neutral-500 font-mono">
                                                                {fmtDate(item.createdAt)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
