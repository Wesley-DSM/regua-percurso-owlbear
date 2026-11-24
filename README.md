# Régua de Percurso

Extensão para criar percursos medidos e áreas de efeito diretamente no mapa do Owlbear Rodeo.

**Adicionar ao Owlbear Rodeo:** [https://wesley-dsm.github.io/regua-percurso-owlbear/manifest.json](https://wesley-dsm.github.io/regua-percurso-owlbear/manifest.json)

Cole o endereço acima na opção de adicionar extensão do seu perfil no Owlbear Rodeo.

## Ferramentas

### Régua de percurso

Desenhe um caminho pelo mapa adicionando pontos ao longo do trajeto. A extensão acompanha o percurso em tempo real e exibe a distância total, respeitando a escala, a unidade e o método de medição configurados na grade da cena. Os pontos são ajustados às células da grade.

Durante a criação, é possível:

- Adicionar pontos com cliques ou arrastando pelo mapa.
- Marcar pontos como terreno difícil em grades quadradas. O custo de atravessar essas células é acrescentado à medição.
- Desfazer o último ponto, confirmar o percurso ou cancelar o desenho.
- Iniciar o percurso sobre um token para movê-lo junto com o trajeto. Ao cancelar, o token retorna à posição inicial.

**Atalhos:** `Ctrl` adiciona um ponto na posição do cursor; `Shift` marca o ponto atual como terreno difícil; `Backspace` remove o último ponto; `Enter` confirma o percurso; `Esc` ou `Delete` cancela.

Depois de confirmado, o percurso permanece no mapa com seus pontos e indicador de distância. Seus elementos podem ser movidos em conjunto.

### Áreas de efeito

A ferramenta de formas permite criar dois tipos de área:

- **Circular:** define o centro e o alcance da área. A extensão desenha o contorno a partir das células abrangidas.
- **Cone:** define a origem e a direção. A largura cresce em etapas alinhadas à grade, com oito direções nas grades quadradas e doze nas hexagonais.

A prévia acompanha o cursor antes da confirmação. O indicador mostra o alcance da área. Depois de criada, a forma e seu indicador podem ser movidos em conjunto.

## Personalização

A aparência da régua de percurso e das áreas é configurada separadamente. As opções incluem cores, opacidade, espessura, estilo de linha, formato e tamanho dos pontos, aparência dos botões e estilo dos indicadores de distância.

As configurações visuais são salvas localmente para cada jogador. Assim, cada pessoa pode ajustar a aparência sem alterar as preferências dos demais participantes.

## Repositório

O projeto é publicado pelo GitHub Pages. As atualizações enviadas à branch `main` são compiladas e publicadas automaticamente.
