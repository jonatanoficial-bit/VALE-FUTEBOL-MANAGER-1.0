// ui/ui.js
// ======================================================
// UI principal do Vale Futebol Manager 2026
// Cuida de: Tabela, Elenco, Táticas, Mercado, Calendário
// e navegação entre telas
// ======================================================

(function () {
  console.log(
    "%c[UI] ui.js carregado",
    "color:#0EA5E9; font-weight:bold;"
  );

  // ----------------------------------------------------
  // HELPERS GERAIS
  // ----------------------------------------------------

  function mostrarTela(id) {
    document.querySelectorAll(".tela").forEach((t) =>
      t.classList.remove("ativa")
    );
    const alvo = document.getElementById(id);
    if (alvo) {
      alvo.classList.add("ativa");
    } else {
      console.warn("[UI] mostrarTela: elemento não encontrado:", id);
    }
  }

  // expõe para o HTML (onclick="mostrarTela('tela-capa')")
  window.mostrarTela = mostrarTela;

  function getCurrentTeamId() {
    // Game.teamId (se a engine usar isso)
    if (window.Game && Game.teamId) return Game.teamId;

    // gameState.currentTeamId (outro formato comum)
    if (window.gameState && gameState.currentTeamId)
      return gameState.currentTeamId;

    return null;
  }

  function getAllTeams() {
    if (window.Database && Array.isArray(Database.teams)) {
      return Database.teams;
    }
    if (Array.isArray(window.teams)) {
      return teams;
    }
    return [];
  }

  function getTeamByIdSafe(teamId) {
    if (!teamId) return null;

    // 1) função da engine/database.js
    try {
      if (typeof getTeamById === "function") {
        const t = getTeamById(teamId);
        if (t) return t;
      }
    } catch (e) {
      console.warn("[UI] erro em getTeamById():", e);
    }

    // 2) Database.teams
    const all = getAllTeams();
    const t2 = all.find((t) => t.id === teamId);
    if (t2) return t2;

    return null;
  }

  function getDivisionForTeam(team) {
    if (!team) return "A";
    return team.division || team.serie || "A";
  }

  // ----------------------------------------------------
  // CLASSIFICAÇÃO / TABELA
  // ----------------------------------------------------

  function getStandingsForDivision(div) {
    // 1) se a engine League tiver standings prontos
    if (
      window.League &&
      typeof League.getStandingsForCurrentDivision === "function"
    ) {
      try {
        const lista = League.getStandingsForCurrentDivision(div);
        if (Array.isArray(lista) && lista.length) return lista;
      } catch (e) {
        console.warn(
          "[UI] erro League.getStandingsForCurrentDivision:",
          e
        );
      }
    }

    // 2) gameState.standings[div]
    if (
      window.gameState &&
      gameState.standings &&
      Array.isArray(gameState.standings[div])
    ) {
      return gameState.standings[div];
    }

    // 3) fallback – tabela zerada com todos os times da divisão
    const listaTimes = getAllTeams().filter(
      (t) => (t.division || t.serie || "A") === div
    );

    return listaTimes.map((t, idx) => ({
      position: idx + 1,
      teamId: t.id,
      name: t.name,
      pts: 0,
      j: 0,
      v: 0,
      e: 0,
      d: 0,
      gp: 0,
      gc: 0,
    }));
  }

  function renderTabelaBrasileirao() {
    const tabelaEl = document.getElementById("tabela-classificacao");
    if (!tabelaEl) {
      console.warn("[UI] #tabela-classificacao não encontrado.");
      return;
    }

    const teamId = getCurrentTeamId();
    const team = getTeamByIdSafe(teamId);
    const div = getDivisionForTeam(team); // "A" ou "B"

    console.log(
      "[UI] renderTabelaBrasileirao() – divisão:",
      div,
      "time atual:",
      teamId
    );

    const standings = getStandingsForDivision(div);

    tabelaEl.innerHTML = "";

    if (!standings || !standings.length) {
      tabelaEl.innerHTML =
        "<tr><td>Nenhuma informação de classificação encontrada.</td></tr>";
      return;
    }

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
      <th>#</th>
      <th>Time (${div === "B" ? "Série B" : "Série A"})</th>
      <th>Pts</th>
      <th>J</th>
      <th>V</th>
      <th>E</th>
      <th>D</th>
      <th>G+</th>
      <th>G-</th>
    `;
    tabelaEl.appendChild(headerRow);

    standings.forEach((row, index) => {
      const t =
        getTeamByIdSafe(row.teamId) ||
        getTeamByIdSafe(row.id) ||
        { id: null, name: row.name || row.teamName || "Time" };

      const nome = t.name;
      const logoSrc = t.id ? `assets/logos/${t.id}.png` : "";
      const pts = row.pts ?? row.points ?? 0;
      const j = row.j ?? row.games ?? 0;
      const v = row.v ?? row.wins ?? 0;
      const e = row.e ?? row.draws ?? 0;
      const d = row.d ?? row.losses ?? 0;
      const gp = row.gp ?? row.goalsFor ?? 0;
      const gc = row.gc ?? row.goalsAgainst ?? 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="time-coluna">
          ${
            logoSrc
              ? `<img class="logo-tabela" src="${logoSrc}" alt="${nome}" onerror="this.style.display='none'">`
              : ""
          }
          <span>${nome}</span>
        </td>
        <td>${pts}</td>
        <td>${j}</td>
        <td>${v}</td>
        <td>${e}</td>
        <td>${d}</td>
        <td>${gp}</td>
        <td>${gc}</td>
      `;
      tabelaEl.appendChild(tr);
    });
  }

  // ----------------------------------------------------
  // ELENCO / JOGADORES
  // ----------------------------------------------------

  function getSquadForCurrentTeam() {
    const teamId = getCurrentTeamId();
    if (!teamId) {
      console.warn("[UI] getSquadForCurrentTeam: sem teamId.");
      return [];
    }

    // 1) função oficial da engine/database.js
    if (
      window.Database &&
      typeof Database.carregarElencoDoTime === "function"
    ) {
      const elenco = Database.carregarElencoDoTime(teamId);
      if (Array.isArray(elenco) && elenco.length) {
        return elenco;
      }
    }

    // 2) filtrar Database.players
    if (window.Database && Array.isArray(Database.players)) {
      const lista = Database.players.filter((p) => p.teamId === teamId);
      if (lista.length) return lista;
    }

    // 3) gameState.squads
    if (
      window.gameState &&
      gameState.squads &&
      Array.isArray(gameState.squads[teamId])
    ) {
      return gameState.squads[teamId];
    }

    // 4) gameState.currentSquad
    if (window.gameState && Array.isArray(gameState.currentSquad)) {
      return gameState.currentSquad;
    }

    console.warn("[UI] Nenhum elenco encontrado para o time", teamId);
    return [];
  }

  function getFacePathForPlayer(p) {
    const faceId = p.faceId || p.id || p.code || "";
    if (!faceId) return "assets/geral/sem_foto.png";

    // pasta "faces" (plural) – conforme comentário do database.js
    return `assets/faces/${faceId}.png`;
  }

  function renderElenco() {
    const container = document.getElementById("elenco-lista");
    if (!container) {
      console.warn("[UI] #elenco-lista não encontrado.");
      return;
    }

    const elenco = getSquadForCurrentTeam();
    console.log("[UI] renderElenco() – jogadores encontrados:", elenco.length);

    container.innerHTML = "";

    if (!elenco.length) {
      container.innerHTML =
        "<p style='padding:10px;'>Nenhum jogador encontrado para este time.</p>";
      return;
    }

    elenco.forEach((p) => {
      const nome = p.name || p.nome || "Jogador";
      const pos = p.position || p.posicao || p.pos || p.role || "POS";
      const ovr = p.ovr ?? p.rating ?? p.overall ?? 70;
      const imgSrc = getFacePathForPlayer(p);

      const card = document.createElement("div");
      card.className = "card-jogador";
      card.innerHTML = `
        <img src="${imgSrc}" alt="${nome}" onerror="this.style.display='none'">
        <h3>${nome}</h3>
        <p>${pos}</p>
        <p class="ovr">${ovr}</p>
      `;
      container.appendChild(card);
    });
  }

  // ----------------------------------------------------
  // TÁTICAS / CAMPO + RESERVAS
  // ----------------------------------------------------

  function renderTaticas() {
    const campo = document.getElementById("campo-tatico");
    const banco = document.getElementById("banco-reservas");
    if (!campo || !banco) {
      console.warn("[UI] #campo-tatico ou #banco-reservas não encontrados.");
      return;
    }

    const elenco = getSquadForCurrentTeam();
    console.log("[UI] renderTaticas() – jogadores:", elenco.length);

    campo.innerHTML = "";
    banco.innerHTML = "";

    if (!elenco.length) {
      campo.innerHTML =
        "<p style='padding:10px;color:#fff;'>Nenhum jogador carregado para este time.</p>";
      return;
    }

    const titulares = elenco.slice(0, 11);
    const reservas = elenco.slice(11);

    // posições aproximadas em % (x,y) no campo
    const slotsPos = [
      { x: 50, y: 88 }, // GOL
      { x: 20, y: 70 },
      { x: 40, y: 70 },
      { x: 60, y: 70 },
      { x: 80, y: 70 },
      { x: 25, y: 52 },
      { x: 50, y: 52 },
      { x: 75, y: 52 },
      { x: 25, y: 32 },
      { x: 50, y: 30 },
      { x: 75, y: 32 },
    ];

    titulares.forEach((p, idx) => {
      const posCampo = slotsPos[idx] || { x: 50, y: 50 };
      const nome = p.name || p.nome || "Jogador";
      const pos = p.position || p.posicao || p.pos || p.role || "POS";
      const ovr = p.ovr ?? p.rating ?? p.overall ?? 70;
      const img = getFacePathForPlayer(p);

      const slot = document.createElement("div");
      slot.className = "slot-jogador";
      slot.style.left = posCampo.x + "%";
      slot.style.top = posCampo.y + "%";

      slot.innerHTML = `
        <div class="slot-card">
          <img src="${img}" alt="${nome}" onerror="this.style.display='none'">
          <div>${nome}</div>
          <div>${pos} · OVR ${ovr}</div>
        </div>
      `;
      campo.appendChild(slot);
    });

    reservas.forEach((p) => {
      const nome = p.name || p.nome || "Jogador";
      const pos = p.position || p.posicao || p.pos || p.role || "POS";
      const ovr = p.ovr ?? p.rating ?? p.overall ?? 70;
      const img = getFacePathForPlayer(p);

      const linha = document.createElement("div");
      linha.className = "reserva-card";
      linha.innerHTML = `
        <img src="${img}" alt="${nome}" onerror="this.style.display='none'">
        <div>${nome}</div>
        <div>${pos} · OVR ${ovr}</div>
      `;
      banco.appendChild(linha);
    });
  }

  // ----------------------------------------------------
  // CALENDÁRIO (UI simples, usando calendar-ui.js se existir)
  // ----------------------------------------------------

  function abrirCalendarioTela() {
    // Se existir um módulo CalendarUI, deixar ele montar a lista
    if (
      window.CalendarUI &&
      typeof CalendarUI.renderCalendario === "function"
    ) {
      try {
        CalendarUI.renderCalendario();
      } catch (e) {
        console.warn("[UI] erro ao chamar CalendarUI.renderCalendario():", e);
      }
    }
    mostrarTela("tela-calendario");
  }

  // ----------------------------------------------------
  // MERCADO (apenas navegação; render fica em market-ui.js)
  // ----------------------------------------------------

  function abrirMercadoTela() {
    // Se existir um módulo MarketUI, podemos chamar um refresh se quiser
    if (
      window.MarketUI &&
      typeof MarketUI.renderMercado === "function"
    ) {
      try {
        MarketUI.renderMercado();
      } catch (e) {
        console.warn("[UI] erro ao chamar MarketUI.renderMercado():", e);
      }
    }
    mostrarTela("tela-mercado");
  }

  // ----------------------------------------------------
  // OBJETO UI GLOBAL
  // ----------------------------------------------------

  const UI = {
    init() {
      console.log(
        "%c[UI] init() chamado (ui.js).",
        "color:#C7A029; font-weight:bold;"
      );
      // main.js já cuida da tela inicial e do botão INICIAR.
    },

    // navegação básica
    voltarParaCapa() {
      mostrarTela("tela-capa");
    },

    voltarLobby() {
      mostrarTela("tela-lobby");
    },

    // PARTIDA
    abrirProximoJogo() {
      if (window.Match && typeof Match.iniciarProximoJogo === "function") {
        try {
          Match.iniciarProximoJogo();
        } catch (e) {
          console.warn("[UI] erro em Match.iniciarProximoJogo():", e);
        }
      }
      mostrarTela("tela-partida");
    },

    // TABELA
    abrirClassificacao() {
      console.log("[UI] abrirClassificacao() disparado.");
      renderTabelaBrasileirao();
      mostrarTela("tela-classificacao");
    },

    // ELENCO
    abrirElenco() {
      console.log("[UI] abrirElenco() disparado.");
      renderElenco();
      mostrarTela("tela-elenco");
    },

    // TÁTICAS
    abrirTaticas() {
      console.log("[UI] abrirTaticas() disparado.");
      renderTaticas();
      mostrarTela("tela-taticas");
    },

    // MERCADO
    abrirMercado() {
      console.log("[UI] abrirMercado() disparado.");
      abrirMercadoTela();
    },

    // CALENDÁRIO
    abrirCalendario() {
      console.log("[UI] abrirCalendario() disparado.");
      abrirCalendarioTela();
    },
  };

  // NÃO sobrescreve se já existir algo, apenas complementa
  window.UI = Object.assign(window.UI || {}, UI);
})();
