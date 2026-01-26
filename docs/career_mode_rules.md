# Regras e Fluxo de Temporada – Modo Carreira

Este documento define o **modo carreira** de um jogo de gerenciamento de futebol. Ele descreve como o calendário e as competições se organizam em uma temporada, quais títulos e vagas estão em jogo e como o sistema reage às posições finais dos clubes. As regras são baseadas na temporada **2025/2026** e nos formatos vigentes de cada liga e competição, citando critérios oficiais quando disponíveis.

## (I) Visão geral do sistema

### Conceitos principais

- **Temporada:** período anual no qual o clube disputa todas as competições (ligas nacionais, copas nacionais, torneios continentais e mundial/intercontinental). A temporada se inicia com a pré‑temporada e termina após as competições internacionais.
- **Calendário:** cada país possui um calendário diferente, mas normalmente segue o fluxo: pré‑temporada → liga nacional e copa(s) nacional(is) → fases de grupos e eliminatórias de torneios continentais → finais e supercopas → encerramento. O jogo ajusta as datas para que as rodadas não conflitem.
- **Competições nacionais:** ligas em formato de pontos corridos e copas nacionais em formato eliminatório. Estados brasileiros e copas menores podem ser ativados/desativados via parâmetro.
- **Competições continentais:** torneios da CONMEBOL e da UEFA. A fase inicial (liga ou grupos) define quem avança para mata‑mata. Em algumas competições há repescagem entre Libertadores e Sul‑Americana.
- **Classificação/rebaixamento:** as posições finais em cada liga determinam título, vagas continentais, rebaixamento ou acesso. Algumas copas concedem vagas extras às competições continentais.

### Como o jogo decide as competições de um clube

1. **Liga nacional:** todo clube inicia na liga correspondente ao seu país. O número de clubes e as regras de rebaixamento e acesso variam conforme a liga.
2. **Copa(s) nacional(is):** dependendo do país, todos os clubes das divisões superiores (e às vezes das inferiores) disputam a copa principal. No Brasil, o campeonato estadual pode ser habilitado (parâmetro `ENABLE_STATE_CHAMPIONSHIPS_BR`).
3. **Competição continental:** as vagas são definidas pela liga ou pela conquista de copas nacionais. Ao iniciar a temporada, o jogo verifica a posição final da temporada anterior e carrega o clube nas fases correspondentes (preliminar, fase de grupos/liga ou mata‑mata) de Libertadores/Sul‑Americana ou Champions/Europa/Conference.
4. **Intercontinental/Mundial:** campeões continentais participam de um torneio extra. O modo clássico coloca o campeão da Libertadores contra o campeão da Champions; o modo FIFA utiliza fases eliminatórias ou grupos. A participação no Mundial quadrienal depende do parâmetro `CLUB_WORLD_CUP_ENABLED`.

## (II) Regras universais

### Pontuação e desempates

1. **Pontuação de liga:** vitória = 3 pontos, empate = 1 ponto, derrota = 0. Esse esquema é universal para todas as ligas tratadas.
2. **Critérios de desempate:** seguem a ordem: pontos totais, vitórias, saldo de gols, gols marcados e, se necessário, confronto direto e fair play【290257648130397†L355-L381】. Cada liga pode ter variações (ver seção por país).
3. **Mata‑mata:** partidas únicas ou ida/volta. Em partidas únicas, se houver empate aplica‑se prorrogação e pênaltis; em ida/volta, vale a soma dos gols e, se igual, prorrogação e pênaltis (sem critério de gol fora).
4. **Sorteios e seeds:** competições continentais e copas nacionais podem utilizar sorteios para definir confrontos. Quando houver seeding, o jogo organiza os potes conforme o ranking ou a posição na liga anterior.
5. **Registro de títulos:** os títulos conquistados são armazenados no clube e podem influenciar reputação, finanças e desbloqueio de conquistas.

## (III) Fluxo detalhado por país

### Brasil

#### Competições do país

