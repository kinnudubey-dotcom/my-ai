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
let userName = "Divyansh";
let currentUser = null;

// Authentication State
let users = JSON.parse(localStorage.getItem('chatbot-users')) || {};

// DOM Elements - Sign In
const signinModal = document.getElementById('signinModal');
const chatContainer = document.getElementById('chatContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabButtons = document.querySelectorAll('.tab-btn');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeUserName = document.getElementById('welcomeUserName');
const welcomeMessageText = document.getElementById('welcomeMessageText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupAuthEventListeners();
    setupEventListeners();
    loadSavedTheme();
});

// Authentication Functions
function checkAuth() {
    const loggedInUser = localStorage.getItem('chatbot-current-user');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        userName = currentUser.name;
        showChat();
    } else {
        showSignIn();
    }
}

function showSignIn() {
    signinModal.classList.remove('hidden');
    chatContainer.style.display = 'none';
}

function showChat() {
    signinModal.classList.add('hidden');
    chatContainer.style.display = 'flex';
    updateWelcomeMessage();
    loadConversationHistory();
    autoResizeTextarea();
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

function updateWelcomeMessage() {
    if (welcomeUserName) {
        // Always use "Hello" for personalized greeting
        welcomeUserName.textContent = `Hello, ${userName}! 👋`;
    }
    
    // Update welcome message text if element exists
    if (welcomeMessageText) {
        welcomeMessageText.textContent = `I'm your AI assistant. How can I help you today, ${userName}?`;
    }
}

// Setup Auth Event Listeners
function setupAuthEventListeners() {
    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Google Sign-In buttons
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignUpBtn = document.getElementById('googleSignUpBtn');
    
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    if (googleSignUpBtn) {
        googleSignUpBtn.addEventListener('click', handleGoogleSignUp);
    }

    // Initialize Google Sign-In
    initializeGoogleSignIn();
}

function switchTab(tab) {
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }
    
    clearErrorMessage();
}

function handleLogin(e) {
    e.preventDefault();
    clearErrorMessage();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    const user = users[email];
    if (!user) {
        showError('User not found. Please sign up first.');
        return;
    }

    // Simple password check (in production, use proper hashing)
    if (user.password !== password) {
        showError('Incorrect password');
        return;
    }

    // Login successful
    currentUser = {
        email: email,
        name: user.name,
        provider: 'email'
    };
    userName = user.name;
    
    localStorage.setItem('chatbot-current-user', JSON.stringify(currentUser));
    showError('Login successful!', 'success');
    
    setTimeout(() => {
        showChat();
    }, 500);
}

function handleSignup(e) {
    e.preventDefault();
    clearErrorMessage();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (users[email]) {
        showError('Email already registered. Please login.');
        setTimeout(() => {
            switchTab('login');
            document.getElementById('loginEmail').value = email;
        }, 1000);
        return;
    }

    // Create new user
    users[email] = {
        name: name,
        password: password, // In production, hash this!
        email: email,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('chatbot-users', JSON.stringify(users));

    // Auto login
    currentUser = {
        email: email,
        name: name,
        provider: 'email'
    };
    userName = name;
    
    localStorage.setItem('chatbot-current-user', JSON.stringify(currentUser));
    showError('Account created successfully!', 'success');
    
    setTimeout(() => {
        showChat();
    }, 500);
}

function handleLogout() {
    if (confirm(`Are you sure you want to logout, ${userName}?`)) {
        localStorage.removeItem('chatbot-current-user');
        currentUser = null;
        userName = "Guest";
        conversationHistory = [];
        localStorage.removeItem('chatbot-conversation');
        showSignIn();
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        clearErrorMessage();
    }
}

function showError(message, type = 'error') {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.className = type === 'success' ? 'success' : '';
    }
}

function clearErrorMessage() {
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.className = '';
    }
}

// Google Sign-In Functions
function initializeGoogleSignIn() {
    // Google Sign-In configuration
    // Note: You'll need to create OAuth 2.0 credentials in Google Cloud Console
    // For demo purposes, using a simple implementation
    
    window.handleGoogleCredential = (response) => {
        // Decode the credential
        const credential = parseJwt(response.credential);
        
        // Handle successful Google sign-in
        handleGoogleAuth(credential);
    };
}

function handleGoogleSignIn() {
    // Check if client_id is configured
    const clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
    
    // For demo mode: Use mock Google sign-in if not configured
    if (clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        // Demo mode: Simulate Google Sign-In
        handleDemoGoogleSignIn();
        return;
    }

    // Production mode: Use real Google OAuth
    if (typeof google === 'undefined' || !google.accounts) {
        showError('Google Sign-In is loading. Please try again in a moment.', 'error');
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                handleGoogleSignIn();
            } else {
                // Fallback to demo mode if Google API doesn't load
                handleDemoGoogleSignIn();
            }
        }, 1000);
        return;
    }

    // Initialize Google Sign-In
    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential
    });

    // Show Google Sign-In popup
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Try showing One Tap or button
            google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile',
                callback: (response) => {
                    if (response.access_token) {
                        // Get user info from Google API
                        fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
                            .then(res => res.json())
                            .then(data => {
                                handleGoogleAuth(data);
                            })
                            .catch(err => {
                                showError('Failed to sign in with Google. Please try again.');
                                console.error('Google OAuth error:', err);
                            });
                    }
                }
            }).requestAccessToken();
        }
    });
}

