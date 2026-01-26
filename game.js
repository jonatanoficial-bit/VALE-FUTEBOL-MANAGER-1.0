// ======================================================
// VALE FUTEBOL MANAGER 2026
// game.js (ENGINE)
// ------------------------------------------------------
// Lógica do jogo (SEM DOM):
// - Estado do jogo (gameState)
// - Geração de tabela / confrontos
// - Simulação de partidas
// - Classificação
// - Transferências
// - Salvamento / carregamento
// - Fim de temporada + subida/rebaixamento
// ======================================================

// ------------------------------------------------------
// ESTADO GLOBAL DO JOGO
// ------------------------------------------------------

let gameState = {
  coachName: "",
  controlledTeamId: null,
  seasonYear: 2025,
  balance: 50,
  currentCompetitionId: "BRA-A", // por enquanto focando na Série A
  fixtures: [],                  // lista de partidas
  standings: {},                 // tabela (map teamId -> stats)
  nextMatchIndex: null
};

// ------------------------------------------------------
// HELPERS DE TIMES E JOGADORES
// ------------------------------------------------------

// times e players vêm de database.js (const teams, const players, const competitions)

function getTeamById(teamId) {
  return (typeof teams !== "undefined")
    ? teams.find(t => t.id === teamId) || null
    : null;
}

function getPlayersByTeam(teamId) {
  return (typeof players !== "undefined")
    ? players.filter(p => p.teamId === teamId)
    : [];
}

// ------------------------------------------------------
// TABELA / CLASSIFICAÇÃO
// ------------------------------------------------------

function initStandings(teamIds) {
  const table = {};
  teamIds.forEach(id => {
    table[id] = {
      teamId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };
  });
  return table;
}

function sortStandings(standingsObj) {
  const rows = Object.values(standingsObj);
  rows.sort((a, b) => {
    // 1) Pontos
    if (b.points !== a.points) return b.points - a.points;

    // 2) Saldo de gols
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;

    // 3) Gols marcados
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    // 4) critério final (opcional): nome do time
    const teamA = getTeamById(a.teamId);
    const teamB = getTeamById(b.teamId);
    const nameA = teamA ? teamA.name : "";
    const nameB = teamB ? teamB.name : "";
    return nameA.localeCompare(nameB);
  });
  return rows;
}

function getLeagueStandings() {
  return sortStandings(gameState.standings);
}

// ------------------------------------------------------
// GERAÇÃO DE TABELA (TURNOS) – Série A
// ------------------------------------------------------

function generateLeagueFixtures(teamIds, competitionId = "BRA-A") {
  const fixtures = [];
  let round = 1;

  // dupla rodada (turno e returno)
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const home = teamIds[i];
      const away = teamIds[j];

      // turno
      fixtures.push({
        competitionId,
        round: round++,
        homeTeamId: home,
        awayTeamId: away,
        homeGoals: null,
        awayGoals: null,
        played: false
      });

      // returno
      fixtures.push({
        competitionId,
        round: round++,
        homeTeamId: away,
        awayTeamId: home,
        homeGoals: null,
        awayGoals: null,
        played: false
      });
    }
  }

  return fixtures;
}

function getCompetitionFixtures(competitionId) {
  return gameState.fixtures.filter(m => m.competitionId === competitionId);
}

// ------------------------------------------------------
// SIMULAÇÃO DE PARTIDAS
// ------------------------------------------------------

function getTeamStrength(teamId) {
  const squad = getPlayersByTeam(teamId);
  if (!squad || !squad.length) {
    return 70; // fallback
  }
  const total = squad.reduce((sum, p) => sum + (p.overall || 70), 0);
  return total / squad.length;
}

function getNextMatchForControlledTeam() {
  const teamId = gameState.controlledTeamId;
  if (!teamId) return null;

  return gameState.fixtures.find(m =>
    !m.played && (m.homeTeamId === teamId || m.awayTeamId === teamId)
  ) || null;
}

