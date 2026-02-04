// Background Service Worker for API calls
console.log('🔧 Background service worker loaded');

// Handle API test requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'testApiConnection') {
    testApiConnection(request.apiKey)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'analyzeWithAPI') {
    analyzeWithAPI(request.apiKey, request.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function testApiConnection(apiKey) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-phishing-detection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: "Test message",
        options: { wait_for_model: true }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: 'API Connection Successful',
        data: data 
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `API Error: ${response.status} - ${errorText.substring(0, 100)}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Connection failed: ${error.message}` 
    };
  }
}

async function analyzeWithAPI(apiKey, text) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-phishing-detection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text.substring(0, 500),
        options: { 
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `API returned ${response.status}: ${errorText}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}
