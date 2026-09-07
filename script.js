/**
 * ==============================================================================
 * FACEBOOK AUTOMATION DASHBOARD - JAVASCRIPT LOGIC (script.js)
 * Plain Vanilla JS with Interactive Workflow Diagram, FB SDK 1-Click Login & Dynamic Credentials
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const webAppUrlInput = document.getElementById('webAppUrl');
  const topicInput = document.getElementById('topicInput');
  const generateBtn = document.getElementById('generateBtn');
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  
  const toggleConfigBtn = document.getElementById('toggleConfigBtn');
  const configPanel = document.getElementById('configPanel');
  const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
  const fbLoginBtn = document.getElementById('fbLoginBtn');
  const pageSelectContainer = document.getElementById('pageSelectContainer');
  const fbPageSelect = document.getElementById('fbPageSelect');
  
  // Custom Credentials Inputs
  const cfgFbAppId = document.getElementById('cfgFbAppId');
  const cfgGeminiKey = document.getElementById('cfgGeminiKey');
  const cfgFbPageId = document.getElementById('cfgFbPageId');
  const cfgFbToken = document.getElementById('cfgFbToken');
  const cfgSheetId = document.getElementById('cfgSheetId');

  // Status & Preview
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  
  const resultPreview = document.getElementById('resultPreview');
  const previewPostId = document.getElementById('previewPostId');
  const previewCaption = document.getElementById('previewCaption');
  
  const logsTableBody = document.getElementById('logsTableBody');

  // LocalStorage Keys
  const STORAGE_KEY_WEBAPP = 'fb_automation_webapp_url';
  const STORAGE_KEY_CREDS = 'fb_automation_credentials';
  const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxQ-vbzy60GwVdAzpiF_Hq4-AOsrpEnQdWdFKJdaEXcrcOadGM9O47CPYxl0ENnaygF/exec';

  // 1. Initialize Saved Web App URL & Custom Credentials
  const savedUrl = localStorage.getItem(STORAGE_KEY_WEBAPP);
  if (savedUrl) {
    webAppUrlInput.value = savedUrl;
  } else if (!webAppUrlInput.value) {
    webAppUrlInput.value = DEFAULT_WEBAPP_URL;
  }

  webAppUrlInput.addEventListener('input', () => {
    const url = webAppUrlInput.value.trim();
    if (url) localStorage.setItem(STORAGE_KEY_WEBAPP, url);
  });

  // Load Saved Credentials from LocalStorage
  const savedCredsRaw = localStorage.getItem(STORAGE_KEY_CREDS);
  if (savedCredsRaw) {
    try {
      const savedCreds = JSON.parse(savedCredsRaw);
      if (savedCreds.fbAppId) cfgFbAppId.value = savedCreds.fbAppId;
      if (savedCreds.geminiApiKey) cfgGeminiKey.value = savedCreds.geminiApiKey;
      if (savedCreds.fbPageId) cfgFbPageId.value = savedCreds.fbPageId;
      if (savedCreds.fbAccessToken) cfgFbToken.value = savedCreds.fbAccessToken;
      if (savedCreds.logSheetId) cfgSheetId.value = savedCreds.logSheetId;
    } catch(e) {}
  }

  // Toggle Password Input Visibility
  document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        const isPwd = targetInput.type === 'password';
        targetInput.type = isPwd ? 'text' : 'password';
        btn.innerHTML = isPwd ? `<i class="fa-solid fa-eye-slash"></i>` : `<i class="fa-solid fa-eye"></i>`;
      }
    });
  });

  // Toggle Credentials Panel
  toggleConfigBtn.addEventListener('click', () => {
    configPanel.classList.toggle('hidden');
    toggleConfigBtn.classList.toggle('active');
  });

  // 2. FACEBOOK SDK 1-CLICK DIRECT LOGIN INTEGRATION
  window.fbAsyncInit = function() {
    const appId = cfgFbAppId.value.trim() || '966242223397117'; // Fallback default Meta App ID
    if (window.FB) {
      window.FB.init({
        appId      : appId,
        cookie     : true,
        xfbml      : true,
        version    : 'v20.0'
      });
    }
  };

  fbLoginBtn.addEventListener('click', () => {
    const appId = cfgFbAppId.value.trim() || '966242223397117';

    if (!window.FB) {
      alert('Facebook SDK load ho raha hai... Kripya 2 seconds baad click karein.');
      return;
    }

    window.FB.init({
      appId      : appId,
      cookie     : true,
      xfbml      : true,
      version    : 'v20.0'
    });

    fbLoginBtn.disabled = true;
    fbLoginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting Facebook...`;

    window.FB.login(function(response) {
      if (response.authResponse) {
        // Fetch user's managed Facebook Pages
        window.FB.api('/me/accounts', function(pagesResponse) {
          fbLoginBtn.disabled = false;
          fbLoginBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Facebook Connected!`;

          if (pagesResponse && pagesResponse.data && pagesResponse.data.length > 0) {
            populateFbPagesDropdown(pagesResponse.data);
          } else {
            alert('Aapke Facebook Account me koi managed Page nahi mila ya permission reject ho gayi.');
          }
        });
      } else {
        fbLoginBtn.disabled = false;
        fbLoginBtn.innerHTML = `<i class="fa-brands fa-facebook-f"></i> Connect Facebook Page`;
        alert('Facebook Login cancel kar diya gaya ya authorization error aaya.');
      }
    }, {
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list'
    });
  });

  function populateFbPagesDropdown(pages) {
    pageSelectContainer.classList.remove('hidden');
    fbPageSelect.innerHTML = `<option value="">-- Choose Facebook Page --</option>`;

    pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = `${page.name} (ID: ${page.id})`;
      option.dataset.token = page.access_token;
      fbPageSelect.appendChild(option);
    });

    // Auto-select first page if available
    if (pages.length > 0) {
      fbPageSelect.selectedIndex = 1;
      applySelectedPage(pages[0].id, pages[0].access_token);
    }

    fbPageSelect.addEventListener('change', () => {
      const selectedOpt = fbPageSelect.options[fbPageSelect.selectedIndex];
      if (selectedOpt && selectedOpt.value) {
        applySelectedPage(selectedOpt.value, selectedOpt.dataset.token);
      }
    });
  }

  function applySelectedPage(pageId, pageAccessToken) {
    cfgFbPageId.value = pageId;
    cfgFbToken.value = pageAccessToken;
    
    // Save credentials automatically
    const creds = {
      fbAppId: cfgFbAppId.value.trim(),
      geminiApiKey: cfgGeminiKey.value.trim(),
      fbPageId: pageId,
      fbAccessToken: pageAccessToken,
      logSheetId: cfgSheetId.value.trim()
    };
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
    
    alert(`✅ Facebook Page Connected: ${pageId}\nPage Access Token aur Page ID automatic fill & save ho gaye!`);
  }

  // Save Credentials Button Handler
  saveCredentialsBtn.addEventListener('click', async () => {
    const creds = {
      fbAppId: cfgFbAppId.value.trim(),
      geminiApiKey: cfgGeminiKey.value.trim(),
      fbPageId: cfgFbPageId.value.trim(),
      fbAccessToken: cfgFbToken.value.trim(),
      logSheetId: cfgSheetId.value.trim()
    };

    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));

    const webAppUrl = webAppUrlInput.value.trim();
    if (!webAppUrl) {
      alert('Credentials browser me save ho gaye!');
      return;
    }

    saveCredentialsBtn.disabled = true;
    saveCredentialsBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving to Backend...`;

    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_config',
          ...creds
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert('✅ API Credentials Apps Script Properties & Browser me successfully save ho gaye!');
      } else {
        alert('⚠️ Warning: ' + result.message);
      }
    } catch(err) {
      console.error(err);
      alert('Credentials browser me save ho gaye! (Backend sync failed: ' + err.message + ')');
    } finally {
      saveCredentialsBtn.disabled = false;
      saveCredentialsBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Credentials to Backend`;
    }
  });

  // 3. Fetch Logs automatically on page load
  if (webAppUrlInput.value.trim()) {
    fetchLogs();
  }

  // 4. Automation Execution & Workflow Node Animation
  generateBtn.addEventListener('click', async () => {
    const webAppUrl = webAppUrlInput.value.trim();
    const topic = topicInput.value.trim();

    if (!webAppUrl) {
      alert('Kripya pehle Google Apps Script Web App URL fill karein!');
      webAppUrlInput.focus();
      return;
    }

    const customCreds = {
      geminiApiKey: cfgGeminiKey.value.trim(),
      fbPageId: cfgFbPageId.value.trim(),
      fbAccessToken: cfgFbToken.value.trim(),
      logSheetId: cfgSheetId.value.trim()
    };

    resetWorkflowUI();

    setWorkflowNode('node-trigger', 'running', 'Active');
    setLoadingState(true, 'AI Post Automation Process start ho raha hai...');

    let stepTimer = setTimeout(() => {
      setWorkflowNode('node-trigger', 'done', 'Completed');
      setWorkflowNode('node-gemini', 'running', 'Generating...');
      updateWorkflowLine(1);
    }, 1500);

    let stepTimer2 = setTimeout(() => {
      setWorkflowNode('node-gemini', 'done', 'Caption Ready');
      setWorkflowNode('node-imagen', 'running', 'Creating Image...');
      updateWorkflowLine(2);
    }, 6000);

    let stepTimer3 = setTimeout(() => {
      setWorkflowNode('node-imagen', 'done', 'Artwork Ready');
      setWorkflowNode('node-facebook', 'running', 'Publishing...');
      updateWorkflowLine(3);
    }, 15000);

    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'run_automation',
          topic: topic,
          ...customCreds
        })
      });

      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setWorkflowNode('node-trigger', 'done', 'Completed');
        setWorkflowNode('node-gemini', 'done', 'Caption Ready');
        setWorkflowNode('node-imagen', 'done', 'Artwork Ready');
        setWorkflowNode('node-facebook', 'done', 'Published');
        setWorkflowNode('node-sheets', 'done', 'Logged');
        updateWorkflowLine(4);

        setSuccessState('Published Successfully!', result.message || 'Facebook Page par photo post published!');
        
        resultPreview.classList.remove('hidden');
        previewPostId.textContent = `Post ID: ${result.postId || 'N/A'}`;
        previewCaption.textContent = result.caption || 'N/A';

        fetchLogs();
      } else {
        setWorkflowNode('node-gemini', 'failed', 'Error');
        setErrorState('Automation Failed', result.message || 'Ek error aaya.');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setWorkflowNode('node-trigger', 'failed', 'Error');
      setErrorState('Network / Server Error', err.message || 'Apps Script Web App se connection fail.');
    } finally {
      setLoadingState(false);
    }
  });

  refreshLogsBtn.addEventListener('click', () => {
    fetchLogs();
  });

  async function fetchLogs() {
    const webAppUrl = webAppUrlInput.value.trim();
    if (!webAppUrl) return;

    const customCreds = {
      logSheetId: cfgSheetId.value.trim()
    };

    refreshLogsBtn.disabled = true;
    refreshLogsBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...`;

    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'get_logs',
          ...customCreds
        })
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
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

  function renderLogsTable(logs) {
    if (!logs || logs.length === 0) {
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4" style="color: var(--text-muted);">
            Koi past automation logs nahi me mile.
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

  function resetWorkflowUI() {
    document.querySelectorAll('.wf-node').forEach(node => {
      node.className = 'wf-node';
      const badge = node.querySelector('.wf-status-badge');
      if (badge) {
        badge.className = 'wf-status-badge idle';
        badge.textContent = 'Idle';
      }
    });
    document.querySelectorAll('.wf-line').forEach(line => line.classList.remove('active'));
  }

  function setWorkflowNode(nodeId, state, label) {
    const node = document.getElementById(nodeId);
    if (!node) return;
    node.className = `wf-node ${state === 'running' ? 'active' : state}`;
    const badge = node.querySelector('.wf-status-badge');
    if (badge) {
      badge.className = `wf-status-badge ${state}`;
      badge.textContent = label;
    }
  }

  function updateWorkflowLine(stepIndex) {
    const lines = document.querySelectorAll('.wf-line');
    lines.forEach((line, idx) => {
      if (idx < stepIndex) line.classList.add('active');
    });
  }

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