- **Série A:** 20 clubes. Pontos corridos com 38 rodadas. Campeão é o líder ao final. Os **seis primeiros** e o campeão da Copa do Brasil classificam‑se para a **Libertadores**; os clubes do 7º ao 12º lugar (não classificados) vão para a **Sul‑Americana**【111034337732001†L190-L193】. Os **quatro últimos** são rebaixados para a Série B【111034337732001†L190-L193】.
- **Série B:** 20 clubes. Pontos corridos com 38 rodadas. Os **quatro primeiros** sobem para a Série A; os **quatro últimos** caem para a Série C【318910026720026†L175-L181】.
- **Série C:** 20 clubes (placeholder). É opcional e simplificada: os **quatro primeiros** sobem para a Série B; não há rebaixamento porque a Série D não está modelada.
- **Copa do Brasil:** torneio eliminatório com 92 clubes. **Primeira e segunda fases** são disputadas em jogo único; empate favorece o time de melhor ranking na primeira fase【714600581901622†L418-L421】 e leva a pênaltis na segunda【714600581901622†L470-L472】. A partir da terceira fase, confrontos de ida e volta. O campeão se classifica para a Libertadores do ano seguinte【111034337732001†L190-L193】.
- **Estaduais (opcional):** torneios regionais disputados no início do ano. Ativados via parâmetro `ENABLE_STATE_CHAMPIONSHIPS_BR`.

#### Calendário recomendado

1. **Janeiro–Abril:** Estaduais (caso habilitados). Não interferem na liga.
2. **Abril–Dezembro:** Série A, Série B e Série C em rodadas semanais. Copa do Brasil intercalada em datas de meio de semana.
3. **Fevereiro–Julho:** fases preliminares e fase de grupos da Libertadores/Sul‑Americana. Confrontos eliminatórios a partir de agosto.
4. **Dezembro:** finais nacionais e continentais, seguidas pelo Intercontinental/Mundial.

#### Exemplo prático

- **2º lugar na Série A:** vice‑campeão; vaga direta na fase de grupos da Libertadores.
- **6º lugar na Série A:** vaga direta na fase de grupos da Libertadores se a Copa do Brasil for vencida por equipe já classificada; caso contrário, disputa fase preliminar. Caso excedam vagas, cai para Sul‑Americana.
- **10º lugar:** classifica‑se para a Sul‑Americana.
- **17º lugar:** rebaixado para a Série B.

### Argentina

#### Competições do país

- **Liga Profissional (LPF):** em 2025, 30 clubes divididos em dois torneios anuais (Torneo 1 e Torneo 2). Cada torneio tem duas zonas de 15 clubes; jogam 14 rodadas mais interzonais. Os melhores de cada zona disputam fases finais de mata‑mata até a final【18536325644187†L147-L173】. A tabela anual (soma de ambos) decide vagas e rebaixamento: dois clubes caem – um pelo índice de pontos e outro pela tabela geral – e dois sobem da Primera Nacional【18536325644187†L147-L173】.
- **Copa Argentina:** mata‑mata, participação de clubes de várias divisões. O campeão garante vaga na Libertadores se ainda não estiver classificado.

#### Calendário recomendado

1. **Torneo 1:** janeiro a maio – fase de grupos e mata‑mata.
2. **Torneo 2:** julho a novembro – formato idêntico, com mandos invertidos【18536325644187†L147-L173】.
3. **Copa Argentina:** datas intercaladas.
4. **Dezembro:** finais continentais e intercontinental.

#### Regras de liga

- Pontos corridos dentro de cada zona. As primeiras posições de cada zona avançam para mata‑mata. A soma dos pontos dos dois torneios gera a tabela anual. Rebaixamento por média de pontos (últimos na média) e por tabela geral (penúltimo). Vagas continentais são distribuídas pela tabela anual e pela Copa Argentina.

#### Exemplo prático

- **2º na tabela anual:** vaga na Libertadores (fase de grupos ou preliminar).  
- **10º na tabela anual:** vaga na Sul‑Americana.  
- **29º:** rebaixado se estiver entre os piores na média de pontos.  
- **Campeão da Copa Argentina:** vaga na Libertadores, podendo deslocar a vaga de um clube da tabela.

### Espanha

#### Competições do país

- **LaLiga:** 20 clubes, 38 rodadas. Os **três últimos** são rebaixados para a Segunda División; sobem o campeão, vice e vencedor dos play‑offs da Segunda División【290257648130397†L332-L336】. O **top‑4** se classifica para a Champions League; o 5º e o campeão da Copa del Rey vão para a Europa League, enquanto o 6º (ou 7º se o vencedor da Copa já estiver qualificado) vai para a Conference League【290257648130397†L393-L404】.
- **Copa del Rey:** mata‑mata em jogo único até as semifinais; final em campo neutro. Vence quem ganhar; vaga na Europa League para o campeão.
- **Supercopa de España:** minitorneio entre campeão e vice da LaLiga e finalistas da Copa del Rey. Não dá vaga continental.

