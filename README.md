# AI HR toolbox Chrome Extension


## Description
AI HR Toolbox is a Chrome extension designed to support users in job offer analysis, CV optimization, and working with web content using AI models.
It enables users to evaluate how well their CV matches a job offer, compare their experience with job requirements, and receive suggestions for improving application documents.
The extension also allows users to upload and manage files, interact with AI models (OpenAI, Gemini), and use audio features (ElevenLabs).
It also works as a practical AI assistant in the browser — capable of analyzing content from the currently active page, summarizing articles, helping draft email replies, and supporting users in analyzing and processing information available in the current browser tab.
The extension works directly in the browser, with local configuration and file storage on the client side.

## Use Cases
- AI-powered job offer analysis
- CV match evaluation against job requirements
- Suggestions for improving application documents
- Analysis of content from the active browser tab (e.g. job offers, articles, messages)
- Working with uploaded files and current webpage content in a shared AI context
- Article summarization
- AI-assisted email reply drafting
- Support for multiple AI providers (OpenAI, Gemini, ElevenLabs)
- Voice interaction with AI (speech-to-text and text-to-speech)
- Conversation history with downloadable responses
- API key and AI model configuration


## Quick Start
1. Install and pin the extension to the Chrome toolbar for quick access.
2. If you previously used **AI Toolbox 1.0**, disable it to avoid conflicts.
3. Refresh the current webpage if the extension was freshly installed.
4. Open the extension.
5. Select your preferred AI provider:
   - **Gemini** (recommended for free-tier usage)
   - **OpenAI**
6. Add your API key.
   Click the **(i)** icon next to the selected provider to open the API setup page.

   For Gemini:
   - create an account
   - generate a free API key

7. (Optional) Configure **ElevenLabs** for voice features:
   - add your API key
   - select your preferred voice
   - allow microphone access if using voice input

8. Select your preferred AI model version.
9. (Optional) Customize the instruction template.
10. Upload a PDF document you want to work with (e.g. your résumé / CV) and select it for the AI context.
11. Open a webpage you want to analyze (e.g. a job offer, article, or email content).
12. Start interacting with the AI assistant.

---

## Usage
- Open the extension while browsing any webpage
- Use the current webpage content as AI context
- Work with your uploaded PDF together with webpage content
- Type your question or use microphone input
- Continue the conversation in the AI chat panel
- Download generated responses if needed
- Listen to responses using audio playback (if voice features are configured)
- Change AI provider, model, or template settings at any time
- Your configuration and uploaded files are stored locally in the browser for future use

## Project Structure
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

## Maintained by
HRchromeAI Team
