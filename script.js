/* =========================================================
   Last Call Dispatch Operator - Fase 2C (PATCH v2)
   - FIX: typewriter não reinicia a cada tick
   - IMPROVE: typewriter mais humano (lento + pausas)
   - IMPROVE: toque no texto pula para o final
   ========================================================= */

(function () {
  "use strict";

const BUILD_TAG = "Stage 9 • Build 2026-03-06 20:05:00 UTC (phase3-dispatch-transcript-fix-2)";

  // ----------------------------
  // Build info (always visible)
  // ----------------------------
  const BUILD = {
    version: "1.2.3",
    stage: "9",
    builtAt: "2026-03-06 20:05:00 UTC",
    tag: "phase3-dispatch-transcript-fix-2",
  };
  const PROJECT = {
    completion: 67,
    roadmapStages: 8,
    focus: "Estabilidade do atendimento, expansão de conteúdo Phase 3 e preparo da base para roadmap comercial",
  };
  const BUILD_TEXT = `Last Call Dispatch Operator ${BUILD.version} • Stage ${BUILD.stage} • Build ${BUILD.builtAt} • Conclusão ${PROJECT.completion}%`; 

  // ----------------------------
  // Helpers
  // ----------------------------
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtTime = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;
  const escapeHtml = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function nowStamp() {
    const d = new Date();
    return `[${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}]`;
  }

  function safeRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }


  function agencyMeta(agency) {
    const a = String(agency || "police").toLowerCase();
    if (a === "fire") return { key: "fire", label: "Bombeiros", icon: "🚒" };
    if (a === "ambulance") return { key: "ambulance", label: "Ambulância / SAMU / EMS", icon: "🚑" };
    return { key: "police", label: "Polícia", icon: "🚓" };
  }

  function cityCountryById(cityId) {
    const c = getCities().find((x) => x.id === cityId);
    const cc = String(c && c.country ? c.country : "BR").toUpperCase();
    if (cc === "UK") return "EU";
    return cc;
  }

  function resolveRegion(region) {
    const raw = String(region || "").toUpperCase();
    const cityCountry = cityCountryById(state.cityId);
    if (!raw || raw.includes("/")) {
      if (cityCountry === "JP") return "AS";
      if (cityCountry === "AU") return "OC";
      if (cityCountry === "ZA") return "AF";
      if (cityCountry === "EU" || cityCountry === "UK") return "EU";
      if (cityCountry === "US") return "US";
      return "BR";
    }
    if (raw === "JP") return "AS";
    if (raw === "AU") return "OC";
    if (raw === "ZA") return "AF";
    if (raw === "UK") return "EU";
    return raw;
  }

  // ----------------------------
  // Stage 7B: Map + unit movement (Leaflet)
  // ----------------------------
  const CITY_CENTERS = {
    br_sp: { lat: -23.5505, lng: -46.6333 },
    br_df: { lat: -15.7939, lng: -47.8828 },
    us_nyc: { lat: 40.7128, lng: -74.0060 },
    us_la: { lat: 34.0522, lng: -118.2437 },
    eu_ldn: { lat: 51.5074, lng: -0.1278 },
    fr_par: { lat: 48.8566, lng: 2.3522 },
    de_ber: { lat: 52.5200, lng: 13.4050 },
    it_rom: { lat: 41.9028, lng: 12.4964 },
    jp_tokyo: { lat: 35.6895, lng: 139.6917 },
    ca_tor: { lat: 43.6532, lng: -79.3832 },
    au_syd: { lat: -33.8688, lng: 151.2093 },
  };

  function getCityCenter(cityId) {
    const c = CITY_CENTERS[cityId] || CITY_CENTERS.br_sp;
    return { lat: c.lat, lng: c.lng };
  }

  function jitterPoint(center, radiusKm = 3.5) {
    // Rough conversion: 1 deg lat ~111km, 1 deg lng ~111km * cos(lat)
    const r = Math.random() * radiusKm;
    const ang = Math.random() * Math.PI * 2;
    const dLat = (r * Math.cos(ang)) / 111;
    const dLng = (r * Math.sin(ang)) / (111 * Math.cos((center.lat * Math.PI) / 180));
    return { lat: center.lat + dLat, lng: center.lng + dLng };
  }

  const ADDRESS_BOOK = {
    br_sp: {
      districts: ["Bela Vista", "Consolação", "Moema", "Pinheiros", "Santana", "Tatuapé"],
      streets: ["Av. Paulista", "Rua da Consolação", "Av. Rebouças", "Av. Ibirapuera", "Av. Cruzeiro do Sul"],
      refs: ["próximo ao metrô", "perto de um posto de gasolina", "em frente a uma farmácia", "ao lado de um shopping"],
    },
    us_nyc: {
      districts: ["Midtown", "Lower Manhattan", "Harlem", "Brooklyn", "Queens"],
      streets: ["5th Avenue", "Broadway", "Madison Avenue", "Wall Street", "Lexington Avenue"],
      refs: ["near a subway entrance", "by a convenience store", "in front of a bank", "near a park"],
    },
    eu_ldn: {
      districts: ["Westminster", "Camden", "Southwark", "Hackney", "Kensington"],
      streets: ["Oxford Street", "Regent Street", "Whitehall", "Baker Street", "The Strand"],
      refs: ["near a bus stop", "by the underground", "outside a pub", "near a square"],
    },
    jp_tokyo: {
      districts: ["Shinjuku", "Shibuya", "Chiyoda", "Minato", "Taito"],
      streets: ["Meiji-dori", "Aoyama-dori", "Sotobori-dori", "Yasukuni-dori"],
      refs: ["near a station", "by a convenience store", "next to a crosswalk", "near a mall"],
    },
  };

  function genAddress(cityId) {
    const book = ADDRESS_BOOK[cityId] || ADDRESS_BOOK.br_sp;
    const street = safeRandom(book.streets) || "Avenida Central";
    const num = Math.floor(10 + Math.random() * 1990);
    const district = safeRandom(book.districts) || "Centro";
    const ref = safeRandom(book.refs) || "próximo a um ponto de referência";
    return { district, address: `${street}, ${num} — ${district} (${ref})` };
  }

  const MAP = {
    map: null,
    tiles: null,
    incidentMarker: null,
    unitMarkers: new Map(),
    lastCityId: null,
  };

  function ensureMap() {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;
    if (!window.L) {
      if (!mapEl.dataset.fallbackShown) {
        mapEl.dataset.fallbackShown = "1";
        mapEl.innerHTML = `
          <div class="mapFallback">
            <div class="mfTitle">Mapa indisponível</div>
            <div class="mfText">O mapa usa um componente online (Leaflet/OpenStreetMap). Se a rede ou CDN estiver indisponível, o jogo continua funcionando normalmente.</div>
          </div>
        `;
      }
      return;
    }

    if (mapEl.dataset.fallbackShown) {
      delete mapEl.dataset.fallbackShown;
      mapEl.innerHTML = "";
    }

    const center = getCityCenter(state.cityId);

    try {
      if (window.L && L.Icon && L.Icon.Default) {
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "./img/marker-icon-2x.png",
          iconUrl: "./img/marker-icon.png",
          shadowUrl: "./img/marker-shadow.png",
        });
      }
    } catch (e) { /* ignore */ }

    if (!MAP.map) {
      MAP.map = L.map(mapEl, {
        zoomControl: true,
        attributionControl: true,
      }).setView([center.lat, center.lng], 12);
      MAP.tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(MAP.map);
    }

    if (MAP.lastCityId !== state.cityId) {
      MAP.lastCityId = state.cityId;
      MAP.map.setView([center.lat, center.lng], 12);
      if (MAP.incidentMarker) {
        MAP.map.removeLayer(MAP.incidentMarker);
        MAP.incidentMarker = null;
      }
      for (const m of MAP.unitMarkers.values()) MAP.map.removeLayer(m);
      MAP.unitMarkers.clear();
    }

    refreshMapSize();
  }

  // Leaflet sometimes initializes while the container is still settling (screen switch,
  // fonts loading, scrollbars). This helper aggressively refreshes the map size a few
  // times to avoid the "tiny map in the corner" issue.
  function refreshMapSize() {
    if (!MAP.map || !window.L) return;
    try { MAP.map.invalidateSize(true); } catch (e) {}
    // Double-RAF is a reliable way to wait for layout.
    try {
      requestAnimationFrame(() => {
        try { MAP.map.invalidateSize(true); } catch (e) {}
        requestAnimationFrame(() => {
          try { MAP.map.invalidateSize(true); } catch (e) {}
        });
      });
    } catch (e) {}
  }

