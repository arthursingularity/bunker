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

    // Category pills as per requirement
    const categories = [
        "Todos",
        "Celulares",
        "Acessórios",
        "Serviços",
        "Perfumes",
        "Camisa",
        "Calça",
        "Tênis"
    ];

    const searchInputRef = useRef(null);

    // Fetch products
    const fetchProducts = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/produtos`, {
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                console.error("Erro ao buscar produtos");
                showToast("error", "Erro ao buscar produtos do estoque.");
            }
        } catch (err) {
            console.error("Erro na requisição de produtos:", err);
            showToast("error", "Erro de rede ao buscar produtos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [apiToken]);

    // Flat map products to their variation rows
    const availableVariations = products.flatMap(product => {
        if (!product.variacoes || product.variacoes.length === 0) {
            return [{
                id: `p-${product.id}`,
                productId: product.id,
                isVariation: false,
                codigo: product.codigo || "",
                nome: product.nome,
                marca: product.marca,
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
            variacaoLabel: `${v.cor} / ${v.tamanho}`,
            preco_venda: parseFloat(v.preco_venda) || 0,
            qtd_estoque: v.qtd_estoque,
            cor: v.cor,
            tamanho: v.tamanho
        }));
    });

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

        // Try to find an exact code/barcode match
        const exactMatch = availableVariations.find(v => 
            v.codigo.trim().toLowerCase() === val.trim().toLowerCase() && v.qtd_estoque > 0
        );

        if (exactMatch) {
            addToCart(exactMatch);
            setSearchQuery(""); // Clear input on automatic addition
            showToast("success", `${exactMatch.nome} (${exactMatch.variacaoLabel}) adicionado!`);
        }
    };

    // Filter logic
    const filteredVariations = availableVariations.filter(v => {
        // Category Pills Filter
        if (selectedCategory !== "Todos") {
            const categoryQuery = selectedCategory.toLowerCase();
            const matchesCategory = 
                v.nome.toLowerCase().includes(categoryQuery) || 
                v.marca.toLowerCase().includes(categoryQuery) ||
                v.variacaoLabel.toLowerCase().includes(categoryQuery);

            if (!matchesCategory) return false;
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
        if (item.qtd_estoque <= 0) {
            showToast("error", "Este produto está sem estoque disponível!");
            return;
        }

        setCart(prev => {
            const existing = prev.find(cartItem => cartItem.id === item.id);
            if (existing) {
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
            const payload = {
                forma_pagamento: formaPagamento,
                cliente_id: null, // Opcional no backend, definimos null
                itens: cart.map(item => ({
                    variacao_id: item.id,
                    quantidade: item.quantidade
                }))
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
                // Refresh catalog to reflect new stock amounts
                fetchProducts();
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
        <div className="min-h-[calc(100vh-40px)] bg-neutral-950 text-neutral-100 flex flex-col lg:flex-row p-4 lg:p-6 gap-6">
            {/* LEFT PANE - Product Search & Catalog */}
            <div className="flex-1 flex flex-col gap-5">
                
                {/* Search Bar / Header Grid */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="w-full sm:w-80 relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400 text-[20px]">
                            search
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar código ou nome..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-neutral-400 font-light uppercase tracking-wider">PDV Bunker Ativo</span>
                    </div>
                </div>

                {/* Categories Pills Horizontal */}
                <div className="flex hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition cursor-pointer ${
                                    isSelected
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
                    <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 animate-fade-in ${
                        message.type === "success" 
                            ? "bg-emerald-950/50 border-emerald-800 text-emerald-300" 
                            : "bg-rose-950/50 border-rose-800 text-rose-300"
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
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-800 border-t-emerald-500 animate-spin"></div>
                        <span className="text-sm">Carregando catálogo de produtos...</span>
                    </div>
                ) : filteredVariations.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                        <span className="material-symbols-outlined text-[48px] text-neutral-700 mb-2">
                            inventory_2
                        </span>
                        <span className="text-sm font-medium">Nenhum produto ou variação encontrado</span>
                        <span className="text-xs text-neutral-600 mt-1">Tente ajustar seus filtros ou busca</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
                        {filteredVariations.map((item) => {
                            const isOutOfStock = item.qtd_estoque <= 0;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !isOutOfStock && addToCart(item)}
                                    className={`group bg-neutral-900 border border-neutral-800/80 rounded-lg p-2.5 flex flex-col justify-between hover:border-neutral-700 transition duration-200 select-none ${
                                        isOutOfStock 
                                            ? "opacity-50 cursor-not-allowed" 
                                            : "cursor-pointer hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5 active:scale-[0.98]"
                                    }`}
                                >
                                    {/* Abstract Premium Thumbnail */}
                                    <div
                                        style={getGradientStyle(item.nome)}
                                        className="w-full aspect-square rounded-md flex items-center justify-center text-neutral-100 font-semibold text-base relative mb-2 overflow-hidden shadow-inner border border-neutral-800"
                                    >
                                        {item.nome.charAt(0).toUpperCase()}
                                        
                                        {/* Hover Overlay */}
                                        {!isOutOfStock && (
                                            <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px] text-emerald-400 bg-neutral-950/70 p-1.5 rounded-full shadow-lg">
                                                    add_shopping_cart
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info details */}
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-start mb-1 gap-1">
                                            <span className="text-[9px] text-neutral-400 truncate w-2/3 uppercase tracking-wider font-semibold">{item.marca}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                                                isOutOfStock 
                                                    ? "bg-rose-950/80 text-rose-400 border border-rose-900" 
                                                    : item.qtd_estoque < 5 
                                                        ? "bg-amber-950/80 text-amber-400 border border-amber-900" 
                                                        : "bg-emerald-950/80 text-emerald-400 border border-emerald-900"
                                            }`}>
                                                {isOutOfStock ? "Esgotado" : `${item.qtd_estoque} disp.`}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-xs text-neutral-100 truncate mb-0.5 group-hover:text-white transition">{item.nome}</h3>
                                        <p className="text-[10px] text-neutral-500 mb-1 font-light truncate">{item.variacaoLabel}</p>

                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-xs font-bold text-neutral-200">
                                                R$ {item.preco_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            {item.codigo && (
                                                <span className="text-[8px] font-mono text-neutral-600 bg-neutral-950/60 px-1 py-0.5 rounded">
                                                    #{item.codigo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANE - Resumo / Checkout Sidebar */}
            <div className="w-full lg:w-96 bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between max-h-[calc(100vh-60px)] shadow-2xl">
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-neutral-400">shopping_cart</span>
                            <h2 className="font-bold text-base text-neutral-100">Resumo da Venda</h2>
                        </div>
                        <span className="bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                            {cart.reduce((a, b) => a + b.quantidade, 0)} itens
                        </span>
                    </div>

                    {/* Cart Items List */}
                    <div className="overflow-y-auto max-h-[calc(100vh-420px)] flex flex-col gap-3 pr-1 scrollbar-none">
                        {cart.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20">
                                <span className="material-symbols-outlined text-[36px] text-neutral-700">
                                    add_shopping_cart
                                </span>
                                <span className="text-xs">O carrinho está vazio</span>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex gap-3 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/60 items-center justify-between">
                                    {/* Thumbnail Square */}
                                    <div
                                        style={getGradientStyle(item.nome)}
                                        className="h-11 w-11 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-inner"
                                    >
                                        {item.nome.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Product details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <h4 className="text-xs font-semibold text-neutral-100 truncate w-3/4">{item.nome}</h4>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-neutral-500 hover:text-rose-400 transition"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-neutral-400 font-light truncate mt-0.5">{item.variacaoLabel}</p>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="text-neutral-400 hover:text-neutral-200 transition font-bold text-sm select-none"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-bold text-neutral-200 w-3 text-center">{item.quantidade}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="text-neutral-400 hover:text-neutral-200 transition font-bold text-sm select-none"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Prices */}
                                            <span className="text-xs font-bold text-neutral-200">
                                                R$ {(item.preco_venda * item.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Checkout Summary Area */}
                <div className="border-t border-neutral-800 pt-4 mt-4 flex flex-col gap-3">
                    
                    {/* Payment Method Selector */}
                    <div>
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider block mb-2">Forma de Pagamento</span>
                        <div className="grid grid-cols-2 gap-2">
                            {["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito"].map((method) => {
                                const isSelected = formaPagamento === method;
                                return (
                                    <button
                                        key={method}
                                        onClick={() => setFormaPagamento(method)}
                                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-left cursor-pointer flex items-center justify-between ${
                                            isSelected 
                                                ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-md" 
                                                : "bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                                        }`}
                                    >
                                        <span>{method}</span>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[14px] text-emerald-400">check</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desconto Input */}
                    <div className="flex items-center justify-between bg-neutral-950/30 p-2.5 rounded-lg border border-neutral-800/80">
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-400 font-medium">Aplicar Desconto</span>
                            <span className="text-[10px] text-neutral-500">Valor em Reais (R$)</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            placeholder="0,00"
                            value={desconto || ""}
                            onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="bg-neutral-900 border border-neutral-800 focus:border-neutral-600 focus:ring-0 rounded-md w-24 px-2 py-1 text-right text-xs font-bold text-neutral-200 placeholder-neutral-600 outline-none transition"
                        />
                    </div>

                    {/* Checkout Totals */}
                    <div className="flex flex-col gap-1.5 pt-2">
                        <div className="flex justify-between text-xs text-neutral-400">
                            <span>Subtotal</span>
                            <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {desconto > 0 && (
                            <div className="flex justify-between text-xs text-rose-400 font-medium">
                                <span>Desconto</span>
                                <span>- R$ {desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline border-t border-neutral-800/80 pt-2.5 mt-1">
                            <span className="text-sm font-semibold text-neutral-300">Total da Venda</span>
                            <span className="text-xl font-black text-emerald-400">
                                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || cart.length === 0}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-white transition flex items-center justify-center gap-2 select-none active:scale-95 cursor-pointer ${
                            isSubmitting || cart.length === 0
                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-800"
                                : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/30 text-white font-bold"
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                <span>PROCESSANDO...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                <span>CONFIRMAR COMPRA</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
