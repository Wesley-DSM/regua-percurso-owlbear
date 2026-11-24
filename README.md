# Régua de Percurso — extensão para Owlbear Rodeo

Versão do código: 0.3.19. O repositório está configurado para publicar automaticamente no GitHub Pages.

## Alterações na versão 0.3.19

- As prévias da régua e das áreas agora ocupam toda a altura disponível. A grade se estende horizontalmente para preencher o restante da largura.
- A régua mantém a região central de referência 5×5; as áreas mantêm a região central 7×7.
- Os elementos visuais de uma régua confirmada formam um grupo conectado pelo sistema `attachedTo`: linha, nós e indicador.
- Mover o grupo visual de uma régua atualiza os dados compartilhados da rota, preservando a aparência personalizada de cada jogador.
- O contorno de uma área confirmada é o elemento-pai do indicador de distância.
- As prévias em andamento também conectam seus nós, indicadores e controles ao elemento-pai correspondente.

## Alterações

- Corrigida a seleção de células em cones diagonais nas grades quadradas, evitando falhas e recortes desconectados.
- Mantido o padrão de células já definido para cones quadrados cardinais.
- Prévia das áreas reorganizada em uma grade centralizada de 7 × 7.
- Removido o brilho de seleção da prévia para que as cores e opacidades exibidas correspondam à aparência configurada.

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
2. Confirme que `https://SEU-USUARIO.github.io/regua-percurso-owlbear/manifest.json` abre um JSON com o nome **Régua de Percurso** e versão **0.3.19**.
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
