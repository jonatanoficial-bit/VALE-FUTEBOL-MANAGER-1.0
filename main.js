/* =======================================================
   VALE FUTEBOL MANAGER 2026
   main.js — Inicialização do jogo e navegação de telas
   Versão revisada – 100% funcional
   =======================================================*/

console.log(
  "%c[MAIN] Vale Futebol Manager 2026 carregado",
  "color:#C7A029; font-size:16px; font-weight:bold"
);

/* =======================================================
   FUNÇÃO GLOBAL DE TROCA DE TELAS
   =======================================================*/
function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach((t) => {
    t.classList.remove("ativa");
  });

  const alvo = document.getElementById(id);
  if (alvo) {
    alvo.classList.add("ativa");
  } else {
    console.error("[MAIN] Tela não encontrada:", id);
  }
}

/* =======================================================
   ESTADO GLOBAL SIMPLES (apenas info básica)
   =======================================================*/
window.Game = {
  coachName: "",
  teamId: "",
  rodada: 1,
  saldo: 10,
  formacao: "4-3-3",
  estilo: "equilibrado",
};

/* =======================================================
   INICIALIZAÇÃO
   =======================================================*/
window.addEventListener("load", () => {
  console.log("[MAIN] window.load -> iniciar configuração de botões");

  const btnContinuar = document.getElementById("btn-continuar");
  if (btnContinuar) {
    // esconde por padrão
    btnContinuar.style.display = "none";
  }

  // se houver save, mostra botão CONTINUAR
  if (window.Save && typeof Save.carregar === "function") {
    const save = Save.carregar(true); // modo "somente verificar", se existir na sua save.js
    if (save) {
      console.log("[MAIN] Save encontrado, exibindo CONTINUAR CARREIRA");
      if (btnContinuar) btnContinuar.style.display = "block";
    }
  }

  configurarBotoes();
});

/* =======================================================
   CONFIGURAÇÃO DOS BOTÕES DA CAPA
   =======================================================*/
function configurarBotoes() {
  const btnIniciar = document.getElementById("btn-iniciar");
  const btnContinuar = document.getElementById("btn-continuar");

  if (btnIniciar) {
    btnIniciar.onclick = () => {
      console.log("[MAIN] Nova carreira…");

      // limpa save antigo, se existir
      if (window.Save && typeof Save.novoJogo === "function") {
        Save.novoJogo();
      }

      // vai para escolha de time
      mostrarTela("tela-escolha-time");

      // preenche lista de times (fallback)
      if (typeof preencherListaTimesBasico === "function") {
        setTimeout(preencherListaTimesBasico, 50);
      } else {
        console.warn(
          "[MAIN] preencherListaTimesBasico() não definido – ver ui/ui.js"
        );
      }
    };
  }

  if (btnContinuar) {
    btnContinuar.onclick = () => {
      console.log("[MAIN] Continuar carreira…");

      if (window.Save && typeof Save.carregar === "function") {
        Save.carregar();
      }

      carregarLobby();
      mostrarTela("tela-lobby");
    };
  }
}

/* =======================================================
   SELEÇÃO DE TIME (usado pelo grid de escudos)
   =======================================================*/
function selecionarTimeBasico(teamId) {
  console.log("[MAIN] Time selecionado:", teamId);

  const nome = prompt("Nome do treinador:", "Técnico") || "Técnico";

  Game.teamId = teamId;
  Game.coachName = nome;

  if (typeof resetGameStateForNewCareer === "function") {
    resetGameStateForNewCareer(teamId, nome);
  }

  carregarLobby();
  mostrarTela("tela-lobby");

  if (window.Save && typeof Save.salvar === "function") {
    Save.salvar();
  }
}

/* =======================================================
   PREENCHER LISTA DE TIMES (FALLBACK)
   =======================================================*/
