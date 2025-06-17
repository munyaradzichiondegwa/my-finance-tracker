/**
=================================================================
PERSONAL FINANCE TRACKER - CONSOLIDATED JAVASCRIPT FILE
=================================================================
*/

// =================================
// 1. DataStore
// =================================
class DataStore {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    }
    static set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error writing to localStorage:', e);
        }
    }
    static remove(key) {
        localStorage.removeItem(key);
    }
}

// =================================
// 2. ApiService
// =================================
class ApiService {
    static async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// =================================
// 3. FixerService & FmpService
// =================================
class FixerService {
    static get API_KEY() { return '9964d003bc00481e06fa5252179dd258'; }
    static get BASE_URL() { return 'https://data.fixer.io/api/latest'; } // Using HTTPS fixer.io endpoint
    static get SUPPORTED_CURRENCIES() { return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'BWP', 'ZWG', 'CNY', 'JPY', 'KES', 'NGN', 'INR', 'CHF', 'NZD']; }

    static async getExchangeRates() {
        const cachedRatesData = DataStore.get('exchangeRates');
        const oneDay = 86400000; // 24 hours in milliseconds

        if (cachedRatesData && (Date.now() - cachedRatesData.timestamp < oneDay)) {
            const source = cachedRatesData.source || 'cache';
            console.log(`Using ${source}d exchange rates.`);
            return { rates: cachedRatesData.rates, source };
        }

        console.log("Attempting to fetch new exchange rates from Fixer.io...");
        const currenciesQuery = this.SUPPORTED_CURRENCIES.join(',');
        // The free Fixer.io plan's base currency is EUR. We fetch rates against EUR
        // and then convert them to be USD-based.
        const url = `${this.BASE_URL}?access_key=${this.API_KEY}&symbols=${currenciesQuery}`;

        try {
            const data = await ApiService.request(url);
            if (data.success) {
                console.log("Successfully fetched new rates from Fixer.io API.");

                // The base currency is EUR on the free plan. We must convert to a USD base.
                const eurRates = data.rates;
                const eurToUsdRate = eurRates['USD'];

                if (!eurToUsdRate) {
                    throw new Error('USD rate not found in Fixer.io response, cannot convert to USD base.');
                }

                const usdBasedRates = {};
                for (const currency in eurRates) {
                    // Formula to convert base: (EUR/Target) / (EUR/USD) = USD/Target
                    usdBasedRates[currency] = eurRates[currency] / eurToUsdRate;
                }
                usdBasedRates['USD'] = 1.0; // Ensure USD is exactly 1.0

                DataStore.set('exchangeRates', { rates: usdBasedRates, timestamp: Date.now(), source: 'api' });
                return { rates: usdBasedRates, source: 'api' };
            } else {
                const errorInfo = data.error?.info || 'API request was not successful. Check your API key and plan.';
                throw new Error(errorInfo);
            }
        } catch (error) {
            console.error("Fixer.io API failed. Using fallback rates.", error.message);
            const fallbackRates = {
                USD: 1.0, EUR: 0.92, GBP: 0.79, CAD: 1.37, AUD: 1.50,
                ZAR: 18.50, BWP: 13.70, ZWG: 13.30, CNY: 7.25, JPY: 157.0,
                KES: 130.00, NGN: 1480.00, INR: 83.50, CHF: 0.89, NZD: 1.68
            };
            DataStore.set('exchangeRates', { rates: fallbackRates, timestamp: Date.now(), source: 'fallback' });
            return { rates: fallbackRates, source: 'fallback' };
        }
    }
}


