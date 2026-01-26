(() => {
  "use strict";

  /**
   * Vale Futebol Manager 2026 - Premium
   *
   * Este script implementa a lógica principal da aplicação. Ele gerencia o
   * carregamento de pacotes de dados (DLC), slots de salvamento, criação
   * de carreira, seleção de clube, tutorial, HUB do treinador e módulos
   * básicos (elenco, tática, treinos). Todas as interações são feitas
   * sem backend, utilizando LocalStorage para persistência.
   */

  // Oculta a tela de splash após a página carregar
  document.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("splash");
    if (splash) {
      // pequeno atraso para mostrar a animação
      setTimeout(() => {
        splash.classList.add("hidden");
      }, 1500);
    }
  });

  /** Seleciona um elemento no DOM */
  const $ = (sel) => document.querySelector(sel);

  /** Tenta fazer o parse de JSON, senão retorna fallback */
  function safeJsonParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  /** Retorna data/hora atual em ISO */
  function nowIso() {
    return new Date().toISOString();
  }

  /**
   * Resolve uma URL relativa para o caminho correto de deploy.
   * Alguns navegadores (como GitHub Pages) servem a aplicação a partir de uma
   * subpasta (ex.: /MeuRepo/), o que quebra fetch('./data/...').
   * Este helper utiliza o objeto URL para resolver o caminho com base no
   * endereço atual da página. Caso o parâmetro já seja uma URL absoluta,
   * retorna-o sem alterações.
   * @param {string} rel Caminho relativo ou URL.
   */
  function urlOf(rel) {
    try {
      // Se for absoluta, retorna como está
      if (/^https?:\/\//.test(rel)) return rel;
      // Remove hashes e queries da URL atual
      const base = window.location.href.split("?#")[0].split("?")[0];
      return new URL(rel.replace(/^\.\/?/, ""), base).href;
    } catch (e) {
      return rel;
    }
  }

  /** Chaves de LocalStorage */
  const LS = {
    SETTINGS: "vfm26_settings",
    SLOT_PREFIX: "vfm26_slot_"
  };

  /**
   * Catálogos de staff e patrocinadores
   * Cada staff possui um efeito aplicado no treino (trainingBoost ou formBoostMultiplier)
   * e um salário semanal. Os patrocinadores oferecem dinheiro inicial e
   * pagamentos semanais. Esses catálogos podem ser expandidos futuramente ou
   * carregados de um JSON externo.
   */
  const STAFF_CATALOG = [
    {
      id: "assistant_coach",
      name: "Assistente Técnico",
      effect: { trainingBoost: 0.1 },
      salary: 500000,
      description: "Aumenta ligeiramente o efeito de qualquer plano de treino."
    },
    {
      id: "fitness_coach",
      name: "Preparador Físico",
      effect: { formBoostMultiplier: 1.2 },
      salary: 400000,
      description: "Multiplica o bônus do treino, mantendo os atletas em melhor forma física."
    },
    {
      id: "analyst",
      name: "Analista de Desempenho",
      effect: { trainingBoost: 0.05, formBoostMultiplier: 1.1 },
      salary: 300000,
      description: "Fornece dados para otimizar treinos e escalar melhor o time."
    }
  ];

  const SPONSOR_CATALOG = [
    {
      id: "vale",
      name: "Vale",
      cashUpfront: 10000000,
      weekly: 500000,
      description: "A mineradora Vale oferece um bom aporte inicial e pagamentos constantes."
    },
    {
      id: "regional_bank",
      name: "Banco Regional",
      cashUpfront: 5000000,
      weekly: 300000,
      description: "Patrocínio sólido de um banco local."
    },
    {
      id: "energy_drink",
      name: "Energy Drink",
      cashUpfront: 2000000,
      weekly: 100000,
      description: "Empresa de bebidas energéticas oferecendo apoio modesto."
    }
  ];

  /**
   * Estado global da aplicação
   * - settings: preferências e metadados do jogador
   * - packs: lista de pacotes carregados de /data/packs.json
   * - packData: dados completos do pacote selecionado
   * - ui: estado visual (erros/carregando)
   */
  const state = {
    settings: loadSettings(),
    packs: [],
    packData: null,
    ui: { loading: false, error: null }
  };

  /** Valores padrão para settings */
  function defaultSettings() {
    return {
      selectedPackId: null,
      activeSlotId: null,
      lastRoute: "#/home",
      slots: {}
    };
  }

  /** Carrega settings do LocalStorage, retornando os padrões se ausente */
  function loadSettings() {
    const raw = localStorage.getItem(LS.SETTINGS);
    const parsed = safeJsonParse(raw, null);
    return parsed && typeof parsed === "object"
      ? { ...defaultSettings(), ...parsed }
      : defaultSettings();
  }

  /** Salva as configurações no LocalStorage */
  function saveSettings() {
    localStorage.setItem(LS.SETTINGS, JSON.stringify(state.settings));
  }

  /** Retorna a chave de armazenamento de um slot */
  function slotKey(id) {
    return `${LS.SLOT_PREFIX}${id}`;
  }

  /** Lê um slot salvo */
  function readSlot(id) {
    return safeJsonParse(localStorage.getItem(slotKey(id)), null);
  }

  /** Escreve um slot e atualiza metadados */
  function writeSlot(id, data) {
    localStorage.setItem(slotKey(id), JSON.stringify(data));
    state.settings.slots[String(id)] = {
      hasSave: true,
      updatedAt: data.meta.updatedAt,
      summary: data.meta.summary
    };
    saveSettings();
  }

  /** Remove um slot e zera o metadado */
  function clearSlot(id) {
    localStorage.removeItem(slotKey(id));
    state.settings.slots[String(id)] = {
      hasSave: false,
      updatedAt: nowIso(),
      summary: "Vazio"
    };
    saveSettings();
  }

  /** Garante que existam pelo menos 2 slots predefinidos */
  function ensureSlots() {
    ["1", "2"].forEach((id) => {
      if (!state.settings.slots[id]) {
        const exists = !!readSlot(id);
        state.settings.slots[id] = {
          hasSave: exists,
          updatedAt: nowIso(),
          summary: exists ? "Carreira salva" : "Vazio"
        };
      }
    });
    saveSettings();
  }

  /** Carrega lista de pacotes de /data/packs.json */
  async function loadPacks() {
    try {
      // Usa urlOf para resolver o caminho do packs.json relativo ao local
      const res = await fetch(urlOf("./data/packs.json"), { cache: "no-store" });
      const json = await res.json();
      state.packs = Array.isArray(json?.packs) ? json.packs : [];
    } catch {
      state.packs = [];
      state.ui.error = "Falha ao carregar pacotes.";
    }
  }

  /** Carrega os dados completos do pacote selecionado */
  async function loadPackData() {
    const pid = state.settings.selectedPackId;
    if (!pid) {
      state.packData = null;
      return;
    }
    const pack = state.packs.find((p) => p.id === pid);
    if (!pack) {
      state.packData = null;
      return;
    }
    try {
      // Resolve caminho do manifest para URL completa (suporta deploy em subpasta)
      const manifestUrl = urlOf(pack.path || "");
      const manifest = await fetch(manifestUrl, { cache: "no-store" }).then((r) => r.json());
      const files = manifest.files || {};
      // Carrega cada arquivo, caindo para fallback se falhar
      async function tryLoad(path, fb) {
        try {
          const resolved = urlOf(path || "");
          const r = await fetch(resolved, { cache: "no-store" });
          return await r.json();
        } catch {
          return fb;
        }
      }
      state.packData = {
        manifest,
        clubs: await tryLoad(files.clubs, { clubs: [] }),
        competitions: await tryLoad(files.competitions, { leagues: [], cups: [] }),
        rules: await tryLoad(files.rules, {}),
        seasons: await tryLoad(files.seasons, { seasons: [] }),
        players: await tryLoad(files.players, { players: [] }),
        qualifications: await tryLoad(files.qualifications, {})
      };
    } catch {
      state.packData = null;
      state.ui.error = "Falha ao carregar dados do pacote.";
    }
  }

  /** Router: mapeia rotas para funções de renderização */
  const routes = {
    "/home": viewHome,
    "/dlc": viewDlc,
    "/slots": viewSlots,
    "/career-create": viewCareerCreate,
    "/club-pick": viewClubPick,
    "/tutorial": viewTutorial,
    "/hub": viewHub,
    "/squad": viewSquad,
    "/tactics": viewTactics,
    "/training": viewTraining,
    "/matches": viewMatches,
    "/competitions": viewCompetitions,
    "/finance": viewFinance,
    "/save": viewSave,
    "/admin": viewAdmin,
    "/staff": viewStaff,
    "/sponsorship": viewSponsorship,
    "/transfers": viewTransfers
  };

  /** Navega para a rota atual conforme hash */
  function route() {
    ensureSlots();
    const hash = location.hash.replace("#", "");
    const path = hash || "/home";
    const view = routes[path] || viewHome;
    const html = view();
    // Renderiza no container e vincula eventos
    const viewEl = document.getElementById("view");
    if (viewEl) {
      viewEl.innerHTML = html;
    }
    bindEvents();
  }

  // Ouve mudança de hash para atualizar a rota
  window.addEventListener("hashchange", route);

  /** Codifica string em HTML seguro */
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Obtém o slot ativo ou null */
  function activeSave() {
    const id = state.settings.activeSlotId;
    if (!id) return null;
    return readSlot(id);
  }

  /** Exige um save válido; caso contrário, retorna mensagem de aviso */
  function requireSave(cb) {
    const save = activeSave();
    if (!state.settings.selectedPackId) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="notice">Selecione um DLC primeiro.</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/dlc">Escolher DLC</button>
            <button class="btn btn-ghost" data-go="/home">Menu</button>
          </div>
        </div>
      `;
    }
    if (!save) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="notice">Crie ou continue um slot antes de prosseguir.</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/slots">Ir para Slots</button>
            <button class="btn btn-ghost" data-go="/home">Menu</button>
          </div>
        </div>
      `;
    }
    state._saveCtx = save;
    return cb(save);
  }

  /** Obtém clube pelo id a partir do pacote carregado */
  function getClub(id) {
    // Preferência: mundo salvo (para promoções/rebaixamentos e mudanças persistentes)
    try {
      const wc = state._saveCtx?.world?.clubs;
      if (Array.isArray(wc)) {
        const found = wc.find((c) => c.id === id);
        if (found) return found;
      }
    } catch {}
    return state.packData?.clubs?.clubs.find((c) => c.id === id) || null;
  }

  /** Gera aleatoriamente um elenco para um clube (MVP) */
  function generateSquadForClub(clubId) {
    // Define base de overall conforme a liga
    const club = getClub(clubId);
    let base = 65;
    if (club?.leagueId === "BRA_SERIE_A") base = 70;
    else if (club?.leagueId === "BRA_SERIE_B") base = 66;
    else if (club?.leagueId && club.leagueId.startsWith("ENG_")) base = 75;
    else if (club?.leagueId && club.leagueId.startsWith("ESP_")) base = 74;
    else if (club?.leagueId && club.leagueId.startsWith("ITA_")) base = 73;
    else if (club?.leagueId && club.leagueId.startsWith("GER_")) base = 73;
    else if (club?.leagueId && club.leagueId.startsWith("FRA_")) base = 72;

    const positions = [];
    positions.push(...Array.from({ length: 3 }, () => "GK"));
    positions.push(...Array.from({ length: 8 }, () => "DEF"));
    positions.push(...Array.from({ length: 9 }, () => "MID"));
    positions.push(...Array.from({ length: 5 }, () => "ATT"));

    const firstNames = ["Joao","Pedro","Lucas","Mateus","Gabriel","Rafael","Bruno","Diego","Vitor","Caio","Renan","Andre","Thiago","Henrique","Arthur","Marcos","Felipe","Danilo","Gustavo","Leo"];
    const lastNames  = ["Silva","Souza","Santos","Oliveira","Pereira","Lima","Costa","Ribeiro","Carvalho","Almeida","Gomes","Rocha","Martins","Barbosa","Ferreira","Mendes","Araujo","Cardoso","Teixeira","Moura"];

    return positions.map((pos, i) => {
      const age = Math.floor(Math.random() * (35 - 17 + 1)) + 17;
      const overall = Math.min(90, Math.max(50, base + Math.floor(Math.random() * 11) - 3));
      const value = Math.round((overall * 900000) * (age <= 23 ? 1.2 : 1.0));
      const form = Math.floor(Math.random() * 5) - 2; // -2..+2
      return {
        id: `${clubId}_p${i + 1}`,
        clubId,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        pos,
        age,
        overall,
        value,
        nationality: club?.country || null,
        form,
        source: "generated"
      };
    });
  }

  /** Cria o XI inicial com base na formação */
  function buildDefaultXI(players, formation) {
    const byPos = {
      GK: players.filter((p) => p.pos === "GK").sort((a, b) => b.overall - a.overall),
      DEF: players.filter((p) => p.pos === "DEF").sort((a, b) => b.overall - a.overall),
      MID: players.filter((p) => p.pos === "MID").sort((a, b) => b.overall - a.overall),
      ATT: players.filter((p) => p.pos === "ATT").sort((a, b) => b.overall - a.overall)
    };
    const need = formation === "4-4-2"
      ? { GK: 1, DEF: 4, MID: 4, ATT: 2 }
      : { GK: 1, DEF: 4, MID: 3, ATT: 3 };
    const xi = [];
    ["GK", "DEF", "MID", "ATT"].forEach((pos) => {
      for (let i = 0; i < need[pos]; i++) {
        if (byPos[pos][i]) xi.push(byPos[pos][i].id);
      }
    });
    return xi;
  }

  /** Garante que a carreira tenha sistemas de elenco, tática e treinos */
  function ensureSystems(save) {
    save.squad = save.squad || {};
    save.tactics = save.tactics || {};
    save.training = save.training || {};
    // Mundo persistente (clubes mutáveis para promoções/rebaixamentos)
    if (!save.world) save.world = {};
    if (!Array.isArray(save.world.clubs) || save.world.clubs.length === 0) {
      const baseClubs = state.packData?.clubs?.clubs || [];
      save.world.clubs = JSON.parse(JSON.stringify(baseClubs));
    }
    if (!save.progress) save.progress = {};
    if (!save.progress.leagueTables) save.progress.leagueTables = {};

    if (!Array.isArray(save.squad.players) || save.squad.players.length === 0) {
      save.squad.players = generateSquadForClub(save.career.clubId);
    }
    if (!save.tactics.formation) save.tactics.formation = "4-3-3";
    if (!Array.isArray(save.tactics.startingXI) || save.tactics.startingXI.length === 0) {
      save.tactics.startingXI = buildDefaultXI(save.squad.players, save.tactics.formation);
    }
    if (!save.training.weekPlan) save.training.weekPlan = "Equilibrado";
    if (typeof save.training.formBoost !== "number") save.training.formBoost = 0;

    // Inicializa sistemas adicionais: staff, patrocínio, finanças e filtros de transferência
    if (!save.staff) save.staff = { hired: [] };
    if (!save.sponsorship) save.sponsorship = { current: null };
    if (!save.finance) {
      // Valor inicial em caixa usando economy.defaultStartingCashIfMissing, se definido
      let initialCash = 50000000;
      try {
        initialCash = state.packData?.rules?.economy?.defaultStartingCashIfMissing ?? 50000000;
      } catch {}
      save.finance = { cash: initialCash };
    }
    if (!save.transfers) save.transfers = { search: '', filterPos: 'ALL', bought: [] };
    // garante que existam campos para busca, filtro e lista de jogadores comprados
    if (typeof save.transfers.search !== 'string') save.transfers.search = '';
    if (!save.transfers.filterPos) save.transfers.filterPos = 'ALL';
    if (!Array.isArray(save.transfers.bought)) save.transfers.bought = [];

    return save;
  }

  /** Calcula o overall médio do XI */
  function teamOverall(players, xi) {
    const set = new Set(xi);
    const selected = players.filter((p) => set.has(p.id));
    if (selected.length === 0) return 0;
    const avg = selected.reduce((s, p) => s + p.overall, 0) / selected.length;
    return Math.round(avg);
  }

  /**
   * Calcula o efeito total dos staff contratados no treino.
   * Retorna um objeto com um bônus adicional (extra) e um multiplicador (multiplier).
   */
  function computeStaffTraining(save) {
    const hired = (save.staff && Array.isArray(save.staff.hired)) ? save.staff.hired : [];
    let extra = 0;
    let multiplier = 1;
    for (const st of hired) {
      if (st.effect && typeof st.effect.trainingBoost === 'number') {
        extra += st.effect.trainingBoost;
      }
      if (st.effect && typeof st.effect.formBoostMultiplier === 'number') {
        multiplier *= st.effect.formBoostMultiplier;
      }
    }
    return { extra, multiplier };
  }

  /* ========== VIEWS ========== */

  /** Tela inicial */
  function viewHome() {
    const packName = state.settings.selectedPackId
      ? state.packs.find((p) => p.id === state.settings.selectedPackId)?.name || state.settings.selectedPackId
      : "Nenhum";
    const slotLabel = state.settings.activeSlotId ? `Slot ${state.settings.activeSlotId}` : "Nenhum";

    // Só libera HUB quando existir um save ativo e um clube selecionado
    let canGoHub = false;
    try {
      const s = state.settings.activeSlotId ? readSlot(state.settings.activeSlotId) : null;
      canGoHub = !!(s && s.career && s.career.clubId);
    } catch {
      canGoHub = false;
    }
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Menu Principal</div>
            <div class="card-subtitle">Inicie sua carreira e gerencie seu clube favorito</div>
          </div>
          <span class="badge">VFM Premium</span>
        </div>
        <div class="card-body">
          ${state.ui.error ? `<div class="notice">⚠️ ${esc(state.ui.error)}</div><div class="sep"></div>` : ""}
          <div class="kv">
            <span class="small">Pacote</span>
            <b>${esc(packName)}</b>
          </div>
          <div style="height: 10px;"></div>
          <div class="kv">
            <span class="small">Slot</span>
            <b>${esc(slotLabel)}</b>
          </div>
          <div class="sep"></div>
          <div class="row">
            <button class="btn btn-primary" data-go="/dlc">Iniciar Carreira</button>
            <button class="btn" data-go="/admin">Admin</button>
            ${canGoHub ? `<button class="btn" data-go="/hub">HUB</button>` : ``}
          </div>
        </div>
      </div>
    `;
  }

  /** Seleção de pacotes de dados (DLC) */
  function viewDlc() {
    const list = state.packs.map((p) => {
      const selected = p.id === state.settings.selectedPackId;
      return `
        <div class="item">
          <div class="item-left">
            <div class="item-title">${esc(p.name)}</div>
            <div class="item-sub">v${esc(p.version || "1.0.0")} • ${esc(p.description || "")}</div>
          </div>
          <div class="item-right">
            <button class="btn ${selected ? 'btn-ghost' : 'btn-primary'}" data-action="selectPack" data-pack="${esc(p.id)}">
              ${selected ? 'Selecionado' : 'Selecionar'}
            </button>
          </div>
        </div>
      `;
    }).join("");
    const selectedOk = !!state.settings.selectedPackId;
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Escolher Pacote de Dados</div>
            <div class="card-subtitle">Os dados vêm de /data/*.json</div>
          </div>
          <span class="badge">${state.ui.loading ? 'Carregando...' : 'Pronto'}</span>
        </div>
        <div class="card-body">
          ${state.ui.error ? `<div class="notice">⚠️ ${esc(state.ui.error)}</div><div class="sep"></div>` : ''}
          <div class="list">${list}</div>
          <div class="sep"></div>
          <div class="row">
            <button class="btn" data-go="/home">Voltar</button>
            <button class="btn btn-primary" data-action="goSlots" ${selectedOk ? '' : 'disabled'}>Continuar</button>
          </div>
        </div>
      </div>
    `;
  }

  /** Seleção de slots de salvamento */
  function viewSlots() {
    const pack = state.packs.find((p) => p.id === state.settings.selectedPackId) || null;
    const renderSlot = (id) => {
      const meta = state.settings.slots[String(id)];
      const hasSave = !!readSlot(id);
      return `
        <div class="item">
          <div class="item-left">
            <div class="item-title">Slot ${id} ${hasSave ? '💾' : '🆕'}</div>
            <div class="item-sub">${esc(meta?.summary || (hasSave ? 'Carreira salva' : 'Vazio'))}</div>
          </div>
          <div class="item-right">
            <button class="btn btn-primary" data-action="${hasSave ? 'continueSlot' : 'newSlot'}" data-slot="${id}">
              ${hasSave ? 'Continuar' : 'Novo'}
            </button>
            <button class="btn btn-danger" data-action="deleteSlot" data-slot="${id}">Apagar</button>
          </div>
        </div>
      `;
    };
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Slots de Salvamento</div>
            <div class="card-subtitle">Gerencie suas carreiras</div>
          </div>
          <span class="badge">Pacote: ${esc(pack?.name || 'Nenhum')}</span>
        </div>
        <div class="card-body">
          ${!pack ? `
            <div class="notice">Selecione um pacote antes.</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/dlc">Ir para DLC</button>
          ` : `
            <div class="list">
              ${renderSlot(1)}
              ${renderSlot(2)}
              ${renderSlot(3)}
            </div>
            <div class="sep"></div>
            <div class="row">
              <button class="btn" data-go="/dlc">Voltar</button>
              <button class="btn" data-go="/home">Menu</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /** Criação de carreira: nome, nacionalidade, etc. */
  function viewCareerCreate() {
    return requireSave((save) => {
      const coachName = save.career?.coachName || "";
      const nationality = save.career?.nationality || "Brasil";
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Criar Carreira</div>
              <div class="card-subtitle">Defina seu treinador</div>
            </div>
            <span class="badge">Passo 1/3</span>
          </div>
          <div class="card-body">
            <div class="grid">
              <div class="col-6">
                <div class="label">Nome do treinador</div>
                <input class="input" data-field="coachName" value="${esc(coachName)}" placeholder="Ex: João Vale" />
              </div>
              <div class="col-6">
                <div class="label">Nacionalidade</div>
                <input class="input" data-field="nationality" value="${esc(nationality)}" placeholder="Ex: Brasil" />
              </div>
            </div>
            <div class="sep"></div>
            <div class="row">
              <button class="btn" data-go="/slots">Voltar</button>
              <button class="btn btn-primary" data-action="careerContinueToClub">Continuar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  /** Escolha de clube */
  function viewClubPick() {
    return requireSave((save) => {
      const clubs = state.packData?.clubs?.clubs || [];
      // Filtra por ligas principais se existirem; por padrão lista todas
      const currentLeague = save.career?.leagueFilter || clubs[0]?.leagueId || "";
      const searchTerm = save.career?.clubSearch || "";
      const leagues = state.packData?.competitions?.leagues || [];
      const leagueOptions = leagues.map((l) => `<option value="${esc(l.id)}" ${l.id === currentLeague ? 'selected' : ''}>${esc(l.name)}</option>`).join("");
      const filtered = clubs
        .filter((c) => !currentLeague || c.leagueId === currentLeague)
        .filter((c) => {
          if (!searchTerm.trim()) return true;
          const s = searchTerm.trim().toLowerCase();
          return (c.name || "").toLowerCase().includes(s) || (c.short || "").toLowerCase().includes(s);
        });
      const list = filtered.map((c) => {
        const initials = (c.short || c.name || "CLB").slice(0, 3).toUpperCase();
        return `
          <div class="item">
            <div class="item-left" style="display:flex; gap:12px; align-items:center;">
              <div class="club-logo">
                <img src="./assets/logos/${esc(c.id)}.png" alt="${esc(c.name)}" onerror="this.remove(); this.parentElement.innerHTML='<div class=\'club-fallback\'>${esc(initials)}</div>'"> 
              </div>
              <div style="min-width:0;">
                <div class="item-title">${esc(c.name)}</div>
                <div class="item-sub">${esc(c.short)} • Overall ${esc(c.overall)} • Orçamento ${Math.round((c.budget || 0) / 1_000_000)}M</div>
              </div>
            </div>
            <div class="item-right">
              <button class="btn btn-primary" data-action="pickClub" data-club="${esc(c.id)}">Escolher</button>
            </div>
          </div>
        `;
      }).join("");
      const chosen = save.career?.clubId ? getClub(save.career.clubId) : null;
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Escolha de Clube</div>
              <div class="card-subtitle">Selecione o clube que você irá comandar</div>
            </div>
            <span class="badge">Passo 2/3</span>
          </div>
          <div class="card-body">
            <div class="grid">
              <div class="col-6">
                <div class="label">Liga</div>
                <select class="input" data-action="setLeagueFilter">${leagueOptions}</select>
              </div>
              <div class="col-6">
                <div class="label">Buscar clube</div>
                <input class="input" data-action="clubSearchInput" value="${esc(searchTerm)}" placeholder="Digite o nome do clube" />
              </div>
            </div>
            <div class="sep"></div>
            <div class="list">
              ${list || `<div class='notice'>Nenhum clube encontrado.</div>`}
            </div>
            ${chosen ? `<div class="sep"></div><div class="notice">Clube selecionado: <b>${esc(chosen.name)}</b></div>` : ''}
            <div class="sep"></div>
            <div class="row">
              <button class="btn" data-go="/career-create">Voltar</button>
              <button class="btn btn-primary" data-action="confirmClub" ${chosen ? '' : 'disabled'}>Continuar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  /** Tutorial inicial */
  function viewTutorial() {
    return requireSave((save) => {
      const club = getClub(save.career.clubId);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Bem-vindo(a) ao VFM</div>
              <div class="card-subtitle">Tutorial inicial</div>
            </div>
            <span class="badge">Passo 3/3</span>
          </div>
          <div class="card-body">
            <div class="notice">
              👋 Olá <b>${esc(save.career.coachName)}</b>!<br/><br/>
              Você foi contratado para comandar o <b>${esc(club?.name || 'clube')}</b>.<br/><br/>
              Aqui você irá gerenciar elenco e táticas, definir treinos, disputar
              competições nacionais e continentais, negociar jogadores e muito mais. Suas
              decisões influenciam o futuro do clube!
            </div>
            <div class="sep"></div>
            <div class="row">
              <button class="btn btn-primary" data-action="finishTutorial">Ir para o HUB</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  /** HUB do treinador */
  function viewHub() {
    return requireSave((save) => {
      ensureSystems(save);

      // HUB é o lobby do usuário dentro do jogo. Se ainda não escolheu clube,
      // força o fluxo correto: Escolha de Clube -> Tutorial -> HUB.
      if (!save?.career?.clubId) {
        return `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Escolha um clube primeiro</div>
                <div class="card-subtitle">O HUB só fica disponível após você selecionar seu time.</div>
              </div>
              <span class="badge">Fluxo</span>
            </div>
            <div class="card-body">
              <div class="notice">Vá para a tela de <b>Escolha de Clube</b> para continuar sua carreira.</div>
              <div class="sep"></div>
              <div class="row">
                <button class="btn btn-primary" data-go="/club-pick">Escolher Clube</button>
                <button class="btn" data-go="/home">Menu</button>
              </div>
            </div>
          </div>
        `;
      }

      const club = getClub(save.career.clubId);
      // Format cash and current sponsor for display
      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cashStr = (save.finance?.cash || 0).toLocaleString('pt-BR', { style: 'currency', currency });
      const sponsorName = save.sponsorship?.current?.name || 'Nenhum';
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">HUB do Treinador</div>
              <div class="card-subtitle">${esc(club?.name || '')} • Treinador: ${esc(save.career.coachName)}</div>
            </div>
            <span class="badge">Caixa: ${cashStr}</span>
          </div>
          <div class="card-body">
            <div class="kv">
              <span class="small">Patrocínio</span>
              <b>${esc(sponsorName)}</b>
            </div>
            <div class="sep"></div>
            <div class="grid">
              <div class="col-4"><button class="btn btn-primary" data-go="/squad">Elenco</button></div>
              <div class="col-4"><button class="btn btn-primary" data-go="/tactics">Tática</button></div>
              <div class="col-4"><button class="btn btn-primary" data-go="/training">Treinos</button></div>

            <div class="col-4"><button class="btn btn-primary" data-go="/matches">Jogos (Calendário)</button></div>
            <div class="col-4"><button class="btn btn-primary" data-go="/competitions">Competições</button></div>
            <div class="col-4"><button class="btn btn-primary" data-go="/finance">Finanças</button></div>

              <div class="col-4"><button class="btn btn-primary" data-go="/staff">Staff</button></div>
              <div class="col-4"><button class="btn btn-primary" data-go="/sponsorship">Patrocínio</button></div>
              <div class="col-4"><button class="btn btn-primary" data-go="/transfers">Transferências</button></div>
              <div class="col-4"><button class="btn" data-go="/save">Salvar</button></div>
              <div class="col-4"><button class="btn" data-go="/home">Menu</button></div>
              <div class="col-4"><button class="btn btn-danger" data-go="/slots">Trocar Slot</button></div>
            </div>
            <div class="sep"></div>
            <div class="notice">
              Gerencie todos os aspectos do seu clube: elenco, tática, treinos, staff, patrocínio e transferências.
            </div>
          </div>
        </div>
      `;
    });
  }

  /** Elenco */
  function viewSquad() {
    return requireSave((save) => {
      ensureSystems(save);
      const club = getClub(save.career.clubId);
      const players = save.squad.players;
      // Filtra por busca e posição se for implementado (por simplicidade não)
      const rows = players
        .sort((a, b) => b.overall - a.overall)
        .map((p) => `
          <tr>
            <td>${esc(p.name)}</td>
            <td class="center">${esc(p.pos)}</td>
            <td class="center">${esc(p.age)}</td>
            <td class="center"><b>${esc(p.overall)}</b></td>
            <td class="center">${p.form > 0 ? '+' + p.form : p.form}</td>
          </tr>
        `)
        .join("");
      writeSlot(state.settings.activeSlotId, save);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Elenco</div>
              <div class="card-subtitle">${esc(club?.name || '')} • ${players.length} jogadores</div>
            </div>
            <span class="badge">OVR XI: ${teamOverall(players, save.tactics.startingXI)}</span>
          </div>
          <div class="card-body">
            <table class="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th class="center">Pos</th>
                  <th class="center">Idade</th>
                  <th class="center">OVR</th>
                  <th class="center">Forma</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/hub">Voltar</button>
          </div>
        </div>
      `;
    });
  }

  /** Tática */
  function viewTactics() {
    return requireSave((save) => {
      ensureSystems(save);
      const club = getClub(save.career.clubId);
      const players = save.squad.players;
      const formation = save.tactics.formation;
      const ovr = teamOverall(players, save.tactics.startingXI);
      // Monta XI
      const xiSet = new Set(save.tactics.startingXI || []);
      const xiPlayers = players.filter((p) => xiSet.has(p.id)).sort((a, b) => b.overall - a.overall);
      const xiRows = xiPlayers.map((p) => `
        <tr>
          <td>${esc(p.name)}</td>
          <td class="center">${esc(p.pos)}</td>
          <td class="center"><b>${esc(p.overall)}</b></td>
        </tr>
      `).join("");
      writeSlot(state.settings.activeSlotId, save);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Tática</div>
              <div class="card-subtitle">${esc(club?.name || '')} • XI & Formação</div>
            </div>
            <span class="badge">OVR XI: ${ovr}</span>
          </div>
          <div class="card-body">
            <div class="grid">
              <div class="col-6">
                <div class="label">Formação</div>
                <select class="input" data-action="setFormation">
                  <option value="4-3-3" ${formation === '4-3-3' ? 'selected' : ''}>4-3-3</option>
                  <option value="4-4-2" ${formation === '4-4-2' ? 'selected' : ''}>4-4-2</option>
                </select>
              </div>
              <div class="col-6">
                <div class="label">Autoescalar</div>
                <button class="btn btn-primary" data-action="autoPickXI">Melhor XI</button>
              </div>
            </div>
            <div class="sep"></div>
            <div class="notice">Sua escalação é salva automaticamente. Selecione jogadores no Elenco para ajustar.</div>
            <div class="sep"></div>
            <table class="table">
              <thead><tr><th>Jogador</th><th class="center">Pos</th><th class="center">OVR</th></tr></thead>
              <tbody>${xiRows || `<tr><td colspan='3' class='mini'>XI vazio. Use autoescalar.</td></tr>`}</tbody>
            </table>
            <div class="sep"></div>
            <div class="row">
              <button class="btn btn-primary" data-go="/hub">Voltar</button>
              <button class="btn" data-go="/squad">Ir para Elenco</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  /** Treinos */
  function viewTraining() {
    return requireSave((save) => {
      ensureSystems(save);
      const club = getClub(save.career.clubId);
      const plan = save.training.weekPlan;
      writeSlot(state.settings.activeSlotId, save);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Treinos</div>
              <div class="card-subtitle">${esc(club?.name || '')} • Planejamento Semanal</div>
            </div>
            <span class="badge">Bônus forma: ${save.training.formBoost.toFixed(1)}</span>
          </div>
          <div class="card-body">
            <div class="grid">
              <div class="col-6">
                <div class="label">Plano da semana</div>
                <select class="input" data-action="setTrainingPlan">
                  <option value="Leve" ${plan === 'Leve' ? 'selected' : ''}>Leve</option>
                  <option value="Equilibrado" ${plan === 'Equilibrado' ? 'selected' : ''}>Equilibrado</option>
                  <option value="Intenso" ${plan === 'Intenso' ? 'selected' : ''}>Intenso</option>
                </select>
              </div>
              <div class="col-6">
                <div class="label">Aplicar treino</div>
                <button class="btn btn-primary" data-action="applyTraining">Aplicar</button>
              </div>
            </div>
            <div class="sep"></div>
            <div class="notice">
              O treino melhora levemente a forma dos jogadores. Planos intensos dão bônus maior.
            </div>
            <div class="sep"></div>
            <div class="row">
              <button class="btn btn-primary" data-go="/hub">Voltar</button>
              <button class="btn" data-go="/squad">Ver Elenco</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  // -----------------------------
  // Temporada / Jogos (Liga)
  // -----------------------------

  function ensureSeason(save) {
    if (!save.season) save.season = {};
    if (save.season.id && save.season.leagueId && Array.isArray(save.season.rounds)) return;

    const club = getClub(save.career.clubId);
    const leagueId = club?.leagueId || 'BRA_SERIE_A';
    const clubs = ((save.world?.clubs) || (state.packData?.clubs?.clubs) || []).filter(c => c.leagueId === leagueId);
    const clubIds = clubs.map(c => c.id);
    const rounds = generateDoubleRoundRobin(clubIds);
    const table = buildEmptyTable(clubs);

    // Tenta extrair o ano a partir do id (ex.: 2025_2026)
    const defaultId = (state.packData?.seasons?.seasons || []).find(s => s.default)?.id || '2025_2026';
    const m = String(defaultId).match(/^(\d{4})[\-_](\d{4})$/);
    const yearStart = m ? Number(m[1]) : 2025;
    const yearEnd = m ? Number(m[2]) : (yearStart + 1);

    save.season = {
      id: defaultId,
      yearStart,
      yearEnd,
      leagueId,
      currentRound: 0,
      rounds,
      table,
      completed: false,
      summary: null
    };
  }

  // -----------------------------
  // Fim de temporada (Parte 1)
  // -----------------------------

  function nextSeasonIdFrom(currentId, fallbackStart = 2025) {
    const s = String(currentId || '');
    const m = s.match(/^(\d{4})[\-_](\d{4})$/);
    const ys = m ? Number(m[1]) + 1 : (fallbackStart + 1);
    const ye = m ? Number(m[2]) + 1 : (ys + 1);
    return { id: `${ys}_${ye}`, yearStart: ys, yearEnd: ye };
  }

  function finalizeSeasonIfNeeded(save) {
    ensureSeason(save);
    const rounds = save.season.rounds || [];
    if (save.season.completed) return false;
    if ((save.season.currentRound || 0) < rounds.length) return false;

    const rows = sortTableRows(Object.values(save.season.table || {}));
    const championId = rows[0]?.id || null;
    const userPos = rows.findIndex(x => x.id === save.career.clubId) + 1;

    save.season.completed = true;
    save.season.completedAt = nowIso();
    save.season.summary = {
      championId,
      championName: getClub(championId)?.name || championId,
      userPos,
      userPts: rows.find(x => x.id === save.career.clubId)?.Pts ?? null,
      totalRounds: rounds.length
    };

    if (!save.progress) save.progress = {};
    if (!Array.isArray(save.progress.seasons)) save.progress.seasons = [];
    save.progress.seasons.push({
      id: save.season.id,
      yearStart: save.season.yearStart,
      yearEnd: save.season.yearEnd,
      leagueId: save.season.leagueId,
      championId,
      userClubId: save.career.clubId,
      userPos,
      finishedAt: save.season.completedAt
    });

    // Atualiza resumo do slot
    const league = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId);
    const club = getClub(save.career.clubId);
    save.meta.summary = `Carreira • ${club?.name || 'Clube'} • ${league?.name || save.season.leagueId} • ${save.season.id}`;

    // Snapshot da tabela desta liga para promoções/rebaixamentos e histórico
    try {
      const store = ensureLeagueTableStore(save);
      store[save.season.leagueId] = rows.map(r => ({ ...r }));
    } catch {}

    // Promoção/Rebaixamento Brasil (A<->B) nesta atualização
    if (save.season.leagueId === 'BRA_SERIE_A' || save.season.leagueId === 'BRA_SERIE_B') {
      applyBrazilPromotionRelegation(save);
    }



  // -----------------------------
  // Promoção/Rebaixamento + Zonas (Parte 2)
  // -----------------------------

  function getBrazilZonesForLeague(leagueId) {
    const q = state.packData?.qualifications || {};
    const br = q.brazil || {};
    if (leagueId === 'BRA_SERIE_A') return br.serieA || null;
    if (leagueId === 'BRA_SERIE_B') return br.serieB || null;
    return null;
  }

  function zoneInfoForPosition(leagueId, position) {
    const zones = getBrazilZonesForLeague(leagueId);
    if (!zones) return null;

    // Série A
    if (leagueId === 'BRA_SERIE_A') {
      if (position >= zones.libertadores?.from && position <= zones.libertadores?.to) {
        return { key: 'lib', label: 'LIB', cls: 'zone-lib' };
      }
      if (position >= zones.sudamericana?.from && position <= zones.sudamericana?.to) {
        return { key: 'sula', label: 'SULA', cls: 'zone-sula' };
      }
      if (position >= zones.relegation?.from && position <= zones.relegation?.to) {
        return { key: 'z4', label: 'Z4', cls: 'zone-z4' };
      }
    }

    // Série B
    if (leagueId === 'BRA_SERIE_B') {
      if (position >= zones.promotion?.from && position <= zones.promotion?.to) {
        return { key: 'up', label: 'SUBE', cls: 'zone-up' };
      }
      // Rebaixamento da B (default: 17-20, se não existir no JSON)
      const relFrom = zones.relegation?.from ?? 17;
      const relTo = zones.relegation?.to ?? 20;
      if (position >= relFrom && position <= relTo) {
        return { key: 'z4', label: 'Z4', cls: 'zone-z4' };
      }
    }

    return null;
  }

  function ensureLeagueTableStore(save) {
    if (!save.progress) save.progress = {};
    if (!save.progress.leagueTables) save.progress.leagueTables = {};
    const sid = save.season?.id || 'unknown';
    if (!save.progress.leagueTables[sid]) save.progress.leagueTables[sid] = {};
    return save.progress.leagueTables[sid];
  }

  function simulateLeagueSeason(save, leagueId) {
    // Simulação rápida offline para ligas que o usuário não está jogando ativamente (MVP).
    // Isso viabiliza promoção/rebaixamento já nesta atualização.
    const store = ensureLeagueTableStore(save);
    if (store[leagueId]) return store[leagueId];

    const clubs = ((save.world?.clubs) || (state.packData?.clubs?.clubs) || []).filter(c => c.leagueId === leagueId);
    const ids = clubs.map(c => c.id);

    // tabela vazia no formato esperado pelo app
    const table = buildEmptyTable(clubs);
    const rounds = generateDoubleRoundRobin(ids);

    // simula todas as rodadas com placares simples
    for (const matches of rounds) {
      for (const m of matches) {
        const hg = Math.max(0, Math.round(Math.random() * 3));
        const ag = Math.max(0, Math.round(Math.random() * 3));
        applyResultToTable(table, m.homeId, m.awayId, hg, ag);
      }
    }
    const rows = sortTableRows(Object.values(table));
    store[leagueId] = rows.map(r => ({ ...r })); // snapshot
    return store[leagueId];
  }

  function applyBrazilPromotionRelegation(save) {
    const q = state.packData?.qualifications || {};
    const map = Array.isArray(q.mapping) ? q.mapping : [];
    const entryA = map.find(x => x.competition === 'BRA_SERIE_A');
    // Usa regras do JSON; fallback para 4/4
    const relegPosA = entryA?.nextSeasonEffects?.relegation?.positions || [17,18,19,20];
    const promoteFromB = (q.brazil?.serieB?.promotion) ? null : null; // (mantido para compatibilidade)

    // Precisamos das duas tabelas
    const tableStore = ensureLeagueTableStore(save);

    // tabela da liga que o usuário jogou
    const rowsA = tableStore['BRA_SERIE_A'] || (save.season?.leagueId === 'BRA_SERIE_A'
      ? sortTableRows(Object.values(save.season.table || {}))
      : simulateLeagueSeason(save, 'BRA_SERIE_A'));

    const rowsB = tableStore['BRA_SERIE_B'] || (save.season?.leagueId === 'BRA_SERIE_B'
      ? sortTableRows(Object.values(save.season.table || {}))
      : simulateLeagueSeason(save, 'BRA_SERIE_B'));

    tableStore['BRA_SERIE_A'] = rowsA.map(r => ({...r}));
    tableStore['BRA_SERIE_B'] = rowsB.map(r => ({...r}));

    if (!rowsA?.length || !rowsB?.length) return;

    // Rebaixados da A: posições 17-20 (4)
    const rebaixados = relegPosA.map(p => rowsA[p-1]?.id).filter(Boolean);
    // Promovidos da B: posições 1-4 (4)
    const promovidos = [1,2,3,4].map(p => rowsB[p-1]?.id).filter(Boolean);

    if (rebaixados.length !== 4 || promovidos.length !== 4) return;

    // Atualiza liga dos clubes no mundo salvo
    const wc = save.world?.clubs;
    if (!Array.isArray(wc)) return;

    for (const id of rebaixados) {
      const c = wc.find(x => x.id === id);
      if (c) c.leagueId = 'BRA_SERIE_B';
    }
    for (const id of promovidos) {
      const c = wc.find(x => x.id === id);
      if (c) c.leagueId = 'BRA_SERIE_A';
    }

    // Log de movimentações
    if (!Array.isArray(save.progress.movements)) save.progress.movements = [];
    save.progress.movements.push({
      seasonId: save.season.id,
      at: nowIso(),
      type: 'BRA_A_B_SWAP',
      relegatedFromA: rebaixados,
      promotedFromB: promovidos
    });
  }
    return true;
  }

  function startNewSeason(save) {
    ensureSystems(save);
    ensureSeason(save);

    // Avança ano/season id
    const next = nextSeasonIdFrom(save.season.id, save.season.yearStart || 2025);
    const leagueId = getClub(save.career.clubId)?.leagueId || save.season.leagueId;
    const clubs = ((save.world?.clubs) || (state.packData?.clubs?.clubs) || []).filter(c => c.leagueId === leagueId);
    const clubIds = clubs.map(c => c.id);

    save.season = {
      id: next.id,
      yearStart: next.yearStart,
      yearEnd: next.yearEnd,
      leagueId,
      currentRound: 0,
      rounds: generateDoubleRoundRobin(clubIds),
      table: buildEmptyTable(clubs),
      completed: false,
      summary: null
    };

    save.meta.updatedAt = nowIso();
  }

  function generateDoubleRoundRobin(teamIds) {
    // Circle method (single round)
    const teams = [...teamIds];
    if (teams.length % 2 === 1) teams.push('__BYE__');
    const n = teams.length;
    const half = n / 2;
    const rounds = [];
    let arr = teams.slice();
    for (let r = 0; r < n - 1; r++) {
      const matches = [];
      for (let i = 0; i < half; i++) {
        const home = arr[i];
        const away = arr[n - 1 - i];
        if (home !== '__BYE__' && away !== '__BYE__') {
          matches.push({ homeId: home, awayId: away, played: false, hg: 0, ag: 0 });
        }
      }
      rounds.push(matches);
      // rotate
      const fixed = arr[0];
      const rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr = [fixed, ...rest];
    }
    // Second round: swap home/away
    const second = rounds.map(matches => matches.map(m => ({ homeId: m.awayId, awayId: m.homeId, played: false, hg: 0, ag: 0 })));
    return [...rounds, ...second];
  }

  function buildEmptyTable(clubs) {
    const table = {};
    clubs.forEach(c => {
      table[c.id] = { id: c.id, name: c.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
    });
    return table;
  }

  function sortTableRows(rows) {
    return rows.sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.name.localeCompare(b.name);
    });
  }

  function teamStrength(clubId, save) {
    const club = getClub(clubId);
    let base = Number(club?.overall || 60);
    // Usa forma real apenas para o clube do usuário (para manter leve)
    if (clubId === save.career.clubId && Array.isArray(save.squad?.players)) {
      const formAvg = save.squad.players.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, save.squad.players.length);
      base += formAvg;
    } else {
      base += (Math.random() * 2 - 1); // pequena variação
    }
    return base;
  }

  function simulateMatch(homeId, awayId, save) {
    // Simulação mais realista (Poisson) com vantagem de mando e força relativa
    const h = teamStrength(homeId, save);
    const a = teamStrength(awayId, save);
    const advantage = 1.6; // mando de campo
    const diff = (h + advantage) - a;

    // converte diferença de força em expectativa de gols
    const base = 1.25;
    const lamHome = clampFloat(base + (diff / 18), 0.2, 3.2);
    const lamAway = clampFloat(base - (diff / 22), 0.2, 3.0);

    const hg = clampInt(poisson(lamHome), 0, 7);
    const ag = clampInt(poisson(lamAway), 0, 7);

    // Pequena variância extra em jogos desequilibrados
    return { hg, ag, lamHome: round2(lamHome), lamAway: round2(lamAway) };
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function clampFloat(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  // Poisson (Knuth)
  function poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  function randNormal(mean, std) {
    // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
  }

  function clampInt(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  // -----------------------------
  // UI helpers (logos)
  // -----------------------------
  function clubInitials(club) {
    const s = (club?.short || club?.name || club?.id || 'CLB').trim();
    return s.slice(0, 3).toUpperCase();
  }

  function clubLogoHtml(clubId, size = 34) {
    const c = getClub(clubId);
    const initials = clubInitials(c);
    const s = Number(size) || 34;
    // ... try PNG -> SVG -> fallback initials
    return `
      <div class="club-logo" style="width:${s}px;height:${s}px;border-radius:14px;">
        <img src="./assets/logos/${esc(clubId)}.png" alt="${esc(c?.name || clubId)}"
          onerror="if(!this.dataset.svgTried){this.dataset.svgTried='1';this.src='./assets/logos/${esc(clubId)}.svg';return;} this.remove(); this.parentElement.innerHTML='<div class=\"club-fallback\">${esc(initials)}</div>';">
      </div>
    `;
  }

  function applyResultToTable(table, homeId, awayId, hg, ag) {
    const home = table[homeId];
    const away = table[awayId];
    if (!home || !away) return;
    home.P += 1; away.P += 1;
    home.GF += hg; home.GA += ag;
    away.GF += ag; away.GA += hg;
    home.GD = home.GF - home.GA;
    away.GD = away.GF - away.GA;
    if (hg > ag) { home.W += 1; home.Pts += 3; away.L += 1; }
    else if (hg < ag) { away.W += 1; away.Pts += 3; home.L += 1; }
    else { home.D += 1; away.D += 1; home.Pts += 1; away.Pts += 1; }
  }

  function viewMatches() {
    return requireSave((save) => {
      ensureSystems(save);
      ensureSeason(save);
      const club = getClub(save.career.clubId);
      const league = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId);
      const totalRounds = save.season.rounds.length;
      const r = save.season.currentRound;

      const rows = sortTableRows(Object.values(save.season.table));
      const userPos = rows.findIndex(x => x.id === save.career.clubId) + 1;

      const nextRoundMatches = save.season.rounds[r] || [];
      const lastRoundIndex = Number.isFinite(save.season.lastRoundPlayed) ? save.season.lastRoundPlayed : -1;
      const lastResults = Array.isArray(save.season.lastResults) ? save.season.lastResults : [];

      function resultBadge(m) {
        const isUser = (m.homeId === save.career.clubId || m.awayId === save.career.clubId);
        if (!isUser || !m.played) return '';
        const userHome = m.homeId === save.career.clubId;
        const ug = userHome ? m.hg : m.ag;
        const og = userHome ? m.ag : m.hg;
        if (ug > og) return `<span class="badge" style="border-color: rgba(34,197,94,.45); color:#c9ffd8">VITÓRIA</span>`;
        if (ug < og) return `<span class="badge" style="border-color: rgba(239,68,68,.45); color:#ffd1d1">DERROTA</span>`;
        return `<span class="badge" style="border-color: rgba(245,158,11,.45); color:#ffe7b3">EMPATE</span>`;
      }

      function matchRow(m, subtitle) {
        const hc = getClub(m.homeId);
        const ac = getClub(m.awayId);
        const score = m.played ? `<b style="font-size:16px">${m.hg} x ${m.ag}</b>` : `<span class="badge">Não jogado</span>`;
        const xg = (m.played && (m.xgH != null) && (m.xgA != null)) ? `<div class="small">xG ${m.xgH} • ${m.xgA}</div>` : '';
        const isUser = (m.homeId === save.career.clubId || m.awayId === save.career.clubId);
        const outline = isUser ? ' style="outline:1px solid rgba(34,197,94,.40)"' : '';
        return `
          <div class="item"${outline}>
            <div class="item-left" style="display:flex; gap:10px; align-items:center;">
              ${clubLogoHtml(m.homeId, 34)}
              <div style="min-width:0;">
                <div class="item-title">${esc(hc?.short || hc?.name || m.homeId)} <span class="small">vs</span> ${esc(ac?.short || ac?.name || m.awayId)}</div>
                <div class="item-sub">${esc(subtitle)} ${xg}</div>
              </div>
              ${clubLogoHtml(m.awayId, 34)}
            </div>
            <div class="item-right" style="align-items:center;">
              ${resultBadge(m)}
              ${score}
            </div>
          </div>
        `;
      }

      const lastBlock = lastResults.length
        ? `<div class="card" style="margin-bottom:12px;">
             <div class="card-header"><div><div class="card-title">Resultados da Rodada ${lastRoundIndex + 1}</div><div class="card-subtitle">Resumo da última rodada jogada</div></div></div>
             <div class="card-body"><div class="list">${lastResults.map(m => matchRow(m, 'Rodada ' + (lastRoundIndex + 1) + '/' + totalRounds)).join('')}</div></div>
           </div>`
        : `<div class="notice">Nenhum resultado ainda. Clique em <b>Jogar Próxima Rodada</b>.</div>`;

      const nextBlock = nextRoundMatches.length
        ? `<div class="card">
             <div class="card-header"><div><div class="card-title">Próxima Rodada ${Math.min(r + 1, totalRounds)}</div><div class="card-subtitle">Partidas agendadas</div></div></div>
             <div class="card-body"><div class="list">${nextRoundMatches.map(m => matchRow(m, 'Rodada ' + (r + 1) + '/' + totalRounds)).join('')}</div></div>
           </div>`
        : (() => {
            // Se chegamos no fim, fecha a temporada (caso ainda não tenha sido marcado)
            finalizeSeasonIfNeeded(save);
            const sum = save.season.summary;
            if (!save.season.completed || !sum) {
              return `<div class="notice">Temporada encerrada.</div>`;
            }
            const champClub = getClub(sum.championId);
            const leagueName = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId)?.name || save.season.leagueId;
            return `
              <div class="card">
                <div class="card-header">
                  <div>
                    <div class="card-title">Fim da Temporada ${esc(save.season.id)}</div>
                    <div class="card-subtitle">${esc(leagueName)} • Campeão: <b>${esc(champClub?.name || sum.championName || '')}</b></div>
                  </div>
                  <span class="badge">Sua posição: ${sum.userPos || '-'}</span>
                </div>
                <div class="card-body">
                  <div class="row" style="align-items:center; gap:10px;">
                    ${sum.championId ? clubLogoHtml(sum.championId, 40) : ''}
                    <div class="small">Temporada concluída em ${esc(new Date(save.season.completedAt).toLocaleDateString('pt-BR'))}</div>
                  </div>
                  <div class="sep"></div>
                  <button class="btn btn-primary" data-action="startNewSeason">Iniciar Nova Temporada</button>
                </div>
              </div>
            `;
          })();

      writeSlot(state.settings.activeSlotId, save);

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Jogos e Calendário</div>
              <div class="card-subtitle">${esc(league?.name || save.season.leagueId)} • ${esc(club?.name || '')} • Posição atual: <b>${userPos || '-'}</b></div>
            </div>
            <span class="badge">Rodada ${Math.min(r+1, totalRounds)}/${totalRounds}</span>
          </div>
          <div class="card-body">
            <div class="row">
              <button class="btn btn-primary" data-action="playNextRound" ${r >= totalRounds ? 'disabled' : ''}>Jogar Próxima Rodada</button>
              ${r >= totalRounds ? `<button class="btn btn-primary" data-action="startNewSeason">Nova Temporada</button>` : ''}
              <button class="btn" data-go="/competitions">Ver Tabela</button>
              <button class="btn" data-go="/hub">Voltar</button>
            </div>
            <div class="sep"></div>
            ${lastBlock}
            ${nextBlock}
          </div>
        </div>
      `;
    });
  }

  function viewCompetitions() {
    return requireSave((save) => {
      ensureSystems(save);
      ensureSeason(save);
      const club = getClub(save.career.clubId);
      const league = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId);
      const rows = sortTableRows(Object.values(save.season.table));

      const tableHtml = rows.map((t, idx) => {
        const pos = idx + 1;
        const zone = zoneInfoForPosition(save.season.leagueId, pos);
        const zonePill = zone ? `<span class="pill ${zone.cls}" title="${esc(zone.label)}">${esc(zone.label)}</span>` : '';
        const mark = t.id === save.career.clubId ? ' style="outline:1px solid rgba(34,197,94,.45)"' : '';
        const trClass = zone ? ` class="${zone.cls}"` : '';
        return `
          <tr${trClass}${mark}>
            <td style="display:flex; align-items:center; gap:10px;">
              <span>${pos}</span>
              ${zonePill}
            </td>
            <td>
              <div class="club-cell">
                ${clubLogoHtml(t.id, 26)}
                <span class="club-name">${esc(t.name)}</span>
              </div>
            </td>
            <td class="right">${t.P}</td>
            <td class="right">${t.W}</td>
            <td class="right">${t.D}</td>
            <td class="right">${t.L}</td>
            <td class="right">${t.GF}</td>
            <td class="right">${t.GA}</td>
            <td class="right">${t.GD}</td>
            <td class="right"><b>${t.Pts}</b></td>
          </tr>
        `;
      }).join('');

      writeSlot(state.settings.activeSlotId, save);

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Competições</div>
              <div class="card-subtitle">Tabela da liga • ${esc(league?.name || save.season.leagueId)} • ${esc(club?.name || '')}</div>
            </div>
            <span class="badge">Rodada ${save.season.currentRound+1}</span>
          </div>
          <div class="card-body">
            <div class="notice">Zonas: <span class="pill zone-lib">LIB</span> <span class="pill zone-sula">SULA</span> <span class="pill zone-up">SUBE</span> <span class="pill zone-z4">Z4</span> • Copas/continentais entram na próxima atualização.</div>
            <div class="sep"></div>
            <table class="table">
              <thead>
                <tr>
                  <th>#</th><th>Clube</th><th class="right">J</th><th class="right">V</th><th class="right">E</th><th class="right">D</th>
                  <th class="right">GP</th><th class="right">GC</th><th class="right">SG</th><th class="right">Pts</th>
                </tr>
              </thead>
              <tbody>${tableHtml}</tbody>
            </table>
            <div class="sep"></div>
            <div class="row">
              <button class="btn btn-primary" data-go="/matches">Voltar aos Jogos</button>
              <button class="btn" data-go="/hub">HUB</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  function viewFinance() {
    return requireSave((save) => {
      ensureSystems(save);
      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cash = save.finance?.cash || 0;
      const sponsor = save.sponsorship?.current;
      const staffCost = (save.staff?.hired || []).reduce((s, st) => s + (st.salary || 0), 0);
      const sponsorWeekly = sponsor?.weekly || 0;
      const sponsorName = sponsor?.name || 'Nenhum';
      writeSlot(state.settings.activeSlotId, save);
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Finanças</div>
              <div class="card-subtitle">Resumo do clube • receitas e custos</div>
            </div>
            <span class="badge">Caixa: ${cash.toLocaleString('pt-BR', { style: 'currency', currency })}</span>
          </div>
          <div class="card-body">
            <div class="kv"><span>Patrocínio atual</span><b>${esc(sponsorName)}</b></div>
            <div style="height:10px"></div>
            <div class="kv"><span>Receita semanal (patrocínio)</span><b>${sponsorWeekly.toLocaleString('pt-BR', { style: 'currency', currency })}</b></div>
            <div style="height:10px"></div>
            <div class="kv"><span>Custo semanal (staff)</span><b>${staffCost.toLocaleString('pt-BR', { style: 'currency', currency })}</b></div>
            <div class="sep"></div>
            <div class="notice">Receitas e custos semanais são aplicados automaticamente quando você usa <b>Treinos</b> (Aplicar) ou joga uma <b>Rodada</b> no calendário.</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/hub">Voltar</button>
          </div>
        </div>
      `;
    });
  }

  /** Salvar progresso */
  function viewSave() {
    return requireSave((save) => {
      save.meta.updatedAt = nowIso();
      writeSlot(state.settings.activeSlotId, save);
      return `
        <div class="card">
          <div class="card-body">
            <div class="notice">Jogo salvo com sucesso!</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/hub">Voltar ao HUB</button>
          </div>
        </div>
      `;
    });
  }

  /** Staff: contratação e demissão */
  function viewStaff() {
    return requireSave((save) => {
      ensureSystems(save);
      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cashStr = (save.finance?.cash || 0).toLocaleString('pt-BR', { style: 'currency', currency });
      const hiredIds = new Set((save.staff?.hired || []).map((st) => st.id));
      const rows = STAFF_CATALOG.map((st) => {
        const isHired = hiredIds.has(st.id);
        const salaryStr = (st.salary || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        return `
          <tr>
            <td>${esc(st.name)}</td>
            <td>${esc(st.description)}</td>
            <td class="right">${salaryStr}</td>
            <td class="center">
              <button class="btn ${isHired ? 'btn-danger' : 'btn-primary'}" data-action="${isHired ? 'fireStaff' : 'hireStaff'}" data-staff="${esc(st.id)}">
                ${isHired ? 'Demitir' : 'Contratar'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Staff</div>
              <div class="card-subtitle">Gerencie sua equipe de suporte</div>
            </div>
            <span class="badge">Caixa: ${cashStr}</span>
          </div>
          <div class="card-body">
            <table class="table">
              <thead><tr><th>Staff</th><th>Descrição</th><th class="right">Salário</th><th class="center">Ação</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/hub">Voltar</button>
          </div>
        </div>
      `;
    });
  }

  /** Patrocínios: escolher e cancelar */
  function viewSponsorship() {
    return requireSave((save) => {
      ensureSystems(save);
      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cashStr = (save.finance?.cash || 0).toLocaleString('pt-BR', { style: 'currency', currency });
      const current = save.sponsorship?.current || null;
      // Se houver patrocinador atual, mostra dados e opção de cancelar
      if (current) {
        const upfrontStr = (current.cashUpfront || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const weeklyStr = (current.weekly || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        return `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Patrocínio Atual</div>
                <div class="card-subtitle">${esc(current.name)}</div>
              </div>
              <span class="badge">Caixa: ${cashStr}</span>
            </div>
            <div class="card-body">
              <div class="notice success">
                Você recebe ${weeklyStr}/semana e já recebeu ${upfrontStr} de aporte inicial.
              </div>
              <div class="sep"></div>
              <button class="btn btn-danger" data-action="cancelSponsor">Encerrar contrato</button>
              <div class="sep"></div>
              <button class="btn" data-go="/hub">Voltar</button>
            </div>
          </div>
        `;
      }
      // Caso não haja patrocinador, lista opções disponíveis
      const items = SPONSOR_CATALOG.map((sp) => {
        const upfrontStr = (sp.cashUpfront || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const weeklyStr = (sp.weekly || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        return `
          <div class="item">
            <div class="item-left">
              <div class="item-title">${esc(sp.name)}</div>
              <div class="item-sub">Aporte: ${upfrontStr} • Semanal: ${weeklyStr}</div>
              <div class="small">${esc(sp.description)}</div>
            </div>
            <div class="item-right">
              <button class="btn btn-primary" data-action="signSponsor" data-sponsor="${esc(sp.id)}">Assinar</button>
            </div>
          </div>
        `;
      }).join('');
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Patrocínios</div>
              <div class="card-subtitle">Escolha um patrocinador</div>
            </div>
            <span class="badge">Caixa: ${cashStr}</span>
          </div>
          <div class="card-body">
            <div class="list">${items}</div>
            <div class="sep"></div>
            <button class="btn" data-go="/hub">Voltar</button>
          </div>
        </div>
      `;
    });
  }

  /** Transferências: mercado de jogadores */
  function viewTransfers() {
    return requireSave((save) => {
      ensureSystems(save);
      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cashStr = (save.finance?.cash || 0).toLocaleString('pt-BR', { style: 'currency', currency });
      const players = state.packData?.players?.players || [];
      const ownedIds = new Set((save.squad?.players || []).map((p) => p.id));
      const bought = new Set(save.transfers?.bought || []);
      const q = save.transfers?.search || '';
      const filterPos = save.transfers?.filterPos || 'ALL';
      // Filtra jogadores não pertencentes ao clube nem já comprados
      const filtered = players
        .filter((p) => !ownedIds.has(p.id) && !bought.has(p.id))
        .filter((p) => filterPos === 'ALL' ? true : p.pos === filterPos)
        .filter((p) => {
          if (!q.trim()) return true;
          return p.name.toLowerCase().includes(q.trim().toLowerCase());
        })
        .sort((a, b) => b.overall - a.overall);
      const posOpts = ['ALL', 'GK', 'DEF', 'MID', 'ATT'].map((p) => `<option value="${p}" ${p === filterPos ? 'selected' : ''}>${p === 'ALL' ? 'Todos' : p}</option>`).join('');
      const rows = filtered.map((p) => {
        const priceStr = (p.value || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const affordable = (save.finance?.cash || 0) >= (p.value || 0);
        return `
          <tr>
            <td>${esc(p.name)}</td>
            <td class="center">${esc(p.pos)}</td>
            <td class="center">${esc(p.age)}</td>
            <td class="center">${esc(p.overall)}</td>
            <td class="right">${priceStr}</td>
            <td class="center">
              <button class="btn btn-primary" data-action="buyPlayer" data-pid="${esc(p.id)}" ${affordable ? '' : 'disabled'}>Comprar</button>
            </td>
          </tr>
        `;
      }).join('');
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Mercado de Transferências</div>
              <div class="card-subtitle">Filtre e compre jogadores</div>
            </div>
            <span class="badge">Caixa: ${cashStr}</span>
          </div>
          <div class="card-body">
            <div class="grid">
              <div class="col-6">
                <div class="label">Buscar jogador</div>
                <input class="input" value="${esc(q)}" placeholder="Ex: Silva" data-action="transferSearchInput" />
              </div>
              <div class="col-6">
                <div class="label">Filtrar posição</div>
                <select class="input" data-action="transferFilterPos">${posOpts}</select>
              </div>
            </div>
            <div class="sep"></div>
            <table class="table">
              <thead><tr><th>Nome</th><th class="center">Pos</th><th class="center">Idade</th><th class="center">OVR</th><th class="right">Valor</th><th class="center">Ação</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="6" class="mini">Nenhum jogador encontrado.</td></tr>`}</tbody>
            </table>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/hub">Voltar</button>
          </div>
        </div>
      `;
    });
  }

  /** Admin placeholder */
  function viewAdmin() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Admin</div></div>
        <div class="card-body">
          <div class="notice">Painel de administração será implementado em versões futuras.</div>
          <div class="sep"></div>
          <button class="btn btn-primary" data-go="/home">Menu</button>
        </div>
      </div>
    `;
  }

  /** Liga eventos interativos após renderização */
  function bindEvents() {
    // Navegação via data-go
    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.getAttribute('data-go');
        if (target) location.hash = target;
      });
    });
    // Ações
    document.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.getAttribute('data-action');
      if (action === 'selectPack') {
        el.addEventListener('click', async () => {
          const packId = el.getAttribute('data-pack');
          state.settings.selectedPackId = packId;
          saveSettings();
          await loadPackData();
          route();
        });
      }
      if (action === 'goSlots') {
        el.addEventListener('click', () => {
          location.hash = '/slots';
        });
      }
      if (action === 'newSlot') {
        el.addEventListener('click', () => {
          const slotId = Number(el.getAttribute('data-slot'));
          state.settings.activeSlotId = slotId;
          saveSettings();
          const pack = state.packs.find((p) => p.id === state.settings.selectedPackId);
          const save = {
            meta: { createdAt: nowIso(), updatedAt: nowIso(), summary: `Carreira • ${pack?.name || state.settings.selectedPackId}` },
            career: { coachName: '', nationality: 'Brasil', clubId: null, leagueFilter: '', clubSearch: '' },
            squad: {}, tactics: {}, training: {},
            progress: {}
          };
          writeSlot(slotId, save);
          location.hash = '/career-create';
        });
      }
      if (action === 'continueSlot') {
        el.addEventListener('click', () => {
          const slotId = Number(el.getAttribute('data-slot'));
          const existing = readSlot(slotId);
          if (existing) {
            state.settings.activeSlotId = slotId;
            saveSettings();
            location.hash = existing.career?.clubId ? '/hub' : '/career-create';
          }
        });
      }
      if (action === 'deleteSlot') {
        el.addEventListener('click', () => {
          const slotId = Number(el.getAttribute('data-slot'));
          clearSlot(slotId);
          route();
        });
      }
      if (action === 'careerContinueToClub') {
        el.addEventListener('click', () => {
          location.hash = '/club-pick';
        });
      }
      if (action === 'setLeagueFilter') {
        el.addEventListener('change', () => {
          const save = activeSave();
          if (!save) return;
          save.career.leagueFilter = el.value;
          save.career.clubSearch = '';
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'clubSearchInput') {
        el.addEventListener('input', () => {
          const save = activeSave();
          if (!save) return;
          save.career.clubSearch = el.value;
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'pickClub') {
        el.addEventListener('click', () => {
          const clubId = el.getAttribute('data-club');
          const save = activeSave();
          if (!save) return;
          save.career.clubId = clubId;
          save.meta.updatedAt = nowIso();
          save.meta.summary = `Carreira • ${getClub(clubId)?.name || 'Clube'}`;
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'confirmClub') {
        el.addEventListener('click', () => {
          location.hash = '/tutorial';
        });
      }
      if (action === 'finishTutorial') {
        el.addEventListener('click', () => {
          location.hash = '/hub';
        });
      }
      if (action === 'setFormation') {
        el.addEventListener('change', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.tactics.formation = el.value;
          save.tactics.startingXI = buildDefaultXI(save.squad.players, save.tactics.formation);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'autoPickXI') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.tactics.startingXI = buildDefaultXI(save.squad.players, save.tactics.formation);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'setTrainingPlan') {
        el.addEventListener('change', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.training.weekPlan = el.value;
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
        });
      }
      if (action === 'applyTraining') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          const plan = save.training.weekPlan;
          // Define o bônus base de acordo com o plano
          let base = 0.5;
          if (plan === 'Leve') base = 0.3;
          if (plan === 'Intenso') base = 0.8;
          // Calcula o efeito dos staff contratados (bônus adicional e multiplicador)
          const { extra, multiplier } = computeStaffTraining(save);
          const boost = (base + extra) * multiplier;
          // Aplica o bônus de forma a todos os jogadores do elenco
          save.squad.players = save.squad.players.map((p) => {
            const delta = Math.random() * boost;
            const newForm = Math.max(-5, Math.min(5, (p.form || 0) + delta));
            return { ...p, form: Math.round(newForm * 10) / 10 };
          });
          // Acumula bônus total de forma no save
          save.training.formBoost = (save.training.formBoost || 0) + boost;
          // Atualiza finanças: calcula despesas semanais e receitas de patrocínio
          let weeklyCost = 0;
          try {
            const econ = state.packData?.rules?.economy;
            weeklyCost += econ?.weeklyCosts?.staff || 0;
            weeklyCost += econ?.weeklyCosts?.maintenance || 0;
          } catch {}
          // soma salários de staff contratados
          if (Array.isArray(save.staff?.hired)) {
            weeklyCost += save.staff.hired.reduce((s, st) => s + (st.salary || 0), 0);
          }
          // receitas de patrocínio semanal
          let sponsorIncome = 0;
          if (save.sponsorship?.current) {
            sponsorIncome += save.sponsorship.current.weekly || 0;
          }
          // atualiza caixa
          if (!save.finance) save.finance = { cash: 0 };
          save.finance.cash = (save.finance.cash || 0) + sponsorIncome - weeklyCost;
          // garante que caixa não fique negativo por questões de simplicidade
          if (save.finance.cash < 0) save.finance.cash = 0;
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          alert(`Treino ${plan} aplicado! Bônus total: ${boost.toFixed(2)}. Receita ${sponsorIncome.toLocaleString('pt-BR', { style: 'currency', currency: state.packData?.rules?.gameRules?.currency || 'BRL' })}, despesas ${weeklyCost.toLocaleString('pt-BR', { style: 'currency', currency: state.packData?.rules?.gameRules?.currency || 'BRL' })}.`);
          route();
        });
      }

      // --- Staff
      if (action === 'hireStaff') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          const staffId = el.getAttribute('data-staff');
          const st = STAFF_CATALOG.find(s => s.id === staffId);
          if (!st) return;
          // contrata se não existir
          const hired = save.staff.hired || [];
          if (hired.find(x => x.id === st.id)) return;
          hired.push({ ...st });
          save.staff.hired = hired;
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'fireStaff') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          const staffId = el.getAttribute('data-staff');
          save.staff.hired = (save.staff.hired || []).filter(x => x.id !== staffId);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

      // --- Patrocínio
      if (action === 'signSponsor') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          const sponsorId = el.getAttribute('data-sponsor');
          const sp = SPONSOR_CATALOG.find(s => s.id === sponsorId);
          if (!sp) return;
          save.sponsorship.current = { ...sp };
          // aplica aporte inicial
          if (!save.finance) save.finance = { cash: 0 };
          save.finance.cash = (save.finance.cash || 0) + (sp.cashUpfront || 0);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'cancelSponsor') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.sponsorship.current = null;
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

      // --- Transferências
      if (action === 'transferSearchInput') {
        el.addEventListener('input', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.transfers.search = el.value || '';
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'transferFilterPos') {
        el.addEventListener('change', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          save.transfers.filterPos = el.value || 'ALL';
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
      if (action === 'buyPlayer') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          const pid = el.getAttribute('data-pid');
          const p = (state.packData?.players?.players || []).find(x => x.id === pid);
          if (!p) return;
          const price = Number(p.value || 0);
          if (!save.finance) save.finance = { cash: 0 };
          if ((save.finance.cash || 0) < price) return;
          save.finance.cash = (save.finance.cash || 0) - price;
          save.squad.players.push({ ...p, clubId: save.career.clubId, source: 'transfer' });
          if (!save.transfers.bought) save.transfers.bought = [];
          save.transfers.bought.push(pid);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

      // --- Jogos
      if (action === 'playNextRound') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          ensureSeason(save);
          const r = save.season.currentRound;
          const rounds = save.season.rounds || [];
          if (r >= rounds.length) return;

          const matches = rounds[r];
          matches.forEach(m => {
            if (m.played) return;
            const sim = simulateMatch(m.homeId, m.awayId, save);
            m.hg = sim.hg; m.ag = sim.ag; m.played = true;
            // xG simplificado para exibir no resumo
            m.xgH = sim.lamHome;
            m.xgA = sim.lamAway;
            applyResultToTable(save.season.table, m.homeId, m.awayId, m.hg, m.ag);
          });

          // Guarda o resumo da rodada jogada (para exibir resultados)
          save.season.lastRoundPlayed = r;
          save.season.lastResults = (matches || []).map(m => ({ ...m }));

          // receitas/ custos semanais ao jogar uma rodada
          const econ = state.packData?.rules?.economy || {};
          let weeklyCost = 0;
          weeklyCost += econ?.weeklyCosts?.staff || 0;
          weeklyCost += econ?.weeklyCosts?.maintenance || 0;
          weeklyCost += (save.staff?.hired || []).reduce((s, st) => s + (st.salary || 0), 0);
          const sponsorIncome = save.sponsorship?.current?.weekly || 0;
          if (!save.finance) save.finance = { cash: 0 };
          save.finance.cash = Math.max(0, (save.finance.cash || 0) + sponsorIncome - weeklyCost);

          save.season.currentRound += 1;

          // Se acabou a última rodada, fecha a temporada e gera resumo
          finalizeSeasonIfNeeded(save);

          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

      if (action === 'startNewSeason') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          ensureSeason(save);
          // só permite se a temporada atual terminou
          finalizeSeasonIfNeeded(save);
          if (!save.season.completed) return;
          startNewSeason(save);
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }
    });
  }

  /** Inicializa a aplicação */
  async function boot() {
    ensureSlots();
    await loadPacks();
    await loadPackData();
    if (!location.hash) location.hash = '/home';
    route();
  }

  boot();
  try { window.dispatchEvent(new Event('VFM_APP_READY')); } catch(e) {}

})();