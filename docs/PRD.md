# AutoGuide AI — PRD

**Versão:** 2.2
**Data:** agosto/2026
**Status:** Draft para validação — pronto para início de desenvolvimento (Sprint 0)
**Mudanças desde 2.1:** stack de banco/infra revisada (Neon + Drizzle + Auth.js + Neon Object Storage, ver seção 6); três ajustes ao modelo de dados da seção 7 para suportar corretamente o colapso de candidatos e a priorização de curadoria; MVP inicial resequenciado para 10-15 motores (não 50) dado que desenvolvimento e curadoria são feitos pela mesma pessoa — ver seção 10 e `docs/ROADMAP.md`; questões em aberto da seção 11 parcialmente resolvidas
**Mudanças desde 2.2 (sem bump de versão — ajuste pontual):** provedor de IA decidido (Groq, seção 6); cadastro manual de veículo (sem consulta de placa) antecipado do Sprint 1 para o Sprint 0, para não bloquear o uso do app enquanto o spike de fornecedor de placa e a curadoria de motores não avançam — ver `docs/ROADMAP.md`
**Responsável:** Andrews Franco

---

## 1. Problema

Donos de veículos no Brasil não sabem, na hora em que precisam, qual fluido o carro usa, quanto colocar e de quanto em quanto tempo trocar. As informações existem, mas estão espalhadas em manuais em PDF, fóruns, vídeos e catálogos de fabricantes de peças — e o manual impresso raramente acompanha o carro na revenda de usados.

Consequências observadas:

- Uso de óleo com viscosidade errada, reduzindo vida útil do motor
- Dependência total do que a oficina diz, sem parâmetro de conferência
- Perda do histórico de manutenção (notas fiscais soltas no porta-luvas), o que derruba o valor de revenda
- Insegurança em tarefas simples: onde fica o reservatório de arrefecimento, qual tampa abrir

**Hipótese central:** existe disposição para usar um app que responda "o que meu carro usa e quando trocar" em menos de 30 segundos, com dado confiável e específico para a versão do veículo.

---

## 2. Personas

### P1 — Dono de carro usado (primária)

30–50 anos, comprou o carro com 60–120 mil km, sem manual. Faz manutenção em oficina de bairro. Não é entusiasta: quer não ser enganado e não quebrar o carro. Baixa tolerância a app complicado.

**Job to be done:** "Antes de aprovar o orçamento, quero conferir se o que a oficina está propondo faz sentido para o meu carro."

### P2 — Faz-você-mesmo iniciante (secundária)

25–45 anos, troca o próprio óleo e filtros para economizar. Já usa YouTube. Quer especificação exata e localização dos pontos no cofre.

**Job to be done:** "Quero comprar a peça certa e saber onde mexer sem quebrar nada."

### P3 — Gestor de frota pequena (futura, fora do MVP)

3–15 veículos. Precisa de controle de intervalos e custos. Mencionado aqui apenas para não desenhar o modelo de dados de forma que impeça isso depois.

---

## 3. Objetivos e métricas de sucesso

| Objetivo                         | Métrica                                                  | Meta MVP (90 dias) |
| -------------------------------- | -------------------------------------------------------- | ------------------ |
| Identificação correta do veículo | % de cadastros concluídos sem correção manual do usuário | ≥ 90% via placa    |
| Utilidade percebida              | % de usuários que consultam a ficha ≥ 2 vezes            | ≥ 40%              |
| Retenção                         | D30                                                      | ≥ 20%              |
| Confiabilidade do dado           | Reportes de "informação errada" por 100 consultas        | ≤ 2                |
| Adoção do histórico              | % de usuários com ≥ 1 manutenção registrada              | ≥ 30%              |
| Custo                            | Custo de IA por usuário ativo/mês                        | ≤ R$ 0,50          |

**Critério de continuidade:** se identificação por placa < 85% ou D30 < 10%, o produto é repensado antes de qualquer investimento em visão computacional ou 3D.

