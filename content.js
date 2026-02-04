// Gmail Phishing Detector - Fixed for late loading and pagination
console.log('🛡️ Gmail Phishing Detector v2.0 - Starting...');

class GmailPhishingDetector {
  constructor() {
    this.processedEmails = new Set();
    this.detector = null;
    this.isReady = false;
    this.scanTimeout = null;
    this.lastScanTime = 0;
    this.init();
  }

  async init() {
    console.log('📌 Initializing phishing detector...');
    
    // Create detector
    if (typeof window.PhishingMLDetector === 'undefined') {
      console.error('❌ PhishingMLDetector not found!');
      return;
    }
    
    this.detector = new window.PhishingMLDetector();
    await this.detector.loadModel();
    this.isReady = true;
    
    console.log('✅ Detector ready!');
    
    // Setup message listener for popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scanEmails') {
        console.log('🔄 Manual scan requested');
        this.processedEmails.clear(); // Clear cache to force rescan
        this.scanAllEmails();
        sendResponse({ status: 'scanning' });
      }
      return true;
    });
    
    // Start aggressive observation for late-loading content
    this.setupAggressiveObserver();
    
    // Multiple scans at different intervals to catch late-loading emails
    this.scheduleMultipleScans();
    
    // Detect URL changes (pagination)
    this.observeURLChanges();
  }

  setupAggressiveObserver() {
    console.log('👀 Setting up aggressive email observer...');
    
    // Observe the main Gmail content area
    const observer = new MutationObserver((mutations) => {
      // Check if mutations include email-related changes
      let shouldScan = false;
      
      for (const mutation of mutations) {
        // Check if added nodes contain email rows
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // Check if it's an email row or contains email rows
              if (node.matches && (
                  node.matches('tr.zA') || 
                  node.matches('tr.btb') ||
                  node.querySelector('tr.zA') ||
                  node.querySelector('tr.btb') ||
                  node.matches('.AO') || // Gmail main content area
                  node.classList?.contains('Cp') // Email list container
                )) {
                shouldScan = true;
              }
            }
          });
        }
      }
      
      if (shouldScan) {
        this.debounceScan(500); // Debounce to avoid too many scans
      }
    });
    
    // Observe with aggressive settings
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    console.log('✅ Observer active - will detect new emails as they load');
  }

  debounceScan(delay = 1000) {
    // Debounce scanning to avoid excessive calls
    clearTimeout(this.scanTimeout);
    this.scanTimeout = setTimeout(() => {
      const now = Date.now();
      // Prevent scanning too frequently (minimum 500ms between scans)
      if (now - this.lastScanTime > 500) {
        this.lastScanTime = now;
        this.scanAllEmails();
      }
    }, delay);
  }

  scheduleMultipleScans() {
    // Schedule multiple scans at different intervals to catch late-loading emails
    const intervals = [1000, 2000, 3000, 5000, 8000, 12000];
    
    intervals.forEach(delay => {
      setTimeout(() => {
        console.log(`⏰ Scheduled scan at ${delay}ms`);
        this.scanAllEmails();
      }, delay);
    });
    
    console.log(`📅 Scheduled ${intervals.length} automatic scans to catch late-loading emails`);
  }

  observeURLChanges() {
    // Detect when user navigates to different pages (pagination, different folders)
    let lastUrl = window.location.href;
    
    // Watch for URL changes using MutationObserver on title (Gmail changes title)
    const titleObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('🔄 URL changed - User navigated to different page');
        console.log('   From:', lastUrl.substring(0, 80));
        console.log('   To:', currentUrl.substring(0, 80));
        
        lastUrl = currentUrl;
        
        // Clear processed emails cache and rescan
        this.processedEmails.clear();
        
        // Wait for new page to load, then scan multiple times
        setTimeout(() => this.scanAllEmails(), 500);
        setTimeout(() => this.scanAllEmails(), 1500);
        setTimeout(() => this.scanAllEmails(), 3000);
        setTimeout(() => this.scanAllEmails(), 5000);
      }
    });
    
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true });
      console.log('✅ URL change detection active - will rescan on pagination');
    }
    
    // Also use popstate for back/forward navigation
    window.addEventListener('popstate', () => {
      console.log('🔄 Browser navigation detected');
      this.processedEmails.clear();
      this.scheduleMultipleScans();
    });
    
    // Also listen for hashchange
    window.addEventListener('hashchange', () => {
      console.log('🔄 Hash change detected (Gmail navigation)');
      this.processedEmails.clear();
      this.scheduleMultipleScans();
    });
  }

  scanAllEmails() {
    if (!this.isReady) {
      console.log('⏳ Detector not ready yet, skipping scan');
      return;
    }
    
    // Try multiple selectors for different Gmail views
    const selectors = [
      'tr.zA',              // Standard inbox
      'tr.btb',             // Another inbox style
      'tr[role="row"]',     // Role-based selector
      'div[role="row"]'     // New Gmail layout
    ];
    
    let emails = [];
    let usedSelector = '';
    
    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        emails = Array.from(found);
        usedSelector = selector;
        break;
      }
    }
    
    if (emails.length === 0) {
      console.log('⚠️ No emails found in current view');
      return;
    }
    
    console.log(`🔍 Scanning ${emails.length} emails (selector: ${usedSelector})`);
    
    let newEmails = 0;
    let skippedEmails = 0;
    
    emails.forEach((email, index) => {
      const emailId = this.getEmailId(email);
      
      if (!emailId || emailId === '_') {
        // Email might not be fully loaded yet
        skippedEmails++;
        return;
      }
      
      if (!this.processedEmails.has(emailId)) {
        this.processedEmails.add(emailId);
        this.analyzeEmail(email);
        newEmails++;
      }
    });
    
    if (newEmails > 0) {
      console.log(`✅ Analyzed ${newEmails} new emails`);
      this.updateStats();
    }
    
    if (skippedEmails > 0) {
      console.log(`⏳ Skipped ${skippedEmails} emails (not fully loaded) - will retry`);
      // Schedule another scan for late-loading emails
      setTimeout(() => this.scanAllEmails(), 2000);
    }
  }

  getEmailId(emailRow) {
    // Create unique ID for email - try multiple methods
    try {
      // Method 1: Thread ID attribute
      const threadId = emailRow.getAttribute('data-legacy-thread-id') || 
                      emailRow.getAttribute('data-thread-id') ||
                      emailRow.getAttribute('id');
      
      if (threadId && threadId !== '') {
        return `id_${threadId}`;
      }
      
      // Method 2: Subject + sender combination
      const subjectSelectors = ['.bog span', '.y6 span', 'span[data-thread-id]'];
      let subject = '';
      
      for (const sel of subjectSelectors) {
        const el = emailRow.querySelector(sel);
        if (el && el.textContent.trim()) {
          subject = el.textContent.trim();
          break;
        }
      }
      
      const sender = emailRow.querySelector('span[email]')?.getAttribute('email') || '';
      
      if (subject || sender) {
        return `${sender}_${subject}`.substring(0, 100);
      }
      
      return null; // Email not loaded yet
      
    } catch (error) {
      return null;
    }
  }

  async analyzeEmail(emailRow) {
    const emailData = this.extractEmailData(emailRow);
    
    if (!emailData || !emailData.subject) {
      console.log('⚠️ Could not extract email data - might not be fully loaded');
      return;
    }
    
    try {
      const result = await this.detector.analyzeEmail(emailData);
      this.addIndicator(emailRow, result);
      this.storeResult(result);
    } catch (error) {
      console.error('Error analyzing email:', error);
    }
  }

  extractEmailData(emailRow) {
    try {
      // Extract sender email
      const senderEl = emailRow.querySelector('span[email]');
      const sender = senderEl ? senderEl.getAttribute('email') : '';
      
      // Extract sender name
      const senderNameEl = emailRow.querySelector('.yW span[name], .yP, .yW');
      const senderName = senderNameEl ? 
        (senderNameEl.getAttribute('name') || senderNameEl.textContent.trim()) : '';
      
      // Extract subject (try multiple selectors)
      let subject = '';
      const subjectSelectors = ['.bog span', '.y6 span', 'span[data-thread-id]', '.a4W'];
      for (const sel of subjectSelectors) {
        const el = emailRow.querySelector(sel);
        if (el && el.textContent.trim()) {
          subject = el.textContent.trim();
          break;
        }
      }
      
      // If still no subject, email might not be loaded
      if (!subject && !sender && !senderName) {
        return null;
      }
      
      // Extract snippet/preview
      const snippetEl = emailRow.querySelector('.y2, .Zt');
      const snippet = snippetEl ? snippetEl.textContent.trim() : '';
      
      return {
        sender: sender || senderName,
        senderName,
        subject,
        snippet,
        body: snippet
      };
    } catch (error) {
      console.error('Error extracting email data:', error);
      return null;
    }
  }

  addIndicator(emailRow, result) {
    // Check if indicator already exists
    const existing = emailRow.querySelector('.phishing-indicator');
    if (existing) {
      // Update existing indicator instead of creating new one
      this.updateIndicator(existing, result);
      return;
    }
    
    // Mark the row as processed to prevent removal
    emailRow.setAttribute('data-phishing-checked', 'true');
    emailRow.setAttribute('data-phishing-score', result.score);
    
    // Create new indicator
    const indicator = document.createElement('span');
    indicator.className = 'phishing-indicator';
    indicator.setAttribute('data-score', result.score);
    
    // Set icon and color based on risk
    let icon, color;
    if (result.riskLevel === 'high') {
      icon = '⚠️';
      color = '#d32f2f';
    } else if (result.riskLevel === 'medium') {
      icon = '⚡';
      color = '#f57c00';
    } else {
      icon = '✓';
      color = '#388e3c';
    }
    
    indicator.textContent = icon;
    indicator.style.cssText = `
      color: ${color};
      font-size: 18px;
      margin-right: 8px;
      cursor: pointer;
      font-weight: bold;
      display: inline-block;
      animation: fadeIn 0.3s ease;
    `;
    
    // Create tooltip
    indicator.title = this.createTooltip(result);
    
    // Add click handler for detailed view
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDetailedModal(result);
    });
    
    // Find subject and insert indicator
    const subjectSelectors = ['.bog', '.y6', '[data-thread-id]', '.a4W'];
    for (const sel of subjectSelectors) {
      const subjectEl = emailRow.querySelector(sel);
      if (subjectEl) {
        subjectEl.style.position = 'relative';
        
        // Make sure we insert at the beginning
        if (subjectEl.firstChild) {
          subjectEl.insertBefore(indicator, subjectEl.firstChild);
        } else {
          subjectEl.appendChild(indicator);
        }
        break;
      }
    }
  }

  updateIndicator(indicator, result) {
    // Update existing indicator with new data
    let icon, color;
    if (result.riskLevel === 'high') {
      icon = '⚠️';
      color = '#d32f2f';
    } else if (result.riskLevel === 'medium') {
      icon = '⚡';
      color = '#f57c00';
    } else {
      icon = '✓';
      color = '#388e3c';
    }
    
    indicator.textContent = icon;
    indicator.style.color = color;
    indicator.setAttribute('data-score', result.score);
    indicator.title = this.createTooltip(result);
  }

  createTooltip(result) {
    return `🛡️ PHISHING DETECTION
━━━━━━━━━━━━━━━━━━
📊 Score: ${result.score}/100
🎯 Risk: ${result.riskLevel.toUpperCase()}
━━━━━━━━━━━━━━━━━━
⚠️ Reasons:
${result.reasons.map(r => '• ' + r).join('\n')}

💡 Click for detailed analysis`;
  }

  showDetailedModal(result) {
    // Remove existing modal
    const existing = document.querySelector('.phishing-modal');
    if (existing) existing.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'phishing-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: modalFadeIn 0.2s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 500px;
      max-width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: modalSlideIn 0.3s ease;
    `;
    
    const riskColor = result.riskLevel === 'high' ? '#d32f2f' : 
                     result.riskLevel === 'medium' ? '#f57c00' : '#388e3c';
    
    content.innerHTML = `
      <div style="padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">🛡️ Phishing Analysis Report</h2>
      </div>
      
      <div style="padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 100px; height: 100px; border-radius: 50%; border: 6px solid ${riskColor}; 
                      display: inline-flex; align-items: center; justify-content: center; 
                      background: #f5f5f5; margin-bottom: 12px;">
            <span style="font-size: 36px; font-weight: bold; color: #333;">${result.score}</span>
          </div>
          <div style="font-size: 20px; font-weight: bold; color: ${riskColor};">
            ${result.riskLevel === 'high' ? '⚠️ HIGH RISK' : 
              result.riskLevel === 'medium' ? '⚡ SUSPICIOUS' : '✓ SAFE'}
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">⚠️ Detection Reasons:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${result.reasons.map(r => `<li style="margin-bottom: 6px; color: #555;">${r}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background: ${result.riskLevel === 'high' ? '#ffebee' : result.riskLevel === 'medium' ? '#fff3e0' : '#e8f5e9'}; 
                    padding: 16px; border-radius: 8px; border-left: 4px solid ${riskColor};">
          <h3 style="margin: 0 0 12px 0; font-size: 16px;">💡 Recommendations:</h3>
          ${this.getRecommendations(result.riskLevel)}
        </div>
        
        <button onclick="this.closest('.phishing-modal').remove()" 
                style="width: 100%; padding: 12px; margin-top: 16px; background: #1a73e8; 
                       color: white; border: none; border-radius: 6px; cursor: pointer; 
                       font-size: 14px; font-weight: 600;">
          Close
        </button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  getRecommendations(riskLevel) {
    if (riskLevel === 'high') {
      return `
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 6px; color: #d32f2f; font-weight: 600;">🚨 DO NOT click any links</li>
          <li style="margin-bottom: 6px;">Do not download attachments</li>
          <li style="margin-bottom: 6px;">Do not reply with personal information</li>
          <li style="margin-bottom: 6px;">Mark as spam and delete immediately</li>
        </ul>
      `;
    } else if (riskLevel === 'medium') {
      return `
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 6px;">⚠️ Exercise caution with this email</li>
          <li style="margin-bottom: 6px;">Verify sender identity independently</li>
          <li style="margin-bottom: 6px;">Hover over links before clicking</li>
          <li style="margin-bottom: 6px;">Contact company directly if suspicious</li>
        </ul>
      `;
    } else {
      return `
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 6px;">✓ Email appears safe</li>
          <li style="margin-bottom: 6px;">Always stay vigilant</li>
          <li style="margin-bottom: 6px;">Verify unexpected requests</li>
        </ul>
      `;
    }
  }

  storeResult(result) {
    chrome.storage.local.get(['scanned', 'threats', 'safe'], (data) => {
      const scanned = (data.scanned || 0) + 1;
      const threats = result.riskLevel === 'high' ? (data.threats || 0) + 1 : (data.threats || 0);
      const safe = result.riskLevel === 'low' ? (data.safe || 0) + 1 : (data.safe || 0);
      
      chrome.storage.local.set({ scanned, threats, safe });
    });
  }

  updateStats() {
    chrome.runtime.sendMessage({ action: 'updateStats' }).catch(() => {});
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes modalSlideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .phishing-indicator:hover {
    transform: scale(1.2);
    transition: transform 0.2s ease;
  }
`;
document.head.appendChild(style);

// Initialize detector
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GmailPhishingDetector();
  });
} else {
  new GmailPhishingDetector();
}

console.log('✅ Gmail Phishing Detector v2.0 loaded with pagination & late-loading support!');