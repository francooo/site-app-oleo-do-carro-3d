# Como cadastrar um carro novo (curadoria)

Tudo acontece em produção, em **https://fluidofacil.vercel.app/curadoria** —
só para os e-mails em `CURATOR_EMAILS` (para os demais a página não existe).

1. Baixe o manual do proprietário oficial (site da montadora).
2. **Carro e fonte:** códigos, páginas da figura/legenda, link do manual,
   segunda fonte, motor (aspiração importa: turbo × aspirado) e anos.
3. **Figura do cofre:** carregue um print da figura "compartimento do motor"
   (fica só no navegador; não é publicada) e clique em cada item. A planta e
   o 3D aparecem ao lado.
4. **Fluidos:** cole o texto das tabelas do manual e gere o rascunho com IA
   (opcional). Confira CADA valor com a citação e a segunda fonte; anote as
   páginas.
5. **Salvar rascunho** quantas vezes quiser — rascunho não aparece para
   ninguém.
6. **Publicar → Confirmar:** grava motor, fluidos, layout, pontos do mapa e
   modelos no catálogo e vincula na hora os carros que estavam na fila. O
   mapa 2D/3D é gerado automaticamente das posições.

Instruções específicas do tutorial (ex.: "verifique com o motor frio") ainda
ficam em `content/fluidos.ts` (ENGINE_OVERRIDES) e exigem deploy.

Os `.json` desta pasta são o ponto de partida do seed (`pnpm db:seed`) e dos
testes; o seed nunca sobrescreve um carro que já existe na curadoria online.

Regras: nunca invente valor; sem fonte, deixe vazio. A figura do manual tem
direito autoral — publicamos só as posições, redesenhadas.