**Nota de sequenciamento (v2.2):** estas são as metas finais dos 90 dias, medidas sobre a base curada completa do MVP. Dado que o desenvolvimento e a curadoria de dados são feitos pela mesma pessoa, existem marcos intermediários com metas mais modestas e escopo restrito ao conjunto de motores já curado em cada sprint — ver "Marcos de validação" em `docs/ROADMAP.md`. Medir cedo, mesmo com N pequeno, é intencional: o objetivo é detectar um sinal ruim (ex.: colapso de candidatos não resolve como esperado) antes de investir em curar os 50 motores.

---

## 4. Non-goals (explicitamente fora do MVP)

- Identificação de veículo por foto do cofre do motor
- Visualização 3D e realidade aumentada
- OCR de nota fiscal / ordem de serviço
- Integração OBD2
- Diagnóstico de falhas ou leitura de códigos de erro
- Comparação de preços de peças e marketplace
- Agendamento com oficinas
- Cobertura de motos, caminhões e veículos importados fora da lista curada
- Suporte a idiomas além do português brasileiro

---

## 5. Escopo do MVP

### 5.1 Onboarding e autenticação

- Login com Google (OAuth)
- Login com e-mail/senha
- Aceite de Termos de Uso e Política de Privacidade no primeiro acesso

**Decisão (v2.2):** magic link foi avaliado e descartado para o MVP — soma um segundo fluxo de "checar e-mail" além do reset de senha (que já é padrão), sem ganho líquido de fricção para um PWA de reabertura frequente. Ver seção 6 para o provedor de auth escolhido.

**Critérios de aceite**

- Usuário conclui login e chega à tela de cadastro de veículo em ≤ 3 toques
- Sessão persiste entre aberturas do PWA

### 5.2 Identificação e cadastro do veículo

#### Princípio fundamental

> O app só exibe uma especificação única quando a identificação for **determinística**. Identificação probabilística (visão computacional, inferência) nunca gera resposta única — gera um conjunto de candidatos com instrução de desambiguação.

Racional: o custo do erro é assimétrico. Acertar economiza uma consulta ao manual; errar danifica o motor e gera responsabilidade civil. Um dado correto em 92% dos casos é inútil se o usuário não consegue saber quando está nos 8%.

#### Hierarquia de identificação

| Nível | Método                                                      | Natureza                           | Uso                                                |
| ----- | ----------------------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| 1     | VIN (17 caracteres, dígito verificador validado)            | Determinístico                     | Preferencial                                       |
| 2     | Placa + confirmação explícita da versão pelo usuário        | Determinístico após confirmação    | Padrão do MVP                                      |
| 3     | Seleção manual encadeada (marca → modelo → ano → versão)    | Determinístico                     | Fallback                                           |
| 4     | Foto (etiqueta do chassi, etiqueta do motor, tampa do óleo) | OCR de identificador — verificável | Auxiliar                                           |
| 5     | Reconhecimento visual do motor por IA                       | Probabilístico                     | **Fora do MVP.** Nunca como identificação primária |

Nota sobre o nível 4: a câmera **lê identificadores**, não reconhece o motor. Motor moderno vem com capa plástica — o que a câmera vê de um EA211 aspirado e de um EA211 turbo é a mesma capa preta. Já um VIN de 17 caracteres tem dígito verificador: ou valida ou não valida.

#### Colapso de candidatos

Quando a identificação retorna mais de um motor candidato (ex.: "Onix 1.0 2020" pode ser aspirado ou turbo), o sistema avalia se a ambiguidade **altera a resposta**:

```
candidatos = motores_possiveis(marca, modelo, ano, versão_parcial)

se len(candidatos) == 1:
    exibir ficha
senão:
    para cada campo da ficha:
        se todos os candidatos têm o mesmo valor:
            exibir valor
        senão:
            marcar campo como ambíguo

    se nenhum campo ambíguo:
        exibir ficha normalmente (sem perguntar nada)
    senão:
        exibir campos comuns +
        exibir candidatos lado a lado para os campos ambíguos +
        exibir instrução de desambiguação
```

Exemplo prático: se aspirado e turbo usam a mesma especificação de óleo e diferem só no volume, o app mostra a especificação direto e pergunta apenas o necessário para resolver o volume.

