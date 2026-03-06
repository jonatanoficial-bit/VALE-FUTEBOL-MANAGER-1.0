// ===== Helpers =====
const $ = (id) => document.getElementById(id);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function formatTime(sec){
  sec = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(sec/60)).padStart(2,"0");
  const s = String(sec%60).padStart(2,"0");
  return `${m}:${s}`;
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// typewriter com cancelamento
let typingToken = 0;
async function typeWriter(el, text, speedMs){
  const token = ++typingToken;
  el.textContent = "";
  for(let i=0;i<text.length;i++){
    if(token !== typingToken) return;
    el.textContent += text[i];
    await sleep(speedMs);
  }
}

function logLine(msg){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");
  const line = `[${hh}:${mm}:${ss}] ${msg}\n`;
  const logEl = $("log");
  if(logEl) logEl.textContent = line + logEl.textContent;
}

// ===== Data load check =====
function verifyDataLoaded(){
  if(!window.CITIES){
    logLine("❌ ERRO: data/cities.js não carregou. Confirme se a pasta 'data' existe e o arquivo é 'cities.js' (minúsculo).");
    return false;
  }
  if(!window.CALLS){
    logLine("❌ ERRO: data/calls.js não carregou. Confirme se a pasta 'data' existe e o arquivo é 'calls.js' (minúsculo).");
    return false;
  }
  if(!Array.isArray(window.CITIES) || window.CITIES.length === 0){
    logLine("❌ ERRO: CITIES vazio. Verifique o conteúdo do cities.js.");
    return false;
  }
  if(!Array.isArray(window.CALLS) || window.CALLS.length === 0){
    logLine("❌ ERRO: CALLS vazio. Verifique o conteúdo do calls.js.");
    return false;
  }
  return true;
}

// ===== State =====
const state = {
  running: false,
  cityId: null,
  agency: "police",
  difficulty: "normal",

  shiftSeconds: 0,
  shiftDuration: 240, // 4 min (fase 1)
  spawnTimer: 0,

  queue: [], // {call, createdAt, ttl}
  current: null,
  currentTTL: 0,

  score: 0,
  stats: {
    handled: 0,
    correct: 0,
    wrong: 0,
    pranks: 0,
    expired: 0
  },

  units: [],
};

// ===== UI =====
const ui = {
  citySelect: $("citySelect"),
  agencySelect: $("agencySelect"),
  difficultySelect: $("difficultySelect"),
  btnStart: $("btnStartShift"),
  btnEnd: $("btnEndShift"),

  hudShift: $("hudShift"),
  hudTime: $("hudTime"),
  hudScore: $("hudScore"),
  hudQueue: $("hudQueue"),

  pillStatus: $("pillStatus"),
  pillCallTimer: $("pillCallTimer"),

  unitsList: $("unitsList"),
  queueList: $("queueList"),

  callMeta: $("callMeta"),
  callText: $("callText"),
  btnAnswer: $("btnAnswer"),
  btnHold: $("btnHold"),

  dispatchInfo: $("dispatchInfo"),
  dispatchUnitSelect: $("dispatchUnitSelect"),
  btnDispatch: $("btnDispatch"),
  btnDismiss: $("btnDismiss"),

  shiftSummary: $("shiftSummary"),
};

// ===== Cities =====
function populateCities(){
  ui.citySelect.innerHTML = "";
  for(const c of window.CITIES){
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    ui.citySelect.appendChild(opt);
  }
  ui.citySelect.value = window.CITIES[0]?.id || "";
}

function getCity(){
  return window.CITIES.find(c => c.id === state.cityId) || window.CITIES[0];
}

// ===== Units =====
function rebuildUnits(){
  const city = getCity();
  const list = (city.units && city.units[state.agency]) ? city.units[state.agency] : [];

  state.units = list.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    status: "Disponível"
  }));

  renderUnits();
  rebuildDispatchSelect();
}

function renderUnits(){
  ui.unitsList.innerHTML = "";
  if(state.units.length === 0){
    ui.unitsList.innerHTML = `<div class="hint">Nenhuma unidade configurada para esta cidade/agência.</div>`;
    return;
  }

  state.units.forEach(u => {
    const div = document.createElement("div");
    div.className = "unitRow";
    div.innerHTML = `
      <div class="unitName">${u.name}</div>
      <div class="unitRole">${u.role}</div>
      <div class="unitState">Status: <b>${u.status}</b></div>
    `;
    ui.unitsList.appendChild(div);
  });
}

function rebuildDispatchSelect(){
  ui.dispatchUnitSelect.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Selecione a unidade";
  ui.dispatchUnitSelect.appendChild(opt0);

  state.units.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    ui.dispatchUnitSelect.appendChild(opt);
  });
}

