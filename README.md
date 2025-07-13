\#Gistify



A Chrome Extension that allows users to get a summarized version of the transcripts of YouTube videos with a single click. It utilizes Natural Language Processing (NLP) algorithms such as Latent Semantic Analysis (LSA) and state-of-the-art Huggingface Transformer models to efficiently summarize the transcripts of YouTube videos.



\## Features



\- \*\*Advanced NLP Summarization\*\*: Employs both extractive (LSA) and abstractive (Transformer) summarization techniques

\- \*\*Intelligent Method Selection\*\*: Automatically chooses the best summarization method based on transcript length

\- \*\*Customizable Summary Length\*\*: Adjust the maximum length of the summarized text through dynamic controls

\- \*\*Language Agnostic\*\*: Supports transcript summarization even for videos without subtitles

\- \*\*Non-blocking Communication\*\*: Uses asynchronous requests to ensure smooth user experience

\- \*\*Modern UI\*\*: Clean, responsive interface with real-time feedback



\## Summarization Methods



\### 1. Latent Semantic Analysis (LSA) - Extractive

\- Used for very long transcripts (>5000 characters)

\- Extracts the most important sentences from the original transcript

\- Maintains original phrasing and context

\- Efficient for processing large amounts of text



\### 2. Transformer Models - Abstractive

\- Used for shorter transcripts (<5000 characters)

\- Uses Facebook's BART model for generating new summary text

\- Creates more natural, coherent summaries

\- Better at capturing overall meaning and context



\### 3. Auto Mode (Recommended)

\- Automatically selects the best method based on transcript length

\- Provides optimal balance between quality and performance



\## Installation



\### Prerequisites

\- Python 3.7 or higher

\- Google Chrome browser

\- Git



\### Setup Instructions



1\. \*\*Clone the repository:\*\*

```bash

git clone https://github.com/ps1899/YouTube-Transcript-Summarizer.git

cd YouTube-Transcript-Summarizer

```



2\. \*\*Install Python dependencies:\*\*

```bash

pip install -r Requirements.txt

```



3\. \*\*Start the Flask backend:\*\*

```bash

python TranscriptApp.py

```

This will start a local server at `http://127.0.0.1:5000/`. You may see a couple of warnings but it's all good and you may ignore them!



4\. \*\*Load the Chrome extension:\*\*

&nbsp;  - Open Google Chrome and go to `chrome://extensions/`

&nbsp;  - Enable the \*\*Developer mode\*\* toggle in the top right corner

&nbsp;  - Click on \*\*Load unpacked\*\* and select the directory where you cloned this repository



5\. \*\*Start using the extension:\*\*

&nbsp;  - Navigate to any YouTube video

&nbsp;  - Click on the extension icon in the Chrome toolbar

&nbsp;  - Click "Summarize Video" to get an instant summary



\## Usage



1\. \*\*Navigate to a YouTube video\*\* - The extension will automatically detect when you're on a YouTube video page

2\. \*\*Click the extension icon\*\* - The popup will show the current video URL and summarization options

3\. \*\*Customize settings\*\* (optional):

&nbsp;  - Adjust summary length (50-300 words)

&nbsp;  - Select summarization method (Auto/Transformer/LSA)

4\. \*\*Click "Summarize Video"\*\* - The extension will process the transcript and display the summary

5\. \*\*View results\*\* - The summary will appear with statistics about the original and summarized content



\## API Endpoints



\### POST /summarize

Summarize a YouTube video transcript.



\*\*Request Body:\*\*

```json

{

&nbsp; "video\_url": "https://www.youtube.com/watch?v=VIDEO\_ID",

&nbsp; "max\_length": 150,

&nbsp; "method": "auto"

}

```



\*\*Response:\*\*

```json

{

&nbsp; "summary": "The summarized content...",

&nbsp; "original\_length": 5420,

&nbsp; "summary\_length": 567,

&nbsp; "method\_used": "transformer"

}

```



\### GET /health

Check the health status of the API.



\*\*Response:\*\*

```json

{

&nbsp; "status": "healthy",

&nbsp; "message": "YouTube Transcript Summarizer API is running"

}

```



\## Project Structure



```

YouTube-Transcript-Summarizer/

├── TranscriptApp.py          # Flask backend application

├── Requirements.txt          # Python dependencies

├── manifest.json            # Chrome extension manifest

├── popup.html              # Extension popup interface

├── popup.js                # Popup functionality

├── content.js              # Content script for YouTube integration

├── background.js           # Background service worker

├── icons/                  # Extension icons

│   ├── icon16.png

│   ├── icon32.png

│   ├── icon48.png

│   └── icon128.png

└── README.md               # This file

```



\## Technologies Used



\### Backend

\- \*\*Flask\*\*: Web framework for the REST API

\- \*\*NLTK\*\*: Natural Language Processing library

\- \*\*scikit-learn\*\*: Machine learning library for LSA

\- \*\*Transformers\*\*: Hugging Face library for transformer models

\- \*\*youtube-transcript-api\*\*: Library to fetch YouTube transcripts



\### Frontend

\- \*\*Chrome Extension API\*\*: For browser integration

\- \*\*Vanilla JavaScript\*\*: For popup and content script functionality

\- \*\*HTML/CSS\*\*: For user interface design



\## Error Handling



The extension includes comprehensive error handling for:

\- \*\*Network connectivity issues\*\*

\- \*\*Videos without available transcripts\*\*

\- \*\*API server unavailability\*\*

\- \*\*Invalid YouTube URLs\*\*

\- \*\*Timeout scenarios\*\*



\## Contributing



Contributions to this project are welcome! If you wish to contribute, please follow these steps:



1\. Fork the repository

2\. Create a new branch for your features or fixes

3\. Make your changes and commit them

4\. Push your changes to your fork

5\. Create a Pull Request from your fork to this repository



\*\*Note\*\*: Make sure to update the `Requirements.txt` file if you've added any new dependencies.



\## License



This project is open source and available under the \[MIT License](LICENSE).



\## Troubleshooting



\### Common Issues



1\. \*\*Extension not working\*\*: Make sure the Flask backend is running on `http://127.0.0.1:5000/`

2\. \*\*No transcript found\*\*: Some videos may not have transcripts available

3\. \*\*Slow summarization\*\*: Large transcripts may take longer to process

4\. \*\*API connection error\*\*: Check if the backend server is running and accessible



\### System Requirements



\- \*\*Python\*\*: 3.7 or higher

\- \*\*Chrome\*\*: Latest version recommended

\- \*\*Memory\*\*: At least 2GB RAM for transformer models

\- \*\*Storage\*\*: ~500MB for model files and dependencies



\## Future Enhancements



\- Support for multiple languages

\- Summary quality scoring

\- Export summaries to different formats

\- Integration with note-taking applications

\- Batch processing for multiple videos

\- Summary comparison features



\## Support



If you encounter any issues or have questions, please:

1\. Check the troubleshooting section above

2\. Search through existing GitHub issues

3\. Create a new issue with detailed information about the problem



---



\*\*Happy Summarizing!\*\* 🎬📝

