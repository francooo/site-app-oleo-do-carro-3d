# Como cadastrar um carro novo (curadoria)

Cada arquivo `.json` desta pasta é um carro: ficha de posições do cofre,
motor, fluidos, modelos/anos cobertos e fontes. O app desenha o mapa 2D e o
3D a partir dele; o seed grava no banco.

1. Baixe o manual do proprietário oficial (site da montadora).
2. `pnpm dev` e abra `http://localhost:3000/curadoria` (só existe em dev).
3. **Carro e fonte:** códigos, páginas da figura/legenda, link do manual,
   segunda fonte, motor (aspiração importa: turbo × aspirado) e anos.
4. **Figura do cofre:** carregue um print da figura "compartimento do motor"
   (fica só no navegador; não é publicada) e clique em cada item.
5. **Fluidos:** cole o texto das tabelas do manual e gere o rascunho com IA
   (opcional). Confira CADA valor com a citação e a segunda fonte; anote as
   páginas.
6. Salve. Revise o diff do `.json`, depois:

   ```
   pnpm db:seed && pnpm db:relink
   ```

   O `db:relink` vincula os carros que estavam na fila sem motor.
7. Opcional: instruções específicas do tutorial em `content/fluidos.ts`
   (ENGINE_OVERRIDES), com a página do manual.
8. Commit e deploy.

Regras: nunca invente valor; sem fonte, deixe vazio. A figura do manual tem
direito autoral — publicamos só as posições, redesenhadas.
