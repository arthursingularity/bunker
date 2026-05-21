"use client";

import React from "react";

export default function UsersTable({ initialUsers = [] }) {
    return (
        <div className="w-full overflow-x-auto border borderColor rounded-md bg-white dark:bg-[#0E0E0E]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr className="border-b borderColor bg-neutral-50 dark:bg-[#141414]">
                        <th className="py-3 pb-2 pl-4 pr-2 w-[40px] font-medium text-[13px] text-neutral-500">
                            <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 bg-transparent accent-neutral-800 dark:accent-neutral-200 cursor-pointer" />
                        </th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Nome</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Status</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Cargo</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Email</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Empresa_id</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Empresa</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Cadastrado</th>
                        <th className="py-3 px-4 font-medium text-[13px] text-neutral-800 dark:text-neutral-300">Atualizado</th>
                    </tr>
                </thead>
                <tbody>
                    {initialUsers.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="py-8 text-center text-neutral-500 text-[13px] font-light">
                                Nenhum usuário cadastrado.
                            </td>
                        </tr>
                    ) : (
                        initialUsers.map((user) => {
                            const isWorking = user.ativo; // Assumindo que o banco tem uma flag de ativo

                            return (
                                <tr key={user.id} className="border-b borderColor last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                                    <td className="pl-4 pr-2">
                                        <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 bg-transparent accent-neutral-800 dark:accent-neutral-200 cursor-pointer" />
                                    </td>
                                    <td className="py-1 px-4 flex items-center space-x-3">
                                        <div className="w-[30px] h-[30px] rounded-full overflow-hidden bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0">
                                            {user.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-200 tracking-wide">{user.nome}</span>
                                    </td>
                                    <td className="px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border tracking-wide ${isWorking
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                                                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                                            }`}>
                                            {isWorking ? "Ativo" : "Inativo"}
                                        </span>
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide capitalize">
                                        {user.cargo}
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide">
                                        {user.email}
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide">
                                        {user.empresa_id}
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide capitalize">
                                        {user.nome_fantasia || "N/A"}
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide">
                                        {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-4 text-[13px] text-neutral-700 dark:text-neutral-300 font-light tracking-wide">
                                        {new Date(user.updatedAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
