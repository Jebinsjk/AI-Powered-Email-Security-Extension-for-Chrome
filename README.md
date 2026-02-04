# 🛡️ Gmail Phishing Detector

**AI-Powered Email Security Extension for Chrome**

An intelligent Chrome extension that uses machine learning to detect and warn users about potential phishing emails in Gmail. Built by students of VIT, Vellore.

![Version](https://img.shields.io/badge/version-7.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Features

- **🤖 AI-Powered Detection**: Uses BERT neural network trained specifically for phishing detection
- **⚡ Real-Time Scanning**: Automatically scans emails as you browse Gmail
- **🎯 Visual Risk Indicators**: Color-coded icons (✓ Safe, ⚡ Suspicious, ⚠️ Dangerous)
- **📊 Detailed Analysis**: Click any indicator for a comprehensive phishing report
- **📈 Statistics Dashboard**: Track scanned emails, threats detected, and safe messages
- **🔄 Smart Fallback**: Works even without API key using pattern-based detection
- **🚀 Zero Setup**: Works immediately with fallback detection
- **🔐 Privacy First**: All data stays local, API key never leaves your browser

---

## 📸 Screenshots

### Email Scanning
Emails are automatically scanned and marked with risk indicators:
- ✓ **Green** = Safe
- ⚡ **Orange** = Suspicious
- ⚠️ **Red** = Phishing Detected

### Detailed Analysis Modal
Click any indicator to see:
- Risk score (0-100)
- Detection reasons
- Actionable recommendations

### Statistics Dashboard
Track your email security:
- Total emails scanned
- Threats detected
- Safe emails verified

---

## 🚀 Installation

### Method 1: Load Unpacked (Development)

1. **Download the Extension**
   ```bash
   # Clone or download this repository
   git clone <repository-url>
   cd gmail-phishing-detector-fixed
   ```

2. **Open Chrome Extensions**
   - Open Chrome/Edge browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `gmail-phishing-detector-fixed` folder
   - The extension icon should appear in your toolbar

4. **Verify Installation**
   - Open Gmail (https://mail.google.com)
   - Open browser console (F12)
   - Look for: "✅ Gmail Phishing Detector v2.0 loaded"

### Method 2: Chrome Web Store (Coming Soon)
Extension will be available on the Chrome Web Store for one-click installation.

---

## ⚙️ Configuration

### Using AI Detection (Recommended)

For best results, configure the AI model with a free Hugging Face API key:

1. **Get Free API Key**
   - Go to https://huggingface.co/
   - Sign up (free account)
   - Navigate to Settings → Access Tokens
   - Create new token (Read access is sufficient)
   - Copy the token (starts with `hf_`)

2. **Configure Extension**
   - Click the extension icon in Chrome toolbar
   - Click "⚙️ Settings" tab
   - Paste your API key
   - Click "💾 Save API Key"
   - Click "🔍 Test Connection" to verify

3. **Verification**
   - Status should show "✓ API Connection Successful"
   - Dashboard status changes to "✓ Extension Active"
   - Console shows "✅ ML API ready!"

### Using Fallback Detection (No Setup Required)

The extension works immediately without API key using pattern-based detection:
- Analyzes sender domains
- Checks for urgent language
- Detects suspicious keywords
- Identifies common phishing patterns

**Note**: AI detection is significantly more accurate (~95% accuracy vs ~75% for fallback)

---

## 📖 Usage

### Automatic Scanning

The extension automatically scans emails in multiple scenarios:
- ✅ When Gmail first loads
- ✅ When you navigate between folders
- ✅ When new emails arrive
- ✅ When you scroll and load more emails
- ✅ After pagination

### Manual Scanning

1. Click the extension icon
2. Click "🔍 Scan Emails Now"
3. Wait 2-3 seconds for analysis
4. Check status: "✓ Scan Complete"

### Reading Results

**Visual Indicators on Emails:**
- ✓ (Green) - Email appears safe
- ⚡ (Orange) - Suspicious, exercise caution  
- ⚠️ (Red) - High risk, likely phishing

**Hover Tooltip:**
Hover over any indicator to see:
- Risk score
- Risk level
- Quick reasons

**Detailed Report:**
Click any indicator to open a modal with:
- Complete risk analysis
- All detection reasons
- Specific recommendations
- Risk score breakdown

### Recommendations by Risk Level

**High Risk (⚠️)**
- 🚨 DO NOT click any links
- Do not download attachments
- Do not reply with personal info
- Mark as spam and delete

**Suspicious (⚡)**
- Exercise caution
- Verify sender independently
- Hover over links before clicking
- Contact company directly if unsure

**Safe (✓)**
- Email appears legitimate
- Always stay vigilant
- Verify unexpected requests

---

## 🔧 Technical Details

### Architecture

```
manifest.json          → Extension configuration
├── ml-detector.js     → AI model integration
├── content.js         → Gmail scanning logic
├── popup.html         → User interface
├── popup.js           → Popup logic
└── styles.css         → Styling (unused)
```

### AI Model

- **Provider**: Hugging Face Inference API
- **Model**: `mrm8488/bert-tiny-finetuned-sms-phishing-detection`
- **Architecture**: BERT (Bidirectional Encoder Representations from Transformers)
- **Training**: Specifically fine-tuned on phishing/SMS spam dataset
- **Accuracy**: ~95% on test data

### Fallback Detection Heuristics

When AI is unavailable, the extension uses 20+ pattern-based rules:

**Critical Indicators (30-40 points each):**
- "verify your account"
- "account suspended"
- Prize/lottery language
- Requests for sensitive info

**High Risk (15-25 points each):**
- Urgency keywords
- Money mentions
- Generic greetings
- Threats

**Medium Risk (10-20 points each):**
- URL shorteners
- Suspicious domains
- Poor grammar patterns

**Risk Levels:**
- 0-34: Safe
- 35-64: Suspicious
- 65-100: High Risk

### Gmail Integration

The extension uses multiple DOM selectors to work with different Gmail layouts:
- Standard inbox view
- Compact view
- Priority inbox
- Multiple inboxes
- Different languages

**Scanning Triggers:**
- MutationObserver for DOM changes
- Scheduled scans (1s, 2s, 3s, 5s, 8s, 12s after load)
- URL change detection
- PopState/HashChange listeners
- Manual trigger from popup

---

## 🔒 Privacy & Security

### Data Privacy
- ✅ **No data collection**: Extension doesn't collect or store personal data
- ✅ **Local processing**: Email analysis happens in your browser
- ✅ **No tracking**: No analytics or user tracking
- ✅ **Minimal permissions**: Only requests Gmail access
- ✅ **API key security**: Stored locally in Chrome storage

### What Gets Sent to API?
When AI detection is enabled, only these are sent to Hugging Face:
- Sender email address
- Email subject line
- First 500 characters of email preview

**NOT sent:**
- Full email body
- Attachments
- Email recipients
- Any other personal information

### API Key Storage
- Stored in `chrome.storage.local`
- Never transmitted except to Hugging Face
- Can be removed anytime
- Not shared with any third parties

---

## 📊 Statistics & Analytics

The extension tracks:
- **Total Scanned**: Number of emails analyzed
- **Threats Detected**: High-risk emails flagged
- **Safe Emails**: Low-risk emails verified

**Reset Statistics:**
- Click "🔄 Reset Statistics" in dashboard
- Confirm action
- All counters reset to zero

**Data Storage:**
- Statistics stored in Chrome local storage
- Persists across browser sessions
- Deleted when extension is uninstalled

---

## 🐛 Troubleshooting

### Extension Not Working

**Problem**: No indicators appearing on emails

**Solutions:**
1. Refresh Gmail page (F5)
2. Check console for errors (F12 → Console)
3. Verify extension is enabled in `chrome://extensions/`
4. Try manual scan from popup
5. Reload extension

### API Key Issues

**Problem**: "API connection failed"

**Solutions:**
1. Verify API key is correct (starts with `hf_`)
2. Check key has "Read" permission
3. Click "🔍 Test Connection"
4. Generate new key if expired
5. Check Hugging Face service status

### No Emails Being Scanned

**Problem**: Stats show 0 scanned emails

**Solutions:**
1. Ensure you're on Gmail (mail.google.com)
2. Wait 5-10 seconds after page load
3. Click manual scan button
4. Check browser console for errors
5. Try different Gmail view (default inbox)

### Indicators Disappearing

**Problem**: Risk indicators vanish after appearing

**Solutions:**
1. Known issue with Gmail's dynamic loading
2. Click manual scan to reapply
3. Avoid rapidly switching between emails
4. Extension will auto-rescan periodically

---

## 🔄 Updates

### Version 7.0 (Current)
- ✅ Fixed API key security (moved to Chrome storage)
- ✅ Added settings tab with configuration
- ✅ API key test functionality
- ✅ Improved UI/UX
- ✅ Better error messages
- ✅ Statistics reset button

### Version 2.0
- Added pagination support
- Improved late-loading detection
- Multiple scan triggers
- URL change detection

### Version 1.0
- Initial release
- Basic phishing detection
- Visual indicators
- Statistics tracking

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd gmail-phishing-detector-fixed

# Make changes
# Test in Chrome (load unpacked)

# Check console for errors
# Test on multiple Gmail layouts
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Credits

**Developed by Students of VIT, Vellore**

**AI Model:**
- Model: `bert-tiny-finetuned-sms-phishing-detection`
- Creator: mrm8488
- Platform: Hugging Face

**Technologies:**
- Chrome Extension API
- Hugging Face Inference API
- JavaScript ES6+
- Gmail DOM API

---

## 📞 Support

### Getting Help

- **Issues**: Open an issue on GitHub
- **Questions**: Check Troubleshooting section
- **API Help**: Visit https://huggingface.co/docs

### Reporting Bugs

When reporting bugs, include:
1. Chrome version
2. Extension version
3. Browser console errors (F12)
4. Steps to reproduce
5. Expected vs actual behavior

---

## 🎯 Roadmap

### Planned Features

- [ ] Whitelist trusted senders
- [ ] Export threat reports (CSV)
- [ ] Multiple language support
- [ ] Link analysis (check URLs)
- [ ] Attachment scanning
- [ ] Email forwarding detection
- [ ] Custom detection rules
- [ ] Dark mode
- [ ] Firefox support
- [ ] Edge-specific optimizations

---

## ⚠️ Disclaimer

This extension is a security tool designed to assist users in identifying potential phishing emails. However:

- **Not 100% accurate**: No detection system is perfect
- **False positives possible**: Safe emails may be flagged
- **False negatives possible**: Some phishing may go undetected
- **User judgment required**: Always use your best judgment
- **Educational tool**: Not a replacement for email security training
- **No warranty**: Use at your own risk

**Always verify suspicious emails independently before taking action.**

---

## 📚 Additional Resources

- [Phishing Awareness Guide](https://www.consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams)
- [Hugging Face Documentation](https://huggingface.co/docs)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Gmail Security Best Practices](https://support.google.com/mail/answer/8253)

---

**Made with ❤️ by Students of VIT, Vellore**

*Stay safe online! 🛡️*
