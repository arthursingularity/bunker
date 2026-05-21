'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [senhaType, setSenhaType] = useState('password');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setErro(result.error);
      setLoading(false);
    } else {
      router.push('/caixa');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        {/* Form Container (Mac Dialog Style) */}
        <div className="w-full bg-white dark:bg-neutral-900/60 rounded-3xl border border-neutral-300 dark:border-white/10 p-7 px-6">
          <div className='flex items-center justify-center'>
            <img src="/images/logoWhite.svg" alt="" className="w-28 hidden dark:block" />
            <img src="/images/logoBlack.svg" alt="" className="w-28 block dark:hidden" />
          </div>
          <h2 className="text-[24px] font-medium text-left mt-8 mb-4">Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] ml-1">E-mail</label>
              <div className='relative'>
                <input
                  type="email"
                  placeholder="usuario@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800/50 tracking-wide border border-neutral-300 dark:border-white/10 rounded-lg text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                />
                {email && (
                  <div className='absolute right-[6px] top-[6px] flex items-center'>
                    <span
                      onClick={() => setEmail('')}
                      className="material-symbols-outlined !text-[22px] hover:bg-red-400 hover:text-white dark:hover:bg-red-400 dark:hover:text-black p-[2px] rounded cursor-pointer text-neutral-600 dark:text-neutral-300">
                        close
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] ml-1">Senha</label>
              <div className='relative'>
                <input
                  type={senhaType}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800/50 tracking-wide border border-neutral-300 dark:border-white/10 rounded-lg text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                />
                {senha && (
                  <div className='absolute right-[5px] top-[6px] flex items-center space-x-1'>
                    <span
                      onClick={() => setSenhaType(senhaType === 'password' ? 'text' : 'password')}
                      className="material-symbols-outlined !text-[22px] hover:bg-neutral-200 dark:hover:bg-neutral-700 p-[2px] rounded cursor-pointer text-neutral-600 dark:text-neutral-300">
                      {senhaType === 'password' ? 'visibility_off' : 'visibility'}
                    </span>
                    <span
                      onClick={() => setSenha('')}
                      className="material-symbols-outlined !text-[22px] hover:bg-red-400 hover:text-white dark:hover:text-black p-[2px] rounded cursor-pointer text-neutral-600 dark:text-neutral-300">
                        close
                    </span>
                  </div>
                )}
              </div>
            </div>

            {erro && (
              <p className="text-red-500 tracking-wide text-[13px] text-left">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2 bg-neutral-900 dark:bg-white dark:text-black text-white rounded-lg text-[13px] cursor-pointer hover:opacity-80 transition-opacity flex justify-center items-center h-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <p className="text-[11px] text-black/40 dark:text-white/40 mt-6">
          Bunker &copy; 2026
        </p>

      </div>
    </div>
  );
}