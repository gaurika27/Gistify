// popup.js
class YouTubeSummarizer {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:5000';
        this.currentUrl = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.getCurrentTab();
        this.updateSummaryLengthDisplay();
    }

    setupEventListeners() {
        // Summary length slider
        const summaryLengthSlider = document.getElementById('summaryLength');
        const lengthValue = document.getElementById('lengthValue');
        
        summaryLengthSlider.addEventListener('input', (e) => {
            lengthValue.textContent = `${e.target.value} words`;
        });

        // Summarize button
        document.getElementById('summarizeBtn').addEventListener('click', () => {
            this.summarizeVideo();
        });

        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.updateCurrentUrl(tab.url);
            }
        });
    }

    updateSummaryLengthDisplay() {
        const slider = document.getElementById('summaryLength');
        const display = document.getElementById('lengthValue');
        display.textContent = `${slider.value} words`;
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                this.updateCurrentUrl(tab.url);
            }
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    updateCurrentUrl(url) {
        this.currentUrl = url;
        const urlDisplay = document.getElementById('currentUrl');
        const statusIndicator = document.querySelector('.status-indicator');
        
        if (this.isYouTubeUrl(url)) {
            urlDisplay.textContent = this.truncateUrl(url);
            statusIndicator.classList.remove('inactive');
            statusIndicator.classList.add('active');
            document.getElementById('summarizeBtn').disabled = false;
        } else {
            urlDisplay.textContent = 'Navigate to a YouTube video';
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('inactive');
            document.getElementById('summarizeBtn').disabled = true;
        }
    }

    isYouTubeUrl(url) {
        return url && (url.includes('youtube.com/watch') || url.includes('youtu.be/'));
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    async summarizeVideo() {
        if (!this.isYouTubeUrl(this.currentUrl)) {
            this.showError('Please navigate to a YouTube video first');
            return;
        }

        const summarizeBtn = document.getElementById('summarizeBtn');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');

        // Show loading state
        summarizeBtn.disabled = true;
        loading.style.display = 'block';
        result.style.display = 'none';
        error.style.display = 'none';

        try {
            const summaryLength = document.getElementById('summaryLength').value;
            const summaryMethod = document.getElementById('summaryMethod').value;

            const response = await this.makeRequest('/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: this.currentUrl,
                    max_length: parseInt(summaryLength),
                    method: summaryMethod
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.displayResult(data);
            } else {
                const errorData = await response.json();
                this.showError(errorData.error || 'Failed to summarize video');
            }
        } catch (error) {
            console.error('Error summarizing video:', error);
            this.showError('Unable to connect to the summarization service. Make sure the Flask backend is running.');
        } finally {
            // Hide loading state
            summarizeBtn.disabled = false;
            loading.style.display = 'none';
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    displayResult(data) {
        const result = document.getElementById('result');
        const summaryText = document.getElementById('summaryText');
        const originalLength = document.getElementById('originalLength');
        const summaryLengthDisplay = document.getElementById('summaryLength');
        const methodUsed = document.getElementById('methodUsed');

        summaryText.textContent = data.summary;
        originalLength.textContent = data.original_length.toLocaleString();
        summaryLengthDisplay.textContent = data.summary_length.toLocaleString();
        methodUsed.textContent = data.method_used.toUpperCase();

        result.style.display = 'block';
        
        // Store the result for potential future use
        this.storeResult(data);
    }

    showError(message) {
        const error = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        error.style.display = 'block';
    }

    storeResult(data) {
        // Store the last result in Chrome storage
        chrome.storage.local.set({
            lastSummary: {
                url: this.currentUrl,
                summary: data.summary,
                timestamp: Date.now(),
                method: data.method_used,
                originalLength: data.original_length,
                summaryLength: data.summary_length
            }
        });
    }

    async loadLastResult() {
        try {
            const result = await chrome.storage.local.get(['lastSummary']);
            if (result.lastSummary && result.lastSummary.url === this.currentUrl) {
                // If we have a recent summary for this video, offer to show it
                const timeDiff = Date.now() - result.lastSummary.timestamp;
                if (timeDiff < 300000) { // 5 minutes
                    this.displayResult(result.lastSummary);
                }
            }
        } catch (error) {
            console.error('Error loading last result:', error);
        }
    }
}

// Initialize the summarizer when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeSummarizer();
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh current tab info when popup becomes visible
        const summarizer = new YouTubeSummarizer();
    }
});