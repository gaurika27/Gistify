// background.js
class BackgroundService {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstall(details);
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Handle extension icon clicks
        chrome.action.onClicked.addListener((tab) => {
            this.handleIconClick(tab);
        });
    }

    handleInstall(details) {
        if (details.reason === 'install') {
            console.log('YouTube Transcript Summarizer installed');
            
            // Set default settings
            chrome.storage.sync.set({
                defaultSummaryLength: 150,
                defaultMethod: 'auto',
                showNotifications: true,
                autoSummarize: false
            });

            // Open welcome page or show notification
            chrome.tabs.create({
                url: 'https://github.com/ps1899/YouTube-Transcript-Summarizer'
            });
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'openPopup':
                    await this.openPopup(request.url);
                    sendResponse({ success: true });
                    break;

                case 'getCurrentTab':
                    const tab = await this.getCurrentTab();
                    sendResponse({ tab });
                    break;

                case 'checkApiHealth':
                    const health = await this.checkApiHealth();
                    sendResponse({ health });
                    break;

                case 'summarizeVideo':
                    const result = await this.summarizeVideo(request.data);
                    sendResponse({ result });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ settings });
                    break;

                case 'saveSettings':
                    await this.saveSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ error: error.message });
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Update extension icon based on whether we're on YouTube
        if (changeInfo.status === 'complete' && tab.url) {
            this.updateExtensionIcon(tab);
        }
    }

    handleIconClick(tab) {
        // This is handled by the popup, but we can add fallback logic here
        console.log('Extension icon clicked on tab:', tab.url);
    }

    async openPopup(url) {
        try {
            // The popup should open automatically, but we can store context
            await chrome.storage.local.set({
                contextUrl: url,
                lastInteraction: Date.now()
            });
        } catch (error) {
            console.error('Error opening popup:', error);
        }
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return tab;
        } catch (error) {
            console.error('Error getting current tab:', error);
            return null;
        }
    }

    async checkApiHealth() {
        try {
            const response = await fetch('http://127.0.0.1:5000/health');
            return {
                isHealthy: response.ok,
                status: response.status,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                isHealthy: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    async summarizeVideo(data) {
        try {
            const response = await fetch('http://127.0.0.1:5000/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok) {
                // Store successful summary
                await this.storeSummary(data.video_url, result);
                return result;
            } else {
                throw new Error(result.error || 'Summarization failed');
            }
        } catch (error) {
            console.error('Error summarizing video:', error);
            throw error;
        }
    }

    async storeSummary(videoUrl, summary) {
        try {
            const summaryData = {
                url: videoUrl,
                summary: summary.summary,
                timestamp: Date.now(),
                method: summary.method_used,
                originalLength: summary.original_length,
                summaryLength: summary.summary_length
            };

            // Store in local storage
            await chrome.storage.local.set({
                [`summary_${this.getVideoId(videoUrl)}`]: summaryData
            });

            // Keep a list of recent summaries
            const recentSummaries = await chrome.storage.local.get(['recentSummaries']);
            const recent = recentSummaries.recentSummaries || [];
            
            recent.unshift(summaryData);
            
            // Keep only last 10 summaries
            if (recent.length > 10) {
                recent.splice(10);
            }

            await chrome.storage.local.set({ recentSummaries: recent });
        } catch (error) {
            console.error('Error storing summary:', error);
        }
    }

    getVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }

    async getSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'defaultSummaryLength',
                'defaultMethod',
                'showNotifications',
                'autoSummarize'
            ]);

            return {
                defaultSummaryLength: result.defaultSummaryLength || 150,
                defaultMethod: result.defaultMethod || 'auto',
                showNotifications: result.showNotifications !== false,
                autoSummarize: result.autoSummarize || false
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    updateExtensionIcon(tab) {
        const isYouTube = tab.url && (tab.url.includes('youtube.com') || tab.url.includes('youtu.be'));
        
        if (isYouTube) {
            // Set active icon
            chrome.action.setIcon({
                tabId: tab.id,
                path: {
                    16: 'icons/icon16.png',
                    32: 'icons/icon32.png',
                    48: 'icons/icon48.png',
                    128: 'icons/icon128.png'
                }
            });
            
            chrome.action.setTitle({
                tabId: tab.id,
                title: 'YouTube Transcript Summarizer - Click to summarize'
            });
        } else {
            // Set inactive icon (you might want to create grayscale versions)
            chrome.action.setTitle({
                tabId: tab.id,
                title: 'YouTube Transcript Summarizer - Navigate to YouTube'
            });
        }
    }

    // Utility method to show notifications
    async showNotification(title, message, type = 'basic') {
        const settings = await this.getSettings();
        
        if (settings.showNotifications) {
            chrome.notifications.create({
                type: type,
                iconUrl: 'icons/icon48.png',
                title: title,
                message: message
            });
        }
    }

    // Clean up old stored summaries
    async cleanupOldSummaries() {
        try {
            const result = await chrome.storage.local.get(null);
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            const keysToRemove = [];
            
            for (const [key, value] of Object.entries(result)) {
                if (key.startsWith('summary_') && value.timestamp < oneWeekAgo) {
                    keysToRemove.push(key);
                }
            }
            
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log(`Cleaned up ${keysToRemove.length} old summaries`);
            }
        } catch (error) {
            console.error('Error cleaning up old summaries:', error);
        }
    }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Run cleanup on startup
backgroundService.cleanupOldSummaries();

// Set up periodic cleanup (once per day)
chrome.alarms.create('cleanupSummaries', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupSummaries') {
        backgroundService.cleanupOldSummaries();
    }
});