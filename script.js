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

// Initialize the app
function init() {
    console.log('Initializing JARVIS...');
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
    if (speechSynthesis) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }
    
    // Initial greeting
    setTimeout(() => {
        addToHistory('SYSTEM', 'J.A.R.V.I.S. INITIALIZED');
        speak("All systems operational. Ready for your command, Sir.");
    }, 1000);
}

// Update date and time in HUD
function updateDateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (currentTimeElement) currentTimeElement.textContent = time;
    const date = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (currentDateElement) currentDateElement.textContent = date;
}

// Show microphone error message
function showMicrophoneError() {
    addToHistory('SYSTEM', 'Microphone access is blocked. Please allow microphone permissions in your browser settings.');
    speak("Microphone access is blocked. Please allow microphone permissions to use voice commands.");
    isMicrophoneBlocked = true;
    talkBtn.disabled = true;
    talkBtn.title = "Microphone access blocked - click to enable";
    talkBtn.style.opacity = "0.5";
}

// Set up speech recognition
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        addToHistory('SYSTEM', 'Speech recognition is not supported in this browser.');
        talkBtn.disabled = true;
        talkBtn.title = "Speech recognition not supported";
        talkBtn.style.opacity = "0.5";
        return null;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        talkBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        talkBtn.classList.add('listening');
        listeningAnimation.style.display = 'block';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Heard:', transcript);
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
        talkBtn.classList.remove('listening');
        listeningAnimation.style.display = 'none';
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        isListening = false;
        talkBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        talkBtn.classList.remove('listening');
        listeningAnimation.style.display = 'none';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            showMicrophoneError();
        }
    };
}

// Set up speech synthesis
function setupSpeechSynthesis() {
    if (!speechSynthesis) {
        addToHistory('SYSTEM', 'Speech synthesis is not supported in this browser.');
    }
}

// Populate voice selection dropdown
function populateVoices() {
    if (!speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = 'DEFAULT VOICE';
    voiceSelect.appendChild(defaultOption);
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.default) option.selected = true;
        voiceSelect.appendChild(option);
    });
}

// Toggle listening state
function toggleListening() {
    if (isMicrophoneBlocked) {
        speak("Please enable microphone permissions in your browser settings to use voice commands.");
        addToHistory('SYSTEM', 'Microphone access is blocked. Guide user to enable permissions.');
        return;
    }
    if (!recognition) {
        speak("Speech recognition is not available in your browser.");
        return;
    }
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            isAwake = true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            speak("I'm having trouble accessing the microphone. Please check your permissions.");
        }
    }
}

// Handle voice commands
function handleCommand(command) {
    if (!command) return;
    addToHistory('USER', command);
    const lowerCommand = command.toLowerCase();
    
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
    else if (lowerCommand.includes('search for')) {
        const query = command.split('for')[1]?.trim() || '';
        if (query) {
            speak(`Searching for ${query}`);
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            addToHistory('JARVIS', `Searching for ${query}`);
        } else {
            speak("What would you like me to search for?");
        }
    }
    else if (lowerCommand.includes('open calculator')) {
        speak("Opening calculator");
        window.open('https://www.google.com/search?q=calculator', '_blank');
        addToHistory('JARVIS', 'Opening calculator');
    }
    else if (lowerCommand.includes('clear history')) {
        historyList.innerHTML = '';
        const systemItem = document.createElement('li');
        systemItem.className = 'history-item system';
        systemItem.innerHTML = '<span class="user-command"><i class="fas fa-server"></i> SYSTEM: HISTORY CLEARED</span>';
        historyList.appendChild(systemItem);
        speak("History cleared, Sir.");
    }
    else if (lowerCommand.includes('go to sleep')) {
        speak("Going to sleep. Say 'Hey Jarvis' to wake me up.");
        isAwake = false;
        addToHistory('JARVIS', 'Going to sleep');
    }
    else if (lowerCommand.includes('play music')) {
        speak("Playing music");
        window.open('https://www.youtube.com/watch?v=jNQXAC9IVRw', '_blank');
        addToHistory('JARVIS', 'Playing music');
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
    else if (lowerCommand.includes('create note')) {
        speak("Creating a note");
        const note = prompt("What would you like to note down?");
        if (note) {
            speak(`Note created: ${note}`);
            addToHistory('JARVIS', `Created note: ${note}`);
        }
    }
    else if (lowerCommand.includes('set alarm')) {
        speak("Setting an alarm");
        const time = prompt("What time should I set the alarm for?");
        if (time) {
            speak(`Alarm set for ${time}`);
            addToHistory('JARVIS', `Alarm set for ${time}`);
        }
    }
    else if (lowerCommand.includes('set timer')) {
        speak("Setting a timer");
        const duration = prompt("How long should the timer be? (e.g., 5 minutes)");
        if (duration) {
            speak(`Timer set for ${duration}`);
            addToHistory('JARVIS', `Timer set for ${duration}`);
        }
    }
    else if (lowerCommand.includes('add to calendar')) {
        speak("Adding to calendar");
        const event = prompt("What event would you like to add to the calendar?");
        if (event) {
            speak(`Added ${event} to calendar`);
            addToHistory('JARVIS', `Added ${event} to calendar`);
        }
    }
    else if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
        speak("Hello Sir. How may I assist you today?");
        addToHistory('JARVIS', 'Hello Sir. How may I assist you today?');
    }
    else if (lowerCommand.includes('thank')) {
        speak("You're welcome, Sir. Is there anything else I can help with?");
        addToHistory('JARVIS', "You're welcome, Sir. Is there anything else I can help with?");
    }
    else if (lowerCommand.includes('who are you')) {
        speak("I am JARVIS, Just A Rather Very Intelligent System. Your personal assistant.");
        addToHistory('JARVIS', "I am JARVIS, Just A Rather Very Intelligent System. Your personal assistant.");
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
    if (!speechSynthesis) {
        console.log("Speech synthesis not available:", text);
        return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(speechRate.value) || 1;
    utterance.pitch = parseFloat(speechPitch.value) || 1;
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0 && voiceSelect.value !== 'default') {
        utterance.voice = voices.find(voice => voice.name === voiceSelect.value) || voices[0];
    }
    utterance.onend = () => {
        if (autoListen.checked && isAwake && recognition) {
            setTimeout(() => {
                try { recognition.start(); } 
                catch (error) { console.error('Error restarting recognition after speech:', error); }
            }, 500);
        }
    };
    try {
        speechSynthesis.speak(utterance);
        lastSpokenText = text;
    } catch (error) {
        console.error('Error with speech synthesis:', error);
    }
}

// Load settings
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('jarvisSettings')) || {};
    if (speechRate) speechRate.value = settings.speechRate || 1;
    if (speechPitch) speechPitch.value = settings.speechPitch || 1;
    if (autoListen) autoListen.checked = settings.autoListen !== undefined ? settings.autoListen : true;
    if (saveHistory) saveHistory.checked = settings.saveHistory !== undefined ? settings.saveHistory : true;
}

// Save settings
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

// Fallback for speech recognition errors
window.addEventListener('click', function() {
    if (isMicrophoneBlocked) {
        try {
            setupSpeechRecognition();
            isMicrophoneBlocked = false;
            talkBtn.disabled = false;
            talkBtn.style.opacity = "1";
            talkBtn.title = "";
            addToHistory('SYSTEM', 'Microphone access reinitialized. Please try again.');
        } catch (error) {
            console.error('Failed to reinitialize recognition:', error);
        }
    }
});
