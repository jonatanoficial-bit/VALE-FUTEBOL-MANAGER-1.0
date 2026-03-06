
export function renderFinancePanel(report){

return `
<div class="finance-panel">
<h2>Financial Overview</h2>
<p>Balance: $${report.balance}</p>
<p>Wage Budget: $${report.wageBudget}</p>
<p>Transfer Budget: $${report.transferBudget}</p>
</div>
`
}
