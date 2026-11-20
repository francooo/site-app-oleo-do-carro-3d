import type { ReactNode } from "react";

type TimelineProps = {
  items: { id: string; content: ReactNode }[];
  className?: string;
};

// Linha do tempo vertical com marcadores âmbar (histórico — tela 07).
export function Timeline({ items, className = "" }: TimelineProps) {
  return (
    <ol className={`relative flex flex-col gap-4 pl-8 ${className}`}>
      <span
        aria-hidden="true"
        className="from-accent via-copper/70 to-copper/20 absolute top-3 bottom-3 left-[11px] w-0.5 rounded-full bg-gradient-to-b"
      />
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className="border-accent bg-surface-lowest shadow-glow absolute top-4 -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2"
          >
            <span className="bg-accent h-2.5 w-2.5 rounded-full" />
          </span>
          {item.content}
        </li>
      ))}
    </ol>
  );
}
