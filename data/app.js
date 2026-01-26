
let state={
  season:2025,
  round:1,
  maxRounds:38,
  club:null,
  wonLibertadores:false,
  wonChampions:false
};

function pickClub(id){
  state.club=id;
  document.getElementById('hub').style.display='block';
}

function playRound(){
  if(state.round>state.maxRounds){
    endSeason();return;
  }
  log('Rodada '+state.round+' da liga jogada');
  if(state.round===38){
    state.wonLibertadores=true; // simulação
    state.wonChampions=true;   // simulação
  }
  state.round++;
}

function endSeason(){
  log('Fim da temporada '+state.season);
  if(state.wonLibertadores && state.wonChampions){
    playIntercontinental();
  }
  state.season++;
  state.round=1;
  state.wonLibertadores=false;
  state.wonChampions=false;
  log('Nova temporada '+state.season+' iniciada');
}

function playIntercontinental(){
  log('🏆 Intercontinental: Campeão da Libertadores x Campeão da Champions');
  log('Resultado: Vitória histórica no estádio neutro');
}

function playWorldCup(){
  log('🌍 Mundial de Clubes FIFA iniciado');
  log('Fase de grupos → mata-mata → final');
  log('Mundial encerrado');
}

function log(t){
  document.getElementById('log').innerHTML+='<div>'+t+'</div>';
}
