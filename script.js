// script.js - JARVIS Virtual Assistant
console.log('JARVIS script loaded successfully');

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
let isMicrophoneBlocked = false;

// Keep context for follow-up commands (like search, alarm, timer, calendar)
let pendingCommand = null;

// Initialize the app
function init() {
    console.log('Initializing JARVIS...');
    loadSettings();
    setupSpeechRecognition();
    setupSpeechSynthesis();
    populateVoices();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Event listeners
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

    if (speechSynthesis) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    // Initial greeting
    setTimeout(() => {
        addToHistory('SYSTEM', 'J.A.R.V.I.S. INITIALIZED');
        speak("All systems operational. Ready for your command, Sir.");
    }, 1000);
}

// Update HUD time/date
function updateDateTime() {
    const now = new Date();
    if (currentTimeElement) currentTimeElement.textContent = now.toLocaleTimeString();
    if (currentDateElement) currentDateElement.textContent = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Show microphone error
function showMicrophoneError() {
    addToHistory('SYSTEM', 'Microphone access is blocked. Please allow microphone permissions.');
    speak("Microphone access is blocked. Please allow microphone permissions to use voice commands.");
    isMicrophoneBlocked = true;
    talkBtn.disabled = true;
    talkBtn.style.opacity = "0.5";
}

// Set up speech recognition
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        addToHistory('SYSTEM', 'Speech recognition not supported in this browser.');
        talkBtn.disabled = true;
        talkBtn.style.opacity = "0.5";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true; // keep listening
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        talkBtn.classList.add('listening');
        listeningAnimation.style.display = 'block';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log("Heard:", transcript);

        if (pendingCommand) {
            handleFollowUp(transcript);
        } else if (transcript.includes(activationKeyword) || isAwake) {
            if (transcript.includes(activationKeyword)) {
                isAwake = true;
                const command = transcript.replace(activationKeyword, '').trim();
                if (command) handleCommand(command);
                else speak("Yes Sir, how may I assist you?");
            } else {
                handleCommand(transcript);
            }
        }
    };

    recognition.onend = () => {
        if (isListening) recognition.start(); // auto-restart for continuous listening
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') showMicrophoneError();
    };
}

// Toggle mic
function toggleListening() {
    if (isMicrophoneBlocked) {
        speak("Please enable microphone permissions in your browser settings.");
        return;
    }
    if (isListening) {
        recognition.stop();
        isListening = false;
        talkBtn.classList.remove('listening');
        listeningAnimation.style.display = 'none';
    } else {
        recognition.start();
        isAwake = true;
    }
}

// Handle commands
function handleCommand(command) {
    if (!command) return;
    addToHistory('USER', command);
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('time')) {
        const time = new Date().toLocaleTimeString();
        speak(`The current time is ${time}`);
        addToHistory('JARVIS', `The current time is ${time}`);
    }
    else if (lowerCommand.includes('date')) {
        const date = new Date().toLocaleDateString();
        speak(`Today's date is ${date}`);
        addToHistory('JARVIS', `Today's date is ${date}`);
    }
    else if (lowerCommand.startsWith('search for')) {
        const query = command.replace(/search for/i, '').trim();
        if (query) {
            speak(`Searching for ${query}`);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            addToHistory('JARVIS', `Searching for ${query}`);
        } else {
            speak("What should I search for?");
            pendingCommand = 'search';
        }
    }
    else if (lowerCommand.includes('open google')) {
        speak("Opening Google");
        window.open('https://www.google.com', '_blank');
        addToHistory('JARVIS', 'Opening Google');
    }
    else if (lowerCommand.includes('open youtube')) {
        speak("Opening YouTube");
        window.open('https://www.youtube.com', '_blank');
        addToHistory('JARVIS', 'Opening YouTube');
    }
    else if (lowerCommand.includes('open facebook')) {
        speak("Opening Facebook");
        window.open('https://www.facebook.com', '_blank');
        addToHistory('JARVIS', 'Opening Facebook');
    }
    else if (lowerCommand.includes('open wikipedia')) {
        speak("Opening Wikipedia");
        window.open('https://www.wikipedia.org', '_blank');
        addToHistory('JARVIS', 'Opening Wikipedia');
    }
    else if (lowerCommand.includes('open calculator')) {
        speak("Opening calculator");
        window.open('https://www.google.com/search?q=calculator', '_blank');
        addToHistory('JARVIS', 'Opening calculator');
    }
    else if (lowerCommand.includes('play music')) {
        speak("Playing music");
        window.open('https://www.youtube.com/watch?v=jNQXAC9IVRw', '_blank');
        addToHistory('JARVIS', 'Playing music');
    }
    else if (lowerCommand.includes('weather')) {
        speak("Checking weather forecast");
        window.open('https://www.google.com/search?q=weather', '_blank');
        addToHistory('JARVIS', 'Checking weather forecast');
    }
    else if (lowerCommand.includes('news')) {
        speak("Getting news updates");
        window.open('https://news.google.com', '_blank');
        addToHistory('JARVIS', 'Getting news updates');
    }
    else if (lowerCommand.includes('set alarm')) {
        speak("Please tell me the time for the alarm.");
        pendingCommand = 'alarm';
    }
    else if (lowerCommand.includes('set timer')) {
        speak("Please tell me the duration for the timer.");
        pendingCommand = 'timer';
    }
    else if (lowerCommand.includes('add to calendar') || lowerCommand.includes('set calendar')) {
        speak("Please tell me the event to add to the calendar.");
        pendingCommand = 'calendar';
    }
    else if (lowerCommand.includes('clear history')) {
        historyList.innerHTML = '';
        speak("History cleared, Sir.");
        addToHistory('SYSTEM', "HISTORY CLEARED");
    }
    else if (lowerCommand.includes('sleep')) {
        speak("Going to sleep. Say 'Hey Jarvis' to wake me up.");
        isAwake = false;
    }
    else if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        speak("Hello Sir, how may I assist you today?");
        addToHistory('JARVIS', "Hello Sir, how may I assist you today?");
    }
    else if (lowerCommand.includes('thank')) {
        speak("You're welcome, Sir. Anything else?");
        addToHistory('JARVIS', "You're welcome, Sir.");
    }
    else if (lowerCommand.includes('who are you')) {
        speak("I am JARVIS, your personal assistant.");
        addToHistory('JARVIS', "I am JARVIS, your personal assistant.");
    }
    else {
        speak("I'm sorry, I don't understand that command yet.");
        addToHistory('JARVIS', "Unknown command.");
    }
}

