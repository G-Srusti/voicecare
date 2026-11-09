const questionArea = document.getElementById("question-area");
const progressFill = document.getElementById("progress-fill");
const stepLabel = document.getElementById("step-label");

let selectedLanguage = "en-IN";
let selectedCategory = "";
let complaintText = "";
let currentStep = 1;
let recognition = null;
let isListening = false;

const languages = {
    "en-IN": "English",
    "kn-IN": "Kannada",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "es-ES": "Spanish"
};

const categories = [
    "Hospital cleanliness",
    "Staff behaviour",
    "Long waiting time",
    "Medicine availability",
    "Doctor availability",
    "Other"
];

function updateProgress(step) {
    currentStep = step;
    stepLabel.textContent = `STEP 0${step} OF 03`;
    progressFill.style.width = `${(step / 3) * 100}%`;
}

function showLanguageStep() {
    updateProgress(1);

    questionArea.innerHTML = `
        <h3>Which language would you like to use?</h3>
        <p class="question-help">Choose the language you're most comfortable speaking.</p>

        <div class="language-grid">
            ${Object.entries(languages).map(([code, name]) => `
                <button class="language-option ${selectedLanguage === code ? "selected" : ""}"
                    data-language="${code}">
                    ${name}
                </button>
            `).join("")}
        </div>

        <button class="primary-button continue-button" id="continue-button">
            Continue <span>→</span>
        </button>
    `;

    document.querySelectorAll(".language-option").forEach(button => {
        button.addEventListener("click", () => {
            selectedLanguage = button.dataset.language;
            document.querySelectorAll(".language-option").forEach(item =>
                item.classList.remove("selected")
            );
            button.classList.add("selected");
        });
    });

    document.getElementById("continue-button").addEventListener("click", showCategoryStep);
}

function showCategoryStep() {
    updateProgress(2);

    questionArea.innerHTML = `
        <h3>What is your concern about?</h3>
        <p class="question-help">Choose the topic that best matches your experience.</p>

        <div class="category-grid">
            ${categories.map((category, index) => `
                <button class="category-option" data-category="${category}">
                    <span class="category-number">0${index + 1}</span>
                    <span>${category}</span>
                    <span class="category-arrow">→</span>
                </button>
            `).join("")}
        </div>

        <button class="text-back-button" id="back-language">← Back to languages</button>
    `;

    document.querySelectorAll(".category-option").forEach(button => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.category;
            showComplaintStep();
        });
    });

    document.getElementById("back-language").addEventListener("click", showLanguageStep);
}

function showComplaintStep() {
    updateProgress(3);

    questionArea.innerHTML = `
        <h3>Tell us what happened.</h3>
        <p class="question-help">
            You selected: <strong>${selectedCategory}</strong>.
            Speak or type your experience below.
        </p>

        <div class="mic-panel">
            <button class="mic-button" id="mic-button" aria-label="Start voice recognition">
                <span class="mic-icon">🎙</span>
            </button>
            <p id="mic-status">Tap the microphone to start speaking</p>
            <small>Allow microphone access when your browser asks.</small>
        </div>

        <label class="input-label" for="complaint-input">Or type your concern</label>
        <textarea id="complaint-input" placeholder="Describe your experience here...">${escapeHTML(complaintText)}</textarea>

        <div class="complaint-actions">
            <button class="text-back-button" id="back-category">← Back</button>
            <button class="primary-button" id="submit-complaint">
                Submit feedback <span>→</span>
            </button>
        </div>

        <p class="safety-note">
            If this is a medical emergency, contact emergency services or hospital staff immediately.
            VoiceCare is not an emergency service.
        </p>
    `;

    document.getElementById("back-category").addEventListener("click", showCategoryStep);

    const textarea = document.getElementById("complaint-input");

    textarea.addEventListener("input", () => {
        complaintText = textarea.value;
    });

    document.getElementById("mic-button").addEventListener("click", toggleVoiceRecognition);
    document.getElementById("submit-complaint").addEventListener("click", submitComplaint);
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function toggleVoiceRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    const status = document.getElementById("mic-status");
    const micButton = document.getElementById("mic-button");

    if (!SpeechRecognition) {
        status.textContent =
            "Voice recognition isn't supported in this browser. Please type your concern instead.";
        return;
    }

    if (isListening && recognition) {
        recognition.stop();
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        status.textContent = "Listening... Speak clearly.";
        micButton.classList.add("recording");
    };

    recognition.onresult = event => {
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + " ";
            }
        }

        if (finalTranscript) {
            complaintText += finalTranscript;
            document.getElementById("complaint-input").value = complaintText;
        }
    };

    recognition.onerror = event => {
        status.textContent = `Voice recognition issue: ${event.error}. You can type instead.`;
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove("recording");
        status.textContent = "Voice input stopped. You can speak again or edit your text.";
    };

    try {
        recognition.start();
    } catch (error) {
        status.textContent = "Please try the microphone again.";
    }
}

function submitComplaint() {
    const textarea = document.getElementById("complaint-input");
    complaintText = textarea.value.trim();

    if (!complaintText) {
        alert("Please speak or type your concern before submitting.");
        return;
    }

    if (isListening && recognition) {
        recognition.stop();
    }

    const trackingId = "VC-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const complaint = {
        id: trackingId,
        category: selectedCategory,
        language: languages[selectedLanguage],
        message: complaintText,
        status: "Received",
        date: new Date().toLocaleString()
    };

    const existingComplaints = JSON.parse(localStorage.getItem("voicecareComplaints") || "[]");
    existingComplaints.push(complaint);
    localStorage.setItem("voicecareComplaints", JSON.stringify(existingComplaints));

    questionArea.innerHTML = `
        <div class="success-panel">
            <div class="success-icon">✓</div>
            <h3>Your voice has been recorded!</h3>
            <p class="question-help">Your feedback has been saved in this browser prototype.</p>

            <div class="tracking-box">
                <span>YOUR REFERENCE NUMBER</span>
                <strong>${trackingId}</strong>
            </div>

            <p class="success-hint">Keep this number to identify your feedback later.</p>

            <button class="primary-button" id="new-complaint">
                Share another concern <span>→</span>
            </button>
        </div>
    `;

    document.getElementById("new-complaint").addEventListener("click", () => {
        selectedCategory = "";
        complaintText = "";
        showLanguageStep();
    });
}

showLanguageStep();
