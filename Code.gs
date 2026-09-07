/**
 * ==============================================================================
 * FACEBOOK AUTOMATION SYSTEM - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * Model Used: gemini-2.0-flash (Caption) & imagen-3.0-generate-002 (Image)
 * Deployment: Deploy as Web App (Execute as: Me, Access: Anyone)
 * ==============================================================================
 */

/**
 * 1. ONE-TIME CONFIGURATION SETUP
 * Apps Script Editor mein is function ko ek baar select karke "Run" karein
 * taaki aapke sensitive keys PropertiesService mein secure store ho sakein.
 */
function setupScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'GEMINI_API_KEY': 'YOUR_GEMINI_API_KEY_HERE',
    'FB_PAGE_ID': 'YOUR_FACEBOOK_PAGE_ID_HERE',
    'FB_PAGE_ACCESS_TOKEN': 'YOUR_FACEBOOK_PAGE_ACCESS_TOKEN_HERE',
    'LOG_SHEET_ID': '1DfQmhNSSGV5dZnlI2-eD-V8-E0h5FJM7o1EoleNiA5OwMcNZY9UkG_sI' // User's Google Sheet ID
  });
  Logger.log('✅ Configuration Properties successfully saved!');
}

/**
 * Helper: Script Properties fetch karne ke liye
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties().getProperties();
  
  if (!props.GEMINI_API_KEY || props.GEMINI_API_KEY.includes('YOUR_GEMINI')) {
    throw new Error('GEMINI_API_KEY configured nahi hai! Pehle setupScriptProperties() run karein.');
  }
  if (!props.FB_PAGE_ID || props.FB_PAGE_ID.includes('YOUR_FACEBOOK')) {
    throw new Error('FB_PAGE_ID configured nahi hai! Pehle setupScriptProperties() run karein.');
  }
  if (!props.FB_PAGE_ACCESS_TOKEN || props.FB_PAGE_ACCESS_TOKEN.includes('YOUR_FACEBOOK')) {
    throw new Error('FB_PAGE_ACCESS_TOKEN configured nahi hai! Pehle setupScriptProperties() run karein.');
  }
  
  return props;
}

/**
 * 2. WEB APP ENDPOINTS (doGet & doPost)
 * Frontend se aane wali requests handle karne ke liye.
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'get_logs';
    
    if (action === 'get_logs') {
      const logs = getLogs();
      return jsonResponse({ status: 'success', data: logs });
    }
    
    return jsonResponse({ status: 'success', message: 'Facebook Automation Web App Active & Ready!' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (pErr) {
        payload = {};
      }
    }

    const action = payload.action || (e && e.parameter && e.parameter.action) || 'run_automation';
    
    if (action === 'run_automation') {
      const topic = payload.topic || (e && e.parameter && e.parameter.topic) || '';
      const result = runAutomation(topic);
      return jsonResponse(result);
    } else if (action === 'get_logs') {
      const logs = getLogs();
      return jsonResponse({ status: 'success', data: logs });
    } else {
      return jsonResponse({ status: 'error', message: 'Invalid action specified: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * CORS-safe JSON Response helper
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. MAIN AUTOMATION FLOW (runAutomation)
 */
function runAutomation(topic) {
  const startTime = new Date();
  let caption = '';
  let postId = '';

  try {
    Logger.log('🚀 Starting Automation Run... Topic: ' + (topic || 'Trending Topic'));
    const config = getConfig();

    // Step A: Generate Text Caption using Gemini 2.0 Flash
    Logger.log('📝 Generating Caption via Gemini 2.0 Flash API...');
    caption = generateContent(config, topic);
    Logger.log('✅ Caption Generated: ' + caption.substring(0, 100) + '...');

    // Step B: Generate Image using Gemini / Imagen API
    Logger.log('🎨 Generating Image via Imagen 3 / Gemini Image API...');
    const imageBlob = generateImage(config, caption);
    Logger.log('✅ Image Generated Successfully!');

    // Step C: Post Image & Caption to Facebook Page
    Logger.log('📤 Posting to Facebook Page...');
    postId = postToFacebook(config, imageBlob, caption);
    Logger.log('🎉 Successfully posted to Facebook! Post ID: ' + postId);

    // Step D: Log Success Result to Google Sheet
    logResult('SUCCESS', caption, postId);

    return {
      status: 'success',
      message: 'Facebook Post published successfully!',
      caption: caption,
      postId: postId,
      timestamp: startTime.toLocaleString()
    };
  } catch (error) {
    const errorMsg = error.message || error.toString();
    Logger.log('❌ Error in Automation Run: ' + errorMsg);
    
    // Log Failure to Google Sheet
    logResult('FAILED', caption || ('Error: ' + errorMsg), 'N/A');

    return {
      status: 'error',
      message: errorMsg,
      timestamp: startTime.toLocaleString()
    };
  }
}

/**
 * 4. GEMINI TEXT CAPTION GENERATION (generateContent)
 */
