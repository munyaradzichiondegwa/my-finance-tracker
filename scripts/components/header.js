// components/header.js
export function renderHeader(title = "Dashboard") {
    const currencies = [
      "USD", "EUR", "GBP", "CAD", "AUD",
      "ZAR", "BWP", "ZWG", "CNY", "JPY",
      "KES", "NGN", "INR", "CHF", "NZD"
    ];
  
    return `
      <header class="header">
        <div class="header-left">
          <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <i class="fas fa-bars"></i>
          </button>
          <h1 class="page-title" id="pageTitle">${title}</h1>
        </div>
        <div class="header-right">
          <select class="currency-selector" id="currencySelector" title="Select currency" aria-label="Select currency">
            ${currencies.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      </header>
    `;
  }