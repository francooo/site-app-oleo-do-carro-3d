// Conteúdo de verificação por fluido — tipado, versionado no git, sem CMS.
// Servido também pela API (fase 6) para o futuro app Expo.
//
// Regras (documento de funcionalidades §4 e §5):
// - "verificar nível" (tutorial) é separado de "trocar fluido" (changeInfo);
// - o conteúdo geral vale para qualquer carro e manda seguir o manual;
// - overrides por motor trazem o que a fonte curada diz (com página).

import type { TrackedFluidCode } from "@/lib/domain/fluids";

export type SafetyIcon = "hot" | "level" | "warning" | "pro";

export type TutorialStep = {
  title: string;
  detail?: string;
  /** Chip de alerta sobre a imagem ("Aguarde o motor esfriar"). */
  alert?: { icon: SafetyIcon; text: string };
  image: string;
};

export type FluidContent = {
  /** "Como verificar" curto (card do detalhe e painel do mapa). */
  howToCheck: string;
  /** Título do tutorial: "Como verificar o óleo". */
  tutorialTitle: { lead: string; highlight: string };
  steps: TutorialStep[];
  /** Quando/como trocar — sempre separado da verificação. */
  changeInfo: string;
  /** Alertas de segurança exibidos no detalhe. */
  safety: string[];
  /** Imagem de destaque do detalhe e do card de status. */
  image: string;
};

const IMG = {
  oil: "/brand/aprender/oleo.webp",
  dipstick: "/brand/aprender/vareta-oleo.webp",
  brake: "/brand/aprender/freio.webp",
  coolant: "/brand/aprender/arrefecimento.webp",
  washer: "/brand/aprender/limpador.webp",
  bay: "/brand/tutorial/oleo-vareta.webp",
};

const PRO = "Vazamento, nível que cai rápido ou luz de advertência acesa: procure um profissional.";

const GENERAL: Record<TrackedFluidCode, FluidContent> = {
  oil: {
    howToCheck: "Carro nivelado, pela vareta, entre MIN e MAX",
    tutorialTitle: { lead: "Como verificar o", highlight: "óleo" },
    image: IMG.oil,
    steps: [
      {
        title: "Estacione em local plano e desligue o motor",
        detail: "Com o carro inclinado, a leitura da vareta sai errada.",
        alert: { icon: "level", text: "Carro nivelado" },
        image: IMG.bay,
      },
      {
        title: "Espere o óleo descer para o cárter",
        detail:
          "Siga o manual do seu carro: alguns pedem o motor frio, outros alguns minutos depois de desligar. Com o motor quente, cuidado com as partes do cofre.",
        alert: { icon: "hot", text: "Cuidado com partes quentes" },
        image: IMG.bay,
      },
      {
        title: "Puxe a vareta, limpe e coloque de volta",
        detail: "Limpe com um pano, encaixe a vareta até o fim e puxe de novo para ler.",
        image: IMG.dipstick,
      },
      {
        title: "Confira se o óleo está entre MIN e MAX",
        detail:
          "Se estiver perto ou abaixo do MIN, complete pelo bocal com o óleo indicado no manual, sem passar do MAX. Não misture óleos diferentes.",
        alert: { icon: "warning", text: "Nunca acima do MAX" },
        image: IMG.dipstick,
      },
    ],
    changeInfo:
      "A troca de óleo e filtro segue o intervalo do manual e deve ser feita em oficina, com descarte correto do óleo usado.",
    safety: ["Não misture óleos com características diferentes.", PRO],
  },
  coolant: {
    howToCheck: "Motor frio, pelo reservatório, sem abrir quente",
    tutorialTitle: { lead: "Como verificar o", highlight: "arrefecimento" },
    image: IMG.coolant,
    steps: [
      {
        title: "Estacione e espere o motor esfriar por completo",
        detail: "O sistema fica sob pressão quando está quente.",
        alert: { icon: "hot", text: "Aguarde o motor esfriar" },
        image: IMG.coolant,
      },
      {
        title: "Localize o reservatório de expansão",
        detail: "É o reservatório translúcido com o símbolo de temperatura na tampa.",
        image: IMG.coolant,
      },
      {
        title: "Olhe o nível pelas marcas, sem abrir",
        detail: "O líquido deve estar entre MIN e MAX, marcados no reservatório.",
        alert: { icon: "warning", text: "Nunca abra com o motor quente" },
        image: IMG.coolant,
      },
      {
        title: "Se estiver baixo, complete com o motor frio",
        detail:
          "Use só o líquido indicado no manual, na proporção certa. Não misture tipos ou cores diferentes.",
        image: IMG.coolant,
      },
    ],
    changeInfo:
      "A troca do líquido de arrefecimento segue o prazo do manual e deve ser feita por um profissional.",
    safety: [
      "Nunca abra a tampa do reservatório com o motor quente: risco de queimadura.",
      "Não misture líquidos de arrefecimento diferentes.",
      PRO,
    ],
  },
  brake: {
    howToCheck: "Carro nivelado, pelo reservatório, entre MIN e MAX",
    tutorialTitle: { lead: "Como verificar o", highlight: "fluido de freio" },
    image: IMG.brake,
    steps: [
      {
        title: "Estacione em local plano e desligue o motor",
        alert: { icon: "level", text: "Carro nivelado" },
        image: IMG.brake,
      },
      {
        title: "Localize o reservatório do fluido de freio",
        detail:
          "Costuma ficar no fundo do cofre, perto do painel, com o símbolo de freio na tampa.",
        image: IMG.brake,
      },
      {
        title: "Confira o nível entre MIN e MAX, sem abrir",
        detail: "O reservatório é translúcido: dá para ver o nível por fora.",
        image: IMG.brake,
      },
      {
        title: "Nível abaixo do MIN? Procure um profissional",
        detail:
          "Fluido de freio baixando pode indicar desgaste das pastilhas ou vazamento. Não complete com fluido diferente do indicado no manual.",
        alert: { icon: "pro", text: "Freio é item de segurança" },
        image: IMG.brake,
      },
    ],
    changeInfo:
      "O fluido de freio absorve umidade com o tempo e precisa ser trocado no prazo do manual, mesmo rodando pouco. A troca é feita por um profissional.",
    safety: [
      "O fluido de freio é corrosivo: se cair na pintura, lave com água na hora.",
      "Não misture fluidos de classes diferentes (DOT).",
      PRO,
    ],
  },
  washer: {
    howToCheck: "Pelo reservatório com o símbolo do limpador",
    tutorialTitle: { lead: "Como verificar o", highlight: "limpador" },
    image: IMG.washer,
    steps: [
      {
        title: "Localize o reservatório do lavador",
        detail: "A tampa tem o símbolo do para-brisa com o jato de água.",
        image: IMG.washer,
      },
      {
        title: "Confira se há líquido no reservatório",
        image: IMG.washer,
      },
      {
        title: "Complete com água ou com a mistura indicada",
        detail: "Use o produto recomendado pelo manual, se houver. Não use detergente de cozinha.",
        image: IMG.washer,
      },
    ],
    changeInfo: "O lavador não tem troca: basta completar sempre que baixar.",
    safety: ["Não viaje com o reservatório do lavador vazio: ele garante a visibilidade."],
  },
};