**Instruções de desambiguação** devem ser observáveis por leigo — nunca "seu motor é turbo?". Exemplos: "há inscrição _Turbo_ na tampa traseira?", "fotografe a etiqueta na coluna da porta do motorista".

**Suporte de schema (v2.2):** o colapso de candidatos é implementado via uma tabela de junção (`trim_engine_candidates`), não por FK único em `trim_engine_map` — ver seção 7 para o detalhe e o racional.

#### Fluxos

**Primário — placa**

1. Usuário digita a placa (formato antigo ou Mercosul)
2. Sistema consulta API de placa → marca, modelo, ano, combustível e, quando disponível, chassi
3. Se vier chassi válido → decodificar e resolver no nível 1
4. Senão → aplicar colapso de candidatos
5. Usuário informa quilometragem atual e salva

**Fallback — manual:** seleção encadeada marca → modelo → ano → versão.

**Auxiliar — foto:** captura da etiqueta do chassi com OCR e validação de checksum.

**Regras**

- Múltiplos veículos por usuário (limite MVP: 5)
- Foto principal do veículo é opcional
- Veículo fora da base curada: mensagem explícita + lista de espera. **Nunca inventar dados nem exibir ficha parcial.**

**Critérios de aceite**

- Placa válida retorna dados em ≤ 5s
- VIN inválido (checksum) é rejeitado antes de qualquer consulta
- Nenhum campo ambíguo é exibido como valor único
- Instrução de desambiguação é executável sem conhecimento mecânico

### 5.3 Ficha de manutenção (core do produto)

Para cada veículo, exibir:

**Fluidos**

- Óleo do motor: especificação (ex.: 5W30 ACEA C3 / API SN), volume com e sem troca de filtro, intervalo em km e em meses
- Fluido de freio: DOT, intervalo
- Arrefecimento: tipo (orgânico/híbrido), cor, volume, intervalo
- Fluido de transmissão (quando aplicável)
- Fluido do limpador

**Filtros**

- Óleo, ar, cabine, combustível — códigos de referência cruzada (Mann, Mahle, Fram, Bosch) quando licenciados

**Intervalos**

- Tabela de revisões por quilometragem, com o próximo item destacado com base no km cadastrado

**Localização dos pontos no cofre**

- Ilustração 2D genérica por layout de motor (transversal 4 cilindros, etc.) com hotspots: tampa de óleo, vareta, reservatório de freio, expansão do arrefecimento, limpador, bateria, filtro de ar
- Cada hotspot abre uma nota curta ("bocal preto com símbolo de oleadora, lado esquerdo")

**Avisos**

- Alertas específicos do modelo (ex.: "motor com corrente de comando — não usar óleo fora da especificação", "cárter de alumínio, torque do bujão 25 Nm")

**Critérios de aceite**

- Toda informação exibida tem fonte rastreável no banco (campo `source_id`)
- Ficha carrega em ≤ 2s com dado em cache
- Nenhum campo exibido sem dado é preenchido com valor genérico

### 5.4 Histórico de manutenção (versão simples)

- Registro manual: data, km, tipo de serviço, oficina, peças/óleo usado, valor
- Anexo opcional de foto da nota (armazenada, **sem OCR no MVP**)
- Cálculo da próxima revisão a partir do último registro
- Linha do tempo por veículo

**Critérios de aceite**

- Registro completo em ≤ 60s
- Próxima revisão recalculada imediatamente após novo registro

### 5.5 Requisitos não-funcionais

| Requisito       | Definição                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Offline         | Ficha do veículo cadastrado disponível offline (cache do service worker). Garagem/estacionamento costuma não ter sinal. |
| Performance     | First Contentful Paint ≤ 1,8s em 4G; ficha em cache ≤ 500ms                                                             |
| Imagens         | Compressão client-side antes do upload (máx. 1600px, WebP)                                                              |
| Acessibilidade  | Contraste AA; alvos de toque ≥ 44px; uso com uma mão                                                                    |
| Observabilidade | Log de toda consulta de identificação com resultado e correção do usuário                                               |
| LGPD            | Ver seção 8                                                                                                             |

---

## 6. Arquitetura

**Frontend**