// Google Sign-In (Permanent implementation without OAuth)
function handleDemoGoogleSignIn() {
    // Create and show Google Sign-In modal
    showGoogleSignInModal();
}

function showGoogleSignInModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'google-signin-modal-overlay';
    modal.id = 'googleSignInModal';
    
    modal.innerHTML = `
        <div class="google-signin-modal">
            <div class="google-signin-header">
                <div class="google-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                </div>
                <h2>Sign in with Google</h2>
                <p>Choose an account to continue</p>
            </div>
            <div class="google-signin-body">
                <div class="google-account-input">
                    <input type="email" id="googleEmailInput" placeholder="Enter your email" autocomplete="email">
                </div>
                <div class="google-signin-options">
                    <button class="google-continue-btn" id="googleContinueBtn">
                        Continue
                    </button>
                    <div class="google-divider">
                        <span>or</span>
                    </div>
                    <button class="google-guest-btn" id="googleGuestBtn">
                        Continue as guest
                    </button>
                </div>
            </div>
            <button class="google-close-btn" id="googleCloseBtn">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const emailInput = document.getElementById('googleEmailInput');
    const continueBtn = document.getElementById('googleContinueBtn');
    const guestBtn = document.getElementById('googleGuestBtn');
    const closeBtn = document.getElementById('googleCloseBtn');
    
    // Continue button
    continueBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email) {
            emailInput.focus();
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailInput.style.borderColor = '#EA4335';
            setTimeout(() => {
                emailInput.style.borderColor = '';
            }, 2000);
            return;
        }
        
        // Process sign-in
        processGoogleSignIn(email);
        closeGoogleModal();
    });
    
    // Enter key on input
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            continueBtn.click();
        }
    });
    
    // Guest button
    guestBtn.addEventListener('click', () => {
        const guestEmail = `guest_${Date.now()}@google.com`;
        processGoogleSignIn(guestEmail, 'Guest User');
        closeGoogleModal();
    });
    
    // Close button
    closeBtn.addEventListener('click', closeGoogleModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeGoogleModal();
        }
    });
    
    // Focus input
    setTimeout(() => emailInput.focus(), 100);
}

function processGoogleSignIn(email, nameOverride = null) {
    // Extract name from email if not provided
    let userName;
    if (nameOverride) {
        userName = nameOverride;
    } else {
        // Better name extraction from email
        const nameFromEmail = email.split('@')[0];
        
        // Handle common email formats
        if (nameFromEmail.includes('.')) {
            // Format: first.last or first_last
            userName = nameFromEmail.replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        } else if (nameFromEmail.includes('_')) {
            // Format: first_last
            userName = nameFromEmail.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        } else {
            // Single word - capitalize first letter
            userName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1).toLowerCase();
        }
        
        // If still no good name, use a default
        if (!userName || userName.length < 2) {
            userName = 'User';
        }
    }

    // Create Google user
    const googleUser = {
        email: email.trim(),
        name: userName,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4285F4&color=fff&size=128`,
        provider: 'google'
    };

    // Handle authentication
    handleGoogleAuth(googleUser);
    showError('Signed in with Google successfully!', 'success');
}

function closeGoogleModal() {
    const modal = document.getElementById('googleSignInModal');
    if (modal) {
        modal.remove();
    }
}

function handleGoogleSignUp() {
    handleGoogleSignIn(); // Same process for sign up
}

function handleGoogleCredential(response) {
    // Decode the credential JWT
    const credential = parseJwt(response.credential);
    
    if (!credential) {
        showError('Failed to process Google sign-in. Please try again.');
        return;
    }
    
    // Handle successful Google sign-in
    handleGoogleAuth(credential);
}

function handleGoogleAuth(credential) {
    // Extract user info from Google credential
    const googleUser = {
        email: credential.email || credential.sub + '@google.com',
        name: credential.name || credential.given_name || 'User',
        picture: credential.picture || '',
        provider: 'google'
    };

    if (!googleUser.email) {
        showError('Failed to get email from Google account.');
        return;
    }

    // Check if user exists, if not create account
    if (!users[googleUser.email]) {
        users[googleUser.email] = {
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            provider: 'google',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('chatbot-users', JSON.stringify(users));
    }

    // Login user
    currentUser = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        provider: 'google'
    };
    userName = googleUser.name;
    
    localStorage.setItem('chatbot-current-user', JSON.stringify(currentUser));
    showError('Signed in with Google successfully!', 'success');
    
    setTimeout(() => {
        showChat();
    }, 500);
}

// Helper function to parse JWT (for demo - use a library in production)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// Alternative: Simple Google Sign-In with One Tap (when OAuth is configured)
function setupGoogleOneTap() {
    if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
            callback: handleGoogleCredential
        });
        
        window.google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            { theme: 'outline', size: 'large', width: '100%' }
        );
        
        window.google.accounts.id.prompt();
    }
}

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