// ---------------------------------------------------------------------------
// Overrides por motor (engines.code). Fonte: Manual Fiat Uno, edição V/2013.
// ---------------------------------------------------------------------------
type Override = Partial<Pick<FluidContent, "howToCheck" | "changeInfo">> & {
  /** Substitui passos pelo índice. */
  steps?: Record<number, Partial<TutorialStep>>;
  extraSafety?: string[];
};

const ENGINE_OVERRIDES: Record<string, Partial<Record<TrackedFluidCode, Override>>> = {
  "fiat-fire-1.0-flex": {
    oil: {
      // Manual p. D-9: "com o veículo em terreno plano e com o motor ainda
      // quente (cerca de 10 minutos após tê-lo desligado)".
      howToCheck: "Terreno plano, motor ainda quente, 10 min após desligar",
      steps: {
        1: {
          title: "Espere cerca de 10 minutos com o motor desligado",
          detail:
            "O manual do Uno pede a leitura com o motor ainda quente, uns 10 minutos depois de desligar. Cuidado: o eletroventilador pode ligar sozinho com o motor quente.",
          alert: { icon: "hot", text: "Motor quente: cuidado" },
        },
        3: {
          detail:
            "O espaço entre MIN e MAX equivale a cerca de 1 litro. Se estiver perto ou abaixo do MIN, complete pelo bocal com óleo sintético SAE 5W30 (API SL, FIAT 9.55535), sem passar do MAX.",
        },
      },
      changeInfo:
        "Óleo e filtro são trocados juntos, com o motor quente. Em uso severo — reboque, estrada de terra, trajetos curtos de até 8 km, muito tempo em marcha lenta — a troca é a cada 7.500 km.",
    },
    coolant: {
      // Manual p. D-9/D-10.
      steps: {
        3: {
          detail:
            "Com o motor frio, complete devagar pelo bocal com 50% de Coolantup (vermelho) e 50% de água pura. Nunca use o líquido verde (não orgânico).",
        },
      },
      changeInfo:
        "Na troca, use 50% de Coolantup (vermelho) + 50% de água pura — feita por um profissional.",
    },
    brake: {
      // Manual p. D-11/D-12.
      steps: {
        3: {
          detail:
            "Fluido baixando pode indicar desgaste das pastilhas ou vazamento. Se precisar completar, use só fluido DOT 4 (Tutela TOP 4/S), sem passar do MAX.",
        },
      },
      changeInfo:
        "Vale o prazo mesmo rodando pouco: o fluido absorve umidade. Em regiões muito úmidas, troque com mais frequência.",
    },
    washer: {
      // Manual p. E-16 (nota **).
      steps: {
        2: {
          detail:
            "Use água pura. Para limpar melhor, a Fiat recomenda 25% de Tutela SC 35 + 75% de água.",
        },
      },
    },
  },
};