- Next.js (App Router) + React + Tailwind
- PWA com service worker (Serwist) — cache de fichas e assets
- Mobile-first, testado em Android médio

**Backend e dados**

- **Neon** — Postgres serverless. Branch `main` (produção) e branch `dev` (desenvolvimento local), sem depender de Docker para ter um Postgres local — mesmo engine em ambos.
- **Drizzle ORM** + `drizzle-kit` para schema e migrations versionadas em SQL explícito.
- **Auth.js v5 (NextAuth)** com `@auth/drizzle-adapter` para Google OAuth e Credentials (e-mail/senha). Neon não inclui um serviço de auth pronto — diferente do que uma solução tipo Supabase ofereceria — então essa camada é gerida pela própria aplicação.
- **Neon Object Storage** (S3-compatible, em beta desde jul/2026) para fotos de veículo, comprovantes de manutenção e imagens dos diagramas de cofre do motor — usa as mesmas credenciais do projeto Neon, sem conta cloud à parte. Acessado via AWS SDK v3 (`@aws-sdk/client-s3` + presigned URLs).

**Autorização (substitui RLS de uma solução tipo Supabase):** como apenas o servidor Next.js fala diretamente com o Postgres (não há uma API pública tipo PostgREST exposta ao cliente com uma chave anônima), a fronteira de autorização por usuário é aplicada na camada de aplicação: todo acesso a `vehicles`, `maintenance_records` e `documents` passa por funções centralizadas em `lib/db/queries/` que recebem o `userId` da sessão e o embutem na cláusula `WHERE`. Tabelas de catálogo curado são somente-leitura para o app; escrita de curadoria acontece via script/seed direto, nunca por rota da aplicação. RLS nativa do Postgres (via `set_config` por request) é um endurecimento possível para V1.1+, não um bloqueador do MVP.

**Integrações**

- API de consulta de placa (avaliar fornecedores nacionais; requisito: SLA, custo por consulta, cobertura de versão/motorização). Decisão de fornecedor é um spike do Sprint 0, ver `docs/ROADMAP.md`.
- **Provedor de IA (decidido, v2.2): Groq.** Uso restrito a normalização de texto e assistência de conteúdo/curadoria — **nunca** como fonte de verdade sobre especificações. Primeiro uso implementado: assistente de curadoria (`lib/ai/curation-assistant.ts`, script `pnpm curate`) que lê um texto-fonte (manual do proprietário/fonte técnica) e devolve um **rascunho estruturado** de especificação de fluido para revisão manual — cada campo vem acompanhado da frase exata da fonte (`sourceQuote`) para conferência, e o próprio modelo é instruído a listar pontos incertos em vez de arriscar um valor. O rascunho nunca é inserido no banco automaticamente; continua valendo a regra de mínimo duas fontes independentes e checagem humana antes de publicar (seção 8.1). Abstração em `lib/ai/groq.ts` para permitir troca de provedor sem refatorar o restante do código.

**Cache e custo**

- Ficha de motor é dado estático: consulta externa acontece uma vez por combinação (modelo, ano, versão) e é persistida. Consultas subsequentes servem do banco.
- Nenhuma chamada de IA no caminho crítico de exibição da ficha.

**3D**

- Fora do MVP. Se validado, avaliar Three.js / React Three Fiber com modelos por _layout_ de motor, não por modelo de veículo.

---

## 7. Modelo de dados

