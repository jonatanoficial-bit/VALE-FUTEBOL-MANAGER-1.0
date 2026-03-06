import { fmtTime } from './utils.js';

export class UIManager{
  constructor(state, audio){
    this.state = state;
    this.audio = audio;

    this.els = {
      citySelect: document.getElementById('citySelect'),
      turnTime: document.getElementById('turnTime'),
      score: document.getElementById('score'),
      pauseBtn: document.getElementById('pauseBtn'),

      riskBadge: document.getElementById('riskBadge'),
      callTimerBadge: document.getElementById('callTimerBadge'),
      callTranscript: document.getElementById('callTranscript'),
      fieldAddress: document.getElementById('fieldAddress'),
      fieldDetails: document.getElementById('fieldDetails'),
      fieldVictims: document.getElementById('fieldVictims'),
      callActions: document.getElementById('callActions'),
      holdBtn: document.getElementById('holdBtn'),
      endCallBtn: document.getElementById('endCallBtn'),

      queueCount: document.getElementById('queueCount'),
      queue: document.getElementById('queue'),
      answerBtn: document.getElementById('answerBtn'),

      startBtn: document.getElementById('startBtn'),
      resetBtn: document.getElementById('resetBtn'),

      incidentBadge: document.getElementById('incidentBadge'),
      unitDock: document.getElementById('unitDock'),
      hint: document.getElementById('hint'),
    };

    this._typeToken = 0;
  }

  bindHandlers(handlers){
    this.els.pauseBtn.onclick = handlers.onTogglePause;
    this.els.startBtn.onclick = handlers.onStart;
    this.els.resetBtn.onclick = handlers.onReset;
    this.els.answerBtn.onclick = handlers.onAnswerSelected;
    this.els.holdBtn.onclick = handlers.onHold;
    this.els.endCallBtn.onclick = handlers.onEndCall;
  }

  setHint(text){
    this.els.hint.textContent = text;
  }

  renderTop(){
    if (this.els.citySelect && this.els.citySelect.selectedOptions.length){
      // keep select label handled elsewhere
    }
    this.els.turnTime.textContent = fmtTime(this.state.turnRemaining);
    this.els.score.textContent = String(this.state.score);
    this.els.pauseBtn.textContent = this.state.paused ? 'Retomar' : 'Pausar';
  }

  // -----------------
  // Active call
  // -----------------
  clearActiveCall(){
    this._typeToken++;
    this.els.riskBadge.textContent = 'Risco: —';
    this.els.callTimerBadge.textContent = 'Tempo: —';
    this.els.callTranscript.textContent = '';
    this.els.fieldAddress.textContent = '—';
    this.els.fieldDetails.textContent = '—';
    this.els.fieldVictims.textContent = '—';
    this.els.callActions.innerHTML = '';
  }

  renderActiveCall(call){
    this._typeToken++;
    const token = this._typeToken;

    if (!call){
      this.clearActiveCall();
      return;
    }

    this.els.riskBadge.textContent = `Risco ${call.severity.toUpperCase()}`;
    this.els.callTimerBadge.textContent = `Tempo ${fmtTime(call.remaining)}`;

    this.els.callTranscript.textContent = '';
    this.typewriterAppend(`📞 ${call.opening}`, 26, token);

    this.renderCallFields(call);
    this.renderCallActions(call);
  }

  updateCallTimer(call){
    if (!call) {
      this.els.callTimerBadge.textContent = 'Tempo: —';
      return;
    }
    this.els.callTimerBadge.textContent = `Tempo ${fmtTime(call.remaining)}`;
  }

  renderCallFields(call){
    // ✅ CORREÇÃO PRINCIPAL: sempre refletir o objeto call.collected
    const c = call?.collected ?? {};
    this.els.fieldAddress.textContent = c.address && c.address.trim() ? c.address : '—';
    this.els.fieldDetails.textContent = c.details && c.details.trim() ? c.details : '—';
    this.els.fieldVictims.textContent = c.victims && c.victims.trim() ? c.victims : '—';
  }

  renderCallActions(call){
    const actions = [];
    const haveAddress = !!call.collected.address;
    const haveDetails = !!call.collected.details;
    const haveVictims = !!call.collected.victims;

    // protocolo mínimo
    if (!haveAddress) actions.push({ key:'ask_address', label:'Perguntar: Qual é o endereço exato?' });
    if (!haveDetails) actions.push({ key:'ask_details', label:'Perguntar: O que está acontecendo agora?' });
    if (!haveVictims) actions.push({ key:'ask_victims', label:'Perguntar: Há feridos? Quantos?' });

    // instruções pré-chegada
    if (haveDetails && !call.didInstructions){
      if (call.type === 'medical') actions.push({ key:'instr_ok', label:'Instrução: orientar procedimento correto' });
      actions.push({ key:'instr_bad', label:'Instrução: orientar procedimento incorreto' });
    }

    // triagem de trote
    if (call.type === 'prank'){
      actions.push({ key:'triage_prank', label:'Triagem: sinais de trote / encerrar improcedente' });
      actions.push({ key:'dispatch_anyway', label:'Despachar mesmo assim (erro)' });
    }

    this.els.callActions.innerHTML = '';
    for (const a of actions){
      const btn = document.createElement('button');
      btn.className = 'btn thin';
      btn.textContent = a.label;
      btn.dataset.action = a.key;
      this.els.callActions.appendChild(btn);
    }
  }

