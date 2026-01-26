// engine/league.js
// =======================================================
// Sistema de Ligas – Série A e B
// - Gera calendário (38 rodadas)
// - Simula resultados
// - Mantém classificação
// - Suporta salvar/carregar do localStorage
// =======================================================

(function () {
  console.log("%c[League] league.js carregado", "color:#22c55e; font-weight:bold;");

  const SAVE_KEY = "VFM2026_SAVE";

  // Garante que gameState exista
  function ensureGameState() {
    if (!window.gameState) window.gameState = {};
    const gs = window.gameState;

    if (!gs.seasonYear) gs.seasonYear = 2026;
    if (!gs.standings) gs.standings = { A: [], B: [] };
    if (!gs.fixtures) gs.fixtures = { A: [], B: [] };
    if (gs.currentRoundA == null) gs.currentRoundA = 1;
    if (gs.currentRoundB == null) gs.currentRoundB = 1;
    if (!gs.currentTeamId && window.Game && Game.teamId) {
      gs.currentTeamId = Game.teamId;
    }
    return gs;
  }

  function saveGameState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(window.gameState));
    } catch (e) {
      console.warn("[League] Falha ao salvar no localStorage:", e);
    }
  }

  function loadGameState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return ensureGameState();
      window.gameState = JSON.parse(raw) || {};
    } catch (e) {
      console.warn("[League] Falha ao carregar save:", e);
    }
    return ensureGameState();
  }

  // ---------------------------------------------------
  // GERAÇÃO DO CALENDÁRIO (ROUND-ROBIN DUPLO)
  // ---------------------------------------------------
  function generateSingleRoundRobin(teamIds, division) {
    const arr = [...teamIds];
    const n = arr.length;
    if (n % 2 === 1) arr.push(null); // não deve acontecer aqui (20 times), mas por segurança.

    const rounds = [];
    const m = arr.length;

    for (let r = 0; r < m - 1; r++) {
      const matches = [];
      for (let i = 0; i < m / 2; i++) {
        const home = arr[i];
        const away = arr[m - 1 - i];
        if (home && away) {
          matches.push({
            division,
            homeId: home,
            awayId: away,
            goalsHome: null,
            goalsAway: null,
            played: false,
          });
        }
      }

      rounds.push(matches);

      // Rotação estilo "ciclo"
      const fixed = arr[0];
      const rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr.splice(1, rest.length, ...rest);
    }
    return rounds;
  }

  function generateFullSeason(teamIds, division) {
    const firstHalf = generateSingleRoundRobin(teamIds, division);
    const secondHalf = firstHalf.map((rodada) =>
      rodada.map((m) => ({
        division,
        homeId: m.awayId,
        awayId: m.homeId,
        goalsHome: null,
        goalsAway: null,
        played: false,
      }))
    );
    return firstHalf.concat(secondHalf); // 38 rodadas
  }

  function ensureFixtures() {
    ensureGameState();
    const gs = window.gameState;

    ["A", "B"].forEach((div) => {
      if (!gs.fixtures[div] || !gs.fixtures[div].length) {
        const ids = (window.Database?.teams || teams).filter((t) => t.division === div).map((t) => t.id);
        gs.fixtures[div] = generateFullSeason(ids, div);
      }
    });

    saveGameState();
  }

  // ---------------------------------------------------
  // CLASSIFICAÇÃO
  // ---------------------------------------------------
  function ensureStandings(division) {
    ensureGameState();
    const gs = window.gameState;

    if (!Array.isArray(gs.standings[division]) || !gs.standings[division].length) {
      const base = (window.Database?.teams || teams)
        .filter((t) => t.division === division)
        .map((t) => ({
          teamId: t.id,
          name: t.name,
          pts: 0,
          j: 0,
          v: 0,
          e: 0,
          d: 0,
          gp: 0,
          gc: 0,
          sg: 0,
        }));
      gs.standings[division] = base;
    }
  }

  function getStandingRow(division, teamId) {
    ensureStandings(division);
    const gs = window.gameState;
    let row = gs.standings[division].find((r) => r.teamId === teamId);
    if (!row) {
      const team = (window.Database?.teams || teams).find((t) => t.id === teamId);
      row = {
        teamId,
        name: team ? team.name : teamId,
        pts: 0,
        j: 0,
        v: 0,
        e: 0,
        d: 0,
        gp: 0,
        gc: 0,
        sg: 0,
      };
      gs.standings[division].push(row);
    }
    return row;
  }

  function applyResultToStandings(division, homeId, awayId, gH, gA) {
    ensureStandings(division);
    const rowH = getStandingRow(division, homeId);
    const rowA = getStandingRow(division, awayId);

    rowH.j += 1;
    rowA.j += 1;
    rowH.gp += gH;
    rowH.gc += gA;
    rowA.gp += gA;
    rowA.gc += gH;
    rowH.sg = rowH.gp - rowH.gc;
    rowA.sg = rowA.gp - rowA.gc;

    if (gH > gA) {
      rowH.v += 1;
      rowA.d += 1;
      rowH.pts += 3;
    } else if (gH < gA) {
      rowA.v += 1;
      rowH.d += 1;
      rowA.pts += 3;
    } else {
      rowH.e += 1;
      rowA.e += 1;
      rowH.pts += 1;
      rowA.pts += 1;
    }
  }

  function recomputeStandingsFromFixtures(division) {
    ensureStandings(division);
    const gs = window.gameState;

    // Zera
    gs.standings[division].forEach((r) => {
      r.pts = r.j = r.v = r.e = r.d = r.gp = r.gc = r.sg = 0;
    });

    const fixturesDiv = gs.fixtures[division] || [];
    fixturesDiv.forEach((rodada) => {
      rodada.forEach((m) => {
        if (m.played && m.goalsHome != null && m.goalsAway != null) {
          applyResultToStandings(division, m.homeId, m.awayId, m.goalsHome, m.goalsAway);
        }
      });
    });
  }

  function sortStandings(division) {
    ensureStandings(division);
    const gs = window.gameState;
    gs.standings[division].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const sgA = a.sg;
      const sgB = b.sg;
      if (sgB !== sgA) return sgB - sgA;
      if (b.gp !== a.gp) return b.gp - a.gp;
      return a.name.localeCompare(b.name);
    });
    gs.standings[division].forEach((r, idx) => (r.position = idx + 1));
  }

  // ---------------------------------------------------
  // FORÇA DOS TIMES E SIMULAÇÃO
  // ---------------------------------------------------
  function getTeamStrength(teamId) {
    const elenco = (window.Database?.carregarElencoDoTime)
      ? Database.carregarElencoDoTime(teamId)
      : (window.Database?.players || players).filter((p) => p.teamId === teamId);

    if (!elenco.length) return 70;
    const ordenado = [...elenco].sort((a, b) => (b.overall || 70) - (a.overall || 70));
    const titulares = ordenado.slice(0, 11);
    const soma = titulares.reduce((acc, p) => acc + (p.overall || 70), 0);
    return soma / titulares.length;
  }

  function randGoals(base) {
    // base ~1.0–3.0
    const r = Math.random();
    let g = 0;
    if (r < 0.20) g = 0;
    else if (r < 0.50) g = 1;
    else if (r < 0.75) g = 2;
    else if (r < 0.93) g = 3;
    else g = 4;

    if (base > 2.3 && Math.random() < 0.35) g += 1;
    if (base < 1.0 && Math.random() < 0.4 && g > 0) g -= 1;
    if (g < 0) g = 0;
    return g;
  }

  function simulateMatch(division, m) {
    const strH = getTeamStrength(m.homeId);
    const strA = getTeamStrength(m.awayId);
    const diff = (strH - strA) / 10; // +- ~1
    const base = 1.6;

    const baseH = Math.max(0.5, base + diff * 0.7);
    const baseA = Math.max(0.5, base - diff * 0.7);

    const gH = randGoals(baseH);
    const gA = randGoals(baseA);

    m.goalsHome = gH;
    m.goalsAway = gA;
    m.played = true;

    applyResultToStandings(division, m.homeId, m.awayId, gH, gA);
  }

  // ---------------------------------------------------
  // UTILITÁRIOS PÚBLICOS
  // ---------------------------------------------------
  function getCurrentTeam() {
    const gs = ensureGameState();
    const id = gs.currentTeamId || (window.Game && Game.teamId);
    if (!id) return null;
    const lista = window.Database?.teams || teams;
    return lista.find((t) => t.id === id) || null;
  }

  function getCurrentRound(division) {
    ensureGameState();
    const gs = window.gameState;
    return division === "B" ? gs.currentRoundB || 1 : gs.currentRoundA || 1;
  }

  function setCurrentRound(division, round) {
    ensureGameState();
    const gs = window.gameState;
    if (division === "B") gs.currentRoundB = round;
    else gs.currentRoundA = round;
  }

  function getCalendarForDivision(division) {
    ensureFixtures();
    const gs = window.gameState;
    const baseDate = new Date(gs.seasonYear, 3, 6); // 6 de abril (só pra ter datas)
    const msPerRound = 4 * 24 * 60 * 60 * 1000; // a cada 4 dias

    return (gs.fixtures[division] || []).map((rodada, idx) => {
      const d = new Date(baseDate.getTime() + idx * msPerRound);
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const ano = d.getFullYear();
      return {
        round: idx + 1,
        date: `${dia}/${mes}/${ano}`,
        matches: rodada,
      };
    });
  }

  function getStandingsForCurrentDivision(division) {
    ensureFixtures();
    recomputeStandingsFromFixtures(division);
    sortStandings(division);
    // devolve uma cópia pra UI
    return (window.gameState.standings[division] || []).map((r) => ({ ...r }));
  }

  function playNextRoundForUserTeam() {
    ensureFixtures();
    const gs = window.gameState;
    const team = getCurrentTeam();
    if (!team) {
      console.warn("[League] Nenhum time selecionado para o usuário.");
      return null;
    }
    const div = team.division || "A";
    const round = getCurrentRound(div);
    const fixturesDiv = gs.fixtures[div] || [];
    if (round > fixturesDiv.length) {
      console.log("[League] Temporada encerrada nessa divisão.");
      return null;
    }

    const rodada = fixturesDiv[round - 1];

    // Simula TODOS os jogos da rodada (incluindo o do usuário)
    rodada.forEach((m) => {
      if (!m.played) simulateMatch(div, m);
    });

    setCurrentRound(div, round + 1);
    saveGameState();
    return rodada;
  }

  function startNewCareer(teamId) {
    console.log("[League] Iniciando nova carreira para", teamId);
    window.gameState = {
      seasonYear: 2026,
      currentTeamId: teamId,
      standings: { A: [], B: [] },
      fixtures: { A: [], B: [] },
      currentRoundA: 1,
      currentRoundB: 1,
      // armazena calendários completos gerados pelo módulo Calendar
      calendarA: [],
      calendarB: [],
    };
    // gera fixtures e standings para as duas divisões
    ensureFixtures();
    ensureStandings("A");
    ensureStandings("B");
    // gera calendários oficiais (ida e volta) usando o módulo Calendar, se disponível
    try {
      if (window.Calendar && typeof Calendar.gerarCalendarioTemporada === "function") {
        const calA = Calendar.gerarCalendarioTemporada("A");
        const calB = Calendar.gerarCalendarioTemporada("B");
        gameState.calendarA = Array.isArray(calA) ? calA : [];
        gameState.calendarB = Array.isArray(calB) ? calB : [];
      }
    } catch (e) {
      console.warn("[League] Erro ao gerar calendário inicial:", e);
    }
    saveGameState();
  }

  /**
   * Prepara o próximo jogo do usuário de acordo com o calendário da temporada.
   * Se existir calendário gerado, encontra a próxima partida do time do usuário,
   * inicializa o estado de Match com os times corretos e inicia o loop da partida.
   * Caso não haja calendário ou o calendário tenha terminado, cai no fallback
   * padrão (Match.iniciarProximoJogo) para evitar quebra do jogo.
   */
  function prepararProximoJogo() {
    try {
      ensureGameState();
      ensureFixtures();
      // descobre o time atual do usuário
      const teamId =
        (window.gameState && gameState.currentTeamId) ||
        (window.Game && Game.teamId);
      if (!teamId) {
        console.warn("[League] prepararProximoJogo: nenhum time definido.");
        if (window.Match && typeof Match.iniciarProximoJogo === "function") {
          Match.iniciarProximoJogo();
        }
        return;
      }
      // Tenta pegar o próximo jogo pelo módulo Calendar
      if (
        window.Calendar &&
        typeof Calendar.getProximoJogoDoTime === "function"
      ) {
        const prox = Calendar.getProximoJogoDoTime(teamId);
        if (prox && prox.match) {
          // guarda contexto para uso ao finalizar partida
          window.currentMatchContext = {
            division: prox.division,
            roundNumber: prox.roundNumber,
            matchIndex: prox.matchIndex,
          };
          // Prepara estado do Match
          const match = prox.match;
          // cria estado inicial de partida
          if (window.Match) {
            const homeTeam = (window.Database?.teams || teams).find(
              (t) => t.id === match.homeId
            );
            const awayTeam = (window.Database?.teams || teams).find(
              (t) => t.id === match.awayId
            );
            // inicializa estrutura de estado se possível
            Match.state = {
              homeId: match.homeId,
              awayId: match.awayId,
              minute: 0,
              goalsHome: 0,
              goalsAway: 0,
              finished: false,
              halftimeDone: false,
            };
            // prepara UI da partida
            if (typeof Match._setupTelaPartida === "function") {
              Match._setupTelaPartida(homeTeam, awayTeam);
            }
            // zera o log e cronômetro
            const log = document.getElementById("log-partida");
            if (log) log.innerHTML = "";
            const cron = document.getElementById("cronometro");
            if (cron) cron.textContent = "0'";
            // inicia o loop de atualização
            if (typeof Match.comecarLoop === "function") {
              Match.comecarLoop();
            }
            return;
          }
        }
      }
      // fallback: inicia partida aleatória
      if (window.Match && typeof Match.iniciarProximoJogo === "function") {
        Match.iniciarProximoJogo();
      }
    } catch (e) {
      console.warn("[League] Erro em prepararProximoJogo:", e);
      if (window.Match && typeof Match.iniciarProximoJogo === "function") {
        Match.iniciarProximoJogo();
      }
    }
  }

  /**
   * Processa uma rodada após o jogo do usuário terminar. Recebe os times e placar,
   * marca o resultado no calendário/fixtures, simula os demais jogos da rodada,
   * atualiza a classificação, avança a rodada e verifica se a temporada acabou.
   * Retorna o array de partidas da rodada para exibição na UI.
   */
  function processarRodadaComJogoDoUsuario(
    homeId,
    awayId,
    golsHome,
    golsAway
  ) {
    ensureGameState();
    ensureFixtures();
    // descobrir divisão através do homeId
    const teamInfo = (window.Database?.teams || teams).find(
      (t) => t.id === homeId
    );
    const division = teamInfo?.division || "A";
    const gs = window.gameState;
    const fixturesDiv = gs.fixtures[division] || [];

    // encontrar a rodada do jogo do usuário no calendário/fixtures
    let rodadaIndex = -1;
    let rodadaRef = null;
    for (let i = 0; i < fixturesDiv.length; i++) {
      const rodada = fixturesDiv[i];
      const matchToFind = rodada.find(
        (m) =>
          !m.played && m.homeId === homeId && m.awayId === awayId
      );
      if (matchToFind) {
        // atualiza o placar desse jogo
        matchToFind.goalsHome = golsHome;
        matchToFind.goalsAway = golsAway;
        matchToFind.played = true;
        applyResultToStandings(
          division,
          homeId,
          awayId,
          golsHome,
          golsAway
        );
        rodadaIndex = i;
        rodadaRef = rodada;
        break;
      }
    }

    if (rodadaRef) {
      // simula os demais jogos da rodada
      rodadaRef.forEach((m) => {
        if (!m.played) {
          simulateMatch(division, m);
        }
      });
      // avança rodada para a divisão
      setCurrentRound(division, rodadaIndex + 2);
      // registra no calendário oficial os resultados da rodada
      try {
        if (
          window.Calendar &&
          typeof Calendar.marcarResultadoNoCalendario === "function"
        ) {
          const roundNumber = rodadaIndex + 1;
          rodadaRef.forEach((m) => {
            // garante que golsHome/golsAway estejam definidos para usar no calendário
            const gH = m.goalsHome != null ? m.goalsHome : m.golsHome;
            const gA = m.goalsAway != null ? m.goalsAway : m.golsAway;
            Calendar.marcarResultadoNoCalendario(
              division,
              roundNumber,
              m.homeId,
              m.awayId,
              gH,
              gA
            );
          });
        }
      } catch (e) {
        console.warn("[League] Falha ao marcar resultados no calendário:", e);
      }
    }

    // salva e atualiza standings
    saveGameState();
    recomputeStandingsFromFixtures(division);
    sortStandings(division);

    // verifica fim de temporada
    const isEnd = rodadaIndex === fixturesDiv.length - 1;
    if (isEnd) {
      handleEndOfSeason(division);
    }

    return rodadaRef || [];
  }

  /**
   * Realiza procedimentos de fim de temporada:
   * - Calcula o campeão da divisão e exibe mensagem.
   * - Promove 4 melhores da Série B e rebaixa 4 piores da Série A.
   * - Atualiza divisões dos times, gera novo calendário e reinicia rodadas.
   * - Dá recompensa financeira ao time do usuário se for campeão.
   */
  function handleEndOfSeason(finishedDivision) {
    try {
      // atualiza standings das duas divisões
      ["A", "B"].forEach((div) => {
        recomputeStandingsFromFixtures(div);
        sortStandings(div);
      });

      const standingsA = window.gameState.standings["A"] || [];
      const standingsB = window.gameState.standings["B"] || [];
      const championA = standingsA.length ? standingsA[0] : null;
      const championB = standingsB.length ? standingsB[0] : null;

      // mensagem de campeão para divisão concluída
      let msg = "";
      let userIsChampion = false;

      if (finishedDivision === "A" && championA) {
        msg = `Fim do campeonato! O campeão da Série A é ${championA.name}.`;
        if (
          (window.Game && Game.teamId === championA.teamId) ||
          (window.gameState && gameState.currentTeamId === championA.teamId)
        ) {
          userIsChampion = true;
        }
      } else if (finishedDivision === "B" && championB) {
        msg = `Fim do campeonato! O campeão da Série B é ${championB.name}.`;
        if (
          (window.Game && Game.teamId === championB.teamId) ||
          (window.gameState && gameState.currentTeamId === championB.teamId)
        ) {
          userIsChampion = true;
        }
      }

      // promoção e rebaixamento
      const rebaixados = standingsA.slice(-4).map((r) => r.teamId);
      const promovidos = standingsB.slice(0, 4).map((r) => r.teamId);
      rebaixados.forEach((id) => {
        const t = (window.Database?.teams || teams).find((tm) => tm.id === id);
        if (t) t.division = "B";
      });
      promovidos.forEach((id) => {
        const t = (window.Database?.teams || teams).find((tm) => tm.id === id);
        if (t) t.division = "A";
      });

      // gera novo estado para nova temporada
      const newYear =
        (window.gameState && gameState.seasonYear + 1) || 2026;
      gameState.seasonYear = newYear;
      gameState.currentRoundA = 1;
      gameState.currentRoundB = 1;
      // limpar fixtures para forçar geração de novo calendário
      gameState.fixtures = { A: [], B: [] };
      // limpar standings para nova temporada
      gameState.standings = { A: [], B: [] };
      // limpar calendários oficiais para regenerar
      gameState.calendarA = [];
      gameState.calendarB = [];
      // gera novos fixtures e standings
      ensureFixtures();
      ensureStandings("A");
      ensureStandings("B");
      // gera novos calendários usando o módulo Calendar
      try {
        if (window.Calendar && typeof Calendar.gerarCalendarioTemporada === "function") {
          const calA = Calendar.gerarCalendarioTemporada("A");
          const calB = Calendar.gerarCalendarioTemporada("B");
          gameState.calendarA = Array.isArray(calA) ? calA : [];
          gameState.calendarB = Array.isArray(calB) ? calB : [];
        }
      } catch (e) {
        console.warn("[League] Erro ao regenerar calendários no fim da temporada:", e);
      }

      // recompensa financeira se usuário for campeão da divisão concluída
      if (userIsChampion) {
        const premio = 10; // 10 milhões
        if (window.gameState) {
          // se gameState.balance, some; senão usa Game.saldo
          if (gameState.balance != null) {
            gameState.balance += premio;
          }
        }
        if (window.Game) {
          Game.saldo = +(Game.saldo + premio).toFixed(1);
        }
        msg += ` Parabéns! Seu time foi campeão e ganhou um bônus de ${premio} mi.`;
      }

      // avisa usuário com alert
      if (msg) {
        setTimeout(() => {
          alert(msg);
        }, 200);
      }

      saveGameState();
    } catch (e) {
      console.warn("[League] Erro ao processar fim de temporada:", e);
    }
  }

  // Inicializa carregando save (se houver)
  loadGameState();
  ensureFixtures();
  ensureStandings("A");
  ensureStandings("B");

  // Expor API
  window.League = {
    loadGameState,
    saveGameState,
    ensureFixtures,
    getCalendarForDivision,
    getStandingsForCurrentDivision,
    getCurrentRound,
    playNextRoundForUserTeam,
    startNewCareer,
    // Adicionados para integração com Match e fim de temporada
    prepararProximoJogo,
    processarRodadaComJogoDoUsuario,
  };
})();
