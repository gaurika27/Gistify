// content.js
class YouTubeContentHandler {
    constructor() {
        this.currentUrl = '';
        this.init();
    }

    init() {
        this.currentUrl = window.location.href;
        this.setupUrlMonitoring();
        this.injectSummaryButton();
    }

    setupUrlMonitoring() {
        // Monitor URL changes in YouTube (SPA navigation)
        let lastUrl = location.href;
        
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.currentUrl = url;
                this.handleUrlChange();
            }
        }).observe(document, { subtree: true, childList: true });

        // Also listen for popstate events
        window.addEventListener('popstate', () => {
            this.currentUrl = window.location.href;
            this.handleUrlChange();
        });
    }

    handleUrlChange() {
        // Remove existing summary button and inject new one
        this.removeSummaryButton();
        
        // Wait for YouTube to load the new content
        setTimeout(() => {
            this.injectSummaryButton();
        }, 1000);
    }

    injectSummaryButton() {
        // Only inject on video pages
        if (!this.isVideoPage()) {
            return;
        }

        // Wait for the YouTube UI to be ready
        const checkForVideoInfo = setInterval(() => {
            const videoInfo = this.getVideoInfoContainer();
            
            if (videoInfo && !document.getElementById('yt-summarizer-btn')) {
                clearInterval(checkForVideoInfo);
                this.createSummaryButton(videoInfo);
            }
        }, 500);

        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => {
            clearInterval(checkForVideoInfo);
        }, 10000);
    }

    isVideoPage() {
        return window.location.pathname === '/watch' && window.location.search.includes('v=');
    }

    getVideoInfoContainer() {
        // Try multiple selectors to find the video info container
        const selectors = [
            '#above-the-fold',
            '#primary-inner',
            '#info',
            '#info-contents',
            '#owner',
            '.ytd-video-primary-info-renderer',
            '.ytd-video-secondary-info-renderer'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        return null;
    }

    createSummaryButton(container) {
        // Create the summary button
        const summaryBtn = document.createElement('div');
        summaryBtn.id = 'yt-summarizer-btn';
        summaryBtn.innerHTML = `
            <button class="yt-summarizer-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>Summarize Transcript</span>
            </button>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #yt-summarizer-btn {
                margin: 8px 0;
                padding: 0;
            }
            
            .yt-summarizer-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
                color: white;
                border: none;
                border-radius: 18px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: "Roboto", sans-serif;
                box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
            }
            
            .yt-summarizer-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
                background: linear-gradient(45deg, #ff5252, #ff7979);
            }
            
            .yt-summarizer-button:active {
                transform: translateY(0);
            }
            
            .yt-summarizer-button svg {
                flex-shrink: 0;
            }
            
            .yt-summarizer-button.loading {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .yt-summarizer-button.loading::after {
                content: "";
                width: 12px;
                height: 12px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 8px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        // Inject styles if not already present
        if (!document.getElementById('yt-summarizer-styles')) {
            style.id = 'yt-summarizer-styles';
            document.head.appendChild(style);
        }

        // Add click event listener
        const button = summaryBtn.querySelector('.yt-summarizer-button');
        button.addEventListener('click', () => {
            this.openSummarizerPopup();
        });

        // Insert the button in the appropriate location
        this.insertButtonInContainer(container, summaryBtn);
    }

    insertButtonInContainer(container, button) {
        // Try to insert after video title or at the beginning of the container
        const videoTitle = container.querySelector('h1, .title, .ytd-video-primary-info-renderer');
        
        if (videoTitle) {
            // Insert after video title
            videoTitle.parentNode.insertBefore(button, videoTitle.nextSibling);
        } else {
            // Insert at the beginning of the container
            container.insertBefore(button, container.firstChild);
        }
    }

    openSummarizerPopup() {
        // Send message to background script to open the extension popup
        chrome.runtime.sendMessage({
            action: 'openPopup',
            url: window.location.href
        });
    }

    removeSummaryButton() {
        const existingButton = document.getElementById('yt-summarizer-btn');
        if (existingButton) {
            existingButton.remove();
        }
    }

    // Listen for messages from popup
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getCurrentUrl') {
                sendResponse({ url: window.location.href });
            } else if (request.action === 'checkVideoAvailability') {
                sendResponse({ 
                    isVideoPage: this.isVideoPage(),
                    url: window.location.href 
                });
            }
        });
    }
}

// Initialize the content handler when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new YouTubeContentHandler();
    });
} else {
    new YouTubeContentHandler();
}

// Handle dynamic content loading
let contentHandler;
const initContentHandler = () => {
    if (!contentHandler) {
        contentHandler = new YouTubeContentHandler();
        contentHandler.setupMessageListener();
    }
};

// Re-initialize on navigation
window.addEventListener('yt-navigate-finish', initContentHandler);
window.addEventListener('load', initContentHandler);

// Fallback for SPA navigation
let lastHref = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
        lastHref = location.href;
        setTimeout(initContentHandler, 100);
    }
});

observer.observe(document.body, { 
    childList: true, 
    subtree: true 
});