// components/footer.js
export function renderFooter() {
    return `
      <footer class="footer">
        <p>
          <span id="datetime"></span><br />
          Munyaradzi Chiondegwa | Zimbabwe | WDD330 Project: Personal Finance Tracker
        </p>
      </footer>
    `;
  }
  
  export function updateFooterTime() {
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      datetimeElement.textContent = `Last updated: ${now.toLocaleDateString('en-US', options)}`;
    }
  }