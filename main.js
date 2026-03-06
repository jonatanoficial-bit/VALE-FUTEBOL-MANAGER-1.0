
import { FinanceManager } from "./engine/finance.js"
import { BoardSystem } from "./engine/board.js"
import { TrainingSystem } from "./engine/training.js"
import { renderFinancePanel } from "./ui/financePanel.js"

const finance = new FinanceManager("Sample Club")
const board = new BoardSystem()
const training = new TrainingSystem()

finance.receiveIncome(200000)
finance.paySalary(50000)

const report = finance.getFinancialReport()

document.getElementById("app").innerHTML =
renderFinancePanel(report)