```
users / accounts / sessions
  -- geridas pelo adapter Drizzle do Auth.js (NextAuth). Campos extra de perfil
  -- (se necessários) entram como colunas em `users`, sem tabela `profiles` separada.

vehicles
  id, user_id (FK -> users.id), plate, vin, make, model, year, trim,
  engine_id (FK, nullable), engine_match_status (enum), pending_trim_engine_map_id (FK, nullable),
  current_km, km_updated_at, photo_url, created_at
  -- unique (user_id, plate) -- não globalmente único: o mesmo carro pode trocar de dono

engines
  id, code (ex.: EA211), displacement, cylinders, fuel_type,
  layout_id (FK -> engine_layouts, nullable), aspiration, notes

engine_layouts
  id, code, image_storage_path, description
  -- separado de `engines` para que um motor sem imagem curada ainda não bloqueie o cadastro

trim_engine_map
  id, make, model, year_from, year_to, trim_label, fuel_type, disambiguation_hint
  -- SEM engine_id direto -- ver trim_engine_candidates

trim_engine_candidates
  id, trim_engine_map_id (FK), engine_id (FK), is_primary, notes
  -- 1 linha para um trim_engine_map = identificação unívoca
  -- >1 linha = candidatos ambíguos -> dispara colapso de candidatos (seção 5.2)

fluid_types (code, label, display_order)
component_types (code, label, display_order)
  -- tabelas de lookup, não enum: novos tipos aparecem conforme a curadoria avança

engine_fluids
  id, engine_id (FK), fluid_type (FK -> fluid_types.code),
  specification, viscosity, volume_ml, volume_with_filter_ml,
  interval_km, interval_months, source_id (FK), warnings

components
  id, engine_id (FK), component_type (FK -> component_types.code),
  oem_code, cross_references (jsonb), interval_km, source_id (FK)

engine_layout_hotspots
  id, layout_id (FK -> engine_layouts), component_type (FK -> component_types.code), x, y, description

maintenance_records
  id, vehicle_id (FK), date, km, service_type, workshop,
  parts (jsonb), total_value, notes, created_at

documents
  id, maintenance_record_id (FK), storage_path, mime_type, uploaded_at

sources
  id, name, type (manual/licensed_db/catalog/curated),
  reference, verified_at, verified_by
```

**Decisões**

- `engines` é a chave da curadoria: um motor serve dezenas de modelos, o que reduz drasticamente o esforço de conteúdo.
- `sources` é obrigatória em todo dado técnico — sem fonte, não publica. Mínimo de duas fontes independentes por motor (regra de processo de curadoria, não constraint de banco).
- **(v2.2) Colapso de candidatos via tabela de junção.** `trim_engine_map.engine_id` como FK único não consegue representar "múltiplos motores candidatos" (ex.: Onix 1.0 2020 aspirado ou turbo). `trim_engine_candidates` resolve isso: 1 linha = unívoco, >1 linha = ambíguo.
- **(v2.2) Estado explícito de match em `vehicles`.** `engine_id` nulo sozinho não distingue "ainda não confirmado, mas com candidatos" de "modelo nem está na base curada". `engine_match_status` (`unmatched` / `pending_disambiguation` / `confirmed` / `manual_override`) resolve isso e permite, a partir do Sprint 3, consultar veículos `unmatched` agrupados por marca/modelo/ano para **priorizar a curadoria pelos dados reais de uso**, em vez de achismo — decisivo dado que a mesma pessoa desenvolve e cura os dados.
- **(v2.2) `fluid_type`/`component_type` como tabelas de lookup**, não enum: alterar um enum do Postgres é mais fricção do que inserir uma linha conforme a curadoria descobre novos tipos.
- RLS no Supabase foi substituída (ver seção 6) por autorização centralizada na camada de aplicação, já que o banco passou a ser Neon.

---

## 8. Dados, licenciamento e conformidade

### 8.1 Estratégia de conteúdo (bootstrapping)

O produto não funciona sem base de dados. Plano:

1. **Curadoria manual** dos motores que cobrem os veículos mais vendidos no Brasil dos últimos 15 anos (Fiat Fire/Firefly, VW EA111/EA211, GM SGE/Ecotec, Ford Sigma/Dragon, Hyundai Kappa/Gamma, Toyota 2NR/2ZR, Honda L15/R16, Renault D4F/H4M). O universo final estimado é de ~50 motores (70-80% de cobertura da frota-alvo), mas **o MVP inicial cura 10-15 motores** — ver `docs/ROADMAP.md` para o racional de sequenciamento (dev solo) e a expansão orientada por dados reais de uso a partir do Sprint 3.
2. **Fonte primária — manual do proprietário em PDF.** Fiat, VW, Toyota, Honda e outras publicam manuais nos sites brasileiros. É onde estão volume de cárter, especificação de fluido e plano de revisões. Consultado como referência: dado reescrito e atribuído, nunca reproduzido literalmente.
3. **Fonte de validação cruzada — buscadores de aplicação de fabricantes de lubrificante e filtro.** Mobil, Castrol, Petronas/Selenia, Lubrax, Mann-Filter, Tecfil, Wega, Fram. São consultas públicas, brasileiras, e cobrem motores flex. Regra de curadoria: cada motor deve ser confirmado por **no mínimo duas fontes independentes**; divergência bloqueia a publicação até resolução manual.
4. **Base licenciada (TecDoc ou equivalente)** apenas se e quando houver validação de mercado — contrato B2B caro, não é pressuposto do MVP.

