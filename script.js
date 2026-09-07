/**
 * ==============================================================================
 * FACEBOOK AUTOMATION DASHBOARD PRO - JAVASCRIPT LOGIC (script.js)
 * Collapsible Sidebar, Toast Engine, Ultra-Premium Custom Modals, Direct OAuth Connect
 * ==============================================================================
 */

// Detect OAuth Redirect Callback (if running inside popup)
if (window.location.hash && window.location.hash.includes('access_token=')) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  if (accessToken && window.opener) {
    window.opener.postMessage({ type: 'FB_OAUTH_TOKEN', token: accessToken }, '*');
    window.close();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Sidebar & Nav
  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  const fbAuthLabel = document.getElementById('fbAuthLabel');
  const fbAuthActionBtn = document.getElementById('fbAuthActionBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Dashboard Controls
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

  // Node Modal Elements
  const nodeModal = document.getElementById('nodeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveModalBtn = document.getElementById('saveModalBtn');

  // Custom Prompt Input Modal Elements
  const customPromptModal = document.getElementById('customPromptModal');
  const promptModalTitle = document.getElementById('promptModalTitle');
  const promptModalDesc = document.getElementById('promptModalDesc');
  const promptInputVal = document.getElementById('promptInputVal');
  const closePromptModalBtn = document.getElementById('closePromptModalBtn');
  const cancelPromptModalBtn = document.getElementById('cancelPromptModalBtn');
  const submitPromptModalBtn = document.getElementById('submitPromptModalBtn');

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
  const STORAGE_KEY_SIDEBAR = 'fb_sidebar_collapsed';
  const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxQ-vbzy60GwVdAzpiF_Hq4-AOsrpEnQdWdFKJdaEXcrcOadGM9O47CPYxl0ENnaygF/exec';
  const DEFAULT_FB_APP_ID = '966242223397117';

  let currentActiveNode = null;
  let promptCallback = null;

  // 1. SIDEBAR TOGGLE & NAV HANDLERS
  const isSidebarCollapsed = localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true';
  if (isSidebarCollapsed) {
    document.body.classList.add('sidebar-collapsed');
  }

  sidebarToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-collapsed');
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem(STORAGE_KEY_SIDEBAR, collapsed);
  });

  mobileSidebarToggle.addEventListener('click', () => {
    document.body.classList.toggle('mobile-sidebar-open');
  });

  // Smooth Scroll & Active Link highlighting
  document.querySelectorAll('.sidebar-nav .nav-item[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
      link.classList.add('active');

      if (targetId === '#configPanel') {
        configPanel.classList.remove('hidden');
      }

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.innerWidth <= 992) {
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    });
  });

  // 2. TOAST NOTIFICATION ENGINE
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconHtml = '<i class="fa-solid fa-circle-info toast-icon"></i>';
    if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check toast-icon"></i>';
    if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-xmark toast-icon"></i>';
    if (type === 'warning') iconHtml = '<i class="fa-solid fa-triangle-exclamation toast-icon"></i>';

    toast.innerHTML = `
      ${iconHtml}
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  // 3. ULTRA-PREMIUM CUSTOM PROMPT MODAL
  function openCustomPrompt(title, desc, placeholder, initialVal, onConfirm) {
    promptModalTitle.innerHTML = `<i class="fa-brands fa-facebook" style="color: var(--fb-blue);"></i> ${escapeHtml(title)}`;
    promptModalDesc.textContent = desc;
    promptInputVal.placeholder = placeholder || '';
    promptInputVal.value = initialVal || '';
    promptCallback = onConfirm;

    customPromptModal.classList.remove('hidden');
    setTimeout(() => promptInputVal.focus(), 100);
  }

  function closeCustomPrompt() {
    customPromptModal.classList.add('hidden');
    promptCallback = null;
  }

  closePromptModalBtn.addEventListener('click', closeCustomPrompt);
  cancelPromptModalBtn.addEventListener('click', closeCustomPrompt);

  submitPromptModalBtn.addEventListener('click', () => {
    const val = promptInputVal.value.trim();
    if (promptCallback) promptCallback(val);
    closeCustomPrompt();
  });

  promptInputVal.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      submitPromptModalBtn.click();
    }
  });

  // 4. INITIALIZE SAVED DATA
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
      
      updateFbAuthStatus(Boolean(savedCreds.fbAccessToken));
    } catch(e) {}
  }

  function updateFbAuthStatus(isConnected) {
    if (isConnected) {
      fbAuthLabel.textContent = 'FB Connected';
      fbAuthActionBtn.textContent = 'Logout';
      fbAuthActionBtn.className = 'auth-btn btn-logout';
    } else {
      fbAuthLabel.textContent = 'FB Disconnected';
      fbAuthActionBtn.textContent = 'Login';
      fbAuthActionBtn.className = 'auth-btn btn-login';
    }
  }

  fbAuthActionBtn.addEventListener('click', () => {
    const isConnected = fbAuthLabel.textContent.includes('Connected');
    if (isConnected) {
      cfgFbToken.value = '';
      cfgFbPageId.value = '';
      const creds = JSON.parse(localStorage.getItem(STORAGE_KEY_CREDS) || '{}');
      delete creds.fbAccessToken;
      delete creds.fbPageId;
      localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
      updateFbAuthStatus(false);
      showToast('Facebook Logged Out', 'Page Access Token remove kar diya gaya.', 'info');
    } else {
      configPanel.classList.remove('hidden');
      configPanel.scrollIntoView({ behavior: 'smooth' });
      handlePabblyFbConnect();
    }
  });

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

  // 5. FACEBOOK DIRECT CONNECT (Instant Login Popup without prompt modal)
  fbLoginBtn.addEventListener('click', handlePabblyFbConnect);

  function handlePabblyFbConnect() {
    const appId = cfgFbAppId.value.trim() || DEFAULT_FB_APP_ID;
    launchFbOAuthPopup(appId);
  }

  function launchFbOAuthPopup(appId) {
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list';
    const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;

    fbLoginBtn.disabled = true;
    fbLoginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Opening Facebook Popup...`;

    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    const popup = window.open(oauthUrl, 'FB_OAuth_Popup', `width=${width},height=${height},top=${top},left=${left}`);

    const messageListener = (event) => {
      if (event.data && event.data.type === 'FB_OAUTH_TOKEN') {
        window.removeEventListener('message', messageListener);
        const userAccessToken = event.data.token;
        fetchFbPages(userAccessToken);
      }
    };
    window.addEventListener('message', messageListener);

    const checkPopupInt = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopupInt);
        fbLoginBtn.disabled = false;
        fbLoginBtn.innerHTML = `<i class="fa-brands fa-facebook-f"></i> Direct OAuth Login`;
      }
    }, 1000);
  }

  async function fetchFbPages(userToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}`);
      const json = await response.json();

      fbLoginBtn.disabled = false;
      fbLoginBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected!`;

      if (json.data && json.data.length > 0) {
        populateFbPagesDropdown(json.data);
      } else {
        showToast('No Managed Pages', 'Aapke Facebook Account me koi Page nahi mila.', 'warning');
      }
    } catch(err) {
      console.error(err);
      showToast('Fetch Failed', 'Pages fetch error: ' + err.message, 'error');
      fbLoginBtn.disabled = false;
      fbLoginBtn.innerHTML = `<i class="fa-brands fa-facebook-f"></i> Direct OAuth Login`;
    }
  }

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
    
    const creds = {
      fbAppId: cfgFbAppId.value.trim(),
      geminiApiKey: cfgGeminiKey.value.trim(),
      fbPageId: pageId,
      fbAccessToken: pageAccessToken,
      logSheetId: cfgSheetId.value.trim()
    };
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
    updateFbAuthStatus(true);
    
    showToast('Facebook Page Connected', `Page ID ${pageId} successfully saved!`, 'success');
  }

  // 6. CLICKABLE WORKFLOW NODES & CONFIGURATION MODAL
  document.querySelectorAll('.wf-node.clickable').forEach(node => {
    node.addEventListener('click', () => {
      const nodeType = node.getAttribute('data-node');
      openNodeModal(nodeType);
    });
  });

  closeModalBtn.addEventListener('click', closeNodeModal);
  cancelModalBtn.addEventListener('click', closeNodeModal);

  function closeNodeModal() {
    nodeModal.classList.add('hidden');
    currentActiveNode = null;
  }

  function openNodeModal(nodeType) {
    currentActiveNode = nodeType;
    nodeModal.classList.remove('hidden');

    if (nodeType === 'trigger') {
      modalTitle.innerHTML = `<i class="fa-solid fa-calendar-check" style="color: #2ecc71;"></i> Configure Step 1: Trigger & Schedule`;
      modalBody.innerHTML = `
        <div class="form-group">
          <label><i class="fa-solid fa-clock"></i> Execution Mode</label>
          <select id="mTriggerMode" class="form-select">
            <option value="manual">Manual Trigger (Instant Dashboard Click)</option>
            <option value="cron">Automated Time-Driven Cron (Daily/Hourly)</option>
          </select>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-lightbulb"></i> Default Post Topic Preset</label>
          <input type="text" id="mTopicPreset" value="${topicInput.value || ''}" placeholder="e.g. Funny Relatable Memes, Tech Growth...">
          <small class="help-text">Agar blank chhodenge toh AI auto-select karega.</small>
        </div>
      `;
    } else if (nodeType === 'gemini') {
      modalTitle.innerHTML = `<i class="fa-solid fa-brain" style="color: #3498db;"></i> Configure Step 2: Gemini AI Caption`;
      modalBody.innerHTML = `
        <div class="form-group">
          <label><i class="fa-solid fa-microchip"></i> Model Selected</label>
          <input type="text" value="gemini-2.0-flash (Recommended)" disabled readonly>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-key"></i> Gemini API Key</label>
          <input type="password" id="mGeminiKey" value="${cfgGeminiKey.value || ''}" placeholder="AIzaSy...">
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-pen-nib"></i> Custom System Prompt Style</label>
          <textarea id="mPromptStyle" placeholder="Write friendly engaging caption with emojis & 4 hashtags...">Write an engaging, high-performing Facebook post caption with emojis and relevant hashtags.</textarea>
        </div>
      `;
    } else if (nodeType === 'imagen') {
      modalTitle.innerHTML = `<i class="fa-solid fa-image" style="color: #9b59b6;"></i> Configure Step 3: Imagen Image AI`;
      modalBody.innerHTML = `
        <div class="form-group">
          <label><i class="fa-solid fa-palette"></i> Image Generator Model</label>
          <input type="text" value="imagen-3.0-generate-002" disabled readonly>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-crop"></i> Aspect Ratio</label>
          <select id="mAspectRatio" class="form-select">
            <option value="1:1" selected>1:1 Square (Social Media Standard)</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="4:5">4:5 Vertical Portrait</option>
          </select>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-paintbrush"></i> Artwork Style Preset</label>
          <select id="mArtStyle" class="form-select">
            <option value="graphic" selected>Vibrant Graphic Illustration</option>
            <option value="photo">Realistic High-Res Photography</option>
            <option value="3d">Modern 3D Render Art</option>
            <option value="minimalist">Clean Minimalist Vector Art</option>
          </select>
        </div>
      `;
    } else if (nodeType === 'facebook') {
      modalTitle.innerHTML = `<i class="fa-brands fa-facebook" style="color: #1877f2;"></i> Configure Step 4: Facebook Page Publishing`;
      modalBody.innerHTML = `
        <div class="mb-3">
          <button id="mFbLoginBtn" class="btn btn-facebook btn-block">
            <i class="fa-brands fa-facebook-f"></i> Direct Facebook Connect
          </button>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-id-card"></i> Facebook Page ID</label>
          <input type="text" id="mFbPageId" value="${cfgFbPageId.value || ''}" placeholder="100064529012345">
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-shield-halved"></i> Facebook Page Access Token</label>
          <input type="password" id="mFbToken" value="${cfgFbToken.value || ''}" placeholder="EAAX...">
        </div>
      `;

      setTimeout(() => {
        const mBtn = document.getElementById('mFbLoginBtn');
        if (mBtn) mBtn.addEventListener('click', handlePabblyFbConnect);
      }, 100);
    } else if (nodeType === 'sheets') {
      modalTitle.innerHTML = `<i class="fa-solid fa-table" style="color: #0f9d58;"></i> Configure Step 5: Google Sheets Logger`;
      modalBody.innerHTML = `
        <div class="form-group">
          <label><i class="fa-solid fa-file-excel"></i> Google Sheet Log ID</label>
          <input type="text" id="mSheetId" value="${cfgSheetId.value || '1DfQmhNSSGV5dZnlI2-eD-V8-E0h5FJM7o1EoleNiA5OwMcNZY9UkG_sI'}">
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-external-link"></i> Direct Sheet Access</label>
          <a href="https://docs.google.com/spreadsheets/d/${cfgSheetId.value || '1DfQmhNSSGV5dZnlI2-eD-V8-E0h5FJM7o1EoleNiA5OwMcNZY9UkG_sI'}" target="_blank" class="btn btn-outline btn-block">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Google Sheet in Browser
          </a>
        </div>
      `;
    }
  }

  saveModalBtn.addEventListener('click', () => {
    if (!currentActiveNode) return;

    if (currentActiveNode === 'trigger') {
      const topicVal = document.getElementById('mTopicPreset');
      if (topicVal) topicInput.value = topicVal.value;
    } else if (currentActiveNode === 'gemini') {
      const gKey = document.getElementById('mGeminiKey');
      if (gKey && gKey.value) cfgGeminiKey.value = gKey.value;
    } else if (currentActiveNode === 'facebook') {
      const pId = document.getElementById('mFbPageId');
      const pTok = document.getElementById('mFbToken');
      if (pId && pId.value) cfgFbPageId.value = pId.value;
      if (pTok && pTok.value) cfgFbToken.value = pTok.value;
    } else if (currentActiveNode === 'sheets') {
      const sId = document.getElementById('mSheetId');
      if (sId && sId.value) cfgSheetId.value = sId.value;
    }

    const creds = {
      fbAppId: cfgFbAppId.value.trim(),
      geminiApiKey: cfgGeminiKey.value.trim(),
      fbPageId: cfgFbPageId.value.trim(),
      fbAccessToken: cfgFbToken.value.trim(),
      logSheetId: cfgSheetId.value.trim()
    };
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));

    showToast('Step Saved', 'Step Settings successfully save ho gaye!', 'success');
    closeNodeModal();
  });

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
      showToast('Saved Locally', 'Credentials browser me save ho gaye!', 'info');
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
        showToast('Backend Synced', 'API Credentials Apps Script Properties me save ho gaye!', 'success');
      } else {
        showToast('Warning', result.message, 'warning');
      }
    } catch(err) {
      console.error(err);
      showToast('Saved Locally', 'Credentials browser me save ho gaye (Sync fail).', 'info');
    } finally {
      saveCredentialsBtn.disabled = false;
      saveCredentialsBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Credentials to Backend`;
    }
  });

  // 7. Fetch Logs automatically on page load
  if (webAppUrlInput.value.trim()) {
    fetchLogs();
  }

  // 8. Automation Execution & Workflow Node Animation
  generateBtn.addEventListener('click', async () => {
    const webAppUrl = webAppUrlInput.value.trim();
    const topic = topicInput.value.trim();

    if (!webAppUrl) {
      showToast('URL Missing', 'Kripya Google Apps Script Web App URL fill karein!', 'warning');
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
        showToast('Automation Complete', 'Facebook Page par post publish ho gaya!', 'success');
        
        resultPreview.classList.remove('hidden');
        previewPostId.textContent = `Post ID: ${result.postId || 'N/A'}`;
        previewCaption.textContent = result.caption || 'N/A';

        fetchLogs();
      } else {
        setWorkflowNode('node-gemini', 'failed', 'Error');
        setErrorState('Automation Failed', result.message || 'Ek error aaya.');
        showToast('Automation Failed', result.message || 'Error occurred.', 'error');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setWorkflowNode('node-trigger', 'failed', 'Error');
      setErrorState('Network / Server Error', err.message || 'Apps Script Web App se connection fail.');
      showToast('Network Error', err.message || 'Web App connect nahi hua.', 'error');
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
      node.className = 'wf-node clickable';
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
    node.className = `wf-node clickable ${state === 'running' ? 'active' : state}`;
    const badge = node.querySelector('.wf-status-badge');
    if (badge) {
      badge.className = `wf-status-badge ${state}`;
      badge.textContent = label;
    }
  }

  function updateWorkflowLine(stepIndex) {
    document.querySelectorAll('.wf-line').forEach((line, idx) => {
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
