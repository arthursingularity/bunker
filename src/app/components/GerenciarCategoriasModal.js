"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";

export default function GerenciarCategoriasModal({ isOpen, onClose, apiToken, onSuccess }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchCategories = async () => {
        if (!apiToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/categorias`, {
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            } else {
                console.error("Erro ao buscar categorias");
            }
        } catch (err) {
            console.error("Erro de comunicação:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            setErrorMsg("");
            setSuccessMsg("");
            setNewCategoryName("");
        }
    }, [isOpen, apiToken]);

    if (!isOpen) return null;

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await fetch(`${API_URL}/api/categorias`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({ nome: newCategoryName.trim() })
            });

            if (res.ok) {
                setNewCategoryName("");
                setSuccessMsg("Categoria criada com sucesso!");
                await fetchCategories();
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                setErrorMsg(data.erro || "Erro ao criar categoria.");
            }
        } catch (err) {
            console.error("Erro ao criar categoria:", err);
            setErrorMsg("Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryName) => {
        if (!window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Todos os produtos vinculados a ela ficarão sem categoria.`)) {
            return;
        }

        setIsSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await fetch(`${API_URL}/api/categorias/nome`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`
                },
                body: JSON.stringify({ nome: categoryName })
            });

            if (res.ok) {
                setSuccessMsg(`Categoria "${categoryName}" excluída com sucesso!`);
                await fetchCategories();
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                setErrorMsg(data.erro || "Erro ao excluir categoria.");
            }
        } catch (err) {
            console.error("Erro ao excluir categoria:", err);
            setErrorMsg("Erro de comunicação com o servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Extract unique category names
    const uniqueCategories = Array.from(new Set(categories.map(c => c.nome))).filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-2xl w-[500px] flex flex-col text-neutral-900 dark:text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                    <h3 className="text-[16px] font-medium tracking-wide flex items-center gap-2 text-neutral-900 dark:text-white">
                        <span className="material-symbols-outlined text-[20px]">category</span>
                        Gerenciar Categorias
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center"
                    >
                        <span className="material-symbols-outlined !text-[24px]">close</span>
                    </button>
                </div>

                {/* Form & List */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded text-xs flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded text-xs flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <p>{successMsg}</p>
                        </div>
                    )}

                    {/* Criar nova categoria */}
                    <form onSubmit={handleCreateCategory} className="flex gap-2">
                        <input
                            type="text"
                            required
                            placeholder="Nome da categoria (ex: Capinhas, Películas)"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            disabled={isSubmitting}
                            className="flex-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 rounded-md px-3 py-1.5 text-[13px] text-neutral-900 dark:text-neutral-200 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !newCategoryName.trim()}
                            className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition disabled:opacity-50 px-4 rounded-md text-[13px] font-medium h-[34px] flex items-center justify-center cursor-pointer"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Criar"
                            )}
                        </button>
                    </form>

                    {/* Lista de Categorias Cadastradas */}
                    <div className="space-y-2 pt-2">
                        <label className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Categorias Ativas ({uniqueCategories.length})
                        </label>

                        {loading ? (
                            <div className="py-8 flex justify-center items-center text-neutral-500 text-xs gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                Carregando...
                            </div>
                        ) : uniqueCategories.length === 0 ? (
                            <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg">
                                Nenhuma categoria cadastrada ainda.
                            </div>
                        ) : (
                            <div className="max-h-[220px] overflow-y-auto border border-neutral-300 dark:border-neutral-800 rounded-lg divide-y divide-neutral-300 dark:divide-neutral-800">
                                {uniqueCategories.map((name) => (
                                    <div key={name} className="px-4 py-2.5 flex items-center justify-between text-[13px] hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategory(name)}
                                            disabled={isSubmitting}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-1 rounded transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                                            title="Excluir Categoria"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-300 dark:border-neutral-800 flex items-center justify-end p-4 bg-neutral-50 dark:bg-neutral-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 h-[32px] border border-neutral-300 dark:border-neutral-700 text-[12px] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 rounded-md cursor-pointer font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
