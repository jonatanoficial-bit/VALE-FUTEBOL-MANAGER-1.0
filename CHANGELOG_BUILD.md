# Changelog da Build 1.1.1 / Stage 8B

**Build:** 2026-03-06 09:33:52 BRT  
**Conclusão estimada:** 56%

## Correções desta build
- Corrigido o botão secundário **Iniciar Turno** (`btnStartShift2`), que estava sem ação.
- Corrigido o botão secundário **Encerrar Turno** (`btnEndShift2`), que também não estava ligado ao fluxo principal.
- Melhorado o feedback do botão **Atender próxima**, mostrando mensagens no log quando o turno não está ativo, já existe chamada ativa ou a fila ainda está vazia.
- Atualizado versionamento, build e arquivos de status do projeto.

## Impacto
Essa correção resolve o principal bloqueio operacional reportado: entrar no plantão pela área de operação e não conseguir realmente iniciar o turno, o que fazia parecer que o botão de atender chamadas não funcionava.
