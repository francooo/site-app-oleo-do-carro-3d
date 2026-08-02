# AutoGuide AI

O que o seu carro usa — e quando trocar. PWA que identifica o veículo (placa/VIN/manual) e mostra fluidos, filtros, intervalos e localização dos pontos no cofre do motor, com dado sempre rastreável a uma fonte.

- **Produto**: [docs/PRD.md](docs/PRD.md)
- **Roadmap de sprints**: [docs/ROADMAP.md](docs/ROADMAP.md)

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 · Neon (Postgres serverless) + Drizzle ORM · Auth.js v5 (Google OAuth + e-mail/senha) · Neon Object Storage (S3-compatible) · Serwist (PWA/offline).

Autorização por usuário é feita na camada de aplicação (`lib/db/queries/*`), não por RLS de banco — ver seção 6 do PRD para o racional.

## Setup local

1. **Instalar dependências**

   ```bash
   pnpm install
   ```

2. **Criar um projeto Neon** ([neon.tech](https://neon.tech)) com duas branches: `main` (produção) e `dev` (desenvolvimento local). Copie a connection string da branch `dev`.

3. **Copiar `.env.example` para `.env.local`** e preencher:
   - `DATABASE_URL` — connection string da branch `dev` do Neon
   - `AUTH_SECRET` — gerar com `npx auth secret`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — criar credencial OAuth em [console.cloud.google.com](https://console.cloud.google.com/apis/credentials), redirect URI `http://localhost:3000/api/auth/callback/google`
   - `NEON_STORAGE_*` — criar um bucket no [Neon Object Storage](https://neon.com/docs/storage/overview) (beta) do mesmo projeto e gerar uma credencial

4. **Aplicar o schema**

   ```bash
   pnpm db:generate   # gera as migrations em drizzle/ a partir de lib/db/schema.ts
   pnpm db:migrate    # aplica na branch configurada em DATABASE_URL
   pnpm db:seed       # popula fluid_types/component_types (referência fixa da seção 5.3 do PRD)
   ```

5. **Rodar**

   ```bash
   pnpm dev
   ```

   - `/` — landing
   - `/login`, `/signup` — auth
   - `/garagem` — área logada (protegida)
   - `/health` — confirma que o app lê o banco via Drizzle (remover/proteger antes do beta fechado)

## Pendências manuais antes do Sprint 0 estar completo

Ver [docs/ROADMAP.md](docs/ROADMAP.md) para o detalhe — resumo do que exige decisão/credenciais humanas e não foi (nem deveria ser) automatizado neste scaffold:

- [ ] Escolher e testar fornecedor de consulta de placa (spike com placas reais) e implementar `lib/plate-lookup/provider.ts`
- [ ] Definir os 10-15 motores/modelos iniciais e começar a curadoria (fluidos, filtros, fontes)
- [ ] Produzir/obter as ilustrações genéricas de layout de motor (`engine_layouts.image_storage_path`)
- [ ] Adicionar um ícone real em `public/icon.png` (512×512) para o manifest do PWA
- [ ] Conectar o projeto no Vercel e configurar as env vars de produção (branch `main` do Neon)
- [ ] Vincular o projeto Neon (`main`) ao ambiente de produção do Vercel

## Scripts

| Comando                        | O que faz                                                   |
| ------------------------------ | ----------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Next.js                                                     |
| `pnpm lint`                    | ESLint                                                      |
| `pnpm typecheck`               | `tsc --noEmit`                                              |
| `pnpm test`                    | Vitest                                                      |
| `pnpm db:generate`             | Gera migrations a partir de `lib/db/schema.ts`              |
| `pnpm db:migrate`              | Aplica migrations pendentes                                 |
| `pnpm db:studio`               | Drizzle Studio                                              |
| `pnpm db:seed`                 | Popula tabelas de lookup (`fluid_types`, `component_types`) |
