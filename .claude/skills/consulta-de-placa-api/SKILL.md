---
name: consulta-de-placa-api
description: >
  Integra a API REST v1 do Consulta de Placa (consultadeplaca.net): consulta básica de placa de
  veículo brasileiro na hora (marca, modelo, versão, anos, cor, combustível, tipo, município, UF,
  roubo/furto e FIPE da versão mais provável, com a lista de versões possíveis em fipe.versions),
  relatórios completos do site em modo assíncrono (pedido 202 + resultado por
  GET ou webhook), tabela FIPE (marcas, busca de versões e código FIPE grátis; preço do mês com os dois
  meses anteriores, pago) e webhooks assinados (Standard Webhooks), tudo pago com o saldo pré-pago da
  conta; mais saldo, uso, preços, extrato e histórico. Use ao escrever código que chama api/v1, ao montar
  pedidos e respostas JSON, ao validar webhooks, ao tratar erros application/problem+json ou ao
  planejar lotes. Não invente endpoint, campo ou parâmetro que não esteja neste arquivo.
---

# API Consulta de Placa v1

Tudo o que a API faz está neste arquivo. Se algo não está aqui, a API não tem. Não chame
endpoints que não estão listados e não presuma campos que não aparecem nos exemplos.

## 1. Resumo rápido

| Item | Valor |
|---|---|
| Base | `https://consultadeplaca.net/api/v1` |
| Autenticação | `Authorization: Bearer <chave>` (só no cabeçalho) |
| Formato | JSON UTF-8. Mande `Accept: application/json`. No POST, `Content-Type: application/json` |
| Dinheiro | Objeto `{"amount": "0.07", "currency": "BRL"}`. `amount` é string decimal com 2 casas, nunca número |
| Datas | ISO 8601 com fuso de Brasília, por exemplo `2026-10-11T09:30:00-03:00` |
| Ids | Prefixados: `lkp_` (consulta, 26 caracteres depois), `txn_` (transação), `key_` (chave), `prod_` (produto), `req_` (pedido) |
| Erros | `application/problem+json` (RFC 9457) com `code` estável e `request_id` |
| Consulta básica (na hora) | `POST /lookups` com `{"plate": "ABC1D23"}` e o cabeçalho `Idempotency-Key` |
| Relatório completo (assíncrono) | `POST /reports` com `{"product": "roubo-furto", "plate": "ABC1D23"}` e `Idempotency-Key` → 202; resultado em `GET /reports/{id}` ou no webhook `report.completed` |
| Preço FIPE | `GET /fipe/prices?fipe_code=002104-0&year=2020` → o mês mais novo e os 2 anteriores; ache o código em `GET /fipe/models?q=corolla` |

Endpoints:

| Método e caminho | Escopo | Cobra? | Para quê |
|---|---|---|---|
| `GET /health` | nenhum (sem chave) | não | Saber se a API está no ar |
| `GET /account` | `read` | não | E-mail, saldo, dados da chave e IP visto pela API |
| `GET /usage` | `read` | não | Consultas e gasto de hoje, gasto e limite da chave |
| `GET /products` | `read` | não | Preços vigentes da consulta básica |
| `GET /transactions` | `read` | não | Extrato da conta, paginado |
| `POST /lookups` | `lookups` | **sim** | Consultar uma placa |
| `GET /lookups` | `lookups` | não | Consultas já feitas pela conta, paginado |
| `GET /lookups/{id}` | `lookups` | não | Ler de novo uma consulta feita (não cobra de novo) |
| `POST /reports` | `reports` | **sim** | Pedir um relatório completo (assíncrono) |
| `GET /reports` | `reports` | não | Relatórios pedidos pela conta, paginado, sem o resultado |
| `GET /reports/{id}` | `reports` | não | Status e resultado de um relatório (não cobra de novo) |
| `GET /fipe/brands` | `read` | não | Marcas da tabela FIPE |
| `GET /fipe/models` | `read` | não | Buscar versões pelo nome (até 20 por pedido) |
| `GET /fipe/models/{code}` | `read` | não | As versões de um código FIPE, com anos e combustíveis |
| `GET /fipe/prices` | `lookups` | 20 grátis/dia, depois **sim** | Preço FIPE de um código e ano no mês, com os 2 meses anteriores |

Os webhooks são cadastrados no painel (`https://consultadeplaca.net/dashboard/api/webhooks`), não
pela API. Não existe outro endpoint além destes 15: não tente.

## 2. Chave de API

- Criada no painel em `https://consultadeplaca.net/dashboard/api`, depois de ativar a API (e-mail
  verificado, aceite dos termos da API e a finalidade de uso declarada). Aparece uma vez só.
- Formato: `cdp_live_` ou `cdp_test_`, depois 44 caracteres alfanuméricos, `_` e mais 6
  (regex `^cdp_(live|test)_[A-Za-z0-9]{44}_[A-Za-z0-9]{6}$`).
- `cdp_live_`: produção, cobra do saldo. `cdp_test_`: só aceita as placas de teste (seção 4) e
  nunca cobra. Use a de teste para desenvolver.
- Escopos: `read` (account, usage, products, transactions e o catálogo FIPE), `lookups` (criar,
  listar e ler consultas, e o preço FIPE) e `reports` (pedir, listar e ler relatórios). Uma chave pode ter vários. Sem o escopo
  do endpoint: 403 `insufficient_scope`. Chaves criadas antes dos relatórios não têm `reports`:
  crie uma chave nova com essa permissão.
- Opcional na chave: lista de IPs permitidos (fora dela: 403 `ip_not_allowed`) e limite de gasto
  por dia (acima dele: 402 `daily_limit_exceeded`).
- A chave vence (30, 90, 180 ou 365 dias). Ao girar no painel, a antiga vale mais 24 horas.

Segurança, sem exceção:

- Guarde a chave em variável de ambiente ou cofre de segredos do servidor (nos exemplos,
  `CDP_API_KEY`). Nunca no código, em repositório, em site, em aplicativo de celular ou em
  variável pública de frontend. A chave dá acesso ao saldo.
- Nunca mande a chave na URL: a API recusa com 401 `api_key_in_query`.
- Nunca grave a chave em log. Para suporte, use o `request_id`.
- Chame a API só a partir do seu servidor, nunca do navegador do seu cliente.

## 3. Preços e cobrança

Confira os preços vigentes em `GET /products`. Hoje:

| Situação | Preço |
|---|---|
| As primeiras 20 consultas cobradas da conta (bônus de cadastro, uma vez por conta) | R$ 0,00 (`free` `true`) |
| Primeira consulta da placa pela conta (ou a última concluída tem mais de 30 dias) | R$ 0,07 |
| Mesma placa que a conta já concluiu nos últimos 30 dias | R$ 0,05 |
| Placas de teste `TST0001`, `TST0002`, `TST0003` (qualquer chave) | R$ 0,00 |

Relatórios completos (`POST /reports`): o preço de cada um é o do site e está em `GET /products`
(itens com `type` `report`, campo `prices[0].amount`). O valor sai do saldo quando o pedido é
aceito (202) e **volta** se o relatório terminar `failed` (sem dados para a placa ou serviço fora
do ar). Placas de teste não cobram. Se a conta já tem o mesmo relatório dos últimos 30 dias, não cobra.

Preço FIPE (`GET /fipe/prices`): **20 grátis por dia por conta** (fuso de Brasília); depois, R$ 0,02
quando há preço (veja `GET /products`, `type` `fipe`, campo `free_per_day`). A resposta diz se aquele
preço foi grátis (`free`) e quantos grátis restam hoje (`free_left_today`). O mesmo preço (código, ano,
combustível e mês) pedido de novo pela conta no mesmo dia não cobra nem gasta outro grátis (`charged`
`0.00`, `replayed` `true`). Sem preço: 404, nada cobrado. Marcas, busca e código FIPE nunca cobram.