class FmpService {
    static get API_KEY() { return 'jHmE0m3BDmYy5aq4ErVvdl65P1s024V4'; } 
    static get BASE_URL() { return 'https://financialmodelingprep.com/api/v3'; }
    static async getMajorIndexes() {
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK-B'].join(',');
        const url = `${this.BASE_URL}/quote/${symbols}?apikey=${this.API_KEY}`;
        try {
            const data = await ApiService.request(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("FMP API request failed:", error);
            return [];
        }
    }
}

// =================================
// 4. Managers (Transaction, Budget, Goal)
// =================================
class TransactionManager {
    constructor() { this.transactions = DataStore.get('transactions') || []; }
    add(transaction) {
        transaction.id = `tx_${Date.now()}`;
        this.transactions.unshift(transaction);
        this.save();
        this.notifyUpdate();
    }
    remove(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.save();
        this.notifyUpdate();
    }
    getAll() { return [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)); }
    save() { DataStore.set('transactions', this.transactions); }
    notifyUpdate() { window.dispatchEvent(new CustomEvent('dataChanged')); }
    getTotalBalance() { return this.transactions.reduce((sum, t) => sum + t.amount, 0); }
    getMonthlyTotals() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((totals, t) => {
                if (t.amount > 0) totals.income += t.amount;
                else totals.expenses += Math.abs(t.amount);
                return totals;
            }, { income: 0, expenses: 0 });
    }
}

class BudgetManager {
    constructor() { this.budgets = DataStore.get('budgets') || []; }
    add(budget) {
        const existingIndex = this.budgets.findIndex(b => b.category === budget.category);
        if (existingIndex > -1) {
            this.budgets[existingIndex].limit = budget.limit;
        } else {
            budget.id = `bud_${Date.now()}`;
            this.budgets.push(budget);
        }
        this.save();
        this.notifyUpdate();
    }
    remove(id) {
        this.budgets = this.budgets.filter(b => b.id !== id);
        this.save();
        this.notifyUpdate();
    }
    getAll() { return [...this.budgets]; }
    save() { DataStore.set('budgets', this.budgets); }
    notifyUpdate() { window.dispatchEvent(new CustomEvent('dataChanged')); }
}

class GoalManager {
    constructor() { this.goals = DataStore.get('goals') || []; }
    add(goal) {
        goal.id = `goal_${Date.now()}`;
        this.goals.push(goal);
        this.save();
        this.notifyUpdate();
    }
    remove(id) {
        this.goals = this.goals.filter(g => g.id !== id);
        this.save();
        this.notifyUpdate();
    }
    getAll() { return [...this.goals]; }
    save() { DataStore.set('goals', this.goals); }
    notifyUpdate() { window.dispatchEvent(new CustomEvent('dataChanged')); }
    getTotalProgress() {
        if (this.goals.length === 0) return 0;
        const totalWeightedProgress = this.goals.reduce((sum, goal) => {
            const progress = goal.target > 0 ? (goal.current / goal.target) : 0;
            return sum + Math.min(progress, 1);
        }, 0);
        return (totalWeightedProgress / this.goals.length) * 100;
    }
}

// =================================
// 5. CurrencyManager
// =================================
class CurrencyManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.rates = {};
        this.source = 'initial'; // To track if rates are from 'api', 'cache', or 'fallback'
        this.currentCurrency = DataStore.get('selectedCurrency') || 'USD';
    }
    async init() {
        const ratesData = await FixerService.getExchangeRates();
        this.rates = ratesData.rates;
        this.source = ratesData.source;
        this.setupCurrencySelector();
    }
    setupCurrencySelector() {
        const selector = document.getElementById('currencySelector');
        if (!selector) return;
        selector.value = this.currentCurrency;
        selector.addEventListener('change', (e) => {
            this.currentCurrency = e.target.value;
            DataStore.set('selectedCurrency', this.currentCurrency);
            this.uiManager.updateUI();
        });
    }
    convert(amountUSD) {
        const rate = this.rates[this.currentCurrency] || 1;
        return amountUSD * rate;
    }
}

