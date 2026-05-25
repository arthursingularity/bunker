"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

export default function ServicosDashboard({ apiToken }) {
    // Tabs state
    const [activeTab, setActiveTab] = useState("servicos"); // 'servicos' | 'clientes'

    // Data lists
    const [services, setServices] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [serviceSearch, setServiceSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [clientSearch, setClientSearch] = useState("");

    // Message/Notification state
    const [toast, setToast] = useState({ show: false, type: "", text: "" });

    // Modals state
    const [serviceModal, setServiceModal] = useState({ show: false, mode: "create", data: null });
    const [clientModal, setClientModal] = useState({ show: false, mode: "create", data: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, type: "", id: null, title: "" });

    // Form inputs state - Service
    const [serviceForm, setServiceForm] = useState({
        descricao: "",
        preco: "",
        status: "Pendente",
        cliente_id: "",
        observacoes: ""
    });

    // Form inputs state - Client
    const [clientForm, setClientForm] = useState({
        nome_completo: "",
        email: "",
        cpf: "",
        telefone: ""
    });

    // Submitting state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial data
    const fetchData = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const [servicesRes, clientsRes] = await Promise.all([
                fetch(`${API_URL}/api/servicos`, { headers: { Authorization: `Bearer ${apiToken}` }, cache: 'no-store' }),
                fetch(`${API_URL}/api/clientes`, { headers: { Authorization: `Bearer ${apiToken}` }, cache: 'no-store' })
            ]);

            if (servicesRes.ok) {
                const sData = await servicesRes.json();
                const activeServices = sData.filter(s => s.status === "Pendente" || s.status === "Em Andamento");
                setServices(activeServices);
            }
            if (clientsRes.ok) {
                const cData = await clientsRes.json();
                setClients(cData);
            }
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            showToast("error", "Erro ao conectar-se com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiToken]);

    const showToast = (type, text) => {
        setToast({ show: true, type, text });
        setTimeout(() => setToast({ show: false, type: "", text: "" }), 4000);
    };

    // --- CLIENT OPERATIONS ---
    const handleOpenClientModal = (mode = "create", client = null) => {
        if (mode === "edit" && client) {
            setClientForm({
                nome_completo: client.nome_completo || "",
                email: client.email || "",
                cpf: client.cpf || "",
                telefone: client.telefone || ""
            });
            setClientModal({ show: true, mode: "edit", data: client });
        } else {
            setClientForm({
                nome_completo: "",
                email: "",
                cpf: "",
                telefone: ""
            });
            setClientModal({ show: true, mode: "create", data: null });
        }
    };

    const handleSaveClient = async (e) => {
        e.preventDefault();
        if (!clientForm.nome_completo.trim()) {
            showToast("error", "O nome do cliente é obrigatório.");
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = clientModal.mode === "edit";
            const url = isEdit ? `${API_URL}/api/clientes/${clientModal.data.id}` : `${API_URL}/api/clientes`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(clientForm)
            });

            const data = await res.json();

            if (res.ok) {
                showToast("success", isEdit ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
                setClientModal({ show: false, mode: "create", data: null });
                fetchData();
                
                // Se estiver criando cliente de dentro do modal de serviços, auto-seleciona ele!
                if (!isEdit && serviceModal.show) {
                    setServiceForm(prev => ({ ...prev, cliente_id: data.cliente?.id || "" }));
                }
            } else {
                showToast("error", data.erro || "Erro ao salvar cliente.");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Falha na comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- SERVICE OPERATIONS ---
    const handleOpenServiceModal = (mode = "create", service = null) => {
        if (mode === "edit" && service) {
            setServiceForm({
                descricao: service.descricao || "",
                preco: service.preco ? parseFloat(service.preco).toString() : "",
                status: service.status || "Pendente",
                cliente_id: service.cliente_id ? service.cliente_id.toString() : "",
                observacoes: service.observacoes || ""
            });
            setServiceModal({ show: true, mode: "edit", data: service });
        } else {
            setServiceForm({
                descricao: "",
                preco: "",
                status: "Pendente",
                cliente_id: clients.length > 0 ? clients[0].id.toString() : "",
                observacoes: ""
            });
            setServiceModal({ show: true, mode: "create", data: null });
        }
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        if (!serviceForm.descricao.trim()) {
            showToast("error", "A descrição do serviço é obrigatória.");
            return;
        }
        if (!serviceForm.preco || isNaN(parseFloat(serviceForm.preco))) {
            showToast("error", "Por favor, insira um preço válido.");
            return;
        }
        if (!serviceForm.cliente_id) {
            showToast("error", "É obrigatório selecionar um cliente.");
            return;
        }

        setIsSubmitting(true);
        try {
            const isEdit = serviceModal.mode === "edit";
            const url = isEdit ? `${API_URL}/api/servicos/${serviceModal.data.id}` : `${API_URL}/api/servicos`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({
                    ...serviceForm,
                    preco: parseFloat(serviceForm.preco),
                    cliente_id: parseInt(serviceForm.cliente_id)
                })
            });

            const data = await res.json();

            if (res.ok) {
                showToast("success", isEdit ? "Serviço atualizado com sucesso!" : "Serviço registrado com sucesso!");
                setServiceModal({ show: false, mode: "create", data: null });
                fetchData();
            } else {
                showToast("error", data.erro || "Erro ao salvar serviço.");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Falha na comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- DELETE OPERATION ---
    const handleOpenDeleteModal = (type, id, title) => {
        setDeleteModal({ show: true, type, id, title });
    };

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true);
        try {
            const url = deleteModal.type === "servico" 
                ? `${API_URL}/api/servicos/${deleteModal.id}` 
                : `${API_URL}/api/clientes/${deleteModal.id}`;

            const res = await fetch(url, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${apiToken}` }
            });

            const data = await res.json();

            if (res.ok) {
                showToast("success", deleteModal.type === "servico" ? "Serviço excluído com sucesso!" : "Cliente excluído com sucesso!");
                setDeleteModal({ show: false, type: "", id: null, title: "" });
                fetchData();
            } else {
                showToast("error", data.erro || "Erro ao excluir registro.");
            }
        } catch (err) {
            console.error(err);
            showToast("error", "Falha de rede ao tentar excluir.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- FILTERS ---
    const filteredServices = services.filter(s => {
        const matchesSearch = 
            s.descricao.toLowerCase().includes(serviceSearch.toLowerCase()) ||
            (s.clientes?.nome_completo || "").toLowerCase().includes(serviceSearch.toLowerCase());
        
        const matchesStatus = statusFilter === "Todos" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredClients = clients.filter(c => {
        const matchesSearch = 
            c.nome_completo.toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.email || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.telefone || "").includes(clientSearch) ||
            (c.cpf || "").includes(clientSearch);
        return matchesSearch;
    });

    // Helper functions for Vercel aesthetics
    const getStatusStyle = (status) => {
        switch (status) {
            case "Pendente":
                return "bg-amber-500/10 text-amber-500 border-amber-500/25";
            case "Em Andamento":
                return "bg-blue-500/10 text-blue-400 border-blue-500/25";
            case "Concluído":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
            case "Cancelado":
                return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
            default:
                return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return "—";
        const clean = phone.replace(/\D/g, "");
        if (clean.length === 11) {
            return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
        }
        if (clean.length === 10) {
            return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
        }
        return phone;
    };

    const formatCPF = (cpf) => {
        if (!cpf) return "—";
        const clean = cpf.replace(/\D/g, "");
        if (clean.length === 11) {
            return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
        }
        return cpf;
    };

    return (
        <div className="w-full text-neutral-900 dark:text-neutral-100 min-h-[calc(100vh-140px)] flex flex-col font-sans transition-colors duration-200">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5 mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-neutral-950 dark:text-white">Central de Serviços</h1>
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                        Gerencie ordens de serviço, manutenções, consertos e o cadastro unificado de seus clientes.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => activeTab === "servicos" ? handleOpenServiceModal("create") : handleOpenClientModal("create")}
                        className="font-light dark:bg-white bg-black dark:text-black buttonHover text-white rounded-md px-4 pl-2 space-x-1 text-[13px] h-[35px] flex items-center justify-center cursor-pointer font-medium w-full sm:w-auto"
                    >
                        <span className="material-symbols-outlined !text-[26px]">
                            add
                        </span>
                        {activeTab === "servicos" ? "Registrar Serviço" : "Cadastrar Cliente"}
                    </button>
                </div>
            </div>

            {/* Toast Alerts */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-xs font-semibold border flex items-center gap-3 shadow-xl transition-all duration-300 animate-fade-in ${
                    toast.type === "success" 
                        ? "bg-emerald-50 dark:bg-neutral-900 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400" 
                        : "bg-rose-50 dark:bg-neutral-900 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400"
                }`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Elegant Sub-navigation Tabs */}
            <div className="flex items-center space-x-1 border-b border-neutral-200 dark:border-neutral-800 mb-6 pb-[2px]">
                <button
                    onClick={() => setActiveTab("servicos")}
                    className={`px-4 py-2 text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                        activeTab === "servicos"
                            ? "text-neutral-950 dark:text-white"
                            : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                    }`}
                >
                    Serviços
                    {activeTab === "servicos" && (
                        <span className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-neutral-950 dark:bg-white rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("clientes")}
                    className={`px-4 py-2 text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                        activeTab === "clientes"
                            ? "text-neutral-950 dark:text-white"
                            : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                    }`}
                >
                    Clientes
                    {activeTab === "clientes" && (
                        <span className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-neutral-950 dark:bg-white rounded-full"></span>
                    )}
                </button>
            </div>

            {/* Content panes */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 gap-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-[#0E0E0E]">
                    <div className="h-6 w-6 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-800 dark:border-t-neutral-200 animate-spin"></div>
                    <span className="text-xs font-light tracking-wider uppercase">Carregando painel técnico...</span>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {/* TAB: SERVIÇOS */}
                    {activeTab === "servicos" && (
                        <div className="flex flex-col gap-4 flex-1">
                            {/* Filter Bar */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                <div className="w-full sm:w-80 relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar serviço ou cliente..."
                                        value={serviceSearch}
                                        onChange={(e) => setServiceSearch(e.target.value)}
                                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 rounded-lg pl-3 pr-8 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition"
                                    />
                                    {serviceSearch && (
                                        <button
                                            onClick={() => setServiceSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mr-2 uppercase tracking-wider font-semibold">Status:</span>
                                    {["Todos", "Pendente", "Em Andamento", "Concluído", "Cancelado"].map((status) => {
                                        const isSelected = statusFilter === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition cursor-pointer ${
                                                    isSelected
                                                        ? "bg-neutral-900 border-neutral-950 text-white dark:bg-white dark:border-white dark:text-black shadow-sm"
                                                        : "bg-white border-neutral-200 text-neutral-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Services Table */}
                            <div className="w-full overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#0E0E0E] shadow-sm">
                                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414]">
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[80px]">ID</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">Descrição</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">Cliente</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[120px] text-right">Preço</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[140px] text-center">Status</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[140px]">Data de Entrada</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[100px] text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredServices.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-12 text-center text-neutral-400 dark:text-neutral-500 font-light tracking-wide">
                                                    Nenhum serviço registrado ou encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredServices.map((service) => (
                                                <tr key={service.id} className="border-b border-neutral-200 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/10 transition duration-150">
                                                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                                                        #{service.id}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100 max-w-[280px] truncate">
                                                        <div className="flex flex-col">
                                                            <span>{service.descricao}</span>
                                                            {service.observacoes && (
                                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light max-w-xs truncate mt-0.5">
                                                                    {service.observacoes}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{service.clientes?.nome_completo || "Cliente Desconhecido"}</span>
                                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                                                                {formatPhone(service.clientes?.telefone)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-semibold text-neutral-900 dark:text-neutral-200">
                                                        R$ {parseFloat(service.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${getStatusStyle(service.status)}`}>
                                                            {service.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400 font-light">
                                                        {new Date(service.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleOpenServiceModal("edit", service)}
                                                                className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition duration-150 cursor-pointer"
                                                                title="Editar"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenDeleteModal("servico", service.id, service.descricao)}
                                                                className="text-neutral-400 hover:text-rose-500 transition duration-150 cursor-pointer"
                                                                title="Excluir"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: CLIENTES */}
                    {activeTab === "clientes" && (
                        <div className="flex flex-col gap-4 flex-1">
                            {/* Filter Bar */}
                            <div className="flex items-center justify-between">
                                <div className="w-full sm:w-80 relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome, email, telefone ou CPF..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 rounded-lg pl-3 pr-8 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition"
                                    />
                                    {clientSearch && (
                                        <button
                                            onClick={() => setClientSearch("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Clientes Table */}
                            <div className="w-full overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#0E0E0E] shadow-sm">
                                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414]">
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[80px]">ID</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">Nome Completo</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">E-mail</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">Telefone</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400">CPF</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 text-center w-[120px]">Serviços</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[140px]">Data de Cadastro</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 dark:text-neutral-400 w-[100px] text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="py-12 text-center text-neutral-400 dark:text-neutral-500 font-light tracking-wide">
                                                    Nenhum cliente cadastrado ou encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredClients.map((client) => (
                                                <tr key={client.id} className="border-b border-neutral-200 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/10 transition duration-150">
                                                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                                                        #{client.id}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {client.nome_completo}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                                                        {client.email || "—"}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                                        {formatPhone(client.telefone)}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                                        {formatCPF(client.cpf)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/50 text-neutral-800 dark:text-neutral-300 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                                                            {client._count?.servicos || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400 font-light">
                                                        {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleOpenClientModal("edit", client)}
                                                                className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition duration-150 cursor-pointer"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenDeleteModal("cliente", client.id, client.nome_completo)}
                                                                className="text-neutral-400 hover:text-rose-500 transition duration-150 cursor-pointer"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: CADASTRO / EDIÇÃO DE SERVIÇO */}
            {serviceModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
                    <div className="bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl transition-all scale-100 flex flex-col">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
                                {serviceModal.mode === "edit" ? "Editar Ordem de Serviço" : "Registrar Nova Ordem de Serviço"}
                            </h3>
                            <button
                                onClick={() => setServiceModal({ show: false, mode: "create", data: null })}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveService} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Descrição do Serviço</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Troca de tela iPhone 13, Limpeza técnica de PC..."
                                    value={serviceForm.descricao}
                                    onChange={(e) => setServiceForm({ ...serviceForm, descricao: e.target.value })}
                                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0,00"
                                        value={serviceForm.preco}
                                        onChange={(e) => setServiceForm({ ...serviceForm, preco: e.target.value })}
                                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</label>
                                    <select
                                        value={serviceForm.status}
                                        onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer transition"
                                    >
                                        <option value="Pendente">🟡 Pendente</option>
                                        <option value="Em Andamento">🔵 Em Andamento</option>
                                        <option value="Concluído">🟢 Concluído</option>
                                        <option value="Cancelado">⚪ Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 relative">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cliente Associado</label>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenClientModal("create")}
                                        className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold cursor-pointer underline decoration-dotted transition"
                                    >
                                        + Novo Cliente
                                    </button>
                                </div>
                                {clients.length === 0 ? (
                                    <div className="text-xs text-rose-500 border border-rose-500/20 bg-rose-500/5 p-2 rounded-lg font-light">
                                        Nenhum cliente cadastrado no sistema. Clique acima para cadastrar antes de criar o serviço.
                                    </div>
                                ) : (
                                    <select
                                        value={serviceForm.cliente_id}
                                        onChange={(e) => setServiceForm({ ...serviceForm, cliente_id: e.target.value })}
                                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer transition"
                                    >
                                        <option value="" disabled>Selecione um cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id.toString()}>
                                                {c.nome_completo} {c.telefone ? `(${formatPhone(c.telefone)})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Observações / Detalhes Técnicos</label>
                                <textarea
                                    rows="3"
                                    placeholder="Defeito relatado, peças utilizadas, garantia do conserto..."
                                    value={serviceForm.observacoes}
                                    onChange={(e) => setServiceForm({ ...serviceForm, observacoes: e.target.value })}
                                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition resize-none"
                                />
                            </div>

                            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setServiceModal({ show: false, mode: "create", data: null })}
                                    className="border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !serviceForm.cliente_id}
                                    className="bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-neutral-950 dark:border-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                                            <span>SALVANDO...</span>
                                        </>
                                    ) : (
                                        <span>SALVAR OS</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CADASTRO / EDIÇÃO DE CLIENTE */}
            {clientModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
                    <div className="bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl transition-all scale-100 flex flex-col">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
                                {clientModal.mode === "edit" ? "Editar Ficha de Cliente" : "Cadastrar Novo Cliente"}
                            </h3>
                            <button
                                onClick={() => setClientModal({ show: false, mode: "create", data: null })}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveClient} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva Santos"
                                    value={clientForm.nome_completo}
                                    onChange={(e) => setClientForm({ ...clientForm, nome_completo: e.target.value })}
                                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">E-mail</label>
                                <input
                                    type="email"
                                    placeholder="Ex: joao.silva@provedor.com"
                                    value={clientForm.email}
                                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                    className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Telefone (DDDMóvel)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 11988887777"
                                        value={clientForm.telefone}
                                        onChange={(e) => setClientForm({ ...clientForm, telefone: e.target.value.replace(/\D/g, '') })}
                                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">CPF (Apenas números)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 12345678909"
                                        value={clientForm.cpf}
                                        onChange={(e) => setClientForm({ ...clientForm, cpf: e.target.value.replace(/\D/g, '') })}
                                        className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setClientModal({ show: false, mode: "create", data: null })}
                                    className="border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-100 border border-neutral-950 dark:border-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-98"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                                            <span>SALVANDO...</span>
                                        </>
                                    ) : (
                                        <span>SALVAR CLIENTE</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
                    <div className="bg-white dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl transition-all scale-100">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">Confirmação de Exclusão</h3>
                            
                            {deleteModal.type === "cliente" ? (
                                <div className="text-xs text-rose-500 dark:text-rose-400/90 border border-rose-500/20 bg-rose-500/5 p-3 rounded-lg mt-3 flex items-start gap-2.5 font-light">
                                    <span className="font-semibold block shrink-0">Atenção:</span>
                                    <span>
                                        Ao excluir o cliente <strong>&quot;{deleteModal.title}&quot;</strong>, todos os serviços e vendas associados a ele no banco de dados também serão deletados em cascata!
                                    </span>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
                                    Você tem certeza que deseja excluir o serviço <strong>&quot;{deleteModal.title}&quot;</strong>? Esta ação não poderá ser desfeita.
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setDeleteModal({ show: false, type: "", id: null, title: "" })}
                                    className="border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={isSubmitting}
                                    className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                            <span>EXCLUINDO...</span>
                                        </>
                                    ) : (
                                        <span>CONFIRMAR EXCLUSÃO</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