### 8.2 Fontes explicitamente descartadas

| Fonte                                      | Motivo                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RealOEM                                    | Exclusivo BMW/Mini (fração irrelevante da frota brasileira). Catálogo de **peças**, não de manutenção — não contém viscosidade, volume nem intervalo. Sem API; site declaradamente sobrecarregado.                                                                                                                                                         |
| Nemigaparts e espelhos de EPC/ETKA/ETK/PET | Apenas ~13 marcas têm catálogo real; o restante é só cruzamento de números de peça. Continua sendo dado de peça, não de manutenção. Não cobre motores flex nem modelos exclusivos do Brasil (Onix, Argo, Mobi, Kwid, HB20). Além disso são espelhos não autorizados de software proprietário de concessionária — dependência com risco jurídico e sem SLA. |
| Autodata, HaynesPro, ALLDATA               | Licença B2B cara; não pressuposta pelo MVP. Reavaliar após validação.                                                                                                                                                                                                                                                                                      |

**Regra geral:** catálogo de peças ≠ dado de manutenção. Especificação de fluido, volume e intervalo vêm do manual do proprietário e do plano de revisões, não de diagrama explodido.

### 8.3 Aspectos legais

- **Direito autoral:** manuais de proprietário e bases como Autodata/HaynesPro/ALLDATA são obras protegidas. O MVP não redistribui conteúdo dessas fontes; usa-as como referência para produzir dado próprio atribuído.
- **Responsabilidade civil:** informação incorreta pode causar dano material. Obrigatórios: (a) disclaimer visível na ficha indicando que a informação é orientativa e o manual do fabricante prevalece; (b) Termos de Uso com limitação de responsabilidade; (c) canal de reporte de erro em cada ficha.
- **LGPD:**
  - Base legal: consentimento (cadastro) e execução de contrato (funcionalidade)
  - Dados sensíveis potenciais: placa e VIN identificam o titular; notas fiscais contêm CPF, valores e localização
  - Retenção: documentos anexados mantidos enquanto a conta existir; exclusão total em ≤ 15 dias após pedido
  - Exportação e exclusão de conta disponíveis no app (não só por e-mail)
  - Storage privado com URLs assinadas de curta duração (Neon Object Storage, ver seção 6)
  - Consulta de placa: verificar se o fornecedor exige declaração de finalidade e se há restrição de uso para consumidor final

---

## 9. Riscos

| #   | Risco                                                                               | Impacto | Mitigação                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Cobertura de dados insuficiente → app vazio para muitos usuários                    | Alto    | Curadoria por motor (não por modelo); mensagem honesta + lista de espera quando não coberto                                                                                    |
| R2  | API de placa cara, instável ou com restrição de uso                                 | Alto    | Validar fornecedor e contrato antes de codificar; fluxo manual sempre disponível como fallback                                                                                 |
| R3  | Dado técnico errado causa dano ao veículo                                           | Alto    | Fonte obrigatória, revisão dupla, disclaimer, reporte de erro                                                                                                                  |
| R4  | Custo de IA/consulta escala com uso                                                 | Médio   | Cache agressivo; IA fora do caminho crítico; teto de custo monitorado                                                                                                          |
| R5  | Licenciamento de base técnica inviável                                              | Médio   | MVP não depende de base licenciada                                                                                                                                             |
| R6  | Baixa retenção — consulta é episódica (1–2x/ano)                                    | Alto    | Histórico + lembretes por km/tempo como gancho de retorno; medir cedo                                                                                                          |
| R7  | Identificação por foto (V2) não atinge acurácia útil                                | Médio   | Já removida do caminho crítico; tratada como experimento                                                                                                                       |
| R8  | Ambiguidade de versão não resolvida gera especificação errada                       | Alto    | Colapso de candidatos (5.2); nenhum campo ambíguo exibido como valor único                                                                                                     |
| R9  | Dependência de catálogo espelhado sem licença                                       | Alto    | Fontes descartadas em 8.2; curadoria própria com fontes públicas atribuídas                                                                                                    |
| R10 | Neon Object Storage está em beta (desde jul/2026) — instabilidade ou mudança de API | Médio   | Interface S3-compatível: qualquer troca futura (R2, S3) é só reapontar credenciais, não reescrever lógica de upload                                                            |
| R11 | Dev solo é o único ponto de falha para curadoria de dados                           | Alto    | Roadmap sequenciado para validar hipótese com 10-15 motores antes de escalar para 50; priorização de próximos motores por dado real de uso (`engine_match_status = unmatched`) |

