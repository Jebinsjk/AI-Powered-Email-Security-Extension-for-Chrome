// Real ML-Powered Phishing Detector - Updated for Hugging Face API changes
console.log('🤖 ML-Powered Phishing Detector v7.2 loading...');

class PhishingMLDetector {
  constructor() {
    this.modelLoaded = false;
    this.apiKey = null;
    
    // Multiple models as fallback (in case one is deprecated)
    this.models = [
      {
        name: 'Email Spam Detector',
        url: 'https://api-inference.huggingface.co/models/mshenoda/roberta-spam',
        type: 'classification'
      },
      {
        name: 'SMS Phishing Detector',
        url: 'https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-sms-phishing-detection',
        type: 'classification'
      }
    ];
    
    this.currentModelIndex = 0;
    
    console.log('✅ PhishingMLDetector v7.2 initialized with enhanced fallback');
  }

  async loadModel() {
    console.log('🤖 Initializing ML API connection...');
    
    // Load API key from Chrome storage
    await this.loadApiKey();
    
    if (!this.apiKey || this.apiKey === '') {
      console.warn('⚠️ NO API KEY SET!');
      console.log('📝 Get your FREE key: https://huggingface.co/settings/tokens');
      console.log('💡 Using enhanced pattern detection (works great!)');
      console.log('🔧 Add your key in settings for AI boost');
      this.modelLoaded = false;
    } else {
      // Test API connection with available models
      try {
        console.log('🔄 Testing API models...');
        await this.testAPIConnection();
        this.modelLoaded = true;
        console.log(`✅ ML API ready! Using: ${this.models[this.currentModelIndex].name}`);
        console.log('🔑 API Key configured: ' + this.apiKey.substring(0, 10) + '...');
      } catch (error) {
        console.error('❌ API connection failed:', error.message);
        console.log('⚠️ All models unavailable - using enhanced pattern detection');
        this.modelLoaded = false;
      }
    }
  }

