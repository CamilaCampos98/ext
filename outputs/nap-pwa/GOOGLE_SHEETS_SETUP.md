# Google Sheets: salvar registros da PWA

## 1. Criar o Apps Script

1. Abra sua planilha no Google Sheets.
2. Vá em `Extensões > Apps Script`.
3. Apague o conteúdo inicial.
4. Cole o conteúdo de `google-apps-script.gs`.
5. Troque o valor de `SHARED_TOKEN` por uma frase/chave sua.
6. Salve.

## 2. Implantar como Web App

1. Clique em `Implantar > Nova implantação`.
2. Em `Tipo`, escolha `App da Web`.
3. Em `Executar como`, escolha `Eu`.
4. Em `Quem tem acesso`, escolha `Qualquer pessoa`.
5. Clique em `Implantar`.
6. Autorize o script na sua conta Google.
7. Copie a URL do Web App.

## 3. Conectar na PWA

No arquivo `app.js`, preencha:

```js
const SHEETS_WEB_APP_URL = "COLE_A_URL_DO_WEB_APP_AQUI";
const SHEETS_SHARED_TOKEN = "O_MESMO_TOKEN_DO_APPS_SCRIPT";
```

Depois atualize a versão do cache no `index.html` e no `sw.js` se estiver usando a PWA instalada.

## Colunas criadas

O script cria uma aba chamada `Sonecas` com colunas para bebê, idade, início, fim, duração, humor, último despertar, sono 24h, sonecas hoje, próxima janela e sono noturno sugerido.
