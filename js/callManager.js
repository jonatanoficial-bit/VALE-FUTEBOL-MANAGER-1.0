import { pick, uid } from './utils.js';

export class CallManager{
  constructor(state, ui, audio, dispatch){
    this.state = state;
    this.ui = ui;
    this.audio = audio;
    this.dispatch = dispatch;

    this._spawnAcc = 0;
    this._eventsAcc = 0;
    this._callTemplates = [];
  }

  setTemplates(calls){ this._callTemplates = calls; }

  startTurn(){
    this.state.turnRunning = true;
    this.state.paused = false;
    this._spawnAcc = 0;
    // spawn 1 imediatamente
    this.spawnCall();
  }

  tick(dt){
    if (!this.state.turnRunning || this.state.paused) return;

    // turn timer
    this.state.turnRemaining -= dt;
    if (this.state.turnRemaining <= 0){
      this.state.turnRemaining = 0;
      this.state.turnRunning = false;
      this.audio.playResolve();
      this.ui.setHint('Fim do turno. Reinicie para jogar novamente.');
      return;
    }

    // spawn new calls
    this._spawnAcc += dt;
    if (this._spawnAcc >= this.state.config.spawnEvery){
      this._spawnAcc = 0;
      if (this.state.queue.length < this.state.config.maxQueue){
        this.spawnCall();
      }
    }

    // tick queue call timers
    for (const call of this.state.queue){
      call.remaining -= dt;
      // events while waiting
      this._handleCallEvents(call, dt);
    }

    // active call timer + events
    if (this.state.activeCall){
      this.state.activeCall.remaining -= dt;
      this._handleCallEvents(this.state.activeCall, dt);
      this.ui.updateCallTimer(this.state.activeCall);
      if (this.state.activeCall.remaining <= 0){
        this.audio.playError();
        this.ui.appendTranscript('⚠️ A ligação caiu. Você demorou demais.');
        this.state.addScore(-15);
        this.endActiveCall(true);
      }
    }

    // remove timed-out queue calls
    const before = this.state.queue.length;
    this.state.queue = this.state.queue.filter(c => c.remaining > 0);
    if (this.state.queue.length !== before){
      this.audio.playError();
      this.ui.renderQueue();
    }

    // update queue timers on ui
    this.ui.updateQueueTimers();
  }

  spawnCall(){
    const tpl = pick(this._callTemplates);
    const call = JSON.parse(JSON.stringify(tpl));
    call.id = tpl.id + '__' + uid('c').slice(-5);
    call.remaining = this.state.config.callTimeout;
    call.collected = { address:'', details:'', victims:'' };
    call.didInstructions = false;
    call._eventCursor = 0;
    call._elapsed = 0;
    this.state.queue.push(call);
    this.audio.playIncoming();
    this.ui.renderQueue();
  }

  answerSelected(){
    // If none selected, auto pick first to reduce confusion
    if (!this.state.selectedCallId && this.state.queue.length > 0){
      this.state.selectedCallId = this.state.queue[0].id;
    }
    const id = this.state.selectedCallId;
    if (!id){
      this.ui.setHint('Selecione uma chamada na fila primeiro.');
      return;
    }
    const idx = this.state.queue.findIndex(c => c.id === id);
    if (idx < 0){
      this.ui.setHint('Chamada não encontrada.');
      return;
    }
    if (this.state.activeCall){
      this.ui.setHint('Você já tem uma chamada ativa. Coloque em espera ou encerre.');
      return;
    }
    const call = this.state.queue.splice(idx,1)[0];
    this.state.selectedCallId = null;
    this.state.activeCall = call;
    this.audio.playSelect();
    this.ui.renderQueue();
    this.ui.renderActiveCall(call);
    this._bindActionButtons();

    this.ui.setHint('Colete Endereço e Detalhes. Em seguida, o incidente será criado e você poderá despachar.');
  }

  holdActive(){
    if (!this.state.activeCall) return;
    // move back to queue (simple)
    const call = this.state.activeCall;
    this.state.activeCall = null;
    call.remaining = Math.max(8, call.remaining); // don't insta-drop
    this.state.queue.unshift(call);
    this.audio.playSelect();
    this.ui.clearActiveCall();
    this.ui.renderQueue();
    this.ui.setHint('Chamada colocada em espera.');
  }

  endActiveCall(force=false){
    if (!this.state.activeCall) return;
    const call = this.state.activeCall;
    this.state.activeCall = null;
    this.ui.clearActiveCall();
    if (!force) this.audio.playSelect();

    // if ended without dispatch on real emergencies, small penalty
    if (!force && call.type !== 'prank'){
      this.state.addScore(-8);
      this.ui.setHint('Chamada encerrada sem conclusão. -8 pontos');
    }
    this.ui.renderQueue();
  }

