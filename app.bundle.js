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
        splash.style.display = 'none';
        splash.setAttribute('aria-hidden','true');}, 600);
    }
  });

  // Failsafe: garante que o splash some mesmo em hosts com cache agressivo
  window.addEventListener("load", () => {
    const splash = document.getElementById("splash");
    if (splash) splash.style.display = "none";
  });

  /** Seleciona um elemento no DOM */
  const $ = (sel) => document.querySelector(sel);

  /** Navegação robusta: atualiza hash e força route() (evita "clique não faz nada" por cache/hash igual) */
  function navTo(path) {
    if (!path) return;
    const clean = String(path).startsWith("/") ? String(path) : ("/" + String(path).replace(/^#/, ""));
    const newHash = "#" + clean;
    if (location.hash !== newHash) location.hash = newHash;
    // força render imediato (alguns browsers/mobile podem atrasar hashchange)
    // NÃO engole erros: se uma view quebrar, mostramos um cartão de erro.
    route();
  }

  // Delegação global para data-go (não depende de bindEvents / re-render)
  document.addEventListener("click", (ev) => {
    const goEl = ev.target && ev.target.closest ? ev.target.closest("[data-go]") : null;
    if (goEl) {
      ev.preventDefault();
      const target = goEl.getAttribute("data-go");
      navTo(target);
    }
  });

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
        players: await tryLoad(files.players, { players: [] })
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

    const viewEl = document.getElementById("view");

    try {
      const html = view();
      if (viewEl) viewEl.innerHTML = html;
      bindEvents();
    } catch (err) {
      console.error("[VFM] Erro ao renderizar rota:", path, err);
      if (viewEl) {
        const msg = (err && (err.message || String(err))) ? (err.message || String(err)) : "Erro desconhecido";
        viewEl.innerHTML = `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Erro ao abrir a tela</div>
                <div class="card-subtitle">Rota: <b>${esc(path)}</b></div>
              </div>
              <span class="badge">Falha</span>
            </div>
            <div class="card-body">
              <div class="notice">⚠️ ${esc(msg)}</div>
              <div class="sep"></div>
              <div class="row">
                <button class="btn btn-primary" data-go="/home" type="button">Voltar ao Menu</button>
                <button class="btn" data-go="/hub" type="button">HUB</button>
              </div>
              <div class="sep"></div>
              <div class="small">Dica: se isso acontecer após atualizar, faça Ctrl+F5 ou limpe cache.</div>
            </div>
          </div>
        `;
      }
    }
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
    return cb(save);
  }

  /** Obtém clube pelo id a partir do pacote carregado */
  function getClub(id) {
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
    const baseLeagueId = club?.leagueId || 'BRA_SERIE_A';
    const leagueId = (save.world?.leagueOverrides?.[save.career.clubId]) || baseLeagueId;
    const clubs = (state.packData?.clubs?.clubs || []).filter(c => ((save.world?.leagueOverrides?.[c.id]) || c.leagueId) === leagueId);
    const clubIds = clubs.map(c => c.id);
    const rounds = generateDoubleRoundRobin(clubIds);
    const table = buildEmptyTable(clubs);

    save.season = {
      id: (state.packData?.seasons?.seasons || []).find(s => s.default)?.id || '2025_2026',
      leagueId,
      currentRound: 0,
      rounds,
      table
    };
  }


  // -----------------------------
  // Season Extensions (Cup + Continental + Promotion/Relegation)
  // -----------------------------
  function ensureSeasonExtensions(save) {
    if (!save.season) return;
    if (!save.season.ext) save.season.ext = {};
    const ext = save.season.ext;
    if (ext.initialized) return;

    const club = getClub(save.career.clubId);
    const leagueId = save.season.leagueId || club?.leagueId || 'BRA_SERIE_A';

    // Build Serie B simulation in background (for promotion/relegation)
    if (!ext.otherLeagues) ext.otherLeagues = {};
    if (!ext.otherLeagues.BRA_SERIE_B) {
      const bClubs = (state.packData?.clubs?.clubs || []).filter(c => c.leagueId === 'BRA_SERIE_B');
      const bIds = bClubs.map(c => c.id);
      if (bIds.length >= 2) {
        ext.otherLeagues.BRA_SERIE_B = {
          leagueId: 'BRA_SERIE_B',
          rounds: generateDoubleRoundRobin(bIds),
          currentRound: 0,
          table: buildEmptyTable(bClubs)
        };
      }
    }

    // Decide continental for first season (if no history): based on club ranking by overall in its league
    if (!ext.continental) ext.continental = { qualified: null, competitionId: null, group: null, table: null, matchesByWeek: {} };
    if (!ext.continental.qualified) {
      ext.continental.qualified = decideInitialContinentalQualification(save);
      ext.continental.competitionId = ext.continental.qualified; // 'LIBERTADORES' | 'SUDAMERICANA' | null
    }

    // Build Copa do Brasil (simplified) if Brazil league
    if (!ext.cups) ext.cups = {};
    if (!ext.cups.BRA_COPA_DO_BRASIL && (leagueId === 'BRA_SERIE_A' || leagueId === 'BRA_SERIE_B')) {
      ext.cups.BRA_COPA_DO_BRASIL = buildCopaDoBrasil(save);
    }

    // Build continental schedule only for user's team (lightweight)
    if (ext.continental.competitionId && !ext.continental.group) {
      buildContinentalForUser(save, ext.continental.competitionId);
    }

    // Precompute "events per league round" to show in calendar and allow sim
    ext.weekEvents = ext.weekEvents || {}; // { [weekIndex]: { cupMatchId?, continentalMatchIds? } }
    wireCupMatchesIntoWeeks(save);
    wireContinentalIntoWeeks(save);

    ext.initialized = true;
  }

  function decideInitialContinentalQualification(save) {
    // Only CONMEBOL for now (packs focam Brasil).
    // Se já existir histórico de vagas, respeita.
    const hist = save.history?.lastSeasonQualification;
    if (hist && (hist === 'LIBERTADORES' || hist === 'SUDAMERICANA')) return hist;

    const club = getClub(save.career.clubId);
    const leagueId = club?.leagueId || save.season.leagueId || 'BRA_SERIE_A';
    if (leagueId !== 'BRA_SERIE_A') return null;

    const clubs = (state.packData?.clubs?.clubs || []).filter(c => c.leagueId === 'BRA_SERIE_A');
    const sorted = [...clubs].sort((a,b) => (b.overall||0)-(a.overall||0));
    const pos = sorted.findIndex(c => c.id === save.career.clubId) + 1;
    if (pos >= 1 && pos <= 4) return 'LIBERTADORES';
    if (pos >= 5 && pos <= 10) return 'SUDAMERICANA';
    return null;
  }

  function buildCopaDoBrasil(save) {
    const all = (state.packData?.clubs?.clubs || []).filter(c => c.leagueId === 'BRA_SERIE_A' || c.leagueId === 'BRA_SERIE_B');
    // pick 32 teams, ensure user's club is included
    const userId = save.career.clubId;
    const pool = all.map(c => c.id).filter(id => id !== userId);
    shuffleInPlace(pool);
    const teams = [userId, ...pool].slice(0, 32);
    const bracket = {
      id: 'BRA_COPA_DO_BRASIL',
      name: 'Copa do Brasil',
      roundNames: ['32-avos','16-avos','Oitavas','Quartas','Semifinal','Final'],
      rounds: [],
      winner: null,
      eliminated: {}
    };

    // create rounds single match (simplified)
    let currentTeams = teams;
    for (let r = 0; r < bracket.roundNames.length; r++) {
      const matches = [];
      for (let i = 0; i < currentTeams.length; i += 2) {
        const homeId = currentTeams[i];
        const awayId = currentTeams[i+1];
        if (!awayId) continue;
        matches.push({ id: `CDB_${r}_${i/2}`, compId:'BRA_COPA_DO_BRASIL', roundIndex:r, homeId, awayId, played:false, hg:0, ag:0 });
      }
      bracket.rounds.push({ name: bracket.roundNames[r], matches });
      // next teams determined after playing, but we can pre-fill placeholders
      currentTeams = new Array(Math.ceil(currentTeams.length/2)).fill('__TBD__');
    }
    return bracket;
  }

  function buildContinentalForUser(save, compId) {
    const ext = save.season.ext;
    const userId = save.career.clubId;
    const club = getClub(userId);
    const name = compId === 'LIBERTADORES' ? 'CONMEBOL Libertadores' : 'CONMEBOL Sul-Americana';

    // generate 3 generic opponents (virtual) to avoid needing full DB
    const opps = [
      { id: `${compId}_V1`, name: 'Club Atlético Norte', short: 'CAN', overall: clampInt((club?.overall||70)-2, 55, 85) },
      { id: `${compId}_V2`, name: 'Deportivo Central', short: 'DCE', overall: clampInt((club?.overall||70)-4, 55, 85) },
      { id: `${compId}_V3`, name: 'Sporting del Sur', short: 'SDS', overall: clampInt((club?.overall||70)-1, 55, 85) }
    ];

    ext.continental.group = {
      id: 'G1',
      name: 'Grupo A',
      teams: [userId, ...opps.map(o => o.id)]
    };

    // standings table for group
    ext.continental.table = {};
    ext.continental.table[userId] = { id:userId, name: club?.name||userId, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 };
    opps.forEach(o => {
      ext.continental.table[o.id] = { id:o.id, name:o.name, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0, virtual:true, short:o.short, overall:o.overall };
    });

    // create 6 matchdays (double round robin among 4 teams but only simulate user's matches; other matches not needed)
    // We'll schedule user's matches across 6 weeks spread out
    const matchdays = [];
    const oppIds = opps.map(o => o.id);
    // 3 opponents, play each twice
    const pairings = [
      { home:userId, away: oppIds[0] },
      { home:oppIds[1], away: userId },
      { home:userId, away: oppIds[2] },
      { home:oppIds[0], away: userId },
      { home:userId, away: oppIds[1] },
      { home:oppIds[2], away: userId }
    ];
    pairings.forEach((p, i) => {
      matchdays.push({ id:`${compId}_MD${i+1}`, compId, stage:'GROUP', matchday:i+1, homeId:p.home, awayId:p.away, played:false, hg:0, ag:0 });
    });

    // place these matches later via wireContinentalIntoWeeks
    ext.continental.matches = matchdays;
    ext.continental.name = name;
  }

  function wireCupMatchesIntoWeeks(save) {
    const ext = save.season.ext;
    const cup = ext.cups?.BRA_COPA_DO_BRASIL;
    if (!cup) return;
    if (!ext.weekEvents) ext.weekEvents = {};

    // Map cup rounds into specific league rounds (weeks) to interleave:
    // Round of 32: week 3, 16: week 8, 8: week 13, QF: week 18, SF: week 25, Final: week 33
    const mapWeeks = [2,7,12,17,24,32]; // 0-based
    cup.rounds.forEach((r, idx) => {
      const w = mapWeeks[idx] ?? (idx*5);
      if (!ext.weekEvents[w]) ext.weekEvents[w] = { cupMatchIds: [], continentalMatchIds: [] };
      // Find user's match only, keep lightweight
      const userId = save.career.clubId;
      const m = r.matches.find(x => x.homeId === userId || x.awayId === userId);
      if (m) ext.weekEvents[w].cupMatchIds.push(m.id);
    });
  }

  function wireContinentalIntoWeeks(save) {
    const ext = save.season.ext;
    if (!ext.continental?.matches || !ext.continental?.competitionId) return;
    if (!ext.weekEvents) ext.weekEvents = {};

    // Spread 6 matchdays through season: weeks 4,6,10,14,20,28 (0-based)
    const weeks = [3,5,9,13,19,27];
    ext.continental.matches.forEach((m, idx) => {
      const w = weeks[idx] ?? (idx*4);
      if (!ext.weekEvents[w]) ext.weekEvents[w] = { cupMatchIds: [], continentalMatchIds: [] };
      ext.weekEvents[w].continentalMatchIds.push(m.id);
      // Also index by week for quick lookup
      ext.continental.matchesByWeek[w] = ext.continental.matchesByWeek[w] || [];
      ext.continental.matchesByWeek[w].push(m.id);
    });
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function findCupMatchById(save, id) {
    const cup = save.season?.ext?.cups?.BRA_COPA_DO_BRASIL;
    if (!cup) return null;
    for (const r of cup.rounds) {
      const m = r.matches.find(x => x.id === id);
      if (m) return m;
    }
    return null;
  }

  function findContinentalMatchById(save, id) {
    const c = save.season?.ext?.continental;
    if (!c || !Array.isArray(c.matches)) return null;
    return c.matches.find(x => x.id === id) || null;
  }

  function applyLeagueRulesSorting(rows, leagueId) {
    // Try to use rules.json if available; fallback to default.
    const rules = state.packData?.rules || {};
    const tbs = rules?.countries?.BRA?.leagues?.[leagueId]?.tiebreakers || rules?.universal?.tiebreakersDefault;
    const order = Array.isArray(tbs) ? tbs : ['points','goalDifference','goalsFor'];
    return rows.sort((a,b) => {
      for (const k of order) {
        if (k === 'points' && b.Pts !== a.Pts) return b.Pts - a.Pts;
        if (k === 'wins' && b.W !== a.W) return b.W - a.W;
        if (k === 'goalDifference' && b.GD !== a.GD) return b.GD - a.GD;
        if (k === 'goalsFor' && b.GF !== a.GF) return b.GF - a.GF;
        if (k === 'headToHead') continue;
        if (k === 'fairPlay') continue;
        if (k === 'drawLots') continue;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function seasonFinalizeIfEnded(save) {
    ensureSeason(save);
    ensureSeasonExtensions(save);

    const total = save.season.rounds.length;
    if (save.season.currentRound < total) return false;

    if (!save.history) save.history = {};
    if (!save.history.seasons) save.history.seasons = [];
    if (save.season.ext?.finalized) return true;

    // Compute final tables Serie A and Serie B (background)
    const aRows = applyLeagueRulesSorting(Object.values(save.season.table), 'BRA_SERIE_A');
    const bObj = save.season.ext?.otherLeagues?.BRA_SERIE_B;
    const bRows = bObj ? applyLeagueRulesSorting(Object.values(bObj.table), 'BRA_SERIE_B') : [];

    const relegated = aRows.slice(-4).map(x => x.id);
    const promoted = bRows.slice(0,4).map(x => x.id);

    save.history.seasons.push({
      seasonId: save.season.id,
      leagueId: save.season.leagueId,
      champion: aRows[0]?.id || null,
      relegated,
      promoted,
      endedAt: nowIso()
    });

    // Store qualification for next season (based on positions)
    const userPos = aRows.findIndex(x => x.id === save.career.clubId) + 1;
    let qual = null;
    if (save.season.leagueId === 'BRA_SERIE_A') {
      if (userPos >= 1 && userPos <= 4) qual = 'LIBERTADORES';
      else if (userPos >= 5 && userPos <= 10) qual = 'SUDAMERICANA';
    }
    save.history.lastSeasonQualification = qual;

    // Apply league overrides for next season only (does not touch base data)
    if (!save.world) save.world = {};
    if (!save.world.leagueOverrides) save.world.leagueOverrides = {};
    relegated.forEach(id => save.world.leagueOverrides[id] = 'BRA_SERIE_B');
    promoted.forEach(id => save.world.leagueOverrides[id] = 'BRA_SERIE_A');

    save.season.ext.finalized = true;
    return true;
  }

  function startNextSeason(save) {
    // Reset season keeping club and pack; apply league overrides when generating
    delete save.season;
    save.meta.updatedAt = nowIso();
    ensureSeason(save);
    // If club got relegated/promoted, adjust season league to override
    const ov = save.world?.leagueOverrides?.[save.career.clubId];
    if (ov) save.season.leagueId = ov;
    // reset squad form modestly
    if (save.squad?.players) save.squad.players.forEach(p => { p.form = clampInt((p.form||0) + randInt(-1,1), -5, 5); });
    // reset extensions
    ensureSeasonExtensions(save);
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
      const weekExtra = save.season.ext?.weekEvents?.[r] || { cupMatchIds: [], continentalMatchIds: [] };
      const nextCup = (weekExtra.cupMatchIds||[]).map(id => findCupMatchById(save, id)).filter(Boolean);
      const nextCont = (weekExtra.continentalMatchIds||[]).map(id => findContinentalMatchById(save, id)).filter(Boolean);

      const lastRoundIndex = Number.isFinite(save.season.lastRoundPlayed) ? save.season.lastRoundPlayed : -1;
      const lastResults = Array.isArray(save.season.lastResultsAll) ? save.season.lastResultsAll : (Array.isArray(save.season.lastResults) ? save.season.lastResults : []);

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
        : `<div class="notice">Temporada encerrada.</div>`;

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
              <button class="btn" data-go="/competitions">Ver Tabela</button>
              <button class="btn" data-go="/hub">Voltar</button>
            </div>
            <div class="sep"></div>
            ${lastBlock}
            ${nextBlock}
            ${renderExtraNextMatches(nextCup, nextCont, save)}
          </div>
        </div>
      `;
    });
  }

  function viewCompetitions() {
    return requireSave((save) => {
      ensureSystems(save);
      ensureSeason(save);
      ensureSeasonExtensions(save);
      seasonFinalizeIfEnded(save);
      const club = getClub(save.career.clubId);
      const compView = save.ui?.compView || 'LEAGUE';
      const league = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId);
      const rows = sortTableRows(Object.values(save.season.table));

      const tableHtml = rows.map((t, idx) => {
        const mark = t.id === save.career.clubId ? ' style="outline:1px solid rgba(34,197,94,.45)"' : '';
        return `
          <tr${mark}>
            <td>${idx+1}</td>
            <td>
              <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                ${clubLogoHtml(t.id, 26)}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(t.name)}</span>
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
            <div class="row" style="margin-bottom:10px">
              <div style="min-width:220px">
                <div class="label">Ver competição</div>
                <select class="input" data-field="compView">
                  <option value="LEAGUE" ${compView==='LEAGUE'?'selected':''}>Liga (Tabela)</option>
                  <option value="CDB" ${compView==='CDB'?'selected':''}>Copa do Brasil</option>
                  <option value="LIB" ${compView==='LIB'?'selected':''} ${save.season.ext?.continental?.competitionId==='LIBERTADORES'?'':'disabled'}>Libertadores</option>
                  <option value="SULA" ${compView==='SULA'?'selected':''} ${save.season.ext?.continental?.competitionId==='SUDAMERICANA'?'':'disabled'}>Sul-Americana</option>
                </select>
              </div>
              <div class="notice" style="flex:1">
                Dica: por enquanto o jogo simula completo a <b>liga nacional</b>. Copa e Continental são MVP porém já entram no calendário do seu clube.
              </div>
            </div>

            <div class="notice">MVP: nesta versão, a temporada jogável é a Liga (tabela completa). Copas/continentais entram na próxima atualização.</div>
            <div class="sep"></div>
            ${renderCompetitionsBody(save, compView, league, tableHtml)}
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
        navTo(target);
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

      // --- Próxima temporada
      if (action === 'nextSeason') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          ensureSeason(save);
          ensureSeasonExtensions(save);
          seasonFinalizeIfEnded(save);
          if (!save.season?.ext?.finalized) return;
          startNextSeason(save);
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

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


          // Simula a rodada da Série B em background (para promoção/rebaixamento)
          const b = save.season.ext?.otherLeagues?.BRA_SERIE_B;
          if (b && Array.isArray(b.rounds) && b.currentRound < b.rounds.length) {
            const bMatches = b.rounds[b.currentRound] || [];
            bMatches.forEach(mm => {
              if (mm.played) return;
              const simB = simulateMatch(mm.homeId, mm.awayId, save);
              mm.hg = simB.hg; mm.ag = simB.ag; mm.played = true;
              applyResultToTable(b.table, mm.homeId, mm.awayId, mm.hg, mm.ag);
            });
            b.currentRound += 1;
          }

          // Simula eventos extras desta 'semana' (Copa do Brasil / Continental) somente do clube do usuário
          const week = r;
          const weekExtra = save.season.ext?.weekEvents?.[week] || { cupMatchIds: [], continentalMatchIds: [] };
          const extraResults = [];

          // Copa do Brasil
          (weekExtra.cupMatchIds || []).forEach((id) => {
            const cm = findCupMatchById(save, id);
            if (!cm || cm.played) return;
            const simC = simulateMatch(cm.homeId, cm.awayId, save);
            cm.hg = simC.hg; cm.ag = simC.ag; cm.played = true;

            // desempate simples em pênaltis se empatar
            if (cm.hg === cm.ag) {
              if (Math.random() < 0.5) cm.hg += 1; else cm.ag += 1;
            }
            extraResults.push({ ...cm });

            // avança no bracket: define o vencedor e cria o confronto da próxima fase para o clube do usuário
            const cup = save.season.ext?.cups?.BRA_COPA_DO_BRASIL;
            if (cup) {
              const winner = (cm.hg > cm.ag) ? cm.homeId : cm.awayId;
              cup.eliminated[(winner === cm.homeId) ? cm.awayId : cm.homeId] = true;

              const nextRound = cup.rounds[cm.roundIndex + 1];
              if (nextRound) {
                // coloca o vencedor numa vaga TBD da próxima fase
                for (const nm of nextRound.matches) {
                  if (nm.homeId === '__TBD__') { nm.homeId = winner; break; }
                  if (nm.awayId === '__TBD__') { nm.awayId = winner; break; }
                }
              } else {
                cup.winner = winner;
              }
            }
          });

          // Continental (fase de grupos) - atualiza tabela
          (weekExtra.continentalMatchIds || []).forEach((id) => {
            const gm = findContinentalMatchById(save, id);
            if (!gm || gm.played) return;
            const simG = simulateMatch(gm.homeId, gm.awayId, save);
            gm.hg = simG.hg; gm.ag = simG.ag; gm.played = true;
            extraResults.push({ ...gm });

            const c = save.season.ext?.continental;
            if (c && c.table) {
              applyResultToTable(c.table, gm.homeId, gm.awayId, gm.hg, gm.ag);
            }
          });

          // Guarda extras pra exibir junto dos resultados da semana
          save.season.lastExtraResults = extraResults;

          // Guarda o resumo da rodada jogada (para exibir resultados)
          save.season.lastRoundPlayed = r;
          save.season.lastResults = (matches || []).map(m => ({ ...m }));
          save.season.lastResultsAll = [...(save.season.lastResults || []), ...(save.season.lastExtraResults || [])];

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
          save.meta.updatedAt = nowIso();
          writeSlot(state.settings.activeSlotId, save);
          route();
        });
      }

    // Seletor de competição (Competições)
    document.querySelectorAll('[data-field="compView"]').forEach((el) => {
      el.addEventListener('change', () => {
        const save = activeSave();
        if (!save) return;
        if (!save.ui) save.ui = {};
        save.ui.compView = el.value || 'LEAGUE';
        save.meta.updatedAt = nowIso();
        writeSlot(state.settings.activeSlotId, save);
        route();
      });
    });

    });
  }

  /** Inicializa a aplicação */
  async function boot() {
    ensureSlots();
    await loadPacks();
    await loadPackData();
    if (!location.hash) navTo('/home');
    else route();
  }

  boot();
  function renderExtraNextMatches(nextCup, nextCont, save) {
    const parts = [];
    if (Array.isArray(nextCup) && nextCup.length) {
      parts.push(`<div class="sep"></div><div class="badge">Copa do Brasil</div><div style="height:8px"></div>` + nextCup.map(m => matchItemFromObj(m, save)).join(''));
    }
    if (Array.isArray(nextCont) && nextCont.length) {
      const name = save.season?.ext?.continental?.name || 'Continental';
      parts.push(`<div class="sep"></div><div class="badge">${esc(name)}</div><div style="height:8px"></div>` + nextCont.map(m => matchItemFromObj(m, save)).join(''));
    }
    return parts.join('');
  }

  function matchItemFromObj(m, save) {
    const hc = getClub(m.homeId) || (save.season?.ext?.continental?.table?.[m.homeId] || null);
    const ac = getClub(m.awayId) || (save.season?.ext?.continental?.table?.[m.awayId] || null);
    const score = m.played ? `<b style="font-size:16px">${m.hg} x ${m.ag}</b>` : `<span class="badge">Não jogado</span>`;
    const isUser = (m.homeId === save.career.clubId || m.awayId === save.career.clubId);
    const outline = isUser ? ' style="outline:1px solid rgba(34,197,94,.40)"' : '';
    return `
      <div class="item"${outline}>
        <div class="item-left" style="display:flex; gap:10px; align-items:center;">
          ${clubLogoHtml(m.homeId, 34)}
          <div style="min-width:0;">
            <div class="item-title">${esc(hc?.short || hc?.name || m.homeId)} <span class="small">vs</span> ${esc(ac?.short || ac?.name || m.awayId)}</div>
            <div class="item-sub">${esc(m.compId || '')} • ${esc(m.stage || m.name || '')}</div>
          </div>
        </div>
        <div class="item-right">
          ${score}
        </div>
      </div>
    `;
  }
;
})();
