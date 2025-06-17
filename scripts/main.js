// scripts/main.js
import { renderHeader } from './components/header.js';
import { renderSidebar } from './components/sidebar.js';
import { renderFooter, updateFooterTime } from './components/footer.js';
import { renderModals } from './components/modals.js';
import { App } from './scripts.js'; // Correct relative path

// Page configuration
const pages = {
    'index.html': { view: 'dashboard', title: 'Dashboard' },
    'transactions.html': { view: 'transactions', title: 'Transactions' },
    'budgets.html': { view: 'budgets', title: 'Budgets' },
    'goals.html': { view: 'goals', title: 'Savings Goals' },
    'accounts.html': { view: 'accounts', title: 'Accounts' }
};

// Function to get the current page key
function getCurrentPageKey() {
    const path = window.location.pathname.split("/").pop();
    // In Vite dev server, the root path is '/', not 'index.html'
    return path === '' || path === '/' ? 'index.html' : path;
}

// Main render function
function renderLayout() {
    const pageKey = getCurrentPageKey();
    const config = pages[pageKey] || pages['index.html'];

    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error('Fatal Error: #app-container not found.');
        return;
    }

    // This is the main content area specific to each page
    const mainContentHtml = `
        <main class="main-content" id="mainContent">
            ${renderHeader(config.title)}
            <div class="content" id="content-area">
                <!-- Page-specific content will be injected here by UIManager -->
                <div class="loading"><div class="spinner"></div></div>
            </div>
            ${renderFooter()}
        </main>
    `;

    // Full page layout
    appContainer.innerHTML = `
        ${renderSidebar(config.view)}
        ${mainContentHtml}
        ${renderModals()}
    `;

    // Set footer time
    updateFooterTime();
    setInterval(updateFooterTime, 60000); // Update every minute
}

// DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    // Render the basic structure first
    renderLayout();

    // Then, initialize the application logic which will populate the content area
    if (typeof App !== 'undefined') {
        window.app = new App();
    } else {
        console.error("App class not found. Make sure it's exported from scripts.js");
    }
});
