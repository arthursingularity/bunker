import Link from "next/link";
export const metadata = { title: "Início" };

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased overflow-hidden selection:bg-blue-500/30 items-center justify-center">
      
      {/* "Mac Window" Container */}
      <div className="w-full max-w-2xl bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-2xl rounded-xl border border-black/10 dark:border-white/10 shadow-lg overflow-hidden flex flex-col">
        
        {/* Mac Titlebar */}
        <div className="h-12 flex items-center justify-center relative border-b border-black/5 dark:border-white/10">
          <div className="absolute left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/10 dark:border-transparent"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10 dark:border-transparent"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10 dark:border-transparent"></div>
          </div>
          <span className="text-[13px] font-semibold text-black/70 dark:text-white/70">Projeto Futuro</span>
        </div>

        {/* Content */}
        <div className="p-12 flex flex-col items-center text-center">
          
          {/* Subtle App Icon Replacement */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-md flex items-center justify-center mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Bem-vindo ao Sistema
          </h1>
          
          <p className="text-[15px] leading-relaxed text-black/60 dark:text-white/60 max-w-md mb-8">
            Gerencie sua loja e acompanhe o desempenho do seu negócio com a precisão e a elegância de uma experiência nativa.
          </p>

          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="px-6 py-2 rounded-lg bg-blue-500 text-white text-[13px] font-medium shadow-sm hover:bg-blue-600 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              Fazer Login
            </Link>
            <a 
              href="#" 
              className="px-6 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-[#1d1d1f] dark:text-[#f5f5f7] text-[13px] font-medium hover:bg-black/10 dark:hover:bg-white/20 transition-colors focus:outline-none"
            >
              Saiba Mais
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
