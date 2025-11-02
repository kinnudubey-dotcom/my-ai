// API Configuration
const API_CONFIG = {
    url: "https://api.euron.one/api/v1/euri/chat/completions",
    apiKey: "euri-0cf8caa31efd1464374df0cb5f0bcceb1bf64f8ac3032dcf6ad4b43d850bbb49",
    model: "gpt-4.1-nano",
    maxTokens: 1000,
    temperature: 0.7
};

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const clearChatBtn = document.getElementById('clearChat');
const typingIndicator = document.getElementById('typingIndicator');
const welcomeMessage = document.getElementById('welcomeMessage');
const charCount = document.getElementById('charCount');
const suggestionButtons = document.querySelectorAll('.suggestion-btn');
const toast = document.getElementById('toast');

// State
let conversationHistory = [];
const userName = "Divyansh";

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConversationHistory();
    setupEventListeners();
    autoResizeTextarea();
    loadSavedTheme();
});

// Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', () => {
        updateCharCount();
        autoResizeTextarea();
    });

    clearChatBtn.addEventListener('click', clearChat);
    attachBtn.addEventListener('click', () => showToast('File attachment feature coming soon!'));

    // Suggestion buttons
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const suggestion = btn.getAttribute('data-suggestion');
            messageInput.value = suggestion;
            autoResizeTextarea();
            updateCharCount();
            sendMessage();
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Update character count
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count} / 2000`;
    if (count > 1800) {
        charCount.style.color = '#ff6b6b';
    } else {
        charCount.style.color = 'rgba(255, 255, 255, 0.7)';
    }
}

// Send Message
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }

    if (message.length > 2000) {
        showToast('Message is too long! Maximum 2000 characters.');
        return;
    }

    // Hide welcome message
    welcomeMessage.classList.add('hidden');

    // Add user message to UI
    addMessageToUI('user', message, userName);

    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    updateCharCount();

    // Show typing indicator
    showTypingIndicator();

    try {
        // Add user message to conversation history
        conversationHistory.push({
            role: 'user',
            content: message
        });

        // Call API
        const response = await fetchAPI(message);

        // Hide typing indicator
        hideTypingIndicator();

        // Handle different response structures
        let aiMessage = null;
        
        if (response && response.choices && response.choices.length > 0) {
            // Standard OpenAI-compatible format
            aiMessage = response.choices[0].message?.content || response.choices[0].text;
        } else if (response && response.content) {
            // Direct content format
            aiMessage = response.content;
        } else if (response && response.message) {
            // Message format
            aiMessage = response.message;
        } else if (response && typeof response === 'string') {
            // String response
            aiMessage = response;
        }

        if (aiMessage) {
            // Add AI message to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: aiMessage
            });

            // Add AI message to UI
            addMessageToUI('ai', aiMessage, 'AI');

            // Save conversation history
            saveConversationHistory();
        } else {
            console.error('Unexpected API response:', response);
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Error:', error);
        addMessageToUI('ai', `Sorry ${userName}, I encountered an error. Please try again. Error: ${error.message}`, 'AI');
        showToast('Failed to get response. Please try again.');
    }

    // Scroll to bottom
    scrollToBottom();
}

// Fetch API
async function fetchAPI(userMessage) {
    const payload = {
        messages: [
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            {
                role: 'user',
                content: userMessage
            }
        ],
        model: API_CONFIG.model,
        max_tokens: API_CONFIG.maxTokens,
        temperature: API_CONFIG.temperature
    };

    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {
            const errorText = await response.text().catch(() => '');
            if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
    }

    try {
        return await response.json();
    } catch (error) {
        // If response is not JSON, try to get text
        const textResponse = await response.text();
        if (textResponse) {
            return textResponse;
        }
        throw new Error('Failed to parse API response');
    }
}

// Add Message to UI
function addMessageToUI(role, text, senderName) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? senderName.charAt(0).toUpperCase() : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatMessage(text);

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = formatTime(new Date());

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copyBtn.title = 'Copy message';
    copyBtn.addEventListener('click', () => copyToClipboard(text));

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    contentDiv.appendChild(copyBtn);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Format Message (Basic Markdown Support)
function formatMessage(text) {
    if (!text) return '';
    
    let formatted = text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Code blocks (```code```)
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text** or __text__) - must be before italic
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_) - single asterisk/underscore
    // Only match if not preceded/followed by another asterisk/underscore
    formatted = formatted.replace(/([^*]|^)\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    formatted = formatted.replace(/([^_]|^)_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    
    return formatted;
}

// Format Time
function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Show/Hide Typing Indicator
function showTypingIndicator() {
    typingIndicator.classList.add('active');
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
}

// Scroll to Bottom
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Clear Chat
function clearChat() {
    if (conversationHistory.length === 0 && messagesContainer.children.length === 0) {
        return;
    }

    if (confirm(`Are you sure you want to clear the chat, ${userName}?`)) {
        conversationHistory = [];
        messagesContainer.innerHTML = '';
        welcomeMessage.classList.remove('hidden');
        localStorage.removeItem('chatbot-conversation');
        showToast('Chat cleared successfully!');
        scrollToBottom();
    }
}

// Save/Load Conversation History
function saveConversationHistory() {
    try {
        localStorage.setItem('chatbot-conversation', JSON.stringify(conversationHistory));
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

function loadConversationHistory() {
    try {
        const saved = localStorage.getItem('chatbot-conversation');
        if (saved) {
            conversationHistory = JSON.parse(saved);
            // Restore messages to UI
            conversationHistory.forEach((msg, index) => {
                if (msg.role === 'user') {
                    addMessageToUI('user', msg.content, userName);
                } else if (msg.role === 'assistant') {
                    addMessageToUI('ai', msg.content, 'AI');
                }
            });
            
            if (conversationHistory.length > 0) {
                welcomeMessage.classList.add('hidden');
            }
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Copy to Clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Message copied to clipboard!');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy message');
    }
}

// Toast Notification
function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('chatbot-theme', newTheme);
    
    showToast(`Theme changed to ${newTheme} mode`);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('chatbot-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

// Error Handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An error occurred. Please refresh the page.');
});

// Network Status
window.addEventListener('online', () => {
    showToast('Connection restored!');
});

window.addEventListener('offline', () => {
    showToast('You are offline. Please check your connection.');
});

// Prevent form submission on Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === messageInput && !e.shiftKey) {
        e.preventDefault();
    }
});

