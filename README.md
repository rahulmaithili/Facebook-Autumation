# 🚀 Facebook Automation System (Complete Guide & Code Documentation)

Yeh ek complete, production-ready **Facebook Automation System** hai jo Google Apps Script (Backend) aur Netlify par deploy hone wale Frontend Dashboard se chalta hai.

---

## 🛠️ System Architecture & Workflow

```
[ Frontend Dashboard (Netlify) ]
               │
               ▼ (Fetch POST - text/plain CORS Safe)
[ Google Apps Script Web App (Code.gs) ]
               │
      ┌────────┼─────────────────────────┐
      ▼        ▼                         ▼
 [ Gemini API ]  [ Imagen API ]  [ Facebook Graph API ]
 (Text Caption)   (Image Gen)    (/PAGE_ID/photos)
      │        │                         │
      └────────┴──────────┬──────────────┘
                          ▼
             [ Google Sheets Logging ]
```

---

## 📌 STEP 1: Gemini API Key Kaise Paayein

1. **Google AI Studio** par jayein: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Apne Google Account se Login karein.
3. **Get API Key** button par click karein.
4. **Create API Key in new project** select karein.
5. Apni **API Key** copy kar ke safe jagah save kar lein.

---

## 📌 STEP 2: Facebook Page ID aur Long-Lived Access Token (60 Days) Kaise Generate Karein

### A. Facebook Page ID Nikalein:
1. Apne Facebook Page par jayein.
2. **About** tab par click karein ya URL dekhein (`facebook.com/YOUR_PAGE_ID`).
3. Ya phir Facebook Page ki **Settings > Page Details** me Page ID copy karein.

