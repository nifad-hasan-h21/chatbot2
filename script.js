// script.js - JARVIS Virtual Assistant
// DOM Elements
const talkBtn = document.getElementById('talkBtn');
const commandInput = document.getElementById('commandInput');
const listeningAnimation = document.getElementById('listeningAnimation');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const speechRate = document.getElementById('speechRate');
const speechPitch = document.getElementById('speechPitch');
const autoListen = document.getElementById('autoListen');
const saveHistory = document.getElementById('saveHistory');
const resetSettings = document.getElementById('resetSettings');
const voiceSelect = document.getElementById('voiceSelect');
const currentTimeElement = document.getElementById('current-time');
const currentDateElement = document.getElementById('current-date');

// App State
let isListening = false;
let lastSpokenText = "";
let speechSynthesis = window.speechSynthesis;
let recognition;
let activationKeyword = "hey jarvis";
let isAwake = false;

// Initialize the app
function init() {
    loadSettings();
    setupSpeechRecognition();
    setupSpeechSynthesis();
    populateVoices();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Event listeners for UI elements
    talkBtn.addEventListener('click', toggleListening);
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommand(commandInput.value);
            commandInput.value = '';
        }
    });
    
    clearHistoryBtn.addEventListener('click', () => {
        historyList.innerHTML = '';
        const systemItem = document.createElement('li');
        systemItem.className = 'history-item system';
        systemItem.innerHTML = '<span class="user-command"><i class="fas fa-server"></i> SYSTEM: HISTORY CLEARED</span>';
        historyList.appendChild(systemItem);
        speak("History cleared, Sir.");
    });
    
    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.add('open');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('open');
    });
    
    speechRate.addEventListener('input', saveSettings);
    speechPitch.addEventListener('input', saveSettings);
    autoListen.addEventListener('change', saveSettings);
    saveHistory.addEventListener('change', saveSettings);
    
    resetSettings.addEventListener('click', () => {
        localStorage.removeItem('jarvisSettings');
        loadSettings();
        speak("Settings restored to default values.");
    });
    
    // Populate voices when they are loaded
    speechSynthesis.onvoiceschanged = populateVoices;
    
    // Initial greeting
    setTimeout(() => {
        addToHistory('SYSTEM', 'J.A.R.V.I.S. INITIALIZED');
        speak("All systems operational. Ready for your command, Sir.");
    }, 1000);
}

// Update date and time in HUD
function updateDateTime() {
    const now = new Date();
    
    // Update time
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    currentTimeElement.textContent = time;
    
    // Update date
    const date = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    currentDateElement.textContent = date;
}

// Set up speech recognition
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        addToHistory('SYSTEM', 'Speech recognition is not supported in this browser.');
        speak('Speech recognition is not supported in this browser.');
        talkBtn.disabled = true;
        return null;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        talkBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        listeningAnimation.style.display = 'block';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Heard:', transcript);
        
        // Check for activation keyword
        if (transcript.includes(activationKeyword) || isAwake) {
            if (transcript.includes(activationKeyword)) {
                isAwake = true;
                const command = transcript.replace(activationKeyword, '').trim();
                if (command) {
                    handleCommand(command);
                } else {
                    speak("Yes, Sir. How may I assist you?");
                }
            } else {
                handleCommand(transcript);
            }
        }
        
        recognition.stop();
    };
    
    recognition.onend = () => {
        isListening = false;
        talkBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        listeningAnimation.style.display = 'none';
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        isListening = false;
        talkBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        listeningAnimation.style.display = 'none';
        
        if (event.error === 'not-allowed') {
            speak("Microphone access is not allowed. Please enable microphone permissions.");
        }
    };
}

// Set up speech synthesis
function setupSpeechSynthesis() {
    if (!speechSynthesis) {
        addToHistory('SYSTEM', 'Speech synthesis is not supported in this browser.');
        return;
    }
}

// Populate voice selection dropdown
function populateVoices() {
    if (!speechSynthesis) return;
    
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.default) {
            option.selected = true;
        }
        voiceSelect.appendChild(option);
    });
}