  async loadApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['huggingface_api_key'], (result) => {
        this.apiKey = result.huggingface_api_key || null;
        resolve();
      });
    });
  }

  async testAPIConnection() {
    // Try models in order until one works
    for (let i = 0; i < this.models.length; i++) {
      try {
        console.log(`   Testing ${this.models[i].name}...`);
        const response = await fetch(this.models[i].url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: "Test message for phishing detection",
            options: { wait_for_model: true }
          })
        });

        if (response.ok) {
          this.currentModelIndex = i;
          console.log(`   ✅ ${this.models[i].name} is working!`);
          return;
        } else {
          const status = response.status;
          console.warn(`   ⚠️ ${this.models[i].name}: HTTP ${status}`);
          
          // If 410 (Gone/Deprecated), skip this model
          if (status === 410) {
            console.log(`   ❌ Model deprecated, trying next...`);
            continue;
          }
        }
      } catch (error) {
        console.warn(`   ⚠️ ${this.models[i].name} error: ${error.message}`);
      }
    }
    
    // If all models fail
    throw new Error('All AI models unavailable. Using pattern detection.');
  }

  async analyzeEmail(emailData) {
    try {
      const { sender = '', subject = '', snippet = '' } = emailData;
      const emailText = `From: ${sender}\nSubject: ${subject}\n${snippet}`;
      
      console.log('🔍 Analyzing:', subject?.substring(0, 40) || 'No subject');
      
      let mlScore = 0;
      let mlConfidence = 0;
      let usedML = false;

      // Try ML API if available
      if (this.modelLoaded && this.apiKey) {
        try {
          const mlResult = await this.getMLPrediction(emailText);
          mlScore = mlResult.score;
          mlConfidence = mlResult.confidence;
          usedML = true;
          console.log(`   🤖 ML: ${mlResult.label} (${mlConfidence.toFixed(0)}% conf)`);
        } catch (error) {
          console.warn('⚠️ ML failed, using pattern detection:', error.message);
          mlScore = this.getEnhancedFallbackScore(emailData);
        }
      } else {
        // Use enhanced pattern detection (works great!)
        mlScore = this.getEnhancedFallbackScore(emailData);
      }

      // Determine risk level
      let riskLevel = 'low';
      let confidence = 'Appears safe';
      let icon = '✓';
      
      if (mlScore >= 65) {
        riskLevel = 'high';
        confidence = usedML ? 
          `🤖 AI: ${mlConfidence.toFixed(0)}% phishing` : 
          '🚨 High risk detected';
        icon = '⚠️';
      } else if (mlScore >= 35) {
        riskLevel = 'medium';
        confidence = usedML ? 
          `⚠️ AI: ${mlConfidence.toFixed(0)}% suspicious` : 
          '⚠️ Potentially suspicious';
        icon = '⚡';
      } else {
        confidence = usedML ? 
          `✓ AI: ${(100-mlConfidence).toFixed(0)}% safe` : 
          '✓ Appears safe';
      }

      const reasons = this.generateReasons(mlScore, emailData, usedML);
      
      return {
        score: Math.round(mlScore),
        riskLevel,
        confidence,
        details: {
          mlScore: Math.round(mlScore),
          mlConfidence: Math.round(mlConfidence),
          usedAI: usedML
        },
        reasons
      };
    } catch (error) {
      console.error('❌ Error in analyzeEmail:', error);
      return this.getErrorResult();
    }
  }

  async getMLPrediction(text) {
    const currentModel = this.models[this.currentModelIndex];
    
    try {
      const response = await fetch(currentModel.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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

      if (!response.ok) {
        if (response.status === 410) {
          console.log('❌ Model deprecated, switching...');
          this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
          if (this.currentModelIndex === 0) {
            throw new Error('All models deprecated');
          }
          return await this.getMLPrediction(text);
        }
        throw new Error(`API ${response.status}`);
      }

      const result = await response.json();
      return this.parseMLResult(result);

    } catch (error) {
      console.error('❌ ML API Error:', error.message);
      throw error;
    }
  }

  parseMLResult(result) {
    let isPhishing = false;
    let confidence = 0;

    if (Array.isArray(result) && result.length > 0) {
      const predictions = Array.isArray(result[0]) ? result[0] : result;
      
      // Find spam/phishing prediction
      const spamPred = predictions.find(p => 
        p.label && (
          p.label.toLowerCase().includes('spam') || 
          p.label.toLowerCase().includes('phishing') ||
          p.label === 'LABEL_1' ||
          p.label === '1'
        )
      );

      if (spamPred) {
        isPhishing = true;
        confidence = spamPred.score * 100;
      } else {
        const hamPred = predictions.find(p => 
          p.label && (
            p.label.toLowerCase().includes('ham') || 
            p.label.toLowerCase().includes('safe') ||
            p.label === 'LABEL_0' ||
            p.label === '0'
          )
        );
        
        if (hamPred) {
          isPhishing = false;
          confidence = (1 - hamPred.score) * 100;
        }
      }
    }

    const phishingScore = isPhishing ? confidence : (100 - confidence);
    
    return {
      score: phishingScore,
      confidence: confidence,
      label: isPhishing ? 'PHISHING' : 'SAFE'
    };
  }

  getEnhancedFallbackScore(emailData) {
    const { sender = '', subject = '', snippet = '' } = emailData;
    const text = `${sender} ${subject} ${snippet}`.toLowerCase();
    
    let score = 0;

    // CRITICAL - Account suspension/verification (40 pts)
    if (text.match(/verify your account|account.*suspended|confirm your identity|unusual activity/)) {
      score += 40;
    }

    // CRITICAL - Urgent action (35 pts)
    if (text.match(/urgent action|click.*immediately|suspended unless|will be closed/)) {
      score += 35;
    }

    // HIGH - Prize/money scams (35 pts)
    if (text.match(/won|prize|lottery|million|winner/)) {
      score += 35;
    }

    // HIGH - Payment/money (30 pts)
    if (text.match(/\$[\d,]+|payment.*(?:failed|required|update)/)) {
      score += 30;
    }

    // HIGH - Threats (30 pts)
    if (text.match(/will be (?:closed|terminated|deleted)|lose access|expire.*soon/)) {
      score += 30;
    }

    // MEDIUM - Sensitive info requests (35 pts)
    if (text.match(/social security|ssn|password|credit card|bank account/)) {
      score += 35;
    }

    // MEDIUM - Suspicious domain (40 pts)
    if (sender.match(/\.tk|\.ml|\.ga|\.xyz|tempmail|throwaway/i)) {
      score += 40;
    }

    // MEDIUM - URL shorteners (20 pts)
    if (text.match(/bit\.ly|tinyurl|goo\.gl/)) {
      score += 20;
    }

    // LOW - Generic greeting (15 pts)
    if (text.match(/dear (?:customer|user|member)/)) {
      score += 15;
    }

    // LOW - Poor grammar (10 pts)
    if (text.match(/kindly|needful|revert back/)) {
      score += 10;
    }

    // BRAND IMPERSONATION (30 pts)
    const brands = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'bank'];
    const matchedBrand = brands.find(b => text.includes(b));
    if (matchedBrand && sender) {
      const domain = sender.split('@')[1] || '';
      if (!domain.includes(matchedBrand)) {
        score += 30;
      }
    }

    return Math.min(score, 100);
  }

  generateReasons(score, emailData, usedML) {
    const reasons = [];
    const { sender = '', subject = '', snippet = '' } = emailData;
    const text = `${sender} ${subject} ${snippet}`.toLowerCase();

    if (usedML) {
      reasons.push(score >= 65 ? '🤖 AI detected phishing' : 
                   score >= 35 ? '🤖 AI flagged suspicious' : 
                   '🤖 AI verified safe');
    } else {
      reasons.push('⚙️ Pattern detection (add API key for AI)');
    }

    if (text.match(/verify|confirm/)) reasons.push('🔒 Verification request');
    if (text.match(/suspended|locked/)) reasons.push('⚠️ Account suspension claim');
    if (text.match(/urgent|immediately/)) reasons.push('⚡ Urgency tactics');
    if (text.match(/won|prize/)) reasons.push('🎰 Prize scam');
    if (text.match(/\$/)) reasons.push('💰 Money mentioned');
    if (text.match(/click here/)) reasons.push('🔗 Click-bait');
    if (sender.match(/\.tk|\.ml|tempmail/i)) reasons.push('🚨 Suspicious domain');
    if (text.match(/password|credit card/i)) reasons.push('🔐 Sensitive info request');

    if (reasons.length <= 1) {
      reasons.push('✓ No red flags');
    }

    return reasons.slice(0, 5);
  }

  getErrorResult() {
    return {
      score: 50,
      riskLevel: 'medium',
      confidence: 'Unable to analyze',
      details: { mlScore: 50, mlConfidence: 0, usedAI: false },
      reasons: ['⚠️ Analysis error']
    };
  }
}

// Register globally
try {
  window.PhishingMLDetector = PhishingMLDetector;
  console.log('✅ PhishingMLDetector v7.2 ready!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Extension works great without API key!');
  console.log('🚀 Add API key for AI boost:');
  console.log('   1. Extension icon → Settings');
  console.log('   2. Get key: https://huggingface.co/settings/tokens');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} catch (error) {
  console.error('❌ Error:', error);
}
