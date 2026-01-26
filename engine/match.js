/* =======================================================
   VALE FUTEBOL MANAGER 2026
   engine/match.js – Simulação básica de partida
   =======================================================*/

window.Match = {
  state: null,
  timer: null,

  // ---------------------------------------------------
  // Inicia o próximo jogo da carreira
  // ---------------------------------------------------
  iniciarProximoJogo() {
    if (!window.Database || !Database.teams) {
      alert("Banco de dados não carregado.");
      return;
    }
    if (!window.Game || !Game.teamId) {
      alert("Carreira não iniciada.");
      return;
    }

    const myTeam = Database.getTeamById(Game.teamId);
    if (!myTeam) {
      alert("Time do usuário não encontrado.");
      return;
    }

    // Adversário aleatório da mesma divisão
    const candidatos = Database.teams.filter(
      t => t.division === myTeam.division && t.id !== myTeam.id
    );
    if (!candidatos.length) {
      alert("Não há adversários disponíveis na divisão.");
      return;
    }
    const away = candidatos[Math.floor(Math.random() * candidatos.length)];

    this.state = {
      homeId: myTeam.id,
      awayId: away.id,
      minute: 0,
      goalsHome: 0,
      goalsAway: 0,
      finished: false,
      halftimeDone: false
    };

    this._setupTelaPartida(myTeam, away);

    const log = document.getElementById("log-partida");
    if (log) log.innerHTML = "";
    const cron = document.getElementById("cronometro");
    if (cron) cron.textContent = "0'";

    this.comecarLoop();
  },

  // ---------------------------------------------------
  _setupTelaPartida(home, away) {
    const elHome = document.getElementById("partida-home");
    const elAway = document.getElementById("partida-away");
    const logoHome = document.getElementById("logo-home");
    const logoAway = document.getElementById("logo-away");
    const golsHome = document.getElementById("gols-home");
    const golsAway = document.getElementById("gols-away");

    if (elHome) elHome.textContent = home.name;
    if (elAway) elAway.textContent = away.name;

    if (logoHome) {
      logoHome.src = `assets/logos/${home.id}.png`;
      logoHome.onerror = () => { logoHome.src = "assets/logos/default.png"; };
    }
    if (logoAway) {
      logoAway.src = `assets/logos/${away.id}.png`;
      logoAway.onerror = () => { logoAway.src = "assets/logos/default.png"; };
    }

    if (golsHome) golsHome.textContent = "0";
    if (golsAway) golsAway.textContent = "0";

    if (typeof mostrarTela === "function") {
      mostrarTela("tela-partida");
    }
  },

  // ---------------------------------------------------
  // Loop da partida
  // ---------------------------------------------------
  comecarLoop() {
    if (!this.state || this.state.finished) return;

    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (!this.state || this.state.finished) {
        clearInterval(this.timer);
        this.timer = null;
        return;
      }

      this.state.minute += 5;

      const cron = document.getElementById("cronometro");
      if (cron) cron.textContent = `${Math.min(this.state.minute, 90)}'`;

      // Intervalo aos 45'
      if (!this.state.halftimeDone && this.state.minute >= 45) {
        this.state.halftimeDone = true;
        this._intervalo();
        return; // pausa o loop aqui
      }

      this._simularMomento();

      const golsHome = document.getElementById("gols-home");
      const golsAway = document.getElementById("gols-away");
      if (golsHome) golsHome.textContent = this.state.goalsHome.toString();
      if (golsAway) golsAway.textContent = this.state.goalsAway.toString();

      if (this.state.minute >= 90) {
        this._finalizarPartida();
      }
    }, 600);
  },

  pausarLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // ---------------------------------------------------
  // Intervalo – pergunta sobre substituições
  // ---------------------------------------------------
  _intervalo() {
    this.pausarLoop();
    this.registrarEvento("Intervalo de jogo!");

    setTimeout(() => {
      const quer = confirm("Intervalo! Deseja fazer substituições?");
      if (quer && window.UI && typeof UI.abrirTaticas === "function") {
        // Abre tela de táticas; ao salvar, Tactics volta pro jogo
        UI.abrirTaticas();
      } else {
        // Não quer mexer no time, segue o jogo
        this.comecarLoop();
      }
    }, 50);
  },

  // ---------------------------------------------------
  // Força do time (média de OVR)
  // ---------------------------------------------------
  forcaDoTime(teamId) {
    const elenco = (window.Database && Database.players)
      ? Database.players.filter(p => p.teamId === teamId)
      : [];

    if (!elenco.length) return 70;

    const media = elenco.reduce((s, p) => s + (p.overall || 70), 0) / elenco.length;

    let bonus = 0;
    if (teamId === Game.teamId) {
      if (Game.estilo === "ofensivo") bonus += 2;
      if (Game.estilo === "defensivo") bonus -= 1;
    }

    return Math.round(media + bonus);
  },

  // ---------------------------------------------------
  // Simulação de eventos
  // ---------------------------------------------------
  _simularMomento() {
    if (!this.state) return;

    const fHome = this.forcaDoTime(this.state.homeId);
    const fAway = this.forcaDoTime(this.state.awayId);

    const diff = fHome - fAway;

    const baseProb = 0.10;
    let probHome = baseProb + diff * 0.0015;
    let probAway = baseProb - diff * 0.0015;

    probHome = Math.max(0.02, Math.min(0.25, probHome));
    probAway = Math.max(0.02, Math.min(0.25, probAway));

    const sorte = Math.random();

    if (sorte < probHome) {
      this._registrarGol(true);
    } else if (sorte < probHome + probAway) {
      this._registrarGol(false);
    } else if (sorte < probHome + probAway + 0.05) {
      this.registrarEvento("Lance perigoso, mas a defesa afastou.");
    }
  },

  _registrarGol(eDoHome) {
    if (!this.state) return;

    if (eDoHome) {
      this.state.goalsHome++;
      this.registrarEvento("GOOOOL do time da casa!");
    } else {
      this.state.goalsAway++;
      this.registrarEvento("GOOOOL do time visitante!");
    }
  },

  // ---------------------------------------------------
  // Fim de jogo
  // ---------------------------------------------------
  _finalizarPartida() {
    if (!this.state) return;

    this.state.finished = true;
    this.pausarLoop();
    this.registrarEvento("Fim de jogo!");

    const homeId = this.state.homeId;
    const awayId = this.state.awayId;
    const golsHome = this.state.goalsHome;
    const golsAway = this.state.goalsAway;

    let rodada = null;
    if (window.League && typeof League.processarRodadaComJogoDoUsuario === "function") {
      rodada = League.processarRodadaComJogoDoUsuario(
        homeId,
        awayId,
        golsHome,
        golsAway
      );
    }

    if (window.UI && typeof UI.mostrarResultadosRodada === "function" && rodada) {
      UI.mostrarResultadosRodada(rodada);
    } else if (window.UI && typeof UI.voltarLobby === "function") {
      alert(`Fim de jogo!\nPlacar: ${golsHome} x ${golsAway}`);
      UI.voltarLobby();
    }
  },

  // ---------------------------------------------------
  // Log visual
  // ---------------------------------------------------
  registrarEvento(texto) {
    const log = document.getElementById("log-partida");
    if (!log) return;

    const linha = document.createElement("div");
    linha.textContent = texto;
    log.appendChild(linha);
    log.scrollTop = log.scrollHeight;
  },

  // ---------------------------------------------------
  // Substituições (placeholder de botão)
  // ---------------------------------------------------
  substituicoes() {
    if (!this.state) return;
    if (this.state.minute < 45) {
      alert("Faça substituições pelo botão TÁTICAS antes do jogo ou no intervalo.");
      return;
    }
    alert("No intervalo você pode abrir a tela de tática e salvar a nova escalação.");
  }
};
