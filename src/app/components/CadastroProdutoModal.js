"use client";

import React, { useState, useRef, useEffect } from "react";

export default function CadastroProdutoModal({ isOpen, onClose, apiToken, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [generatingIndices, setGeneratingIndices] = useState({});
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        marca: "",
        codigo: "",
        descricao: "",
        variacoes: [
            { tamanho: "U", cor: "Única", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }
        ]
    });

    const typingIntervalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
            setIsGeneratingDescription(false);
        }
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleProductChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleVariationChange = (index, field, value) => {
        setFormData(prev => {
            const newVariations = [...prev.variacoes];
            newVariations[index] = {
                ...newVariations[index],
                [field]: value
            };
            return {
                ...prev,
                variacoes: newVariations
            };
        });
    };

    const handleAddVariation = () => {
        setFormData(prev => ({
            ...prev,
            variacoes: [
                ...prev.variacoes,
                { tamanho: "", cor: "", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }
            ]
        }));
    };

    const handleRemoveVariation = (index) => {
        setFormData(prev => ({
            ...prev,
            variacoes: prev.variacoes.filter((_, idx) => idx !== index)
        }));
    };

    const generateColorForVariation = async (index) => {
        const variation = formData.variacoes[index];
        if (!formData.nome || !formData.marca || !variation.cor) {
            setErrorMsg("Preencha Nome, Marca e a Cor desta variação antes de gerar.");
            return;
        }
        setErrorMsg("");
        setGeneratingIndices(prev => ({ ...prev, [index]: true }));

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const promptText = `Produto: ${formData.nome}
        Marca: ${formData.marca}
        Cor: ${variation.cor}

        Gere um código de cor HEX que melhor define a cor desse produto.

        Esse código será usado para criar um ícone de cor em uma tabela, então deve ser bem condizente com o produto.

        Não me responda com nenhuma palavra a não ser com o código da cor hex.`;

        // Lista de modelos ordenados por preferência e disponibilidade
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-pro"
        ];

        let success = false;
        let lastError = "Erro na resposta da API do Gemini.";

        for (const model of models) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: promptText
                            }]
                        }]
                    })
                });

                if (res.ok) {
                    const result = await res.json();
                    let hex = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    
                    // Extrai o código HEX usando Regex para garantir consistência
                    const hexMatch = hex.match(/#[0-9A-Fa-f]{6}/);
                    if (hexMatch) {
                        hex = hexMatch[0];
                    } else {
                        const hexMatchNoHash = hex.match(/[0-9A-Fa-f]{6}/);
                        if (hexMatchNoHash) {
                            hex = `#${hexMatchNoHash[0]}`;
                        }
                    }

                    if (hex.startsWith("#")) {
                        handleVariationChange(index, "cor_hex", hex);
                        success = true;
                        break;
                    }
                } else {
                    const errorJson = await res.json().catch(() => ({}));
                    lastError = errorJson?.error?.message || `Erro na resposta da API do Gemini (${res.status}).`;
                    console.warn(`Erro no modelo ${model}:`, lastError);
                }
            } catch (err) {
                console.error(`Erro ao conectar com ${model}:`, err);
                lastError = "Erro ao conectar com a API do Gemini.";
            }
        }

        if (!success) {
            setErrorMsg(lastError);
        }
        setGeneratingIndices(prev => ({ ...prev, [index]: false }));
    };

    const generateDescription = async () => {
        const firstVar = formData.variacoes[0] || {};
        if (!formData.nome || !formData.marca || !firstVar.tamanho || !firstVar.cor) {
            setErrorMsg("Preencha Nome, Marca, Tamanho e Cor antes de gerar a descrição.");
            return;
        }
        setErrorMsg("");
        setIsGeneratingDescription(true);

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        
        // Coleta as variações de tamanho e cor para compor um prompt detalhado
        const variacoesTexto = formData.variacoes
            .map(v => `Tamanho: ${v.tamanho}, Cor: ${v.cor}`)
            .join("; ");

        const promptText = `Produto: ${formData.nome}
        Marca: ${formData.marca}
        Variações: ${variacoesTexto}

        Gere uma descrição curta, direta e atraente (máximo 3 frases) para este produto comercial. Deve ser focada para a descrição do produto no e-commerce.
        Não responda com nenhuma formatação markdown (como hashtags ou asteriscos), apenas texto limpo.`;

        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-pro"
        ];

        let success = false;
        let lastError = "Erro na resposta da API do Gemini.";

        for (const model of models) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: promptText
                            }]
                        }]
                    })
                });

                if (res.ok) {
                    const result = await res.json();
                    let text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    if (text) {
                        text = text.replace(/[*#`]/g, ""); // Remove resquícios de markdown
                        
                        // Efeito de Digitação Suave (Typing Animation)
                        let currentText = "";
                        let i = 0;
                        
                        if (typingIntervalRef.current) {
                            clearInterval(typingIntervalRef.current);
                        }

                        typingIntervalRef.current = setInterval(() => {
                            if (i < text.length) {
                                currentText += text[i];
                                handleProductChange("descricao", currentText);
                                i++;
                            } else {
                                clearInterval(typingIntervalRef.current);
                                setIsGeneratingDescription(false);
                            }
                        }, 12); // Intervalo super suave de 12ms
                        
                        success = true;
                        break;
                    }
                } else {
                    const errorJson = await res.json().catch(() => ({}));
                    lastError = errorJson?.error?.message || `Erro na resposta da API do Gemini (${res.status}).`;
                    console.warn(`Erro no modelo ${model} ao gerar descrição:`, lastError);
                }
            } catch (err) {
                console.error(`Erro ao conectar com ${model}:`, err);
                lastError = "Erro ao conectar com a API do Gemini.";
            }
        }

        if (!success) {
            setErrorMsg(lastError);
            setIsGeneratingDescription(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.marca) {
            setErrorMsg("Nome e Marca são campos obrigatórios.");
            return;
        }

        // Validate variations
        for (let i = 0; i < formData.variacoes.length; i++) {
            const v = formData.variacoes[i];
            if (!v.tamanho || !v.cor) {
                setErrorMsg(`A variação #${i + 1} precisa conter Tamanho e Cor.`);
                return;
            }
            if (v.preco_custo < 0 || v.preco_venda < 0 || v.qtd_estoque < 0) {
                setErrorMsg(`Valores na variação #${i + 1} não podem ser negativos.`);
                return;
            }
        }

        setIsSubmitting(true);
        setErrorMsg("");

        try {
            const payload = {
                nome: formData.nome,
                marca: formData.marca,
                codigo: formData.codigo || null,
                descricao: formData.descricao || null,
                variacoes: formData.variacoes.map(v => ({
                    tamanho: v.tamanho,
                    cor: v.cor, // no banco salvamos a cor digitada
                    qtd_estoque: parseInt(v.qtd_estoque) || 0,
                    preco_custo: parseFloat(v.preco_custo) || 0,
                    preco_venda: parseFloat(v.preco_venda) || 0
                }))
            };

            const res = await fetch("http://localhost:3001/api/produtos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Reset form and call onSuccess/onClose
                setFormData({
                    nome: "",
                    marca: "",
                    codigo: "",
                    descricao: "",
                    variacoes: [
                        { tamanho: "U", cor: "Única", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }
                    ]
                });
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setErrorMsg(data.erro || "Erro ao cadastrar produto.");
            }
        } catch (err) {
            console.error("Erro ao cadastrar produto:", err);
            setErrorMsg("Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-600 rounded-2xl w-[750px] flex flex-col text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h3 className="text-[16px] font-medium tracking-wide text-black dark:text-white flex items-center gap-2">
                        Cadastrar Novo Produto
                    </h3>
                    <button 
                        type="button"
                        onClick={() => {
                            setErrorMsg("");
                            onClose();
                        }}
                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            <p>{errorMsg}</p>
                        </div>
                    )}
                    
                    {/* Dados Gerais */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs dark:text-neutral-300 text-black">Nome do Produto</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => handleProductChange("nome", e.target.value)}
                                    placeholder="Ex: iPhone 16 Pro Max"
                                    className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-2 text-sm text-white outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs dark:text-neutral-300 text-black">Marca</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.marca}
                                    onChange={(e) => handleProductChange("marca", e.target.value)}
                                    placeholder="Ex: Apple"
                                    className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-2 text-sm text-white outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs dark:text-neutral-300 text-black">Código (SKU/EAN)</label>
                                <input 
                                    type="text"
                                    value={formData.codigo}
                                    onChange={(e) => handleProductChange("codigo", e.target.value)}
                                    placeholder="Ex: APP1203847DK"
                                    className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-2 text-sm text-white outline-none transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1.5 mt-4 relative">
                            <div className="flex items-center justify-between">
                                <label className="text-xs dark:text-neutral-300 text-black">Descrição (Opcional)</label>
                                <button
                                    type="button"
                                    disabled={isGeneratingDescription}
                                    onClick={generateDescription}
                                    className="text-[11px] absolute bottom-1 right-1 dark:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded border border-neutral-700/60 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {isGeneratingDescription ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                                            Pensando...
                                        </>
                                    ) : (
                                        <>
                                            <img src="/images/geminiIcon.svg" className="w-[18px]"/>
                                            Gerar com Gemini
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea 
                                value={formData.descricao}
                                onChange={(e) => handleProductChange("descricao", e.target.value)}
                                placeholder="Descreva as principais características do produto..."
                                rows="2"
                                className="bg-neutral-900 h-[140px] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-2 text-sm text-white outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                    
                    {/* Variações */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                            <h4 className="text-[13px] font-semibold text-neutral-300 uppercase tracking-wider">
                                Variações & Estoque
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddVariation}
                                className="text-[13px] dark:bg-white bg-black dark:text-black text-white pl-1 pr-3 py-1 rounded-md flex items-center gap-1 buttonHover"
                            >
                                <span className="material-symbols-outlined !text-[24px]">add</span>
                                Variação
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.variacoes.map((variation, index) => (
                                <div 
                                    key={index} 
                                    className="flex flex-col md:flex-row md:items-end gap-3 bg-neutral-900/50 p-4 rounded border border-neutral-800 relative group animate-in fade-in duration-200"
                                >
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[11px] text-neutral-400 font-medium">Tamanho *</label>
                                            <input 
                                                type="text"
                                                required
                                                value={variation.tamanho}
                                                onChange={(e) => handleVariationChange(index, "tamanho", e.target.value)}
                                                placeholder="Ex: M, 42, G"
                                                className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-1.5 text-xs text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[11px] text-neutral-400 font-medium">Cor *</label>
                                            <div className="relative flex items-center gap-1.5 relative">
                                                <input 
                                                    type="text"
                                                    required
                                                    value={variation.cor}
                                                    onChange={(e) => handleVariationChange(index, "cor", e.target.value)}
                                                    placeholder="Ex: Preto"
                                                    className="bg-neutral-900 w-[120px] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md px-3 py-1.5 text-xs text-white outline-none transition-all flex-1"
                                                />
                                                {variation.cor_hex && (
                                                    <div 
                                                        className="absolute right-1 w-5 h-5 rounded border border-neutral-700 shadow-sm shrink-0 transition-all duration-300"
                                                        style={{ backgroundColor: variation.cor_hex }}
                                                        title={`Cor gerada: ${variation.cor_hex}`}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={generatingIndices[index]}
                                                onClick={() => generateColorForVariation(index)}
                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-neutral-800/40 hover:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700/60 transition flex items-center gap-1 self-start cursor-pointer disabled:opacity-50 mt-1"
                                            >
                                                {generatingIndices[index] ? (
                                                    <>
                                                        <div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                                        Gerando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-[12px] !text-[12px]">palette</span>
                                                        Gerar cor
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[11px] text-neutral-400 font-medium">Qtd Estoque *</label>
                                            <input 
                                                type="number"
                                                required
                                                min="0"
                                                value={variation.qtd_estoque}
                                                onChange={(e) => handleVariationChange(index, "qtd_estoque", e.target.value)}
                                                placeholder="0"
                                                className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-3 py-1.5 text-xs text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[11px] text-neutral-400 font-medium">Preço Custo *</label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1.5 text-neutral-500 text-xs">R$</span>
                                                <input 
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={variation.preco_custo}
                                                    onChange={(e) => handleVariationChange(index, "preco_custo", e.target.value)}
                                                    placeholder="0.00"
                                                    className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-7 pr-3 py-1.5 text-xs text-white outline-none transition-all w-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[11px] text-neutral-400 font-medium">Preço Venda *</label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1.5 text-neutral-500 text-xs">R$</span>
                                                <input 
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={variation.preco_venda}
                                                    onChange={(e) => handleVariationChange(index, "preco_venda", e.target.value)}
                                                    placeholder="0.00"
                                                    className="bg-neutral-900 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-7 pr-3 py-1.5 text-xs text-white outline-none transition-all w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {formData.variacoes.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveVariation(index)}
                                            className="text-red-400 hover:text-red-300 md:mb-1 hover:bg-red-500/10 p-1.5 rounded transition cursor-pointer flex items-center justify-center"
                                            title="Remover Variação"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="border-t border-neutral-800 pt-4 flex items-center justify-end gap-3 bg-transparent">
                        <button 
                            type="button"
                            onClick={() => {
                                onClose();
                                setErrorMsg("");
                            }}
                            disabled={isSubmitting}
                            className="px-3 h-[35px] border border-neutral-800 text-[13px] hover:bg-neutral-950 hover:border-neutral-700 text-neutral-300 rounded-md disabled:opacity-50 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="text-[13px] bg-bunkerGreen dark:text-black text-white px-3 h-[35px] rounded-md flex items-center gap-1 buttonHover disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Cadastrando...
                                </>
                            ) : (
                                <>Cadastrar Produto</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
