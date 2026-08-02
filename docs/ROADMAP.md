# AutoGuide AI — Roadmap de Desenvolvimento

Complementa `docs/PRD.md` (v2.2) com a quebra em sprints. Referência: sequenciamento pensado para **um desenvolvedor solo** fazendo desenvolvimento _e_ curadoria manual de dados — curadoria é o gargalo real, então o MVP inicial é deliberadamente menor que a base final de ~50 motores estimada no PRD.

---

## Sprint 0 — Setup técnico + spikes de decisão (~1 semana)

Objetivo: ter o projeto no ar com login funcionando e as decisões que bloqueiam features já tomadas — nenhuma linha de lógica de negócio ainda.

### Scaffold técnico

- Next.js (App Router) + TypeScript + Tailwind v4 + ESLint/Prettier
- Neon: projeto criado, branch `main` (produção) e `dev` (desenvolvimento)
- Drizzle ORM + `drizzle-kit`: schema completo da seção 7 do PRD (incluindo os 3 ajustes: `trim_engine_candidates`, `engine_match_status`, `fluid_types`/`component_types` como lookup) e migrations aplicadas na branch `dev`
- Auth.js v5 + `@auth/drizzle-adapter`: Google OAuth + Credentials configurados
- Cliente de storage (Neon Object Storage via AWS SDK v3) com bucket de teste
- Serwist configurado com pelo menos 1 regra de cache (endpoint da ficha)
- CI (GitHub Actions): lint + typecheck + build
- Deploy Vercel conectado, env vars apontando para a branch `main`
- **Cadastro manual de veículo antecipado do Sprint 1** (`/veiculos/novo`): marca/modelo/ano/placa/km, sem consulta de placa nem catálogo curado — cria o veículo com `engine_match_status = "unmatched"`. Existe para não bloquear o uso do app enquanto o spike de fornecedor de placa (abaixo) e a curadoria de motores ainda não avançaram.
- **Assistente de curadoria via Groq** (`pnpm curate <codigo-do-motor> <arquivo-fonte>`, `lib/ai/curation-assistant.ts`): lê um texto-fonte e devolve um rascunho estruturado de especificação de fluido com a frase-fonte de cada campo, para acelerar a curadoria manual do Sprint 1 — nunca escreve no banco sozinho.

### Spikes de decisão

1. **Provider de consulta de placa** — testar na prática (não só ler documentação) pelo menos 2 entre `apiplacas.com.br`, `fipeapi.com.br`/`placafipe.com.br`, WebXcar, Direct Data, usando 10-15 placas reais dos modelos que entrarão na curadoria inicial. Critérios de decisão:
   - Retorna campo de versão/trim (ou chassi, que resolveria a identificação sozinho)?
   - Taxa de cobertura nos modelos-alvo
   - Custo por consulta e política de cache (pode persistir a resposta e não pagar de novo pela mesma placa?)
   - Rate limit e SLA
   - Implementar atrás da interface `lib/plate-lookup/provider.ts` para trocar de fornecedor sem tocar UI depois.
2. **Escolha dos 10-15 motores/modelos iniciais** — cruzar os mais vendidos no Brasil (Fiat Strada/Argo/Mobi, Chevrolet Onix, VW Polo/T-Cross, Hyundai HB20, Renault Kwid, Toyota Corolla/Hilux, Honda HR-V, Jeep Compass/Renegade) contra o que o provider escolhido de fato retorna no spike acima — a lista final é ajustada pelo dado real, não só por suposição de frota.
3. **Asset visual do cofre do motor** — decidido: ilustrações genéricas agrupadas por família de leiaute (não foto real por variante exata), para conter o custo de curadoria de imagem desde o início.

### Saída do Sprint 0

Projeto no ar (Vercel), login funcionando (Google + e-mail/senha), banco com schema completo aplicado, provider de placa escolhido e implementado atrás da interface, cadastro manual de veículo funcionando (garagem deixa de estar vazia por padrão).

---

## Sprint 1 — Loop de identificação + smoke test (5 motores curados)

