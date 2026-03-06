import { fmtTime } from './utils.js';

export class GameState{
  constructor(){
    this.reset();
  }

  reset(){
    this.city = null;
    this.turnRunning = false;
    this.paused = false;
    this.turnSec = 6*60; // 6 min por enquanto
    this.turnRemaining = this.turnSec;
    this.score = 0;

    this.queue = []; // chamadas esperando
    this.activeCall = null;
    this.selectedCallId = null;

    this.incidents = []; // {id, type, severity, x,y,status, resolveSec, expectedUnitType, report}
    this.units = []; // {id,type,label,x,y,status,target}

    this.config = {
      maxQueue: 5,
      spawnEvery: 18,
      callTimeout: 110,
      unitSpeedCellsPerSec: 3.2,
      gridW: 26,
      gridH: 14,
      cell: 32,
    };
  }

  setCity(city){
    this.city = city;
  }

  addScore(delta){
    this.score += delta;
  }

  timeText(){ return fmtTime(this.turnRemaining); }
}
