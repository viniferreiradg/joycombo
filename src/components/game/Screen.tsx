// Area do jogo: largura total da tela, quase a altura toda (sobra um pouco
// para o visitante ver que a pagina continua e conseguir rolar no celular).
// Tambem aparece sozinha enquanto o codigo do jogo carrega.
export default function Screen({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative h-[85svh] min-h-[480px] w-full overflow-hidden bg-ink md:h-[90svh]">
      {children ?? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="animate-blink font-title text-xl font-bold uppercase tracking-[0.2em] text-accent">Press start</span>
        </div>
      )}
    </div>
  )
}
