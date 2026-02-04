// Enhanced Popup Script with API Key Management
console.log('Popup script v7.0 loaded');

let isScanning = false;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM ready');
  
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
      
      // Load API key status when opening settings
      if (tabName === 'settings') {
        loadApiKeyStatus();
      }
    });
  });
  
  // Load initial stats
  loadStats();
  checkApiStatus();
  
  // Update stats every 2 seconds when popup is open
  const statsInterval = setInterval(() => {
    loadStats();
    checkApiStatus();
  }, 2000);
  
  // Clean up interval when popup closes
  window.addEventListener('unload', () => {
    clearInterval(statsInterval);
  });
  
  // Scan button click handler
  document.getElementById('scanBtn').addEventListener('click', handleScan);
  
  // Reset button handler
  document.getElementById('resetBtn').addEventListener('click', handleReset);
  
  // API key management
  document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
  document.getElementById('testApiKey').addEventListener('click', testApiKey);
  document.getElementById('clearApiKey').addEventListener('click', clearApiKey);
});

async function handleScan() {
  if (isScanning) {
    console.log('Already scanning, ignoring click');
    return;
  }
  
  console.log('Scan button clicked');
  
  const scanBtn = document.getElementById('scanBtn');
  const statusDiv = document.getElementById('status');
  
  // Set scanning state
  isScanning = true;
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<span class="scanning-icon">⏳</span><span>Scanning...</span>';
  
  // Update status
  statusDiv.textContent = '⏳ Scanning emails...';
  statusDiv.className = 'status scanning';
  
  try {
    // Get active Gmail tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('mail.google.com')) {
      console.log('Sending scan message to Gmail tab');
      
      // Send scan message to content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scanEmails' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          showError('Please refresh Gmail page and try again');
          resetButton();
          return;
        }
        
        console.log('Scan initiated:', response);
        
        // Show scanning for 3 seconds
        setTimeout(() => {
          showSuccess();
          loadStats();
          resetButton();
        }, 3000);
      });
    } else {
      showError('Please open Gmail first');
      resetButton();
    }
  } catch (error) {
    console.error('Scan error:', error);
    showError('Error occurred');
    resetButton();
  }
}

function showSuccess() {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = '✓ Scan Complete';
  statusDiv.className = 'status active';
}

function showError(message) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = `❌ ${message}`;
  statusDiv.className = 'status error';
}

function resetButton() {
  setTimeout(() => {
    isScanning = false;
    const scanBtn = document.getElementById('scanBtn');
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span>🔍</span><span>Scan Emails Now</span>';
    
    const statusDiv = document.getElementById('status');
    checkApiStatus();
  }, 1000);
}

function loadStats() {
  chrome.storage.local.get(['scanned', 'threats', 'safe'], function(result) {
    const scanned = result.scanned || 0;
    const threats = result.threats || 0;
    const safe = result.safe || 0;
    
    // Update display
    document.getElementById('scanned').textContent = scanned;
    document.getElementById('threats').textContent = threats;
    document.getElementById('safe').textContent = safe;
    
    console.log('Stats updated:', { scanned, threats, safe });
  });
}

function checkApiStatus() {
  chrome.storage.local.get(['huggingface_api_key'], function(result) {
    const statusDiv = document.getElementById('status');
    
    if (!result.huggingface_api_key || result.huggingface_api_key === '') {
      if (statusDiv.textContent === '✓ Extension Active') {
        statusDiv.textContent = '⚠️ No API Key - Using Pattern Detection';
        statusDiv.className = 'status no-api';
      }
    } else {
      if (statusDiv.textContent === '⚠️ No API Key - Using Pattern Detection') {
        statusDiv.textContent = '✓ Extension Active';
        statusDiv.className = 'status active';
      }
    }
  });
}

function handleReset() {
  if (confirm('Are you sure you want to reset all statistics?')) {
    chrome.storage.local.set({ scanned: 0, threats: 0, safe: 0 }, function() {
      loadStats();
      console.log('Statistics reset');
      
      const statusDiv = document.getElementById('status');
      const oldText = statusDiv.textContent;
      statusDiv.textContent = '✓ Statistics Reset';
      statusDiv.className = 'status active';
      
      setTimeout(() => {
        statusDiv.textContent = oldText;
        checkApiStatus();
      }, 2000);
    });
  }
}

// API Key Management Functions

