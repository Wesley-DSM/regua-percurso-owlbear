# Régua de Percurso — extensão para Owlbear Rodeo

Versão do código: 0.3.16. O repositório está configurado para publicar automaticamente no GitHub Pages.

## Funcionalidades

- Régua de percurso com nós e marcação de terreno difícil.
- Réguas de formas circulares e cônicas adaptadas às grades suportadas.
- Personalização independente da régua e das áreas.

## Publicação no GitHub Pages

**Importante:** crie o repositório com o nome exato `regua-percurso-owlbear`. O caminho do site está configurado para esse nome. Se mudar o nome, atualize o `base` em `vite.config.js` e os caminhos em `public/manifest.json`.

1. Crie no GitHub um repositório público chamado `regua-percurso-owlbear`. Não precisa adicionar README, licença ou `.gitignore` no GitHub, pois estes arquivos já estão neste projeto.
2. Envie todos os arquivos desta pasta para a raiz do repositório e faça o primeiro commit na branch `main`. Inclua a pasta oculta `.github/workflows/`.
3. No GitHub, abra **Settings → Pages** e em **Build and deployment → Source** selecione **GitHub Actions**.
4. Abra a aba **Actions** e espere o workflow **Build and deploy to GitHub Pages** terminar com sucesso. Ele será executado a cada envio para `main`.
5. O endereço público do site seguirá este formato: `https://SEU-USUARIO.github.io/regua-percurso-owlbear/`.

## Instalar no Owlbear Rodeo

1. Abra o site publicado substituindo `SEU-USUARIO` pelo seu nome de usuário do GitHub.
2. Confirme que `https://SEU-USUARIO.github.io/regua-percurso-owlbear/manifest.json` abre um JSON com o nome **Régua de Percurso** e versão **0.3.16**.
3. No perfil do Owlbear Rodeo, adicione uma extensão usando exatamente esse endereço do `manifest.json` como link de instalação.
4. Ative a extensão na sala.

A extensão só estará disponível depois que a publicação do GitHub Actions concluir. Não use o link do repositório nem o link `raw.githubusercontent.com`; use o endereço público do `manifest.json` no GitHub Pages.

## Desenvolvimento local

Requer Node.js 22 ou compatível com o Vite configurado.

```bash
npm install
npm run dev
```

Para gerar os arquivos finais localmente, execute `npm run build`; o resultado é salvo em `dist/`.