#### Calendário

1. **Agosto–Maio:** LaLiga (38 jornadas).  
2. **Outubro–Abril:** Copa del Rey (entrada gradual; times menores iniciam antes).  
3. **Janeiro:** Supercopa.  
4. **Agosto–Junho:** fases da Champions/Europa/Conference.

#### Exemplo prático

- **2º lugar na LaLiga:** vaga direta na fase de liga da Champions League.  
- **5º lugar:** vaga direta na Europa League (ou Conference, dependendo de quem ganha a Copa).  
- **18º, 19º, 20º:** rebaixados para Segunda【290257648130397†L332-L336】.

### Inglaterra

#### Competições do país

- **Premier League:** 20 clubes, 38 rodadas. Os **três últimos** são rebaixados para a Championship; sobem o campeão, vice e vencedor dos play‑offs da Championship. Os **quatro primeiros** vão à Champions League; o 5º (ou 6º) vai à Europa League; o vencedor da FA Cup garante Europa League e o da EFL Cup garante Conference League【904433533419506†L127-L144】. Se os vencedores de FA Cup ou EFL Cup já estiverem qualificados por posição, a vaga passa para o time seguinte na liga【904433533419506†L165-L174】. Vencedor da Champions ou Europa League garante vaga extra na Champions【904433533419506†L176-L184】.
- **FA Cup:** mata‑mata com times de todas as divisões. Replays e pênaltis nas primeiras fases (pode ser simplificado para jogo único). Campeão recebe vaga na Europa League.  
- **EFL Cup (Carabao Cup):** mata‑mata entre times das ligas profissionais; campeão ganha vaga na Conference League.

#### Calendário

1. **Agosto–Maio:** Premier League.  
2. **Setembro–Maio:** FA Cup (finais em maio).  
3. **Agosto–Fevereiro:** EFL Cup.  
4. **Agosto–Maio/Junho:** Champions/Europa/Conference.

#### Exemplo prático

- **2º lugar na Premier League:** vaga direta na Champions League.  
- **5º lugar:** vaga na Europa League.  
- **17º lugar:** permanece; **18º–20º** caem.  
- **Campeão da FA Cup (fora do top 5):** vaga na Europa League【904433533419506†L127-L144】.

### Itália

#### Competições do país

- **Serie A:** 20 clubes, 38 rodadas. Os **três últimos** são rebaixados para a Serie B (às vezes há play‑off se a diferença de pontos for pequena). Os **quatro primeiros** vão para a Champions League; o 5º e o vencedor da Coppa Italia vão para a Europa League; o 6º (ou 7º) vai para a Conference League.  
- **Serie B:** 20 clubes. Os dois primeiros sobem diretamente; do 3º ao 8º disputam um play‑off por uma terceira vaga. Os **quatro últimos** são rebaixados para a Serie C.  
- **Coppa Italia:** mata‑mata (fase preliminar, oitavas, quartas, semi de ida/volta e final). Campeão ganha vaga na Europa League.  
- **Supercoppa:** disputa entre o campeão da Serie A e o campeão da Coppa Italia (pode envolver 4 clubes no formato atual). Não dá vaga continental.

#### Calendário

1. **Agosto–Maio:** Serie A.  
2. **Agosto–Maio:** Coppa Italia (clubes entram em fases diferentes).  
3. **Janeiro:** Supercoppa.  
4. **Agosto–Junho:** Champions/Europa/Conference.

#### Exemplo prático

- **2º lugar na Serie A:** vaga na Champions League.  
- **5º lugar:** vaga na Europa League.  
- **18º–20º:** rebaixados.  
- **Campeão da Coppa Italia:** vaga na Europa League (pode mover a vaga do 5º para a Conference, dependendo do regulamento).

### Alemanha

#### Competições do país

- **Bundesliga:** 18 clubes, 34 rodadas. Os **dois últimos** são rebaixados; o **16º** disputa play‑off contra o 3º da 2. Bundesliga. Os **quatro primeiros** vão à Champions League; o 5º e o vencedor da DFB‑Pokal vão à Europa League; o 6º (ou 7º) à Conference League.  
- **2. Bundesliga:** 18 clubes. Os dois primeiros sobem; o 3º disputa play‑off. Os dois últimos caem para a 3. Liga.  
- **DFB‑Pokal:** mata‑mata, jogo único. Campeão garante Europa League.  
- **Supercopa Alemã:** jogo único entre campeões da Bundesliga e da DFB‑Pokal.

