"use client";

import React, { useState, useEffect } from "react";
import CadastroProdutoModal from "./CadastroProdutoModal";
import GerenciarCategoriasModal from "./GerenciarCategoriasModal";
import { API_URL } from "@/config/api";

export default function EstoqueTable({ apiToken }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Novos estados para edição, busca, filtros e exclusão
    const [editProduct, setEditProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterStock, setFilterStock] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productsToDelete, setProductsToDelete] = useState([]);

    const fetchCategories = async () => {
        if (!apiToken) return;
        try {
            const res = await fetch(`${API_URL}/api/categorias`, {
                headers: {
                    Authorization: `Bearer ${apiToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error("Erro ao buscar categorias:", err);
        }
    };

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
            }
        } catch (err) {
            console.error("Erro na requisição de produtos:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        await Promise.all([fetchProducts(), fetchCategories()]);
    };

    useEffect(() => {
        refreshData();
    }, [apiToken]);

    // Flat-map products and their variations to row list
    const rows = products.flatMap(product => {
        const productCategory = categories.find(c => c.produto_codigo && c.produto_codigo === product.codigo)?.nome || "-";
        if (!product.variacoes || product.variacoes.length === 0) {
            return [{
                rowId: `p-${product.id}`,
                productId: product.id,
                codigo: product.codigo || "-",
                nome: product.nome,
                marca: product.marca,
                categoria: productCategory,
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
            categoria: productCategory,
            variacao: `${v.cor} / ${v.tamanho}`,
            preco_custo: parseFloat(v.preco_custo) || 0,
            preco_venda: parseFloat(v.preco_venda) || 0,
            qtd_estoque: v.qtd_estoque,
            createdAt: v.createdAt || product.createdAt,
            updatedAt: v.updatedAt || product.updatedAt
        }));
    });

    // Filtragem em tempo real de linhas
    const filteredRows = rows.filter(row => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesNome = row.nome?.toLowerCase().includes(query);
            const matchesMarca = row.marca?.toLowerCase().includes(query);
            const matchesCodigo = row.codigo?.toLowerCase().includes(query);
            const matchesVariacao = row.variacao?.toLowerCase().includes(query);
            const matchesCategoria = row.categoria?.toLowerCase().includes(query);
            if (!matchesNome && !matchesMarca && !matchesCodigo && !matchesVariacao && !matchesCategoria) {
                return false;
            }
        }
        if (filterBrand && row.marca !== filterBrand) {
            return false;
        }
        if (filterStock) {
            if (filterStock === "in_stock" && row.qtd_estoque <= 0) return false;
            if (filterStock === "out_of_stock" && row.qtd_estoque !== 0) return false;
            if (filterStock === "low_stock" && (row.qtd_estoque <= 0 || row.qtd_estoque >= 5)) return false;
        }
        return true;
    });

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

    // Helpers adicionais para controle de exclusão e edição
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditProduct(null);
    };

    const handleDeleteProducts = async (productIds) => {
        if (!apiToken || productIds.length === 0) return;
        setIsDeleting(true);
        try {
            const deletePromises = productIds.map(id =>
                fetch(`${API_URL}/api/produtos/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${apiToken}`
                    }
                })
            );
            const results = await Promise.all(deletePromises);
            const allOk = results.every(res => res.ok);
            if (allOk) {
                setSelectedRows({});
                fetchProducts();
                setDeleteModalOpen(false);
                setProductsToDelete([]);
            } else {
                alert("Alguns produtos não puderam ser excluídos.");
            }
        } catch (err) {
            console.error("Erro ao excluir produtos:", err);
            alert("Erro ao tentar excluir os produtos.");
        } finally {
            setIsDeleting(false);
        }
    };

    const getSelectedProductIds = () => {
        const ids = new Set();
        rows.forEach(row => {
            if (selectedRows[row.rowId]) {
                ids.add(row.productId);
            }
        });
        return Array.from(ids);
    };

    const getSelectedProducts = () => {
        const ids = getSelectedProductIds();
        return products.filter(p => ids.includes(p.id));
    };

    const handleTriggerBulkDelete = () => {
        const selected = getSelectedProducts();
        if (selected.length > 0) {
            setProductsToDelete(selected);
            setDeleteModalOpen(true);
        }
    };

    const handleTriggerSingleDelete = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setProductsToDelete([product]);
            setDeleteModalOpen(true);
        }
    };

    const brands = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));

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
            {/* Top Toolbar: Search, Filters and Add Product */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                {selectedCount > 0 ? (
                    <div className="flex-1 flex flex-wrap items-center gap-3 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 px-4 py-1 rounded-lg animate-in slide-in-from-top-2 duration-200">
                        <span className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            {selectedCount} {selectedCount === 1 ? "variação selecionada" : "variações selecionadas"}
                        </span>
                        <div className="h-4 w-[1px] bg-indigo-500/20 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const selectedIds = getSelectedProductIds();
                                    if (selectedIds.length === 1) {
                                        const prod = products.find(p => p.id === selectedIds[0]);
                                        if (prod) {
                                            setEditProduct(prod);
                                            setIsModalOpen(true);
                                        }
                                    }
                                }}
                                disabled={getSelectedProductIds().length !== 1}
                                className="px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-md text-[12px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-medium"
                                title="Editar produto selecionado"
                            >
                                <span className="material-symbols-outlined !text-[16px]">edit</span>
                                Editar
                            </button>
                            <button
                                onClick={handleTriggerBulkDelete}
                                className="px-3 py-1 bg-red-600 text-white rounded-md text-[12px] hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                            >
                                <span className="material-symbols-outlined !text-[16px]">delete</span>
                                Excluir
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedRows({})}
                            className="ml-auto text-[12px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
                        >
                            Limpar Seleção
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-[280px]">
                            <span className="material-symbols-outlined absolute left-3 top-2 text-neutral-400 !text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por nome, variação..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 focus:border-neutral-400 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none placeholder:text-neutral-400 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200"
                                >
                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Brand Filter */}
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            className="w-full sm:w-[160px] px-3 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="">Todas as Marcas</option>
                            {brands.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>

                        {/* Stock Level Filter */}
                        <select
                            value={filterStock}
                            onChange={(e) => setFilterStock(e.target.value)}
                            className="w-full sm:w-[160px] px-3 py-1.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-[13px] text-neutral-900 dark:text-neutral-200 outline-none cursor-pointer"
                        >
                            <option value="">Todos Estoques</option>
                            <option value="in_stock">Com Estoque</option>
                            <option value="low_stock">Estoque Baixo (&lt; 5)</option>
                            <option value="out_of_stock">Sem Estoque</option>
                        </select>
                    </div>
                )}

                {/* Right Side: Action Buttons */}
                <div className="shrink-0 flex items-center justify-end w-full md:w-auto gap-2">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="font-light border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md px-3.5 pl-2 space-x-1.5 text-[13px] h-[35px] flex items-center justify-center cursor-pointer font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors w-full sm:w-auto"
                    >
                        <span className="material-symbols-outlined !text-[22px]">
                            category
                        </span>
                        <span>Categorias</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditProduct(null);
                            setIsModalOpen(true);
                        }}
                        className="font-light dark:bg-white bg-black dark:text-black buttonHover text-white rounded-md px-4 pl-2 space-x-1 text-[13px] h-[35px] flex items-center justify-center cursor-pointer font-medium w-full sm:w-auto"
                    >
                        <span className="material-symbols-outlined !text-[26px]">
                            add
                        </span>
                        <span>Produto</span>
                    </button>
                </div>
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
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Codigo</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Nome</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Categoria</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Variação</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 text-right">
                                <span>Preço Custo</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 text-right">
                                <span>Preço Venda</span>
                            </th>
                            <th className="px-4 text-[12px] text-black dark:text-white tracking-wider py-3 text-right">
                                <span>Lucro / Margem</span>
                            </th>
                            <th className="px-4 text-center  text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Estoque Atual</span>
                            </th>
                            <th className="px-4 text-center text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Cadastrado</span>
                            </th>
                            <th className="px-5 text-center text-[12px] text-black dark:text-white tracking-wider py-3">
                                <span>Atualizado</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300 dark:divide-neutral-800 bg-transparent">
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="py-12 text-center text-neutral-400">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[13px] font-light">Carregando estoque...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="py-16 text-center text-neutral-400">
                                    <p className="text-[14px] font-light text-neutral-200">Nenhum produto em estoque ou correspondente à busca.</p>
                                    <p className="text-[12px] text-neutral-500 font-light mt-1">
                                        {searchQuery || filterBrand || filterStock
                                            ? "Tente ajustar seus filtros de pesquisa."
                                            : "Clique em '+ Produto' para cadastrar seu primeiro produto."}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => {
                                const isChecked = !!selectedRows[row.rowId];
                                const isOutOfStock = row.qtd_estoque === 0;
                                return (
                                    <tr
                                        key={row.rowId}
                                        className={`transition-colors border-b border-neutral-200 dark:border-neutral-800/60 last:border-b-0 ${
                                            isChecked 
                                                ? "bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10" 
                                                : isOutOfStock 
                                                    ? "bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/5 dark:hover:bg-red-500/10 border-l-2 border-red-500/50" 
                                                    : "hover:bg-neutral-200/20 dark:hover:bg-neutral-800/20"
                                        }`}
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
                                        <td className="px-4">
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-light border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900">
                                                {row.categoria}
                                            </span>
                                        </td>
                                        <td className="px-4">
                                            <span className="px-2 py-1 rounded-[4px] text-[11px] font-medium tracking-wide border border-neutral-700/30 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/50">
                                                {row.variacao}
                                            </span>
                                        </td>
                                        <td className="px-4 text-[13px] text-neutral-600 dark:text-[#E4E4E7] font-mono text-right">
                                            {formatCurrency(row.preco_custo)}
                                        </td>
                                        <td className="px-4 text-[13px] text-neutral-600 dark:text-[#E4E4E7] font-mono text-right">
                                            {formatCurrency(row.preco_venda)}
                                        </td>
                                        <td className={`px-4 text-[13px] font-mono text-right font-semibold ${(row.preco_venda - row.preco_custo) > 0 ? "text-emerald-600 dark:text-emerald-400" : (row.preco_venda - row.preco_custo) < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                                            {formatCurrency(row.preco_venda - row.preco_custo)} 
                                            <span className="text-[12px] ml-1 font-normal opacity-85">
                                                ({row.preco_venda > 0 ? (((row.preco_venda - row.preco_custo) / row.preco_venda) * 100).toFixed(0) : 0}%)
                                            </span>
                                        </td>
                                        <td className="px-4 text-center">
                                            {isOutOfStock ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">
                                                    Zerado
                                                </span>
                                            ) : (
                                                <span className="text-[13px] text-neutral-600 dark:text-[#E4E4E7] font-mono">
                                                    {row.qtd_estoque}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 text-[13px] text-center text-neutral-500 dark:text-[#A1A1AA] font-light">
                                            {formatDate(row.createdAt)}
                                        </td>
                                        <td className="px-5 text-[13px] text-center text-neutral-500 dark:text-[#A1A1AA] font-light">
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
                onClose={handleCloseModal}
                apiToken={apiToken}
                onSuccess={refreshData}
                editProduct={editProduct}
            />

            {/* Modal de Confirmação de Exclusão Premium */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-2xl w-[450px] flex flex-col text-neutral-900 dark:text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Confirmar Exclusão
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isDeleting) {
                                        setDeleteModalOpen(false);
                                        setProductsToDelete([]);
                                    }
                                }}
                                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center"
                            >
                                <span className="material-symbols-outlined !text-[24px]">close</span>
                            </button>
                        </div>
                        <div className="p-5 text-neutral-800 dark:text-neutral-200 text-[14px] space-y-3">
                            <p>Tem certeza que deseja excluir o(s) seguinte(s) produto(s)? Esta ação é irreversível e apagará todas as variações associadas de forma permanente.</p>
                            <div className="max-h-[150px] overflow-y-auto bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg p-3 space-y-1.5">
                                {productsToDelete.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                        <span>• {p.nome}</span>
                                        <span className="text-[10px] text-neutral-500">{p.marca}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-neutral-300 dark:border-neutral-800 flex items-center justify-end gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setProductsToDelete([]);
                                }}
                                disabled={isDeleting}
                                className="px-3 h-[32px] border border-neutral-300 dark:border-neutral-700 text-[12px] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 rounded-md disabled:opacity-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteProducts(productsToDelete.map(p => p.id))}
                                disabled={isDeleting}
                                className="px-3 h-[32px] bg-red-600 hover:bg-red-700 text-white text-[12px] rounded-md disabled:opacity-50 flex items-center gap-1 cursor-pointer font-medium"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Excluindo...
                                    </>
                                ) : (
                                    "Excluir definitivamente"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modular de Categorias */}
            <GerenciarCategoriasModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                apiToken={apiToken}
                onSuccess={refreshData}
            />
        </div>
    )
}
