import { clamp, pick, uid } from './utils.js';

export class DispatchManager{
  constructor(state, ui, audio){
    this.state = state;
    this.ui = ui;
    this.audio = audio;

    this.canvas = document.getElementById('grid');
    this.ctx = this.canvas.getContext('2d');

    this.selectedIncidentId = null;

    this._unitAcc = new Map();

    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  initUnits(){
    // units roughly like your screenshot
    const W = this.state.config.gridW;
    const H = this.state.config.gridH;
    this.state.units = [
      {id:'P1', type:'police', label:'P1', x:3, y:4, status:'available', target:null},
      {id:'P2', type:'police', label:'P2', x:22, y:10, status:'available', target:null},
      {id:'F1', type:'fire', label:'F1', x:23, y:3, status:'available', target:null},
      {id:'M1', type:'medical', label:'M1', x:15, y:4, status:'available', target:null},
    ];
    // keep within
    for (const u of this.state.units){ u.x = clamp(u.x,0,W-1); u.y = clamp(u.y,0,H-1); }
  }

  createIncidentFromCall(call){
    // random location
    const x = Math.floor(Math.random()*this.state.config.gridW);
    const y = Math.floor(Math.random()*this.state.config.gridH);

    const incident = {
      id: uid('inc'),
      type: call.type,
      severity: call.severity,
      x, y,
      status: 'waiting',
      resolveSec: call.severity === 'high' ? 18 : call.severity === 'medium' ? 14 : 10,
      expectedUnitType: call.type,
      report: {
        success: this._successText(call),
        failure: this._failureText(call)
      }
    };
    this.state.incidents.push(incident);
    return incident;
  }

  _successText(call){
    if (call.type === 'fire') return 'Incêndio contido com rapidez. Evacuação realizada. Sem vítimas.';
    if (call.type === 'medical') return 'Atendimento médico bem-sucedido. Vítima estabilizada.';
    if (call.type === 'police') return 'Equipe no local. Suspeito contido sem feridos.';
    if (call.type === 'prank') return 'Chamada improcedente registrada.';
    return 'Ocorrência concluída.';
  }

  _failureText(call){
    if (call.type === 'fire') return 'Envio inadequado atrasou resposta e o fogo se espalhou.';
    if (call.type === 'medical') return 'Envio inadequado atrasou socorro e a vítima piorou.';
    if (call.type === 'police') return 'Envio inadequado comprometeu a contenção; suspeito fugiu.';
    return 'Falha operacional.';
  }

  onClick(e){
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cell = this.state.config.cell;
    const x = clamp(Math.floor(mx / cell), 0, this.state.config.gridW-1);
    const y = clamp(Math.floor(my / cell), 0, this.state.config.gridH-1);

    // check for incident at cell
    const inc = this.state.incidents.find(i => i.status !== 'resolved' && i.x === x && i.y === y);
    if (inc){
      this.selectedIncidentId = inc.id;
      this.ui.renderIncidentBadge(inc);
      this.audio.playSelect();
      this.ui.setHint('Incidente selecionado. Clique numa unidade disponível para despachar.');
      return;
    }

    // deselect
    this.selectedIncidentId = null;
    this.ui.renderIncidentBadge(null);
  }

  dispatchUnit(unitId){
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.status !== 'available') return;
    const inc = this.state.incidents.find(i => i.id === this.selectedIncidentId);
    if (!inc){
      this.ui.setHint('Selecione um incidente (!) no mapa antes.');
      return;
    }

    unit.status = 'enroute';
    unit.target = { x: inc.x, y: inc.y, incidentId: inc.id };
    inc.status = 'enroute';
    inc.assignedUnitId = unit.id;
    inc.dispatchedUnitType = unit.type;
    inc.mismatch = (unit.type !== this._expectedUnitForIncident(inc));

    this.audio.playDispatch();
    this.ui.setHint(`Unidade ${unit.label} a caminho.`);
  }

  _expectedUnitForIncident(inc){
    // mapping incident type -> unit type
    if (inc.type === 'fire') return 'fire';
    if (inc.type === 'medical') return 'medical';
    if (inc.type === 'police') return 'police';
    // prank: none, but treat as police for mapping (should not create incident ideally)
    return 'police';
  }