#### Calendário

1. **Agosto–Maio:** Bundesliga.  
2. **Agosto–Maio:** DFB‑Pokal.  
3. **Agosto–Maio/Junho:** competições UEFA.  
4. **Agosto:** Supercopa.

### França

#### Competições do país

- **Ligue 1:** 18 clubes a partir de 2023/24. 34 rodadas. Os **dois últimos** são rebaixados; o 16º disputa play‑off com um clube da Ligue 2. Os **quatro primeiros** (ou três, dependendo do coeficiente) vão à Champions League; o 5º e o vencedor da Coupe de France vão à Europa League; o 6º vai à Conference League.  
- **Ligue 2:** 18 clubes, com play‑offs para acesso.  
- **Coupe de France:** mata‑mata com times de todas as divisões; campeão garante vaga na Europa League.  
- **Trophée des Champions:** supercopa entre campeão da Ligue 1 e campeão da Coupe de France.

#### Calendário

1. **Agosto–Maio:** Ligue 1.  
2. **Agosto–Abril:** Coupe de France.  
3. **Agosto–Junho:** Champions/Europa/Conference.  
4. **Julho/Agosto:** Trophée des Champions.

### Portugal

#### Competições do país

- **Liga Portugal (Primeira Liga):** 18 clubes, 34 rodadas. Os **dois últimos** são rebaixados; o 16º disputa play‑off com o 3º da Segunda Liga. Os **primeiros dois** ou três clubes vão à Champions League (campeão e vice em fase de liga; 3º na preliminar); o 4º e o vencedor da Taça de Portugal vão à Europa League; o 5º vai à Conference League.  
- **Segunda Liga:** 18 clubes; dois sobem diretamente e um via play‑off.  
- **Taça de Portugal:** mata‑mata, vencedor garante Europa League.  
- **Taça da Liga:** torneio em fase de grupos e mata‑mata, sem vaga continental.

#### Calendário

1. **Agosto–Maio:** Liga Portugal.  
2. **Outubro–Maio:** Taça de Portugal.  
3. **Julho–Dezembro:** Taça da Liga.  
4. **Agosto–Junho:** competições UEFA.

#### Exemplo prático

- **1º lugar:** campeão, fase de liga da Champions.  
- **3º lugar:** fase preliminar da Champions.  
- **4º lugar:** vaga na Europa League.  
- **17º–18º:** rebaixados.

## (IV) Regras continentais

### CONMEBOL

#### Libertadores

- **Vagas:** concedidas via ligas e copas nacionais (ver seções por país). Para o Brasil, há 6 vagas pela liga e 1 pela Copa do Brasil【111034337732001†L190-L193】. Argentina recebe vagas pela tabela anual e pela Copa Argentina.  
- **Pré‑Libertadores:** equipes classificadas via posições inferiores (ex.: 6º lugar no Brasil) jogam duas ou três fases de mata‑mata em ida/volta. Os vencedores avançam para a fase de grupos.  
- **Fase de grupos:** oito grupos de 4 clubes (a partir de 2026 pode virar fase de liga com 8 jogos). Times jogam ida/volta entre si. Os **dois primeiros** de cada grupo avançam às oitavas; os **terceiros** caem para o play‑off da Sul‑Americana.  
- **Mata‑mata:** oitavas, quartas e semifinais em ida/volta; final em jogo único em campo neutro. O campeão vai ao Mundial de Clubes (modo FIFA) e disputa a Intercontinental (modo clássico ou atual).

#### Sul‑Americana

- **Vagas:** distribuídas conforme liga (ex.: do 7º ao 12º da Série A brasileira【111034337732001†L190-L193】).  
- **Fase de grupos:** oito grupos de 4 clubes. Os **líderes** avançam às oitavas. Os **segundos** enfrentam os terceiros da Libertadores em um play‑off de ida/volta.  
- **Mata‑mata:** oitavas, quartas e semis em ida/volta; final em campo neutro. Não concede vaga direta ao Mundial, mas o campeão pode disputar a Recopa.

### UEFA (2025/26)

#### Champions League (UCL)