Regras da consulta básica:

- Bônus de cadastro: as primeiras 20 consultas que seriam cobradas são grátis, em qualquer chave
  `cdp_live_` da conta (`price` `0.00`, `free` `true`). Uma consulta grátis que falha (503) devolve o
  bônus. Quantas restam: `free_lookups_left` em `GET /account` ou `lookups.free_left` em `GET /usage`.
  Depois, os preços acima. Placas de teste não gastam o bônus.
- Cobra quando a consulta é concluída: `result` `found` (encontrada) **e** `not_found` (a placa não
  tem cadastro). As duas são consultas válidas.
- Não cobra quando a consulta não é concluída: 503 `service_unavailable` (o valor nunca sai do
  saldo, ou volta na hora). Também não cobra em nenhum erro 4xx.
- O valor sai do saldo pré-pago da conta no momento da consulta. Saldo que não cobre: 402
  `insufficient_balance` (nada é cobrado). A recarga é feita no painel do site.
- `GET /lookups/{id}` e `GET /lookups` nunca cobram.
- Antes de um lote grande, confira `balance` em `GET /account` e, se a chave tem limite diário,
  `key.spent_today` e `key.daily_limit` em `GET /usage`.

## 4. Placas de teste

Funcionam com chave `cdp_live_` ou `cdp_test_`, sempre sem custo:

| Placa | Resposta |
|---|---|
| `TST0001` | 201, `status` `completed`, `result` `found`, com `vehicle` preenchido |
| `TST0002` | 201, `status` `completed`, `result` `not_found`, `vehicle` `null` |
| `TST0003` | 503 `service_unavailable` (simula o serviço fora do ar) |

Em `POST /reports` (qualquer `product`), sempre sem custo:

| Placa | Resultado do relatório |
|---|---|
| `TST0001` | `completed`, com um `result` fictício (`"teste": true`) |
| `TST0002` | `failed`, `failure.code` `not_found` |
| `TST0003` | `failed`, `failure.code` `service_unavailable` |

Uma chave `cdp_test_` com qualquer outra placa: 403 `test_plate_required`.

Em `GET /fipe/prices`, o código FIPE `000000-0` devolve preços fictícios sem custo, com qualquer
chave e qualquer `year`/`month`. Uma chave `cdp_test_` só aceita esse código (outro: 403
`test_plate_required`). O catálogo (`/fipe/brands`, `/fipe/models`) funciona com as duas.

## 5. Endpoints

### GET /health

Sem chave. Não entra nos registros e não tem limite por chave.

```json
{"status": "ok", "timestamp": "2026-10-11T09:30:00-03:00", "version": "1.0.0"}
```

### GET /account

Escopo `read`.

```json
{
  "object": "account",
  "email": "conta@exemplo.com",
  "balance": {"amount": "10.00", "currency": "BRL"},
  "free_lookups_left": 18,
  "api": {"enabled_at": "2026-10-11T08:00:00-03:00", "terms_version": "2026-11-06"},
  "key": {
    "id": "key_AbCdEf123456",
    "name": "Servidor",
    "mode": "live",
    "scopes": ["read", "lookups"],
    "expires_at": "2027-01-09T08:00:00-03:00",
    "daily_limit": {"amount": "50.00", "currency": "BRL"}
  },
  "request_ip": "203.0.113.10"
}
```

- `free_lookups_left`: consultas básicas grátis que restam do bônus de cadastro (seção 3).
- `key` é a chave usada neste pedido. `mode` é `live` ou `test`.
- `key.daily_limit` é `null` quando a chave não tem limite.
- `request_ip` é o IP que a API viu. Use para preencher a lista de IPs da chave.

### GET /usage

Escopo `read`. "Hoje" é o dia corrente no fuso de Brasília (zera à meia-noite).

```json
{
  "object": "usage",
  "day": "2026-10-11",
  "lookups": {"completed": 2, "failed": 0, "free": 0, "free_left": 0},
  "reports": {"completed": 1, "failed": 0, "pending": 0},
  "spent": {"amount": "7.84", "currency": "BRL"},
  "key": {
    "id": "key_AbCdEf123456",
    "spent_today": {"amount": "7.84", "currency": "BRL"},
    "daily_limit": {"amount": "50.00", "currency": "BRL"}
  },
  "requests_today": 6
}
```

- `lookups`, `reports` e `spent` contam todas as chaves da conta (`spent` inclui relatórios já
  cobrados e ainda em andamento). `key.spent_today` conta só esta chave, consultas e relatórios, e é
  o valor comparado com `key.daily_limit`.
- `lookups.free` conta as consultas de hoje pagas pelo bônus de cadastro; `lookups.free_left`, quantas
  grátis ainda restam do bônus (não zera à meia-noite).
- `requests_today` conta os pedidos autenticados desta chave hoje.

### GET /products

Escopo `read`.

```json
{
  "object": "list",
  "data": [
    {
      "object": "product",
      "id": "prod_plate_lookup",
      "type": "lookup",
      "code": "plate_lookup",
      "name": "Consulta básica de placa",
      "description": "Marca, modelo, versão, anos, cor, combustível, tipo, município, UF, roubo e FIPE. Resposta na hora. As primeiras 20 consultas da conta são grátis (bônus de cadastro).",
      "free_bonus": 20,
      "prices": [
        {"amount": "0.07", "currency": "BRL", "when": "first"},
        {"amount": "0.05", "currency": "BRL", "when": "repeat_30_days"}
      ]
    },
    {
      "object": "product",
      "id": "prod_roubo_furto",
      "type": "report",
      "code": "roubo-furto",
      "name": "Roubo e Furto",
      "description": "Descubra se o veículo foi roubado",
      "prices": [{"amount": "7.72", "currency": "BRL", "when": "always"}]
    }
  ]
}
```

- `type`: `lookup` (use `POST /lookups`) ou `report` (use `POST /reports` com `product` = `code`).
- A lista de relatórios muda quando o site ativa ou desativa um produto: leia antes de pedir, não
  fixe códigos no código.
- `when`: `first` (primeira vez da placa na conta em 30 dias), `repeat_30_days` (repetição) ou
  `always` (relatórios). `free_bonus` (só na consulta básica): consultas grátis no começo da conta.

### GET /transactions

Escopo `read`. Extrato da conta, do mais novo para o mais antigo.

Query: `limit` de 1 a 100 (padrão 20) e `cursor` (o `next_cursor` da página anterior, formato
`txn_123`).

```json
{
  "object": "list",
  "data": [
    {
      "object": "transaction",
      "id": "txn_10342",
      "type": "debit",
      "kind": "consultation",
      "amount": {"amount": "0.07", "currency": "BRL"},
      "description": "Consulta de placa ABC1D23 pela API",
      "status": "completed",
      "created_at": "2026-10-11T09:30:00-03:00"
    }
  ],
  "next_cursor": "txn_10342"
}
```

- `type`: `credit` (entrou) ou `debit` (saiu). `amount` é sempre positivo; o sinal está em `type`.
- `kind`: `topup` (recarga), `consultation` (consulta, no site ou pela API), `refund` (devolução de
  consulta não concluída), `subscription` (pagamento de plano), `bonus`, `commission`,
  `adjustment` (ajuste manual), `payment_refund` (recarga reembolsada) ou `chargeback`
  (contestação). Trate valores novos como desconhecidos, sem quebrar.
- `status`: só `completed` mexeu no saldo. `pending` e `failed` aparecem, mas não contam.
- `next_cursor` `null` = acabou.

### POST /lookups

