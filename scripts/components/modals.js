// components/modals.js
export function renderModals() {
  return `
    <!-- Add Transaction Modal -->
    <div class="modal" id="addTransactionModal" role="dialog" aria-modal="true" aria-labelledby="addTransactionTitle">
      <div class="modal-content">
        <button type="button" class="modal-close" aria-label="Close" onclick="app.hideModal('addTransaction')">&times;</button>
        <h3 class="mb-2 card-title" id="addTransactionTitle">Add Transaction</h3>
        <form id="addTransactionForm">
          <div class="form-group">
            <label class="form-label" for="transactionDescription">Description</label>
            <input id="transactionDescription" type="text" class="form-input" name="description" required placeholder="e.g., Groceries, Salary">
          </div>
          <div class="form-group">
            <label class="form-label" for="transactionAmount">Amount</label>
            <input id="transactionAmount" type="number" class="form-input" name="amount" step="0.01" required placeholder="e.g., 50.25">
          </div>
          <div class="form-group">
            <label class="form-label" for="transactionCategory">Category</label>
            <select id="transactionCategory" class="form-input" name="category" required>
              <option value="">Select Category</option>
              <option value="income">Income</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transportation</option>
              <option value="shopping">Shopping</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="transactionDate">Date</label>
            <input id="transactionDate" type="date" class="form-input" name="date" required>
          </div>
          <button type="submit" class="btn btn-primary">Add Transaction</button>
        </form>
      </div>
    </div>

    <!-- Add Budget Modal -->
    <div class="modal" id="addBudgetModal" role="dialog" aria-modal="true" aria-labelledby="addBudgetTitle">
      <div class="modal-content">
        <button type="button" class="modal-close" aria-label="Close" onclick="app.hideModal('addBudget')">&times;</button>
        <h3 class="mb-2 card-title" id="addBudgetTitle">Add/Update Budget</h3>
        <form id="addBudgetForm">
          <div class="form-group">
            <label class="form-label" for="budgetCategory">Category</label>
            <select id="budgetCategory" class="form-input" name="category" required>
              <option value="">Select Category</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transportation</option>
              <option value="shopping">Shopping</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="monthlyLimit">Monthly Limit</label>
            <input id="monthlyLimit" type="number" class="form-input" name="limit" step="0.01" required min="0" placeholder="e.g., 500">
          </div>
          <button type="submit" class="btn btn-primary">Save Budget</button>
        </form>
      </div>
    </div>

    <!-- Add Goal Modal -->
    <div class="modal" id="addGoalModal" role="dialog" aria-modal="true" aria-labelledby="addGoalTitle">
      <div class="modal-content">
        <button type="button" class="modal-close" aria-label="Close" onclick="app.hideModal('addGoal')">&times;</button>
        <h3 class="mb-2 card-title" id="addGoalTitle">Add Savings Goal</h3>
        <form id="addGoalForm">
          <div class="form-group">
            <label class="form-label" for="goalName">Goal Name</label>
            <input id="goalName" type="text" class="form-input" name="name" required placeholder="e.g., New Laptop">
          </div>
          <div class="form-group">
            <label class="form-label" for="targetAmount">Target Amount</label>
            <input id="targetAmount" type="number" class="form-input" name="target" step="0.01" required min="0" placeholder="e.g., 1500">
          </div>
          <div class="form-group">
            <label class="form-label" for="currentAmount">Current Amount (Optional)</label>
            <input id="currentAmount" type="number" class="form-input" name="current" step="0.01" value="0" min="0" placeholder="e.g., 300">
          </div>
          <div class="form-group">
            <label class="form-label" for="targetDate">Target Date (Optional)</label>
            <input id="targetDate" type="date" class="form-input" name="targetDate">
          </div>
          <button type="submit" class="btn btn-primary">Create Goal</button>
        </form>
      </div>
    </div>
  `;
}