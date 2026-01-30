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
        "/continentals": viewContinentals,
"/finance": viewFinance,
    "/save": viewSave,
    "/admin": viewAdmin,
    "/staff": viewStaff,
    "/sponsorship": viewSponsorship,
    "/transfers": viewTransfers
    ,"/diagnostics": viewDiagnostics
  };

  /** Navega para a rota atual conforme hash */
  function route() {
    ensureSlots();
    const hash = location.hash.replace("#", "");
    const path = hash || "/home";

    // Classes de rota para fundos/cenário (somente menus + lobby)
    // Não interfere em partidas/tabelas.
    try {
      document.body.classList.remove('route-menu','route-hub');
      const isMenu = (path === '/home' || path === '/dlc' || path === '/slots' || path === '/career-create' || path === '/club-pick' || path === '/tutorial');
      if (isMenu) document.body.classList.add('route-menu');
      if (path === '/hub') document.body.classList.add('route-hub');
    } catch(e) {}

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
    // -----------------------------
// Transferências (Parte 5)
// -----------------------------
if (!save.transfers) save.transfers = {};
// filtros de busca da tela
if (typeof save.transfers.search !== 'string') save.transfers.search = '';
if (!save.transfers.filterPos) save.transfers.filterPos = 'ALL';

// lista auxiliar: jogadores já contratados via mercado "livre" (para não repetir na listagem)
if (!Array.isArray(save.transfers.bought)) save.transfers.bought = [];

// pipeline de propostas/negociações
if (!Array.isArray(save.transfers.outbox)) save.transfers.outbox = []; // ofertas enviadas
if (!Array.isArray(save.transfers.inbox)) save.transfers.inbox = [];   // ofertas recebidas
if (!Array.isArray(save.transfers.log)) save.transfers.log = [];       // histórico de transferências

// marcador para processamento automático por rodada
if (typeof save.transfers.lastProcessedRound !== 'number') save.transfers.lastProcessedRound = -1;

// dados econômicos do clube (provisório, removível depois)
if (!save.finance) {
  let initialCash = 50000000;
  try {
    initialCash = state.packData?.rules?.economy?.defaultStartingCashIfMissing ?? 50000000;
  } catch {}
  save.finance = { cash: initialCash };
}

    // =====================================================
// TRANSFERÊNCIAS (Parte 5) — Sistema provisório, removível
// =====================================================

/**
 * Janela de transferências baseada em rodada (provisório).
 * - Pré-temporada: rodadas 0 a 5
 * - Meio de temporada: rodadas 18 a 23
 * Observação: como o calendário ainda é por "rodadas", usamos ranges fixos.
 */
function getTransferWindow(save) {
  ensureSeason(save);
  const r = Number(save.season.currentRound || 0);
  const total = (save.season.rounds || []).length || 38;

  // Se a temporada terminou, janela fechada
  if (save.season.completed) {
    return { open: false, label: 'Encerrada', round: r, total };
  }

  const inPre = r >= 0 && r <= 5;
  const inMid = r >= 18 && r <= 23;

  if (inPre) return { open: true, label: 'Janela (Pré-temporada)', round: r, total };
  if (inMid) return { open: true, label: 'Janela (Meio de temporada)', round: r, total };
  return { open: false, label: 'Janela fechada', round: r, total };
}

function uid(prefix) {
  return `${prefix || 'id'}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function clamp(n, a, b) {
  n = Number(n);
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}

/** Avalia uma oferta (compra) para um jogador no "mercado global" (sem clubes reais ainda) */
function evaluateBuyOffer(player, fee, wage) {
  const value = Number(player?.value || 0);
  const f = Number(fee || 0);
  // regras provisórias:
  // - >= 90% do valor: aceita
  // - 70% a 89%: contra-oferta em 95% do valor
  // - < 70%: rejeita
  if (value <= 0) return { status: 'REJECTED', reason: 'Sem valor definido' };

  if (f >= value * 0.90) return { status: 'ACCEPTED' };
  if (f >= value * 0.70) {
    const counterFee = Math.round(value * 0.95);
    const counterWage = Math.round(Math.max(0, Number(wage || 0)) * 1.05);
    return { status: 'COUNTERED', counter: { fee: counterFee, wage: counterWage } };
  }
  return { status: 'REJECTED', reason: 'Oferta baixa' };
}

/** Cria ofertas aleatórias de IA por jogadores do usuário (provisório) */
function maybeGenerateIncomingOffers(save) {
  const win = getTransferWindow(save);
  if (!win.open) return;

  const squad = save.squad?.players || [];
  if (squad.length === 0) return;

  // limite de ofertas por rodada (provisório)
  const maxOffersThisRound = 2;
  const roll = Math.random();
  const howMany = roll < 0.35 ? 0 : (roll < 0.80 ? 1 : 2);

  let created = 0;
  for (let i = 0; i < squad.length && created < Math.min(howMany, maxOffersThisRound); i++) {
    const p = squad[Math.floor(Math.random() * squad.length)];
    if (!p || !p.id) continue;

    // evita spam: se já existe oferta pendente para este jogador, não cria outra
    const already = (save.transfers?.inbox || []).some(o => o.pid === p.id && (o.status === 'PENDING' || o.status === 'COUNTERED'));
    if (already) continue;

    const value = Number(p.value || 0);
    const fee = Math.round(value * (0.80 + Math.random() * 0.50)); // 80% a 130%
    const wage = Math.round((Number(p.wage || 150000) * (0.90 + Math.random() * 0.35))); // provisório

    const offer = {
      id: uid('offer'),
      type: 'IN',
      pid: p.id,
      playerName: p.name,
      from: { clubName: 'Clube Europeu', clubId: 'AI_EU' }, // placeholder removível
      to: { clubId: save.career.clubId, clubName: getClub(save.career.clubId)?.name || 'Seu clube' },
      fee,
      wage,
      status: 'PENDING',
      createdAt: nowIso(),
      createdRound: Number(save.season.currentRound || 0),
      expiresRound: Number(save.season.currentRound || 0) + 3
    };

    save.transfers.inbox.push(offer);
    created++;
  }
}

/** Processa ofertas pendentes/counter e expira ofertas */
function processTransferPipeline(save) {
  ensureSystems(save);
  ensureSeason(save);

  const r = Number(save.season.currentRound || 0);
  if (save.transfers.lastProcessedRound === r) return;

  // expira inbox/outbox
  const expire = (arr) => {
    for (const o of arr) {
      if (!o) continue;
      if (o.status === 'PENDING' || o.status === 'COUNTERED') {
        if (typeof o.expiresRound === 'number' && r > o.expiresRound) {
          o.status = 'EXPIRED';
          o.closedAt = nowIso();
        }
      }
    }
  };
  expire(save.transfers.outbox);
  expire(save.transfers.inbox);

  // responde algumas ofertas enviadas (simula "negociação")
  for (const o of save.transfers.outbox) {
    if (!o) continue;
    if (o.status !== 'PENDING') continue;
    // Processa resposta 1 rodada depois
    if ((o.createdRound ?? r) >= r) continue;

    const p = (state.packData?.players?.players || []).find(x => x.id === o.pid);
    if (!p) { o.status = 'REJECTED'; o.reason = 'Jogador não encontrado'; o.closedAt = nowIso(); continue; }

    const res = evaluateBuyOffer(p, o.fee, o.wage);
    o.status = res.status;
    if (res.status === 'COUNTERED') o.counter = res.counter;
    if (res.status === 'REJECTED') o.reason = res.reason || 'Recusado';
    if (res.status === 'ACCEPTED') o.closedAt = nowIso();
  }

  // IA cria ofertas recebidas para o usuário (provisório)
  maybeGenerateIncomingOffers(save);

  save.transfers.lastProcessedRound = r;
}

/** Conclui compra (após oferta aceita) */
function finalizeBuy(save, pid, fee, wage) {
  const p = (state.packData?.players?.players || []).find(x => x.id === pid);
  if (!p) return { ok: false, message: 'Jogador não encontrado' };

  const price = Number(fee || p.value || 0);
  if (!save.finance) save.finance = { cash: 0 };
  if ((save.finance.cash || 0) < price) return { ok: false, message: 'Caixa insuficiente' };

  // efetiva
  save.finance.cash = (save.finance.cash || 0) - price;
  save.squad.players.push({ ...p, clubId: save.career.clubId, source: 'transfer', wage: Number(wage || p.wage || 0) });

  if (!save.transfers.bought) save.transfers.bought = [];
  save.transfers.bought.push(pid);

  save.transfers.log.push({
    id: uid('tr'),
    kind: 'BUY',
    pid,
    playerName: p.name,
    fee: price,
    wage: Number(wage || 0),
    at: nowIso(),
    seasonId: save.season.id
  });

  return { ok: true };
}

/** Conclui venda (aceitando proposta recebida) */
function finalizeSell(save, offerId) {
  const offer = (save.transfers.inbox || []).find(o => o.id === offerId);
  if (!offer) return { ok: false, message: 'Oferta não encontrada' };
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') return { ok: false, message: 'Oferta inválida' };

  const idx = (save.squad.players || []).findIndex(p => p.id === offer.pid);
  if (idx < 0) return { ok: false, message: 'Jogador não está no seu elenco' };

  const p = save.squad.players[idx];
  save.squad.players.splice(idx, 1);

  if (!save.finance) save.finance = { cash: 0 };
  save.finance.cash = (save.finance.cash || 0) + Number(offer.fee || 0);

  offer.status = 'ACCEPTED';
  offer.closedAt = nowIso();

  save.transfers.log.push({
    id: uid('tr'),
    kind: 'SELL',
    pid: p.id,
    playerName: p.name,
    fee: Number(offer.fee || 0),
    at: nowIso(),
    seasonId: save.season.id
  });

  return { ok: true };
}

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
                <img src=\"${esc(logoClubUrl(c.id))}\" alt=\"${esc(c.name)}\" onerror=\"this.onerror=null;this.src='assets/club_placeholder.svg';\"> 
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
            <div class="notice">📱 No celular: toque em <b>Escolher</b> e você avança automaticamente.</div>
            <div class="sep"></div>
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
            <div class="sep"></div>
            <div class="row">
              <button class="btn" data-go="/career-create">Voltar</button>
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
            <div class="hub-grid">
  <div class="hub-card" data-go="/matches">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_match.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">⚽</div>
        <div>
          <div class="hub-title">Partida</div>
          <div class="hub-desc">Dispute, simule e acompanhe eventos ao vivo</div>
        </div>
      </div>
      <div class="hub-cta">Abrir</div>
    </div>
  </div>

  <div class="hub-card" data-go="/matches">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_calendar.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🗓️</div>
        <div>
          <div class="hub-title">Calendário</div>
          <div class="hub-desc">Próximos jogos, rodadas e agenda</div>
        </div>
      </div>
      <div class="hub-cta">Ver</div>
    </div>
  </div>

  <div class="hub-card" data-go="/competitions">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_match.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🏆</div>
        <div>
          <div class="hub-title">Competições</div>
          <div class="hub-desc">Tabelas, continentais e títulos</div>
        </div>
      </div>
      <div class="hub-cta">Entrar</div>
    </div>
  </div>

  <div class="hub-card" data-go="/training">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_staff.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🏋️</div>
        <div>
          <div class="hub-title">Treino</div>
          <div class="hub-desc">Evolua o elenco e ajuste intensidade</div>
        </div>
      </div>
      <div class="hub-cta">Treinar</div>
    </div>
  </div>

  <div class="hub-card" data-go="/staff">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_staff.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🎧</div>
        <div>
          <div class="hub-title">Staff</div>
          <div class="hub-desc">Comissão técnica e funções do clube</div>
        </div>
      </div>
      <div class="hub-cta">Abrir</div>
    </div>
  </div>

  <div class="hub-card" data-go="/sponsorship">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_sponsor.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🤝</div>
        <div>
          <div class="hub-title">Patrocínio</div>
          <div class="hub-desc">Contratos, metas e bônus financeiros</div>
        </div>
      </div>
      <div class="hub-cta">Negociar</div>
    </div>
  </div>

  <div class="hub-card" data-go="/transfers">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_calendar.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🔁</div>
        <div>
          <div class="hub-title">Mercado</div>
          <div class="hub-desc">Compras, vendas e empréstimos</div>
        </div>
      </div>
      <div class="hub-cta">Ver</div>
    </div>
  </div>

  <div class="hub-card" data-go="/finance">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_sponsor.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">💰</div>
        <div>
          <div class="hub-title">Finanças</div>
          <div class="hub-desc">Caixa, receitas, despesas e balanço</div>
        </div>
      </div>
      <div class="hub-cta">Abrir</div>
    </div>
  </div>

  <div class="hub-card" data-go="/squad">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_match.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">👥</div>
        <div>
          <div class="hub-title">Elenco</div>
          <div class="hub-desc">Jogadores, status e evolução</div>
        </div>
      </div>
      <div class="hub-cta">Abrir</div>
    </div>
  </div>

  <div class="hub-card" data-go="/tactics">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_staff.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">📋</div>
        <div>
          <div class="hub-title">Tática</div>
          <div class="hub-desc">Formação, estilo e instruções</div>
        </div>
      </div>
      <div class="hub-cta">Editar</div>
    </div>
  </div>

  <div class="hub-card" data-go="/save">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_calendar.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">💾</div>
        <div>
          <div class="hub-title">Salvar</div>
          <div class="hub-desc">Guarde seu progresso</div>
        </div>
      </div>
      <div class="hub-cta">Salvar</div>
    </div>
  </div>

  <div class="hub-card" data-go="/slots">
    <div class="hub-bg" style="background-image:url('${urlOf('assets/photos/photo_calendar.png')}')"></div>
    <div class="hub-overlay"></div>
    <div class="hub-content">
      <div class="hub-left">
        <div class="hub-pill">🔀</div>
        <div>
          <div class="hub-title">Slots</div>
          <div class="hub-desc">Trocar e gerenciar saves</div>
        </div>
      </div>
      <div class="hub-cta">Abrir</div>
    </div>
  </div>
</div></div>
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

    // Parte 3: inicia liga paralela (Brasil A/B) para termos classificação real ao longo do ano
    try { ensureParallelBrazilLeaguesInitialized(save); } catch (e) {}
    try { ensureParallelWorldLeaguesInitialized(save); } catch (e) {}
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

    // Garante que ligas paralelas (Brasil A/B) tenham uma tabela final consistente
    ensureParallelBrazilLeaguesFinalized(save);

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

    // Promoção/Rebaixamento Brasil (A<->B)
    if (save.season.leagueId === 'BRA_SERIE_A' || save.season.leagueId === 'BRA_SERIE_B') {
      applyBrazilPromotionRelegation(save);
    }

    // Finaliza tabelas das ligas paralelas do mundo (B1) e gera torneios continentais (B1.1)
    try { ensureParallelWorldLeaguesFinalized(save); } catch (e) {}
    try { generateContinentalCompetitionsForSeason(save); } catch (e) {}

    return true;

  }

  // -----------------------------
  // Promoção/Rebaixamento + Zonas (Parte 2)
  // -----------------------------

  function getZonesForLeague(leagueId) {
    const q = state.packData?.qualifications || {};
    const br = q.brazil || {};

    // Brasil (compatibilidade)
    if (leagueId === 'BRA_SERIE_A') return { kind: 'BR_A', ...(br.serieA || {}) };
    if (leagueId === 'BRA_SERIE_B') return { kind: 'BR_B', ...(br.serieB || {}) };

    // Mundo (UEFA/CONMEBOL etc.)
    const w = q.world || {};
    const z = w[leagueId] || null;
    if (!z) return null;
    return { kind: 'WORLD', ...z };
  }

  function zoneInfoForPosition(leagueId, position) {
    const zones = getZonesForLeague(leagueId);
    if (!zones) return null;

    // Série A Brasil
    if (leagueId === 'BRA_SERIE_A') {
      if (position >= zones.libertadores?.from && position <= zones.libertadores?.to) return { key: 'lib', label: 'LIB', cls: 'zone-lib', title: 'Libertadores' };
      if (position >= zones.sudamericana?.from && position <= zones.sudamericana?.to) return { key: 'sula', label: 'SULA', cls: 'zone-sula', title: 'Sul-Americana' };
      if (position >= zones.relegation?.from && position <= zones.relegation?.to) return { key: 'z4', label: 'Z4', cls: 'zone-z4', title: 'Rebaixamento' };
      return null;
    }

    // Série B Brasil
    if (leagueId === 'BRA_SERIE_B') {
      if (position >= zones.promotion?.from && position <= zones.promotion?.to) return { key: 'up', label: 'SUBE', cls: 'zone-up', title: 'Acesso' };
      const relFrom = zones.relegation?.from ?? 17;
      const relTo = zones.relegation?.to ?? 20;
      if (position >= relFrom && position <= relTo) return { key: 'z4', label: 'Z4', cls: 'zone-z4', title: 'Rebaixamento' };
      return null;
    }

    // Mundo (configurável via qualifications.json)
    const cont = zones.continental || {};
    if (cont.libertadores && position >= cont.libertadores.from && position <= cont.libertadores.to) return { key: 'lib', label: 'LIB', cls: 'zone-lib', title: 'Libertadores' };
    if (cont.sudamericana && position >= cont.sudamericana.from && position <= cont.sudamericana.to) return { key: 'sula', label: 'SULA', cls: 'zone-sula', title: 'Sul-Americana' };
    if (cont.champions && position >= cont.champions.from && position <= cont.champions.to) return { key: 'ucl', label: 'UCL', cls: 'zone-ucl', title: 'UEFA Champions League' };
    if (cont.europa && position >= cont.europa.from && position <= cont.europa.to) return { key: 'uel', label: 'UEL', cls: 'zone-uel', title: 'UEFA Europa League' };

    const rel = zones.relegation || {};
    if (rel.from && rel.to && position >= rel.from && position <= rel.to) return { key: 'z4', label: 'Z4', cls: 'zone-z4', title: 'Rebaixamento' };

    return null;
  }

  function zoneLegendHtml(leagueId) {
    const zones = getZonesForLeague(leagueId);
    if (!zones) return '';

    const pills = [];
    const cont = zones.continental || {};

    // CONMEBOL
    if (leagueId === 'BRA_SERIE_A' || cont.libertadores) pills.push(`<span class="pill zone-lib" title="Libertadores">🏆 LIB</span>`);
    if (leagueId === 'BRA_SERIE_A' || cont.sudamericana) pills.push(`<span class="pill zone-sula" title="Sul-Americana">🥈 SULA</span>`);

    // UEFA
    if (cont.champions) pills.push(`<span class="pill zone-ucl" title="UEFA Champions League">⭐ UCL</span>`);
    if (cont.europa) pills.push(`<span class="pill zone-uel" title="UEFA Europa League">🏅 UEL</span>`);

    // Acesso (Série B)
    if (leagueId === 'BRA_SERIE_B' && zones.promotion) pills.push(`<span class="pill zone-up" title="Acesso">⬆️ SUBE</span>`);

    // Rebaixamento
    if ((zones.relegation && zones.relegation.from) || leagueId === 'BRA_SERIE_A') pills.push(`<span class="pill zone-z4" title="Rebaixamento">⬇️ Z4</span>`);

    return `
      <div class="zone-legend">
        <div class="zone-legend-left">${pills.join(' ')}</div>
        <div class="zone-legend-right">Dica: seu clube fica destacado como <span class="pill pill-mini">VOCÊ</span>.</div>
      </div>
    `;
  }

function ensureLeagueTableStore(save) {
    if (!save.progress) save.progress = {};
    if (!save.progress.leagueTables) save.progress.leagueTables = {};
    const sid = save.season?.id || 'unknown';
    if (!save.progress.leagueTables[sid]) save.progress.leagueTables[sid] = {};
    return save.progress.leagueTables[sid];
  }

  // -----------------------------
  // Ligas paralelas (Parte 3)
  // -----------------------------

  function ensureParallelLeaguesStore(save) {
    if (!save.progress) save.progress = {};
    if (!save.progress.parallelLeagues) save.progress.parallelLeagues = {};
    const sid = save.season?.id || 'unknown';
    if (!save.progress.parallelLeagues[sid]) save.progress.parallelLeagues[sid] = {};
    return save.progress.parallelLeagues[sid];
  }

  function ensureParallelLeagueState(save, leagueId) {
    const store = ensureParallelLeaguesStore(save);
    if (store[leagueId]) return store[leagueId];

    const clubs = ((save.world?.clubs) || (state.packData?.clubs?.clubs) || []).filter(c => c.leagueId === leagueId);
    const ids = clubs.map(c => c.id);
    const stateLeague = {
      leagueId,
      currentRound: 0,
      rounds: generateDoubleRoundRobin(ids),
      table: buildEmptyTable(clubs),
      completed: false
    };
    store[leagueId] = stateLeague;
    return stateLeague;
  }

  function simulateParallelRound(save, leagueId, roundIndex) {
    const ls = ensureParallelLeagueState(save, leagueId);
    if (ls.completed) return;
    if (!Array.isArray(ls.rounds) || !ls.table) return;
    const r = Number.isFinite(roundIndex) ? roundIndex : ls.currentRound;
    if (r < 0 || r >= ls.rounds.length) {
      ls.completed = true;
      return;
    }
    const matches = ls.rounds[r] || [];
    for (const m of matches) {
      if (m.played) continue;
      const sim = simulateMatch(m.homeId, m.awayId, save);
      m.hg = sim.hg; m.ag = sim.ag; m.played = true;
      applyResultToTable(ls.table, m.homeId, m.awayId, m.hg, m.ag);
    }
    ls.currentRound = Math.max(ls.currentRound, r + 1);
    if (ls.currentRound >= ls.rounds.length) ls.completed = true;
  }

  function snapshotParallelLeagueToTables(save, leagueId) {
    try {
      const ls = ensureParallelLeagueState(save, leagueId);
      const rows = sortTableRows(Object.values(ls.table || {}));
      const tables = ensureLeagueTableStore(save);
      tables[leagueId] = rows.map(r => ({ ...r }));
    } catch (e) {
      // ignore
    }
  }

  function otherBrazilLeague(leagueId) {
    if (leagueId === 'BRA_SERIE_A') return 'BRA_SERIE_B';
    if (leagueId === 'BRA_SERIE_B') return 'BRA_SERIE_A';
    return null;
  }

  function ensureParallelBrazilLeaguesFinalized(save) {
    const other = otherBrazilLeague(save.season?.leagueId);
    if (!other) return;
    const ls = ensureParallelLeagueState(save, other);
    // Se o usuário terminou a liga dele, garante que a outra liga também finalize (fast-forward)
    while (!ls.completed) {
      simulateParallelRound(save, other, ls.currentRound);
      // Evita loop infinito em caso de dados ruins
      if (ls.currentRound > 200) break;
    }
    snapshotParallelLeagueToTables(save, other);
  }

  function ensureParallelBrazilLeaguesInitialized(save) {
    const other = otherBrazilLeague(save.season?.leagueId);
    if (!other) return;
    ensureParallelLeagueState(save, other);
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


// Parte 3: reinicia liga paralela do Brasil (A/B) na nova temporada
try { ensureParallelBrazilLeaguesInitialized(save); } catch (e) {}
    try { ensureParallelWorldLeaguesInitialized(save); } catch (e) {}

// Parte 5: reinicia pipeline de transferências (provisório)
if (save.transfers) {
  save.transfers.lastProcessedRound = -1;
  // não apagamos o histórico; apenas limpamos as caixas para a nova temporada
  save.transfers.outbox = [];
  save.transfers.inbox = [];
}

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

  function logoClubUrl(clubId){
    // IMPORTANT: use relative paths without './' so GitHub Pages subpaths + hash routing don't break
    if(!clubId) return 'assets/club_placeholder.svg';
    return `assets/logos/${clubId}.png`;
  }
function clubLogoHtml(clubId, size = 34) {
  const c = clubId ? getClub(clubId) : null;
  const s = Number(size) || 34;
  const alt = esc(c?.name || clubId || 'Clube');
  const src = esc(logoClubUrl(clubId));
  return `
    <div class="club-logo" style="width:${s}px;height:${s}px;border-radius:14px;">
      <img src="${src}" alt="${alt}" onerror="this.onerror=null;this.src='assets/club_placeholder.svg';">
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

  // -----------------------------
  // Matchday Modal (A2) – emoção ao disputar rodada
  // -----------------------------
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function rnd(min, max){ return Math.random() * (max - min) + min; }
  function rndi(min, max){ return Math.floor(rnd(min, max + 1)); }

  function getClubPlayers(clubId){
    const ps = state.packData?.players?.players || [];
    return ps.filter(p => p.clubId === clubId);
  }

  function pickScorerName(clubId){
    const ps = getClubPlayers(clubId);
    const pref = ['ST','CF','FW','AM','CAM','LW','RW','LM','RM','CM'];
    const cand = ps.filter(p => pref.includes((p.pos || p.position || '').toUpperCase()));
    const pool = cand.length ? cand : ps;
    const c = getClub(clubId);
    if (!pool.length) return `${c?.short || c?.name || clubId} (Jogador)`;
    const p = pool[Math.floor(Math.random() * pool.length)];
    return p.name || p.playerName || 'Jogador';
  }

  function buildMatchStats(homeId, awayId, sim, save){
    // Estatísticas simples mas críveis, derivadas do "ritmo" do jogo (lamHome/lamAway)
    const baseShotsH = clamp(Math.round(sim.lamHome * 9 + rnd(3, 7)), 4, 22);
    const baseShotsA = clamp(Math.round(sim.lamAway * 9 + rnd(3, 7)), 4, 22);
    const onH = clamp(Math.round(baseShotsH * rnd(.32, .55)), 1, baseShotsH);
    const onA = clamp(Math.round(baseShotsA * rnd(.32, .55)), 1, baseShotsA);
    const foulsH = clamp(Math.round(rnd(8, 17)), 5, 24);
    const foulsA = clamp(Math.round(rnd(8, 17)), 5, 24);
    const cornersH = clamp(Math.round(baseShotsH * rnd(.12,.25)), 1, 11);
    const cornersA = clamp(Math.round(baseShotsA * rnd(.12,.25)), 1, 11);

    // posse baseada na força relativa (usa a mesma função do simulador principal)
    const sh = teamStrength(homeId, save);
    const sa = teamStrength(awayId, save);
    let possH = 50;
    if (sh + sa > 0) possH = 50 + (sh - sa) / (sh + sa) * 14;
    possH = clamp(Math.round(possH + rnd(-4, 4)), 35, 65);
    const possA = 100 - possH;

    return {
      possH, possA,
      shotsH: baseShotsH, shotsA: baseShotsA,
      onH, onA,
      foulsH, foulsA,
      cornersH, cornersA,
    };
  }

  function buildTimelineForMatch(homeId, awayId, hg, ag){
    const hc = getClub(homeId);
    const ac = getClub(awayId);
    const homeName = hc?.short || hc?.name || homeId;
    const awayName = ac?.short || ac?.name || awayId;

    const events = [];
    events.push({ min: 0, text: `00' ⏱️ Começa o jogo! ${homeName} x ${awayName}` });

    // gols distribuídos
    const goalMins = [];
    for (let i=0;i<hg;i++) goalMins.push({ side:'H', min:rndi(6, 88) });
    for (let i=0;i<ag;i++) goalMins.push({ side:'A', min:rndi(6, 88) });
    goalMins.sort((a,b)=>a.min-b.min);

    // eventos extras
    const extraCount = rndi(5, 10);
    const extra = [];
    for (let i=0;i<extraCount;i++) extra.push(rndi(3, 90));
    extra.sort((a,b)=>a-b);

    const addFoul = (m)=>{
      const side = Math.random() < .5 ? 'H' : 'A';
      const clubId = side==='H' ? homeId : awayId;
      const c = getClub(clubId);
      const nm = c?.short || c?.name || clubId;
      const isYellow = Math.random() < .35;
      events.push({ min:m, text:`${String(m).padStart(2,'0')}' ${isYellow?'🟨':'🛑'} Falta ${isYellow?'e cartão':'marcada'} – ${nm}`});
    };

    // mistura: para cada minuto do extra, coloca um evento que não conflite com gol
    extra.forEach(m=> addFoul(m));

    goalMins.forEach((g, idx)=>{
      const clubId = g.side==='H' ? homeId : awayId;
      const scorer = pickScorerName(clubId);
      const c = getClub(clubId);
      const nm = c?.short || c?.name || clubId;
      events.push({ min:g.min, text:`${String(g.min).padStart(2,'0')}' ⚽ GOL! ${scorer} (${nm})`});
    });

    events.push({ min: 45, text: `45' ⏸️ Intervalo` });
    events.push({ min: 90, text: `90+${rndi(1,4)}' ⏱️ Fim de jogo` });

    // ordena e remove duplicados por texto/min
    const seen = new Set();
    return events
      .sort((a,b)=>a.min-b.min)
      .filter(e=>{ const k = e.min+'|'+e.text; if(seen.has(k)) return false; seen.add(k); return true; });
  }

  function removeMatchdayModal(){
    const ov = document.getElementById('vfmMatchdayOverlay');
    if (ov) ov.remove();
  }

  function openMatchdayModal(save, roundIndex){
    removeMatchdayModal();
    const rounds = save.season.rounds || [];
    const matches = rounds[roundIndex] || [];
    const userId = save.career.clubId;
    const userMatch = matches.find(m => m.homeId === userId || m.awayId === userId) || matches[0];
    if (!userMatch) return;

    // pré-simula todos os jogos da rodada, mas não aplica ainda (vamos aplicar no final)
    const pre = matches.map(m => {
      if (m.played) return { ...m, sim:null, stats:null, timeline:[] };
      const sim = simulateMatch(m.homeId, m.awayId, save);
      const stats = buildMatchStats(m.homeId, m.awayId, sim, save);
      const timeline = (m.homeId===userMatch.homeId && m.awayId===userMatch.awayId)
        ? buildTimelineForMatch(m.homeId, m.awayId, sim.hg, sim.ag)
        : [];
      return { ...m, sim, stats, timeline };
    });

    const main = pre.find(x => x.homeId===userMatch.homeId && x.awayId===userMatch.awayId) || pre[0];
    const hc = getClub(main.homeId);
    const ac = getClub(main.awayId);
    const leagueName = (state.packData?.competitions?.leagues || []).find(l => l.id === save.season.leagueId)?.name || save.season.leagueId;
    const totalRounds = save.season.rounds.length;

    // UI base
    const overlay = document.createElement('div');
    overlay.id = 'vfmMatchdayOverlay';
    overlay.className = 'vfm-modal-overlay';
    overlay.innerHTML = `
      <div class="vfm-modal" role="dialog" aria-modal="true">
        <div class="vfm-modal-header">
          <div class="vfm-modal-title">
            <div class="t1">Disputando Rodada ${roundIndex + 1} / ${totalRounds}</div>
            <div class="t2">${esc(leagueName)} • Simulação com narrativa</div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn" id="vfmBtnSkip">Pular</button>
            <button class="btn" id="vfmBtnClose" title="Fechar">✕</button>
          </div>
        </div>
        <div class="vfm-modal-body">
          <div class="vfm-match-hero">
            <div class="vfm-match-side">
              ${clubLogoHtml(main.homeId, 44)}
              <div class="nm">${esc(hc?.short || hc?.name || main.homeId)}</div>
            </div>
            <div class="vfm-match-mid">
              <div class="vfm-score" id="vfmScore">0 x 0</div>
              <div class="vfm-clock" id="vfmClock">Preparando...</div>
            </div>
            <div class="vfm-match-side" style="justify-content:flex-end;">
              <div class="nm">${esc(ac?.short || ac?.name || main.awayId)}</div>
              ${clubLogoHtml(main.awayId, 44)}
            </div>
          </div>

          <div class="vfm-grid">
            <div class="vfm-panel">
              <div class="hd">Tempo real <span class="badge" id="vfmState">AO VIVO</span></div>
              <div class="vfm-timeline" id="vfmTimeline"></div>
            </div>
            <div class="vfm-panel">
              <div class="hd">Estatísticas</div>
              <div class="vfm-stats" id="vfmStats"></div>
              <div class="sep" style="margin:0;"></div>
              <div style="padding:10px 12px;">
                <button class="btn btn-primary" id="vfmBtnConfirm" disabled>Avançar</button>
                <div class="small" style="margin-top:6px; opacity:.8;">Dica: clique em <b>Pular</b> para ver tudo instantaneamente.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const elTimeline = overlay.querySelector('#vfmTimeline');
    const elScore = overlay.querySelector('#vfmScore');
    const elClock = overlay.querySelector('#vfmClock');
    const elStats = overlay.querySelector('#vfmStats');
    const elConfirm = overlay.querySelector('#vfmBtnConfirm');
    const elSkip = overlay.querySelector('#vfmBtnSkip');
    const elClose = overlay.querySelector('#vfmBtnClose');
    const elState = overlay.querySelector('#vfmState');

    // Render stats (simples)
    function statRow(label, vH, vA){
      const l = document.createElement('div');
      l.className = 'vfm-stat-row';
      l.innerHTML = `<span><b>${esc(vH)}</b></span><span style="opacity:.85">${esc(label)}</span><span><b>${esc(vA)}</b></span>`;
      return l;
    }

    const st = main.stats;
    elStats.innerHTML = '';
    if (st){
      elStats.appendChild(statRow('Posse', st.possH + '%', st.possA + '%'));
      elStats.appendChild(statRow('Finalizações', st.shotsH, st.shotsA));
      elStats.appendChild(statRow('No gol', st.onH, st.onA));
      elStats.appendChild(statRow('Faltas', st.foulsH, st.foulsA));
      elStats.appendChild(statRow('Escanteios', st.cornersH, st.cornersA));
    }

    // Timeline playback
    const tl = Array.isArray(main.timeline) && main.timeline.length ? main.timeline : buildTimelineForMatch(main.homeId, main.awayId, main.sim?.hg || 0, main.sim?.ag || 0);
    let idx = 0;
    let hgLive = 0, agLive = 0;
    let done = false;
    let timer = null;

    function pushEvent(text){
      const d = document.createElement('div');
      d.className = 'ev';
      d.textContent = text;
      elTimeline.appendChild(d);
      elTimeline.scrollTop = elTimeline.scrollHeight;
    }

    function updateScore(){
      elScore.textContent = `${hgLive} x ${agLive}`;
    }

    function finish(){
      if (done) return;
      done = true;
      if (timer) { clearTimeout(timer); timer = null; }
      elState.textContent = 'FINAL';
      elClock.textContent = 'Partida encerrada';
      elConfirm.disabled = false;
    }

    function step(){
      if (done) return;
      if (idx >= tl.length){
        finish();
        return;
      }
      const e = tl[idx++];
      elClock.textContent = `Minuto ${String(e.min).padStart(2,'0')}`;
      pushEvent(e.text);
      // Atualiza placar se evento for gol
      if (e.text.includes('⚽')){
        // Heurística: se contém nome do time da casa/fora
        const homeNm = (hc?.short || hc?.name || main.homeId);
        const awayNm = (ac?.short || ac?.name || main.awayId);
        if (e.text.includes('(' + homeNm + ')') || e.text.includes(homeNm + ')')) hgLive++;
        else if (e.text.includes('(' + awayNm + ')') || e.text.includes(awayNm + ')')) agLive++;
        else {
          // fallback: alterna
          if (hgLive + agLive < (main.sim?.hg || 0) + (main.sim?.ag || 0)){
            if (hgLive < (main.sim?.hg || 0)) hgLive++; else agLive++;
          }
        }
        updateScore();
      }
      // agenda próximo
      timer = setTimeout(step, rndi(260, 780));
    }

    function revealAll(){
      if (timer) { clearTimeout(timer); timer = null; }
      elTimeline.innerHTML = '';
      hgLive = 0; agLive = 0;
      tl.forEach(e => {
        pushEvent(e.text);
        if (e.text.includes('⚽')){
          if (hgLive < (main.sim?.hg || 0)) hgLive++; else agLive++;
        }
      });
      updateScore();
      finish();
    }

    // Primeira render
    if (main.sim){
      elClock.textContent = 'Ao vivo...';
      // placar final conhecido, mas revelamos gradualmente
      updateScore();
    }

    elSkip.addEventListener('click', () => revealAll());
    elClose.addEventListener('click', () => {
      // Evita "sumir" no meio: pede para pular e depois avançar
      if (!done) { revealAll(); return; }
      removeMatchdayModal();
    });

    elConfirm.addEventListener('click', () => {
      // aplica resultados de TODOS os jogos da rodada
      const matchesNow = rounds[roundIndex] || [];
      const preMap = new Map(pre.map(x => [x.homeId+'|'+x.awayId, x]));
      matchesNow.forEach(m => {
        if (m.played) return;
        const key = m.homeId+'|'+m.awayId;
        const p = preMap.get(key);
        const sim = p?.sim || simulateMatch(m.homeId, m.awayId, save);
        m.hg = sim.hg; m.ag = sim.ag; m.played = true;
        m.xgH = sim.lamHome;
        m.xgA = sim.lamAway;
        applyResultToTable(save.season.table, m.homeId, m.awayId, m.hg, m.ag);
      });

      // Simula a liga paralela (Brasil A/B) na mesma rodada
      try {
        const other = otherBrazilLeague(save.season.leagueId);
        if (other) {
          simulateParallelRound(save, other, roundIndex);
          snapshotParallelLeagueToTables(save, other);
        }
      } catch (e) {}

      

      // Simula TODAS as outras ligas do mundo em paralelo (B1)
      try { simulateParallelWorldLeaguesRound(save, roundIndex); } catch (e) {}

      // B1.3: Competições continentais durante a temporada (calendário em paralelo)
      // Regra simples e estável: a cada 2 rodadas domésticas, simulamos 1 "matchday" continental.
      // O usuário pode acompanhar na tela "Continental".
      try {
        ensureContinentalsLive(save);
        const csum = maybeAutoAdvanceContinentalsLive(save, roundIndex);
        applyContinentalEconomy(save, csum);
      } catch (e) {}
save.season.lastRoundPlayed = roundIndex;
      save.season.lastResults = (matchesNow || []).map(m => ({ ...m }));

      // economia semanal
      const econ = state.packData?.rules?.economy || {};
      let weeklyCost = 0;
      weeklyCost += econ?.weeklyCosts?.staff || 0;
      weeklyCost += econ?.weeklyCosts?.maintenance || 0;
      weeklyCost += (save.staff?.hired || []).reduce((s, st) => s + (st.salary || 0), 0);
      const sponsorIncome = save.sponsorship?.current?.weekly || 0;
      if (!save.finance) save.finance = { cash: 0 };
      save.finance.cash = Math.max(0, (save.finance.cash || 0) + sponsorIncome - weeklyCost);

      save.season.currentRound += 1;
      try { processTransferPipeline(save); } catch (e) {}
      finalizeSeasonIfNeeded(save);

      save.meta.updatedAt = nowIso();
      writeSlot(state.settings.activeSlotId, save);
      removeMatchdayModal();
      route();
    });

    // começa a reprodução
    step();
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
        const zonePill = zone ? `<span class="pill ${zone.cls}" title="${esc(zone.title || zone.label)}">${esc(zone.label)}</span>` : '';
        const isUser = t.id === save.career.clubId;
        const isLeader = pos === 1;
        const classes = [];
        if (zone?.cls) classes.push(zone.cls);
        if (isUser) classes.push('is-user');
        if (isLeader) classes.push('is-leader');
        const trClass = classes.length ? ` class="${classes.join(' ')}"` : '';
        return `
          <tr${trClass}>
            <td style="display:flex; align-items:center; gap:10px;">
              <span>${pos}</span>
              ${zonePill}
            </td>
            <td>
              <div class="club-cell">
                ${clubLogoHtml(t.id, 26)}
                <span class="club-name">${esc(t.name)}</span>
                ${isUser ? '<span class="pill pill-mini" title="Seu clube">VOCÊ</span>' : ''}
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
            ${zoneLegendHtml(save.season.leagueId)}
            <div style="height:10px"></div>
            <button class="btn btn-primary" data-go="/continentals">Continental</button>
            <div class="sep"></div>
            <div class="table-wrap">
            <table class="table table-standings">
              <thead>
                <tr>
                  <th>#</th><th>Clube</th><th class="right">J</th><th class="right">V</th><th class="right">E</th><th class="right">D</th>
                  <th class="right">GP</th><th class="right">GC</th><th class="right">SG</th><th class="right">Pts</th>
                </tr>
              </thead>
              <tbody>${tableHtml}</tbody>
            </table>
            </div>
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

  
  // -----------------------------
  // Competições Continentais (Parte 4 - provisório)
  // -----------------------------

  function ensureContinentalStore(save) {
    if (!save.progress) save.progress = {};
    if (!save.progress.continentals) save.progress.continentals = {};
    const sid = save.season?.id || 'unknown';
    if (!save.progress.continentals[sid]) save.progress.continentals[sid] = {};
    return save.progress.continentals[sid];
  }

  // ---------------------------------------------------------------------------
  // B1.3: Continentais "ao vivo" dentro da temporada (calendário em paralelo)
  // ---------------------------------------------------------------------------

  function ensureContinentalsLive(save) {
    if (!save || !save.season) return null;
    // Migração: se o schema mudou, regeneramos para não depender de limpar LocalStorage
    const cur = save.season.continentalsLive;
    if (cur && cur.seasonId === save.season.id && cur.schemaVersion === '1.11.1') {
      return cur;
    }
    if (!save.season.continentalsLive || save.season.continentalsLive.seasonId !== save.season.id || (save.season.continentalsLive && save.season.continentalsLive.schemaVersion !== '1.11.1')) {
      const live = {
        schemaVersion: '1.11.1',
        seasonId: save.season.id,
        createdAt: nowIso(),
        nextAtRoundIndex: 1, // após a 2ª rodada doméstica (index 1)
        matchdaysPlayed: 0,
        lastPlayedAtRoundIndex: null,
        tournaments: null
      };

      // Garante que temos clubes/leagues disponíveis
      const leagues = state.packData?.competitions?.leagues || [];

      // Coleta candidatos (1ª divisão) usando o mesmo critério das zonas continentais
      const ucl = [];
      const uel = [];
      const lib = [];
      const sula = [];

      const pushUnique = (arr, ids) => {
        for (const id of (ids || [])) if (id && !arr.includes(id)) arr.push(id);
      };

      for (const lg of leagues) {
        const lid = lg?.id;
        if (!lid) continue;
        if (Number(lg.level || 1) !== 1) continue;
        const zones = getZonesForLeague(lid) || {};
        const cont = zones.continental || {};

        // CONMEBOL
        if (lid === 'BRA_SERIE_A') {
          pushUnique(lib, pickBrazilQualifiers(save, 'BRA_SERIE_A', 1, 6));
          pushUnique(sula, pickBrazilQualifiers(save, 'BRA_SERIE_A', 7, 12));
        } else {
          if (cont.libertadores) pushUnique(lib, pickLeagueQualifiers(save, lid, cont.libertadores.from, cont.libertadores.to));
          if (cont.sudamericana) pushUnique(sula, pickLeagueQualifiers(save, lid, cont.sudamericana.from, cont.sudamericana.to));
        }

        // UEFA
        if (cont.champions) pushUnique(ucl, pickLeagueQualifiers(save, lid, cont.champions.from, cont.champions.to));
        if (cont.europa) pushUnique(uel, pickLeagueQualifiers(save, lid, cont.europa.from, cont.europa.to));
      }

      // Helpers de força (precisam existir ANTES do fallback)
      const strengthOf = (clubId) => {
        try { return teamStrength(clubId, save); } catch (e) { return 60; }
      };
      const rankByStrength = (ids) => (ids || []).slice().filter(Boolean).sort((a,b) => strengthOf(b) - strengthOf(a));

      // Fallback: se as tabelas das ligas ainda não existem (início da temporada),
      // garantimos participantes pegando os melhores por força em cada liga.
      function topByStrengthFromLeague(lid, n){
        const clubs = (state.packData?.clubs?.clubs || []).filter(c => c.leagueId === lid).map(c => c.id);
        return rankByStrength(clubs).slice(0, n);
      }

      // UEFA ligas principais (e PT como bônus) – garante UCL/UEL mesmo no round 1
      const UEFA_LIDS = ['ENG_PREMIER','ESP_LALIGA','ITA_SERIE_A','GER_BUNDES','FRA_LIGUE_1','POR_LIGA'];
      if (ucl.length < 8) {
        for (const lid of UEFA_LIDS) pushUnique(ucl, topByStrengthFromLeague(lid, 4));
      }
      if (uel.length < 8) {
        for (const lid of UEFA_LIDS) pushUnique(uel, topByStrengthFromLeague(lid, 6));
      }

      // CONMEBOL (fora BR): garante LIB/SULA mesmo no round 1
      const CONM_LIDS = ['ARG_PRIMERA','URU_PRIMERA','CHI_PRIMERA','COL_PRIMERA','ECU_LIGA','VEN_LIGA','BOL_LIGA'];
      if (lib.length < 16) {
        for (const lid of CONM_LIDS) pushUnique(lib, topByStrengthFromLeague(lid, 4));
      }
      if (sula.length < 8) {
        for (const lid of CONM_LIDS) pushUnique(sula, topByStrengthFromLeague(lid, 6));
      }

      // UEFA (Europa): garante UCL/UEL mesmo se zonas/qualificações estiverem incompletas
      const UEFA_LIDS = ['ENG_PREMIER','ESP_LALIGA','ITA_SERIEA','GER_BUNDES','FRA_LIGUE1'];
      if (ucl.length < 24) {
        for (const lid of UEFA_LIDS) pushUnique(ucl, topByStrengthFromLeague(lid, 6));
      }
      if (uel.length < 16) {
        for (const lid of UEFA_LIDS) pushUnique(uel, topByStrengthFromLeague(lid, 8));
      }

      // (strengthOf / rankByStrength movidos para cima)

      const allocCfg = (state.packData?.qualifications?.continentalAllocations || {});
      const uefaAlloc = allocCfg.uefa || {};
      const conmebolAlloc = allocCfg.conmebol || {};

      const assocOfClub = (clubId) => {
        const c = getClub(clubId);
        const lid = c?.leagueId;
        const lg = (leagues || []).find(x => x.id === lid);
        return lg?.country || '??';
      };

      function selectWithAllocation(candidateIds, alloc, totalSize) {
        const uniq = [];
        for (const id of (candidateIds || [])) if (id && !uniq.includes(id)) uniq.push(id);

        const byAssoc = {};
        for (const id of uniq) {
          const a = assocOfClub(id);
          if (!byAssoc[a]) byAssoc[a] = [];
          byAssoc[a].push(id);
        }
        for (const a of Object.keys(byAssoc)) byAssoc[a] = rankByStrength(byAssoc[a]);

        const assocSlots = alloc?.assocSlots || {};
        const selected = [];
        const leftovers = [];

        // Slots por associação
        for (const a of Object.keys(assocSlots)) {
          const n = Number(assocSlots[a] || 0);
          const arr = byAssoc[a] || [];
          const take = arr.slice(0, n);
          const rest = arr.slice(n);
          for (const id of take) if (!selected.includes(id)) selected.push(id);
          for (const id of rest) if (!leftovers.includes(id)) leftovers.push(id);
          delete byAssoc[a];
        }
        // O resto vai para o pool
        for (const a of Object.keys(byAssoc)) for (const id of (byAssoc[a] || [])) if (!leftovers.includes(id)) leftovers.push(id);

        // Completa por força
        const need = Math.max(0, (Number(totalSize) || 0) - selected.length);
        const fill = rankByStrength(leftovers).slice(0, need);
        for (const id of fill) if (!selected.includes(id)) selected.push(id);

        const overflow = leftovers.filter(id => !selected.includes(id));
        return { selected, overflow };
      }

      const UCL_SIZE = Number(uefaAlloc?.champions?.size || 32);
      const UEL_SIZE = Number(uefaAlloc?.europa?.size || 32);
      const LIB_SIZE = Number(conmebolAlloc?.libertadores?.size || 32);
      const SULA_SIZE = Number(conmebolAlloc?.sudamericana?.size || 32);

      const uclPick = selectWithAllocation(ucl, uefaAlloc?.champions || {}, UCL_SIZE);
      const uclSel = uclPick.selected;
      const uclOverflow = uclPick.overflow;

      const uelPool = pushConcat([], uclOverflow, uel);
      const uelPick = selectWithAllocation(uelPool, uefaAlloc?.europa || {}, UEL_SIZE);
      const uelSel = uelPick.selected;

      const libPick = selectWithAllocation(lib, conmebolAlloc?.libertadores || {}, LIB_SIZE);
      const libSel = libPick.selected;
      const libOverflow = libPick.overflow;

      const sulaPool = pushConcat([], libOverflow, sula);
      const sulaPick = selectWithAllocation(sulaPool, conmebolAlloc?.sudamericana || {}, SULA_SIZE);
      const sulaSel = sulaPick.selected;

      // Inicializa torneios "ao vivo" (não simula tudo de uma vez)
      live.tournaments = {
        conmebol: {
          libertadores: initLibertadoresLive(save, 'CONMEBOL_LIB', 'CONMEBOL Libertadores', libSel),

    // CONMEBOL Sul-Americana - matchday (grupos) -> depois KO
    if (sud && sud.format === 'GROUPS+KO' && sud.stage === 'GROUPS') {
      const md = sud.matchdayIndex || 0;
      for (const g of (sud.groups || [])) {
        const fixtures = g.matchdays?.[md] || [];
        for (const fx of fixtures) {
          const sim = simulateMatch(fx.homeId, fx.awayId, save);
          applyGroupResult(g.tableObj, fx.homeId, fx.awayId, sim.hg, sim.ag);
          g.played.push({ matchday: md+1, homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag });
          const stats = buildMatchStats(fx.homeId, fx.awayId, sim, save);
          const timeline = buildTimelineForMatch(fx.homeId, fx.awayId, sim, save);
          playedMatches.push({ comp: 'SUD', homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag, stats, timeline });
        }
        g.table = sortMiniTable(Object.values(g.tableObj));
      }
      sud.matchdayIndex = md + 1;
      if (sud.matchdayIndex >= 6) {
        const qualified = [];
        for (const g of (sud.groups || [])) {
          if (g.table?.[0]?.id) qualified.push(g.table[0].id);
          if (g.table?.[1]?.id) qualified.push(g.table[1].id);
        }
        sud.knockout = initKnockoutLive(save, sud.id + '_KO', sud.name + ' • Mata-mata', qualified.slice(0,16));
        sud.stage = 'KO';
      }
    } else if (sud && sud.format === 'GROUPS+KO' && sud.stage === 'KO' && sud.knockout) {
      const res = playKnockoutRound(save, sud.knockout);
      playedMatches.push(...(res.playedMatches || []).map(m => ({ ...m, comp: 'SUD' })));
      if (sud.knockout.championId) {
        sud.championId = sud.knockout.championId;
        sud.championName = sud.knockout.championName;
      }
    }


    // UEFA Champions League - matchday (grupos) -> depois KO
    if (ucl && ucl.format === 'GROUPS+KO' && ucl.stage === 'GROUPS') {
      const md = ucl.matchdayIndex || 0;
      for (const g of (ucl.groups || [])) {
        const fixtures = g.matchdays?.[md] || [];
        for (const fx of fixtures) {
          const sim = simulateMatch(fx.homeId, fx.awayId, save);
          applyGroupResult(g.tableObj, fx.homeId, fx.awayId, sim.hg, sim.ag);
          g.played.push({ matchday: md+1, homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag });
          const stats = buildMatchStats(fx.homeId, fx.awayId, sim, save);
          const timeline = buildTimelineForMatch(fx.homeId, fx.awayId, sim, save);
          playedMatches.push({ comp: 'UCL', homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag, stats, timeline });
        }
        g.table = sortMiniTable(Object.values(g.tableObj));
      }
      ucl.matchdayIndex = md + 1;
      if (ucl.matchdayIndex >= 6) {
        const qualified = [];
        for (const g of (ucl.groups || [])) {
          if (g.table?.[0]?.id) qualified.push(g.table[0].id);
          if (g.table?.[1]?.id) qualified.push(g.table[1].id);
        }
        ucl.knockout = initKnockoutLive(save, ucl.id + '_KO', ucl.name + ' • Mata-mata', qualified.slice(0,16));
        ucl.stage = 'KO';
      }
    } else if (ucl && ucl.format === 'GROUPS+KO' && ucl.stage === 'KO' && ucl.knockout) {
      const res = playKnockoutRound(save, ucl.knockout);
      playedMatches.push(...(res.playedMatches || []).map(m => ({ ...m, comp: 'UCL' })));
      if (ucl.knockout.championId) {
        ucl.championId = ucl.knockout.championId;
        ucl.championName = ucl.knockout.championName;
      }
    }


    // Europa League - rodada fase de liga -> depois KO
    if (uel && uel.format === 'LEAGUE+KO' && uel.stage === 'LEAGUE') {
      const ri = uel.roundIndex || 0;
      const rnd = uel.leaguePhase?.rounds?.[ri];
      if (rnd) {
        for (const m of (rnd.matches || [])) {
          if (m.played) continue;
          const sim = simulateMatch(m.homeId, m.awayId, save);
          m.played = true; m.hg = sim.hg; m.ag = sim.ag;
          applyGroupResult(uel.leaguePhase.tableObj, m.homeId, m.awayId, sim.hg, sim.ag);
          const stats = buildMatchStats(m.homeId, m.awayId, sim, save);
          const timeline = buildTimelineForMatch(m.homeId, m.awayId, sim, save);
          playedMatches.push({ comp: 'UEL', homeId: m.homeId, awayId: m.awayId, hg: sim.hg, ag: sim.ag, stats, timeline });
        }
        uel.leaguePhase.table = sortMiniTable(Object.values(uel.leaguePhase.tableObj));
      }
      uel.roundIndex = ri + 1;

      // Após a última rodada, cria mata-mata com Top 8
      if (uel.roundIndex >= (uel.leaguePhase?.rounds?.length || 0)) {
        const qualified = (uel.leaguePhase.table || []).slice(0,8).map(r => r.id);
        uel.knockout = initKnockoutLive(save, uel.id + '_KO', uel.name + ' • Mata-mata', qualified);
        uel.stage = 'KO';
      }
    } else if (uel && uel.format === 'LEAGUE+KO' && uel.stage === 'KO' && uel.knockout) {
      const res = playKnockoutRound(save, uel.knockout);
      playedMatches.push(...(res.playedMatches || []).map(m => ({ ...m, comp: 'UEL' })));
      if (uel.knockout.championId) {
        uel.championId = uel.knockout.championId;
        uel.championName = uel.knockout.championName;
      }
    } else if (uel && uel.format === 'KO') {
      // compatibilidade antiga
      const res = playKnockoutRound(save, uel);
      playedMatches.push(...(res.playedMatches || []).map(m => ({ ...m, comp: 'UEL' })));
    }

    // CONMEBOL Sul-Americana - matchday (grupos) -> depois KO
    if (sud && sud.format === 'GROUPS+KO' && sud.stage === 'GROUPS') {
      const md = sud.matchdayIndex || 0;
      for (const g of (sud.groups || [])) {
        const fixtures = g.matchdays?.[md] || [];
        for (const fx of fixtures) {
          const sim = simulateMatch(fx.homeId, fx.awayId, save);
          applyGroupResult(g.tableObj, fx.homeId, fx.awayId, sim.hg, sim.ag);
          g.played.push({ matchday: md+1, homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag });
          const stats = buildMatchStats(fx.homeId, fx.awayId, sim, save);
          const timeline = buildTimelineForMatch(fx.homeId, fx.awayId, sim, save);
          playedMatches.push({ comp: 'SUD', homeId: fx.homeId, awayId: fx.awayId, hg: sim.hg, ag: sim.ag, stats, timeline });
        }
        g.table = sortMiniTable(Object.values(g.tableObj));
      }
      sud.matchdayIndex = md + 1;
      if (sud.matchdayIndex >= 6) {
        const qualified = [];
        for (const g of (sud.groups || [])) {
          if (g.table?.[0]?.id) qualified.push(g.table[0].id);
          if (g.table?.[1]?.id) qualified.push(g.table[1].id);
        }
        sud.knockout = initKnockoutLive(save, sud.id + '_KO', sud.name + ' • Mata-mata', qualified.slice(0,16));
        sud.stage = 'KO';
      }
    } else if (sud && sud.format === 'GROUPS+KO' && sud.stage === 'KO' && sud.knockout) {
      const res = playKnockoutRound(save, sud.knockout);
      playedMatches.push(...(res.playedMatches || []).map(m => ({ ...m, comp: 'SUD' })));
      if (sud.knockout.championId) {
        sud.championId = sud.knockout.championId;
        sud.championName = sud.knockout.championName;
      }
    }


    // Champions: Liga + KO
    if (t.format === 'LEAGUE+KO') {
      const lt = t.leaguePhase?.table || [];
      const rounds = t.leaguePhase?.rounds || [];
      const top8 = renderMiniTableBlock(lt, { topBold: 8, limit: 8 });
      const roundsInfo = `<div class="mini">Rodadas simuladas: ${rounds.length}</div>`;

      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-header">
            <div>
              <div class="card-title">${esc(t.name)}</div>
              <div class="card-subtitle">Formato clássico: fase de grupos (32) + mata-mata (16)</div>
            </div>
            <span class="badge">Campeão</span>
          </div>
          <div class="card-body">
            <div class="row" style="align-items:center; gap:10px;">${champ}</div>
            <div class="sep"></div>
            <div class="label">Top 2 por grupo</div>
            ${top8}
            ${roundsInfo}
            <details style="margin-top:10px;">
              <summary class="btn">Ver fase de grupos</summary>
              ${renderMiniTableBlock(lt, { topBold: 16, limit: lt.length })}
            </details>
            <details style="margin-top:10px;">
              <summary class="btn btn-primary">Ver mata-mata</summary>
              ${renderKnockoutRoundsHtml(t.knockout)}
            </details>
          </div>
        </div>
      `;
    }

    // fallback
    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-header">
          <div>
            <div class="card-title">${esc(t.name)}</div>
            <div class="card-subtitle">Formato: ${esc(t.format || 'desconhecido')}</div>
          </div>
        </div>
        <div class="card-body">${champ}</div>
      </div>
    `;
  }



  function viewContinentals() {
    return requireSave((save) => {
      ensureSystems(save);
      ensureSeason(save);

      const sid = save.season?.id || 'unknown';
      const contStore = ensureContinentalStore(save);

      let info = '';
      let useLive = null;
      if (save.season.completed) {
        // Gera/atualiza ao final
        try { generateContinentalCompetitionsForSeason(save); } catch (e) {}
        info = `<div class="notice success">Torneios continentais gerados para a temporada ${esc(sid)}.</div>`;
      } else {
        // B1.3: Agora os continentais existem dentro da temporada.
        useLive = ensureContinentalsLive(save);
        const nextAt = (useLive?.nextAtRoundIndex ?? null);
        const nextHuman = (nextAt === null) ? '—' : `após a rodada ${nextAt + 1}`;
        const lastAt = (useLive?.lastPlayedAtRoundIndex ?? null);
        const lastHuman = (lastAt === null) ? '—' : `após a rodada ${lastAt + 1}`;

        info = `
          <div class="notice">Temporada em andamento. Os continentais são simulados em paralelo (estilo manager).</div>
          <div class="sep"></div>
          <div class="grid">
            <div class="col-6">
              <div class="label">Próximo matchday continental</div>
              <div class="small"><b>${esc(nextHuman)}</b></div>
            </div>
            <div class="col-6">
              <div class="label">Último matchday continental</div>
              <div class="small"><b>${esc(lastHuman)}</b></div>
            </div>
          </div>
          <div style="height:10px"></div>
          <button class="btn" data-action="playContinentalMatchday">Simular matchday continental agora</button>
          <button class="btn" data-action="openLastContinentalMatchday">Ver último matchday (narrativa)</button>
        `;
      }

      // Fonte dos dados: ao vivo (temporada) ou store final (pós-temporada)
      const source = save.season.completed
        ? {
            lib: contStore.libertadores,
            sud: contStore.sudamericana,
            ucl: contStore.uefa?.champions,
            uel: contStore.uefa?.europa
          }
        : {
            lib: useLive?.tournaments?.conmebol?.libertadores,
            sud: useLive?.tournaments?.conmebol?.sudamericana,
            ucl: useLive?.tournaments?.uefa?.champions,
            uel: useLive?.tournaments?.uefa?.europa
          };

      const libCard = source.lib ? renderTournamentCard(source.lib) : '';
      const sudCard = source.sud ? renderTournamentCard(source.sud) : '';

      const uclCard = source.ucl ? renderTournamentCard(source.ucl) : '';
      const uelCard = source.uel ? renderTournamentCard(source.uel) : '';

      writeSlot(state.settings.activeSlotId, save);

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Continental</div>
              <div class="card-subtitle">CONMEBOL • UEFA • ${esc(sid)}</div>
            </div>
            <span class="badge">${save.season.completed ? 'Concluído' : 'Em andamento'}</span>
          </div>
          <div class="card-body">
            ${info}
            <div class="sep"></div>

            <div class="label">CONMEBOL</div>
            ${libCard}
            ${sudCard}

            <div class="sep"></div>
            <div class="label">UEFA</div>
            ${uclCard}
            ${uelCard}

            <div class="sep"></div>
            <div class="row">
              <button class="btn btn-primary" data-go="/competitions">Voltar</button>
              <button class="btn" data-go="/matches">Jogos</button>
              <button class="btn" data-go="/hub">HUB</button>
            </div>

            <div class="sep"></div>
            <div class="mini">Obs.: formatos avançados provisórios (fase de grupos / fase de liga) para dar sensação AAA. Depois podemos migrar para formatos 100% reais (Libertadores completa e Champions 36 clubes).</div>
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
      ensureSeason(save);
      // processa pipeline (expira/gera ofertas) sempre que abrir a tela
      try { processTransferPipeline(save); } catch (e) {}

      const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
      const cashStr = (save.finance?.cash || 0).toLocaleString('pt-BR', { style: 'currency', currency });

      const win = getTransferWindow(save);
      const winBadge = win.open ? `<span class="badge">✅ ${esc(win.label)}</span>` : `<span class="badge">⛔ ${esc(win.label)}</span>`;

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
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 120); // limite para performance mobile

      const posOpts = ['ALL', 'GK', 'DEF', 'MID', 'ATT']
        .map((p) => `<option value="${p}" ${p === filterPos ? 'selected' : ''}>${p === 'ALL' ? 'Todos' : p}</option>`)
        .join('');

      const marketRows = filtered.map((p) => {
        const price = Number(p.value || 0);
        const priceStr = price.toLocaleString('pt-BR', { style: 'currency', currency });
        const affordable = (save.finance?.cash || 0) >= price;
        const open = win.open;
        return `
          <tr>
            <td>${esc(p.name)}</td>
            <td class="center">${esc(p.pos)}</td>
            <td class="center">${esc(p.age)}</td>
            <td class="center">${esc(p.overall)}</td>
            <td class="right">${priceStr}</td>
            <td class="center">
              <button class="btn btn-primary" data-action="makeOffer" data-pid="${esc(p.id)}" ${open && affordable ? '' : 'disabled'}>Fazer oferta</button>
            </td>
          </tr>
        `;
      }).join('');

      const outbox = (save.transfers?.outbox || []).slice().reverse().slice(0, 30);
      const inbox = (save.transfers?.inbox || []).slice().reverse().slice(0, 30);

      const outRows = outbox.map((o) => {
        const feeStr = Number(o.fee || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const st = o.status || 'PENDING';
        const badge = st === 'ACCEPTED' ? '✅ Aceita' : st === 'COUNTERED' ? '🟠 Contra-oferta' : st === 'REJECTED' ? '⛔ Recusada' : st === 'EXPIRED' ? '⌛ Expirada' : '⏳ Pendente';
        const counter = (st === 'COUNTERED' && o.counter) ? ` | Contra: ${(Number(o.counter.fee||0)).toLocaleString('pt-BR',{style:'currency',currency})}` : '';
        const actions = (st === 'COUNTERED')
          ? `<button class="btn btn-primary" data-action="acceptCounter" data-oid="${esc(o.id)}">Aceitar</button>
             <button class="btn btn-ghost" data-action="rejectOfferOut" data-oid="${esc(o.id)}">Recusar</button>`
          : (st === 'PENDING')
            ? `<button class="btn btn-ghost" data-action="cancelOfferOut" data-oid="${esc(o.id)}">Cancelar</button>`
            : '';
        return `
          <tr>
            <td>${esc(o.playerName || '')}</td>
            <td class="center">${badge}</td>
            <td class="right">${feeStr}${counter}</td>
            <td class="center">${actions || '<span class="mini">—</span>'}</td>
          </tr>
        `;
      }).join('');

      const inRows = inbox.map((o) => {
        const feeStr = Number(o.fee || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const st = o.status || 'PENDING';
        const badge = st === 'ACCEPTED' ? '✅ Aceita' : st === 'COUNTERED' ? '🟠 Contra-oferta' : st === 'REJECTED' ? '⛔ Recusada' : st === 'EXPIRED' ? '⌛ Expirada' : '⏳ Pendente';
        const actions = (st === 'PENDING' || st === 'COUNTERED')
          ? `<button class="btn btn-primary" data-action="acceptOfferIn" data-oid="${esc(o.id)}">Aceitar</button>
             <button class="btn btn-ghost" data-action="rejectOfferIn" data-oid="${esc(o.id)}">Recusar</button>`
          : '';
        return `
          <tr>
            <td>${esc(o.playerName || '')}</td>
            <td class="center">${esc(o.from?.clubName || 'Clube')}</td>
            <td class="center">${badge}</td>
            <td class="right">${feeStr}</td>
            <td class="center">${actions || '<span class="mini">—</span>'}</td>
          </tr>
        `;
      }).join('');

      const log = (save.transfers?.log || []).slice().reverse().slice(0, 30).map((t) => {
        const feeStr = Number(t.fee || 0).toLocaleString('pt-BR', { style: 'currency', currency });
        const kind = t.kind === 'SELL' ? 'Venda' : 'Compra';
        return `<tr><td>${esc(kind)}</td><td>${esc(t.playerName||'')}</td><td class="right">${feeStr}</td><td class="mini">${esc(t.at||'')}</td></tr>`;
      }).join('');

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Mercado de Transferências</div>
              <div class="card-subtitle">Propostas, contra-ofertas e ofertas recebidas (Parte 5)</div>
            </div>
            <span class="badge">Caixa: ${cashStr}</span>
          </div>
          <div class="card-body">
            <div class="notice">Status da janela: ${winBadge}</div>
            <div class="sep"></div>

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
            <div class="label">Jogadores disponíveis (mercado global)</div>
            <table class="table">
              <thead><tr><th>Nome</th><th class="center">Pos</th><th class="center">Idade</th><th class="center">OVR</th><th class="right">Valor</th><th class="center">Ação</th></tr></thead>
              <tbody>${marketRows || `<tr><td colspan="6" class="mini">Nenhum jogador encontrado.</td></tr>`}</tbody>
            </table>

            <div class="sep"></div>
            <div class="label">Minhas ofertas (enviadas)</div>
            <table class="table">
              <thead><tr><th>Jogador</th><th class="center">Status</th><th class="right">Oferta</th><th class="center">Ações</th></tr></thead>
              <tbody>${outRows || `<tr><td colspan="4" class="mini">Nenhuma oferta enviada.</td></tr>`}</tbody>
            </table>

            <div class="sep"></div>
            <div class="label">Ofertas recebidas (por seus jogadores)</div>
            <table class="table">
              <thead><tr><th>Jogador</th><th class="center">De</th><th class="center">Status</th><th class="right">Valor</th><th class="center">Ações</th></tr></thead>
              <tbody>${inRows || `<tr><td colspan="5" class="mini">Nenhuma oferta recebida.</td></tr>`}</tbody>
            </table>

            <div class="sep"></div>
            <div class="label">Histórico recente</div>
            <table class="table">
              <thead><tr><th>Tipo</th><th>Jogador</th><th class="right">Valor</th><th>Data</th></tr></thead>
              <tbody>${log || `<tr><td colspan="4" class="mini">Sem histórico ainda.</td></tr>`}</tbody>
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
    const hasDiag = typeof window !== 'undefined' && !!window.VFM_DIAG;
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Admin</div></div>
        <div class="card-body">
          <div class="notice">Painel de administração (Parte 3). Ferramentas extras para depuração e manutenção.</div>
          <div class="sep"></div>
          ${hasDiag ? '<button class="btn btn-primary" data-go="/diagnostics">Diagnósticos</button>' : ''}
          <button class="btn btn-ghost" data-go="/home">Menu</button>
        </div>
      </div>
    `;
  }

  function viewDiagnostics() {
    const hasDiag = typeof window !== 'undefined' && !!window.VFM_DIAG;
    if (!hasDiag) {
      return `
        <div class="card">
          <div class="card-header"><div class="card-title">Diagnósticos</div></div>
          <div class="card-body">
            <div class="notice">Sistema de diagnósticos não carregou. Verifique se <b>js/diagnostics.js</b> está publicado.</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/home">Menu</button>
          </div>
        </div>
      `;
    }
    try {
      return window.VFM_DIAG.renderHtml();
    } catch (e) {
      return `
        <div class="card">
          <div class="card-header"><div class="card-title">Diagnósticos</div></div>
          <div class="card-body">
            <div class="notice">Falha ao renderizar relatório: ${esc(e?.message || e)}</div>
            <div class="sep"></div>
            <button class="btn btn-primary" data-go="/home">Menu</button>
          </div>
        </div>
      `;
    }
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

      // --- Diagnósticos (provisório)
      if (action === 'diagCopy') {
        el.addEventListener('click', () => {
          try {
            const ok = (typeof window !== 'undefined' && window.__vfmDiagCopy) ? window.__vfmDiagCopy() : false;
            // Feedback simples
            if (ok) alert('Relatório copiado! Cole no WhatsApp/Email e envie.');
            else alert('Não foi possível copiar automaticamente. Abra em outro navegador ou use Print/Compartilhar.');
          } catch (e) {
            alert('Falha ao copiar relatório.');
          }
        });
        return;
      }

      if (action === 'diagClear') {
        el.addEventListener('click', () => {
          try {
            if (typeof window !== 'undefined' && window.VFM_DIAG && window.VFM_DIAG.clear) {
              window.VFM_DIAG.clear();
            }
          } catch (e) {}
          route();
        });
        return;
      }

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
          // UX: escolher o clube já deve avançar (evita o botão "Continuar" e o scroll no celular)
          location.hash = '/tutorial';
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

      
// --- Transferências (Parte 5)
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

if (action === 'makeOffer') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    ensureSeason(save);

    const win = getTransferWindow(save);
    if (!win.open) {
      alert('Janela de transferências fechada. Aguarde a próxima janela.');
      return;
    }

    const pid = el.getAttribute('data-pid');
    const p = (state.packData?.players?.players || []).find(x => x.id === pid);
    if (!p) return;

    const value = Number(p.value || 0);
    const currency = state.packData?.rules?.gameRules?.currency || 'BRL';
    const valueStr = value.toLocaleString('pt-BR', { style: 'currency', currency });

    const fee = Number(prompt(`Oferta pelo jogador ${p.name}
Valor estimado: ${valueStr}

Digite a oferta (apenas número):`, String(value)));
    if (!Number.isFinite(fee) || fee <= 0) return;

    if (!save.finance) save.finance = { cash: 0 };
    if ((save.finance.cash || 0) < fee) {
      alert('Caixa insuficiente para esta oferta.');
      return;
    }

    const wage = Number(prompt(`Salário mensal proposto (apenas número).
Dica: use 100000 - 500000`, String(p.wage || 150000)));
    const safeWage = Number.isFinite(wage) && wage >= 0 ? wage : 0;

    const offer = {
      id: uid('offer'),
      type: 'OUT',
      pid,
      playerName: p.name,
      fee: Math.round(fee),
      wage: Math.round(safeWage),
      status: 'PENDING',
      createdAt: nowIso(),
      createdRound: Number(save.season.currentRound || 0),
      expiresRound: Number(save.season.currentRound || 0) + 3
    };

    save.transfers.outbox.push(offer);
    save.meta.updatedAt = nowIso();
    writeSlot(state.settings.activeSlotId, save);
    route();
  });
}

if (action === 'cancelOfferOut') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    const oid = el.getAttribute('data-oid');
    const o = (save.transfers.outbox || []).find(x => x.id === oid);
    if (!o) return;
    if (o.status !== 'PENDING') return;
    o.status = 'CANCELLED';
    o.closedAt = nowIso();
    save.meta.updatedAt = nowIso();
    writeSlot(state.settings.activeSlotId, save);
    route();
  });
}

if (action === 'acceptCounter') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    ensureSeason(save);

    const oid = el.getAttribute('data-oid');
    const o = (save.transfers.outbox || []).find(x => x.id === oid);
    if (!o || o.status !== 'COUNTERED' || !o.counter) return;

    const fee = Number(o.counter.fee || 0);
    const wage = Number(o.counter.wage || 0);

    const res = finalizeBuy(save, o.pid, fee, wage);
    if (!res.ok) {
      alert(res.message || 'Não foi possível concluir a compra.');
      return;
    }

    o.status = 'ACCEPTED';
    o.closedAt = nowIso();
    save.meta.updatedAt = nowIso();
    writeSlot(state.settings.activeSlotId, save);
    route();
  });
}

if (action === 'rejectOfferOut') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    const oid = el.getAttribute('data-oid');
    const o = (save.transfers.outbox || []).find(x => x.id === oid);
    if (!o) return;
    if (o.status !== 'COUNTERED') return;
    o.status = 'REJECTED';
    o.reason = 'Recusado pelo clube';
    o.closedAt = nowIso();
    save.meta.updatedAt = nowIso();
    writeSlot(state.settings.activeSlotId, save);
    route();
  });
}

if (action === 'acceptOfferIn') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    ensureSeason(save);

    const win = getTransferWindow(save);
    if (!win.open) {
      alert('Janela fechada. Não é possível vender agora.');
      return;
    }

    const oid = el.getAttribute('data-oid');
    const res = finalizeSell(save, oid);
    if (!res.ok) {
      alert(res.message || 'Não foi possível concluir a venda.');
      return;
    }

    save.meta.updatedAt = nowIso();
    writeSlot(state.settings.activeSlotId, save);
    route();
  });
}

if (action === 'rejectOfferIn') {
  el.addEventListener('click', () => {
    const save = activeSave();
    if (!save) return;
    ensureSystems(save);
    const oid = el.getAttribute('data-oid');
    const o = (save.transfers.inbox || []).find(x => x.id === oid);
    if (!o) return;
    if (o.status !== 'PENDING' && o.status !== 'COUNTERED') return;
    o.status = 'REJECTED';
    o.closedAt = nowIso();
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

          // A2: abre modal/tela de partida com narrativa e estatísticas.
          // O resultado só é aplicado ao confirmar no modal.
          openMatchdayModal(save, r);
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

      if (action === 'playContinentalMatchday') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          ensureSeason(save);
          let csum = null;
          try {
            ensureContinentalsLive(save);
            csum = advanceOneContinentalMatchday(save, { manual: true });
            try {
              if (save.season && save.season.continentalsLive) save.season.continentalsLive.lastSummary = csum;
            } catch(e) {}
            applyContinentalEconomy(save, csum);
            writeSlot(state.settings.activeSlotId, save);
          } catch (e) {}
          // abre narrativa do matchday (B1.4)
          try { openContinentalMatchdayModal(save, csum); } catch (e) { route(); }
        });
      }

      if (action === 'openLastContinentalMatchday') {
        el.addEventListener('click', () => {
          const save = activeSave();
          if (!save) return;
          ensureSystems(save);
          ensureSeason(save);
          const sum = save.season?.continentalsLive?.lastSummary || null;
          try { openContinentalMatchdayModal(save, sum); } catch (e) { route(); }
        });
      }
    });
  }

  /** Inicializa a aplicação */
  
  // -----------------------------
  // Continental Matchday Modal (B1.4) – Central/Narrativa
  // -----------------------------
  function removeContinentalModal(){
    const ov = document.getElementById('vfmContinentalOverlay');
    if (ov) ov.remove();
  }

  function openContinentalMatchdayModal(save, summary){
    removeContinentalModal();
    if (!summary || !Array.isArray(summary.playedMatches) || summary.playedMatches.length === 0) return;

    const userId = save.career?.clubId;
    const focus = (summary.userMatches && summary.userMatches[0]) ? summary.userMatches[0] : summary.playedMatches[0];

    const home = getClub(focus.homeId);
    const away = getClub(focus.awayId);

    const compLabel = (focus.comp === 'LIB') ? 'CONMEBOL Libertadores'
                    : (focus.comp === 'SUD') ? 'CONMEBOL Sul-Americana'
                    : (focus.comp === 'UCL') ? 'UEFA Champions League'
                    : (focus.comp === 'UEL') ? 'UEFA Europa League'
                    : 'Continental';

    const currency = state.packData?.rules?.gameRules?.currency || 'BRL';

    const allResultsRows = summary.playedMatches.slice(0, 120).map(m=>{
      const h = getClub(m.homeId); const a = getClub(m.awayId);
      const tag = (m.comp==='LIB')?'LIB':(m.comp==='SUD')?'SULA':(m.comp==='UCL')?'UCL':(m.comp==='UEL')?'UEL':'';
      const isUser = (m.homeId===userId || m.awayId===userId);
      return `
        <div class="vfmRow ${isUser?'vfmRowUser':''}">
          <div class="vfmMiniTag">${esc(tag)}</div>
          <div class="vfmMiniTeam">${esc(h?.short || h?.name || m.homeId)}</div>
          <div class="vfmMiniScore">${m.hg}–${m.ag}</div>
          <div class="vfmMiniTeam">${esc(a?.short || a?.name || m.awayId)}</div>
        </div>
      `;
    }).join('');

    const stats = focus.stats || {};
    const timeline = focus.timeline || [];

    const overlay = document.createElement('div');
    overlay.id = 'vfmContinentalOverlay';
    overlay.innerHTML = `
      <style>
        #vfmContinentalOverlay{ position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; padding:10px; }
        #vfmContinentalOverlay .vfmBox{ width:min(900px, 100%); max-height:92vh; overflow:auto; background:#0f172a; color:#fff; border-radius:16px; border:1px solid rgba(255,255,255,.12); box-shadow:0 12px 40px rgba(0,0,0,.45); }
        #vfmContinentalOverlay .vfmHead{ padding:14px 14px 8px; border-bottom:1px solid rgba(255,255,255,.10); }
        #vfmContinentalOverlay .vfmComp{ font-size:12px; opacity:.85; }
        #vfmContinentalOverlay .vfmLine{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:8px; }
        #vfmContinentalOverlay .vfmTeam{ display:flex; align-items:center; gap:10px; min-width:0; }
        #vfmContinentalOverlay .vfmTeam img{ width:44px; height:44px; object-fit:contain; background:rgba(255,255,255,.06); border-radius:10px; padding:4px; }
        #vfmContinentalOverlay .vfmName{ font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        #vfmContinentalOverlay .vfmScore{ font-size:34px; font-weight:900; letter-spacing:1px; }
        #vfmContinentalOverlay .vfmBody{ padding:12px 14px; display:grid; grid-template-columns: 1.2fr .8fr; gap:12px; }
        @media(max-width:820px){ #vfmContinentalOverlay .vfmBody{ grid-template-columns:1fr; } }
        #vfmContinentalOverlay .vfmCard{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:12px; }
        #vfmContinentalOverlay .vfmTitle{ font-weight:800; margin-bottom:8px; }
        #vfmContinentalOverlay .vfmLog{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; font-size:12px; line-height:1.5; }
        #vfmContinentalOverlay .vfmRow{ display:grid; grid-template-columns: 44px 1fr 70px 1fr; gap:8px; align-items:center; padding:6px 0; border-bottom:1px dashed rgba(255,255,255,.10); }
        #vfmContinentalOverlay .vfmRow:last-child{ border-bottom:none; }
        #vfmContinentalOverlay .vfmRowUser{ background:rgba(34,197,94,.10); border-radius:10px; padding:8px; }
        #vfmContinentalOverlay .vfmMiniTag{ font-weight:800; font-size:11px; opacity:.85; }
        #vfmContinentalOverlay .vfmMiniScore{ text-align:center; font-weight:900; }
        #vfmContinentalOverlay .vfmFooter{ padding:12px 14px; border-top:1px solid rgba(255,255,255,.10); display:flex; gap:10px; justify-content:flex-end; }
        #vfmContinentalOverlay .btn{ cursor:pointer; }
      </style>

      <div class="vfmBox">
        <div class="vfmHead">
          <div class="vfmComp">${esc(compLabel)} • Matchday</div>
          <div class="vfmLine">
            <div class="vfmTeam">
              <img src="${esc(logoClubUrl(focus.homeId))}" onerror="this.onerror=null;this.src='assets/club_placeholder.svg';" />
              <div class="vfmName">${esc(home?.name || focus.homeId)}</div>
            </div>
            <div class="vfmScore">${focus.hg}–${focus.ag}</div>
            <div class="vfmTeam" style="justify-content:flex-end">
              <div class="vfmName" style="text-align:right">${esc(away?.name || focus.awayId)}</div>
              <img src="${esc(logoClubUrl(focus.awayId))}" onerror="this.onerror=null;this.src='assets/club_placeholder.svg';" />
            </div>
          </div>
        </div>

        <div class="vfmBody">
          <div class="vfmCard">
            <div class="vfmTitle">Relato do jogo</div>
            <div id="vfmContLog" class="vfmLog"></div>
            <div style="height:10px"></div>
            <div class="grid">
              <div class="col-6"><div class="label">Posse</div><div><b>${(stats.possessionH ?? 50)}%</b> x <b>${(stats.possessionA ?? 50)}%</b></div></div>
              <div class="col-6"><div class="label">Finalizações (no gol)</div><div><b>${stats.shotsH ?? 0}</b> (${stats.onH ?? 0}) x <b>${stats.shotsA ?? 0}</b> (${stats.onA ?? 0})</div></div>
              <div class="col-6"><div class="label">Faltas</div><div><b>${stats.foulsH ?? 0}</b> x <b>${stats.foulsA ?? 0}</b></div></div>
              <div class="col-6"><div class="label">Escanteios</div><div><b>${stats.cornersH ?? 0}</b> x <b>${stats.cornersA ?? 0}</b></div></div>
            </div>
          </div>

          <div class="vfmCard">
            <div class="vfmTitle">Resultados da rodada</div>
            <div>${allResultsRows || '<div class="small">Sem jogos.</div>'}</div>
          </div>
        </div>

        <div class="vfmFooter">
          <button class="btn" id="vfmContSkip">Pular</button>
          <button class="btn btn-primary" id="vfmContClose" disabled>Avançar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const logEl = document.getElementById('vfmContLog');
    const btnSkip = document.getElementById('vfmContSkip');
    const btnClose = document.getElementById('vfmContClose');

    let i = 0;
    let done = false;
    const writeLine = (t) => {
      const div = document.createElement('div');
      div.textContent = t;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    };

    function finish(){
      if (done) return;
      done = true;
      btnClose.disabled = false;
    }

    function tick(){
      if (i >= timeline.length) { finish(); return; }
      writeLine(timeline[i].text || String(timeline[i]));
      i += 1;
      setTimeout(tick, rndi(220, 520));
    }

    // start
    if (!timeline.length) {
      writeLine("— Sem eventos detalhados —");
      finish();
    } else {
      tick();
    }

    btnSkip.addEventListener('click', () => {
      if (done) return;
      while (i < timeline.length) { writeLine(timeline[i].text || String(timeline[i])); i += 1; }
      finish();
    });

    btnClose.addEventListener('click', () => {
      removeContinentalModal();
      route();
    });
  }


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