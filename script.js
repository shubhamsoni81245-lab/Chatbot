// Name: chatbot
// Project name: projects/556576848477
// Project number: 556576848477
// Project id: gen-lang-client-0927007445

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCJNlX4nS00qIxF0lW5AttjYEPOlcETb-Y",
    authDomain: "smart-collage-project.firebaseapp.com",
    projectId: "smart-collage-project",
    storageBucket: "smart-collage-project.firebasestorage.app",
    messagingSenderId: "157281122997",
    appId: "1:157281122997:web:e7e6654e1d0a0b2fbd5cfc",
    measurementId: "G-HQY0GNNNJG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const floatingBtn = document.getElementById('floating-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Theme toggle logic
    let isDarkTheme = localStorage.getItem('pu_theme') === 'dark';

    function applyTheme() {
        if (isDarkTheme) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    applyTheme(); // Apply on load

    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        localStorage.setItem('pu_theme', isDarkTheme ? 'dark' : 'light');
        applyTheme();
    });

    // Chat Toggle Logic
    floatingBtn.addEventListener('click', () => {
        chatWindow.classList.add('active');
        floatingBtn.style.transform = 'scale(0)';

        // Auto-focus input when opened
        setTimeout(() => userInput.focus(), 300);
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        floatingBtn.style.transform = 'scale(1)';
    });

    // Knowledge Base
    const defaultKnowledge = [
        { keywords: ["location", "where", "address"], response: "Poornima University is in Jaipur, Rajasthan." },
        { keywords: ["courses", "btech", "bca"], response: "We offer B.Tech, BCA, MBA and more." }
    ];

    let knowledgeResponses = defaultKnowledge;

    async function loadKnowledge() {
        const activeId = localStorage.getItem('active_college_slug') || 'pu';
        try {
            const docRef = doc(db, "colleges", activeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.brand_color) {
                    document.documentElement.style.setProperty('--primary-color', data.brand_color);
                    localStorage.setItem('pu_branding', JSON.stringify({ name: data.name, tagline: data.tagline, color: data.brand_color }));
                }
                
                if (data.knowledge) {
                    const kbData = data.knowledge;
                    if (kbData.length > 0) {
                        knowledgeResponses = kbData.map(p => ({
                            keywords: p.keywords.split(',').map(k => k.trim()),
                            response: p.response
                        }));
                    }
                }
            } else {
                // Fallback to local storage if Firebase doesn't have it yet for migration
                const savedData = localStorage.getItem(`kb_${activeId}`);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    if (data.length > 0) {
                        knowledgeResponses = data.map(p => ({
                            keywords: p.keywords.split(',').map(k => k.trim()),
                            response: p.response
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load knowledge from Firebase, using defaults:', error);
        }
    }

    // Call load on start
    loadKnowledge();

    async function getBotResponse(input) {
        const API_KEY = "AIzaSyDocqGqvVQgj6JIisz-sQVBMkIoR_DI2zE";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const context = JSON.stringify(knowledgeResponses);
        const branding = JSON.parse(localStorage.getItem('pu_branding')) || { name: 'Poornima University' };
        const prompt = `You are a smart AI assistant for ${branding.name}.
        Behavior:
        - Explain in simple Hinglish (Hindi + English)
        
        - Use real-life examples
        - Keep responses concise and friendly
        - Knowledge Context: ${context}
        User's query: ${input}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } catch (error) {
            console.error("Chat API Error:", error);
            return `I'm having trouble connecting right now. Please check the official website of ${branding.name} for more info!`;
        }
    }

    // Session Storage & Messaging
    const botBranding = JSON.parse(localStorage.getItem('pu_branding')) || { name: 'Poornima University' };
    let chatHistory = JSON.parse(sessionStorage.getItem('pu_chat_history')) || [
        { text: `Welcome to ${botBranding.name}! I am the Guide Bot. How can I assist you with your educational journey today?`, isBot: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];

    function renderHistory() {
        chatMessages.innerHTML = '';
        chatHistory.forEach(msg => {
            appendMessageHTML(msg.text, msg.isBot, msg.time);
        });
        scrollToBottom();
    }

    function appendMessageHTML(text, isBot, timeString) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;

        messageDiv.innerHTML = `
            <div class="message-text">${text}</div>
            <div class="msg-time">${timeString}</div>
        `;

        chatMessages.appendChild(messageDiv);
    }

    function saveMessage(text, isBot) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatHistory.push({ text, isBot, time });

        // Keep only last 50 messages to save space
        if (chatHistory.length > 50) chatHistory.shift();

        sessionStorage.setItem('pu_chat_history', JSON.stringify(chatHistory));
        appendMessageHTML(text, isBot, time);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'message bot-message';
        indicatorDiv.id = 'typing-indicator-msg';

        indicatorDiv.innerHTML = `
            <div class="typing-container">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        chatMessages.appendChild(indicatorDiv);
        scrollToBottom();
        return indicatorDiv;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        saveMessage(text, false);
        userInput.value = '';

        const indicator = showTypingIndicator();

        // Call the AI API
        const response = await getBotResponse(text);

        indicator.remove();
        saveMessage(response, true);
    }

    sendBtn.addEventListener('click', handleSend);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    window.sendQuickReply = function (text) {
        userInput.value = text;
        handleSend();
    };

    async function loadQuickReplies() {
        const activeId = localStorage.getItem('active_college_slug') || 'pu';
        const qrContainer = document.getElementById('quick-replies');
        if (!qrContainer) return;

        let quickReplies = [
            { label: "Campus", text: "Location" },
            { label: "Programs", text: "Programs" },
            { label: "Placements", text: "Placements" },
            { label: "Scholarships", text: "Fees" }
        ];

        try {
            const docRef = doc(db, "colleges", activeId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().quickReplies) {
                quickReplies = docSnap.data().quickReplies;
            } else {
                const savedQR = localStorage.getItem(`qr_${activeId}`);
                if (savedQR) {
                    quickReplies = JSON.parse(savedQR);
                }
            }
        } catch (error) {
            console.error('Failed to load quick replies from Firebase:', error);
        }

        qrContainer.innerHTML = '';
        quickReplies.forEach(qr => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply';
            // It will call our global function above
            btn.onclick = () => window.sendQuickReply(qr.text);
            btn.textContent = qr.label;
            qrContainer.appendChild(btn);
        });
    }

    // Initialize UI
    renderHistory();
    loadQuickReplies();

    // Automatically open widget on first visit after a slight delay
    if (!sessionStorage.getItem('pu_widget_opened')) {
        setTimeout(() => {
            floatingBtn.click();
            sessionStorage.setItem('pu_widget_opened', 'true');
        }, 3000);
    }


});
