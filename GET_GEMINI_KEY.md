# Get Gemini API Key - 2 Minute Guide

## Quick Steps

1. **Go to:** https://makersuite.google.com/app/apikey

2. **Sign in** with your Google account

3. **Click "Create API Key"**

4. **Copy the key** (looks like: `AIzaSy...`)

5. **Update your ~/.zshrc:**
   ```bash
   # Open in editor
   code ~/.zshrc
   # OR
   nano ~/.zshrc
   
   # Find this line:
   export GEMINI_API_KEY=AIza-your-real-key-here
   
   # Replace with your actual key:
   export GEMINI_API_KEY=AIzaSy...your-actual-key...
   
   # Save and reload:
   source ~/.zshrc
   ```

6. **Test it:**
   ```bash
   cd ~/dev/reseller-intel
   source setup_api_keys.sh
   # Should show both keys as ✅ set
   ```

## Alternative: Set Just for This Session

Don't want to edit .zshrc? Just export for this terminal:

```bash
export GEMINI_API_KEY='your-actual-key-here'
```

Then run the pipeline immediately.

## Pricing

**Gemini 2.0 Flash:**
- **Free tier:** 1,500 requests/day
- **Our usage:** ~680 images
- **Cost:** Effectively FREE (within tier)

## Ready?

Once you have the key:

```bash
cd ~/dev/reseller-intel
source setup_api_keys.sh
./run_visual_analysis.sh
```

---

**Note:** Google Maps API key is already configured and ready!
