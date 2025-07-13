# Gistify 🎬📝

Gistify is a powerful Chrome Extension that provides concise summaries of YouTube video transcripts in one click. It uses both extractive (LSA) and abstractive (Transformer) Natural Language Processing (NLP) techniques to generate high-quality summaries quickly.

## 🚀 Features
  - 🔍 Smart Summarization: Automatically chooses between LSA and Transformers based on transcript length.

  - 🧠 NLP Powered: Uses Facebook’s BART for abstractive summaries and LSA for extractive ones.

  - 🧩 Dynamic Controls: Customize summary length from 50–300 words.

  - 🌍 Language-Agnostic: Works even for videos without official subtitles.

  - ⚡ Non-blocking UX: Asynchronous communication ensures a seamless experience.

  - 🧼 Clean UI: Minimal and responsive interface.

## 🛠️ Tech Stack
  - Frontend: HTML, CSS, JavaScript (Chrome Extension APIs)

  - Backend: Python, Flask

  - NLP: HuggingFace Transformers, NLTK, scikit-learn

  - YouTube API: youtube-transcript-api

## 📦 Setup Instructions

  - ### Prerequisites
    - Python 3.7+
    - Google Chrome
    - Git
  - ### Installation
    - bash
     ```bash
     git clone https://github.com/gaurika27/Gistify.git
     cd Gistify
     pip install -r requirements.txt
     python TranscriptApp.py
     ```
    - Open chrome://extensions/
    - Enable Developer Mode
    - Click Load Unpacked and select the project folder

## 📈 API Overview
### POST /summarize
  - json
    ```json
    {
    "video_url": "https://youtube.com/watch?v=...",
    "max_length": 150,
    "method": "auto"
    }
    ```

### GET /health
 - Returns API status.

## 📂 Project Structure
```bash
Gistify/
  ├── TranscriptApp.py       # Flask API
  ├── requirements.txt       # Python dependencies
  ├── manifest.json          # Chrome extension config
  ├── popup.html/.js         # Extension UI
  ├── content.js             # YouTube page integration
  ├── background.js          # Background communication
  └── venv/                  # (add to .gitignore)
```
## 🧪 Troubleshooting
  - Ensure Flask is running at http://127.0.0.1:5000/
  - Some videos may lack transcripts
  - Large transcripts may take a few seconds

## Project Screenshot
<img width="520" height="656" alt="image" src="https://github.com/user-attachments/assets/88d98a0b-009b-440a-becd-e17cc10b0c2d" />


## 💡 Future Plans
  - Multi-language support
  - Export summaries (PDF/Markdown)
  - Summary quality score
  - Notion/Obsidian integration

## Happy summarizing with Gistify! 🧠✨
Feel free to ⭐ star or contribute via PRs!
Let me know if you want a version more polished! 💖