Escopo `lookups`. Consulta uma placa e cobra (seção 3).

Cabeçalhos obrigatórios: `Authorization`, `Content-Type: application/json` e `Idempotency-Key`.

Corpo:

```json
{"plate": "ABC1D23"}
```

- `plate`: placa Mercosul (`ABC1D23`) ou antiga (`ABC1234`). Traço, espaço e minúsculas são
  aceitos e removidos (`abc-1234` vira `ABC1234`). Fora disso: 422 `validation_failed`.
- `Idempotency-Key`: 1 a 100 caracteres de `A-Z a-z 0-9 . _ : ~ -`. Gere uma nova (UUID) para
  cada consulta nova e reuse a mesma em cada nova tentativa daquela consulta (seção 7).

Resposta 201 (encontrada):

```json
{
  "object": "lookup",
  "id": "lkp_01JA0Q3B5C7D9E1F3G5H7J9K1M",
  "status": "completed",
  "plate": "ABC1D23",
  "result": "found",
  "price": {"amount": "0.07", "currency": "BRL"},
  "free": false,
  "vehicle": {
    "plate": "ABC1D23",
    "brand": "FIAT",
    "model": "UNO",
    "version": "Uno Mille Economy 1.0 Flex 4p",
    "manufacture_year": 2012,
    "model_year": 2013,
    "color": "PRATA",
    "fuel": "ALCOOL/GASOLINA",
    "type": "AUTOMOVEL",
    "city": "FORTALEZA",
    "state": "CE",
    "theft": false,
    "fipe": {
      "code": "001177-0",
      "amount": "18000.00",
      "versions": [
        {"code": "001177-0", "version": "Uno Mille Economy 1.0 Flex 4p", "amount": "18000.00", "fuel": "Flex", "score": 72},
        {"code": "001235-1", "version": "Uno Mille Way Economy 1.0 Flex 4p", "amount": "19500.00", "fuel": "Flex", "score": 61}
      ]
    }
  },
  "created_at": "2026-10-11T09:30:00-03:00"
}
```

Resposta 201 (placa sem cadastro): o mesmo objeto com `"result": "not_found"`, `"vehicle": null` e
o preço cobrado. Com o bônus de cadastro: `"price": {"amount": "0.00", …}` e `"free": true`.

Cabeçalhos da resposta: `Location` (URL de `GET /lookups/{id}`), `X-Request-Id` e, quando a
resposta é a guardada de um pedido anterior com a mesma `Idempotency-Key`, `Idempotent-Replayed: true`.

A resposta leva alguns segundos. Use timeout de 30 segundos no seu cliente.

### GET /lookups

Escopo `lookups`. Consultas da conta, da mais nova para a mais antiga, inclusive as que falharam.

Query: `limit` de 1 a 100 (padrão 20) e `cursor` (o `next_cursor` anterior, formato `lkp_…`).

```json
{
  "object": "list",
  "data": [
    {
      "object": "lookup",
      "id": "lkp_01JA0Q3B5C7D9E1F3G5H7J9K1M",
      "status": "completed",
      "plate": "ABC1D23",
      "result": "found",
      "price": {"amount": "0.07", "currency": "BRL"},
      "free": false,
      "vehicle": {"plate": "ABC1D23", "brand": "FIAT", "model": "UNO", "theft": false},
      "created_at": "2026-10-11T09:30:00-03:00"
    },
    {
      "object": "lookup",
      "id": "lkp_01JA0Q2W8V3R4T5Y6Z7X8N9P0A",
      "status": "failed",
      "plate": "XYZ9A87",
      "result": "unavailable",
      "price": {"amount": "0.00", "currency": "BRL"},
      "free": false,
      "vehicle": null,
      "created_at": "2026-10-11T09:10:00-03:00"
    }
  ],
  "next_cursor": null
}
```

(O `vehicle` da lista tem todos os campos do POST; o exemplo acima está encurtado.)

### GET /lookups/{id}

Escopo `lookups`. `{id}` é o `id` devolvido (`lkp_` e 26 caracteres). Devolve o mesmo objeto do
POST. Não cobra e não consulta de novo. Id de outra conta ou inexistente: 404 `not_found`.

### POST /reports

Escopo `reports`. Pede um relatório completo do site. **Assíncrono**: responde 202 na hora, com o
relatório na fila; o resultado fica pronto em segundos (às vezes minutos, se a fonte de dados estiver
lenta). Cobra o preço do produto na aceitação e devolve se terminar `failed`.

- Se a sua conta já tem este relatório (mesmo `product` e placa, pelo site ou pela API) dos últimos 30
  dias, o novo pedido sai **sem custo** (`price` `"0.00"`), como o PDF que fica 30 dias no painel.
- Se o mesmo relatório da placa foi consultado nos últimos 30 dias, os dados são reaproveitados e o
  relatório fica pronto na hora; `result_fetched_at` diz quando foram consultados na fonte. Depois de
  30 dias, um novo pedido consulta de novo.

Cabeçalhos obrigatórios: `Authorization`, `Content-Type: application/json` e `Idempotency-Key`.

Corpo:

```json
{"product": "roubo-furto", "plate": "ABC1D23"}
```

- `product`: o `code` de um item `type` `report` de `GET /products`. Fora da lista: 422
  `validation_failed` com `errors.product`.
- `plate`: as mesmas regras de `POST /lookups`.

Resposta 202:

```json
{
  "object": "report",
  "id": "rep_01JA0Q5D7E9F1G3H5J7K9M1N3P",
  "status": "queued",
  "product": {"id": "prod_roubo_furto", "code": "roubo-furto", "name": "Roubo e Furto"},
  "plate": "ABC1D23",
  "price": {"amount": "7.72", "currency": "BRL"},
  "failure": null,
  "created_at": "2026-10-11T09:30:00-03:00",
  "completed_at": null,
  "result": null,
  "result_expires_at": null,
  "result_fetched_at": null
}
```

Cabeçalhos: `Location` (URL de `GET /reports/{id}`), `Retry-After: 10` e, numa repetição com a mesma
`Idempotency-Key`, `Idempotent-Replayed: true` (devolve o estado atual do mesmo relatório, sem nova
cobrança).

Erros próprios: 409 `report_in_progress` (já existe um relatório do mesmo `product` para a mesma placa
em `queued`/`processing`; a resposta traz `report.id`: acompanhe esse), 429 `rate_limited` (mais de 20
relatórios em andamento na conta), 402 `insufficient_balance` (traz `price`) e 402
`daily_limit_exceeded`. Nesses casos nada é cobrado.

Para saber quando ficou pronto, escolha um:

1. **Webhook** (recomendado): cadastre um endpoint no painel com o evento `report.completed` (e
   `report.failed`) e, ao receber, leia `GET /reports/{id}` (seção 9).
2. **Consulta periódica**: `GET /reports/{id}` respeitando o `Retry-After` (10 s) até `status` ser
   `completed` ou `failed`. Não consulte mais de uma vez a cada 5 segundos.

### GET /reports

Escopo `reports`. Relatórios da conta, do mais novo para o mais antigo, **sem** `result` (os campos
`result`, `result_expires_at` e `result_fetched_at` não vêm na lista). Query: `limit` de 1 a 100 (padrão 20) e `cursor`
(o `next_cursor` anterior, formato `rep_…`).

```json
{
  "object": "list",
  "data": [
    {"object": "report", "id": "rep_01JA0Q5D7E9F1G3H5J7K9M1N3P", "status": "completed",
     "product": {"id": "prod_roubo_furto", "code": "roubo-furto", "name": "Roubo e Furto"},
     "plate": "ABC1D23", "price": {"amount": "7.72", "currency": "BRL"}, "failure": null,
     "created_at": "2026-10-11T09:30:00-03:00", "completed_at": "2026-10-11T09:30:12-03:00"}
  ],
  "next_cursor": null
}
```