function updateStandingsWithMatch(match) {
  const home = gameState.standings[match.homeTeamId];
  const away = gameState.standings[match.awayTeamId];
  if (!home || !away) return;

  home.played++;
  away.played++;

  home.goalsFor     += match.homeGoals;
  home.goalsAgainst += match.awayGoals;

  away.goalsFor     += match.awayGoals;
  away.goalsAgainst += match.homeGoals;

  if (match.homeGoals > match.awayGoals) {
    home.wins++;
    away.losses++;
    home.points += 3;
  } else if (match.homeGoals < match.awayGoals) {
    away.wins++;
    home.losses++;
    away.points += 3;
  } else {
    home.draws++;
    away.draws++;
    home.points += 1;
    away.points += 1;
  }
}

function simulateMatchByIndex(index) {
  if (index == null || index < 0 || index >= gameState.fixtures.length) {
    return null;
  }

  const match = gameState.fixtures[index];
  if (match.played) {
    return match; // já jogado
  }

  const homeStrength = getTeamStrength(match.homeTeamId);
  const awayStrength = getTeamStrength(match.awayTeamId);

  // modelo simples, mas com peso na força do time
  const baseHome = Math.max(0, Math.round((homeStrength - 60) / 10 + Math.random() * 2));
  const baseAway = Math.max(0, Math.round((awayStrength - 60) / 10 + Math.random() * 2));

  let homeGoals = baseHome;
  let awayGoals = baseAway;

  // pequenos ajustes aleatórios
  if (Math.random() < 0.4) homeGoals++;
  if (Math.random() < 0.3) homeGoals--;
  if (Math.random() < 0.4) awayGoals++;
  if (Math.random() < 0.3) awayGoals--;

  if (homeGoals < 0) homeGoals = 0;
  if (awayGoals < 0) awayGoals = 0;

  match.homeGoals = homeGoals;
  match.awayGoals = awayGoals;
  match.played = true;

  updateStandingsWithMatch(match);
  saveGameState();

  return match;
}

function simulateMatchForControlledTeam() {
  const match = getNextMatchForControlledTeam();
  if (!match) return null;

  const index = gameState.fixtures.indexOf(match);
  gameState.nextMatchIndex = index;
  return simulateMatchByIndex(index);
}

// ------------------------------------------------------
// MERCADO DE TRANSFERÊNCIAS
// ------------------------------------------------------

function getTransferList() {
  const myTeamId = gameState.controlledTeamId;
  if (!myTeamId || typeof players === "undefined") return [];
  return players.filter(p => p.teamId !== myTeamId);
}

function buyPlayerById(playerId) {
  if (typeof players === "undefined") {
    return { ok: false, reason: "Lista de jogadores não carregada." };
  }

  const player = players.find(p => p.id === playerId);
  if (!player) {
    return { ok: false, reason: "Jogador não encontrado." };
  }

  const price = player.value || 5;
  if (gameState.balance < price) {
    return { ok: false, reason: "Saldo insuficiente." };
  }

  gameState.balance -= price;
  player.teamId = gameState.controlledTeamId;
  saveGameState();

  return { ok: true, player };
}

// ------------------------------------------------------
// SALVAMENTO / CARREGAMENTO
// ------------------------------------------------------

function saveGameState() {
  try {
    const clone = JSON.parse(JSON.stringify(gameState));
    localStorage.setItem("vfm-save", JSON.stringify(clone));
  } catch (e) {
    console.error("Erro ao salvar gameState:", e);
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem("vfm-save");
    if (!raw) return null;

    const loaded = JSON.parse(raw);
    if (!loaded || !loaded.controlledTeamId) return null;

    // garante campos padrão mesmo em saves antigos
    gameState = Object.assign(
      {
        coachName: "",
        controlledTeamId: null,
        seasonYear: 2025,
        balance: 50,
        currentCompetitionId: "BRA-A",
        fixtures: [],
        standings: {},
        nextMatchIndex: null
      },
      loaded
    );

    return gameState;
  } catch (e) {
    console.error("Erro ao carregar gameState:", e);
    return null;
  }
}