// ===== Difficulty =====
function difficultyParams(diff){
  if(diff === "easy"){
    return { spawnBase: 18, callTTL: 36, typeSpeed: 20, scoreMult: 0.9 };
  }
  if(diff === "hard"){
    return { spawnBase: 10, callTTL: 22, typeSpeed: 12, scoreMult: 1.2 };
  }
  return { spawnBase: 14, callTTL: 28, typeSpeed: 16, scoreMult: 1.0 };
}

function severityClass(sev){
  if(sev === "leve") return "leve";
  if(sev === "medio") return "medio";
  if(sev === "grave") return "grave";
  return "trote";
}

// ===== Calls =====
function pickCall(){
  const progress = state.shiftSeconds / state.shiftDuration;

  // mais trote no começo, mais grave no final
  const weights = {
    trote: clamp(0.30 - progress*0.15, 0.12, 0.30),
    leve:  clamp(0.35 - progress*0.10, 0.15, 0.35),
    medio: clamp(0.25 + progress*0.05, 0.20, 0.35),
    grave: clamp(0.10 + progress*0.20, 0.12, 0.45),
  };

  const scored = window.CALLS.map(call => {
    const w = weights[call.severity] ?? 0.2;
    return { call, w };
  });

  const sum = scored.reduce((a,b)=>a+b.w,0) || 1;
  let r = Math.random() * sum;
  for(const it of scored){
    r -= it.w;
    if(r <= 0) return it.call;
  }
  return scored[0]?.call || window.CALLS[0];
}

function enqueueCall(){
  const params = difficultyParams(state.difficulty);
  const call = pickCall();
  const ttl = params.callTTL;

  state.queue.push({ call, createdAt: state.shiftSeconds, ttl });
  logLine(`📥 Nova chamada: "${call.title}" (${call.severity.toUpperCase()})`);
  renderQueue();
}

function renderQueue(){
  ui.hudQueue.textContent = String(state.queue.length);

  if(state.queue.length === 0){
    ui.queueList.textContent = "—";
    return;
  }

  ui.queueList.innerHTML = "";
  state.queue.slice(0,6).forEach((q, idx) => {
    const age = state.shiftSeconds - q.createdAt;
    const remain = Math.max(0, q.ttl - age);

    const div = document.createElement("div");
    div.className = "queueItem";
    div.innerHTML = `
      <div class="queueLeft">
        <div class="queueTitle">${idx+1}. ${q.call.title}</div>
        <div class="queueSub">Restante: ${formatTime(remain)} • Tipo: ${q.call.severity}</div>
      </div>
      <div class="badge ${severityClass(q.call.severity)}">${q.call.severity.toUpperCase()}</div>
    `;
    ui.queueList.appendChild(div);
  });
}

function setCurrentFromQueue(){
  if(state.current) return;
  const next = state.queue.shift();
  if(!next) return;

  state.current = next.call;
  state.currentTTL = next.ttl;

  updateCurrentUI(true);
  renderQueue();
}

function updateCurrentUI(newCall){
  const city = getCity();
  const greet = (state.agency === "police") ? city.greetingPolice : city.greetingFire;

  if(!state.current){
    ui.callMeta.textContent = "—";
    ui.dispatchInfo.textContent = "—";
    ui.pillCallTimer.textContent = "Sem chamada";
    ui.callText.textContent = "Aguardando chamadas...";
    ui.dispatchUnitSelect.value = "";
    ui.dispatchUnitSelect.disabled = true;
    ui.btnDispatch.disabled = true;
    ui.btnDismiss.disabled = true;
    ui.btnHold.disabled = true;
    return;
  }

  const sev = state.current.severity;
  ui.callMeta.textContent = `Linha: ${greet} • Caso: ${state.current.title} • Gravidade: ${sev.toUpperCase()}`;
  ui.dispatchInfo.textContent = `Selecione a unidade adequada para "${state.current.title}" (${sev.toUpperCase()})`;

  ui.dispatchUnitSelect.disabled = false;
  ui.btnDispatch.disabled = false;
  ui.btnDismiss.disabled = false;
  ui.btnHold.disabled = false;

  if(newCall){
    const params = difficultyParams(state.difficulty);
    const fullText = `${greet}\n\nChamador: ${state.current.text}`;
    typeWriter(ui.callText, fullText, params.typeSpeed);
  }
}

// ===== Score =====
function addScore(delta){
  state.score += delta;
  ui.hudScore.textContent = String(state.score);
}