---

## 10. Roadmap

O detalhamento em sprints (Sprint 0 a Sprint 3, critérios de saída e marcos de validação) está em `docs/ROADMAP.md`. Resumo por fase:

### MVP inicial — validar utilidade e retenção (Sprints 0-2, ver ROADMAP.md)

- Auth Google + e-mail/senha
- Cadastro por placa, com fallback manual
- Ficha de fluidos, filtros, intervalos e avisos
- Ilustração 2D com hotspots por layout de motor
- Base curada: **10-15 motores** (não 50 — ver seção 8.1 e ROADMAP.md para o racional)
- Termos, privacidade, reporte de erro

### Beta fechado — expansão orientada por dados (Sprint 3, ver ROADMAP.md)

- Histórico manual de manutenções (`maintenance_records`/`documents`)
- Priorização dos próximos motores a curar por uso real (`engine_match_status = unmatched`)

### V1.1 — retenção

- Lembretes por km e por tempo (push do PWA)
- Atualização rápida de quilometragem
- Exportação do histórico em PDF (útil na revenda)
- Base expandida rumo aos ~50 motores originalmente estimados

### V2 — depende das métricas do MVP

- OCR de nota fiscal com validação (óleo correto, viscosidade, quantidade)
- Identificação assistida por foto do cofre — como confirmação, não como identificação primária
- Scanner de placa e VIN por câmera
- Ampliação da base para 150+ motores

### V3 — exploratório

- 3D / AR
- OBD2
- Comparação de preços
- Histórico compartilhável (link para comprador do usado)
- Assistente conversacional sobre o veículo
- Módulo de frota

---

## 11. Questões em aberto

1. ~~Modelo de monetização~~ — **adiado deliberadamente** (v2.2): MVP roda gratuito para validar utilidade/retenção antes de desenhar cobrança. Retomar após o beta fechado (Sprint 3).
2. ~~Magic link vs senha~~ — **decidido** (v2.2): Google OAuth + e-mail/senha, sem magic link (seção 5.1).
3. ~~A ilustração 2D por layout de motor é suficientemente clara?~~ — **decidido para o MVP inicial** (v2.2): genérica por família de leiaute, não foto real por variante, para não escalar custo de curadoria de imagem junto com curadoria de dado técnico. Reavaliar com feedback do beta fechado.
4. **Ainda em aberto** — Qual fornecedor de consulta de placa devolve **chassi** e/ou **versão/motorização**? Se devolver chassi, a identificação sobe para o nível 1 da hierarquia e boa parte da desambiguação desaparece. Vira spike prático do Sprint 0 (ver ROADMAP.md) — testar 2-3 fornecedores com placas reais antes de integrar.
5. **Ainda em aberto** — Qual o custo real por consulta de placa e qual o teto aceitável por usuário? Medido no mesmo spike do item 4.

---

## Apêndice A — Glossário

- **VIN:** número de identificação do chassi (17 caracteres)
- **Motor (engine code):** código da família do motor, ex.: EA211, Firefly
- **Trim/versão:** variante do modelo que define motorização e equipamentos
- **Cross reference:** equivalência entre códigos de peça de fabricantes distintos
