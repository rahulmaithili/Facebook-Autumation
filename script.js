/**
 * ==============================================================================
 * FACEBOOK AUTOMATION DASHBOARD - JAVASCRIPT LOGIC (script.js)
 * Plain Vanilla JS - No external frameworks
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const webAppUrlInput = document.getElementById('webAppUrl');
  const topicInput = document.getElementById('topicInput');
  const generateBtn = document.getElementById('generateBtn');
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  
  const resultPreview = document.getElementById('resultPreview');
  const previewPostId = document.getElementById('previewPostId');
  const previewCaption = document.getElementById('previewCaption');
  
  const logsTableBody = document.getElementById('logsTableBody');
  const systemStatus = document.getElementById('systemStatus');

  // LocalStorage Key
  const STORAGE_KEY = 'fb_automation_webapp_url';

  // 1. Initialize Saved Web App URL
  const savedUrl = localStorage.getItem(STORAGE_KEY);
  if (savedUrl) {
    webAppUrlInput.value = savedUrl;
  }

  // Save URL when changed
  webAppUrlInput.addEventListener('input', () => {
    const url = webAppUrlInput.value.trim();
    if (url) {
      localStorage.setItem(STORAGE_KEY, url);
    }
  });

  // 2. Fetch Logs automatically on page load if Web App URL exists
  if (webAppUrlInput.value.trim()) {
    fetchLogs();
  } else {
    logsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4" style="color: var(--text-muted);">
          <i class="fa-solid fa-circle-exclamation"></i> Kripya upar Google Apps Script Web App URL daalein.
        </td>
      </tr>
    `;
  }

  // 3. Event Listener: Generate & Post Now Button
  generateBtn.addEventListener('click', async () => {
    const webAppUrl = webAppUrlInput.value.trim();
    const topic = topicInput.value.trim();

    if (!webAppUrl) {
      alert('Kripya pehle Google Apps Script Web App URL fill karein!');
      webAppUrlInput.focus();
      return;
    }

    // Set UI State: Processing
    setLoadingState(true, 'AI Post Generate ho raha hai... Isme 15-30 seconds lag sakte hain. Kripya wait karein.');

    try {
      /**
       * IMPORTANT CORS BEST PRACTICE:
       * Content-Type: 'text/plain' use kar rahe hain taaki Google Apps Script 
       * ke saath browser CORS preflight (OPTIONS) block na ho.
       */
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'run_automation',
          topic: topic
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Show Success UI
        setSuccessState('Published Successfully!', result.message || 'Facebook Page par photo post ho gaya hai!');
        
        // Show Content Preview
        resultPreview.classList.remove('hidden');
        previewPostId.textContent = `Post ID: ${result.postId || 'N/A'}`;
        previewCaption.textContent = result.caption || 'N/A';

        // Auto Refresh Logs Table
        fetchLogs();
      } else {
        // Show Error UI
        setErrorState('Automation Failed', result.message || 'Ek unknown error aaya.');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setErrorState('Network / Server Error', err.message || 'Apps Script Web App se connect nahi ho paya. URL check karein.');
    } finally {
      setLoadingState(false);
    }
  });

  // 4. Event Listener: Refresh Logs Button
  refreshLogsBtn.addEventListener('click', () => {
    fetchLogs();
  });

  // Helper Function: Fetch Logs from Backend
  async function fetchLogs() {
    const webAppUrl = webAppUrlInput.value.trim();

    if (!webAppUrl) return;

    refreshLogsBtn.disabled = true;
    refreshLogsBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...`;

    try {
      // POST request with text/plain to fetch logs safely
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'get_logs'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && Array.isArray(result.data)) {
        renderLogsTable(result.data);
      } else {
        logsTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center py-4" style="color: var(--danger-color);">
              <i class="fa-solid fa-triangle-exclamation"></i> Logs load nahi ho sake: ${result.message || 'Unknown error'}
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error('Fetch Logs Error:', err);
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4" style="color: var(--danger-color);">
            <i class="fa-solid fa-triangle-exclamation"></i> Logs fetch fail: ${err.message}
          </td>
        </tr>
      `;
    } finally {
      refreshLogsBtn.disabled = false;
      refreshLogsBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Refresh Logs`;
    }
  }

  // Helper Function: Render Logs inside HTML Table
  function renderLogsTable(logs) {
    if (!logs || logs.length === 0) {
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4" style="color: var(--text-muted);">
            Koi past automation logs nahi mile.
          </td>
        </tr>
      `;
      return;
    }

    const rowsHtml = logs.map(log => {
      const isSuccess = log.status === 'SUCCESS';
      const statusClass = isSuccess ? 'SUCCESS' : 'FAILED';

      return `
        <tr>
          <td><i class="fa-regular fa-clock"></i> ${escapeHtml(log.timestamp || '')}</td>
          <td><span class="status-tag ${statusClass}">${escapeHtml(log.status || '')}</span></td>
          <td title="${escapeHtml(log.caption || '')}">${escapeHtml(log.caption || '-')}</td>
          <td><code>${escapeHtml(log.postId || '-')}</code></td>
        </tr>
      `;
    }).join('');

    logsTableBody.innerHTML = rowsHtml;
  }

  // Helper Functions: UI State Updaters
  function setLoadingState(isLoading, message = '') {
    if (isLoading) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Automation...`;
      
      statusBox.className = 'status-box loading';
      statusBox.querySelector('.status-icon').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
      statusTitle.textContent = 'Automation Running';
      statusMessage.textContent = message;

      resultPreview.classList.add('hidden');
    } else {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Generate & Post Now`;
    }
  }

  function setSuccessState(title, message) {
    statusBox.className = 'status-box success';
    statusBox.querySelector('.status-icon').innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success-color);"></i>`;
    statusTitle.textContent = title;
    statusMessage.textContent = message;
  }

  function setErrorState(title, message) {
    statusBox.className = 'status-box error';
    statusBox.querySelector('.status-icon').innerHTML = `<i class="fa-solid fa-circle-xmark" style="color: var(--danger-color);"></i>`;
    statusTitle.textContent = title;
    statusMessage.textContent = message;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