function loadApiKeyStatus() {
  chrome.storage.local.get(['huggingface_api_key'], function(result) {
    const input = document.getElementById('apiKeyInput');
    const statusDiv = document.getElementById('apiStatus');
    
    if (result.huggingface_api_key && result.huggingface_api_key !== '') {
      input.value = result.huggingface_api_key;
      statusDiv.textContent = '✓ API Key Configured';
      statusDiv.className = 'api-status connected';
      statusDiv.style.display = 'block';
    } else {
      input.value = '';
      statusDiv.textContent = '⚠️ No API Key Set - Using Fallback Detection';
      statusDiv.className = 'api-status disconnected';
      statusDiv.style.display = 'block';
    }
  });
}

function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  const apiKey = input.value.trim();
  const statusDiv = document.getElementById('apiStatus');
  const successMsg = document.getElementById('saveSuccess');
  
  if (!apiKey || apiKey === '') {
    statusDiv.textContent = '❌ Please enter an API key';
    statusDiv.className = 'api-status disconnected';
    statusDiv.style.display = 'block';
    return;
  }
  
  if (!apiKey.startsWith('hf_')) {
    statusDiv.textContent = '❌ Invalid API key format (should start with "hf_")';
    statusDiv.className = 'api-status disconnected';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Save to storage
  chrome.storage.local.set({ huggingface_api_key: apiKey }, function() {
    console.log('API key saved');
    
    statusDiv.textContent = '✓ API Key Saved Successfully';
    statusDiv.className = 'api-status connected';
    statusDiv.style.display = 'block';
    
    // Show success message
    successMsg.classList.add('show');
    setTimeout(() => {
      successMsg.classList.remove('show');
    }, 3000);
    
    // Notify content script to reload detector
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('mail.google.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadDetector' }, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready yet');
          }
        });
      }
    });
  });
}

async function testApiKey() {
  const input = document.getElementById('apiKeyInput');
  const apiKey = input.value.trim();
  const statusDiv = document.getElementById('apiStatus');
  const testBtn = document.getElementById('testApiKey');
  
  if (!apiKey || apiKey === '') {
    statusDiv.textContent = '❌ Please enter an API key first';
    statusDiv.className = 'api-status disconnected';
    statusDiv.style.display = 'block';
    return;
  }
  
  // Disable button and show testing
  testBtn.disabled = true;
  testBtn.innerHTML = '<span class="scanning-icon">⏳</span> Testing...';
  statusDiv.textContent = '🔄 Testing API connection...';
  statusDiv.className = 'api-status';
  statusDiv.style.display = 'block';
  statusDiv.style.background = '#e3f2fd';
  statusDiv.style.color = '#1976d2';
  
  try {
    // Use background service worker for API call
    chrome.runtime.sendMessage(
      { action: 'testApiConnection', apiKey: apiKey },
      function(response) {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = `❌ Error: ${chrome.runtime.lastError.message}`;
          statusDiv.className = 'api-status disconnected';
        } else if (response.success) {
          statusDiv.textContent = '✓ API Connection Successful!';
          statusDiv.className = 'api-status connected';
          console.log('API test successful:', response);
        } else {
          statusDiv.textContent = `❌ ${response.error}`;
          statusDiv.className = 'api-status disconnected';
          console.error('API test failed:', response.error);
        }
        
        // Re-enable button
        testBtn.disabled = false;
        testBtn.textContent = '🔍 Test Connection';
        statusDiv.style.display = 'block';
      }
    );
  } catch (error) {
    statusDiv.textContent = `❌ Connection failed: ${error.message}`;
    statusDiv.className = 'api-status disconnected';
    console.error('API test error:', error);
    
    // Re-enable button
    testBtn.disabled = false;
    testBtn.textContent = '🔍 Test Connection';
    statusDiv.style.display = 'block';
  }
}

function clearApiKey() {
  if (confirm('Are you sure you want to remove your API key? The extension will use pattern-based detection only.')) {
    chrome.storage.local.remove(['huggingface_api_key'], function() {
      console.log('API key cleared');
      
      const input = document.getElementById('apiKeyInput');
      const statusDiv = document.getElementById('apiStatus');
      
      input.value = '';
      statusDiv.textContent = '✓ API Key Removed - Using Fallback Detection';
      statusDiv.className = 'api-status disconnected';
      statusDiv.style.display = 'block';
      
      // Notify content script to reload detector
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('mail.google.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadDetector' }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Content script not ready yet');
            }
          });
        }
      });
    });
  }
}

// Listen for stats updates from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateStats') {
    console.log('Stats update requested');
    loadStats();
    sendResponse({ status: 'updated' });
  }
  return true;
});