function preencherListaTimesBasico() {
  console.log("[MAIN] preenchendo lista de times (fallback)…");

  const container = document.getElementById("lista-times");
  if (!container) {
    console.error("[MAIN] #lista-times não encontrado.");
    return;
  }

  const fonteTeams =
    (window.Database && Database.teams) ||
    window.teams ||
    [];

  if (!fonteTeams.length) {
    console.error("[MAIN] Nenhum time encontrado no Database.teams");
    container.innerHTML = "<p>Nenhum time cadastrado.</p>";
    return;
  }

  container.innerHTML = "";

  fonteTeams.forEach((team) => {
    const card = document.createElement("button");
    card.className = "time-card";
    card.innerHTML = `
      <img class="time-card-logo" src="assets/logos/${team.id}.png" alt="${team.name}">
      <span class="time-card-nome">${team.name}</span>
    `;
    card.onclick = () => selecionarTimeBasico(team.id);
    container.appendChild(card);
  });
}

/* =======================================================
   ATUALIZAÇÃO DO LOBBY
   =======================================================*/
function carregarLobby() {
  console.log("[MAIN] carregarLobby()");

  const gs = window.gameState || {}; // definido em save.js

  if (!gs.selectedTeamId && !Game.teamId) {
    console.warn("[MAIN] Nenhum time selecionado para o lobby.");
    return;
  }

  const teamId = gs.selectedTeamId || Game.teamId;
  const team = getTeamById(teamId);

  if (!team) {
    console.error("[MAIN] Time inválido no lobby:", teamId);
    return;
  }

  Game.teamId = teamId;

  const lobbyNome = document.getElementById("lobby-nome-time");
  const lobbySaldo = document.getElementById("lobby-saldo");
  const lobbyTemp = document.getElementById("lobby-temporada");
  const lobbyLogo = document.getElementById("lobby-logo");

  if (lobbyNome) lobbyNome.textContent = team.name;
  if (lobbySaldo)
    lobbySaldo.textContent = "Saldo: " + (gs.balance ?? Game.saldo) + " mi";
  if (lobbyTemp)
    lobbyTemp.textContent = "Temporada: " + (gs.seasonYear ?? 2025);

  if (lobbyLogo) {
    lobbyLogo.src = `assets/logos/${team.id}.png`;
    lobbyLogo.alt = team.name;
    lobbyLogo.onerror = () => {
      console.warn("[MAIN] Escudo não encontrado para:", team.id);
      lobbyLogo.style.display = "none";
    };
  }
}

/* =======================================================
   NAVEGAÇÃO CENTRALIZADA (SOBRESCREVE UI ANTIGO)
   =======================================================*/
window.UI = Object.assign(window.UI || {}, {
  // -------- Telas básicas --------
  voltarParaCapa() {
    console.log("[UI] voltarParaCapa()");
    mostrarTela("tela-capa");
  },

  voltarLobby() {
    console.log("[UI] voltarLobby()");
    carregarLobby();
    mostrarTela("tela-lobby");
  },

  // -------- Jogo / Partida --------
  abrirProximoJogo() {
    console.log("[UI] abrirProximoJogo()");
    if (window.League && typeof League.prepararProximoJogo === "function") {
      League.prepararProximoJogo();
    }
    mostrarTela("tela-partida");
  },

  // -------- Tabelas --------
  abrirClassificacao() {
    console.log("[UI] abrirClassificacao()");
    if (window.LeagueUI && typeof LeagueUI.renderStandings === "function") {
      LeagueUI.renderStandings();
    }
    mostrarTela("tela-classificacao");
  },

  // -------- Elenco --------
  abrirElenco() {
    console.log("[UI] abrirElenco()");
    if (window.TeamUI && typeof TeamUI.renderSquad === "function") {
      TeamUI.renderSquad();
    }
    mostrarTela("tela-elenco");
  },

  // -------- Mercado --------
  abrirMercado() {
    console.log("[UI] abrirMercado()");
    if (window.MarketUI && typeof MarketUI.render === "function") {
      MarketUI.render();
    }
    mostrarTela("tela-mercado");
  },

  // -------- Táticas --------
  abrirTaticas() {
    console.log("[UI] abrirTaticas()");
    if (window.TacticsUI && typeof TacticsUI.render === "function") {
      TacticsUI.render();
    }
    mostrarTela("tela-taticas");
  },

  // -------- Calendário --------
  abrirCalendario() {
    console.log("[UI] abrirCalendario()");
    if (window.CalendarUI && typeof CalendarUI.renderSeason === "function") {
      CalendarUI.renderSeason();
    }
    mostrarTela("tela-calendario");
  },
});

console.log("[MAIN] Navegação UI sobrescrita com sucesso.");