### GET /reports/{id}

Escopo `reports`. `{id}` é `rep_` e 26 caracteres. Não cobra e não consulta a fonte de dados de novo.
Id de outra conta ou inexistente: 404 `not_found`. Enquanto não terminou, vem `Retry-After: 10`.

```json
{
  "object": "report",
  "id": "rep_01JA0Q5D7E9F1G3H5J7K9M1N3P",
  "status": "completed",
  "product": {"id": "prod_roubo_furto", "code": "roubo-furto", "name": "Roubo e Furto"},
  "plate": "ABC1D23",
  "price": {"amount": "7.72", "currency": "BRL"},
  "failure": null,
  "created_at": "2026-10-11T09:30:00-03:00",
  "completed_at": "2026-10-11T09:30:12-03:00",
  "result": {
    "placa": "ABC1D23",
    "marca": "FIAT",
    "modelo": "UNO MILLE",
    "uf": "CE",
    "municipio": "FORTALEZA",
    "ocorrencia": "NADA CONSTA"
  },
  "result_expires_at": "2026-11-10T09:30:12-03:00",
  "result_fetched_at": "2026-10-11T09:30:12-03:00"
}
```

- `result` é o conteúdo do relatório **como no site** (chaves em português, no formato da fonte de
  dados) e varia de produto para produto. Leia as chaves de forma defensiva e não presuma as que
  não vieram. Pode trazer dados do proprietário (nome, documento, endereço, telefones): use só para a
  finalidade declarada na ativação da API (LGPD) e não guarde além do necessário. A partir do recebimento,
  o seu sistema é controlador independente desses dados e responde pelo uso e pela segurança deles.
- `result` fica disponível por 30 dias (`result_expires_at`); depois vem `null`. Guarde no seu sistema
  o que precisar.
- `result_fetched_at` é quando os dados foram consultados na fonte. Num relatório reaproveitado (o mesmo
  produto e placa consultados nos últimos 30 dias) ela é anterior a `completed_at`. Para Roubo e Furto,
  confira essa data antes de decidir uma compra.
- Com `status` `failed`: `result` é `null`, `price` é `"0.00"` (o valor voltou ao saldo) e `failure`
  traz `code` (`not_found`: não há dados desta placa para este relatório; `service_unavailable`: não
  foi possível fazer agora) e `message`.

### GET /fipe/brands

Escopo `read`. Não cobra. Query opcional `type`: `car`, `motorcycle` ou `truck`.

```json
{"object": "list", "data": [{"object": "fipe_brand", "id": 26, "name": "Toyota", "type": "car"}]}
```

### GET /fipe/models

Escopo `read`. Não cobra. Busca versões pelo nome do veículo:

- `q` (obrigatório, 2 a 60 caracteres, até 6 palavras): o nome como a pessoa escreve ou como está no
  documento do veículo. Exemplos: `corolla xei 2020`, `spin lt manual`, `hb20s comfort plus 1.6 automatico`,
  `SENTRA 20SV CVT 2018`, `cg 160 titan`. Não é preciso que todas as palavras estejam no nome:
  - cada versão recebe um `score` de 0 a 100 pela semelhança com `q`;
  - aceita erro de digitação (`crolla`), letra dobrada (`corola`), sinônimos de câmbio (`manual`/`MT` =
    "Mec.", `automatico`/`AT`/`CVT` = "Aut.") e o jeito do documento de escrever motor e câmbio (`20SV`
    = 2.0 SV, `18A` = 1.8 automático);
  - um ano em `q` (`2020`, `0km`) mantém só as versões com aquele ano-modelo.
- Filtros opcionais: `type` (`car`, `motorcycle`, `truck`), `brand` (o `id` de `/fipe/brands`) e
  `year` (`2020` ou `0km`; vence o ano escrito em `q`).
- A lista vem do maior `score` para o menor: as versões próximas da melhor e, mesmo quando a primeira é
  bem mais parecida, **pelo menos 5 opções** (quando o catálogo tem), para o usuário poder escolher outra.
  `limit` de 1 a 20 (padrão 10) e `offset` até 1000; `total` diz quantas versões vieram e `has_more` se há
  mais.
- `score`: 100 = a versão mais parecida possível com o texto. Compare só dentro da mesma resposta; não é
  porcentagem de certeza. Várias versões com nota igual ou próxima (mesmo modelo em manual e automático,
  1.0 e 1.0 turbo) significam que o texto não distingue: refine `q` (câmbio, motor, acabamento, ano) ou
  mostre as opções ao usuário.

`GET /fipe/models?q=corolla xei 2020&limit=3` (os anos encurtados aqui):

```json
{
  "object": "list",
  "data": [
    {
      "object": "fipe_model", "fipe_code": "002111-3", "type": "car",
      "brand": {"id": 26, "name": "Toyota"}, "name": "Corolla XEi 2.0 Flex 16V Aut.",
      "years": [{"year": null, "zero_km": true, "fuel": "flex"}, {"year": 2020, "zero_km": false, "fuel": "flex"}],
      "score": 100
    },
    {
      "object": "fipe_model", "fipe_code": "002181-4", "type": "car",
      "brand": {"id": 26, "name": "Toyota"}, "name": "Corolla GLi 2.0 16V Flex Aut.",
      "years": [{"year": 2020, "zero_km": false, "fuel": "flex"}],
      "score": 49
    },
    {
      "object": "fipe_model", "fipe_code": "002112-1", "type": "car",
      "brand": {"id": 26, "name": "Toyota"}, "name": "Corolla ALTIS 2.0 Flex 16V Aut.",
      "years": [{"year": 2020, "zero_km": false, "fuel": "flex"}],
      "score": 49
    }
  ],
  "total": 5,
  "has_more": true
}
```

Aqui a primeira é a versão pedida (XEi, 100); as outras são alternativas do mesmo modelo e ano, bem
abaixo (49).

### GET /fipe/models/{code}

Escopo `read`. Não cobra. `{code}` é o código FIPE (`002104-0`). Devolve a mesma lista de
`fipe_model` (um código pode ter mais de uma versão no catálogo). Código sem veículo: 404 `not_found`.

### GET /fipe/prices

Escopo `lookups`. **20 grátis por dia por conta**, depois **R$ 0,02** quando há preço. Query:

- `fipe_code` (obrigatório): `000000-0`.
- `year` (obrigatório): `2020` ou `0km`.
- `fuel`: `gasolina`, `alcool`, `diesel`, `eletrico`, `flex`, `hibrido` ou `gas_natural`.
  Obrigatório só quando o código e o ano têm mais de um (senão 422 com `errors.fuel` listando os que
  existem).
- `month` (`AAAA-MM`): o mês de referência. Vazio = o mês mais novo com preço.

```json
{
  "object": "fipe_price",
  "id": "fpq_01JA0Q7F9G1H3J5K7M9N1P3Q5R",
  "fipe_code": "002104-0",
  "type": "car",
  "brand": {"id": 26, "name": "Toyota"},
  "model": "Corolla XEi 2.0 Flex 16V Aut.",
  "year": 2020,
  "zero_km": false,
  "fuel": "flex",
  "month": "2026-10",
  "price": {"amount": "100000.00", "currency": "BRL"},
  "previous_months": [
    {"month": "2026-09", "price": {"amount": "100500.00", "currency": "BRL"}},
    {"month": "2026-08", "price": {"amount": "101000.00", "currency": "BRL"}}
  ],
  "charged": {"amount": "0.00", "currency": "BRL"},
  "free": true,
  "free_left_today": 49,
  "replayed": false
}
```

