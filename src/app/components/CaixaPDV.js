"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "@/config/api";

export default function CaixaPDV({ apiToken }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [cart, setCart] = useState([]);
    const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
    const [desconto, setDesconto] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Dynamic categories from database
    const [dbCategories, setDbCategories] = useState([]);
    const uniqueCategoryNames = Array.from(new Set(dbCategories.map(c => c.nome))).filter(Boolean);
    const categories = ["Todos", ...uniqueCategoryNames, "Serviços"];

    const searchInputRef = useRef(null);

    // Fetch products and pending services
    const [services, setServices] = useState([]);

    const fetchCatalogData = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const [productsRes, servicesRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/api/produtos`, {
                    headers: { Authorization: `Bearer ${apiToken}` }
                }),
                fetch(`${API_URL}/api/servicos`, {
                    headers: { Authorization: `Bearer ${apiToken}` }
                }),
                fetch(`${API_URL}/api/categorias`, {
                    headers: { Authorization: `Bearer ${apiToken}` }
                })
            ]);

            if (productsRes.ok) {
                const pData = await productsRes.json();
                setProducts(pData);
            } else {
                console.error("Erro ao buscar produtos");
                showToast("error", "Erro ao buscar produtos do estoque.");
            }

            if (servicesRes.ok) {
                const sData = await servicesRes.json();
                // Filter only Pending or In Progress services
                const pending = sData.filter(s => s.status === "Pendente" || s.status === "Em Andamento");
                setServices(pending);
            } else {
                console.error("Erro ao buscar ordens de serviço");
                showToast("error", "Erro ao buscar ordens de serviço.");
            }

            if (categoriesRes.ok) {
                const cData = await categoriesRes.json();
                setDbCategories(cData);
            } else {
                console.error("Erro ao buscar categorias");
            }
        } catch (err) {
            console.error("Erro na requisição do catálogo:", err);
            showToast("error", "Erro de rede ao carregar catálogo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogData();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [apiToken]);

    // Flat map products to their variation rows
    const availableVariations = products.flatMap(product => {
        const productCategory = dbCategories.find(c => c.produto_codigo && c.produto_codigo === product.codigo)?.nome || "Sem Categoria";
        if (!product.variacoes || product.variacoes.length === 0) {
            return [{
                id: `p-${product.id}`,
                productId: product.id,
                isVariation: false,
                codigo: product.codigo || "",
                nome: product.nome,
                marca: product.marca,
                categoria: productCategory,
                variacaoLabel: "Sem variação",
                preco_venda: 0,
                qtd_estoque: 0,
                cor: "",
                tamanho: ""
            }];
        }
        return product.variacoes.map(v => ({
            id: v.id,
            productId: product.id,
            isVariation: true,
            codigo: product.codigo || "",
            nome: product.nome,
            marca: product.marca,
            categoria: productCategory,
            variacaoLabel: `${v.cor} / ${v.tamanho}`,
            preco_venda: parseFloat(v.preco_venda) || 0,
            qtd_estoque: v.qtd_estoque,
            cor: v.cor,
            tamanho: v.tamanho
        }));
    });

    // Mapeamento das ordens de serviço pendentes para o catálogo
    const mappedServices = services.map(s => ({
        id: `s-${s.id}`,
        serviceId: s.id,
        isService: true,
        serviceStatus: s.status,
        codigo: `OS-${s.id}`,
        nome: s.descricao,
        marca: "Serviço",
        variacaoLabel: `Cliente: ${s.clientes?.nome_completo || "Desconhecido"}`,
        preco_venda: parseFloat(s.preco_venda || s.preco) || 0,
        qtd_estoque: 1, // Sempre disponível (1 unidade)
        cor: "",
        tamanho: ""
    }));

    // Combina produtos e serviços
    const availableItems = [...availableVariations, ...mappedServices];

    // Helper to show messages
    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => {
            setMessage({ type: "", text: "" });
        }, 5000);
    };

    // Fast-barcode/code-reader search handler
    // If the input matches exactly a product's barcode/code, add it immediately to cart & clear!
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (!val) return;

        // Try to find an exact code/barcode match in products and services
        const exactMatch = availableItems.find(v =>
            v.codigo.trim().toLowerCase() === val.trim().toLowerCase() && v.qtd_estoque > 0
        );

        if (exactMatch) {
            addToCart(exactMatch);
            setSearchQuery(""); // Clear input on automatic addition
            showToast("success", `${exactMatch.nome} (${exactMatch.variacaoLabel}) adicionado!`);
        }
    };

    // Filter logic
    const filteredVariations = availableItems.filter(v => {
        // Category Pills Filter
        if (selectedCategory !== "Todos") {
            if (selectedCategory.toLowerCase() === "serviços") {
                if (!v.isService) return false;
            } else {
                if (v.isService) return false;
                if (v.categoria !== selectedCategory) return false;
            }
        }

        // Text Search query filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesText =
                v.nome.toLowerCase().includes(q) ||
                v.marca.toLowerCase().includes(q) ||
                v.codigo.toLowerCase().includes(q) ||
                v.variacaoLabel.toLowerCase().includes(q);

            if (!matchesText) return false;
        }

        return true;
    });

    // Add item to cart
    const addToCart = (item) => {
        if (!item.isService && item.qtd_estoque <= 0) {
            showToast("error", "Este produto está sem estoque disponível!");
            return;
        }

        setCart(prev => {
            const existing = prev.find(cartItem => cartItem.id === item.id);
            if (existing) {
                if (item.isService) {
                    showToast("error", "Esta ordem de serviço já está no carrinho.");
                    return prev;
                }
                if (existing.quantidade >= item.qtd_estoque) {
                    showToast("error", `Estoque máximo atingido (${item.qtd_estoque} disp.)`);
                    return prev;
                }
                return prev.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantidade: cartItem.quantidade + 1 }
                        : cartItem
                );
            } else {
                return [...prev, { ...item, quantidade: 1 }];
            }
        });
    };

    // Update quantity
    const updateQuantity = (itemId, change) => {
        setCart(prev => {
            return prev.map(cartItem => {
                if (cartItem.id === itemId) {
                    if (cartItem.isService) {
                        return cartItem; // Ordem de serviço é sempre 1 unidade
                    }
                    const newQty = cartItem.quantidade + change;
                    if (newQty <= 0) {
                        return null; // marked for removal
                    }
                    if (newQty > cartItem.qtd_estoque) {
                        showToast("error", `Estoque máximo atingido (${cartItem.qtd_estoque} disp.)`);
                        return cartItem;
                    }
                    return { ...cartItem, quantidade: newQty };
                }
                return cartItem;
            }).filter(Boolean);
        });
    };

    // Remove item completely
    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    // Calculate Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);
    const total = Math.max(0, subtotal - parseFloat(desconto || 0));

    // Handle Sale Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            showToast("error", "Adicione pelo menos um item para realizar a venda.");
            return;
        }

        if (!formaPagamento) {
            showToast("error", "Selecione a forma de pagamento.");
            return;
        }

        setIsSubmitting(true);
        try {
            const produtosNoCarrinho = cart.filter(item => !item.isService);
            const servicosNoCarrinho = cart.filter(item => item.isService);

            const payload = {
                forma_pagamento: formaPagamento,
                cliente_id: servicosNoCarrinho.length > 0 ? servicosNoCarrinho[0].clientes?.id || null : null,
                itens: produtosNoCarrinho.map(item => ({
                    variacao_id: item.id,
                    quantidade: item.quantidade
                })),
                servicos_ids: servicosNoCarrinho.map(item => item.serviceId)
            };

            const res = await fetch(`${API_URL}/api/vendas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const responseData = await res.json();
                showToast("success", "Venda realizada com sucesso!");
                setCart([]);
                setDesconto(0);
                setSearchQuery("");
                // Recarrega produtos e serviços
                fetchCatalogData();
            } else {
                const errData = await res.json();
                showToast("error", errData.erro || "Erro ao processar a venda.");
            }
        } catch (error) {
            console.error("Erro na finalização da venda:", error);
            showToast("error", "Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dynamic gradient generator based on product name for a sleek, modern visual
    const getGradientStyle = (name) => {
        const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue1 = charCodeSum % 360;
        const hue2 = (hue1 + 60) % 360;
        return {
            background: `linear-gradient(135deg, hsl(${hue1}, 70%, 20%), hsl(${hue2}, 70%, 15%))`
        };
    };

    return (
        <div className="h-full overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col lg:flex-row p-4 lg:p-6 gap-6 transition-colors duration-200">
            {/* LEFT PANE - Product Search & Catalog */}
            <div className="flex-1 flex flex-col gap-5 h-full overflow-hidden">

                {/* Search Bar / Header Grid */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="w-full sm:w-80 relative">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-400 !text-[20px]">
                            search
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar código ou nome..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 rounded-lg pl-8 pr-4 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-1.5 top-[20px] transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-light uppercase tracking-wider">PDV Bunker Ativo</span>
                    </div>
                </div>

                {/* Categories Pills Horizontal */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition cursor-pointer ${isSelected
                                    ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/20"
                                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Toast Messages */}
                {message.text && (
                    <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 animate-fade-in ${message.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                        }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {message.type === "success" ? "check_circle" : "error"}
                        </span>
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Variation Product Cards Grid */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-emerald-500 animate-spin"></div>
                        <span className="text-sm">Carregando catálogo de produtos...</span>
                    </div>
                ) : filteredVariations.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/10">
                        <span className="material-symbols-outlined text-[48px] text-neutral-400 dark:text-neutral-700 mb-2">
                            inventory_2
                        </span>
                        <span className="text-sm font-medium">Nenhum produto ou variação encontrado</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-600 mt-1">Tente ajustar seus filtros ou busca</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,300px)] gap-2.5 overflow-y-auto flex-1 pr-1 items-start content-start">
                        {filteredVariations.map((item) => {
                            const isOutOfStock = item.qtd_estoque <= 0;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !isOutOfStock && addToCart(item)}
                                    style={{ width: '300px', height: '93px' }}
                                    className={`group shrink-0 flex-shrink-0 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-2.5 flex flex-row items-center gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition duration-150 select-none ${isOutOfStock
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:shadow-lg hover:shadow-neutral-200 dark:hover:shadow-black/40"
                                        }`}
                                >
                                    {/* Simulated Image Square (Gray background with material outline icon) */}
                                    <div
                                        style={{ width: '72px', height: '72px' }}
                                        className="rounded-md bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0 text-neutral-400 dark:text-neutral-500 relative overflow-hidden"
                                    >
                                        <span className="material-symbols-outlined !text-[24px]">image</span>

                                        {/* Hover Shopping Cart Overlay */}
                                        {!isOutOfStock && (
                                            <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-neutral-950/80 p-1 rounded-full shadow">
                                                    add_shopping_cart
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Details on Right */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full">
                                        {/* Brand & Stock Row */}
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate uppercase tracking-wider font-bold">
                                                {item.marca}
                                            </span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold border ${item.isService
                                                ? item.serviceStatus === "Em Andamento"
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/25"
                                                : isOutOfStock
                                                    ? "bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-900"
                                                    : item.qtd_estoque < 5
                                                        ? "bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-450 border border-amber-200 dark:border-amber-900"
                                                        : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900"
                                                }`}>
                                                {item.isService
                                                    ? item.serviceStatus === "Em Andamento"
                                                        ? "Em Andamento"
                                                        : "Pendente"
                                                    : isOutOfStock
                                                        ? "Esgotado"
                                                        : `${item.qtd_estoque} disp.`
                                                }
                                            </span>
                                        </div>

                                        {/* Product Title */}
                                        <h3 className="font-semibold text-xs text-neutral-800 dark:text-neutral-100 truncate group-hover:text-neutral-950 dark:group-hover:text-white transition">
                                            {item.nome}
                                        </h3>

                                        {/* Price & SKU Row */}
                                        <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                                                R$ {item.preco_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate font-light mt-0.5 max-w-[90px]">
                                                {item.variacaoLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANE - Resumo / Checkout Sidebar */}
            <div className="w-full lg:w-96 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col justify-between h-full duration-200 overflow-hidden min-h-0">
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-neutral-500 dark:text-neutral-400">shopping_cart</span>
                            <h2 className="font-medium text-neutral-800 dark:text-neutral-100">Resumo da Venda</h2>
                        </div>
                        <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                            {cart.reduce((a, b) => a + b.quantidade, 0)} itens
                        </span>
                    </div>

                    {/* Cart Items List */}
                    <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1 scrollbar-none min-h-0">
                        {cart.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/20">
                                <span className="material-symbols-outlined text-[36px] text-neutral-400 dark:text-neutral-700">
                                    add_shopping_cart
                                </span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">O carrinho está vazio</span>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex gap-3 bg-white h-[80px] dark:bg-neutral-950/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800/60 items-center justify-between">
                                    <div className="flex justify-between w-full">
                                        <div className="flex w-full items-center space-x-3">
                                            <div>
                                                {/* Thumbnail Square */}
                                                <div
                                                    style={getGradientStyle(item.nome)}
                                                    className="h-[60px] w-[60px] rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-inner"
                                                >
                                                    {item.nome.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex flex-col w-full">
                                                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate w-3/4">{item.nome}</h4>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-light truncate mt-0.5">{item.variacaoLabel}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    {/* Quantity Controls */}
                                                    {item.isService ? (
                                                        <span className="text-[10px] flex items-center text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2.5 h-[20px] rounded font-mono font-semibold select-none">
                                                            Serviço
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded-md">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition font-medium cursor-pointer text-[13px] select-none"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 w-3 text-center">{item.quantidade}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, 1)}
                                                                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition font-medium cursor-pointer text-[13px] select-none"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Prices */}
                                                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                                        R$ {(item.preco_venda * item.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mb-8">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Checkout Summary Area */}
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4 flex flex-col gap-3">

                    {/* Payment Method Selector */}
                    <div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider block mb-2">Forma de Pagamento</span>
                        <div className="grid grid-cols-2 gap-2">
                            {["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito"].map((method) => {
                                const isSelected = formaPagamento === method;
                                return (
                                    <button
                                        key={method}
                                        onClick={() => setFormaPagamento(method)}
                                        className={`h-[40px] px-3 rounded-lg text-xs font-semibold border transition text-left cursor-pointer flex items-center justify-between ${isSelected
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm dark:shadow-md"
                                            : "bg-white dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
                                            }`}
                                    >
                                        <span>{method}</span>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[14px] text-emerald-600 dark:text-emerald-400">check</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desconto Input */}
                    <div className="flex items-center justify-between bg-white dark:bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800/80">
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Aplicar Desconto</span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Valor em Reais (R$)</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            placeholder="0,00"
                            value={desconto || ""}
                            onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-0 rounded-md w-24 px-2 py-1 text-right text-xs font-bold text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none transition"
                        />
                    </div>

                    {/* Checkout Totals */}
                    <div className="flex flex-col gap-1.5 pt-2">
                        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>Subtotal</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {desconto > 0 && (
                            <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
                                <span>Desconto</span>
                                <span>- R$ {desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline border-t border-neutral-200 dark:border-neutral-800/80 pt-2.5 mt-1">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total da Venda</span>
                            <span className="text-xl font-medium text-emerald-600 dark:text-emerald-400">
                                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || cart.length === 0}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-[12px] tracking-wide text-white transition flex items-center justify-center gap-2 select-none active:scale-95 cursor-pointer ${isSubmitting || cart.length === 0
                            ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-200 dark:border-neutral-800"
                            : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/10 dark:shadow-emerald-950/30 text-white font-semibold"
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                <span>PROCESSANDO...</span>
                            </>
                        ) : (
                            <>
                                <span>CONFIRMAR COMPRA</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