function setIncidentOnMap(call) {
    if (!call || !call.location) return;
    ensureMap();
    if (!MAP.map || !window.L) return;
    const { lat, lng } = call.location;
    const label = call.location.address || call.def.title;
    if (!MAP.incidentMarker) {
      MAP.incidentMarker = L.marker([lat, lng]).addTo(MAP.map);
    } else {
      MAP.incidentMarker.setLatLng([lat, lng]);
    }
    MAP.incidentMarker.bindPopup(`<b>Ocorrência</b><br>${escapeHtml(label)}`).openPopup();
    MAP.map.panTo([lat, lng]);
  }

  function upsertUnitMarkers() {
    ensureMap();
    if (!MAP.map || !window.L) return;
    if (!Array.isArray(state.units)) return;

    for (const u of state.units) {
      if (!u.pos) continue;
      const key = u.id;
      let m = MAP.unitMarkers.get(key);
      const emoji = agencyMeta(state.agency).icon;
      const label = `${emoji} ${u.name} (${u.status || "available"})`;
      if (!m) {
        m = L.marker([u.pos.lat, u.pos.lng]).addTo(MAP.map);
        MAP.unitMarkers.set(key, m);
      } else {
        m.setLatLng([u.pos.lat, u.pos.lng]);
      }
      m.bindTooltip(escapeHtml(label), { direction: "top", opacity: 0.85 });
    }
  }

  // ----------------------------
  // Typewriter (mais humano + token + skip)
  // ----------------------------
  const TYPEWRITER = {
    baseMs: 32,        // velocidade base (menor = mais rápido)
    commaMs: 120,      // pausa extra em vírgula/;:
    punctMs: 220,      // pausa extra em .!? 
    newlineMs: 260,    // pausa extra em quebra de linha
    fastFactor: 0.45,  // quando "fast" (ex: depois de skip) fica mais rápido
  };

  function typewriter(el, fullText, opts = {}) {
    if (!el) return;

    const token = Symbol("tw");
    el.__twToken = token;

    const baseMs = clamp(opts.baseMs ?? TYPEWRITER.baseMs, 12, 80);
    const commaMs = clamp(opts.commaMs ?? TYPEWRITER.commaMs, 0, 600);
    const punctMs = clamp(opts.punctMs ?? TYPEWRITER.punctMs, 0, 800);
    const newlineMs = clamp(opts.newlineMs ?? TYPEWRITER.newlineMs, 0, 900);
    const jitterMs = clamp(opts.jitterMs ?? 0, 0, 35);

    // Guarda o texto alvo para permitir "skip"
    el.__twFullText = fullText;

    el.textContent = "";
    let i = 0;

    function delayForChar(ch) {
      // Add a small random jitter to mimic real typing / stress.
      const jitter = jitterMs ? (Math.random() * jitterMs * 2 - jitterMs) : 0;
      const j = Math.max(0, Math.round(jitter));
      if (ch === "\n") return baseMs + newlineMs + j;
      if (ch === "," || ch === ";" || ch === ":") return baseMs + commaMs + j;
      if (ch === "." || ch === "!" || ch === "?") return baseMs + punctMs + j;
      return baseMs + j;
    }

    function tick() {
      if (el.__twToken !== token) return;
      if (i >= fullText.length) return;

      const ch = fullText[i++];
      el.textContent += ch;

      const baseDelay = delayForChar(ch);
      // Jitter makes the text feel more "human" and adds subtle tension when
      // the operator is under stress.
      const j = jitterMs ? Math.floor((Math.random() * jitterMs * 2) - jitterMs) : 0;
      const d = Math.max(0, baseDelay + j);
      setTimeout(tick, d);
    }

    tick();
  }

  // Incremental typewriter: appends only the new part of fullText.
  // Used to avoid re-typing the opener every time the player clicks a question.
  function typewriterAppend(el, fullText, opts = {}) {
    if (!el) return;

    // If current content is not a prefix of fullText, fall back to full render.
    const current = el.textContent || "";
    if (!fullText.startsWith(current)) {
      typewriter(el, fullText, opts);
      return;
    }

    const token = Symbol("tw_append");
    el.__twToken = token;

    const baseMs = clamp(opts.baseMs ?? TYPEWRITER.baseMs, 12, 80);
    const commaMs = clamp(opts.commaMs ?? TYPEWRITER.commaMs, 0, 600);
    const punctMs = clamp(opts.punctMs ?? TYPEWRITER.punctMs, 0, 800);
    const newlineMs = clamp(opts.newlineMs ?? TYPEWRITER.newlineMs, 0, 900);
    const jitterMs = clamp(opts.jitterMs ?? 0, 0, 35);

    el.__twFullText = fullText;

    let i = current.length;

    function delayForChar(ch) {
      const jitter = jitterMs ? (Math.random() * jitterMs * 2 - jitterMs) : 0;
      const j = Math.max(0, Math.round(jitter));
      if (ch === "\n") return baseMs + newlineMs + j;
      if (ch === "," || ch === ";" || ch === ":") return baseMs + commaMs + j;
      if (ch === "." || ch === "!" || ch === "?") return baseMs + punctMs + j;
      return baseMs + j;
    }

    function tick() {
      if (el.__twToken !== token) return;
      if (i >= fullText.length) return;
      const ch = fullText[i++];
      el.textContent += ch;
      const baseDelay = delayForChar(ch);
      const j = jitterMs ? Math.floor((Math.random() * jitterMs * 2) - jitterMs) : 0;
      setTimeout(tick, Math.max(0, baseDelay + j));
    }

    tick();
  }

  function skipTypewriter(el) {
    if (!el) return;
    if (!el.__twToken) return;
    // Mata animação atual e escreve tudo
    el.__twToken = null;
    el.textContent = el.__twFullText || el.textContent;
  }

  // ----------------------------
  // DOM
  // ----------------------------
  const el = {
    hudShift: $("hudShift"),
    hudTime: $("hudTime"),
    hudScore: $("hudScore"),
    hudQueue: $("hudQueue"),
    hudStress: $("hudStress"),

    citySelect: $("citySelect"),
    agencySelect: $("agencySelect"),
    difficultySelect: $("difficultySelect"),

    // Screens / navigation
    screenSetup: $("screenSetup"),
    screenLobby: $("screenLobby"),
    screenShift: $("screenShift"),
    btnNavSetup: $("btnNavSetup"),
    btnNavLobby: $("btnNavLobby"),
    btnNavShift: $("btnNavShift"),
    btnToLobby: $("btnToLobby"),
    btnBackSetup: $("btnBackSetup"),
    btnToShift: $("btnToShift"),
    btnBackLobby: $("btnBackLobby"),
    lobbySummary: $("lobbySummary"),
    shiftSummaryTop: $("shiftSummaryTop"),

    btnStartShift: $("btnStartShift"),
    btnEndShift: $("btnEndShift"),
    btnStartShift2: $("btnStartShift2"),
    btnEndShift2: $("btnEndShift2"),

    unitsList: $("unitsList"),
    log: $("log"),

    pillStatus: $("pillStatus"),
    pillCallTimer: $("pillCallTimer"),

    callMeta: $("callMeta"),
    callText: $("callText"),

    btnAnswer: $("btnAnswer"),
    btnHold: $("btnHold"),

    dispatchInfo: $("dispatchInfo"),
    dispatchUnitSelect: $("dispatchUnitSelect"),
    btnAddUnit: $("btnAddUnit"),
    btnDispatch: $("btnDispatch"),
    btnDismiss: $("btnDismiss"),

    dispatchSelectedList: $("dispatchSelectedList"),

    incidentsList: $("incidentsList"),

    queueList: $("queueList"),
    shiftSummary: $("shiftSummary"),
  };

  // ----------------------------
  // UI Dinâmico
  // ----------------------------
  function ensureDynamicQuestionsUI() {
    let panel = document.getElementById("dynamicQuestionsPanel");
    if (panel) return panel;

    const operationCard = el.callText ? el.callText.closest(".card") : null;
    if (!operationCard) return null;

    panel = document.createElement("div");
    panel.id = "dynamicQuestionsPanel";
    panel.className = "subCard";
    panel.innerHTML = `
      <div class="subTitle">Perguntas (Protocolo Realista)</div>
      <div class="meta" id="dqMeta">Nenhuma chamada ativa</div>
      <div id="dqButtons" class="btnRow" style="margin-top:8px;"></div>
      <div class="hint" id="dqHint" style="margin-top:10px;">
        Faça as perguntas obrigatórias para liberar o despacho.
      </div>
    `;

    const subCards = operationCard.querySelectorAll(".subCard");
    if (subCards && subCards.length) {
      subCards[0].insertAdjacentElement("afterend", panel);
    } else {
      operationCard.appendChild(panel);
    }
    return panel;
  }

  function ensureReportUI() {
    let panel = document.getElementById("reportPanel");
    if (panel) return panel;

    const operationCard = el.callText ? el.callText.closest(".card") : null;
    if (!operationCard) return null;

    panel = document.createElement("div");
    panel.id = "reportPanel";
    panel.className = "subCard";
    panel.style.marginTop = "12px";
    panel.innerHTML = `
      <div class="subTitle">Relatório da Ocorrência</div>
      <div class="meta" id="rpMeta">Nenhum relatório ainda</div>
      <div id="rpBody" style="margin-top:8px; font-size:13px; color:rgba(233,240,255,0.85); line-height:1.4;">
        Atenda uma chamada e finalize para gerar relatório.
      </div>
      <div id="rpCareer" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;"></div>
    `;

    const dqPanel = document.getElementById("dynamicQuestionsPanel");
    if (dqPanel) dqPanel.insertAdjacentElement("afterend", panel);
    else operationCard.appendChild(panel);

    return panel;
  }

  const dq = { panel: null, meta: null, buttons: null, hint: null };
  const rp = { panel: null, meta: null, body: null, career: null };

  // Stage 4/5: Lobby UI
  const lobby = {
    careerPills: null,
    unlocksHint: null,
    objectives: null,
    btnReset: null,
    // Stage 5
    campaignPills: null,
    campaignHint: null,
    economyPills: null,
    economyHint: null,
    btnResetWeek: null,
    // Stage 6
    upgradesGrid: null,
    upgradesHint: null,
  };

  function bindDynamicUI() {
    dq.panel = ensureDynamicQuestionsUI();
    if (dq.panel) {
      dq.meta = document.getElementById("dqMeta");
      dq.buttons = document.getElementById("dqButtons");
      dq.hint = document.getElementById("dqHint");
    }

    rp.panel = ensureReportUI();
    if (rp.panel) {
      rp.meta = document.getElementById("rpMeta");
      rp.body = document.getElementById("rpBody");
      rp.career = document.getElementById("rpCareer");
    }

    // Lobby panels (static in index.html)
    lobby.careerPills = document.getElementById("lobbyCareerPills");
    lobby.unlocksHint = document.getElementById("lobbyUnlocksHint");
    lobby.objectives = document.getElementById("lobbyObjectives");
    lobby.btnReset = document.getElementById("btnResetCareer");

    // Stage 5
    lobby.campaignPills = document.getElementById("lobbyCampaignPills");
    lobby.campaignHint = document.getElementById("lobbyCampaignHint");
    lobby.economyPills = document.getElementById("lobbyEconomyPills");
    lobby.economyHint = document.getElementById("lobbyEconomyHint");
    lobby.btnResetWeek = document.getElementById("btnResetWeek");

    // Stage 6
    lobby.upgradesGrid = document.getElementById("lobbyUpgrades");
    lobby.upgradesHint = document.getElementById("lobbyUpgradesHint");
  }

  // ----------------------------
  // Stage 4: Persistência / Progressão (LocalStorage)
  // ----------------------------
  const STORAGE_KEY = "lcdo_profile_v1";

  const UNLOCKS_BY_RANK = {
    // Base game focado em Brasil + EUA. Outras regiões ficam para DLCs futuras.
    Recruta: ["br_sp"],
    Operador: ["br_df"],
    "Sênior": ["us_nyc"],
    Supervisor: ["br_rj", "us_la"],
  };

  // Stage 5: unit roles unlocked by progression. These roles must match the
  // roles used by getUnitsFor(...)
  const UNIT_ROLE_UNLOCKS_BY_RANK = {
    Recruta: ["area_patrol", "fire_engine", "fire_rescue", "medic_ambulance"],
    Operador: ["civil_investigation", "ladder_truck"],
    "Sênior": ["tactical_rota", "shock_riot"],
    Supervisor: ["air_eagle", "bomb_gate", "hazmat"],
  };

  // ----------------------------
  // Stage 6: Upgrades (Tecnologia / Treinamento)
  // ----------------------------
  // Purchased with budget. Effects are small but stack into a meaningful
  // long-term progression layer.
  const UPGRADES = [
    {
      id: "breathing_training",
      agency: "any",
      tier: 1,
      name: "🫁 Respiração tática",
      desc: "Reduz a taxa de stress durante chamadas ativas (-15%).",
      cost: 60,
      req: { rank: "Recruta" },
      effects: { stressRateMult: 0.85 },
    },
    {
      id: "quickcards",
      agency: "any",
      tier: 1,
      name: "🗂️ Cartões de protocolo",
      desc: "Reduz penalidade de perguntas erradas (-25%).",
      cost: 80,
      req: { rank: "Recruta" },
      effects: { wrongQuestionPenaltyMult: 0.75 },
    },
    {
      id: "radio_digital",
      agency: "any",
      tier: 2,
      name: "📡 Rádio digital",
      desc: "Resposta mais rápida (ETA -12%).",
      cost: 120,
      req: { rank: "Operador" },
      effects: { etaMult: 0.88 },
    },
    {
      id: "triage_assistant",
      agency: "any",
      tier: 2,
      name: "🤖 Assistente de triagem",
      desc: "Ganha mais tempo antes de AGRAVAR (+15%).",
      cost: 140,
      req: { rank: "Operador" },
      effects: { worsenTimeMult: 1.15 },
    },
    {
      id: "pol_tactical_coord",
      agency: "police",
      tier: 3,
      name: "🛡️ Coordenação tática",
      desc: "Bônus de score em ocorrências graves (+10%).",
      cost: 200,
      req: { rank: "Sênior", reputationAtLeast: 55 },
      effects: { graveScoreMult: 1.10 },
    },
    {
      id: "fire_incident_cmd",
      agency: "fire",
      tier: 3,
      name: "🔥 Comando de incidente",
      desc: "Reduz chance de falha por atraso em incêndios (margem +6s).",
      cost: 200,
      req: { rank: "Sênior", reputationAtLeast: 55 },
      effects: { lateMarginSec: 6 },
    },
  ];

  function rankAtLeast(current, required) {
    const order = ["Recruta", "Operador", "Sênior", "Supervisor"];
    return order.indexOf(String(current)) >= order.indexOf(String(required));
  }

  function getOwnedUpgradesSet() {
    return new Set(Array.isArray(state.upgrades?.owned) ? state.upgrades.owned : []);
  }

  function computeUpgradeEffects() {
    const owned = getOwnedUpgradesSet();
    const effects = {
      stressRateMult: 1.0,
      wrongQuestionPenaltyMult: 1.0,
      etaMult: 1.0,
      worsenTimeMult: 1.0,
      graveScoreMult: 1.0,
      lateMarginSec: 0,
    };
    for (const up of UPGRADES) {
      if (!owned.has(up.id)) continue;
      const e = up.effects || {};
      if (typeof e.stressRateMult === "number") effects.stressRateMult *= e.stressRateMult;
      if (typeof e.wrongQuestionPenaltyMult === "number") effects.wrongQuestionPenaltyMult *= e.wrongQuestionPenaltyMult;
      if (typeof e.etaMult === "number") effects.etaMult *= e.etaMult;
      if (typeof e.worsenTimeMult === "number") effects.worsenTimeMult *= e.worsenTimeMult;
      if (typeof e.graveScoreMult === "number") effects.graveScoreMult *= e.graveScoreMult;
      if (typeof e.lateMarginSec === "number") effects.lateMarginSec += e.lateMarginSec;
    }
    state.effects = effects;
    return effects;
  }

  function allUnitRoleUnlocksUpToRank(rank) {
    const order = ["Recruta", "Operador", "Sênior", "Supervisor"];
    const idx = Math.max(0, order.indexOf(rank));
    const unlocked = new Set();
    for (let i = 0; i <= idx; i += 1) {
      const r = order[i];
      (UNIT_ROLE_UNLOCKS_BY_RANK[r] || []).forEach((role) => unlocked.add(role));
    }
    return Array.from(unlocked);
  }

  function allUnlocksUpToRank(rank) {
    const order = ["Recruta", "Operador", "Sênior", "Supervisor"];
    const idx = Math.max(0, order.indexOf(rank));
    const unlocked = new Set();
    for (let i = 0; i <= idx; i += 1) {
      const r = order[i];
      (UNLOCKS_BY_RANK[r] || []).forEach((id) => unlocked.add(id));
    }
    return Array.from(unlocked);
  }

  function defaultProfile() {
    return {
      career: {
        xp: 0,
        rank: "Recruta",
        warnings: 0,
        totalSuccess: 0,
        totalFail: 0,
        totalLivesSaved: 0,
      },
      progress: {
        unlockedCities: allUnlocksUpToRank("Recruta"),
        // Stage 5: unit roles unlocked by career/economy
        unlockedUnitRoles: allUnitRoleUnlocksUpToRank("Recruta"),
      },
      // Stage 5: campaign (weekly progression)
      campaign: {
        week: 1,
        day: 1, // 1..7
        shiftsCompletedThisWeek: 0,
        streak: 0,
      },
      // Stage 5: economy layer
      economy: {
        budget: 0,
        reputation: 50, // 0..100
      },
      // Stage 6: upgrades purchased with budget
      upgrades: {
        owned: [],
        spent: 0,
      },
      settings: {
        agency: "police",
        difficulty: "normal",
        cityId: "br_sp",
      },
    };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProfile();
      const p = JSON.parse(raw);
      // Shallow validation / forward compatibility
      if (!p || typeof p !== "object") return defaultProfile();
      if (!p.career) p.career = defaultProfile().career;
      if (!p.progress) p.progress = defaultProfile().progress;
      if (!Array.isArray(p.progress.unlockedCities)) p.progress.unlockedCities = defaultProfile().progress.unlockedCities;
      if (!Array.isArray(p.progress.unlockedUnitRoles)) p.progress.unlockedUnitRoles = defaultProfile().progress.unlockedUnitRoles;
      if (!p.campaign) p.campaign = defaultProfile().campaign;
      if (!p.economy) p.economy = defaultProfile().economy;
      if (!p.upgrades) p.upgrades = defaultProfile().upgrades;
      if (!Array.isArray(p.upgrades.owned)) p.upgrades.owned = [];
      if (typeof p.upgrades.spent !== "number") p.upgrades.spent = 0;
      if (!p.settings) p.settings = defaultProfile().settings;
      return p;
    } catch {
      return defaultProfile();
    }
  }

  function saveProfile() {
    try {
      const profile = {
        career: state.career,
        progress: state.progress,
        campaign: state.campaign,
        economy: state.economy,
        upgrades: state.upgrades,
        settings: {
          agency: state.agency,
          difficulty: state.difficulty,
          cityId: state.cityId,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  // ----------------------------
  // Stage 4: Objetivos do turno (metas) + bônus de XP
  // ----------------------------
  function generateShiftObjectives() {
    // Keep objectives stable until next time user visits the lobby
    const diff = state.difficulty || "normal";
    const rank = state.career.rank || "Recruta";

    const baseHandled = diff === "easy" ? 5 : diff === "hard" ? 8 : 6;
    const baseCorrect = diff === "easy" ? 4 : diff === "hard" ? 7 : 5;
    const baseRate = diff === "easy" ? 0.60 : diff === "hard" ? 0.80 : 0.70;
    const bonusScale = rank === "Supervisor" ? 1.3 : rank === "Sênior" ? 1.15 : rank === "Operador" ? 1.05 : 1.0;

    const pool = [
      {
        id: "handled",
        label: `Atender ${baseHandled} chamadas no turno`,
        check: () => (state.stats.handled || 0) >= baseHandled,
        bonusXp: Math.round(10 * bonusScale),
      },
      {
        id: "correct",
        label: `Realizar ${baseCorrect} despachos corretos`,
        check: () => (state.stats.correct || 0) >= baseCorrect,
        bonusXp: Math.round(12 * bonusScale),
      },
      {
        id: "rate",
        label: `Manter taxa de acerto ≥ ${Math.round(baseRate * 100)}%`,
        check: () => {
          const d = Math.max(1, state.stats.dispatched || 0);
          return (state.stats.correct || 0) / d >= baseRate;
        },
        bonusXp: Math.round(14 * bonusScale),
      },
      {
        id: "no_warnings",
        label: "Finalizar sem advertências", 
        check: () => (state.career.warnings || 0) === 0,
        bonusXp: Math.round(16 * bonusScale),
      },
      {
        id: "score",
        label: `Fechar turno com ≥ ${diff === "easy" ? 35 : diff === "hard" ? 60 : 45} pontos`,
        check: () => (state.score || 0) >= (diff === "easy" ? 35 : diff === "hard" ? 60 : 45),
        bonusXp: Math.round(12 * bonusScale),
      },
    ];

    // pick 3 objectives with variety
    const picked = [];
    const used = new Set();
    while (picked.length < 3 && used.size < pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      if (used.has(i)) continue;
      used.add(i);
      picked.push({ ...pool[i] });
    }

    state.objectives.list = picked;
    state.objectives.completed = [];
    state.objectives.bonusAwarded = false;
  }

  function renderLobbyCareer() {
    if (!lobby.careerPills) return;
    lobby.careerPills.innerHTML = `
      <div class="pill">Rank: ${escapeHtml(state.career.rank)}</div>
      <div class="pill">XP: ${state.career.xp}</div>
      <div class="pill">Sucessos: ${state.career.totalSuccess}</div>
      <div class="pill">Falhas: ${state.career.totalFail}</div>
      <div class="pill">Vidas salvas: ${state.career.totalLivesSaved}</div>
    `;

    if (lobby.unlocksHint) {
      const unlocked = Array.isArray(state.progress.unlockedCities) ? state.progress.unlockedCities.length : 0;
      const nextRank = state.career.rank === "Recruta" ? "Operador" : state.career.rank === "Operador" ? "Sênior" : state.career.rank === "Sênior" ? "Supervisor" : null;
      const nextCities = nextRank ? (UNLOCKS_BY_RANK[nextRank] || []) : [];
      const hint = nextRank
        ? `Cidades desbloqueadas: <b>${unlocked}</b>. Próximo desbloqueio em <b>${nextRank}</b>: ${nextCities.map(cityNameById).join(", ") || "—"}`
        : `Cidades desbloqueadas: <b>${unlocked}</b>. Você já está no rank máximo.`;
      lobby.unlocksHint.innerHTML = hint;
    }
  }

  // ----------------------------
  // Stage 5: Campaign (Semana) + Economy (Reputação/Orçamento)
  // ----------------------------
  function renderLobbyCampaign() {
    if (!lobby.campaignPills) return;
    const w = state.campaign?.week || 1;
    const d = state.campaign?.day || 1;
    const done = state.campaign?.shiftsCompletedThisWeek || 0;
    const streak = state.campaign?.streak || 0;
    lobby.campaignPills.innerHTML = `
      <div class="pill">Semana: ${w}</div>
      <div class="pill">Dia: ${d}/7</div>
      <div class="pill">Turnos na semana: ${done}</div>
      <div class="pill">Sequência: ${streak}</div>
    `;
    if (lobby.campaignHint) {
      lobby.campaignHint.innerHTML = `A campanha avança a cada turno encerrado. Fechar a semana dá bônus baseado na reputação.`;
    }
  }

  function renderLobbyEconomy() {
    if (!lobby.economyPills) return;
    const budget = Math.round(state.economy?.budget || 0);
    const rep = clamp(Math.round(state.economy?.reputation ?? 50), 0, 100);
    lobby.economyPills.innerHTML = `
      <div class="pill">Reputação: ${rep}/100</div>
      <div class="pill">Orçamento: ${budget >= 0 ? "+" : ""}${budget}</div>
    `;
    if (lobby.economyHint) {
      lobby.economyHint.innerHTML = `Reputação influencia desbloqueios e eventos. Erros graves e advertências derrubam a reputação.`;
    }
  }

  // ----------------------------
  // Stage 6: Upgrades UI + purchase
  // ----------------------------
  function isUpgradeAvailable(up) {
    if (!up) return false;
    if (up.agency && up.agency !== "any" && up.agency !== state.agency) return false;
    const req = up.req || {};
    if (req.rank && !rankAtLeast(state.career.rank, req.rank)) return false;
    if (typeof req.reputationAtLeast === "number" && (state.economy.reputation || 0) < req.reputationAtLeast) return false;
    return true;
  }

  function renderLobbyUpgrades() {
    if (!lobby.upgradesGrid) return;
    const owned = getOwnedUpgradesSet();
    const budget = Math.round(state.economy?.budget || 0);

    const list = UPGRADES.filter((u) => u.agency === "any" || u.agency === state.agency);
    if (!list.length) {
      lobby.upgradesGrid.innerHTML = "—";
      return;
    }

    lobby.upgradesGrid.innerHTML = list
      .map((u) => {
        const ok = isUpgradeAvailable(u);
        const isOwned = owned.has(u.id);
        const canBuy = ok && !isOwned && budget >= (u.cost || 0);
        const lockReason = !ok
          ? `Requer: ${u.req?.rank ? `rank ${u.req.rank}` : ""}${u.req?.reputationAtLeast ? `${u.req?.rank ? " e " : ""}rep ≥ ${u.req.reputationAtLeast}` : ""}`.trim()
          : "";
        const badge = isOwned ? "✅ Comprado" : ok ? `💰 Custo: ${u.cost}` : `🔒 ${escapeHtml(lockReason || "Bloqueado")}`;
        return `
          <div class="upgradeCard" data-upgrade="${escapeHtml(u.id)}">
            <div class="upgradeTop">
              <div>
                <div class="upgradeName">${escapeHtml(u.name)}</div>
                <div class="upgradeDesc">${escapeHtml(u.desc)}</div>
              </div>
            </div>
            <div class="upgradeMeta">
              <div class="pill">Tier ${u.tier || 1}</div>
              <div class="pill">${badge}</div>
            </div>
            <div class="upgradeActions">
              <button class="btnPrimary btnBuy" data-buy="${escapeHtml(u.id)}" ${canBuy ? "" : "disabled"}>${isOwned ? "Comprado" : ok ? "Comprar" : "Bloqueado"}</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Bind buy buttons (event delegation)
    lobby.upgradesGrid.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-buy");
        purchaseUpgrade(id);
      });
    });

    if (lobby.upgradesHint) {
      lobby.upgradesHint.innerHTML = `Orçamento atual: <b>${budget >= 0 ? "+" : ""}${budget}</b>. Upgrades aplicam bônus permanentes na campanha.`;
    }
  }

  function purchaseUpgrade(id) {
    const up = UPGRADES.find((x) => x.id === id);
    if (!up) return;
    if (!isUpgradeAvailable(up)) return;
    const owned = getOwnedUpgradesSet();
    if (owned.has(up.id)) return;
    const cost = Math.max(0, Math.round(up.cost || 0));
    if ((state.economy.budget || 0) < cost) {
      log("💰 Orçamento insuficiente para este upgrade.");
      return;
    }

    state.economy.budget -= cost;
    state.upgrades.owned.push(up.id);
    state.upgrades.spent = (state.upgrades.spent || 0) + cost;
    computeUpgradeEffects();
    saveProfile();
    renderLobbyEconomy();
    renderLobbyUpgrades();
    log(`🧩 Upgrade comprado: ${up.name} (-${cost} orçamento).`);
  }

  function resetWeekOnly() {
    state.campaign = { ...defaultProfile().campaign };
    // Reset operational economy, keep career
    state.economy = { ...defaultProfile().economy };
    // Refresh UI
    renderLobbyCampaign();
    renderLobbyEconomy();
    renderLobbyUpgrades();
    saveProfile();
    log("🧹 Semana e operação resetadas (carreira preservada).");
  }

  function applyEndOfShiftEconomyAndCampaign() {
    const dispatched = state.stats.dispatched || 0;
    const correct = state.stats.correct || 0;
    const wrong = state.stats.wrong || 0;
    const expired = state.stats.expired || 0;
    const livesSaved = state.stats.livesSaved || 0;
    const warnings = state.career.warnings || 0;

    const accuracy = dispatched ? correct / dispatched : 0;

    // Reputation: professional evaluation (0..100)
    let repDelta = Math.round((accuracy - 0.65) * 40);
    repDelta += livesSaved * 2;
    repDelta -= expired * 4;
    repDelta -= warnings * 5;
    repDelta -= Math.min(20, wrong * 2);

    // Budget: simplified operational economy (no microtransactions)
    let budgetDelta = Math.round((state.score / 4) - dispatched * 2);
    budgetDelta -= expired * 6;
    budgetDelta -= warnings * 10;

    state.economy.reputation = clamp((state.economy.reputation ?? 50) + repDelta, 0, 100);
    state.economy.budget = Math.round((state.economy.budget || 0) + budgetDelta);

    // Campaign: advance day/week
    state.campaign.shiftsCompletedThisWeek = (state.campaign.shiftsCompletedThisWeek || 0) + 1;
    if (repDelta >= 0 && accuracy >= 0.6) state.campaign.streak = (state.campaign.streak || 0) + 1;
    else state.campaign.streak = 0;

    const prevDay = state.campaign.day || 1;
    state.campaign.day = prevDay + 1;
    let weeklyBonus = 0;
    if (state.campaign.day > 7) {
      state.campaign.day = 1;
      state.campaign.week = (state.campaign.week || 1) + 1;
      state.campaign.shiftsCompletedThisWeek = 0;
      // Weekly bonus scales with reputation (keeps the player motivated)
      weeklyBonus = Math.round((state.economy.reputation || 0) / 5);
      state.economy.budget += weeklyBonus;
    }

    log(`💰 Operação: orçamento ${budgetDelta >= 0 ? "+" : ""}${budgetDelta} • reputação ${repDelta >= 0 ? "+" : ""}${repDelta} (acerto ${(accuracy * 100).toFixed(0)}%)`);
    if (weeklyBonus) {
      log(`🏁 Semana fechada. Bônus semanal +${weeklyBonus} (reputação ${state.economy.reputation}/100). Semana ${state.campaign.week}`);
    }

    // Re-evaluate unit role locks after economy changes
    updateUnlockedUnitRoles("operação");
    renderLobbyCampaign();
    renderLobbyEconomy();
    saveProfile();
  }

  function renderLobbyObjectives() {
    if (!lobby.objectives) return;
    const list = Array.isArray(state.objectives.list) ? state.objectives.list : [];
    if (!list.length) {
      lobby.objectives.textContent = "—";
      return;
    }
    const html = list
      .map((o) => {
        const done = state.objectives.completed.includes(o.id);
        const mark = done ? "✅" : "⬜";
        return `${mark} ${escapeHtml(o.label)} <span style="opacity:.8;">(+${o.bonusXp} XP)</span>`;
      })
      .join("<br>");
    lobby.objectives.innerHTML = html;
  }

  function evaluateObjectivesAndAward() {
    if (state.objectives.bonusAwarded) return;
    const list = Array.isArray(state.objectives.list) ? state.objectives.list : [];
    if (!list.length) return;

    const completed = [];
    let bonus = 0;
    list.forEach((o) => {
      try {
        if (o.check && o.check()) {
          completed.push(o.id);
          bonus += o.bonusXp || 0;
        }
      } catch {
        // ignore
      }
    });

    state.objectives.completed = completed;
    state.objectives.bonusAwarded = true;

    if (completed.length) {
      addXp(bonus);
      log(`🎯 Objetivos concluídos: ${completed.length}/${list.length} • Bônus XP +${bonus}`);
    } else {
      log("🎯 Objetivos não concluídos neste turno.");
    }
  }

  // ----------------------------
  // Dados fallback
  // ----------------------------
  const FALLBACK_CITIES = [
    { id: "sp_sim", name: "São Paulo (Simulação)", country: "BR" },
    { id: "ny_sim", name: "New York (Simulação)", country: "US" },
    { id: "ldn_sim", name: "London (Simulação)", country: "EU" },
  ];

  function getCities() {
    const C = window.CITIES;
    if (Array.isArray(C) && C.length) return C;
    return FALLBACK_CITIES;
  }

  function getCalls() {
    const C = window.CALLS;
    if (Array.isArray(C) && C.length) return C;
    return [];
  }


function selfCheck() {
  const calls = getCalls();
  const cities = getCities();
  if (!cities.length) {
    log("❌ ERRO: Nenhuma cidade carregada. Verifique data/cities.js.");
  } else {
    log(`🌍 Cidades carregadas: ${cities.length}`);
  }
  if (!calls.length) {
    log("❌ ERRO: Nenhuma chamada carregada. Verifique data/calls.js (CALLS vazio ou não carregou).");
    log("💡 Dica: no GitHub Pages, faça hard refresh (Ctrl+F5) ou limpe cache.");
  } else {
    log(`📞 Chamadas carregadas: ${calls.length}`);
  }
}

  // ----------------------------
  // Stage 5: DLC loader (static JSON packs, no API)
  // Folder structure:
  //   /dlc/manifest.json -> { "packs": [ { "id": "...", "path": "./dlc/packs/...json" } ] }
  // Each pack JSON can include: { "cities": [...], "calls": [...] }
  // ----------------------------
  async function tryLoadContentPacks() {
    const packPaths = [
      "./data/calls/phase2_calls.json",
      "./data/calls/phase3_calls.json",
    ];
    let loaded = 0;
    for (const path of packPaths) {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data || !Array.isArray(data.calls) || !data.calls.length) continue;
        const existingIds = new Set((Array.isArray(window.CALLS) ? window.CALLS : []).map((c) => c && c.id).filter(Boolean));
        const freshCalls = data.calls.filter((c) => c && c.id && !existingIds.has(c.id));
        if (!freshCalls.length) continue;
        window.CALLS = Array.isArray(window.CALLS) ? [...window.CALLS, ...freshCalls] : [...freshCalls];
        loaded += freshCalls.length;
      } catch {
        // optional content pack
      }
    }
    if (loaded) log(`🧠 Conteúdo extra carregado: ${loaded} chamada(s) adicionais.`);
  }

  async function tryLoadDlcPacks() {
    try {
      const res = await fetch("./dlc/manifest.json", { cache: "no-store" });
      if (!res.ok) return;
      const manifest = await res.json();
      if (!manifest || !Array.isArray(manifest.packs) || !manifest.packs.length) return;

      let loaded = 0;
      for (const pack of manifest.packs) {
        try {
          if (!pack || !pack.path) continue;
          const r = await fetch(pack.path, { cache: "no-store" });
          if (!r.ok) continue;
          const data = await r.json();
          if (!data || typeof data !== "object") continue;
          if (Array.isArray(data.cities) && data.cities.length) {
            window.CITIES = Array.isArray(window.CITIES) ? [...window.CITIES, ...data.cities] : [...data.cities];
          }
          if (Array.isArray(data.calls) && data.calls.length) {
            window.CALLS = Array.isArray(window.CALLS) ? [...window.CALLS, ...data.calls] : [...data.calls];
          }
          loaded += 1;
        } catch {
          // ignore pack
        }
      }

      if (loaded) {
        log(`🧩 DLC: ${loaded} pacote(s) carregado(s).`);
        // Refresh UI that depends on datasets
        populateCities();
    selfCheck();
        renderUnits();
        renderAll();
      }
    } catch {
      // No DLC available (normal)
    }
  }

  // ----------------------------
  // Estado
  // ----------------------------
  const state = {
    shiftActive: false,
    pauseQueueWhileActiveCall: false, // Stage 7C: manager mode (fila continua mesmo com chamada ativa)
    difficulty: "normal",
    agency: "police",
    cityId: null,

    score: 0,
    timeSec: 0,

    // Stage 3: operador sob pressão (0..100)
    stress: 0,

    // Stage 3: condições do turno (atmosfera e pressão). Definido no início do turno.
    conditions: {
      timeOfDay: "day", // day | night
      weather: "clear", // clear | rain | storm
    },

    queue: [],
    activeCall: null,
    incidents: [],
    focusIncidentUid: null,
    pendingDispatchUnitIds: [],
    units: [],

    lastReport: null,

    // cache do texto para não reiniciar typewriter no tick
    ui: {
      lastCallUid: null,
      lastTranscript: "",
      view: "setup", // setup | lobby | shift
    },

    career: {
      xp: 0,
      rank: "Recruta",
      warnings: 0,
      totalSuccess: 0,
      totalFail: 0,
      totalLivesSaved: 0,
    },

    // Stage 4: desbloqueios (carreira)
    progress: {
      unlockedCities: ["br_sp"],
      unlockedUnitRoles: ["area_patrol", "fire_engine", "fire_rescue", "medic_ambulance"],
    },

    // Stage 5: campaign progression (weekly)
    campaign: {
      week: 1,
      day: 1,
      shiftsCompletedThisWeek: 0,
      streak: 0,
    },

    // Stage 5: economy layer
    economy: {
      budget: 0,
      reputation: 50,
    },

    // Stage 6: upgrades purchased with budget
    upgrades: {
      owned: [],
      spent: 0,
    },

    // Stage 6: cached modifiers derived from upgrades
    effects: {
      stressRateMult: 1.0,
      wrongQuestionPenaltyMult: 1.0,
      etaMult: 1.0,
      worsenTimeMult: 1.0,
      graveScoreMult: 1.0,
      lateMarginSec: 0,
    },

    // Stage 5: special event of the current shift (cinematic cases)
    specialEvent: null,

    // Stage 4: objetivos do turno (gerados no lobby)
    objectives: {
      list: [],
      completed: [],
      bonusAwarded: false,
    },

    stats: {
      handled: 0,
      dispatched: 0,
      correct: 0,
      wrong: 0,
      expired: 0,
      dismissedTrote: 0,
      overtime: 0,
      livesSaved: 0,
    },

    tickInterval: null,
    spawnAccumulator: 0,
    maxQueue: 5,
  };

  let uidCounter = 0;

  function log(msg) {
    if (!el.log) return;
    el.log.textContent = `${nowStamp()} ${msg}\n` + el.log.textContent;
  }

  function setScreen(view) {
    state.ui.view = view;
    const screens = [el.screenSetup, el.screenLobby, el.screenShift].filter(Boolean);
    // Hard switch: remove active and also force display none/block so screens never stack
    // even if external CSS loads stale/overrides on GitHub Pages.
    screens.forEach((s) => {
      s.classList.remove("active");
      s.style.display = "none";
    });
    if (view === "setup" && el.screenSetup) el.screenSetup.classList.add("active");
    if (view === "lobby" && el.screenLobby) el.screenLobby.classList.add("active");
    if (view === "shift" && el.screenShift) el.screenShift.classList.add("active");

    if (view === "setup" && el.screenSetup) el.screenSetup.style.display = "block";
    if (view === "lobby" && el.screenLobby) el.screenLobby.style.display = "block";
    if (view === "shift" && el.screenShift) el.screenShift.style.display = "block";

    // Reset scroll on the active screen container (important: each screen is its own
    // scroll container; window.scrollTo() does not affect it). This prevents the UI
    // from "starting" in the middle of the plantão where the player thinks buttons
    // disappeared.
    const active =
      view === "setup" ? el.screenSetup : view === "lobby" ? el.screenLobby : view === "shift" ? el.screenShift : null;
    if (active) active.scrollTop = 0;

    if (view === "shift") {
      // Map needs a visible container to initialize correctly
      setTimeout(() => {
        ensureMap();
        upsertUnitMarkers();
        refreshMapSize();
      }, 0);
      // Extra refreshes for browsers that compute layout a bit later (Edge/slow devices)
      setTimeout(refreshMapSize, 120);
      setTimeout(refreshMapSize, 400);
    }
    // Keep it feeling like a proper app screen
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function refreshLobbySummary() {
    if (!el.lobbySummary) return;
    const city = cityNameById(state.cityId);
    const agency = agencyMeta(state.agency).label;
    const diff = state.difficulty === "easy" ? "Fácil" : state.difficulty === "hard" ? "Difícil" : "Normal";
    el.lobbySummary.innerHTML = `<b>${agency}</b> • ${city} • Dificuldade: ${diff}`;
    if (el.shiftSummaryTop) el.shiftSummaryTop.innerHTML = el.lobbySummary.innerHTML;
  }

  // ----------------------------
  // Stage 3: Stress / Pressão do operador
  // ----------------------------
  function setStress(value) {
    const v = clamp(Math.round(value), 0, 100);
    state.stress = v;

    // Band used by CSS for subtle cinematic tension cues
    const band = v >= 70 ? "high" : v >= 35 ? "mid" : "low";
    if (document && document.body) {
      document.body.dataset.stress = band;
    }

    if (el.hudStress) {
      el.hudStress.textContent = `${v}%`;
      el.hudStress.style.setProperty("--meter", `${v}%`);
    }
  }

  function addStress(delta) {
    if (!delta) return;
    setStress(state.stress + delta);
  }

  function severityToPressure(sev) {
    const s = String(sev || "leve").toLowerCase();
    if (s === "critico") return 1.25;
    if (s === "grave") return 1.0;
    if (s === "medio") return 0.75;
    if (s === "trote") return 0.25;
    return 0.5;
  }

  function typingProfileForCall(def, sev) {
    // Heuristic: use callerState if provided by content; otherwise derive from severity
    const raw = String(def && def.callerState ? def.callerState : "").toLowerCase();
    const s = String(sev || def.baseSeverity || "leve").toLowerCase();
    const callerState = raw || (s === "critico" ? "panic" : s === "grave" ? "panic" : s === "medio" ? "tense" : s === "trote" ? "annoyed" : "normal");

    // Base typing speed by caller state (lower = faster)
    let base = 32;
    if (callerState === "panic") base = 30;
    if (callerState === "crying") base = 36;
    if (callerState === "whispering") base = 40;
    if (callerState === "annoyed") base = 26;
    if (callerState === "calm") base = 34;

    return { callerState, baseMs: base };
  }

  // ----------------------------
  // Severidade / Score / Rank
  // ----------------------------
  function humanSeverity(sev) {
    const s = String(sev || "leve").toLowerCase();
    if (s === "critico") return "CRÍTICO";
    if (s === "grave") return "GRAVE";
    if (s === "medio") return "MÉDIO";
    if (s === "trote") return "TROTE";
    return "LEVE";
  }

  function severityScore(sev) {
    const s = String(sev || "leve").toLowerCase();
    if (s === "critico") return 28;
    if (s === "grave") return 20;
    if (s === "medio") return 14;
    if (s === "trote") return 0;
    return 10;
  }

  function severityBadge(sev) {
    const s = String(sev || "leve").toLowerCase();
    if (s === "critico") return `<span class="pill" style="border-color:rgba(255,70,110,0.45); box-shadow:0 0 0 1px rgba(255,70,110,0.18)">CRÍTICO</span>`;
    if (s === "grave") return `<span class="pill" style="border-color:rgba(255,70,110,0.35); box-shadow:0 0 0 1px rgba(255,70,110,0.12)">GRAVE</span>`;
    if (s === "medio") return `<span class="pill" style="border-color:rgba(255,190,70,0.35); box-shadow:0 0 0 1px rgba(255,190,70,0.12)">MÉDIO</span>`;
    if (s === "trote") return `<span class="pill" style="border-color:rgba(160,160,160,0.25); box-shadow:0 0 0 1px rgba(160,160,160,0.10)">TROTE</span>`;
    return `<span class="pill" style="border-color:rgba(60,220,160,0.25); box-shadow:0 0 0 1px rgba(60,220,160,0.10)">LEVE</span>`;
  }

  function rankByXp(xp) {
    if (xp >= 220) return "Supervisor";
    if (xp >= 120) return "Sênior";
    if (xp >= 50) return "Operador";
    return "Recruta";
  }

  function updateUnlockedUnitRoles(reason) {
    const rep = clamp(Math.round(state.economy?.reputation ?? 50), 0, 100);
    const base = allUnitRoleUnlocksUpToRank(state.career.rank || "Recruta");
    const roles = new Set(base);

    // Reputation can grant early access to special capabilities
    if (rep >= 65) roles.add("civil_investigation");
    if (rep >= 75) {
      roles.add("tactical_rota");
      roles.add("hazmat");
      roles.add("ladder_truck");
    }
    if (rep >= 85) {
      roles.add("shock_riot");
      roles.add("air_eagle");
      roles.add("bomb_gate");
    }

    // Very low reputation can temporarily suspend high-risk units
    if (rep < 30) {
      ["shock_riot", "air_eagle", "bomb_gate", "hazmat", "tactical_rota"].forEach((r) => roles.delete(r));
    }

    const before = new Set(state.progress.unlockedUnitRoles || []);
    const next = Array.from(roles);
    state.progress.unlockedUnitRoles = next;
    const gained = next.filter((r) => !before.has(r));
    if (gained.length) {
      log(`🔓 Novas capacidades desbloqueadas: ${gained.map(escapeHtml).join(", ")}${reason ? ` (${reason})` : ""}`);
    }
    saveProfile();
  }

  function isRoleUnlocked(role) {
    const unlocked = new Set(Array.isArray(state.progress?.unlockedUnitRoles) ? state.progress.unlockedUnitRoles : []);
    return unlocked.has(String(role || ""));
  }

  function addXp(amount) {
    state.career.xp = clamp(state.career.xp + amount, 0, 999999);
    const newRank = rankByXp(state.career.xp);
    if (newRank !== state.career.rank) {
      state.career.rank = newRank;
      log(`🏅 Promoção: agora você é ${newRank}!`);

      // Stage 4: unlock new cities on promotion
      const before = new Set(state.progress.unlockedCities || []);
      const unlockedNow = allUnlocksUpToRank(state.career.rank);
      state.progress.unlockedCities = Array.from(new Set([...before, ...unlockedNow]));
      const gained = state.progress.unlockedCities.filter((id) => !before.has(id));
      if (gained.length) {
        const names = gained.map((id) => cityNameById(id)).join(", ");
        log(`🗺️ Novas cidades desbloqueadas: ${names}`);
      }

      // Stage 5: unlock unit roles on promotion (and re-evaluate reputation gates)
      updateUnlockedUnitRoles("promoção");
    }

    saveProfile();
  }

  function addWarning(reason) {
    state.career.warnings += 1;
    log(`⚠️ ADVERTÊNCIA (${state.career.warnings}/3): ${reason}`);
    saveProfile();
    if (state.career.warnings >= 3) {
      log("🛑 DEMISSÃO VIRTUAL: 3 advertências no turno. Turno encerrado.");
      endShift();
    }
  }

  // ----------------------------
  // Timers
  // ----------------------------
  function spawnIntervalByDifficulty(diff) {
    let base = 7;
    if (diff === "easy") base = 10;
    if (diff === "hard") base = 5;

    // Stage 3: conditions influence call volume (night/storm = more pressure)
    const nightBoost = state.conditions.timeOfDay === "night" ? 0.90 : 1.0;
    const weatherBoost = state.conditions.weather === "storm" ? 0.85 : state.conditions.weather === "rain" ? 0.92 : 1.0;
    // Stage 5: special events can increase call volume (smaller interval)
    const eventBoost = state.specialEvent && state.specialEvent.spawnMult ? state.specialEvent.spawnMult : 1.0;
    base = Math.round(base * nightBoost * weatherBoost * eventBoost);
    return clamp(base, 3, 15);
  }

  function queueTTLBySeverity(sev, diff) {
    const s = String(sev || "leve").toLowerCase();
    let base = 30;
    if (s === "leve") base = 35;
    if (s === "medio") base = 30;
    if (s === "grave") base = 25;
    if (s === "trote") base = 20;
    if (diff === "easy") base += 10;
    if (diff === "hard") base -= 5;
    return clamp(base, 10, 90);
  }

  function callTTLBySeverity(sev, diff) {
    const s = String(sev || "leve").toLowerCase();
    let base = 60;
    if (s === "leve") base = 55;
    if (s === "medio") base = 60;
    if (s === "grave") base = 75;
    if (s === "trote") base = 40;
    if (diff === "easy") base += 15;
    if (diff === "hard") base -= 10;
    return clamp(base, 25, 180);
  }

  // ----------------------------
  // Abertura por região
  // ----------------------------
  function lineByRegion(region, agency) {
    const r = resolveRegion(region);
    const a = String(agency || "police").toLowerCase();
    if (r === "BR") return a === "fire" ? "193" : a === "ambulance" ? "192" : "190";
    if (r === "US") return "911";
    if (r === "EU") return "112";
    if (r === "OC") return "000";
    if (r === "AS") return a === "fire" || a === "ambulance" ? "119" : "110";
    if (r === "AF") return a === "fire" || a === "ambulance" ? "10177/112" : "10111/112";
    return "Emergência";
  }

  function defaultOpener(region, agency) {
    const r = resolveRegion(region);
    const a = String(agency || "police").toLowerCase();
    if (r === "BR") {
      if (a === "fire") return "193, Bombeiros. Qual sua emergência?";
      if (a === "ambulance") return "192, SAMU. Qual é a emergência médica?";
      return "190, Polícia Militar. Qual sua emergência?";
    }
    if (r === "US") {
      if (a === "fire") return "911, fire department. What is the location of the emergency?";
      if (a === "ambulance") return "911, EMS. Tell me the exact location of the patient.";
      return "911, what's your emergency?";
    }
    if (r === "EU") return a === "ambulance" ? "112, ambulance service. What is the location and condition of the patient?" : "112, emergência. Qual a sua localização e situação?";
    if (r === "OC") return "000, do you need Police, Fire or Ambulance?";
    if (r === "AS") return a === "police" ? "110, Police. What's your emergency?" : "119, Fire/Ambulance. What's the emergency?";
    return "Central de emergência. Qual é a ocorrência?";
  }

  // ----------------------------
  // Unidades
  // ----------------------------
  function getUnitsFor(cityId, agency) {
    const country = cityCountryById(cityId);
    const a = String(agency || "police").toLowerCase();

    if (a === "police") {
      if (country === "BR") {
        return [
          { id: "u_area_1", name: "PM Área (VTR)", role: "area_patrol", status: "available" },
          { id: "u_rota_1", name: "ROTA / Força Tática", role: "tactical_rota", status: "available" },
          { id: "u_choque_1", name: "Choque", role: "shock_riot", status: "available" },
          { id: "u_gate_1", name: "GATE (Antibomba)", role: "bomb_gate", status: "available" },
          { id: "u_aguia_1", name: "Águia (Helicóptero)", role: "air_eagle", status: "available" },
          { id: "u_pc_1", name: "Polícia Civil (Investigação)", role: "civil_investigation", status: "available" },
        ];
      }
      if (country === "US") {
        return [
          { id: "u_patrol_1", name: "Area Patrol", role: "area_patrol", status: "available" },
          { id: "u_swat_1", name: "SWAT", role: "tactical_rota", status: "available" },
          { id: "u_detective_1", name: "Detective Unit", role: "civil_investigation", status: "available" },
          { id: "u_bomb_1", name: "Bomb Squad", role: "bomb_gate", status: "available" },
          { id: "u_air_1", name: "Air Support", role: "air_eagle", status: "available" },
        ];
      }
      return [
        { id: "u_patrol_1", name: "Patrol Unit", role: "area_patrol", status: "available" },
        { id: "u_tac_1", name: "Tactical Unit", role: "tactical_rota", status: "available" },
        { id: "u_invest_1", name: "Investigation", role: "civil_investigation", status: "available" },
      ];
    }

    if (a === "ambulance") {
      if (country === "BR") {
        return [
          { id: "m_usb_1", name: "USB (Suporte Básico)", role: "medic_ambulance", status: "available" },
          { id: "m_usa_1", name: "USA (Suporte Avançado)", role: "medic_ambulance", status: "available" },
          { id: "m_moto_1", name: "Motolância", role: "fire_rescue", status: "available" },
          { id: "m_air_1", name: "Aeromédico", role: "air_eagle", status: "available" },
        ];
      }
      if (country === "US") {
        return [
          { id: "m_amb_1", name: "BLS Ambulance", role: "medic_ambulance", status: "available" },
          { id: "m_als_1", name: "ALS Paramedic Unit", role: "medic_ambulance", status: "available" },
          { id: "m_rescue_1", name: "Rescue Medic", role: "fire_rescue", status: "available" },
          { id: "m_air_1", name: "Air Ambulance", role: "air_eagle", status: "available" },
        ];
      }
      return [
        { id: "m_amb_1", name: "Ambulance", role: "medic_ambulance", status: "available" },
        { id: "m_rescue_1", name: "Rescue Medic", role: "fire_rescue", status: "available" },
      ];
    }

    if (country === "BR") {
      return [
        { id: "f_engine_1", name: "Auto Bomba (AB)", role: "fire_engine", status: "available" },
        { id: "f_ladder_1", name: "Auto Escada", role: "ladder_truck", status: "available" },
        { id: "f_rescue_1", name: "Resgate (UR)", role: "fire_rescue", status: "available" },
        { id: "f_haz_1", name: "Produtos Perigosos", role: "hazmat", status: "available" },
        { id: "f_medic_1", name: "Ambulância de Apoio", role: "medic_ambulance", status: "available" },
      ];
    }

    if (country === "US") {
      return [
        { id: "f_engine_1", name: "Engine", role: "fire_engine", status: "available" },
        { id: "f_ladder_1", name: "Ladder", role: "ladder_truck", status: "available" },
        { id: "f_rescue_1", name: "Rescue", role: "fire_rescue", status: "available" },
        { id: "f_haz_1", name: "HazMat", role: "hazmat", status: "available" },
        { id: "f_medic_1", name: "EMS Support", role: "medic_ambulance", status: "available" },
      ];
    }

    return [
      { id: "f_engine_1", name: "Fire Engine", role: "fire_engine", status: "available" },
      { id: "f_rescue_1", name: "Rescue", role: "fire_rescue", status: "available" },
      { id: "f_medic_1", name: "Ambulance", role: "medic_ambulance", status: "available" },
    ];
  }

  function renderUnits() {
    // IMPORTANT: don't recreate units every tick, otherwise statuses/movement reset.
    const key = `${state.cityId}__${state.agency}`;
    if (!state.units || !Array.isArray(state.units) || state.units.length === 0 || state.unitsKey !== key) {
      state.unitsKey = key;
      state.units = getUnitsFor(state.cityId, state.agency);

      // Attach base position + current position for map movement
      const center = getCityCenter(state.cityId);

    // Force local Leaflet marker icons to avoid CDN marker image warnings / 404s
    try {
      if (window.L && L.Icon && L.Icon.Default) {
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "./img/marker-icon-2x.png",
          iconUrl: "./img/marker-icon.png",
          shadowUrl: "./img/marker-shadow.png",
        });
      }
    } catch (e) { /* ignore */ }

      state.units = state.units.map((u, idx) => {
        const base = jitterPoint(center, 1.2 + (idx * 0.15));
        return {
          ...u,
          status: u.status || "available",
          basePos: base,
          pos: { ...base },
          move: null,
        };
      });
    }

    // Apply progression locks by role (Stage 5)
    state.units = state.units.map((u) => ({ ...u, locked: !isRoleUnlocked(u.role) }));

    if (el.unitsList) {
      el.unitsList.innerHTML = state.units
        .map((u) => {
          const lockTxt = u.locked ? ` <span style="opacity:.8">🔒 Bloqueado (carreira)</span>` : "";
          const statusTxt = u.status === "available" ? "Disponível" : escapeHtml(u.status);
          return `
        <div class="subCard" style="padding:10px; margin-top:0;">
          <div style="font-weight:900;">${escapeHtml(u.name)}${lockTxt}</div>
          <div style="font-size:12px; color:rgba(233,240,255,0.65)">role: ${escapeHtml(u.role)}</div>
          <div style="font-size:12px; color:rgba(233,240,255,0.65)">Status: ${statusTxt}</div>
        </div>`;
        })
        .join("");
    }

    if (el.dispatchUnitSelect) {
      // Preserve current selection. Stage 3 updates the UI frequently (stress, HUD),
      // so we must not wipe the user's selection before they click "Despachar".
      const prev = el.dispatchUnitSelect.value;

      el.dispatchUnitSelect.innerHTML =
        `<option value="">Selecione a unidade</option>` +
        state.units
          .filter((u) => u.status === "available" && !u.locked)
          .map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.role)})</option>`)
          .join("");

      // Restore selection if still available
      if (prev && [...el.dispatchUnitSelect.options].some((o) => o.value === prev)) {
        el.dispatchUnitSelect.value = prev;
      }

      // Quando o despacho é liberado, selecione automaticamente a primeira unidade disponível
      // para evitar a sensação de que o painel segue "indisponível".
      if ((!el.dispatchUnitSelect.value || el.dispatchUnitSelect.value === "") && state.activeCall && (state.activeCall.dispatchUnlocked || state.activeCall.isIncidentFocus)) {
        const firstAvailable = [...el.dispatchUnitSelect.options].find((o) => !!o.value);
        if (firstAvailable) el.dispatchUnitSelect.value = firstAvailable.value;
      }
    }

    // Keep map markers in sync
    upsertUnitMarkers();
  }

  function updateUnitMovementTick() {
    if (!Array.isArray(state.units) || !state.units.length) return;
    for (const u of state.units) {
      if (!u.move) continue;
      u.move.remaining = Math.max(0, (u.move.remaining || 0) - 1);

      // Linear interpolation towards target
      const rem = Math.max(1, u.move.remaining || 1);
      const to = u.move.target;
      if (u.pos && to) {
        const stepLat = (to.lat - u.pos.lat) / rem;
        const stepLng = (to.lng - u.pos.lng) / rem;
        u.pos.lat += stepLat;
        u.pos.lng += stepLng;
      }

      if (u.move.remaining <= 0) {
        if (u.move.phase === "enroute") {
          u.status = "onscene";
          u.move = { phase: "onscene", remaining: Math.max(3, u.move.onsceneSec || 5), target: { ...u.pos }, returnEta: u.move.returnEta };
        } else if (u.move.phase === "onscene") {
          u.status = "returning";
          const back = u.basePos || getCityCenter(state.cityId);
          u.move = { phase: "returning", remaining: Math.max(8, u.move.returnEta || 16), target: { ...back } };
        } else {
          u.status = "available";
          u.move = null;
          // Snap back
          if (u.basePos) u.pos = { ...u.basePos };
        }
      }
    }
    upsertUnitMarkers();
  }

  // ----------------------------
  // Cidades
  // ----------------------------
  function cityNameById(id) {
    const cities = getCities();
    const c = cities.find((x) => x.id === id);
    return c ? c.name : String(id || "—");
  }

  function flagByCityId(id) {
    const cities = getCities();
    const c = cities.find((x) => x.id === id);
    if (!c) return "🏙️";
    const cc = (c.country || "").toUpperCase();
    if (cc === "BR") return "🇧🇷";
    if (cc === "US") return "🇺🇸";
    if (cc === "EU") return "🇪🇺";
    if (cc === "JP") return "🇯🇵";
    if (cc === "IN") return "🇮🇳";
    if (cc === "AU") return "🇦🇺";
    if (cc === "ZA") return "🇿🇦";
    return "🏙️";
  }

  function populateCities() {
    const unlocked = new Set(Array.isArray(state.progress?.unlockedCities) ? state.progress.unlockedCities : []);
    const citiesAll = getCities();
    // If current selection is not unlocked (e.g., after data update), keep it available
    if (state.cityId) unlocked.add(state.cityId);
    let cities = citiesAll.filter((c) => unlocked.has(c.id));
    // Safety: if unlock IDs don't match current dataset, don't soft-lock the player
    if (!cities.length) cities = citiesAll;
    if (!el.citySelect) return;
    el.citySelect.innerHTML = cities
      .map((c) => `<option value="${escapeHtml(c.id)}">${flagByCityId(c.id)} ${escapeHtml(c.name)}</option>`)
      .join("");
    state.cityId = state.cityId || cities[0]?.id || "br_sp";
    el.citySelect.value = state.cityId;
  }

  // ----------------------------
  // Protocolo / Instância de chamada
  // ----------------------------
  // ----------------------------
// Stage 7C: Incidentes (manager) + Transcript append-only
// ----------------------------
function ensureTranscriptInitialized(call) {
  if (!call) return;
  if (call.transcriptInitialized) return;

  const def = call.def;
  const opener = defaultOpener(def.region, state.agency);
  const opening = def.opening || def.openText || def.openingText || def.callerOpening || def.title;

  call.transcript = [];
  call.transcript.push(`Operador: ${opener}`);
  call.transcript.push("");
  call.transcript.push(`Chamador: ${opening}`);
  call.transcript.push("");
  call.transcriptInitialized = true;
  call.transcriptText = call.transcript.join("\n");
}

function appendTranscript(call, lines) {
  if (!call) return;
  ensureTranscriptInitialized(call);
  if (!Array.isArray(lines)) lines = [String(lines)];
  for (const ln of lines) call.transcript.push(String(ln));
  call.transcriptText = call.transcript.join("\n");
}

function computeOnsceneSec(severity, role) {
  const s = String(severity || "leve").toLowerCase();
  let base = 10;
  if (s === "trote") base = 6;
  if (s === "leve") base = 10;
  if (s === "medio") base = 14;
  if (s === "grave") base = 20;
  if (s === "critico") base = 26;

  // Some roles take longer on scene (bomb/hazmat)
  if (role === "bomb_gate" || role === "hazmat") base += 10;
  if (role === "tactical_rota" || role === "shock_riot") base += 4;

  // Upgrades can shorten on-scene handling slightly
  const m = state.effects && typeof state.effects.onsceneMult === "number" ? state.effects.onsceneMult : 1.0;
  return Math.max(6, Math.round(base * m));
}

function getIncidentByUid(uid) {
  return Array.isArray(state.incidents) ? state.incidents.find((x) => x && x.uid === uid) : null;
}

function upsertIncident(incident) {
  if (!incident) return;
  if (!Array.isArray(state.incidents)) state.incidents = [];
  const i = state.incidents.findIndex((x) => x && x.uid === incident.uid);
  if (i >= 0) state.incidents[i] = incident;
  else state.incidents.unshift(incident);
}

function refreshIncidentStatuses() {
  if (!Array.isArray(state.incidents)) return;
  // Remove incidents once all assigned units are back available
  state.incidents = state.incidents.filter((inc) => {
    const ids = Array.isArray(inc.unitIds) ? inc.unitIds : [];
    if (!ids.length) return false;
    const units = ids.map((id) => state.units.find((u) => u.id === id)).filter(Boolean);
    const anyBusy = units.some((u) => u.status !== "available");
    return anyBusy;
  });
}

function focusIncident(uid) {
  const inc = getIncidentByUid(uid);
  if (!inc) return;
  state.focusIncidentUid = uid;

  // Put the incident in the "activeCall" panel as a focus view (no timers, only reinforcement dispatch)
  state.activeCall = inc.call;
  state.activeCall.isIncidentFocus = true;
  state.activeCall.dispatchUnlocked = true;
  state.activeCall.callTTL = 9999;
  state.activeCall.worsenTTL = null;

  // show on map
  setIncidentOnMap(state.activeCall);
  log(`🎯 Foco no incidente: "${inc.title}" (${humanSeverity(inc.severity)})`);
  renderAll();
}

// ----------------------------
// Stage 7C: Incidentes (manager) + Transcript append-only
// ----------------------------
function ensureTranscriptInitialized(call) {
  if (!call) return;
  if (call.transcriptInitialized) return;

  const def = call.def;
  const opener = defaultOpener(def.region, state.agency);
  const opening = def.opening || def.openText || def.openingText || def.callerOpening || def.title;

  call.transcript = [];
  call.transcript.push(`Operador: ${opener}`);
  call.transcript.push("");
  call.transcript.push(`Chamador: ${opening}`);
  call.transcript.push("");
  call.transcriptInitialized = true;
  call.transcriptText = call.transcript.join("\n");
}

function appendTranscript(call, lines) {
  if (!call) return;
  ensureTranscriptInitialized(call);
  if (!Array.isArray(lines)) lines = [String(lines)];
  for (const ln of lines) call.transcript.push(String(ln));
  call.transcriptText = call.transcript.join("\n");
}

function computeOnsceneSec(severity, role) {
  const s = String(severity || "leve").toLowerCase();
  let base = 10;
  if (s === "trote") base = 6;
  if (s === "leve") base = 10;
  if (s === "medio") base = 14;
  if (s === "grave") base = 20;
  if (s === "critico") base = 26;

  // Some roles take longer on scene (bomb/hazmat)
  if (role === "bomb_gate" || role === "hazmat") base += 10;
  if (role === "tactical_rota" || role === "shock_riot") base += 4;

  // Upgrades can shorten on-scene handling slightly
  const m = state.effects && typeof state.effects.onsceneMult === "number" ? state.effects.onsceneMult : 1.0;
  return Math.max(6, Math.round(base * m));
}

function getIncidentByUid(uid) {
  return Array.isArray(state.incidents) ? state.incidents.find((x) => x && x.uid === uid) : null;
}

function upsertIncident(incident) {
  if (!incident) return;
  if (!Array.isArray(state.incidents)) state.incidents = [];
  const i = state.incidents.findIndex((x) => x && x.uid === incident.uid);
  if (i >= 0) state.incidents[i] = incident;
  else state.incidents.unshift(incident);
}

function refreshIncidentStatuses() {
  if (!Array.isArray(state.incidents)) return;
  // Remove incidents once all assigned units are back available
  state.incidents = state.incidents.filter((inc) => {
    const ids = Array.isArray(inc.unitIds) ? inc.unitIds : [];
    if (!ids.length) return false;
    const units = ids.map((id) => state.units.find((u) => u.id === id)).filter(Boolean);
    const anyBusy = units.some((u) => u.status !== "available");
    return anyBusy;
  });
}

function focusIncident(uid) {
  const inc = getIncidentByUid(uid);
  if (!inc) return;
  state.focusIncidentUid = uid;

  // Put the incident in the "activeCall" panel as a focus view (no timers, only reinforcement dispatch)
  state.activeCall = inc.call;
  state.activeCall.isIncidentFocus = true;
  state.activeCall.dispatchUnlocked = true;
  state.activeCall.callTTL = 9999;
  state.activeCall.worsenTTL = null;

  // show on map
  setIncidentOnMap(state.activeCall);
  log(`🎯 Foco no incidente: "${inc.title}" (${humanSeverity(inc.severity)})`);
  renderAll();
}

function getProtocolDef(callDef) {
    return callDef && callDef.protocol ? callDef.protocol : { required: [], questions: [] };
  }

  function makeCallInstance(def) {
    uidCounter += 1;
    const eff = state.effects || computeUpgradeEffects();
    const baseSev = (def.baseSeverity || "leve").toLowerCase();
    const worsenMult = typeof eff.worsenTimeMult === "number" ? eff.worsenTimeMult : 1.0;
    const center = getCityCenter(state.cityId);

    // Force local Leaflet marker icons to avoid CDN marker image warnings / 404s
    try {
      if (window.L && L.Icon && L.Icon.Default) {
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "./img/marker-icon-2x.png",
          iconUrl: "./img/marker-icon.png",
          shadowUrl: "./img/marker-shadow.png",
        });
      }
    } catch (e) { /* ignore */ }

    const addr = genAddress(state.cityId);
    const loc = jitterPoint(center, 4.0);
    return {
      uid: `call_${uidCounter}_${Date.now()}`,
      def,
      severity: baseSev,
      confidenceTrote: baseSev === "trote" ? 2 : 0,

      // Stage 7B: lightweight geo for the operational map
      location: {
        district: addr.district,
        address: addr.address,
        lat: loc.lat,
        lng: loc.lng,
      },

      queueTTL: queueTTLBySeverity(baseSev, state.difficulty),
      // Call TTL (time-to-fail) can be provided by the call definition (timers.fail)
      callTTL: (def && def.timers && typeof def.timers.fail === "number")
        ? Math.max(10, Math.floor(def.timers.fail))
        : callTTLBySeverity(baseSev, state.difficulty),

      // Worsen timer triggers a severity escalation (timers.worsen)
      worsenTTL: (def && def.timers && typeof def.timers.worsen === "number")
        ? Math.max(5, Math.floor(def.timers.worsen * worsenMult))
        : null,
      worsened: false,

      overdue: false,
      overduePenalized: false,

      asked: {},
      dispatchUnlocked: false,

      // Stage 7C: append-only transcript (no repetir abertura)
      transcriptInitialized: false,
      transcript: [],
      transcriptText: "",

      startedAt: null,
      answeredAt: null,
    };
  }

  function updateDispatchUnlock() {
    if (!state.activeCall) return false;
    const protocol = getProtocolDef(state.activeCall.def);
    const required = Array.isArray(protocol.required) ? protocol.required : [];
    const missing = required.filter((qid) => !state.activeCall.asked[qid]);
    const ok = missing.length === 0;
    state.activeCall.dispatchUnlocked = ok;

    if (ok && !state.activeCall.dispatchAnnounced) {
      state.activeCall.dispatchAnnounced = true;
      log("✅ Despacho liberado: perguntas obrigatórias concluídas.");
    }

    return ok;
  }

  function applyQuestionEffect(effect) {
    if (!state.activeCall || !effect) return;

    if (typeof effect.confidenceTrote === "number") {
      state.activeCall.confidenceTrote += effect.confidenceTrote;
      state.activeCall.confidenceTrote = clamp(state.activeCall.confidenceTrote, 0, 10);
    }

    if (effect.severity) {
      const rank = { trote: 0, leve: 1, medio: 2, grave: 3, critico: 4 };
      const cur = state.activeCall.severity || "leve";
      const next = String(effect.severity).toLowerCase();
      if (rank[next] >= rank[cur]) state.activeCall.severity = next;
    }

    // Virtual time penalty (represents delay/confusion) applied directly to the
    // remaining call TTL. This increases pressure without requiring a map/ETA.
    if (typeof effect.timePenaltySec === "number") {
      const mult = state.effects && typeof state.effects.wrongQuestionPenaltyMult === "number" ? state.effects.wrongQuestionPenaltyMult : 1.0;
      const p = Math.max(0, Math.floor(effect.timePenaltySec * mult));
      if (p > 0) {
        state.activeCall.callTTL = Math.max(0, state.activeCall.callTTL - p);
        // Stage 3: mistakes raise operator stress
        addStress(Math.min(12, p * 0.6));
      }
    }

    // Force an escalation on critical mistakes
    if (effect.forceWorsen) {
      addStress(10);
      worsenActiveCall("Erro crítico no protocolo");
    }
  }

  // ----------------------------
  // Agravamento / Falha por tempo
  // ----------------------------
  function escalateSeverity(cur) {
    const s = String(cur || "leve").toLowerCase();
    if (s === "trote") return "trote";
    if (s === "leve") return "medio";
    if (s === "medio") return "grave";
    if (s === "grave") return "critico";
    return "critico";
  }

  function worsenActiveCall(reason) {
    const c = state.activeCall;
    if (!c || c.worsened || c.severity === "trote") return;
    c.worsened = true;
    c.severity = escalateSeverity(c.severity);
    // Stage 3: escalation spikes operator stress
    addStress(12);
    // Increase pressure a bit more when it worsens
    c.callTTL = Math.max(0, c.callTTL - 6);
    appendTranscript(c, [`⚠️ [Sistema] Ocorrência agravou (${reason || "tempo"}). Gravidade agora: ${humanSeverity(c.severity)}.`, ""]);
    log(`⚠️ OCORRÊNCIA AGRAVOU (${reason || "tempo"}). Gravidade agora: ${humanSeverity(c.severity)}.`);
    renderActiveCall(false);
  }

  function failActiveCall(reason) {
    const c = state.activeCall;
    if (!c) return;

    // Stage 3: failures are mentally crushing
    addStress(18);

    const def = c.def;
    state.stats.wrong += 1;
    state.career.totalFail += 1;

    const scoreDelta = -Math.max(12, severityScore(c.severity));
    const xpDelta = -3;
    state.score += scoreDelta;
    addXp(xpDelta);

    addWarning("Falha por tempo/pressão na chamada.");
    log(`☠️ FALHA NA CHAMADA: "${def.title}" (${reason || "tempo esgotado"}) (${scoreDelta})`);

    setReport({
      title: def.title,
      severity: c.severity,
      outcomeLabel: "FALHA (TEMPO)",
      description: def && def.outcomes && def.outcomes.fail
        ? def.outcomes.fail
        : "Tempo esgotado. A ocorrência não recebeu resposta adequada a tempo.",
      unitName: "—",
      unitRole: "—",
      scoreDelta,
      xpDelta,
      handleTime: Math.max(0, (state.timeSec - c.startedAt)),
    });

    state.activeCall = null;
    renderAll();
  }

  // ----------------------------
  // Perguntas dinâmicas (UI)
  // ----------------------------
  function askQuestion(questionId) {
    if (!state.shiftActive || !state.activeCall) return;
    const protocol = getProtocolDef(state.activeCall.def);
    const q = (protocol.questions || []).find((x) => x.id === questionId);
    if (!q) return;

    if (state.activeCall.asked[questionId]) {
      log(`ℹ️ Pergunta já feita: ${q.label}`);
      return;
    }

    // Se o jogador clicar enquanto ainda está digitando, pula para o final antes
    skipTypewriter(el.callText);

    state.activeCall.asked[questionId] = true;
    state.score += 1;
    applyQuestionEffect(q.effect);

    // Stage 7C: append-only transcript
    appendTranscript(state.activeCall, [
      `Operador: ${q.prompt}`,
      `Chamador: ${q.answer || "(sem resposta)"}`,
      "",
    ]);

    log(`🧾 Perguntou: ${q.label} (+1)`);
    updateDispatchUnlock();

    renderDynamicQuestions();
    renderActiveCall(false); // mantém a abertura original e só acrescenta o novo trecho
    renderAll();
  }

  function renderDynamicQuestions() {
    if (!dq.panel || !dq.meta || !dq.buttons || !dq.hint) return;

    if (!state.activeCall) {
      dq.meta.textContent = "Nenhuma chamada ativa";
      dq.buttons.innerHTML = "";
      dq.hint.textContent = "Faça as perguntas obrigatórias para liberar o despacho.";
      return;
    }

    const protocol = getProtocolDef(state.activeCall.def);
    const required = Array.isArray(protocol.required) ? protocol.required : [];
    const questions = Array.isArray(protocol.questions) ? protocol.questions : [];

    const checklist = required.map((qid) => (state.activeCall.asked[qid] ? `✅ ${qid}` : `⬜ ${qid}`)).join(" | ");
    dq.meta.textContent = `Obrigatórias: ${checklist || "nenhuma"} • Gravidade atual: ${humanSeverity(state.activeCall.severity)}`;

    dq.buttons.innerHTML = questions
      .map((q) => {
        const asked = !!state.activeCall.asked[q.id];
        const cls = asked ? "btnGhost" : "btnPrimary";
        const disabled = asked ? "disabled" : "";
        return `<button class="${cls}" data-qid="${escapeHtml(q.id)}" ${disabled}>${escapeHtml(q.label)}</button>`;
      })
      .join("");

    dq.hint.textContent = state.activeCall.def.hint || "Colete dados, libere despacho e envie a unidade correta.";

    const btns = dq.buttons.querySelectorAll("button[data-qid]");
    btns.forEach((b) => {
      b.addEventListener("click", () => {
        const qid = b.getAttribute("data-qid");
        askQuestion(qid);
      });
    });
  }

  // ----------------------------
  // Relatório pós-chamada
  // ----------------------------
  function setReport(report) {
    state.lastReport = report;

    if (!rp.panel || !rp.meta || !rp.body || !rp.career) return;

    rp.meta.textContent = report
      ? `${report.title} • ${report.outcomeLabel} • Gravidade: ${humanSeverity(report.severity)}`
      : "Nenhum relatório ainda";

    rp.body.innerHTML = report
      ? `
        <div><b>Tempo total em atendimento:</b> ${fmtTime(report.handleTime)}</div>
        <div><b>Unidade enviada:</b> ${escapeHtml(report.unitName || "—")} (${escapeHtml(report.unitRole || "—")})</div>
        <div><b>Resultado:</b> ${escapeHtml(report.description)}</div>
        <div style="margin-top:8px;"><b>Pontos:</b> ${report.scoreDelta >= 0 ? "+" : ""}${report.scoreDelta}</div>
        <div><b>XP:</b> ${report.xpDelta >= 0 ? "+" : ""}${report.xpDelta}</div>
      `
      : "Atenda uma chamada e finalize para gerar relatório.";

    rp.career.innerHTML = `
      <div class="pill">Rank: ${escapeHtml(state.career.rank)}</div>
      <div class="pill">XP: ${state.career.xp}</div>
      <div class="pill">Advertências: ${state.career.warnings}/3</div>
      <div class="pill">Sucessos: ${state.career.totalSuccess}</div>
      <div class="pill">Falhas: ${state.career.totalFail}</div>
      <div class="pill">Vidas salvas: ${state.career.totalLivesSaved}</div>
    `;
  }

  // ----------------------------
  // HUD / Queue / Summary
  // ----------------------------
  function updateHud() {
    if (el.hudShift) el.hudShift.textContent = state.shiftActive ? "ATIVO" : "—";
    if (el.hudTime) el.hudTime.textContent = fmtTime(state.timeSec);
    if (el.hudScore) el.hudScore.textContent = String(state.score);
    if (el.hudQueue) el.hudQueue.textContent = String(state.queue.length);
    if (el.hudStress) {
      el.hudStress.textContent = `${state.stress}%`;
      el.hudStress.style.setProperty("--meter", `${state.stress}%`);
    }
  }

  function updatePills() {
    if (el.pillStatus) el.pillStatus.textContent = state.shiftActive ? "Turno em andamento" : "Turno parado";
    if (!el.pillCallTimer) return;

    if (!state.activeCall) {
      el.pillCallTimer.textContent = "Sem chamada";
      el.pillCallTimer.style.borderColor = "";
      return;
    }
    const overdue = state.activeCall.overdue;
    const callT = Math.max(0, state.activeCall.callTTL || 0);
    const worsT = state.activeCall.worsenTTL;

    if (overdue) {
      el.pillCallTimer.textContent = `Tempo excedido`;
      el.pillCallTimer.style.borderColor = "rgba(255,70,110,0.45)";
      return;
    }

    // Show both timers when available
    if (typeof worsT === "number" && !state.activeCall.worsened) {
      el.pillCallTimer.textContent = `FALHA em ${fmtTime(callT)} • AGRAVA em ${fmtTime(Math.max(0, worsT))}`;
    } else {
      el.pillCallTimer.textContent = `FALHA em ${fmtTime(callT)}`;
    }

    // Colour cue based on urgency
    if (callT <= 15) {
      el.pillCallTimer.style.borderColor = "rgba(255,70,110,0.45)";
    } else if (typeof worsT === "number" && worsT <= 12 && !state.activeCall.worsened) {
      el.pillCallTimer.style.borderColor = "rgba(255,190,70,0.45)";
    } else {
      el.pillCallTimer.style.borderColor = "rgba(255,255,255,0.12)";
    }
  }

  function setButtons() {
  const hasShift = state.shiftActive;
  const hasQueue = state.queue.length > 0;
  const hasActive = !!state.activeCall;

  if (el.btnAnswer) el.btnAnswer.disabled = !(hasShift && !hasActive && hasQueue);
  if (el.btnHold) el.btnHold.disabled = !(hasShift && hasActive && !state.activeCall.isIncidentFocus);

  const canDispatch = hasShift && hasActive && (state.activeCall.dispatchUnlocked || state.activeCall.isIncidentFocus);
  if (el.dispatchUnitSelect) {
    el.dispatchUnitSelect.disabled = !canDispatch;
    if (canDispatch && !el.dispatchUnitSelect.value) {
      const firstAvailable = [...el.dispatchUnitSelect.options].find((o) => !!o.value);
      if (firstAvailable) el.dispatchUnitSelect.value = firstAvailable.value;
    }
  }

  const hasPending = Array.isArray(state.pendingDispatchUnitIds) && state.pendingDispatchUnitIds.length > 0;
  const selected = !!(el.dispatchUnitSelect && el.dispatchUnitSelect.value);

  if (el.btnAddUnit) el.btnAddUnit.disabled = !(canDispatch && selected);
  if (el.btnDispatch) el.btnDispatch.disabled = !(canDispatch && (hasPending || selected));
  if (el.btnDismiss) el.btnDismiss.disabled = !(hasShift && hasActive && !state.activeCall.isIncidentFocus);
}

function renderQueue() {
    if (!el.queueList) return;
    if (!state.queue.length) {
      el.queueList.innerHTML = "—";
      return;
    }

    el.queueList.innerHTML = state.queue
      .map((c, idx) => {
        const ttl = fmtTime(c.queueTTL);
        return `
        <div class="subCard" style="padding:10px; margin-top:0; display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="min-width:0;">
            <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${idx + 1}. ${escapeHtml(c.def.title)}
            </div>
            <div style="font-size:12px; color:rgba(233,240,255,0.65)">
              Restante: ${ttl} • Gravidade: ${escapeHtml(humanSeverity(c.severity))}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${severityBadge(c.severity)}
          </div>
        </div>`;
      })
      .join("");
  }

  function renderDispatchSelectedList() {
  if (!el.dispatchSelectedList) return;
  const ids = Array.isArray(state.pendingDispatchUnitIds) ? state.pendingDispatchUnitIds : [];
  if (!state.shiftActive) { el.dispatchSelectedList.innerHTML = "—"; return; }
  if (!ids.length) { el.dispatchSelectedList.innerHTML = "—"; return; }
  const items = ids.map((id) => {
    const u = state.units.find((x) => x.id === id);
    return u ? `${escapeHtml(u.name)} <span style="opacity:.7">(${escapeHtml(u.role)})</span>` : escapeHtml(id);
  });
  el.dispatchSelectedList.innerHTML = items.map((t) => `<div class="miniItem">${t}</div>`).join("");
}

function renderIncidents() {
  if (!el.incidentsList) return;

  refreshIncidentStatuses();

  if (!Array.isArray(state.incidents) || !state.incidents.length) {
    el.incidentsList.innerHTML = "—";
    return;
  }

  el.incidentsList.innerHTML = state.incidents
    .map((inc) => {
      const units = (inc.unitIds || []).map((id) => state.units.find((u) => u.id === id)).filter(Boolean);
      const busy = units.filter((u) => u.status !== "available");
      const status = busy.length ? busy[0].status : "—";
      const focused = state.focusIncidentUid === inc.uid;
      return `
      <div class="subCard" data-inc="${escapeHtml(inc.uid)}" style="padding:10px; margin-top:0; cursor:pointer; border:${focused ? "1px solid rgba(90,190,255,.55)" : "1px solid rgba(255,255,255,0.12)"};">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="min-width:0;">
            <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(inc.title)}
            </div>
            <div style="font-size:12px; color:rgba(233,240,255,0.65)">
              Gravidade: ${escapeHtml(humanSeverity(inc.severity))} • Unidades: ${units.length} • Status: ${escapeHtml(status)}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${severityBadge(inc.severity)}
          </div>
        </div>
      </div>`;
    })
    .join("");

  const cards = el.incidentsList.querySelectorAll("[data-inc]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const uid = card.getAttribute("data-inc");
      focusIncident(uid);
    });
  });
}