- `previous_months` traz até dois meses anteriores, do mais novo para o mais antigo, só os que têm
  preço (sem cobrança extra).
- Sem preço para o código, ano ou mês: 404 `not_found` e nada é cobrado. Saldo que não cobre: 402
  `insufficient_balance`; limite da chave: 402 `daily_limit_exceeded`.
- `free` `true`: este preço usou uma das 20 grátis do dia; `free_left_today` diz quantas restam. Quando
  chega a 0, cada preço novo cobra R$ 0,02 (`charged`).
- Pedir o mesmo preço de novo no mesmo dia devolve o mesmo valor com `charged` `0.00` e `replayed`
  `true`, sem gastar outra grátis: guarde o resultado em vez de pedir de novo.

## 6. Os objetos `lookup` e `report`

| Campo | Tipo | Significado |
|---|---|---|
| `object` | string | Sempre `lookup` |
| `id` | string | `lkp_` + 26 caracteres |
| `status` | string | `completed` (concluída e cobrada), `failed` (não concluída, nada cobrado) ou `pending` (em andamento) |
| `plate` | string | Placa normalizada, sem traço, maiúsculas |
| `result` | string ou null | `found`, `not_found` ou `unavailable` (este só com `failed`). `null` quando falhou por saldo insuficiente |
| `price` | dinheiro | O que foi cobrado. `"0.00"` quando não cobrou |
| `free` | bool | `true` quando a consulta usou o bônus de cadastro (`price` `0.00`) |
| `vehicle` | objeto ou null | Só com `result` `found` |
| `created_at` | string | Data e hora da consulta |

Campos de `vehicle` (os marcados "ou null" vêm `null` quando a base não tem o dado):

| Campo | Tipo | Significado |
|---|---|---|
| `plate` | string | Placa |
| `brand` | string | Marca (sempre presente em `found`) |
| `model` | string ou null | Modelo, como está no cadastro do veículo |
| `version` | string ou null | Nome da versão FIPE de `fipe.code` |
| `manufacture_year` | int ou null | Ano de fabricação |
| `model_year` | int ou null | Ano do modelo |
| `color` | string ou null | Cor |
| `fuel` | string ou null | Combustível |
| `type` | string ou null | Tipo de veículo |
| `city` | string ou null | Município do registro |
| `state` | string ou null | UF do registro (2 letras) |
| `theft` | bool | `true` quando há registro de roubo ou furto |
| `fipe.code` | string ou null | Código FIPE da versão de maior `score` |
| `fipe.amount` | string ou null | Valor FIPE em reais dessa versão, string decimal (`"18000.00"`) |
| `fipe.versions` | lista ou null | Todas as versões FIPE possíveis para o veículo, do maior `score` para o menor (a primeira é a de `fipe.code`). Lista vazia quando não há FIPE; `null` em consultas feitas antes de 22/10/2026 |
| `fipe.versions[].code` | string | Código FIPE |
| `fipe.versions[].version` | string ou null | Nome da versão na tabela FIPE |
| `fipe.versions[].amount` | string ou null | Valor FIPE em reais, do mês de referência atual |
| `fipe.versions[].fuel` | string ou null | Combustível da versão |
| `fipe.versions[].score` | int ou null | Semelhança entre o nome da versão e o modelo do cadastro: maior = mais provável. Não é porcentagem |

### FIPE da consulta de placa: como ler e escolher a versão

O cadastro do veículo não traz o código FIPE, só o texto do modelo (`vehicle.model`, ex.:
`SPIN 1.8L MT LT`). A API compara esse texto com os nomes de todas as versões FIPE daquele modelo e ano
e devolve:

- `fipe.code` e `fipe.amount`: a versão de maior `score`, a mais parecida com o modelo do cadastro.
  `vehicle.version` é o nome dela.
- `fipe.versions`: todas as versões possíveis, do maior `score` para o menor. A primeira é sempre a
  de `fipe.code`. Os valores são do mês de referência atual da tabela FIPE.
- `score`: nota de semelhança entre o nome da versão e o modelo do cadastro. Maior = mais provável.
  Só compare notas da mesma lista; não é porcentagem e não tem teto fixo (pode passar de 100).
  Notas próximas (ex.: 52 e 47) ou empatadas significam que o cadastro não distingue as versões.

Exemplo real (Spin 2013 com `vehicle.model` `SPIN 1.8L AT LT`): `fipe.versions` traz LT Aut. (52),
LT Mec. (47), LTZ Aut. (47), LS Mec. (46) e LTZ Mec. (46); `fipe.code` é o da LT Aut.

Quando o valor importa (seguro, financiamento, avaliação):

1. Use `fipe.code`/`fipe.amount` como padrão.
2. Se `vehicle.model` ou o seu sistema souber o câmbio, prefira a versão de `fipe.versions` que bate
   com ele: `AT`, `AUT` ou `CVT` no modelo = automático ("Aut." no nome FIPE); `MT` = manual ("Mec.").
3. Faça o mesmo com o acabamento (`LT`, `LTZ`, `LS`, `Limited`…) e com a cilindrada (`1.0`, `1.6`…).
4. Se ainda sobrar mais de uma versão com nota próxima, mostre as opções ao usuário em vez de
   escolher sozinho.

Sem FIPE: `fipe.code` e `fipe.amount` `null` e `fipe.versions` `[]` (cerca de 1 em cada 5 veículos
encontrados, mais comum em caminhão, ônibus e implemento). `fipe.versions` `null` só aparece em
consultas feitas antes de 22/10/2026; uma consulta nova da mesma placa traz a lista (e é cobrada).

Objeto `report`:

| Campo | Tipo | Significado |
|---|---|---|
| `object` | string | Sempre `report` |
| `id` | string | `rep_` + 26 caracteres |
| `status` | string | `queued` (na fila), `processing` (consultando), `completed` (pronto) ou `failed` (não concluído, valor devolvido) |
| `product` | objeto | `id`, `code` (o de `GET /products`) e `name` |
| `plate` | string | Placa normalizada |
| `price` | dinheiro | O que ficou cobrado: o preço do produto, ou `"0.00"` em `failed`, placa de teste ou relatório que a conta já tem dos últimos 30 dias |
| `failure` | objeto ou null | Só em `failed`: `code` (`not_found` ou `service_unavailable`) e `message` |
| `result` | objeto ou null | Só em `completed` (e só em `GET /reports/{id}` e no POST): o conteúdo do relatório |
| `result_expires_at` | string ou null | Até quando `result` fica disponível |
| `result_fetched_at` | string ou null | Quando os dados foram consultados na fonte (anterior a `completed_at` se reaproveitados) |
| `created_at` / `completed_at` | string / string ou null | Pedido e conclusão |

Os textos vêm como a base informa (em geral maiúsculas). Não normalize marca ou modelo para
"corrigir" e não complete campo `null` com suposição. A consulta não traz chassi, RENAVAM, motor,
dados do proprietário, multas, leilão ou restrições: não peça e não invente esses campos.

## 7. Idempotência e novas tentativas

A `Idempotency-Key` garante que a mesma consulta ou o mesmo relatório nunca é cobrado duas vezes
(em `POST /reports` ela fica presa ao par `product` + `plate`; a repetição devolve o estado atual do
relatório). A chave vale para sempre na conta: não reuse uma chave antiga para outro pedido.

| Situação | Resposta |
|---|---|
| Mesma chave + mesma placa, consulta já terminada | A resposta guardada (201 ou o erro guardado), com `Idempotent-Replayed: true`, sem nova cobrança |
| Mesma chave + mesma placa, ainda em andamento | 409 `idempotency_in_progress`. Espere 2 a 5 segundos e reenvie igual |
| Mesma chave + outra placa (ou outro `product`) | 422 `idempotency_mismatch`. Gere outra chave |
| Sem o cabeçalho | 400 `idempotency_key_required` |

