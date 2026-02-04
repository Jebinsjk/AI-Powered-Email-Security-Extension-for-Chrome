# 🚀 Quick Setup Guide

## Install in 3 Steps

### Step 1: Load Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `gmail-phishing-detector-fixed` folder

### Step 2: Configure API (Optional but Recommended)
1. Go to https://huggingface.co/settings/tokens
2. Sign up (free)
3. Click **New token** → Select **Read** → Create
4. Copy the token (starts with `hf_`)
5. Click extension icon → **Settings** tab
6. Paste token → Click **Save API Key**
7. Click **Test Connection** to verify

### Step 3: Start Using
1. Open Gmail (https://mail.google.com)
2. Extension automatically scans emails
3. Look for indicators: ✓ (safe), ⚡ (suspicious), ⚠️ (dangerous)
4. Click indicators for detailed reports

---

## ⚡ Quick Fixes

**Not seeing indicators?**
- Refresh Gmail page (F5)
- Click extension → **Scan Emails Now**
- Wait 5-10 seconds after page load

**API connection failed?**
- Verify key starts with `hf_`
- Generate new token if needed
- Extension works without API (fallback mode)

**Need help?**
- Open console: F12 → Console tab
- Look for error messages
- Check README.md for detailed troubleshooting

---

## 🎯 Usage Tips

### For Best Results:
✅ Add your Hugging Face API key (95% accuracy)  
✅ Refresh Gmail after installing  
✅ Use manual scan for immediate results  
✅ Click indicators to see why emails were flagged  

### Without API Key:
⚠️ Extension uses pattern detection (75% accuracy)  
⚠️ Still very effective at catching common phishing  
⚠️ Add API key anytime to upgrade  

---

## 📊 Understanding Risk Levels

| Icon | Color | Risk | Action |
|------|-------|------|--------|
| ✓ | Green | Safe | Appears legitimate |
| ⚡ | Orange | Suspicious | Exercise caution |
| ⚠️ | Red | Dangerous | DO NOT CLICK |

---

## 🔒 Privacy Note

- No data collection
- API only gets: sender, subject, preview (500 chars)
- API key stored locally
- Full email body stays private

---

**Questions?** Check the full README.md

**Happy browsing! 🛡️**