- Fluxo "adicionar veículo por placa" com os 3 desfechos explícitos via `engine_match_status`:
  - `confirmed` — match único
  - `pending_disambiguation` — múltiplos candidatos → tela de desambiguação com `disambiguation_hint`
  - `unmatched` — sem match → fallback manual (o formulário de `/veiculos/novo` já existe desde o Sprint 0; falta plugar a tentativa de placa antes dele)
- Curar **5 motores completos**: fluidos (óleo + arrefecimento no mínimo), 2 fontes independentes cada, registradas em `sources`.
- Ficha do veículo mínima: tabela de fluidos (sem diagrama de hotspot ainda — é o item mais caro em asset visual, adiado de propósito).
- **Instrumentação do funil desde já**: registrar toda tentativa de lookup, resultado (`confirmed`/`pending_disambiguation`/`unmatched`) e uso do fallback manual. Isso não pode ser retrofitado depois — precisa nascer junto com a feature para medir a meta de identificação ≥90% do PRD.
- Teste com 5-10 pessoas reais (rede próxima), com placas de verdade.

**Saída**: loop completo de identificação testável ponta a ponta com um conjunto pequeno e real de motores.

---

## Sprint 2 — MVP inicial completo (10-15 motores + diagrama de hotspot)

- Completar curadoria até 10-15 motores + componentes (filtros: óleo, ar, cabine, combustível).
- `EngineBayDiagram`: imagem por família de leiaute + pins posicionados por `x,y` percentual.
- Tela de desambiguação completa usando `trim_engine_candidates`.
- Cache offline da ficha (Serwist `NetworkFirst` + fallback IndexedDB via `idb-keyval`).
- Campo `current_km`/`km_updated_at` no veículo.

**Este é o marco de "MVP mínimo para primeiro teste com usuários reais"** — explicitamente menor que os ~50 motores do PRD original:

- 10-15 motores curados
- Identificação com os 3 estados + fallback manual funcionando
- Ficha com fluidos + diagrama básico
- Auth Google + e-mail/senha
- Cache offline da última ficha vista
- Instrumentação do funil de identificação e de uso de retorno

**Explicitamente fora deste MVP**: histórico de manutenção (`maintenance_records`/`documents`), UI de curadoria (curadoria feita direto via script/SQL, não por tela de admin), lembretes/notificações, qualquer cobrança.

---

## Sprint 3 — Beta fechado + expansão orientada por dados (~4 semanas)

- Beta fechado com 20-30 pessoas (amigos/família com carros dentro da lista curada).
- `maintenance_records` + `documents` (upload de comprovante) entram aqui — não antes, depois do core validado.
- **Priorização de curadoria orientada por dados reais**: consultar veículos com `engine_match_status = 'unmatched'` agrupados por marca/modelo/ano e curar os motores que mais aparecerem. Resolve "o que curar depois" com uso real em vez de suposição.

---

## Marcos de validação

Ligados às métricas da seção 3 do PRD, mas com metas intermediárias menores dado o N pequeno de cada fase:

| Marco        | Quando                             | O que medir                                                                                                               | Meta interna                                                                                                          |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Smoke test   | Fim do Sprint 1                    | Taxa de identificação **restrita ao conjunto curado** (isola "a lógica de match funciona" de "ainda não temos cobertura") | 70-80% (N pequeno, direcional)                                                                                        |
| Beta fechado | Fim do Sprint 2 / durante Sprint 3 | D30 e identificação geral (todos os cadastros, não só os curados)                                                         | Leitura direcional das metas finais do PRD (D30 ≥20%, identificação ≥90%) — N ainda não é estatisticamente definitivo |

**Gate de decisão**: se identificação e utilidade percebida estiverem boas mas D30 fraco, investigar primeiro se falta um "gatilho de retorno" (nada traz o usuário de volta um mês depois) antes de concluir que a hipótese central falhou. Isso justificaria antecipar um lembrete simples de troca (hoje planejado para V1.1) para antes do histórico completo de manutenção.

---

## Depois do Sprint 3 — ver seção 10 do PRD

V1.1 (lembretes, exportação PDF, expansão rumo aos ~50 motores), V2 (OCR de nota, foto assistida, scanner) e V3 (3D/AR, OBD2, frota) dependem das métricas coletadas até aqui e não são planejados em sprint até essa validação acontecer.
