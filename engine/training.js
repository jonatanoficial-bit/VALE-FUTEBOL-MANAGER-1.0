
export class TrainingSystem {

constructor(){
this.sessions = []
}

scheduleTraining(type){
this.sessions.push({
type,
date:new Date().toISOString()
})
}

getSessions(){
return this.sessions
}

}