  tick(dt){
    if (!this.state.turnRunning || this.state.paused) return;

    const speed = this.state.config.unitSpeedCellsPerSec;

    // move units
    for (const u of this.state.units){
      if (u.status !== 'enroute' || !u.target) continue;
      const key = u.id;
      let acc = (this._unitAcc.get(key) ?? 0) + speed * dt;

      while (acc >= 1){
        const dx = u.target.x - u.x;
        const dy = u.target.y - u.y;
        if (dx === 0 && dy === 0) break;
        if (Math.abs(dx) > 0) u.x += Math.sign(dx);
        else if (Math.abs(dy) > 0) u.y += Math.sign(dy);
        u.x = clamp(u.x, 0, this.state.config.gridW-1);
        u.y = clamp(u.y, 0, this.state.config.gridH-1);
        acc -= 1;
      }
      this._unitAcc.set(key, acc);

      if (u.x === u.target.x && u.y === u.target.y){
        u.status = 'onscene';
        const inc = this.state.incidents.find(i => i.id === u.target.incidentId);
        if (inc && inc.status !== 'resolved') inc.status = 'onscene';
      }
    }

    // resolve incidents
    for (const inc of this.state.incidents){
      if (inc.status !== 'onscene') continue;
      inc.resolveSec -= dt;
      if (inc.resolveSec <= 0){
        this.resolveIncident(inc.id);
      }
    }

    this.render();
  }

  resolveIncident(incidentId){
    const inc = this.state.incidents.find(i => i.id === incidentId);
    if (!inc) return;
    inc.status = 'resolved';

    const unit = this.state.units.find(u => u.id === inc.assignedUnitId);
    if (unit){
      unit.status = 'available';
      unit.target = null;
    }

    // scoring
    const mismatch = !!inc.mismatch;
    if (mismatch){
      const penalty = inc.severity === 'high' ? 30 : inc.severity === 'medium' ? 20 : 12;
      this.state.addScore(-penalty);
      this.audio.playError();
      this.ui.setHint(`Falha: unidade inadequada. -${penalty} pontos`);
    } else {
      const bonus = inc.severity === 'high' ? 30 : inc.severity === 'medium' ? 20 : 10;
      this.state.addScore(bonus);
      this.audio.playResolve();
      this.ui.setHint(`Ocorrência concluída. +${bonus} pontos`);
    }

    // if this incident came from active call, close it gracefully
    if (this.state.activeCall && this.state.activeCall._incidentId === inc.id){
      // show report in transcript
      const text = mismatch ? `📄 Relatório: ${inc.report.failure}` : `📄 Relatório: ${inc.report.success}`;
      this.ui.appendTranscript(text);
    }

    // auto-deselect if selected
    if (this.selectedIncidentId === inc.id){
      this.selectedIncidentId = null;
      this.ui.renderIncidentBadge(null);
    }
  }

  render(){
    const ctx = this.ctx;
    const cell = this.state.config.cell;
    const W = this.state.config.gridW;
    const H = this.state.config.gridH;

    // background
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle = 'rgba(4,6,12,.95)';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for (let x=0; x<=W; x++){
      ctx.beginPath();
      ctx.moveTo(x*cell+0.5, 0);
      ctx.lineTo(x*cell+0.5, H*cell);
      ctx.stroke();
    }
    for (let y=0; y<=H; y++){
      ctx.beginPath();
      ctx.moveTo(0, y*cell+0.5);
      ctx.lineTo(W*cell, y*cell+0.5);
      ctx.stroke();
    }

    // incidents
    for (const inc of this.state.incidents){
      if (inc.status === 'resolved') continue;
      const cx = inc.x*cell + cell/2;
      const cy = inc.y*cell + cell/2;
      const isSel = inc.id === this.selectedIncidentId;

      ctx.beginPath();
      ctx.arc(cx, cy, isSel ? 12 : 10, 0, Math.PI*2);
      ctx.fillStyle = inc.severity === 'high' ? 'rgba(255,77,109,.95)' : inc.severity === 'medium' ? 'rgba(255,176,32,.95)' : 'rgba(122,166,255,.95)';
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,.85)';
      ctx.font = 'bold 14px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', cx, cy+0.5);
    }

    // units
    for (const u of this.state.units){
      const cx = u.x*cell + cell/2;
      const cy = u.y*cell + cell/2;
      ctx.beginPath();
      ctx.roundRect(cx-16, cy-10, 32, 20, 8);
      ctx.fillStyle = u.type === 'police' ? 'rgba(122,166,255,.92)' : u.type === 'fire' ? 'rgba(255,77,109,.92)' : 'rgba(93,242,194,.92)';
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.85)';
      ctx.font = 'bold 12px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(u.label, cx, cy+0.5);
    }
  }
}