// ------------------------------------------------------
// INÍCIO DE CARREIRA / NOVO JOGO
// ------------------------------------------------------

function resetGameStateForNewCareer(teamId, coachName) {
  if (typeof teams === "undefined") {
    console.error("Times (teams) não carregados.");
    return null;
  }

  // times da Série A
  const divisionATeams = teams.filter(t => t.division === "A").map(t => t.id);
  const teamIds = divisionATeams.length ? divisionATeams : teams.map(t => t.id);

  gameState = {
    coachName: coachName || "Técnico",
    controlledTeamId: teamId,
    seasonYear: 2025,
    balance: 50,
    currentCompetitionId: "BRA-A",
    fixtures: generateLeagueFixtures(teamIds, "BRA-A"),
    standings: initStandings(teamIds),
    nextMatchIndex: null
  };

  saveGameState();
  return gameState;
}

// ------------------------------------------------------
// FIM DE TEMPORADA / SUBIDA / REBAIXAMENTO
// ------------------------------------------------------

// OBS IMPORTANTE AGORA:
// - Hoje só estamos simulando plenamente a Série A (BRA-A).
// - A lógica abaixo já está preparada para promoção/rebaixamento
//   assim que a Série B também passar a ser simulada com standings.

function finalizarTemporada() {
  if (typeof teams === "undefined") {
    console.error("Times não carregados, não é possível finalizar temporada.");
    return;
  }

  const standingsOrdenada = getLeagueStandings();
  if (!standingsOrdenada.length) {
    console.warn("Sem dados de classificação para finalizar temporada.");
    return;
  }

  const serieAIds = teams.filter(t => t.division === "A").map(t => t.id);
  const serieBIds = teams.filter(t => t.division === "B").map(t => t.id);

  const tabelaA = standingsOrdenada.filter(r => serieAIds.includes(r.teamId));
  const tabelaB = standingsOrdenada.filter(r => serieBIds.includes(r.teamId));

  // Campeão (Série A)
  const campeao = tabelaA[0];
  if (campeao) {
    const team = getTeamById(campeao.teamId);
    console.log("CAMPEÃO DA TEMPORADA:", team ? team.name : campeao.teamId);
  }

  // Subida / Rebaixamento só se tivermos A e B com tabela
  if (tabelaA.length >= 4 && tabelaB.length >= 4) {
    const rebaixados = tabelaA.slice(-4).map(t => t.teamId); // 4 últimos da A
    const promovidos = tabelaB.slice(0, 4).map(t => t.teamId); // 4 primeiros da B

    teams.forEach(t => {
      if (rebaixados.includes(t.id)) t.division = "B";
      if (promovidos.includes(t.id)) t.division = "A";
    });
  } else {
    console.warn(
      "Ainda não há standings completos da Série B. " +
      "Subida/rebaixamento será aplicado quando a B estiver sendo simulada."
    );
  }

  iniciarNovaTemporada();
}

function iniciarNovaTemporada() {
  if (typeof teams === "undefined") {
    console.error("Times não carregados, não é possível iniciar nova temporada.");
    return false;
  }

  const serieAIds = teams.filter(t => t.division === "A").map(t => t.id);
  const teamIds = serieAIds.length ? serieAIds : teams.map(t => t.id);

  gameState.seasonYear = (gameState.seasonYear || 2025) + 1;
  gameState.currentCompetitionId = "BRA-A";
  gameState.fixtures = generateLeagueFixtures(teamIds, "BRA-A");
  gameState.standings = initStandings(teamIds);
  gameState.nextMatchIndex = null;

  // pequeno bônus por temporada concluída
  gameState.balance = (gameState.balance || 0) + 10;

  saveGameState();
  console.log("Nova temporada iniciada:", gameState.seasonYear);
  return true;
}