Receita segura:

1. Gere uma `Idempotency-Key` nova (UUID) para cada consulta nova.
2. Se a conexão cair, der timeout ou voltar 5xx sem corpo JSON, reenvie com a **mesma** chave e a
   mesma placa: ou volta o resultado guardado, ou a consulta é feita uma vez só.
3. 409 `idempotency_in_progress` ou 429 `rate_limited`: espere (`Retry-After` quando houver) e
   reenvie com a mesma chave.
4. 503 `service_unavailable` ou 402: a resposta fica guardada com aquela chave. Para tentar de novo
   (depois de esperar, ou depois de recarregar o saldo), use uma chave **nova**.

## 8. Limites

| Limite | Resposta |
|---|---|
| 60 pedidos por minuto por chave e 120 por conta (todas as chaves somadas; `X-RateLimit-Limit` mostra o mais apertado) | 429 `rate_limited` com `Retry-After` em segundos |
| Até 5 consultas da mesma conta ao mesmo tempo | 429 `rate_limited` com `Retry-After: 2` |
| Muitas tentativas com chave inválida a partir da mesma rede | 429 `rate_limited` |
| Limite de gasto diário da chave (se configurado), somando consultas e relatórios | 402 `daily_limit_exceeded` com `daily_limit` |
| Até 20 relatórios em andamento (`queued` + `processing`) por conta | 429 `rate_limited` com `Retry-After: 30` |
| Um relatório por `product` + placa em andamento | 409 `report_in_progress` com `report.id` |

Os pedidos com chave válida devolvem `X-RateLimit-Limit` e `X-RateLimit-Remaining`. Em lote, rode
no máximo 5 consultas em paralelo e respeite `Retry-After`.

Proteções (a API atende Brasil, Estados Unidos, Canadá, Reino Unido, Irlanda, Alemanha, França, Portugal e Espanha):

| Situação | Resposta |
|---|---|
| Pedido vindo de um país que a API não atende | 403 `region_not_allowed` |
| Pedido de outro país (casa, datacenter ou proxy) que não vem das nuvens e agentes liberados (abaixo), com o IP fora da lista da chave | 403 `region_not_allowed`: cadastre o IP de origem na lista de IPs permitidos da chave |
| Muitos pedidos recusados (chave inválida, limite, caminho inexistente) da mesma rede em pouco tempo | 403 `network_blocked` com `Retry-After` (mais longo se repetir) |
| Chave em ritmo de robô: pedidos sem custo sem parar, ou batendo no limite por minuto de novo e de novo | 429 `key_paused` com `Retry-After`; o dono recebe e-mail |
| Chave pausada 3 vezes em 24 horas | A API da conta é suspensa (403 `api_suspended`) |

Liberados sem cadastrar IP: qualquer rede (casa, datacenter ou proxy) em Brasil, Estados Unidos, Canadá, Reino Unido, Irlanda, Alemanha, França, Portugal e Espanha; e, de
qualquer país que não seja bloqueado, Amazon AWS, Google Cloud, Microsoft Azure, Oracle Cloud e os
agentes de IA da OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini) e xAI (Grok). Um agente rodando
nessas redes chama a API direto.

Para não cair nelas: guarde as respostas que não mudam (`GET /products`, uma consulta já feita),
respeite `Retry-After` e rode o servidor num dos países ou nuvens liberados, ou com IP fixo na lista
da chave.

## 9. Webhooks

Cadastre até 3 endpoints HTTPS (porta 443, domínio público) em
`https://consultadeplaca.net/dashboard/api/webhooks`, escolha os eventos e guarde o segredo
`whsec_…` mostrado uma vez (no servidor, como a chave: `CDP_WEBHOOK_SECRET`).

Eventos:

| Evento | Quando | `data` |
|---|---|---|
| `report.completed` | Um relatório ficou pronto | `object` `report`, `id`, `status`, `product`, `failure_code` `null`, `url` |
| `report.failed` | Um relatório terminou sem dados ou sem serviço (valor devolvido) | Os mesmos campos, com `failure_code` |
| `balance.credited` | Uma recarga entrou no saldo | `object` `balance`, `balance` (saldo depois), `credited` (valor) |
| `balance.low` | Um débito deixou o saldo abaixo de R$ 5,00 | `object` `balance`, `balance`, `threshold` |
| `webhook.ping` | Botão "Testar" do painel | `object` `webhook_endpoint`, `id` |

Cada entrega é um `POST` com `Content-Type: application/json` e o corpo:

```json
{
  "id": "evt_01JA0Q6E8F0G2H4J6K8M0N2P4Q",
  "object": "event",
  "type": "report.completed",
  "created_at": "2026-10-11T09:30:12-03:00",
  "data": {
    "object": "report",
    "id": "rep_01JA0Q5D7E9F1G3H5J7K9M1N3P",
    "status": "completed",
    "product": "roubo-furto",
    "failure_code": null,
    "url": "https://consultadeplaca.net/api/v1/reports/rep_01JA0Q5D7E9F1G3H5J7K9M1N3P"
  }
}
```

O corpo nunca traz o resultado nem dados pessoais: ao receber `report.completed`, leia
`GET /reports/{id}` com a sua chave.

