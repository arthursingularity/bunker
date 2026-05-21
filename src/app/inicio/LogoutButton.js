'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-black/50 dark:text-white/50 hover:text-red-500 dark:hover:text-red-400 text-[13px] font-medium transition-colors focus:outline-none flex items-center justify-center p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
      title="Sair do sistema"
    >
      <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 30H14V28H6C4.89543 28 4 27.1046 4 26V6C4 4.89543 4.89543 4 6 4H14V2H6C3.79086 2 2 3.79086 2 6V26C2 28.2091 3.79086 30 6 30Z"/>
        <path d="M20.5859 20.5859L25.1719 16L20.5859 11.4141L19.1719 12.8281L21.3438 15H10V17H21.3438L19.1719 19.1719L20.5859 20.5859Z"/>
      </svg>
    </button>
  );
}