### B. Long-Lived Page Access Token Generate Karein:
1. **Meta for Developers** portal par jayein: [https://developers.facebook.com/](https://developers.facebook/)
2. Ek naya **App** create karein (Type: Business ya Other).
3. Tools menu se **Graph API Explorer** open karein: [https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)
4. Right side panel me:
   - **Meta App**: Apna create kiya hua App select karein.
   - **User or Page**: `Get Page Access Token` select karke apna Page select karein.
   - **Permissions**: Ye permissions add karein:
     - `pages_manage_posts`
     - `pages_read_engagement`
     - `pages_show_list`
5. **Generate Access Token** par click karke permissions approve karein.
6. Ab aapko ek Short-Lived Token milega. Isko **60-Day Long-Lived Token** me convert karne ke liye ye URL browser me hit karein:
   ```text
   https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
7. Output me milne wala `access_token` aapka **60-Day Long-Lived Page Access Token** hai.

---

## 📌 STEP 3: Google Apps Script Backend Setup (Code.gs)

1. [Google Drive](https://drive.google.com) me jayein -> **New > Google Sheets** create karein (Naam: `Facebook Automation Logs`).
2. Top menu se **Extensions > Apps Script** par click karein.
3. Editor me saara purana code delete karein aur project file `Code.gs` ka poora code paste kar dein.
4. **Script Properties Configuration**:
   - `Code.gs` ke andar `setupScriptProperties()` function me apni real keys enter karein:
     ```javascript
     function setupScriptProperties() {
       const scriptProperties = PropertiesService.getScriptProperties();
       scriptProperties.setProperties({
         'GEMINI_API_KEY': 'YOUR_GEMINI_API_KEY_HERE',
         'FB_PAGE_ID': 'YOUR_FACEBOOK_PAGE_ID_HERE',
         'FB_PAGE_ACCESS_TOKEN': 'YOUR_FACEBOOK_PAGE_ACCESS_TOKEN_HERE',
         'LOG_SHEET_ID': '' // Blank chhod dein, auto-detect ho jayega
       });
       Logger.log('✅ Configuration Properties successfully saved!');
     }
     ```
   - Top toolbar se `setupScriptProperties` function select karein aur **Run** par click karein.
   - Initial permissions review box aane par **Review Permissions > Advanced > Go to Untitled project (unsafe) > Allow** karein.
5. **Deploy as Web App**:
   - Top right me **Deploy > New deployment** click karein.
   - Select type: **Web app** (Gear icon par click karke).
   - Description: `Facebook Automation Web App v1`
   - Execute as: **Me (your_email@gmail.com)** *(VERY IMPORTANT)*
   - Who has access: **Anyone** *(VERY IMPORTANT)*
   - **Deploy** button par click karein.
   - Milne wala **Web App URL** (`https://script.google.com/macros/s/.../exec`) copy kar lein.

---

## 📌 STEP 4: Automatic Daily/Hourly Posting (Time-Driven Trigger)

Agar aap chahte hain ki bina Frontend dashboard open kiye har din automatic post ho:
1. Apps Script editor ke left menu me **Triggers (Alarm Clock icon ⏰)** par click karein.
2. Bottom right me **Add Trigger** par click karein.
3. Settings:
   - Choose function to run: `scheduledRun`
   - Select event source: **Time-driven**
   - Select type of time based trigger: **Day timer** (ya **Hour timer**)
   - Select time of day: **8am to 9am** (apni pasand ka time)
4. **Save** par click karein. Ab script daily automatic chalegi aur Google Sheet me log karegi!

---

## 📌 STEP 5: Netlify Frontend Dashboard Deploy Karein

### Method A: Netlify Drag & Drop (Easiest - 1 Minute)
1. Ek naya folder banayein aur usme teenon files rakhein:
   - `index.html`
   - `style.css`
   - `script.js`
2. [Netlify.com](https://www.netlify.com/) par account login karein.
3. Dashboard me **Sites** tab par jayein.
4. Folder ko **"Drag and drop your site folder here"** area me drop kar dein.
5. Netlify aapko ek live URL de dega (e.g. `https://fb-automation-xyz.netlify.app`).

### Dashboard Run Karne Ka Tarika:
1. Netlify Live URL ko browser me kholein.
2. Top box me apna **Google Apps Script Web App URL** paste karein.
3. Optional Topic enter karein (e.g., "Artificial Intelligence in daily life").
4. **Generate & Post Now** par click karein!

---

## 🔍 TROUBLESHOOTING GUIDE (Common Errors & Solutions)

| Error Message | Cause (Karan) | Solution (Upay) |
|---|---|---|
| **CORS Policy Error / Blocked by Preflight** | Frontend se direct JSON content-type header bhejna | Frontend code me `Content-Type: text/plain` use ho raha hai. Apps Script ko hamesha Web App **Execute as: Me** aur **Access: Anyone** pe re-deploy karein. |
| **Facebook Graph API Error (190) / OAuthException** | Facebook Access Token expire ho gaya hai ya invalid hai | Graph API Explorer se naya long-lived token generate karein aur `setupScriptProperties()` re-run karein. |
| **Facebook Graph API Error (200) / Permissions** | Token ke paas `pages_manage_posts` permission nahi hai | Token generate karte waqt Page select karke `pages_manage_posts` aur `pages_read_engagement` permission grant karein. |
| **Gemini API Error (400 / 403 / 429)** | Invalid API Key ya Quota Limit Exceeded | Google AI Studio se API key check karein ki wo valid hai aur billing/quota enabled hai. |
| **Imagen API Error (404 / 400)** | Imagen model access issue | `imagen-3.0-generate-002:predict` endpoint Google AI Studio API key ke sath work karta hai. Ensure karein aapki key me Imagen API enabled ho. |
| **Script Property missing error** | `setupScriptProperties()` run nahi kiya | Apps Script me `setupScriptProperties` select karke Ek baar **Run** dabayein. |
| **Script prompt permissions error** | Google popup review ignore kar diya | Apps Script me "Advanced > Go to project (unsafe)" par click karke permissions Allow karein. |

---

## 🏆 Project Summary
- **Backend**: Google Apps Script (`Code.gs`)
- **AI Text Model**: `gemini-2.0-flash`
- **AI Image Model**: `imagen-3.0-generate-002`
- **Social Integration**: Facebook Graph API v20.0 (`/PAGE_ID/photos`)
- **Database/Logging**: Google Sheets (`Facebook_Automation_Logs`)
- **Frontend**: Responsive HTML5, Vanilla CSS3, JavaScript ES6 (Netlify Ready)