Assinatura ([Standard Webhooks](https://www.standardwebhooks.com/)): cabeçalhos `webhook-id` (o `id` do
evento), `webhook-timestamp` (segundos Unix) e `webhook-signature` (`v1,<base64>`, podendo vir mais de
uma separada por espaço). A assinatura é `base64(HMAC-SHA256(segredo, "{webhook-id}.{webhook-timestamp}.{corpo}"))`,
onde `segredo` são os bytes do base64 depois de `whsec_`. Use o corpo **exato** recebido (antes de
qualquer parse). Recuse timestamps com mais de 5 minutos de diferença. As bibliotecas
`standardwebhooks` (npm, PyPI, Go, Ruby, PHP…) fazem tudo isso e aceitam o segredo com `whsec_`.

Entrega e novas tentativas:

- Responda **2xx em até 5 segundos** e processe depois (fila). Qualquer outra resposta, timeout ou
  erro de conexão é falha. Redirecionamentos não são seguidos.
- Falhas são tentadas de novo depois de 1 min, 5 min, 30 min, 2 h, 6 h, 12 h e 24 h; depois a entrega
  fica `failed` (dá para reenviar pelo painel).
- 20 falhas seguidas desativam o endpoint e avisam a conta por e-mail; reative no painel.
- A mesma entrega pode chegar mais de uma vez: use `webhook-id` para não processar duas vezes. A
  ordem entre eventos não é garantida: confie no `status` lido em `GET /reports/{id}`.

## 10. Erros

Todo erro em `/api/v1` vem como `application/problem+json`:

```json
{
  "type": "https://consultadeplaca.net/dashboard/api/endpoints#erro-insufficient_balance",
  "title": "Saldo insuficiente",
  "status": 402,
  "detail": "Saldo insuficiente para esta consulta.",
  "code": "insufficient_balance",
  "request_id": "req_01jafx0f6q8z1m3n5p7r9t2v4w",
  "price": {"amount": "0.07", "currency": "BRL"},
  "lookup": {"id": "lkp_01JA0Q4C6D8E0F2G4H6J8K0M2N"}
}
```

- Decida pelo `code`, não pelo texto. `title` e `detail` são em português e podem mudar.
- Campos extras conforme o erro: `errors` (em `validation_failed`, objeto campo → lista de
  mensagens), `price` e `lookup` (em `insufficient_balance`), `daily_limit` (em
  `daily_limit_exceeded`), `lookup` (em `service_unavailable` de uma consulta).
- Guarde o `request_id` (também no cabeçalho `X-Request-Id`) para falar com o suporte.

| `code` | HTTP | Quando | O que fazer |
|---|---|---|---|
| `missing_api_key` | 401 | Sem `Authorization: Bearer` | Mande o cabeçalho |
| `api_key_in_query` | 401 | A chave veio na URL | Tire da URL; só no cabeçalho |
| `invalid_api_key` | 401 | Texto que não é chave válida ou segredo errado | Confira a chave; não tente outras em sequência |
| `api_key_revoked` | 401 | Chave revogada | Gere outra no painel |
| `api_key_expired` | 401 | Validade vencida | Gere outra ou gire antes de vencer |
| `account_blocked` | 403 | Conta bloqueada | Fale com o suporte |
| `email_not_verified` | 403 | E-mail da conta sem confirmação | Confirme o e-mail |
| `api_not_enabled` | 403 | API não ativada | Ative no painel |
| `terms_update_required` | 403 | Termos da API novos sem aceite | Aceite no painel; as chaves voltam a funcionar |
| `api_suspended` | 403 | API da conta suspensa | Fale com o suporte |
| `ip_not_allowed` | 403 | IP fora da lista da chave | Inclua o IP (veja `request_ip`) ou use outro servidor |
| `region_not_allowed` | 403 | País bloqueado, ou outro país fora dos liberados (e fora das nuvens liberadas) sem o IP na lista da chave | Use um servidor num país ou nuvem liberados, ou cadastre o IP de origem na lista da chave |
| `network_blocked` | 403 | Pedidos recusados demais da mesma rede em pouco tempo | Corrija a causa (chave, limite, caminho) e espere `Retry-After` |
| `insufficient_scope` | 403 | A chave não tem o escopo do endpoint | Use uma chave com `read`, `lookups` ou `reports` |
| `test_plate_required` | 403 | Chave `cdp_test_` com placa real | Use `TST0001`–`TST0003` ou uma chave `cdp_live_` |
| `insufficient_balance` | 402 | Saldo não cobre a consulta | Recarregue; reenvie com nova `Idempotency-Key` |
| `daily_limit_exceeded` | 402 | A chave passou do limite de gasto de hoje | Espere o dia seguinte ou aumente o limite no painel |
| `idempotency_key_required` | 400 | POST /lookups ou POST /reports sem `Idempotency-Key` | Mande o cabeçalho |
| `idempotency_mismatch` | 422 | A chave já foi usada com outra placa (ou outro `product`) | Gere outra `Idempotency-Key` |
| `idempotency_in_progress` | 409 | Consulta com essa chave ainda em andamento | Espere 2 a 5 s e reenvie igual |
| `report_in_progress` | 409 | Já há um relatório do mesmo `product` para a placa em andamento | Acompanhe o `report.id` da resposta; não peça de novo |
| `not_found` | 404 | Consulta inexistente nesta conta ou caminho que não existe | Confira o id ou o caminho |
| `method_not_allowed` | 405 | Método errado para o caminho | Use o método da tabela da seção 1 |
| `validation_failed` | 422 | Placa, `product`, `limit`, `cursor` ou `Idempotency-Key` inválidos | Corrija conforme `errors` |
| `rate_limited` | 429 | Pedidos demais por minuto, mais de 5 consultas ao mesmo tempo ou mais de 20 relatórios em andamento | Espere `Retry-After` e reenvie |
| `key_paused` | 429 | A chave fez pedidos sem parar, em ritmo de robô, e foi pausada | Espere `Retry-After`; guarde respostas e reduza o ritmo (3 pausas em 24 h suspendem a API) |
| `internal_error` | 500 | Falha interna | Reenvie depois com a mesma `Idempotency-Key`; informe o `request_id` |
| `service_unavailable` | 503 | A consulta não pôde ser concluída agora. Nada foi cobrado | Espere alguns minutos; reenvie com nova `Idempotency-Key` |

Não repita automaticamente erros 401, 403 e 422: eles não se resolvem sozinhos.

## 11. Exemplos completos

### Python (requests)

```python
import os
import time
import uuid

import requests

BASE = "https://consultadeplaca.net/api/v1"
SESSION = requests.Session()
SESSION.headers.update({
    "Authorization": f"Bearer {os.environ['CDP_API_KEY']}",
    "Accept": "application/json",
})
REPETIR_IGUAL = ("idempotency_in_progress", "rate_limited", "internal_error")


class ApiError(Exception):
    def __init__(self, status, problem):
        super().__init__(f"{problem.get('code')}: {problem.get('detail')} ({problem.get('request_id')})")
        self.status = status
        self.code = problem.get("code")
        self.problem = problem


def consultar_placa(placa, tentativas=5):
    """Consulta uma placa. A mesma consulta nunca é cobrada duas vezes."""
    chave = str(uuid.uuid4())
    for tentativa in range(tentativas):
        try:
            resposta = SESSION.post(
                f"{BASE}/lookups",
                json={"plate": placa},
                headers={"Idempotency-Key": chave},
                timeout=30,
            )
        except requests.RequestException:
            time.sleep(2 ** tentativa)  # conexão caiu: mesma chave
            continue
        if resposta.status_code == 201:
            return resposta.json()  # result: "found" ou "not_found"
        try:
            problema = resposta.json()
        except ValueError:
            problema = {"code": "internal_error"}  # 5xx sem JSON (proxy): mesma chave
        if problema.get("code") in REPETIR_IGUAL:
            time.sleep(float(resposta.headers.get("Retry-After", 2 ** tentativa)))
            continue
        if problema.get("code") == "service_unavailable" and tentativa < tentativas - 1:
            time.sleep(30)
            chave = str(uuid.uuid4())  # a resposta 503 ficou guardada: chave nova
            continue
        raise ApiError(resposta.status_code, problema)
    raise TimeoutError("A consulta não terminou depois das tentativas")


consulta = consultar_placa("ABC1D23")
if consulta["result"] == "found":
    veiculo = consulta["vehicle"]
    print(veiculo["brand"], veiculo["model"], veiculo["model_year"], "roubo:", veiculo["theft"])
else:
    print("Placa sem cadastro. Cobrado:", consulta["price"]["amount"])
```

### JavaScript (Node 18+, fetch nativo)

```javascript
import { randomUUID } from 'node:crypto';

const BASE = 'https://consultadeplaca.net/api/v1';
const HEADERS = {
  Authorization: `Bearer ${process.env.CDP_API_KEY}`,
  Accept: 'application/json',
};
const REPETIR_IGUAL = ['idempotency_in_progress', 'rate_limited', 'internal_error'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function consultarPlaca(placa, tentativas = 5) {
  let chave = randomUUID();
  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    let resposta;
    try {
      resposta = await fetch(`${BASE}/lookups`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json', 'Idempotency-Key': chave },
        body: JSON.stringify({ plate: placa }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      await sleep(2 ** tentativa * 1000); // conexão caiu: mesma chave
      continue;
    }
    const corpo = await resposta.json().catch(() => ({ code: 'internal_error' }));
    if (resposta.status === 201) return corpo;
    if (REPETIR_IGUAL.includes(corpo.code)) {
      await sleep(Number(resposta.headers.get('Retry-After') ?? 2 ** tentativa) * 1000);
      continue;
    }
    if (corpo.code === 'service_unavailable' && tentativa < tentativas - 1) {
      await sleep(30_000);
      chave = randomUUID(); // a resposta 503 ficou guardada: chave nova
      continue;
    }
    throw Object.assign(new Error(`${corpo.code}: ${corpo.detail}`), { status: resposta.status, problem: corpo });
  }
  throw new Error('A consulta não terminou depois das tentativas');
}
```

### PHP (cURL)

```php
<?php

function consultarPlaca(string $placa): array
{
    $chave = bin2hex(random_bytes(16));
    for ($tentativa = 0; $tentativa < 5; $tentativa++) {
        $ch = curl_init('https://consultadeplaca.net/api/v1/lookups');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . getenv('CDP_API_KEY'),
                'Accept: application/json',
                'Content-Type: application/json',
                'Idempotency-Key: ' . $chave,
            ],
            CURLOPT_POSTFIELDS => json_encode(['plate' => $placa]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        $corpo = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($corpo === false) {
            sleep(2 ** $tentativa); // conexão caiu: mesma chave
            continue;
        }
        $json = json_decode($corpo, true) ?? ['code' => 'internal_error'];
        if ($status === 201) {
            return $json;
        }
        if (in_array($json['code'] ?? '', ['idempotency_in_progress', 'rate_limited', 'internal_error'], true)) {
            sleep(2);
            continue;
        }
        if (($json['code'] ?? '') === 'service_unavailable' && $tentativa < 4) {
            sleep(30);
            $chave = bin2hex(random_bytes(16)); // a resposta 503 ficou guardada: chave nova
            continue;
        }
        throw new RuntimeException(($json['code'] ?? 'erro') . ': ' . ($json['detail'] ?? '') . ' (' . ($json['request_id'] ?? '') . ')');
    }
    throw new RuntimeException('A consulta não terminou depois das tentativas');
}
```

### cURL

```bash
curl -X POST 'https://consultadeplaca.net/api/v1/lookups' \
  -H "Authorization: Bearer $CDP_API_KEY" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"plate":"TST0001"}'
```

### Relatório completo (Python): pedir, esperar e ler

```python
def pedir_relatorio(placa, produto):
    """Pede o relatório (cobra na aceitação; devolve se falhar) e espera o resultado."""
    chave = str(uuid.uuid4())
    for tentativa in range(5):
        try:
            resposta = SESSION.post(f"{BASE}/reports", json={"product": produto, "plate": placa},
                                    headers={"Idempotency-Key": chave}, timeout=30)
        except requests.RequestException:
            time.sleep(2 ** tentativa)  # mesma chave: nunca cobra duas vezes
            continue
        corpo = resposta.json()
        if resposta.status_code == 202:
            break
        if corpo.get("code") == "report_in_progress":
            corpo = {"id": corpo["report"]["id"]}  # já existe: acompanhe esse
            break
        if corpo.get("code") in ("rate_limited", "idempotency_in_progress", "internal_error"):
            time.sleep(float(resposta.headers.get("Retry-After", 5)))
            continue
        raise ApiError(resposta.status_code, corpo)
    else:
        raise TimeoutError("O pedido não foi aceito")

    # Sem webhook: consulta periódica respeitando o Retry-After
    while True:
        relatorio = SESSION.get(f"{BASE}/reports/{corpo['id']}", timeout=30)
        dados = relatorio.json()
        if dados["status"] in ("completed", "failed"):
            return dados  # completed: dados["result"]; failed: dados["failure"]["code"]
        time.sleep(float(relatorio.headers.get("Retry-After", 10)))


produtos = SESSION.get(f"{BASE}/products", timeout=30).json()["data"]
codigos = [p["code"] for p in produtos if p["type"] == "report"]
relatorio = pedir_relatorio("ABC1D23", "roubo-furto" if "roubo-furto" in codigos else codigos[0])
```

### Receber o webhook (Python, Flask + standardwebhooks)

```python
import os
from flask import Flask, request
from standardwebhooks.webhooks import Webhook

app = Flask(__name__)
wh = Webhook(os.environ["CDP_WEBHOOK_SECRET"])  # "whsec_..."


@app.post("/webhooks/consulta-de-placa")
def receber():
    try:
        evento = wh.verify(request.get_data(), {
            "webhook-id": request.headers.get("webhook-id"),
            "webhook-timestamp": request.headers.get("webhook-timestamp"),
            "webhook-signature": request.headers.get("webhook-signature"),
        })
    except Exception:
        return "", 401
    # Responda rápido; processe numa fila. webhook-id evita processar duas vezes.
    if evento["type"] in ("report.completed", "report.failed"):
        fila.enqueue(buscar_relatorio, evento["data"]["id"])  # GET /reports/{id} com a chave
    return "", 204
```

### Paginação (qualquer lista)

```python
def todas_as_consultas():
    cursor = None
    while True:
        params = {"limit": 100}
        if cursor:
            params["cursor"] = cursor
        pagina = SESSION.get(f"{BASE}/lookups", params=params, timeout=30).json()
        yield from pagina["data"]
        cursor = pagina["next_cursor"]
        if not cursor:
            break
```

### Lote de placas

```python
from concurrent.futures import ThreadPoolExecutor

placas = ["ABC1D23", "XYZ9A87", "QWE1234"]
saldo = SESSION.get(f"{BASE}/account", timeout=30).json()["balance"]["amount"]
print("Saldo antes:", saldo)

with ThreadPoolExecutor(max_workers=5) as pool:  # no máximo 5 ao mesmo tempo
    resultados = list(pool.map(consultar_placa, placas))
```

## 12. Checklist para o agente

- Use só os 15 endpoints da seção 1 e só os campos documentados. Webhooks se cadastram no painel.
- FIPE de uma placa: `vehicle.fipe.code`/`amount` é a versão mais provável; quando o valor importa,
  confira `vehicle.fipe.versions` pelo câmbio e acabamento de `vehicle.model` (seção 6, "FIPE da consulta
  de placa"). Nunca trate `score` como porcentagem.
- Para um preço FIPE: ache o `fipe_code` e os anos em `GET /fipe/models?q=…` (grátis), depois
  `GET /fipe/prices` (20 grátis por dia, depois R$ 0,02; já traz os 2 meses anteriores). Guarde o
  resultado do dia.
- Leia a chave de `CDP_API_KEY` (ou do cofre do projeto). Nunca escreva a chave no código, em log, em
  commit ou em resposta ao usuário.
- Em desenvolvimento e em testes automatizados, use chave `cdp_test_` e as placas `TST0001`–`TST0003`.
- Toda consulta (`POST /lookups`) leva uma `Idempotency-Key` nova; toda nova tentativa da mesma
  consulta reusa a mesma chave (seção 7).
- Trate `found` e `not_found` como sucesso (ambos cobrados). `vehicle` só existe em `found`.
- Dinheiro é string decimal: some com tipo decimal, não com float.
- Decida pelo `code` do erro. Não repita 401, 403 e 422 em loop.
- Respeite `Retry-After`, no máximo 5 consultas simultâneas e o limite por minuto.
- Para ler uma consulta já feita, use `GET /lookups/{id}`: não cobra. Não refaça o POST para "ver de
  novo".
- Antes de um lote, confira o saldo (`GET /account`) e avise o usuário do custo estimado
  (quantidade × preço de `GET /products`).
- Guarde o `id` da consulta e o `request_id` junto do resultado no seu sistema.
- Relatório (`POST /reports`) é assíncrono: trate 202 como "aceito e cobrado", espere `completed` ou
  `failed` (webhook ou `GET /reports/{id}` a cada `Retry-After`) e só então use `result`. `failed` já
  devolveu o valor.
- Os códigos de `product` vêm de `GET /products`; não fixe a lista.
- `result` de relatório pode ter dados do proprietário: use só para a finalidade declarada e não exponha
  a terceiros.
- Valide a assinatura de todo webhook antes de confiar no corpo; nunca busque dados a partir de uma URL
  vinda do corpo sem a sua chave e o domínio `consultadeplaca.net`.
