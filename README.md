# Mercado da Família

Um site para a família organizar a casa, feito para usar no celular.

## O que ele faz

**Compras**

- **Lista de compras**: escreva o produto e aperte Enter. Dá para digitar a quantidade junto, como `2 kg de arroz` ou `leite 6`. O corredor do mercado é escolhido sozinho e a lista fica agrupada por corredor.
- **Carrinho**: no mercado, toque em cada produto da lista quando pegar. Se quiser, anote o preço para ver o total. Ao **finalizar a compra**, tudo vai para "Em casa".
- **Em casa**: o que tem na despensa e quanto. Use os botões − e + conforme for usando. Dá para definir um aviso de quantidade mínima e a data de validade. O que está acabando aparece como sugestão na lista.
- **Enviar pelo WhatsApp**: manda a lista pronta para quem está no mercado.

**Mais para a família**

- **Cardápio da semana**: almoço e jantar de cada dia.
- **Tarefas da casa**: quem faz o quê. Tarefas marcadas como "toda semana" voltam sozinhas toda segunda-feira.
- **Gastos do mercado**: o total de cada compra, a soma do mês e uma meta mensal.
- **Recados**: avisos rápidos para todo mundo ver.

Funciona no tema claro e no escuro, e pode ser adicionado à tela inicial do celular como um aplicativo. Não precisa instalar nada: é só HTML, CSS e JavaScript.

## 1. Publicar com o GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`. Clique em **Save**.
3. Em um ou dois minutos o site fica disponível em `https://SEU-USUARIO.github.io/mercado-da-familia/`.

Nesse ponto o site já funciona no **modo local**: cada aparelho guarda os seus próprios dados. Para a família inteira ver as mesmas listas, siga o passo 2.

## 2. Compartilhar entre os celulares (Firebase, gratuito)

O Firebase é um banco de dados do Google. O plano gratuito é mais do que suficiente para uma família.

1. Acesse <https://console.firebase.google.com> e crie um projeto. O Google Analytics pode ficar desativado.
2. No menu, abra **Criação → Firestore Database → Criar banco de dados**. Escolha o local `southamerica-east1 (São Paulo)` e o modo **produção**.
3. Na aba **Regras** do Firestore, troque o conteúdo pelo texto abaixo e clique em **Publicar**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /familias/{familia}/{colecao}/{item} {
         allow read, write: if colecao in
           ['compras', 'despensa', 'gastos', 'tarefas', 'recados', 'cardapio', 'ajustes'];
       }
     }
   }
   ```

4. Na página inicial do projeto, clique no ícone **Web** (`</>`) para registrar um app. Qualquer nome serve e não é preciso marcar o Hosting.
5. O Firebase mostra um bloco `const firebaseConfig = { ... }`. Copie os valores para o arquivo **`config.js`** deste repositório.
6. No mesmo arquivo, troque `codigoFamilia` por um código que só vocês saibam, como `"silva-quintal-2026"`, e `nomeFamilia` pelo nome da família.
7. Salve o arquivo no GitHub. O sinal no topo do site muda para **Sincronizado** e todos passam a ver os mesmos dados em tempo real.

> **Sobre segurança:** as chaves do Firebase foram feitas para ficar no site, então podem ser públicas. Mas quem tiver o endereço do site e o código da família consegue ver e alterar os dados. Use um código difícil de adivinhar e não guarde nada sigiloso aqui.

## 3. Colocar na tela inicial do celular

- **Android (Chrome):** abra o site, toque nos três pontinhos e em **Adicionar à tela inicial**.
- **iPhone (Safari):** toque em **Compartilhar** e em **Adicionar à Tela de Início**.

## Testar no computador

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura das telas |
| `css/estilo.css` | Visual (claro e escuro) |
| `js/app.js` | Telas e ações |
| `js/dados.js` | Onde os dados são guardados (aparelho ou Firebase) |
| `config.js` | Nome da família, código e chaves do Firebase |
| `fontes/` | Letras usadas no site (Baloo 2 e Nunito Sans, licença OFL) |
| `manifest.webmanifest`, `icone.svg` | Ícone e instalação na tela inicial |
