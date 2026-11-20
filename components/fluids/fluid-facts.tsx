import { FileText, Search } from "lucide-react";
import type { ReactNode } from "react";

import { OilIcon } from "@/components/icons/fluids";

export type FluidFactsData = {
  specification: string | null;
  capacity: { value: string; note?: string } | null;
  howToCheck: string;
};

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="text-foreground-muted mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <dt className="text-foreground-muted w-28 shrink-0 text-sm sm:w-32">{label}</dt>
      <dd className="text-foreground-strong min-w-0 flex-1 text-sm font-semibold sm:text-base">
        {children}
      </dd>
    </div>
  );
}

const NOT_CURATED = (
  <span className="text-foreground-muted font-normal">
    Ainda não curado para o seu carro — consulte o manual
  </span>
);

// Especificação / capacidade / como verificar — painel do mapa e detalhe.
export function FluidFacts({ data }: { data: FluidFactsData }) {
  return (
    <dl className="border-border/70 bg-surface-lowest/60 divide-border/60 divide-y rounded-xl border px-4">
      <Row icon={<FileText />} label="Especificação">
        {data.specification ?? NOT_CURATED}
      </Row>
      <Row icon={<OilIcon />} label="Capacidade">
        {data.capacity ? (
          <>
            {data.capacity.value}
            {data.capacity.note ? (
              <span className="text-warning mt-1 block text-xs font-medium">
                {data.capacity.note}
              </span>
            ) : null}
          </>
        ) : (
          NOT_CURATED
        )}
      </Row>
      <Row icon={<Search />} label="Como verificar">
        {data.howToCheck}
      </Row>
    </dl>
  );
}