// =================================
// 6. ChartUtil
// =================================
class ChartUtil {
    static createPieChart(containerSelector, data, colors) {
        const svg = document.querySelector(containerSelector);
        if (!svg) return;
        svg.innerHTML = '';
        const width = svg.clientWidth || 300, height = svg.clientHeight || 300;
        const radius = Math.min(width, height) / 2 - 10, centerX = width / 2, centerY = height / 2;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', centerX); text.setAttribute('y', centerY);
            text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'var(--medium-gray)'); text.textContent = 'No expense data';
            svg.appendChild(text);
            return;
        }
        let currentAngle = -Math.PI / 2;
        data.forEach((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + angle);
            const y2 = centerY + radius * Math.sin(currentAngle + angle);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', 'var(--white)'); path.setAttribute('stroke-width', '2');
            svg.appendChild(path);
            currentAngle += angle;
        });
    }
}

// =================================
// 7. UIManager
// =================================
class UIManager {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        window.addEventListener('dataChanged', () => this.updateUI());
        document.getElementById('addTransactionForm')?.addEventListener('submit', e => this.handleAddTransaction(e));
        document.getElementById('addBudgetForm')?.addEventListener('submit', e => this.handleAddBudget(e));
        document.getElementById('addGoalForm')?.addEventListener('submit', e => this.handleAddGoal(e));
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('active');
        });
        const contentArea = document.getElementById('content-area');
        contentArea?.addEventListener('click', e => {
            const removeButton = e.target.closest('.btn-remove');
            if (removeButton) {
                const { type, id } = removeButton.dataset;
                if (confirm(`Are you sure you want to remove this ${type}?`)) {
                    this.app.removeItem(type, id);
                }
            }
        });
    }

    updateUI() {
        const view = this.determineCurrentView();
        const container = document.getElementById('content-area');
        if (!container) return;
        switch (view) {
            case 'dashboard':
                container.innerHTML = this.getDashboardHTML();
                this.updateDashboardData();
                break;
            case 'transactions':
                container.innerHTML = this.getTransactionsHTML();
                this.renderTransactionsList();
                break;
            case 'budgets':
                container.innerHTML = this.getBudgetsHTML();
                this.renderBudgetsList();
                break;
            case 'goals':
                container.innerHTML = this.getGoalsHTML();
                this.renderGoalsList();
                break;
            case 'accounts':
                container.innerHTML = this.getAccountsHTML();
                this.renderAccountsList();
                break;
            default:
                container.innerHTML = `<p>Page not found.</p>`;
        }
    }

    _getConvertedAndFormattedCurrency(amountInUSD) {
        const convertedAmount = this.app.currencyManager.convert(amountInUSD);
        return this.formatCurrency(convertedAmount);
    }

    updateDashboardData() {
        const { transactionManager, goalManager } = this.app;
        const balance = transactionManager.getTotalBalance();
        const { income, expenses } = transactionManager.getMonthlyTotals();
        const savingsProgress = goalManager.getTotalProgress();

        document.getElementById('totalBalance').textContent = this._getConvertedAndFormattedCurrency(balance);
        document.getElementById('monthlyIncome').textContent = this._getConvertedAndFormattedCurrency(income);
        document.getElementById('monthlyExpenses').textContent = this._getConvertedAndFormattedCurrency(expenses);
        document.getElementById('savingsGoalProgress').textContent = `${savingsProgress.toFixed(1)}%`;

        this.renderRecentTransactions(transactionManager.getAll().slice(0, 5));
        this.renderExpenseChart(transactionManager.getAll());
        this.renderMarketOverview();
        this.renderCurrencyRates();
    }

    renderRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        if (!container) return;
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-center text-medium-gray">No transactions yet.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table">
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${this.formatDate(t.date)}</td>
                            <td>${t.description}</td>
                            <td class="text-right ${t.amount > 0 ? 'text-success' : 'text-error'}">
                                ${this._getConvertedAndFormattedCurrency(t.amount)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    }

    renderExpenseChart(transactions) {
        const expenses = transactions.filter(t => t.amount < 0);
        const categoryTotals = expenses.reduce((acc, t) => {
            const category = t.category || 'uncategorized';
            acc[category] = (acc[category] || 0) + Math.abs(t.amount);
            return acc;
        }, {});
        const chartData = Object.entries(categoryTotals).map(([label, value]) => ({ label, value }));
        const colors = ['#0A488A', '#28A798', '#F58634', '#48BB78', '#E53E3E', '#3182CE', '#DD6B20'];
        ChartUtil.createPieChart('#expenseChart', chartData, colors);
    }

    async renderMarketOverview() {
        const container = document.getElementById('marketOverview');
        if (!container) return;
        container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
        try {
            const stocks = await FmpService.getMajorIndexes();
            if (stocks.length === 0) {
                container.innerHTML = '<p class="text-center text-medium-gray">Market data unavailable.</p>';
                return;
            }
            container.innerHTML = stocks.map(stock => {
                const isPositive = stock.change >= 0;
                return `
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">${stock.symbol}</span>
                        <div class="text-right">
                            ${this.formatCurrency(stock.price, 'USD')}
                            <span class="${isPositive ? 'text-success' : 'text-error'} ml-2">
                                <i class="fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                                ${stock.changesPercentage.toFixed(2)}%
                            </span>
                        </div>
                    </div>`;
            }).join('');
        } catch (error) {
            container.innerHTML = '<p class="text-center text-error">Could not load market data.</p>';
        }
    }
    
    renderCurrencyRates() {
        const container = document.getElementById('currencyRates');
        if (!container) return;

        const rates = this.app.currencyManager.rates;
        const source = this.app.currencyManager.source;

        // Add a warning icon if we are using fallback data
        if (source === 'fallback') {
            const header = container.previousElementSibling;
            if (header && header.classList.contains('card-header') && !header.querySelector('.fallback-warning')) {
                const warningEl = document.createElement('span');
                warningEl.className = 'fallback-warning';
                warningEl.style.marginLeft = 'auto';
                warningEl.style.color = '#f5a623'; // Warning color
                warningEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                warningEl.title = 'Live rates unavailable. Showing stale fallback data.';
                header.appendChild(warningEl);
            }
        }

        if (!rates || Object.keys(rates).length === 0) {
            container.innerHTML = '<p class="text-center text-medium-gray">Currency rates unavailable.</p>';
            return;
        }

        const currenciesToShow = Object.keys(rates).filter(c => c !== 'USD').sort();

        container.innerHTML = currenciesToShow.map(currency => `
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium">USD / ${currency}</span>
                <span class="text-right font-medium">${rates[currency].toFixed(2)}</span>
            </div>
        `).join('');
    }

    renderTransactionsList() {
        const transactions = this.app.transactionManager.getAll();
        const container = document.getElementById('transactionsTableBody');
        if (!container) return;
        if (transactions.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="text-center">No transactions found.</td></tr>`;
            return;
        }
        container.innerHTML = transactions.map(t => `
            <tr>
                <td>${this.formatDate(t.date)}</td>
                <td>${t.description}</td>
                <td><span class="category-badge category-${t.category}">${t.category}</span></td>
                <td class="${t.amount > 0 ? 'text-success' : 'text-error'}">${this._getConvertedAndFormattedCurrency(t.amount)}</td>
                <td><button class="btn btn-danger btn-sm btn-remove" data-type="transaction" data-id="${t.id}"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    }

    renderBudgetsList() {
        const budgets = this.app.budgetManager.getAll();
        const transactions = this.app.transactionManager.getAll();
        const container = document.getElementById('budgetsList');
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = '<p class="text-center text-medium-gray">No budgets set. Click "Add/Update Budget" to create one.</p>';
            return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        container.innerHTML = budgets.map(budget => {
            const spent = transactions
                .filter(t => t.category === budget.category && t.amount < 0 && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            const limit = budget.limit;
            const remaining = limit - spent;
            const percentage = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
            const isOverBudget = remaining < 0;

            return `
                <div class="budget-card">
                    <div class="budget-card-header">
                        <h4 class="budget-category">${budget.category}</h4>
                        <button class="btn btn-danger btn-sm btn-remove" data-type="budget" data-id="${budget.id}"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="budget-card-body">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${Math.min(percentage, 100)}%; background-color: ${isOverBudget ? '#E53E3E' : '#0A488A'};"></div>
                        </div>
                        <div class="budget-details">
                            <span>Spent: ${this._getConvertedAndFormattedCurrency(spent)}</span>
                            <span class="${isOverBudget ? 'text-error' : ''}">
                                ${isOverBudget ? 'Over by' : 'Remaining'}: ${this._getConvertedAndFormattedCurrency(Math.abs(remaining))}
                            </span>
                        </div>
                        <div class="budget-limit">
                            Limit: ${this._getConvertedAndFormattedCurrency(limit)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderGoalsList() {
        const goals = this.app.goalManager.getAll();
        const container = document.getElementById('goalsList');
        if (!container) return;

        if (goals.length === 0) {
            container.innerHTML = '<p class="text-center text-medium-gray">No savings goals defined. Click "Add Goal" to get started.</p>';
            return;
        }

        container.innerHTML = goals.map(goal => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            return `
                <div class="goal-card">
                    <div class="goal-card-header">
                        <h4 class="goal-name">${goal.name}</h4>
                        <button class="btn btn-danger btn-sm btn-remove" data-type="goal" data-id="${goal.id}"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="goal-card-body">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${Math.min(progress, 100)}%;"></div>
                        </div>
                        <div class="goal-details">
                            <span>${this._getConvertedAndFormattedCurrency(goal.current)} / ${this._getConvertedAndFormattedCurrency(goal.target)}</span>
                            <span>${progress.toFixed(1)}%</span>
                        </div>
                        ${goal.targetDate ? `<div class="goal-target-date">Target: ${this.formatDate(goal.targetDate)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async renderAccountsList() {
        const container = document.getElementById('accountsList');
        if (!container) return;
        container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
        setTimeout(() => {
             container.innerHTML = '<p class="text-center text-medium-gray">Account linking is a simulated feature that requires a backend server. See the code comments for details on how a real implementation would work with a service like Plaid.</p>';
        }, 1000);
    }
    
    handleAddTransaction(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const category = formData.get('category');
        const amount = parseFloat(formData.get('amount'));

        const finalAmount = category === 'income' ? amount : -amount;

        const transaction = {
            description: formData.get('description'),
            amount: finalAmount,
            category: category,
            date: formData.get('date'),
        };
        this.app.transactionManager.add(transaction);
        this.hideModal('addTransaction');
        form.reset();
    }

    handleAddBudget(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const budget = {
            category: formData.get('category'),
            limit: parseFloat(formData.get('limit')),
        };
        this.app.budgetManager.add(budget);
        this.hideModal('addBudget');
        form.reset();
    }

    handleAddGoal(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const goal = {
            name: formData.get('name'),
            target: parseFloat(formData.get('target')),
            current: parseFloat(formData.get('current') || 0),
            targetDate: formData.get('targetDate'),
        };
        this.app.goalManager.add(goal);
        this.hideModal('addGoal');
        form.reset();
    }
    
    getDashboardHTML() {
        return `
            <div id="dashboardView">
                <div class="summary-cards">
                    <div class="summary-card"><div class="summary-value" id="totalBalance">$0.00</div><div class="summary-label">Total Balance</div></div>
                    <div class="summary-card"><div class="summary-value" id="monthlyIncome">$0.00</div><div class="summary-label">Monthly Income</div></div>
                    <div class="summary-card"><div class="summary-value" id="monthlyExpenses">$0.00</div><div class="summary-label">Monthly Expenses</div></div>
                    <div class="summary-card"><div class="summary-value" id="savingsGoalProgress">0%</div><div class="summary-label">Savings Progress</div></div>
                </div>
                <div class="dashboard-grid">
                    <div class="card"><div class="card-header"><h3 class="card-title">Recent Transactions</h3><a href="transactions.html" class="btn btn-secondary">View All</a></div><div id="recentTransactions" class="table-container"></div></div>
                    <div class="card"><div class="card-header"><h3 class="card-title">Expense Breakdown</h3></div><div class="chart-container"><svg class="chart-svg" id="expenseChart"></svg></div></div>
                    <div class="card">
                        <div class="card-header"><h3 class="card-title">Market Overview</h3></div>
                        <div id="marketOverview"></div>
                        <hr class="card-divider">
                        <div class="card-header" style="display: flex; align-items: center;"><h3 class="card-title">Exchange Rates (vs USD)</h3></div>
                        <div id="currencyRates"></div>
                    </div>
                </div>
            </div>`;
    }

    getTransactionsHTML() {
        return `
            <div id="transactionsView">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">All Transactions</h3>
                        <button class="btn btn-primary" onclick="app.showModal('addTransaction')"><i class="fas fa-plus"></i> Add Transaction</button>
                    </div>
                    <div class="table-container">
                        <table class="table" id="transactionsTable">
                            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Actions</th></tr></thead>
                            <tbody id="transactionsTableBody"><div class="loading"><div class="spinner"></div></div></tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    }

    getBudgetsHTML() {
        return `
            <div id="budgetsView">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Budget Management</h3>
                        <button class="btn btn-primary" onclick="app.showModal('addBudget')"><i class="fas fa-plus"></i> Add/Update Budget</button>
                    </div>
                    <div id="budgetsList" class="budgets-grid">
                        <div class="loading"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>`;
    }

    getGoalsHTML() {
        return `
            <div id="goalsView">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Savings Goals</h3>
                        <button class="btn btn-primary" onclick="app.showModal('addGoal')"><i class="fas fa-plus"></i> Add Goal</button>
                    </div>
                    <div id="goalsList" class="goals-grid">
                        <div class="loading"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>`;
    }

    getAccountsHTML() {
        return `
            <div id="accountsView">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Linked Accounts</h3>
                        <button class="btn btn-primary" onclick="app.linkAccount()"><i class="fas fa-link"></i> Link New Account</button>
                    </div>
                    <div id="accountsList">
                        <div class="loading"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>`;
    }

    determineCurrentView() {
        const path = window.location.pathname.split("/").pop();
        if (path === 'transactions.html') return 'transactions';
        if (path === 'budgets.html') return 'budgets';
        if (path === 'goals.html') return 'goals';
        if (path === 'accounts.html') return 'accounts';
        return 'dashboard';
    }

    showModal(modalName) {
        const modal = document.getElementById(`${modalName}Modal`);
        if (modal) modal.classList.add('active');
        if (modalName === 'addTransaction') {
            const dateInput = document.getElementById('transactionDate');
            if(dateInput) dateInput.valueAsDate = new Date();
        }
    }

    hideModal(modalName) {
        const modal = document.getElementById(`${modalName}Modal`);
        if (modal) modal.classList.remove('active');
    }

    formatCurrency(amount, currencyCode) {
        const code = currencyCode || this.app.currencyManager.currentCurrency;
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
        } catch (e) {
            // Fallback for unknown currency codes
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// =================================
// 8. App (Main Class)
// =================================
export class App {
    constructor() {
        this.transactionManager = new TransactionManager();
        this.budgetManager = new BudgetManager();
        this.goalManager = new GoalManager();
        this.uiManager = new UIManager(this);
        this.currencyManager = new CurrencyManager(this.uiManager);
        this.init();
    }

    async init() {
        console.log("Finance Tracker Initializing...");
        await this.currencyManager.init();
        this.uiManager.init();
        console.log("Initialization Complete.");
    }
    
    removeItem(type, id) {
        switch(type) {
            case 'transaction': this.transactionManager.remove(id); break;
            case 'budget': this.budgetManager.remove(id); break;
            case 'goal': this.goalManager.remove(id); break;
        }
    }

    showModal(modalName) { this.uiManager.showModal(modalName); }
    hideModal(modalName) { this.uiManager.hideModal(modalName); }
    linkAccount() { alert('This is a simulated feature. A real implementation requires a secure backend server.'); }
}