- **Formato da fase de liga:** 36 clubes em uma liga única (modelo suíço). Cada time joga **oito partidas** contra oponentes de potes diferentes – quatro em casa e quatro fora【631636876397022†L165-L172】.  
- **Classificação:** os **8 primeiros** avançam direto às oitavas de final; os clubes de **9º a 24º** disputam um play‑off (ida/volta) para completar as oitavas【631636876397022†L165-L172】. Os **25º a 36º** são eliminados de competições europeias【631636876397022†L165-L172】.  
- **Mata‑mata:** oitavas, quartas e semifinais em ida/volta; final em jogo único. Tiebreakers seguem gols agregados, prorrogação e pênaltis; não há gol fora de casa.  
- **Critérios de desempate na fase de liga:** pontos, saldo de gols, gols marcados, gols fora, vitórias, vitórias fora, ranking dos adversários, etc【631636876397022†L173-L197】.

#### Europa League (UEL) e Conference League (UECL)

- **Formato idêntico:** 36 clubes em fase de liga de 8 jogos, com top‑8 avançando direto, 9º‑24º em play‑offs, 25º‑36º eliminados【317397975080133†L156-L164】. Critérios de desempate seguem a Champions【317397975080133†L170-L177】.  
- **Mata‑mata:** mesma estrutura (oitavas em diante). O campeão da Europa League ganha vaga na Champions seguinte; o campeão da Conference ganha vaga na Europa League.

## (V) Intercontinental e Mundial

### Modo A – Clássico

Após o término das competições continentais, o **campeão da Libertadores** enfrenta o **campeão da Champions League** em um jogo único, em campo neutro. O vencedor se torna campeão intercontinental. A partida ocorre geralmente em dezembro, após as finais continentais. Esse modo pode ser habilitado quando `INTERCONTINENTAL_MODE` = `CLASSIC` e o Mundial estiver desativado.

### Modo B – FIFA por fases

O Mundial de Clubes da FIFA 2025/26 é um torneio anual com 8 clubes (modelo simplificado) ou um torneio quadrienal com 32 clubes (modelo completo). Para o jogo:

1. **Torneio anual (8 clubes):** campeões continentais entram direto nas quartas de final. Campeões de confederações menores (AFC, CAF, CONCACAF, OFC) disputam uma fase preliminar. Semifinais e final são jogo único. O campeão da Libertadores e o campeão da Champions entram nas semifinais.  
2. **Torneio quadrienal (32 clubes):** ocorre a cada quatro anos. Possui fase de grupos (8 grupos de 4) e mata‑mata até a final. Participam campeões e vice‑campeões continentais, mais convidados.  
3. **Habilitação no jogo:** defina `CLUB_WORLD_CUP_ENABLED` para ativar. O modo (`CLASSIC` ou `FIFA_PHASES`) é escolhido em `INTERCONTINENTAL_MODE`.

## (VI) Parâmetros configuráveis para o desenvolvedor

O jogo permite ajustar variáveis sem quebrar as regras principais. Esses parâmetros ficam no arquivo `rules.json` e podem ser modificados conforme o design desejado:

| Parâmetro | Descrição | Valor padrão |
| --- | --- | --- |
| `ENABLE_STATE_CHAMPIONSHIPS_BR` | Ativa ou desativa a disputa de campeonatos estaduais no Brasil | `false` |
| `BRAZIL_LIBERTADORES_SLOTS_BY_LEAGUE` | Número de vagas diretas para a Libertadores via Série A | `6` |
| `BRAZIL_CUP_EXTRA_SLOTS` | Número de vagas extras para a Libertadores via Copa do Brasil | `1` |
| `UEFA_EXTRA_CHAMPIONS_LEAGUE_SLOT_BY_COEFFICIENT` | Se verdadeiro, concede vaga extra na Champions a ligas com melhor coeficiente (pode variar por temporada) | `false` |
| `INTERCONTINENTAL_MODE` | Define se o campeão continental joga um Intercontinental clássico (`CLASSIC`) ou participa do Mundial FIFA (`FIFA_PHASES`) | `CLASSIC` |
| `CLUB_WORLD_CUP_ENABLED` | Ativa o Mundial de Clubes quadrienal ou anual | `true` |

Outros parâmetros, como prêmios em dinheiro, valores de orçamento, custos semanais e regras detalhadas de promoção/rebaixamento estão presentes no arquivo `rules.json`.

---

Estas regras fornecem um fluxo implementável de temporada. O desenvolvedor pode adaptar detalhes como datas exatas e modos de play‑off, mantendo a lógica de classificação, rebaixamento e distribuição de vagas conforme descrito.