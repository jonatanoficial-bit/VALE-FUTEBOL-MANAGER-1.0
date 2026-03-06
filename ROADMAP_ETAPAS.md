# Roadmap de atualização — Last Call Dispatch Operator

**Build:** 1.1.0 / Stage 8A

**Build gerada em:** 2026-03-06 09:26:38 BRT

**Conclusão atual estimada:** **54%**

## Etapas planejadas até a versão comercial

1. **Estabilização da base web** — corrigir HTML, script principal, cache e integridade do build.  
   **Status:** concluído nesta build.

2. **Base jogável BR/EUA** — padronizar cidades principais, linhas 190/192/193 e 911, nomes de unidades e UX inicial.  
   **Status:** parcialmente concluído nesta build.

3. **Núcleo médico dedicado** — separar agência Ambulância/SAMU/EMS, criar pool próprio de chamadas e despacho.  
   **Status:** concluído em primeira versão nesta build.

4. **Expansão de conteúdo** — aumentar volume de chamadas, protocolos, consequências, casos especiais, eventos e incidentes encadeados.  
   **Status:** pendente.

5. **Vertical slice premium** — identidade visual forte, áudio consistente, telas de briefing/debriefing, indicadores cinematográficos, onboarding e retenção.  
   **Status:** pendente.

6. **Campanha comercial** — progressão longa, avaliação por cidade, economia, upgrades robustos, metas semanais e dificuldade avançada.  
   **Status:** parcialmente concluído.

7. **Polimento de lançamento** — QA, balancing, acessibilidade, internacionalização, analytics, saves sólidos, testes em Vercel/GitHub.  
   **Status:** pendente.

8. **DLCs e valor agregado** — outros países, centrais especiais, modo crise, eventos catastróficos e pacotes regionais.  
   **Status:** planejado.

## O que foi corrigido nesta build

- Corrigido carregamento do script principal no `index.html`.
- Corrigido erro de sintaxe no `script.js` que impedia validação saudável do build.
- Corrigida estrutura HTML com fechamento incorreto de tags.
- Adicionada agência **Ambulância / SAMU / EMS** na UI.
- Adicionadas chamadas médicas inéditas no `data/calls.js`.
- Adicionadas unidades médicas dedicadas para Brasil e EUA.
- Adicionado tema visual de agência médica.
- Adicionados metadados de build e status de conclusão do projeto.
- Preparado o projeto para deploy estático com `.nojekyll` e `vercel.json`.

## Próxima meta recomendada

Levar o projeto a **65%** focando em:
- mais 30 a 50 ocorrências novas;
- mais cidades BR/EUA com nomenclatura real;
- refino de UX do despacho;
- relatórios pós-incidente mais profundos;
- tutorial introdutório.


## Build 1.1.1 / Stage 8B
- Correção crítica do fluxo de atendimento: botões duplicados de início/fim de turno agora acionam a lógica principal.
- Estado pós-build: 56% concluído.
