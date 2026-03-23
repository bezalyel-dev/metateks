export function TvDashboardPage() {
  const totalClientes = 500
  const metaMensal = 20
  const metaAnual = 240
  const mensalAtual = 0
  const anualAtual = 0

  const progressoMensal = Math.min(100, Math.round((mensalAtual / metaMensal) * 100))
  const progressoAnual = Math.min(100, Math.round((anualAtual / metaAnual) * 100))

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="px-8 pt-8 md:px-14 md:pt-10">
        <p className="text-center text-lg font-semibold uppercase tracking-[0.35em] text-slate-300 md:text-2xl">
          Teks Software
        </p>
      </header>

      <section className="flex flex-1 items-center justify-center px-4">
        <h1 className="text-center text-[72px] font-extrabold leading-none tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.18)] sm:text-[98px] md:text-[132px] lg:text-[170px]">
          {totalClientes} clientes
        </h1>
      </section>

      <div className="grid gap-6 px-6 pb-8 md:grid-cols-2 md:gap-8 md:px-14 md:pb-10">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-sm md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-200 md:text-xl">Meta Mensal</p>
            <p className="text-sm font-medium text-slate-300 md:text-lg">
              {mensalAtual} / {metaMensal}
            </p>
          </div>

          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800 md:h-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-700"
              style={{ width: `${progressoMensal}%` }}
            />
          </div>

          <p className="mt-2 text-right text-xs font-medium text-slate-400 md:text-sm">
            {progressoMensal}%
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5 backdrop-blur-sm md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-200 md:text-xl">Meta Anual</p>
            <p className="text-sm font-medium text-slate-300 md:text-lg">
              {anualAtual} / {metaAnual}
            </p>
          </div>

          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800 md:h-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
              style={{ width: `${progressoAnual}%` }}
            />
          </div>

          <p className="mt-2 text-right text-xs font-medium text-slate-400 md:text-sm">
            {progressoAnual}%
          </p>
        </article>
      </div>
    </main>
  )
}