// Handle follow-ups (for search, alarm, timer, calendar)
function handleFollowUp(response) {
    if (!pendingCommand) return;
    if (pendingCommand === 'search') {
        speak(`Searching for ${response}`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(response)}`, '_blank');
        addToHistory('JARVIS', `Searching for ${response}`);
    }
    else if (pendingCommand === 'alarm') {
        speak(`Alarm set for ${response}`);
        addToHistory('JARVIS', `Alarm set for ${response}`);
    }
    else if (pendingCommand === 'timer') {
        speak(`Timer set for ${response}`);
        addToHistory('JARVIS', `Timer set for ${response}`);
    }
    else if (pendingCommand === 'calendar') {
        speak(`Added ${response} to calendar`);
        addToHistory('JARVIS', `Added to calendar: ${response}`);
    }
    pendingCommand = null;
}

// Add to history
function addToHistory(type, content) {
    const item = document.createElement('li');
    if (type === 'USER') {
        item.className = 'history-item user';
        item.innerHTML = `<span class="user-command"><i class="fas fa-user"></i> USER: ${content}</span>`;
    } else if (type === 'JARVIS') {
        item.className = 'history-item jarvis';
        item.innerHTML = `<span class="user-command"><i class="fas fa-robot"></i> JARVIS:</span><span class="assistant-response">${content}</span>`;
    } else {
        item.className = 'history-item system';
        item.innerHTML = `<span class="user-command"><i class="fas fa-server"></i> SYSTEM: ${content}</span>`;
    }
    historyList.appendChild(item);
    historyList.scrollTop = historyList.scrollHeight;
}

// Speech synthesis
function speak(text) {
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(speechRate.value) || 1;
    utterance.pitch = parseFloat(speechPitch.value) || 1;
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0 && voiceSelect.value !== 'default') {
        utterance.voice = voices.find(v => v.name === voiceSelect.value) || voices[0];
    }
    speechSynthesis.speak(utterance);
    lastSpokenText = text;
}

// Settings
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('jarvisSettings')) || {};
    if (speechRate) speechRate.value = settings.speechRate || 1;
    if (speechPitch) speechPitch.value = settings.speechPitch || 1;
    if (autoListen) autoListen.checked = settings.autoListen !== undefined ? settings.autoListen : true;
    if (saveHistory) saveHistory.checked = settings.saveHistory !== undefined ? settings.saveHistory : true;
}
function saveSettings() {
    const settings = {
        speechRate: parseFloat(speechRate.value),
        speechPitch: parseFloat(speechPitch.value),
        autoListen: autoListen.checked,
        saveHistory: saveHistory.checked
    };
    localStorage.setItem('jarvisSettings', JSON.stringify(settings));
}

// Init
window.addEventListener('load', init);