function renderSummary() {
    if (!el.shiftSummary) return;

    if (!state.shiftActive) {
      el.shiftSummary.textContent = "Nenhum turno ativo.";
      return;
    }

    const s = state.stats;
    const obj = Array.isArray(state.objectives.list) ? state.objectives.list : [];
    const objHtml = obj.length
      ? `<div style="margin-top:10px; font-size:12px; color:rgba(233,240,255,0.75); line-height:1.35">
          <b>Objetivos do turno</b><br>
          ${obj.map((o) => {
            let done = false;
            try { done = !!(o.check && o.check()); } catch { done = false; }
            return `${done ? "✅" : "⬜"} ${escapeHtml(o.label)}`;
          }).join("<br>")}
        </div>`
      : "";
    el.shiftSummary.innerHTML = `
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div class="pill">Atendidas: ${s.handled}</div>
        <div class="pill">Despachadas: ${s.dispatched}</div>
        <div class="pill">Acertos: ${s.correct}</div>
        <div class="pill">Erros: ${s.wrong}</div>
        <div class="pill">Expiradas (fila): ${s.expired}</div>
        <div class="pill">Trote encerrado: ${s.dismissedTrote}</div>
        <div class="pill">Atrasos: ${s.overtime}</div>
      </div>
      <div style="margin-top:10px; font-size:12px; color:rgba(233,240,255,0.70)">
        Carreira: ${escapeHtml(state.career.rank)} • XP ${state.career.xp} • Advertências ${state.career.warnings}/3
      </div>
      ${objHtml}
    `;
  }

  // ----------------------------
  // Render chamada ativa (com cache + typewriter humano)
  // ----------------------------
  function renderActiveCall(force = false) {
    if (!el.callText || !el.callMeta) return;

    if (!state.activeCall) {
      el.callMeta.textContent = "—";
      el.callText.textContent = state.shiftActive ? "Aguardando chamadas..." : "Inicie um turno para receber chamadas.";
      if (el.dispatchInfo) el.dispatchInfo.textContent = "—";

      state.ui.lastCallUid = null;
      state.ui.lastTranscript = "";

      renderDynamicQuestions();
      return;
    }

    const c = state.activeCall;
    const def = c.def;

    const line = lineByRegion(def.region, state.agency);
    const tp = typingProfileForCall(def, c.severity);
    const loc = c.location ? ` • Local: ${c.location.address}` : "";
    el.callMeta.textContent = `Linha: ${line} • Caso: ${def.title} • Gravidade: ${humanSeverity(c.severity)} • Estado: ${tp.callerState}${loc}`;

    
// Stage 7C: transcript append-only (não repete a abertura em cada pergunta)
ensureTranscriptInitialized(c);

let convo = c.transcriptText || "";
if (def.hint && !c.hintInjected) {
  appendTranscript(c, [`[Dica] ${def.hint}`, ""]);
  c.hintInjected = true;
  convo = c.transcriptText || "";
}

    const sameCall = state.ui.lastCallUid === c.uid;
    const sameText = state.ui.lastTranscript === convo;

    // Stage 3: typing feel adapts to caller state and operator stress
    const stressJitter = Math.min(28, Math.round(state.stress / 3));
    const twOpts = {
      baseMs: tp.baseMs,
      commaMs: TYPEWRITER.commaMs,
      punctMs: TYPEWRITER.punctMs,
      newlineMs: TYPEWRITER.newlineMs,
      jitterMs: stressJitter,
    };

    if (!force && sameCall && sameText) {
      // não reinicia typewriter
    } else if (!force && sameCall && state.ui.lastTranscript && convo.startsWith(state.ui.lastTranscript)) {
      // ✅ Não reescreve o "190/193..." toda hora.
      // Em vez disso, finaliza o que estiver animando e digita apenas o trecho novo.
      const previous = state.ui.lastTranscript || "";
      const delta = convo.slice(previous.length);
      skipTypewriter(el.callText);
      state.ui.lastTranscript = convo;
      if (delta) typewriterAppend(el.callText, delta, twOpts);
    } else {
      state.ui.lastCallUid = c.uid;
      state.ui.lastTranscript = convo;
      typewriter(el.callText, convo, twOpts);
    }

    if (el.dispatchInfo) {
      if (c.dispatchUnlocked || c.isIncidentFocus) {
        el.dispatchInfo.textContent = `Despacho liberado. Selecione a unidade e despache.`;
      } else {
        const protocol = getProtocolDef(c.def);
        const required = Array.isArray(protocol.required) ? protocol.required : [];
        const missing = required.filter((qid) => !c.asked[qid]);
        el.dispatchInfo.textContent = missing.length
          ? `Despacho bloqueado. Falta perguntar: ${missing.join(', ')}.`
          : `Despacho bloqueado. Faça as perguntas obrigatórias primeiro.`;
      }
    }
  }

  // ----------------------------
  // Seleção de caso
  // ----------------------------
  function pickCallDef() {
    const calls = getCalls();
    const poolByAgency = calls.filter((c) => (c.agency || "police") === state.agency);
    const pool = poolByAgency.length ? poolByAgency : calls;

    const troteChance = state.difficulty === "easy" ? 0.10 : state.difficulty === "hard" ? 0.18 : 0.15;
    let candidates = pool;

    if (Math.random() < troteChance) {
      const trotes = pool.filter((c) => String(c.baseSeverity).toLowerCase() === "trote");
      if (trotes.length) candidates = trotes;
    }

    return safeRandom(candidates);
  }

  function spawnCall() {
    if (!state.shiftActive) return;
    if (state.queue.length >= state.maxQueue) return;

    const def = pickCallDef();
    if (!def) return;

    const inst = makeCallInstance(def);
    state.queue.push(inst);

    log(`🚨 Nova chamada: "${def.title}" (${humanSeverity(inst.severity)})`);
  }

  // ----------------------------
  // Stage 5: Eventos especiais (cinematográficos)
  // ----------------------------
  function pickSpecialEvent() {
    const diff = state.difficulty || "normal";
    const weekend = (state.campaign?.day || 1) >= 6;
    const storm = state.conditions.weather === "storm";

    let chance = 0.12;
    if (diff === "hard") chance += 0.08;
    if (diff === "easy") chance -= 0.04;
    if (storm) chance += 0.10;
    if (weekend) chance += 0.06;
    chance = clamp(chance, 0.05, 0.35);

    if (Math.random() > chance) return null;

    const policePool = [
      { id: "pol_shots", name: "🚨 Tiroteio em andamento", spawnMult: 0.75, stressBoost: 0.10 },
      { id: "pol_hostage", name: "🏦 Assalto com reféns", spawnMult: 0.80, stressBoost: 0.08 },
      { id: "pol_riot", name: "🛡️ Distúrbio violento", spawnMult: 0.78, stressBoost: 0.09 },
    ];
    const firePool = [
      { id: "fire_ind", name: "🔥 Incêndio industrial", spawnMult: 0.80, stressBoost: 0.08 },
      { id: "fire_gas", name: "🧯 Vazamento de gás em massa", spawnMult: 0.78, stressBoost: 0.09 },
      { id: "fire_mci", name: "🚑 Múltiplas vítimas", spawnMult: 0.75, stressBoost: 0.10 },
    ];
    const medicalPool = [
      { id: "med_mci", name: "🚑 Evento com múltiplas vítimas", spawnMult: 0.78, stressBoost: 0.09 },
      { id: "med_cardiac", name: "❤️ Parada cardiorrespiratória em série", spawnMult: 0.82, stressBoost: 0.10 },
      { id: "med_crash", name: "🛵 Colisão grave com vítimas", spawnMult: 0.80, stressBoost: 0.08 },
    ];

    const pool = state.agency === "fire" ? firePool : state.agency === "ambulance" ? medicalPool : policePool;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ----------------------------
  // Resultado real (modelo)
  // ----------------------------
  function computeOutcome({ isTrote, correctRole, overdue, severity }) {
    const s = String(severity || "leve").toLowerCase();

    if (isTrote) {
      return {
        outcome: "trote",
        outcomeLabel: "TROTE",
        description: "Chamado falso/indevido. Recursos não devem ser mobilizados.",
        livesSaved: 0,
        penalty: true,
      };
    }

    if (!correctRole) {
      let desc = "Despacho incorreto. Resposta inadequada gerou falha operacional.";
      let lives = 0;
      if (s === "grave") desc = "Despacho incorreto em ocorrência GRAVE. Possível vítima/risco não atendido a tempo.";
      if (s === "medio") desc = "Despacho incorreto. Ocorrência não controlada corretamente.";
      return {
        outcome: "fail",
        outcomeLabel: "FALHA",
        description: desc,
        livesSaved: lives,
        penalty: true,
      };
    }

    if (overdue) {
      if (s === "grave") {
        return {
          outcome: "partial",
          outcomeLabel: "ATRASO CRÍTICO",
          description: "Unidade correta foi enviada, mas o atraso agravou o cenário. Alto risco de consequências.",
          livesSaved: 0,
          penalty: true,
        };
      }
      return {
        outcome: "partial",
        outcomeLabel: "ATRASO",
        description: "Unidade correta foi enviada, porém com atraso. O caso foi controlado com dificuldade.",
        livesSaved: 0,
        penalty: true,
      };
    }

    let livesSaved = 0;
    if (s === "grave") livesSaved = 1;
    return {
      outcome: "success",
      outcomeLabel: "SUCESSO",
      description: "Ocorrência atendida com sucesso. Procedimentos seguidos e resposta adequada.",
      livesSaved,
      penalty: false,
    };
  }

  // ----------------------------
  // Ações do jogador
  // ----------------------------
  function startShift() {
    try {

    if (state.shiftActive) return;

    state.cityId = el.citySelect ? (el.citySelect.value || getCities()[0]?.id || "br_sp") : "br_sp";
    state.agency = el.agencySelect ? (el.agencySelect.value || "police") : "police";
    state.difficulty = el.difficultySelect ? (el.difficultySelect.value || "normal") : "normal";

    state.shiftActive = true;
    state.timeSec = 0;
    state.score = 0;
    state.queue = [];
    state.activeCall = null;
    state.incidents = [];
    state.focusIncidentUid = null;
    state.pendingDispatchUnitIds = [];
    state.spawnAccumulator = 0;

    state.ui.lastCallUid = null;
    state.ui.lastTranscript = "";

    state.stats = { handled: 0, dispatched: 0, correct: 0, wrong: 0, expired: 0, dismissedTrote: 0, overtime: 0, livesSaved: 0 };

    // Stage 3: reset stress and roll turn conditions
    setStress(0);
    state.conditions.timeOfDay = Math.random() < 0.45 ? "night" : "day";
    // Weather affects atmosphere and slightly increases pressure
    const wR = Math.random();
    state.conditions.weather = wR < 0.65 ? "clear" : wR < 0.90 ? "rain" : "storm";

    // Stage 5: choose a cinematic special event for this shift (if any)
    // (Guarded to avoid hard-crash if a cached build loads without the function.)
    state.specialEvent = (typeof pickSpecialEvent === "function") ? pickSpecialEvent() : null;

    // Ensure unit locks match current career/economy
    updateUnlockedUnitRoles();

    if (el.btnStartShift) el.btnStartShift.disabled = true;
    if (el.btnEndShift) el.btnEndShift.disabled = false;
    if (el.btnStartShift2) el.btnStartShift2.disabled = true;
    if (el.btnEndShift2) el.btnEndShift2.disabled = false;

    renderUnits();

    log(`✅ Turno iniciado em ${flagByCityId(state.cityId)} ${cityNameById(state.cityId)} • Agência: ${state.agency} • Dificuldade: ${state.difficulty}`);
    log(`🌒 Condições: ${state.conditions.timeOfDay === "night" ? "Noite" : "Dia"} • ${state.conditions.weather === "storm" ? "Tempestade" : state.conditions.weather === "rain" ? "Chuva" : "Céu limpo"}`);
    if (state.specialEvent) {
      log(`🎬 Evento especial do turno: ${state.specialEvent.name}`);
    }
    log(`🎓 Carreira: ${state.career.rank} (XP ${state.career.xp}) • Advertências ${state.career.warnings}/3`);
    log(`🧠 Patch: typewriter humano + toque para pular.`);

    spawnCall();
    spawnCall();
    if (state.queue.length === 0) spawnEmergencyFallbackCall();
if (state.queue.length === 0) {
  log("⚠️ Nenhuma chamada entrou na fila. Isso geralmente significa CALLS vazio ou filtro muito restrito.");
  log("🔧 Verifique no console se data/calls.js carregou e se a agência selecionada tem ocorrências.");
}


    if (state.tickInterval) clearInterval(state.tickInterval);
    state.tickInterval = setInterval(tick, 1000);

    renderAll();
  
    } catch (e) {
      console.error(e);
      log(`❌ Falha em startShift: ${e && e.message ? e.message : e}`);
      state.shiftActive = false;
      if (el.btnStartShift) el.btnStartShift.disabled = false;
      if (el.btnEndShift) el.btnEndShift.disabled = true;
    }
}

  function endShift() {
    if (!state.shiftActive) return;

    state.shiftActive = false;
    state.focusIncidentUid = null;
    state.pendingDispatchUnitIds = [];

    if (state.tickInterval) {
      clearInterval(state.tickInterval);
      state.tickInterval = null;
    }

    if (el.btnStartShift) el.btnStartShift.disabled = false;
    if (el.btnEndShift) el.btnEndShift.disabled = true;
    if (el.btnStartShift2) el.btnStartShift2.disabled = false;
    if (el.btnEndShift2) el.btnEndShift2.disabled = true;

    log("🛑 Turno encerrado.");

    // Stage 4: evaluate objectives and award bonus XP at end of shift
    evaluateObjectivesAndAward();
    // Stage 5: economy + campaign progression
    applyEndOfShiftEconomyAndCampaign();
    renderLobbyCareer();
    renderLobbyCampaign();
    renderLobbyEconomy();
    renderLobbyObjectives();
    saveProfile();

    renderAll();
  }

  function spawnEmergencyFallbackCall() {
    const defs = getEligibleCalls();
    if (!defs.length) return;
    const def = defs[Math.floor(Math.random() * defs.length)];
    const call = buildCallFromDef(def);
    if (!call) return;
    state.queue.push(call);
    log(`📡 Fallback de fila acionado: ${call.def.title}`);
  }

  function answerNext() {
    if (!state.shiftActive) {
      log("⚠️ Inicie o turno antes de atender chamadas.");
      return;
    }
    if (state.activeCall) {
      log("⚠️ Já existe uma chamada ativa em atendimento.");
      return;
    }
    if (!state.queue.length) {
      spawnEmergencyFallbackCall();
    }
    if (!state.queue.length) {
      log("⏳ Ainda não há chamada na fila. Aguarde a próxima entrada.");
      renderAll();
      return;
    }

    state.activeCall = state.queue.shift();
    state.activeCall.isIncidentFocus = false;
    state.activeCall.startedAt = state.timeSec;
    state.activeCall.answeredAt = state.timeSec;
    state.focusIncidentUid = null;
    state.pendingDispatchUnitIds = [];
    ensureTranscriptInitialized(state.activeCall);
    state.activeCall.isIncidentFocus = false;
    state.activeCall.startedAt = state.timeSec;
    state.activeCall.answeredAt = state.timeSec;
    state.focusIncidentUid = null;
    state.pendingDispatchUnitIds = [];
    ensureTranscriptInitialized(state.activeCall);
    state.stats.handled += 1;

    state.ui.lastCallUid = null;
    state.ui.lastTranscript = "";

    updateDispatchUnlock();
    log(`📞 Atendeu: "${state.activeCall.def.title}" (${humanSeverity(state.activeCall.severity)})`);

    // Center map on the incident
    setIncidentOnMap(state.activeCall);

    renderUnits();
    renderDynamicQuestions();
    renderActiveCall(false);
    renderAll();
  }

  function holdCall() {
    if (!state.shiftActive || !state.activeCall) return;

    // se estiver digitando, pula
    skipTypewriter(el.callText);

    const call = state.activeCall;
    state.activeCall = null;

    call.queueTTL = clamp(call.queueTTL, 10, 25);
    state.queue.unshift(call);

    state.ui.lastCallUid = null;
    state.ui.lastTranscript = "";
    state.pendingDispatchUnitIds = [];

    log(`⏸️ Chamada em espera e devolvida à fila.`);
    renderAll();
  }

  function dismissCall() {
    if (!state.shiftActive || !state.activeCall) return;

    // se estiver digitando, pula
    skipTypewriter(el.callText);

    const c = state.activeCall;
    const isTrote = (c.severity === "trote") || (c.confidenceTrote >= 6);

    let scoreDelta = 0;
    let xpDelta = 0;

    if (isTrote) {
      scoreDelta = 8;
      xpDelta = 4;
      state.score += scoreDelta;
      state.stats.dismissedTrote += 1;
      addXp(xpDelta);
      log(`✅ Encerrado como trote corretamente. (+${scoreDelta}) XP +${xpDelta}`);
      setReport({
        title: c.def.title,
        severity: c.severity,
        outcomeLabel: "TROTE IDENTIFICADO",
        description: "Você identificou corretamente uma chamada falsa/indevida e evitou gasto de recursos.",
        unitName: "—",
        unitRole: "—",
        scoreDelta,
        xpDelta,
        handleTime: state.timeSec - c.startedAt,
      });
    } else {
      scoreDelta = -10;
      xpDelta = -2;
      state.score += scoreDelta;
      state.stats.wrong += 1;
      addXp(xpDelta);
      addWarning("Encerramento indevido de chamada real.");
      log(`❌ Encerramento indevido. (${scoreDelta}) XP ${xpDelta}`);
      setReport({
        title: c.def.title,
        severity: c.severity,
        outcomeLabel: "ENCERRAMENTO INDEVIDO",
        description: "Você encerrou uma chamada real. Isso é considerado falha grave.",
        unitName: "—",
        unitRole: "—",
        scoreDelta,
        xpDelta,
        handleTime: state.timeSec - c.startedAt,
      });
    }

    state.activeCall = null;
    state.ui.lastCallUid = null;
    state.ui.lastTranscript = "";

    renderAll();
  }

  function addPendingDispatchUnit() {
  if (!state.shiftActive || !state.activeCall) return;
  const canDispatch = (state.activeCall.dispatchUnlocked || state.activeCall.isIncidentFocus);
  if (!canDispatch) return;

  const unitId = el.dispatchUnitSelect ? el.dispatchUnitSelect.value : "";
  if (!unitId) return;

  const unit = state.units.find((u) => u.id === unitId);
  if (!unit || unit.status !== "available" || unit.locked) return;

  if (!Array.isArray(state.pendingDispatchUnitIds)) state.pendingDispatchUnitIds = [];
  if (!state.pendingDispatchUnitIds.includes(unitId)) {
    state.pendingDispatchUnitIds.push(unitId);
    log(`➕ Unidade adicionada ao despacho: ${unit.name}`);
  } else {
    log(`ℹ️ Unidade já selecionada: ${unit.name}`);
  }
  renderDispatchSelectedList();
  setButtons();
}

function dispatchSelectedUnit() {
  if (!state.shiftActive || !state.activeCall) return;

  // se estiver digitando, pula
  skipTypewriter(el.callText);

  const c = state.activeCall;

  const canDispatch = (c.dispatchUnlocked || c.isIncidentFocus);
  if (!canDispatch) {
    log("⛔ Despacho bloqueado: faça as perguntas obrigatórias.");
    return;
  }

  // Build list: pending + current selection (if any)
  const pending = Array.isArray(state.pendingDispatchUnitIds) ? [...state.pendingDispatchUnitIds] : [];
  const selected = el.dispatchUnitSelect ? el.dispatchUnitSelect.value : "";
  if (selected && !pending.includes(selected)) pending.push(selected);

  const unitIds = pending.filter(Boolean);
  if (!unitIds.length) {
    log("⚠️ Selecione uma unidade primeiro (ou adicione ao despacho).");
    return;
  }

  // validate units
  const units = unitIds.map((id) => state.units.find((u) => u.id === id)).filter(Boolean);
  const invalid = units.find((u) => u.status !== "available" || u.locked);
  if (!units.length || invalid) {
    log("⚠️ Há unidade inválida/indisponível ou bloqueada na seleção.");
    return;
  }

  // Reinforcement dispatch for an ongoing incident (no scoring again)
  if (c.isIncidentFocus) {
    const inc = getIncidentByUid(state.focusIncidentUid);
    if (!inc) { log("⚠️ Incidente não encontrado."); return; }

    for (const unit of units) {
      const severityNow = inc.severity || c.severity;
      const eta = computeEtaForUnit(unit, inc.call || c, severityNow);
      const onsceneSec = computeOnsceneSec(severityNow, unit.role);

      unit.status = "enroute";
      unit.move = {
        phase: "enroute",
        remaining: eta,
        target: { lat: inc.call.location.lat, lng: inc.call.location.lng },
        returnEta: Math.max(8, Math.round(eta * 0.75)),
        onsceneSec,
      };
      if (!inc.unitIds.includes(unit.id)) inc.unitIds.push(unit.id);
    }

    upsertIncident(inc);
    state.pendingDispatchUnitIds = [];
    renderDispatchSelectedList();
    log(`🚨 Reforço despachado para "${inc.title}". Unidades: ${units.map((u)=>u.name).join(", ")}`);
    upsertUnitMarkers();
    renderAll();
    return;
  }

  // Normal dispatch from an active call (scores once based on the best-matching unit)
  const def = c.def;
  const severityNow = c.severity;

  const correctRoles = (def.dispatch && Array.isArray(def.dispatch.correctRoles)) ? def.dispatch.correctRoles : ["any"];
  const isTrote = (severityNow === "trote") || (c.confidenceTrote >= 6);

  // Choose the "primary" unit for scoring: prefer one that matches correctRoles
  let primary = units[0];
  const match = units.find((u) => correctRoles.includes("any") || correctRoles.includes(u.role));
  if (match) primary = match;

  state.stats.dispatched += 1;

  if (c.overdue && !c.overduePenalized) {
    c.overduePenalized = true;
    state.stats.overtime += 1;
  }

  const correctRole = !isTrote && (correctRoles.includes(primary.role) || correctRoles.includes("any"));

  // Compute ETA and lateness relative to remaining TTL at dispatch time
  const etaPrimary = computeEtaForUnit(primary, c, severityNow);
  const remaining = Math.max(0, c.callTTL || 0);
  const lateMargin = state.effects && typeof state.effects.lateMarginSec === "number" ? state.effects.lateMarginSec : 0;
  const responseLate = remaining < etaPrimary;
  const responseTooLate = remaining + lateMargin < etaPrimary;

  // Move all selected units on map
  if (c.location) {
    for (const unit of units) {
      const eta = computeEtaForUnit(unit, c, severityNow);
      const onsceneSec = computeOnsceneSec(severityNow, unit.role);
      unit.status = "enroute";
      unit.move = {
        phase: "enroute",
        remaining: eta,
        target: { lat: c.location.lat, lng: c.location.lng },
        returnEta: Math.max(8, Math.round(eta * 0.75)),
        onsceneSec,
      };
    }
    setIncidentOnMap(c);
    upsertUnitMarkers();
  } else {
    // Fallback without geo
    for (const unit of units) {
      unit.status = "busy";
      unit.move = { phase: "onscene", remaining: computeOnsceneSec(severityNow, unit.role), target: unit.pos ? { ...unit.pos } : getCityCenter(state.cityId), returnEta: 12 };
    }
  }

  // Outcome model
  let outcome = computeOutcome({
    isTrote,
    correctRole,
    overdue: c.overdue || responseLate,
    severity: severityNow,
  });

  if (!isTrote && correctRole && responseTooLate) {
    outcome = {
      outcome: "fail",
      outcomeLabel: "CHEGOU TARDE",
      description: "A unidade correta foi mobilizada, porém o tempo de resposta foi insuficiente. Consequências graves.",
      livesSaved: 0,
      penalty: true,
    };
  }

  // Reinforcement bonus (simple): if >1 unit and severity is high, reduce penalty/boost score slightly
  const sevLower = String(severityNow).toLowerCase();
  const hasReinforcement = units.length >= 2;
  const reinfBonus = (hasReinforcement && (sevLower === "grave" || sevLower === "critico")) ? 4 : 0;

  let scoreDelta = 0;
  let xpDelta = 0;

  if (outcome.outcome === "trote") {
    scoreDelta = -12;
    xpDelta = -2;
    state.stats.wrong += 1;
    addWarning("Despacho indevido em trote.");
  } else if (outcome.outcome === "fail") {
    scoreDelta = -12;
    xpDelta = -3;
    state.stats.wrong += 1;
    addWarning("Despacho incorreto (falha operacional).");
    state.career.totalFail += 1;
  } else if (outcome.outcome === "partial") {
    scoreDelta = Math.max(4, severityScore(severityNow) - 10) - 5;
    xpDelta = 3;
    state.stats.correct += 1;
    state.career.totalSuccess += 1;
  } else {
    scoreDelta = severityScore(severityNow);
    xpDelta = severityNow === "grave" ? 8 : 5;
    state.stats.correct += 1;
    state.career.totalSuccess += 1;
  }

  if (outcome.livesSaved > 0) {
    state.career.totalLivesSaved += outcome.livesSaved;
    state.stats.livesSaved += outcome.livesSaved;
    scoreDelta += 6;
    xpDelta += 4;
  }

  // Upgrade scoring on high severity
  if ((sevLower === "grave" || sevLower === "critico") && (outcome.outcome === "success" || outcome.outcome === "partial")) {
    const m = state.effects && typeof state.effects.graveScoreMult === "number" ? state.effects.graveScoreMult : 1.0;
    scoreDelta = Math.round(scoreDelta * m);
  }

  scoreDelta += reinfBonus;

  state.score += scoreDelta;
  addXp(xpDelta);

  // Create and track incident (manager loop)
  const incident = {
    uid: c.uid,
    title: def.title,
    severity: severityNow,
    createdAt: state.timeSec,
    unitIds: units.map((u) => u.id),
    call: c,
    outcome: outcome.outcome,
    outcomeLabel: outcome.outcomeLabel,
    scoreDelta,
    xpDelta,
  };
  upsertIncident(incident);

  if (outcome.outcome === "success") log(`✅ SUCESSO: despacho correto (+${scoreDelta}) XP +${xpDelta}`);
  if (outcome.outcome === "partial") log(`⚠️ ${outcome.outcomeLabel}: (+${scoreDelta}) XP +${xpDelta}`);
  if (outcome.outcome === "fail") log(`❌ FALHA: (${scoreDelta}) XP ${xpDelta}`);
  if (outcome.outcome === "trote") log(`❌ TROTE: despacho indevido (${scoreDelta}) XP ${xpDelta}`);

  setReport({
    title: def.title,
    severity: severityNow,
    outcomeLabel: outcome.outcomeLabel,
    description: outcome.description + ` (ETA: ${fmtTime(etaPrimary)})` + (reinfBonus ? ` (Reforço: +${reinfBonus} pts)` : "") + (outcome.livesSaved ? ` (Vidas salvas: ${outcome.livesSaved})` : ""),
    unitName: primary.name,
    unitRole: primary.role,
    scoreDelta,
    xpDelta,
    handleTime: Math.max(0, (state.timeSec - (c.startedAt || state.timeSec))),
  });

  // Clear active call and selection so player can handle the next one
  state.activeCall = null;
  state.focusIncidentUid = null;
  state.pendingDispatchUnitIds = [];
  state.ui.lastCallUid = null;
  state.ui.lastTranscript = "";

  renderAll();
}

function computeEtaForUnit(unit, call, severityNow) {
  const ROLE_ETA_BASE = {
    area_patrol: 24,
    civil_investigation: 32,
    tactical_rota: 34,
    shock_riot: 36,
    air_eagle: 18,
    bomb_gate: 40,
    fire_engine: 28,
    ladder_truck: 34,
    fire_rescue: 26,
    medic_ambulance: 22,
    hazmat: 42,
  };
  const etaBase = ROLE_ETA_BASE[unit.role] || 28;
  const etaMult = state.effects && typeof state.effects.etaMult === "number" ? state.effects.etaMult : 1.0;
  const etaRand = Math.floor(Math.random() * 7); // 0..6
  return Math.max(8, Math.round(etaBase * etaMult) + etaRand);
}

// ----------------------------
  // Tick
  // ----------------------------
  function tick() {
    if (!state.shiftActive) return;

    state.timeSec += 1;

    // Stage 7B: update moving units on the map
    updateUnitMovementTick();

    const hasActive = !!state.activeCall;
    const pauseQueue = state.pauseQueueWhileActiveCall && hasActive;

    if (!pauseQueue) {
      for (let i = state.queue.length - 1; i >= 0; i--) {
        const c = state.queue[i];
        c.queueTTL -= 1;
        if (c.queueTTL <= 0) {
          state.queue.splice(i, 1);
          state.stats.expired += 1;
          state.score -= 10;
          addXp(-1);
          addWarning("Falha em atender chamada na fila (expirada).");
          log(`⏳ Expirou na fila: "${c.def.title}" (-10)`);
          setReport({
            title: c.def.title,
            severity: c.severity,
            outcomeLabel: "EXPIRADA NA FILA",
            description: "A ocorrência ficou sem atendimento e expirou. Isso é falha grave.",
            unitName: "—",
            unitRole: "—",
            scoreDelta: -10,
            xpDelta: -1,
            handleTime: 0,
          });
        }
      }
    }

    if (hasActive && !state.activeCall.isIncidentFocus) {
      // Stage 3: stress builds while handling an active call (pressure is higher on grave/critico)
      const pressure = severityToPressure(state.activeCall.severity);
      const weatherBoost = state.conditions.weather === "storm" ? 0.10 : state.conditions.weather === "rain" ? 0.05 : 0.0;
      const eventBoost = state.specialEvent && typeof state.specialEvent.stressBoost === "number" ? state.specialEvent.stressBoost : 0.0;
      const stressMult = state.effects && typeof state.effects.stressRateMult === "number" ? state.effects.stressRateMult : 1.0;
      addStress(((0.14 * pressure) + weatherBoost + eventBoost) * stressMult);

      // Worsen timer: escalates severity once
      if (state.activeCall.worsenTTL !== null && !state.activeCall.worsened) {
        state.activeCall.worsenTTL -= 1;
        if (state.activeCall.worsenTTL <= 0) {
          state.activeCall.worsenTTL = 0;
          worsenActiveCall("tempo");
        }
      }

      // Fail timer
      state.activeCall.callTTL -= 1;
      if (state.activeCall.callTTL <= 0) {
        state.activeCall.callTTL = 0;
        state.activeCall.overdue = true;
        // Auto-fail when time runs out (realistic pressure)
        failActiveCall("tempo esgotado");
        return; // renderAll already called inside failActiveCall
      }
      updateDispatchUnlock();
    }

    const interval = spawnIntervalByDifficulty(state.difficulty);
    state.spawnAccumulator += 1;
    if (state.spawnAccumulator >= interval) {
      state.spawnAccumulator = 0;
      if (state.queue.length < state.maxQueue) spawnCall();
    }

    renderAll();
  }

  // ----------------------------
  // Render geral
  // ----------------------------
  function renderAll() {
    updateHud();
    updatePills();
    renderQueue();
    renderIncidents();
    renderDispatchSelectedList();
    renderUnits();
    setButtons();
    renderActiveCall(false);
    renderDynamicQuestions();
    renderSummary();

    if (rp.career && !state.lastReport) {
      rp.career.innerHTML = `
        <div class="pill">Rank: ${escapeHtml(state.career.rank)}</div>
        <div class="pill">XP: ${state.career.xp}</div>
        <div class="pill">Advertências: ${state.career.warnings}/3</div>
        <div class="pill">Sucessos: ${state.career.totalSuccess}</div>
        <div class="pill">Falhas: ${state.career.totalFail}</div>
        <div class="pill">Vidas salvas: ${state.career.totalLivesSaved}</div>
      `;
    }
  }

  // ----------------------------
  // Bind UI
  // ----------------------------
  function bind() {
    // Global top navigation (always visible)
    if (el.btnNavSetup) el.btnNavSetup.addEventListener("click", () => setScreen("setup"));
    if (el.btnNavLobby) el.btnNavLobby.addEventListener("click", () => setScreen("lobby"));
    if (el.btnNavShift) el.btnNavShift.addEventListener("click", () => setScreen("shift"));

    // Screen navigation
    if (el.btnToLobby) {
      el.btnToLobby.addEventListener("click", () => {
        // Persist current selections before moving on
        try {
          if (el.citySelect) state.cityId = el.citySelect.value;
          if (el.agencySelect) state.agency = el.agencySelect.value || "police";
          if (el.difficultySelect) state.difficulty = el.difficultySelect.value || "normal";

          if (document && document.body) {
            document.body.dataset.agency = state.agency || "police";
          }

          // If data isn't ready yet, show a helpful message instead of doing nothing.
          if (typeof verifyDataLoaded === "function" && !verifyDataLoaded()) {
            log("⏳ Dados ainda carregando... tente novamente em 1 segundo.");
            return;
          }

          // Stage 4: generate objectives for the next shift and persist settings
          if (typeof generateShiftObjectives === "function") generateShiftObjectives();
          if (typeof saveProfile === "function") saveProfile();

          if (typeof renderUnits === "function") renderUnits();
          if (typeof refreshLobbySummary === "function") refreshLobbySummary();
        } catch (err) {
          console.error("❌ Erro ao avançar para o Lobby:", err);
          try { log("❌ Erro ao avançar para o Lobby: " + (err && err.message ? err.message : err)); } catch {}
        } finally {
          // Never trap the player on Setup: always switch to Lobby.
          try { setScreen("lobby"); } catch {}
          try {
            if (typeof renderLobbyCareer === "function") renderLobbyCareer();
            if (typeof renderLobbyCampaign === "function") renderLobbyCampaign();
            if (typeof renderLobbyEconomy === "function") renderLobbyEconomy();
            if (typeof renderLobbyObjectives === "function") renderLobbyObjectives();
            if (typeof renderAll === "function") renderAll();
          } catch (err2) {
            console.error("❌ Erro ao renderizar Lobby:", err2);
          }
        }
      });
    }

    // Stage 4: reset career
    if (lobby.btnReset) {
      lobby.btnReset.addEventListener("click", () => {
        if (state.shiftActive) {
          log("⚠️ Encerre o turno antes de resetar a carreira.");
          return;
        }
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        const p = defaultProfile();
        state.career = p.career;
        state.progress = p.progress;
        state.agency = ["police", "fire", "ambulance"].includes(p.settings.agency) ? p.settings.agency : "police";
        state.difficulty = p.settings.difficulty;
        state.cityId = p.settings.cityId;
        if (el.agencySelect) el.agencySelect.value = state.agency;
        if (el.difficultySelect) el.difficultySelect.value = state.difficulty;
        populateCities();
        if (document && document.body) document.body.dataset.agency = state.agency || "police";
        generateShiftObjectives();
        saveProfile();
        refreshLobbySummary();
        renderLobbyCareer();
        renderLobbyCampaign();
        renderLobbyEconomy();
        renderLobbyObjectives();
        renderUnits();
        renderAll();
        log("🧹 Carreira resetada.");
      });
    }

    // Stage 5: reset week/economy (keep career)
    if (lobby.btnResetWeek) {
      lobby.btnResetWeek.addEventListener("click", () => {
        if (state.shiftActive) {
          log("⚠️ Encerre o turno antes de resetar a semana.");
          return;
        }
        resetWeekOnly();
        renderAll();
      });
    }

    if (el.btnBackSetup) {
      el.btnBackSetup.addEventListener("click", () => {
        if (state.shiftActive) {
          log("⚠️ Encerre o turno antes de voltar para a configuração.");
          return;
        }
        setScreen("setup");
      });
    }

    if (el.btnToShift) {
      el.btnToShift.addEventListener("click", () => {
        refreshLobbySummary();
        setScreen("shift");
        // Keep objectives visible in lobby, but also reflect them in the shift summary area
        renderAll();
      });
    }

    if (el.btnBackLobby) {
      el.btnBackLobby.addEventListener("click", () => {
        if (state.shiftActive) {
          log("⚠️ Turno em andamento. Encerre o turno para retornar ao lobby.");
          return;
        }
        refreshLobbySummary();
        setScreen("lobby");
        renderLobbyCareer();
        renderLobbyCampaign();
        renderLobbyEconomy();
        renderLobbyObjectives();
      });
    }

    if (el.citySelect) {
      el.citySelect.addEventListener("change", () => {
        state.cityId = el.citySelect.value;
        log(`🏙️ Cidade: ${flagByCityId(state.cityId)} ${cityNameById(state.cityId)}`);
        saveProfile();
        renderUnits();
        refreshLobbySummary();
        renderLobbyUpgrades();
        renderAll();
      });
    }

    if (el.agencySelect) {
      el.agencySelect.addEventListener("change", () => {
        // Update current agency in state and propagate to UI theme via data attribute
        state.agency = el.agencySelect.value;
        // Set a data-agency attribute on <body> for CSS theming; defaults to police if missing
        if (document && document.body) {
          document.body.dataset.agency = state.agency || "police";
        }
        log(`🏛️ Agência: ${state.agency}`);
        saveProfile();
        renderUnits();
        refreshLobbySummary();
        renderAll();
      });
    }

    if (el.difficultySelect) {
      el.difficultySelect.addEventListener("change", () => {
        state.difficulty = el.difficultySelect.value;
        log(`⚙️ Dificuldade: ${state.difficulty}`);
        saveProfile();
      });
    }

    if (el.btnStartShift) el.btnStartShift.addEventListener("click", startShift);
    if (el.btnEndShift) el.btnEndShift.addEventListener("click", endShift);
    // Fix Stage 8B: secondary shift controls must mirror the primary controls
    if (el.btnStartShift2) el.btnStartShift2.addEventListener("click", startShift);
    if (el.btnEndShift2) el.btnEndShift2.addEventListener("click", endShift);

    if (el.btnAnswer) el.btnAnswer.addEventListener("click", answerNext);
    if (el.btnHold) el.btnHold.addEventListener("click", holdCall);

    if (el.btnAddUnit) el.btnAddUnit.addEventListener("click", addPendingDispatchUnit);
    if (el.btnDispatch) el.btnDispatch.addEventListener("click", dispatchSelectedUnit);
    if (el.btnDismiss) el.btnDismiss.addEventListener("click", dismissCall);
    if (el.dispatchUnitSelect) el.dispatchUnitSelect.addEventListener("change", () => setButtons());

    // ✅ NOVO: tocar no texto da chamada "pula" o typewriter e mostra tudo
    if (el.callText) {
      el.callText.style.cursor = "pointer";
      el.callText.addEventListener("click", () => skipTypewriter(el.callText));
      el.callText.addEventListener("touchstart", () => skipTypewriter(el.callText), { passive: true });
    }
  }

  // ----------------------------
  // Init
  // ----------------------------
  function init() {
    bindDynamicUI();

    // Show build info in header (helps verify updates on GitHub Pages/Vercel)
    const buildEl = document.getElementById("buildInfo");
    if (buildEl) buildEl.textContent = BUILD_TEXT;
    const projectStatusEl = document.getElementById("projectStatus");
    if (projectStatusEl) {
      projectStatusEl.innerHTML = `<b>Versão:</b> ${BUILD.version} • <b>Stage:</b> ${BUILD.stage}<br><b>Build:</b> ${BUILD.builtAt}<br><b>Conclusão estimada:</b> ${PROJECT.completion}%<br><b>Foco:</b> ${PROJECT.focus}`;
    }

    // Load optional content packs and DLC packs (non-blocking)
    tryLoadContentPacks();
    tryLoadDlcPacks();

    // Stage 4: load saved profile (career + unlocks + last settings)
    const p = loadProfile();
    state.career = p.career;
    state.progress = p.progress;
    state.campaign = p.campaign || defaultProfile().campaign;
    state.economy = p.economy || defaultProfile().economy;
    state.upgrades = p.upgrades || defaultProfile().upgrades;
    if (!Array.isArray(state.upgrades.owned)) state.upgrades.owned = [];
    if (typeof state.upgrades.spent !== "number") state.upgrades.spent = 0;
    state.agency = ["police", "fire", "ambulance"].includes(p.settings.agency) ? p.settings.agency : "police";
    state.difficulty = p.settings.difficulty;
    state.cityId = p.settings.cityId;

    populateCities();
    if (el.agencySelect) el.agencySelect.value = state.agency || "police";
    if (el.difficultySelect) el.difficultySelect.value = state.difficulty || "normal";
    if (el.citySelect) el.citySelect.value = state.cityId;

    if (el.btnEndShift) el.btnEndShift.disabled = true;

    // Ensure body has the correct agency data attribute at startup for theming
    if (document && document.body) {
      document.body.dataset.agency = state.agency || "police";
    }

    // Stage 3: init stress visuals
    setStress(state.stress);

    // Start in Setup screen (mobile-first flow)
    refreshLobbySummary();
    setScreen("setup");

    // Stage 4: prepare objectives for the next shift and show career panel in lobby
    generateShiftObjectives();
    renderLobbyCareer();
    renderLobbyCampaign();
    renderLobbyEconomy();
    computeUpgradeEffects();
    renderLobbyUpgrades();
    renderLobbyObjectives();
    saveProfile();

    renderUnits();
    renderAll();

    log("✅ Sistema pronto. Configure e avance para o lobby.");
    log("✅ Typewriter: mais humano + toque para pular.");
  }


// ----------------------------
// Robust error surfacing (avoid silent failures on mobile/GitHub Pages)
// ----------------------------
window.addEventListener("error", (ev) => {
  try {
    const msg = (ev && (ev.message || ev.error?.message)) ? (ev.message || ev.error?.message) : String(ev);
    log(`❌ Erro: ${msg}`);
  } catch {}
});
window.addEventListener("unhandledrejection", (ev) => {
  try {
    const msg = ev && ev.reason ? (ev.reason.message || String(ev.reason)) : "Promise rejection";
    log(`❌ Erro: ${msg}`);
  } catch {}
});

  window.__LCDO = { state };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      init();
      bind();
    } catch (e) {
      console.error(e);
      log("❌ Erro ao iniciar (veja console).");
    }
  });
})();