function resolveCall(unitId, action){
  if(!state.current) return;

  const params = difficultyParams(state.difficulty);
  const mult = params.scoreMult;

  const call = state.current;
  const city = getCity();
  const cityUnits = new Set((city.units[state.agency] || []).map(u => u.id));
  const recommended = (call.recommended?.[state.agency] || []).filter(id => cityUnits.has(id));
  const isPrank = call.severity === "trote";

  let delta = 0;
  let resultText = "";

  if(action === "dismiss"){
    if(isPrank){
      delta = Math.floor(20 * mult);
      state.stats.pranks++;
      state.stats.correct++;
      resultText = `✅ Trote identificado e encerrado. +${delta} pts`;
    } else {
      delta = -Math.floor(35 * mult);
      state.stats.wrong++;
      resultText = `❌ Encerrado sem despacho em caso REAL. ${delta} pts`;
    }
  } else {
    if(isPrank){
      delta = -Math.floor(30 * mult);
      state.stats.wrong++;
      state.stats.pranks++;
      resultText = `⚠️ Era trote. Recursos desperdiçados. ${delta} pts`;
    } else {
      const ok = recommended.includes(unitId) || (recommended.length === 0 && !!unitId);
      if(ok){
        const base = (call.severity === "leve") ? 18 : (call.severity === "medio" ? 28 : 45);
        delta = Math.floor(base * mult);
        state.stats.correct++;
        resultText = `✅ Unidade adequada enviada. +${delta} pts`;
      } else {
        const base = (call.severity === "leve") ? 18 : (call.severity === "medio" ? 28 : 55);
        delta = -Math.floor(base * mult);
        state.stats.wrong++;
        resultText = `❌ Unidade inadequada. ${delta} pts`;
      }
    }
  }

  state.stats.handled++;
  addScore(delta);
  logLine(resultText + ` (Caso: ${call.title})`);

  state.current = null;
  state.currentTTL = 0;
  ui.dispatchUnitSelect.value = "";

  updateCurrentUI(false);
  renderQueue();
  updateSummary();
}

// ===== Shift Loop =====
let interval = null;

function updateHUD(){
  ui.hudShift.textContent = state.running ? "ATIVO" : "—";
  ui.hudTime.textContent = formatTime(state.shiftSeconds);
  ui.hudQueue.textContent = String(state.queue.length);
}

function updateSummary(){
  if(!state.running && state.shiftSeconds === 0){
    ui.shiftSummary.textContent = "Nenhum turno ativo.";
    return;
  }

  ui.shiftSummary.innerHTML =
`<b>Resumo:</b><br>
• Chamadas atendidas: <b>${state.stats.handled}</b><br>
• Acertos: <b>${state.stats.correct}</b><br>
• Erros: <b>${state.stats.wrong}</b><br>
• Trotes: <b>${state.stats.pranks}</b><br>
• Expiradas: <b>${state.stats.expired}</b><br>
• Pontuação: <b>${state.score}</b>`;
}

function tick(){
  if(!state.running) return;

  state.shiftSeconds++;
  updateHUD();

  const params = difficultyParams(state.difficulty);

  // spawn
  state.spawnTimer++;
  if(state.spawnTimer >= params.spawnBase){
    state.spawnTimer = 0;
    enqueueCall();
    const extraChance = (state.difficulty === "hard") ? 0.35 : 0.15;
    if(Math.random() < extraChance) enqueueCall();
  }

  // expira fila
  const before = state.queue.length;
  state.queue = state.queue.filter(q => {
    const age = state.shiftSeconds - q.createdAt;
    const remain = q.ttl - age;
    if(remain <= 0){
      state.stats.expired++;
      logLine(`⛔ Chamada expirou na fila: "${q.call.title}" (-10 pts)`);
      addScore(-10);
      return false;
    }
    return true;
  });
  if(before !== state.queue.length) renderQueue();

  // TTL call atual
  if(state.current){
    state.currentTTL--;
    ui.pillCallTimer.textContent = `Tempo da chamada: ${formatTime(state.currentTTL)}`;
    if(state.currentTTL <= 0){
      logLine(`⛔ Você demorou demais. Chamada perdida: "${state.current.title}" (-20 pts)`);
      state.stats.expired++;
      addScore(-20);
      state.current = null;
      state.currentTTL = 0;
      updateCurrentUI(false);
    }
  } else {
    ui.pillCallTimer.textContent = "Sem chamada";
  }

  // botão atender
  ui.btnAnswer.disabled = !(state.running && !state.current && state.queue.length > 0);

  // fim do turno
  if(state.shiftSeconds >= state.shiftDuration){
    endShift();
  }
}

