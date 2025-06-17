// components/sidebar.js
export function renderSidebar(activePage = "dashboard") {
    const navItems = [
      { href: 'index.html', view: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
      { href: 'transactions.html', view: 'transactions', icon: 'fa-exchange-alt', label: 'Transactions' },
      { href: 'budgets.html', view: 'budgets', icon: 'fa-chart-pie', label: 'Budgets' },
      { href: 'goals.html', view: 'goals', icon: 'fa-bullseye', label: 'Savings Goals' },
      { href: 'accounts.html', view: 'accounts', icon: 'fa-university', label: 'Accounts' }
    ];
  
    const renderNavItem = (item) => {
      const isActive = item.view === activePage ? "active" : "";
      return `
        <a href="${item.href}" class="nav-item ${isActive}" data-view="${item.view}">
          <i class="fas ${item.icon}"></i><span>${item.label}</span>
        </a>`;
    };
  
    return `
      <nav class="sidebar" id="sidebar">
          <div class="sidebar-header">
              <div class="logo">
                  <picture>
                      <source srcset="images/logo-dark.png, images/logo-dark@2x.png 2x" media="(prefers-color-scheme: dark)">
                      <img src="images/finance-tracker.png" srcset="images/logo-light@2x.png 2x" alt="Finance Tracker Logo" class="logo-img" />
                  </picture>
                  <span>Finance Tracker</span>
              </div>
          </div>
          <div class="nav-menu">
              ${navItems.map(renderNavItem).join('')}
          </div>
      </nav>
    `;
  }