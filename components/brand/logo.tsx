// Marca Fluido Fácil: frente de carro com capô aberto + gota de fluido,
// redesenhada em vetor a partir da referência raster do pacote de design
// (o README do pacote pede ícones finais vetoriais). Espelha app/icon.svg.
// Cores sólidas de propósito: <linearGradient> com id fixo quebra quando a
// primeira instância do SVG na página está display:none (ex.: sidebar no
// mobile), e a versão com gradiente fica só no ícone estático.

type LogoMarkProps = {
  className?: string;
  /** Desenha o quadrado escuro com contorno cobre atrás do símbolo. */
  tile?: boolean;
};

export function LogoMark({ className = "h-10 w-10", tile = true }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Fluido Fácil">
      {tile ? (
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          fill="#1a1816"
          stroke="#d48d45"
          strokeWidth="2.5"
        />
      ) : null}
      <g
        fill="none"
        stroke="#dc9d5c"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* capô */}
        <path d="M19 27 L22.5 15.5 Q23.3 13 26 13 H38 Q40.7 13 41.5 15.5 L45 27" />
        {/* carroceria */}
        <path d="M14 27.5 H50 Q53 27.5 53 30.5 V40 Q53 43 50 43 H14 Q11 43 11 40 V30.5 Q11 27.5 14 27.5 Z" />
        {/* faróis */}
        <path d="M15.5 32 L22 33.5" />
        <path d="M48.5 32 L42 33.5" />
        {/* retrovisores */}
        <path d="M11 29 H8.5" />
        <path d="M53 29 H55.5" />
        {/* rodas */}
        <path d="M15.5 43 V47 Q15.5 48.5 17 48.5 H20 Q21.5 48.5 21.5 47 V43" />
        <path d="M42.5 43 V47 Q42.5 48.5 44 48.5 H47 Q48.5 48.5 48.5 47 V43" />
      </g>
      {/* gota */}
      <path
        d="M32 29.5 C32 29.5 25.5 37 25.5 41.5 A6.5 6.5 0 0 0 38.5 41.5 C38.5 37 32 29.5 32 29.5 Z"
        fill="#f0a64a"
        stroke="#1a1816"
        strokeWidth="2"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  /** Subtítulo opcional ("Cuide bem do seu carro"). */
  tagline?: string;
};

export function Logo({ className = "", markClassName = "h-10 w-10", tagline }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-foreground-strong text-xl font-extrabold tracking-tight">
          Fluido <span className="text-gradient-amber">Fácil</span>
        </span>
        {tagline ? (
          <span className="text-foreground-muted mt-1 text-xs font-medium">{tagline}</span>
        ) : null}
      </span>
    </span>
  );
}
