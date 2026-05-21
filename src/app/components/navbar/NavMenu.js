"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function NavMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const menuRef = useRef(null);

    useEffect(() => {
        // Verifica o tema atual no carregamento a partir do localStorage
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
            setTheme("dark");
        } else {
            setTheme("light");
        }
        
        // Fecha o menu ao clicar fora
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = () => {
        if (theme === "light") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setTheme("dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setTheme("light");
        }
    };

    return (
        <div className="relative flex items-center justify-center" ref={menuRef}>
            <span 
                className={`material-symbols-outlined p-[2px] !text-[24px] rounded cursor-pointer select-none ${isOpen ? 'bg-neutral-200 dark:bg-neutral-800' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {!isOpen ? 'menu' : 'close'}
            </span>

            {isOpen && (
                <div className="absolute font-light tracking-wide top-full right-0 mt-2 w-52 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border borderColor shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[10px] z-50 text-[13px] text-neutral-800 p-1.5 font-sans">
                    <button 
                        onClick={toggleTheme}
                        className="w-full cursor-pointer text-left px-2 py-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 dark:text-white rounded-md flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined !text-[19px]">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                        <span>{theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}</span>
                    </button>
                    <div className="h-[1px] bg-neutral-300 dark:bg-neutral-800 w-full my-1"></div>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full text-left px-2 py-1.5 dark:text-neutral-500 cursor-pointer hover:bg-bunkerRed dark:hover:text-white hover:text-white rounded-md flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined !text-[19px]">logout</span>
                        <span>Sair</span>
                    </button>
                </div>
            )}
        </div>
    );
}
