# Deploy hotfix

Build: v1.42.0_phase6_full_realism_cachefix
Date UTC: 2026-03-06 21:16:25 UTC

## O que foi corrigido
- Service Worker com nome de cache novo
- Limpeza de caches antigos
- Cache-busting atualizado em index, styles, app e sw

## Como publicar
1. Apague os arquivos antigos do deploy.
2. Envie o conteudo completo desta pasta.
3. Depois de publicar, abra o site e force recarga com Ctrl+F5.
4. Se ainda aparecer build antiga, abra DevTools > Application > Service Workers e clique em Unregister, depois recarregue.
