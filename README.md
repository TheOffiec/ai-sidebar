# AI HR toolbox Chrome Extension

## Description
Chrome extension for searching jobs, working with AI models (OpenAI, Gemini, ElevenLabs) and document management. 
Allows user to ask AI for their chance vs job description and needed résumé adjustments.
Supports file upload, audio features, and conversation with AI models.
It also serves as a helpful AI assistant for working with content in the browser and on the currently active page. It can summarize articles, help draft email replies, and support users in analyzing and processing content available in the current browser tab.

## Features
- Upload and manage files (IndexedDB storage)
- Integrate with OpenAI, Gemini, ElevenLabs APIs
- Text-to-Speech and Speech-to-Text (audio) with ElevenLabs
- Conversation and message view
- API key and parameter configuration

## Installation
1. Clone the repository or copy files to a directory.
2. In Chrome, go to `chrome://extensions/`.
3. Enable developer mode.
4. Click "Load unpacked" and select the project folder.

## Usage
- Disable AI toolbox 1.0 if present
- Refresh the job offer page if the extenssion was freshly installed
- Open the extension popup
- Mark preferred AI provider ( recommending Gemini )
- Configure API keys ( you can use links under the (i) icon following the provider to generate them )
- Select version and inspect the template
- If needed, select audio provider and its API key, then select preferred voice
- Upload files and manage them in the UI, select files to be included in the conversation
- Type your question or record it with a microphone
- AI answers will appear in the conversation window, each with a download option
- Answers can be played as audio if the audio provider is configured
- All configuration will be saved for later

## Files
- `sidebar.html` – user interface
- `popup.html` – user interface for audio access
- `sidebar.js` – UI logic, conversation, audio, API communication
- `popup.js` – audio access
- `audio.js` – ElevenLabs integration (TTS/STT)
- `documents.js` – file management, base64 conversion
- `content.js` – script for page content
- `manifest.json` – Chrome extension configuration
- `popup.md` – technical documentation
- `popup.test.js`, `audio.test.js` – unit tests

## Testing
Unit tests (Jest):
```
npm install --save-dev jest
npx jest popup.test.js
npx jest audio.test.js
```

## Requirements
- Chrome (Manifest V3)
- OpenAI/Gemini/ElevenLabs API key
- Node.js (for running tests)

## Author
HRchromeAI Chrome Extension Project
