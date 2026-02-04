
# Hotfix de Fundo (v1.12.8 BG Fallback)

Este pacote é um *overlay* com **dois arquivos** para corrigir os 404 de `bg_menu.png` / `bg_cinematic.png` no GitHub Pages sem mover nada.

### Como aplicar
1) Suba os dois arquivos deste ZIP na **raiz** do projeto (ou dentro de `/docs` se o Pages publicar a pasta `/docs`):
   - `hotfix-bg-inject.html`
   - `css/styles.hotfix.css`
2) **Abra o seu `index.html`** e, imediatamente antes de `</head>`, cole esta linha:
   `<link rel="stylesheet" href="css/styles.hotfix.css">`
3) Ainda no `index.html`, **imediatamente antes de `</body>`**, cole:
   `<!-- include -->` seguido do conteúdo do arquivo `hotfix-bg-inject.html` (é apenas um `<script>` pequeno).
4) Publique.

Pronto. O jogo passa a tentar automaticamente vários caminhos até achar o fundo certo, quer o Pages publique na raiz, quer em `/docs`.
