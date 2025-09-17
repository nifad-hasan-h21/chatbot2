// script.js - fixed and enhanced version
const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

let lastSpokenText = ""; // used to ignore assistant's own voice
let recognition;

// Check if browser supports Speech Recognition
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        content.textContent = "Speech Recognition not supported in this browser!";
        speak("Sorry, your browser does not support speech recognition.");
        btn.disabled = true;
        return null;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    
    // Set up event handlers
    recognition.onstart = function() {
        btn.classList.add('listening');
        content.textContent = "Listening...";
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log("Heard:", transcript);
        content.textContent = transcript;

        // ignore if it contains what assistant just said
        if (lastSpokenText && transcript.includes(lastSpokenText)) {
            console.log("Ignored assistant's own voice.");
            return;
        }

        // stop recognition immediately to avoid hearing assistant speak
        try { 
            recognition.stop(); 
            btn.classList.remove('listening');
        } catch (e) { 
            console.error("Error stopping recognition:", e);
        }

        handleCommand(transcript);
    };

    recognition.onerror = function(event) {
        console.error("Recognition error:", event.error);
        content.textContent = "Error: " + event.error;
        btn.classList.remove('listening');
        
        let errorMessage = "Sorry, I didn't catch that.";
        if (event.error === 'no-speech') {
            errorMessage = "I didn't hear anything. Please try again.";
        } else if (event.error === 'audio-capture') {
            errorMessage = "I couldn't access your microphone. Please check permissions.";
        } else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access is blocked. Please allow microphone access.";
        }
        
        speak(errorMessage);
    };

    recognition.onend = function() {
        console.log("Recognition ended.");
        btn.classList.remove('listening');
        // do NOT restart automatically
    };
    
    return recognition;
}

// -------- SPEAK (short & single) --------
function speak(text) {
    // Check if browser supports Speech Synthesis
    if (!window.speechSynthesis) {
        console.error("Speech Synthesis not supported in this browser!");
        return;
    }
    
    // cancel any previous speech, remember what we say
    window.speechSynthesis.cancel();
    lastSpokenText = text.toLowerCase();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1;
    utt.pitch = 1;
    utt.volume = 1;
    window.speechSynthesis.speak(utt);
}

// -------- Setup greeting (optional) --------
function wishMe() {
    const hour = new Date().getHours();
    if (hour < 12) speak("Good morning, sir.");
    else if (hour < 17) speak("Good afternoon, sir.");
    else speak("Good evening, sir.");
}

// Initialize when window loads
window.addEventListener('load', function() {
    // Initialize speech recognition
    recognition = initializeSpeechRecognition();
    
    // small greeting (remove if you don't want auto-speech on load)
    // speak("Initializing JARVIS.");
    // wishMe();
});

// -------- Button click starts listening --------
btn.addEventListener('click', function() {
    if (!recognition) {
        content.textContent = "Speech recognition not available";
        speak("Speech recognition is not available in your browser.");
        return;
    }
    
    content.textContent = "Listening...";
    btn.classList.add('listening');
    try {
        recognition.start();
    } catch (e) {
        console.warn("Recognition start error:", e);
        content.textContent = "Error starting recognition";
        btn.classList.remove('listening');
    }
});

// -------- Command handling (very short responses) --------
function handleCommand(message) {
    // exact short replies — change text if you want different wording
    if (message.includes("open google") || message === "google") {
        window.open("https://google.com", "_blank");
        speak("Here is Google, sir.");
        return;
    }

    if (message.includes("open youtube") || message.includes("youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Here is YouTube, sir.");
        return;
    }

    if (message.includes("open facebook") || message.includes("facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Here is Facebook, sir.");
        return;
    }

    if (message.startsWith("search for ") || message.startsWith("search ")) {
        const q = message.replace(/^search( for)? /, "").trim();
        if (q) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
            speak(`Searching for ${q}.`);
        } else {
            speak("What should I search for, sir?");
        }
        return;
    }

    if (message.includes("wikipedia")) {
        const q = message.replace("wikipedia", "").replace("on", "").trim();
        const url = q ? `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}` : "https://en.wikipedia.org";
        window.open(url, "_blank");
        speak(q ? `Opening Wikipedia for ${q}.` : "Opening Wikipedia, sir.");
        return;
    }

    if (message.includes("time") || message.includes("what time")) {
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        speak(`The time is ${time}.`);
        return;
    }

    if (message.includes("date") || message.includes("what date")) {
        const date = new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
        speak(`Today is ${date}.`);
        return;
    }

    if (message.includes("calculator")) {
        window.open("https://www.google.com/search?q=calculator", "_blank");
        speak("Opening calculator, sir.");
        return;
    }
    
    if (message.includes("joke")) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "What do you call a fake noodle? An impasta!",
            "How does a penguin build its house? Igloos it together!",
            "Why did the math book look so sad? Because it had too many problems!"
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        speak(randomJoke);
        return;
    }
    
    if (message.includes("weather")) {
        window.open("https://www.google.com/search?q=weather", "_blank");
        speak("Showing weather information, sir.");
        return;
    }

    // Minimal fallback: only a short line & open search
    if (message.length > 0) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(message)}`, "_blank");
        speak(`Here is what I found for ${message}.`);
        return;
    }

    // no input
    speak("I didn't get that, sir.");
}