function generateContent(config, topic) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`;
  
  let promptText = 'Write an engaging, high-performing Facebook post caption.';
  if (topic && topic.trim() !== '') {
    promptText += ` The post should be focused on topic: "${topic.trim()}".`;
  } else {
    promptText += ` Pick an inspiring, trending, or highly educational digital lifestyle/tech/business topic.`;
  }
  
  promptText += ` Instructions:
  - Keep the tone friendly, enthusiastic, and compelling.
  - Include appropriate engaging emojis throughout the text.
  - Include 3 to 5 relevant hashtags at the bottom.
  - Structure it neatly with short readable paragraphs.
  - Provide ONLY the post caption text ready to publish (no metadata, no intro text like "Here is your caption:").`;

  const payload = {
    "contents": [
      {
        "parts": [
          { "text": promptText }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 800
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    throw new Error(`Gemini Text API Error (${responseCode}): ${responseText}`);
  }

  const json = JSON.parse(responseText);
  if (json.candidates && json.candidates.length > 0 && json.candidates[0].content && json.candidates[0].content.parts.length > 0) {
    return json.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('Gemini Text API returned invalid output format.');
  }
}

/**
 * 5. GEMINI / IMAGEN IMAGE GENERATION (generateImage)
 */
function generateImage(config, captionText) {
  // Imagen 3 model prediction endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${config.GEMINI_API_KEY}`;

  // Image prompt derived from caption text
  const cleanSummary = captionText.replace(/[#\n\r]/g, ' ').substring(0, 200);
  const imagePrompt = `High quality, modern, visually stunning digital graphic illustration representing: ${cleanSummary}. Vivid vibrant colors, 4k resolution, clean composition, social media artwork. No text overlays.`;

  const payload = {
    "instances": [
      { "prompt": imagePrompt }
    ],
    "parameters": {
      "sampleCount": 1,
      "aspectRatio": "1:1",
      "outputMimeType": "image/jpeg"
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    throw new Error(`Imagen API Error (${responseCode}): ${responseText}`);
  }

  const json = JSON.parse(responseText);
  
  if (json.predictions && json.predictions.length > 0 && json.predictions[0].bytesBase64Encoded) {
    const base64Data = json.predictions[0].bytesBase64Encoded;
    const imageBytes = Utilities.base64Decode(base64Data);
    return Utilities.newBlob(imageBytes, 'image/jpeg', 'facebook_post.jpg');
  } else {
    throw new Error('Imagen API se valid base64 image data nahi mila.');
  }
}

/**
 * 6. FACEBOOK GRAPH API POSTING (postToFacebook)
 */
function postToFacebook(config, imageBlob, caption) {
  const url = `https://graph.facebook.com/v20.0/${config.FB_PAGE_ID}/photos`;

  const payload = {
    'message': caption,
    'source': imageBlob,
    'access_token': config.FB_PAGE_ACCESS_TOKEN
  };

  const options = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  const json = JSON.parse(responseText);

  if (responseCode !== 200 || json.error) {
    const errDetail = json.error ? (json.error.message || JSON.stringify(json.error)) : responseText;
    throw new Error(`Facebook Graph API Error (${responseCode}): ${errDetail}`);
  }

  return json.id || json.post_id || 'POST_PUBLISHED';
}

/**
 * 7. GOOGLE SHEET LOGGING (logResult & getOrCreateLogSheet)
 */
function getOrCreateLogSheet() {
  const config = PropertiesService.getScriptProperties().getProperties();
  let spreadsheet;

  if (config.LOG_SHEET_ID && config.LOG_SHEET_ID.trim() !== '') {
    try {
      spreadsheet = SpreadsheetApp.openById(config.LOG_SHEET_ID.trim());
    } catch (e) {
      Logger.log('⚠️ Configured LOG_SHEET_ID invalid tha. Naya spreadsheet open/create kar rahe hain.');
    }
  }

  if (!spreadsheet) {
    try {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('Facebook Automation Logs');
    PropertiesService.getScriptProperties().setProperty('LOG_SHEET_ID', spreadsheet.getId());
    Logger.log('✨ Naya Spreadsheet Banaya Gaya ID: ' + spreadsheet.getId());
  }

  const sheetName = 'Facebook_Automation_Logs';
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Header Row add karein
    sheet.appendRow(['Timestamp', 'Status', 'Caption', 'Post ID']);
    // Style Header Row
    const headerRange = sheet.getRange(1, 1, 1, 4);
    headerRange.setBackground('#1877f2');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function logResult(status, caption, postId) {
  try {
    const sheet = getOrCreateLogSheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    // Shorten long caption for clean sheet view
    const shortCaption = caption ? (caption.length > 250 ? caption.substring(0, 250) + '...' : caption) : 'N/A';
    
    sheet.appendRow([timestamp, status, shortCaption, postId]);
  } catch (err) {
    Logger.log('⚠️ Sheet me log entry append karne me error: ' + err.toString());
  }
}

function getLogs() {
  try {
    const sheet = getOrCreateLogSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return []; // Return empty array if only header row exists
    }

    // Read last 50 entries
    const startRow = Math.max(2, lastRow - 49);
    const numRows = lastRow - startRow + 1;
    const values = sheet.getRange(startRow, 1, numRows, 4).getValues();

    // Formatting for JSON output
    const logs = values.map(row => {
      let tsFormatted = row[0];
      if (row[0] instanceof Date) {
        tsFormatted = Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      return {
        timestamp: tsFormatted,
        status: row[1],
        caption: row[2],
        postId: row[3]
      };
    });

    // Reverse so newest logs appear first
    return logs.reverse();
  } catch (err) {
    Logger.log('⚠️ Logs fetch karne me error: ' + err.toString());
    return [];
  }
}

/**
 * 8. TIME-DRIVEN TRIGGER FUNCTION (scheduledRun)
 * Automatically schedule hone par ye function chalega without frontend trigger.
 */
function scheduledRun() {
  Logger.log('⏰ Scheduled Automated Trigger Fired!');
  const topics = [
    'Artificial Intelligence Tools for Daily Productivity',
    'Tech News and Innovation Insights',
    'Digital Growth & Online Business Tips',
    'Daily Motivation & High Performance Habits',
    'Creative Coding & Technology Trends'
  ];
  
  // Randomly select topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  return runAutomation(randomTopic);
}