function startShift(){
  if(state.running) return;

  state.cityId = ui.citySelect.value;
  state.agency = ui.agencySelect.value;
  state.difficulty = ui.difficultySelect.value;

  state.running = true;
  state.shiftSeconds = 0;
  state.spawnTimer = 0;
  state.queue = [];
  state.current = null;
  state.currentTTL = 0;
  state.score = 0;
  state.stats = { handled:0, correct:0, wrong:0, pranks:0, expired:0 };

  ui.btnStart.disabled = true;
  ui.btnEnd.disabled = false;
  ui.citySelect.disabled = true;
  ui.agencySelect.disabled = true;
  ui.difficultySelect.disabled = true;

  ui.pillStatus.textContent = "Turno em andamento";
  ui.pillCallTimer.textContent = "Sem chamada";

  rebuildUnits();
  updateHUD();
  updateSummary();

  logLine(`✅ Turno iniciado em ${getCity().name} • Agência: ${state.agency} • Dificuldade: ${state.difficulty}`);

  enqueueCall();
  enqueueCall();
  renderQueue();
  updateCurrentUI(false);

  ui.btnAnswer.disabled = false;

  if(interval) clearInterval(interval);
  interval = setInterval(tick, 1000);
}

function endShift(){
  if(!state.running) return;

  state.running = false;

  ui.btnStart.disabled = false;
  ui.btnEnd.disabled = true;
  ui.citySelect.disabled = false;
  ui.agencySelect.disabled = false;
  ui.difficultySelect.disabled = false;

  ui.btnAnswer.disabled = true;
  ui.btnHold.disabled = true;
  ui.btnDispatch.disabled = true;
  ui.btnDismiss.disabled = true;
  ui.dispatchUnitSelect.disabled = true;

  ui.pillStatus.textContent = "Turno finalizado";
  ui.pillCallTimer.textContent = "—";

  logLine(`🏁 Turno encerrado. Pontuação final: ${state.score}`);
  updateSummary();

  if(interval){
    clearInterval(interval);
    interval = null;
  }
}

// ===== Actions =====
function answerNext(){
  if(!state.running) return;
  if(state.current) return;
  if(state.queue.length === 0) return;

  setCurrentFromQueue();
  ui.btnAnswer.disabled = true;
}

function holdCall(){
  if(!state.running) return;
  if(!state.current) return;

  const call = state.current;
  const ttlBack = Math.max(10, state.currentTTL - 6);
  state.queue.unshift({ call, createdAt: state.shiftSeconds, ttl: ttlBack });

  logLine(`⏸ Chamada em espera: "${call.title}" (tempo reduzido)`);
  state.current = null;
  state.currentTTL = 0;

  updateCurrentUI(false);
  renderQueue();

  ui.btnAnswer.disabled = !(state.queue.length === 0);
}

function dispatchSelected(){
  if(!state.running) return;
  if(!state.current) return;

  const unitId = ui.dispatchUnitSelect.value;
  if(!unitId){
    alert("Selecione uma unidade antes de despachar.");
    return;
  }
  resolveCall(unitId, "dispatch");
  ui.btnAnswer.disabled = !(state.queue.length > 0);
}

function dismissCall(){
  if(!state.running) return;
  if(!state.current) return;

  resolveCall("", "dismiss");
  ui.btnAnswer.disabled = !(state.queue.length > 0);
}

// ===== Bind UI =====
function bindUI(){
  ui.btnStart.addEventListener("click", startShift);
  ui.btnEnd.addEventListener("click", endShift);

  ui.citySelect.addEventListener("change", () => {
    state.cityId = ui.citySelect.value;
    rebuildUnits();
  });

  ui.agencySelect.addEventListener("change", () => {
    state.agency = ui.agencySelect.value;
    rebuildUnits();
  });

  ui.btnAnswer.addEventListener("click", answerNext);
  ui.btnHold.addEventListener("click", holdCall);
  ui.btnDispatch.addEventListener("click", dispatchSelected);
  ui.btnDismiss.addEventListener("click", dismissCall);
}

// ===== Init =====
function init(){
  logLine("Inicializando...");

  const ok = verifyDataLoaded();
  if(!ok){
    ui.callText.textContent = "ERRO: arquivos data/cities.js ou data/calls.js não carregaram. Veja o REGISTRO.";
    return;
  }

  populateCities();

  state.cityId = ui.citySelect.value;
  state.agency = ui.agencySelect.value;
  state.difficulty = ui.difficultySelect.value;

  rebuildUnits();
  renderQueue();
  updateHUD();
  updateSummary();

  ui.btnAnswer.disabled = true;
  ui.btnHold.disabled = true;
  ui.btnDispatch.disabled = true;
  ui.btnDismiss.disabled = true;
  ui.dispatchUnitSelect.disabled = true;

  logLine("✅ Sistema pronto. Clique em INICIAR TURNO.");
}

bindUI();
init();