// Chevrolet Onix/Onix Plus 1.0 Turbo Flex. Fonte: Manual do Proprietário
// Onix/Onix Plus MY21 (52165543). Páginas = numeração impressa.
const GM_10_TURBO: Partial<Record<TrackedFluidCode, Override>> = {
  oil: {
    // p.170–171.
    howToCheck: "Terreno plano, de preferência com o motor frio",
    steps: {
      1: {
        title: "Espere o óleo descer: o ideal é o motor frio",
        detail:
          "O manual do Onix diz que a leitura é mais precisa com o motor frio, antes de dar a partida (desligado há pelo menos 2 horas). Sem tempo? Espere ao menos 15 minutos com o motor frio ou 30 minutos com ele quente.",
        alert: { icon: "hot", text: "Melhor com o motor frio" },
      },
      3: {
        title: "Confira o óleo na área hachurada da vareta",
        detail:
          "Se estiver abaixo da área hachurada, complete 1 litro pela tampa de abastecimento com óleo totalmente sintético dexos1 Gen 2, SAE 5W30, e meça de novo. Não passe da marca superior.",
      },
    },
    changeInfo:
      "Óleo e filtro a cada 10.000 km ou 1 ano, o que vier primeiro — ou antes, se o painel avisar pelo sistema de vida útil do óleo. Em uso severo, os intervalos devem ser reduzidos.",
    extraSafety: [
      "No Onix 1.0 Turbo o óleo é 5W30. O 0W20 é do Onix 1.0 aspirado: não use no turbo.",
    ],
  },
  coolant: {
    // p.175–176, 212, 215, 217–218.
    steps: {
      2: {
        title: "Confira o nível na marca de enchimento, sem abrir",
        detail:
          "Com o motor frio, o líquido deve estar na marca de enchimento do reservatório de expansão (indicada por duas setas).",
      },
      3: {
        detail:
          "Com o motor frio, complete com água potável e aditivo ACDelco longa vida (laranja), na proporção de 35% de aditivo. Não misture outros tipos ou cores.",
      },
    },
    changeInfo:
      "Troca a cada 150.000 km ou 5 anos, feita por um profissional, com água potável e aditivo ACDelco longa vida (laranja).",
  },
  brake: {
    // p.179, 215, 217–218.
    steps: {
      3: {
        detail:
          "O manual do Onix não recomenda completar o fluido de freio por conta própria: nível baixo pode indicar desgaste das pastilhas ou vazamento. Leve a uma concessionária ou oficina.",
      },
    },
    changeInfo:
      "Troca a cada 2 anos, mesmo rodando pouco, com fluido DOT 4 LV (GMW3356). Feita por um profissional.",
  },
  washer: {
    // p.178.
    steps: {
      2: {
        detail:
          "Use fluido próprio para lavador, seguindo o rótulo. Não use líquido de arrefecimento nem produto repelente de água, e não acrescente água a um fluido pronto para uso.",
      },
    },
  },
};

ENGINE_OVERRIDES["gm-1.0-turbo-flex"] = GM_10_TURBO;

export function getFluidContent(code: TrackedFluidCode, engineCode?: string | null): FluidContent {
  const base = GENERAL[code];
  const o = engineCode ? ENGINE_OVERRIDES[engineCode]?.[code] : undefined;
  if (!o) return base;
  return {
    ...base,
    howToCheck: o.howToCheck ?? base.howToCheck,
    changeInfo: o.changeInfo ?? base.changeInfo,
    steps: base.steps.map((step, i) => ({ ...step, ...o.steps?.[i] })),
    safety: [...base.safety, ...(o.extraSafety ?? [])],
  };
}

/** Para testes de integridade do conteúdo. */
export const CONTENT_ENGINE_CODES = Object.keys(ENGINE_OVERRIDES);