// Toggle listening state
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Handle voice commands
function handleCommand(command) {
    if (!command) return;
    
    addToHistory('USER', command);
    
    // Convert command to lowercase for easier matching
    const lowerCommand = command.toLowerCase();
    
    // Process commands
    if (lowerCommand.includes('time')) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        speak(`The current time is ${time}`);
        addToHistory('JARVIS', `The current time is ${time}`);
    } 
    else if (lowerCommand.includes('date')) {
        const now = new Date();
        const date = now.toLocaleDateString();
        speak(`Today's date is ${date}`);
        addToHistory('JARVIS', `Today's date is ${date}`);
    }
    else if (lowerCommand.includes('google')) {
        speak("Opening Google");
        window.open('https://www.google.com', '_blank');
        addToHistory('JARVIS', 'Opening Google');
    }
    else if (lowerCommand.includes('youtube')) {
        speak("Opening YouTube");
        window.open('https://www.youtube.com', '_blank');
        addToHistory('JARVIS', 'Opening YouTube');
    }
    else if (lowerCommand.includes('facebook')) {
        speak("Opening Facebook");
        window.open('https://www.facebook.com', '_blank');
        addToHistory('JARVIS', 'Opening Facebook');
    }
    else if (lowerCommand.includes('wikipedia')) {
        speak("Opening Wikipedia");
        window.open('https://www.wikipedia.org', '_blank');
        addToHistory('JARVIS', 'Opening Wikipedia');
    }
    else if (lowerCommand.includes('search') && lowerCommand.includes('for')) {
        const query = command.split('for')[1].trim();
        speak(`Searching for ${query}`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        addToHistory('JARVIS', `Searching for ${query}`);
    }
    else if (lowerCommand.includes('joke')) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "What do you call a fake noodle? An impasta!",
            "Why couldn't the bicycle stand up by itself? It was two tired!",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus!"
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        speak(joke);
        addToHistory('JARVIS', joke);
    }
    else if (lowerCommand.includes('sleep')) {
        speak("Going to sleep. Say 'Hey Jarvis' to wake me up.");
        isAwake = false;
        addToHistory('JARVIS', 'Going to sleep');
    }
    else {
        speak("I'm sorry, I don't understand that command yet.");
        addToHistory('JARVIS', "I'm sorry, I don't understand that command yet.");
    }
}

// Add item to command history
function addToHistory(type, content) {
    const item = document.createElement('li');
    
    if (type === 'USER') {
        item.className = 'history-item user';
        item.innerHTML = `<span class="user-command"><i class="fas fa-user"></i> USER: ${content}</span>`;
    } 
    else if (type === 'JARVIS') {
        item.className = 'history-item jarvis';
        item.innerHTML = `
            <span class="user-command"><i class="fas fa-robot"></i> JARVIS:</span>
            <span class="assistant-response">${content}</span>
        `;
    }
    else if (type === 'SYSTEM') {
        item.className = 'history-item system';
        item.innerHTML = `<span class="user-command"><i class="fas fa-server"></i> SYSTEM: ${content}</span>`;
    }
    
    historyList.appendChild(item);
    historyList.scrollTop = historyList.scrollHeight;
}

// Speak text using speech synthesis
function speak(text) {
    if (!speechSynthesis) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
    utterance.rate = parseFloat(speechRate.value);
    utterance.pitch = parseFloat(speechPitch.value);
    
    // Select voice if available
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        const selectedVoice = voiceSelect.value;
        if (selectedVoice !== 'default') {
            utterance.voice = voices.find(voice => voice.name === selectedVoice) || voices[0];
        }
    }
    
    utterance.onend = () => {
        if (autoListen.checked && isAwake) {
            setTimeout(() => recognition.start(), 500);
        }
    };
    
    speechSynthesis.speak(utterance);
    lastSpokenText = text;
}

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('jarvisSettings')) || {};
    
    speechRate.value = settings.speechRate || 1;
    speechPitch.value = settings.speechPitch || 1;
    autoListen.checked = settings.autoListen !== undefined ? settings.autoListen : true;
    saveHistory.checked = settings.saveHistory !== undefined ? settings.saveHistory : true;
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        speechRate: parseFloat(speechRate.value),
        speechPitch: parseFloat(speechPitch.value),
        autoListen: autoListen.checked,
        saveHistory: saveHistory.checked
    };
    
    localStorage.setItem('jarvisSettings', JSON.stringify(settings));
}

// Initialize the app when the window loads
window.addEventListener('load', init);
