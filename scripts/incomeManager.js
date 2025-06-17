// scripts/incomeManager.js

const INCOME_KEY = 'monthlyIncome';

/**
 * Retrieves the monthly income from localStorage.
 * @returns {number} The stored income, or 0 if not set.
 */
export function getIncome() {
    return parseFloat(localStorage.getItem(INCOME_KEY)) || 0;
}

/**
 * Saves the monthly income to localStorage and notifies the app of the change.
 * @param {number} income - The income amount to save.
 */
export function setIncome(income) {
    if (typeof income === 'number' && income >= 0) {
        localStorage.setItem(INKEY, income.toString());
        // Dispatch a custom event so other parts of the app can react instantly.
        window.dispatchEvent(new CustomEvent('incomeUpdated'));
    } else {
        console.error("Invalid income amount provided.");
    }
}