  _bindActionButtons(){
    // delegate clicks inside callActions
    this.ui.els.callActions.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      this.handleAction(action);
    };
  }

  handleAction(action){
    const call = this.state.activeCall;
    if (!call) return;

    // protocol actions
    if (action === 'ask_address'){
      call.collected.address = call.script.address;
      this.audio.playType();
      this.ui.appendTranscript(`Operador: Qual é o endereço exato?\nChamador: ${call.script.address}`);
      this.ui.renderCallFields(call); // ✅ garante atualização
      this.ui.renderCallActions(call);
      this._maybeCreateIncident(call);
      return;
    }
    if (action === 'ask_details'){
      call.collected.details = call.script.details;
      this.audio.playType();
      this.ui.appendTranscript(`Operador: O que está acontecendo agora?\nChamador: ${call.script.details}`);
      this.ui.renderCallFields(call);
      this.ui.renderCallActions(call);
      this._maybeCreateIncident(call);
      return;
    }
    if (action === 'ask_victims'){
      call.collected.victims = call.script.victims;
      this.audio.playType();
      this.ui.appendTranscript(`Operador: Há feridos? Quantos?\nChamador: ${call.script.victims || 'Não sei…'}`);
      this.ui.renderCallFields(call);
      this.ui.renderCallActions(call);
      return;
    }

    // prank triage
    if (action === 'triage_prank'){
      call.didInstructions = true;
      this.audio.playResolve();
      this.ui.appendTranscript(`Operador: Vou fazer algumas perguntas…\nChamador: (risadas) Era brincadeira…`);
      this.ui.appendTranscript(`✅ Registro: chamada improcedente / trote.`);
      this.state.addScore(+10);
      this.endActiveCall(true);
      return;
    }
    if (action === 'dispatch_anyway'){
      call.didInstructions = true;
      this.audio.playError();
      this.ui.appendTranscript(`❌ Você despachou sem confirmar. Recurso desperdiçado.`);
      this.state.addScore(-12);
      this.endActiveCall(true);
      return;
    }

    // instructions
    if (action === 'instr_ok'){
      call.didInstructions = true;
      this.audio.playResolve();
      this.ui.appendTranscript(`✅ Instrução correta: ${call.script.instructions_ok}`);
      this.state.addScore(+8);
      this.ui.renderCallActions(call);
      return;
    }
    if (action === 'instr_bad'){
      call.didInstructions = true;
      this.audio.playError();
      this.ui.appendTranscript(`❌ Instrução incorreta: ${call.script.instructions_bad}`);
      this.state.addScore(-10);
      this.ui.renderCallActions(call);
      return;
    }
  }

  _maybeCreateIncident(call){
    // need at least address + details to create incident
    if (!call.collected.address || !call.collected.details) return;
    if (call._incidentId) return;

    // create incident
    const incident = this.dispatch.createIncidentFromCall(call);
    call._incidentId = incident.id;

    this.ui.appendTranscript('📡 Despacho: incidente registrado. Selecione o marcador (!) e despache a unidade.');
    this.ui.setHint('Selecione o incidente no mapa e clique numa unidade disponível para despachar.');
  }

  _handleCallEvents(call, dt){
    call._elapsed = (call._elapsed ?? 0) + dt;
    if (!call.events || !call.events.length) return;
    const cursor = call._eventCursor ?? 0;
    if (cursor >= call.events.length) return;

    const nextEvt = call.events[cursor];
    if (call._elapsed >= nextEvt.at){
      call._eventCursor = cursor + 1;
      // only show events if call is active
      if (this.state.activeCall && this.state.activeCall.id === call.id){
        this.audio.playIncoming(520, 0.05);
        this.ui.appendTranscript(`📣 Atualização: ${nextEvt.text}`);
        // mild penalty if still no dispatch
        if (!call._incidentId){
          this.state.addScore(-2);
        }
      }
    }
  }

  onIncidentResolved(incident, unit){
    const call = this.state.activeCall;
    const mismatch = incident.mismatch;

    if (mismatch){
      const p = incident.severity==='high'?30:incident.severity==='medium'?20:12;
      this.state.addScore(-p);
      this.audio.playError();
      this.ui.appendTranscript(`❌ Falha operacional: unidade inadequada. -${p} pontos`);
    }else{
      const b = incident.severity==='high'?30:incident.severity==='medium'?20:10;
      this.state.addScore(+b);
      this.audio.playResolve();
      this.ui.appendTranscript(`📄 Relatório: ${incident.report.success} +${b} pontos`);
    }

    // close call after resolution
    this.endActiveCall(true);
  }
}