  appendTranscript(text){
    this._typeToken++;
    const token = this._typeToken;
    this.typewriterAppend(text, 26, token, true);
  }

  async typewriterAppend(text, cps=22, token=this._typeToken, newline=false){
    const el = this.els.callTranscript;
    if (newline && el.textContent.length) el.textContent += '\n\n';
    const delay = 1000 / Math.max(10, cps);
    for (let i=0; i<text.length; i++){
      if (token !== this._typeToken) return;
      el.textContent += text[i];
      // auto scroll
      el.scrollTop = el.scrollHeight;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // -----------------
  // Queue
  // -----------------
  renderQueue(){
    this.els.queueCount.textContent = String(this.state.queue.length);
    this.els.queue.innerHTML = '';

    // AUTO-SELECT: if nothing is selected, pick the first call to reduce confusion
    if (!this.state.selectedCallId && this.state.queue.length > 0){
      this.state.selectedCallId = this.state.queue[0].id;
    }

    for (const call of this.state.queue){
      const card = document.createElement('button');
      card.className = 'callCard' + (call.id === this.state.selectedCallId ? ' selected' : '');
      card.dataset.callId = call.id;

      const top = document.createElement('div');
      top.className = 'cardTop';
      top.innerHTML = `<span class="tag">${call.region}</span><span class="id">${call.id}</span><span class="sev sev-${call.severity}">${call.severity.toUpperCase()}</span><span class="timer">${fmtTime(call.remaining)}</span>`;

      const msg = document.createElement('div');
      msg.className = 'cardMsg';
      msg.textContent = call.opening.slice(0, 140) + (call.opening.length>140 ? '…' : '');

      card.appendChild(top);
      card.appendChild(msg);

      card.onclick = () => {
        this.state.selectedCallId = call.id;
        this.audio.playSelect();
        this.setHint('Chamada selecionada. Clique em “Atender selecionada”.');
        this.renderQueue();
      };

      this.els.queue.appendChild(card);
    }
  }

  updateQueueTimers(){
    // Atualiza apenas timers na UI (sem recriar tudo é melhor, mas simples por enquanto)
    // Para estabilidade e simplicidade, recria — ainda leve.
    this.renderQueue();
  }

  // -----------------
  // Units + incidents side UI bits
  // -----------------
  renderIncidentBadge(incident){
    this.els.incidentBadge.textContent = incident ? `Incidente: ${incident.type.toUpperCase()} / ${incident.severity.toUpperCase()}` : 'Incidente: —';
  }


  // -----------------
  // Tutorial toast (non-blocking)
  // -----------------
  showTutorialToast(text, { primaryLabel='OK', onPrimary=null, secondaryLabel=null, onSecondary=null } = {}){
    this.hideTutorialToast();
    const t = document.createElement('div');
    t.className = 'tutorialToast';
    t.innerHTML = `<div class="dot"></div><div class="txt"></div><div class="actions"></div>`;
    t.querySelector('.txt').textContent = text;

    const actions = t.querySelector('.actions');
    const primary = document.createElement('button');
    primary.className = 'btn primary';
    primary.textContent = primaryLabel;
    primary.onclick = () => { if (onPrimary) onPrimary(); this.hideTutorialToast(); };
    actions.appendChild(primary);

    if (secondaryLabel){
      const sec = document.createElement('button');
      sec.className = 'btn ghost';
      sec.textContent = secondaryLabel;
      sec.onclick = () => { if (onSecondary) onSecondary(); this.hideTutorialToast(); };
      actions.appendChild(sec);
    }

    document.body.appendChild(t);
    this._tutorialToast = t;
  }

  hideTutorialToast(){
    if (this._tutorialToast){
      this._tutorialToast.remove();
      this._tutorialToast = null;
    }
  }

  renderUnitDock(units, onDispatch){
    this.els.unitDock.innerHTML = '';
    for (const u of units){
      const b = document.createElement('button');
      b.className = 'unitBtn' + (u.status !== 'available' ? ' busy' : '');
      b.textContent = `${u.label}`;
      b.title = u.status;
      b.disabled = u.status !== 'available';
      b.onclick = () => onDispatch(u.id);
      this.els.unitDock.appendChild(b);
    }
  }
}
