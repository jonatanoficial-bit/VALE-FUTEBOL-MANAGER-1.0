
export class FinanceManager {

constructor(club){
this.club = club
this.balance = 5000000
this.wageBudget = 2000000
this.transferBudget = 3000000
}

addSponsor(name,value){
return {
name,
value,
duration:"1 season"
}
}

paySalary(amount){
this.balance -= amount
}

receiveIncome(amount){
this.balance += amount
}

getFinancialReport(){
return {
balance:this.balance,
wageBudget:this.wageBudget,
transferBudget:this.transferBudget
}
}

}
