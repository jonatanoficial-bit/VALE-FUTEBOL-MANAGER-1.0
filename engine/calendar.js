/* =======================================================
   VALE FUTEBOL MANAGER 2026
   engine/calendar.js – Geração de calendário da temporada
   =======================================================*/

console.log("%c[CALENDAR] calendar.js carregado", "color:#22c55e;");

/**
 * Retorna a lista de times de uma divisão ("A" ou "B")
 */
function getTeamsByDivision(division) {
    if (!window.Database || !Array.isArray(Database.teams)) return [];
    return Database.teams.filter(t => t.division === division);
}

/**
 * Gera um array de datas semanais a partir de uma data inicial
 * @param {number} year
 * @param {number} rounds quantidade de rodadas
 */
function gerarDatasDaTemporada(year, rounds) {
    const datas = [];
    // começa em 1 de abril da temporada
    let d = new Date(year, 3, 1); // mês 3 = abril

    for (let i = 0; i < rounds; i++) {
        datas.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
        d = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias
    }
    return datas;
}

/**
 * Gera o calendário (ida e volta) para uma divisão
 * Estrutura:
 * [
 *   {
 *     round: 1,
 *     division: "A",
 *     date: "2025-04-01",
 *     matches: [
 *       { homeId, awayId, golsHome:null, golsAway:null, played:false, competitionId }
 *     ]
 *   },
 *   ...
 * ]
 */
function gerarCalendarioTemporada(division) {
    const teams = getTeamsByDivision(division).map(t => t.id);
    if (teams.length === 0) {
        console.warn("[CALENDAR] Nenhum time encontrado para divisão", division);
        return [];
    }

    const compId = division === "A" ? "BRA-A" : "BRA-B";
    const year = (window.gameState && gameState.seasonYear) ? gameState.seasonYear : 2025;

    // Se número de times for ímpar, adiciona BYE
    const lista = [...teams];
    const BYE = "__BYE__";
    if (lista.length % 2 !== 0) {
        lista.push(BYE);
    }

    const n = lista.length;
    const rodadasIda = n - 1;
    const jogosPorRodada = n / 2;

    // algoritmo round-robin (método do círculo)
    let arr = lista.slice();
    const rounds = [];

    const datas = gerarDatasDaTemporada(year, rodadasIda * 2);

    // Turno (ida)
    for (let r = 0; r < rodadasIda; r++) {
        const matches = [];

        for (let i = 0; i < jogosPorRodada; i++) {
            const home = arr[i];
            const away = arr[n - 1 - i];

            if (home !== BYE && away !== BYE) {
                matches.push({
                    homeId: home,
                    awayId: away,
                    golsHome: null,
                    golsAway: null,
                    played: false,
                    competitionId: compId
                });
            }
        }

        rounds.push({
            round: r + 1,
            division,
            date: datas[r] || null,
            matches
        });

        // Rotaciona (fixa o primeiro)
        const fixed = arr[0];
        const rest = arr.slice(1);
        rest.unshift(rest.pop());
        arr = [fixed, ...rest];
    }

    // Returno (volta) – inverte mandos de campo
    for (let r = 0; r < rodadasIda; r++) {
        const baseRound = rounds[r];
        const matches = baseRound.matches.map(m => ({
            homeId: m.awayId,
            awayId: m.homeId,
            golsHome: null,
            golsAway: null,
            played: false,
            competitionId: compId
        }));

        rounds.push({
            round: rodadasIda + r + 1,
            division,
            date: datas[rodadasIda + r] || null,
            matches
        });
    }

    console.log(`[CALENDAR] Gerado calendário Série ${division} com ${rounds.length} rodadas`);
    return rounds;
}

/**
 * Retorna o calendário armazenado no gameState para a divisão
 */
function getCalendarioPorDivisao(division) {
    if (!window.gameState) return [];
    if (division === "A") return gameState.calendarA || [];
    if (division === "B") return gameState.calendarB || [];
    return [];
}

/**
 * Marca um resultado no calendário e salva o jogo
 */
function marcarResultadoNoCalendario(division, roundNumber, homeId, awayId, golsHome, golsAway) {
    if (!window.gameState) return;

    const calendario = getCalendarioPorDivisao(division);
    const rodada = calendario.find(r => r.round === roundNumber);
    if (!rodada) return;

    const match = rodada.matches.find(m => m.homeId === homeId && m.awayId === awayId);
    if (!match) return;

    match.golsHome = golsHome;
    match.golsAway = golsAway;
    match.played   = true;

    if (division === "A") gameState.calendarA = calendario;
    if (division === "B") gameState.calendarB = calendario;

    if (typeof salvarJogo === "function") {
        salvarJogo();
    }

    console.log("[CALENDAR] Resultado marcado:", division, "Rodada", roundNumber, homeId, golsHome, "x", golsAway, awayId);
}

/**
 * Retorna o próximo jogo de um time com base no calendário
 * {
 *   division, roundNumber, matchIndex,
 *   match: { homeId, awayId, ... }
 * }
 */
function getProximoJogoDoTime(teamId) {
    if (!window.gameState) return null;

    const team = window.getTeamById ? getTeamById(teamId) : null;
    const division = team?.division || "A";

    const calendario = getCalendarioPorDivisao(division);
    if (!calendario || calendario.length === 0) return null;

    for (const r of calendario) {
        for (let i = 0; i < r.matches.length; i++) {
            const m = r.matches[i];
            if (!m.played && (m.homeId === teamId || m.awayId === teamId)) {
                return {
                    division,
                    roundNumber: r.round,
                    matchIndex: i,
                    match: m
                };
            }
        }
    }
    return null;
}

/* =======================================================
   EXPORE GLOBAL
   =======================================================*/
window.Calendar = {
    gerarCalendarioTemporada,
    getCalendarioPorDivisao,
    marcarResultadoNoCalendario,
    getProximoJogoDoTime
};
