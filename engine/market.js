/* =======================================================
   VALE FUTEBOL MANAGER 2026
   ui/market-ui.js – Tela de Mercado de Transferências
   =======================================================*/

(function () {

  // Helpers para pegar players/teams do seu database.js (const players/teams)
  function getPlayersArray() {
    // Se algum dia você criar Database.players, ele terá prioridade
    if (window.Database && Array.isArray(Database.players)) {
      return Database.players;
    }
    try {
      if (Array.isArray(players)) return players; // seu const players
    } catch (e) {}
    return [];
  }

  function getTeamsArray() {
    if (window.Database && Array.isArray(Database.teams)) {
      return Database.teams;
    }
    try {
      if (Array.isArray(teams)) return teams; // seu const teams
    } catch (e) {}
    return [];
  }

  const MarketUI = {
    initialized: false,

    init() {
      // =====================================================
      // Mapeamento dos elementos de UI
      //
      // A versão original esperava IDs como select-mercado-posicao
      // e input-mercado-min-ovr, mas o HTML fornecido nesta edição
      // usa ids diferentes (filtro-posicao, filtro-min-ovr, etc.).
      // Para garantir compatibilidade, tentamos ambos.
      // Esta função pode ser chamada múltiplas vezes. Ela atualiza
      // as referências aos elementos sempre que invocada e adiciona
      // listeners apenas na primeira chamada.
      // =====================================================
      const byId = (a, b) => document.getElementById(a) || document.getElementById(b);

      // Atualiza elementos DOM, independente de já estar inicializado
      this.$posicao  = byId("select-mercado-posicao", "filtro-posicao");
      this.$minOvr   = byId("input-mercado-min-ovr", "filtro-min-ovr");
      this.$maxValor = byId("input-mercado-max-valor", "filtro-max-valor");
      this.$premium  = byId("check-mercado-premium", "filtro-premium");
      this.$lista    = document.getElementById("lista-mercado");

      if (!this.$lista) {
        console.warn("[MarketUI] Elementos da UI de mercado não encontrados.");
        return;
      }

      // Somente adiciona eventos na primeira inicialização
      if (!this.initialized) {
        const reagendar = () => this.atualizarLista();
        if (this.$posicao)  this.$posicao.addEventListener("change", reagendar);
        if (this.$minOvr)   this.$minOvr.addEventListener("input", reagendar);
        if (this.$maxValor) this.$maxValor.addEventListener("input", reagendar);
        if (this.$premium)  this.$premium.addEventListener("change", reagendar);
        this.initialized = true;
      }

      // Valores padrão nos filtros, se estiverem vazios
      if (this.$minOvr && !this.$minOvr.value) this.$minOvr.value = "70";
      if (this.$maxValor && !this.$maxValor.value) this.$maxValor.value = "50";

      // Renderizar lista de jogadores
      this.atualizarLista();
    },

    /** Atualiza a lista de jogadores à venda */
    atualizarLista() {
      if (!this.$lista) return;

      const filtros = this._lerFiltros();

      let jogadores = [];

      // Se existir um engine de mercado, usa ele
      if (window.Market && typeof Market.getJogadoresFiltrados === "function") {
        jogadores = Market.getJogadoresFiltrados(filtros);
      } else {
        // Fallback direto do database.js
        jogadores = this._filtrarDiretoDoDatabase(filtros);
      }

      this._renderLista(jogadores);
    },

    /** Compra disparada pelo botão "Contratar" */
    comprar(jogadorId) {
      const jogador = this._buscarJogadorPorId(jogadorId);
      if (!jogador) {
        alert("Jogador não encontrado.");
        return;
      }

      // Se existir engine de mercado, delega pra ela
      if (window.Market && typeof Market.comprarJogador === "function") {
        Market.comprarJogador(jogadorId);
        this.atualizarLista();
        return;
      }

      // Fallback – compra simples baseada em Game.saldo
      if (!window.Game) {
        alert("Estado do jogo (Game) não encontrado.");
        return;
      }

      const preco = jogador.value || 0;

      if (Game.saldo < preco) {
        alert("Saldo insuficiente para essa contratação.");
        return;
      }

      Game.elenco = Game.elenco || [];

      const jaTem = Game.elenco.some(p => p.id === jogador.id);
      if (jaTem) {
        alert("Esse jogador já está no seu elenco.");
        return;
      }

      // Debita saldo e muda o time do jogador
      Game.saldo = +(Game.saldo - preco).toFixed(1);
      jogador.teamId = Game.teamId;

      Game.elenco.push(jogador);

      if (typeof Game.onElencoAtualizado === "function") {
        Game.onElencoAtualizado();
      }

      alert(`Jogador ${jogador.name} contratado por ${preco} mi!`);
      this.atualizarLista();
    },

    // ========================
    // HELPERS INTERNOS
    // ========================

    _lerFiltros() {
      const posicao = this.$posicao ? this.$posicao.value : "todos";
      const minOvr  = this.$minOvr ? parseInt(this.$minOvr.value || "0", 10) : 0;
      const maxVal  = this.$maxValor ? parseFloat(this.$maxValor.value || "999", 10) : 999;
      const premium = this.$premium ? this.$premium.checked : false;

      return { posicao, minOvr, maxVal, premium };
    },

    _filtrarDiretoDoDatabase({ posicao, minOvr, maxVal, premium }) {
      const base = getPlayersArray();
      if (!base.length) return [];

      const meuTimeId = (window.Game && Game.teamId) ? Game.teamId : null;

      return base
        .filter(p => {
          if (meuTimeId && p.teamId === meuTimeId) return false;
          if (posicao !== "todos" && p.position !== posicao) return false;

          const ovr = p.overall || 0;
          const val = p.value || 0;

          if (ovr < minOvr) return false;
          if (val > maxVal) return false;

          // Pacote premium = só craques (por ex. OVR 82+)
          if (premium && ovr < 82) return false;

          return true;
        })
        .sort((a, b) => b.overall - a.overall);
    },

    _renderLista(jogadores) {
      this.$lista.innerHTML = "";

      if (!jogadores || !jogadores.length) {
        const vazio = document.createElement("div");
        vazio.style.padding = "12px 16px";
        vazio.textContent = "Nenhum jogador encontrado para os filtros.";
        this.$lista.appendChild(vazio);
        return;
      }

      jogadores.forEach(j => {
        const row = document.createElement("div");
        row.className = "card-mercado";

        const valor = (j.value || 0).toFixed(1).replace(".", ",");

        const foto = j.face
          ? j.face
          : "assets/face/default.png";

        row.innerHTML = `
          <img src="${foto}" alt="${j.name}" onerror="this.style.display='none'">
          <div>
            <div>${j.name}</div>
            <div style="font-size:11px;opacity:.8">
              ${j.position} · ${this._nomeTime(j.teamId)}
            </div>
          </div>
          <div class="ovr">${j.overall || 0}</div>
          <div class="valor">${valor} mi</div>
          <div>
            <button class="btn-principal btn-contratar" data-id="${j.id}">
              Contratar
            </button>
          </div>
        `;

        this.$lista.appendChild(row);
      });

      // Eventos dos botões
      this.$lista.querySelectorAll(".btn-contratar").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          MarketUI.comprar(id);
        });
      });
    },

    _nomeTime(teamId) {
      if (!teamId) return "";
      const fonte = getTeamsArray();
      const t = fonte.find(t => t.id === teamId);
      return t ? t.name : teamId;
    },

    _buscarJogadorPorId(id) {
      const base = getPlayersArray();
      return base.find(p => p.id === id);
    }
  };

  window.MarketUI = MarketUI;

  // Auto-init leve ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tela-mercado")) {
      MarketUI.init();
    }
  });

})();
