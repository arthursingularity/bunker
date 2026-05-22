"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

const emptyForm = {
    nome: "",
    marca: "",
    codigo: "",
    variacoes: [
        { tamanho: "", cor: "", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }
    ]
};

export default function CadastroProdutoModal({ isOpen, onClose, apiToken, onSuccess, editProduct }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [generatingIndices, setGeneratingIndices] = useState({});
    const [formData, setFormData] = useState(emptyForm);

    const isEditMode = !!editProduct;

    // Populate form when opening in edit mode
    useEffect(() => {
        if (isOpen && editProduct) {
            setFormData({
                nome: editProduct.nome || "",
                marca: editProduct.marca || "",
                codigo: editProduct.codigo || "",
                variacoes: editProduct.variacoes && editProduct.variacoes.length > 0
                    ? editProduct.variacoes.map(v => ({
                        tamanho: v.tamanho || "",
                        cor: v.cor || "",
                        qtd_estoque: v.qtd_estoque || 0,
                        preco_custo: v.preco_custo || 0,
                        preco_venda: v.preco_venda || 0,
                        cor_hex: v.cor_hex || ""
                    }))
                    : [{ tamanho: "", cor: "", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }]
            });
            setErrorMsg("");
        } else if (isOpen && !editProduct) {
            setFormData({ ...emptyForm, variacoes: [{ tamanho: "", cor: "", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }] });
            setErrorMsg("");
        }
    }, [isOpen, editProduct]);

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
                variacoes: formData.variacoes.map(v => ({
                    tamanho: v.tamanho,
                    cor: v.cor,
                    qtd_estoque: parseInt(v.qtd_estoque) || 0,
                    preco_custo: parseFloat(v.preco_custo) || 0,
                    preco_venda: parseFloat(v.preco_venda) || 0
                }))
            };

            const url = isEditMode
                ? `${API_URL}/api/produtos/${editProduct.id}`
                : `${API_URL}/api/produtos`;

            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setFormData({ ...emptyForm, variacoes: [{ tamanho: "", cor: "", qtd_estoque: 0, preco_custo: 0, preco_venda: 0, cor_hex: "" }] });
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setErrorMsg(data.erro || (isEditMode ? "Erro ao atualizar produto." : "Erro ao cadastrar produto."));
            }
        } catch (err) {
            console.error(isEditMode ? "Erro ao atualizar produto:" : "Erro ao cadastrar produto:", err);
            setErrorMsg("Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir o produto "${editProduct.nome}"? Esta ação não pode ser desfeita e todas as suas variações serão removidas.`)) {
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");

        try {
            const url = `${API_URL}/api/produtos/${editProduct.id}`;
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setErrorMsg(data.erro || "Erro ao excluir produto.");
            }
        } catch (err) {
            console.error("Erro ao excluir produto:", err);
            setErrorMsg("Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-800 rounded-2xl w-[750px] flex flex-col text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                    <h3 className="text-[18px] font-medium tracking-wide text-black dark:text-white flex items-center gap-2">
                        {isEditMode ? "Editar Produto" : "Cadastrar Produto"}
                    </h3>
                    <button
                        type="button"
                        onClick={() => {
                            setErrorMsg("");
                            onClose();
                        }}
                        className="text-black dark:text-white cursor-pointer flex items-center"
                    >
                        <span className="material-symbols-outlined !text-[26px]">close</span>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6">
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {/* Dados Gerais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 px-4">
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[14px] dark:text-neutral-400 text-black">Nome do Produto</label>
                            <input
                                type="text"
                                required
                                value={formData.nome}
                                onChange={(e) => handleProductChange("nome", e.target.value)}
                                placeholder="Ex: iPhone 16 Pro Max"
                                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-2 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[14px] dark:text-neutral-400 text-black">Marca</label>
                            <input
                                type="text"
                                required
                                value={formData.marca}
                                onChange={(e) => handleProductChange("marca", e.target.value)}
                                placeholder="Ex: Apple"
                                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-2 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-[14px] dark:text-neutral-400 text-black">Código (SKU)</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={(e) => handleProductChange("codigo", e.target.value)}
                                placeholder="Ex: APP1203847DK"
                                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-2 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                            />
                        </div>
                    </div>

                    {/* Variações */}
                    <div className="px-4">
                        <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-neutral-800 pb-2">
                            <h4 className="text-[15px] font-medium tracking-wide text-black dark:text-white flex items-center gap-2">
                                Variações & Estoque
                            </h4>
                            <button
                                type="button"
                                onClick={handleAddVariation}
                                className="text-[12px] dark:bg-white bg-black dark:text-black text-white pl-1 pr-3 h-[27px] rounded-md flex items-center gap-1 buttonHover"
                            >
                                <span className="material-symbols-outlined !text-[22px]">add</span>
                                Variação
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.variacoes.map((variation, index) => (
                                <div
                                    key={index}
                                    className="flex flex-row items-end gap-3"
                                >
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[14px] dark:text-neutral-400 text-black">Tamanho *</label>
                                            <input
                                                type="text"
                                                required
                                                value={variation.tamanho}
                                                onChange={(e) => handleVariationChange(index, "tamanho", e.target.value)}
                                                placeholder="Ex: 128GB"
                                                className="bg-neutral-100 w-full dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[14px] dark:text-neutral-400 text-black">Cor *</label>
                                            <div className="relative flex items-center gap-1.5 relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={variation.cor}
                                                    onChange={(e) => handleVariationChange(index, "cor", e.target.value)}
                                                    placeholder="Ex: Preto"
                                                    className="bg-neutral-100 w-full dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                                                />
                                                {variation.cor_hex && (
                                                    <div
                                                        className="absolute right-1 w-5 h-5 rounded border border-neutral-700 shadow-sm shrink-0  duration-300"
                                                        style={{ backgroundColor: variation.cor_hex }}
                                                        title={`Cor gerada: ${variation.cor_hex}`}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[14px] dark:text-neutral-400 text-black">Qtd Estoque *</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={variation.qtd_estoque}
                                                onChange={(e) => handleVariationChange(index, "qtd_estoque", e.target.value)}
                                                placeholder="0"
                                                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[14px] dark:text-neutral-400 text-black">Preço Custo *</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-neutral-700 dark:text-neutral-500 text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={variation.preco_custo}
                                                    onChange={(e) => handleVariationChange(index, "preco_custo", e.target.value)}
                                                    placeholder="0.00"
                                                    className="bg-neutral-100 w-full pl-7 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[14px] dark:text-neutral-400 text-black">Preço Venda *</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-neutral-700 dark:text-neutral-500 text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={variation.preco_venda}
                                                    onChange={(e) => handleVariationChange(index, "preco_venda", e.target.value)}
                                                    placeholder="0.00"
                                                    className="bg-neutral-100 w-full pl-7 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none "
                                                />
                                            </div>
                                        </div>

                                    {formData.variacoes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariation(index)}
                                            className="text-red-400 hover:text-black dark:hover:text-white md:mb-1 hover:bg-red-500 p-1.5 rounded cursor-pointer flex items-center justify-center"
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
                    <div className="border-t border-neutral-300 dark:border-neutral-800 flex items-center justify-between bg-transparent p-4">
                        <div>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleDeleteProduct}
                                    disabled={isSubmitting}
                                    className="px-3 h-[35px] bg-red-600 hover:bg-red-700 text-white text-[13px] rounded-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors duration-200 font-medium"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Excluir Produto
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    setErrorMsg("");
                                }}
                                disabled={isSubmitting}
                                className="px-3 h-[35px] border border-neutral-300 dark:border-neutral-700 text-[13px] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 rounded-md disabled:opacity-50 cursor-pointer"
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
                                        {isEditMode ? "Salvando..." : "Cadastrando..."}
                                    </>
                                ) : (
                                    <>{isEditMode ? "Salvar Alterações" : "Cadastrar Produto"}</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
