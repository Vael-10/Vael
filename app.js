let EJS_player = null;
let isPlaying = false;

// Initialize the emulator
function initializeEmulator() {
    EJS_player = new EJS({
        element: document.getElementById('emulator'),
        gameUrl: '', // User will load their own ROM
        biosUrl: '', // Optional BIOS
        systemId: 'gba',
        data: {},
        title: 'Pokemon Emerald'
    });
}

// DOM Elements
const playPauseBtn = document.getElementById('playPauseBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');
const romInput = document.getElementById('romInput');
const menuToggle = document.getElementById('menuToggle');
const controlsPanel = document.getElementById('controlsPanel');
const closePanel = document.getElementById('closePanel');
const scaleSelect = document.getElementById('scaleSelect');
const filterSelect = document.getElementById('filterSelect');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');
const muteCheckbox = document.getElementById('muteCheckbox');
const gamepadStatus = document.getElementById('gamepadStatus');
const saveModal = document.getElementById('saveModal');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const saveName = document.getElementById('saveName');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeEmulator();
    setupEventListeners();
    monitorGamepad();
});

function setupEventListeners() {
    // Menu toggle
    menuToggle.addEventListener('click', () => {
        controlsPanel.classList.toggle('open');
    });

    closePanel.addEventListener('click', () => {
        controlsPanel.classList.remove('open');
    });

    // Game controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    saveBtn.addEventListener('click', openSaveModal);
    loadBtn.addEventListener('click', loadGame);
    resetBtn.addEventListener('click', resetGame);

    // Display settings
    scaleSelect.addEventListener('change', (e) => {
        changeScale(e.target.value);
    });

    filterSelect.addEventListener('change', (e) => {
        changeFilter(e.target.value);
    });

    // Audio settings
    volumeSlider.addEventListener('input', (e) => {
        updateVolume(e.target.value);
    });

    muteCheckbox.addEventListener('change', toggleMute);

    // Modal buttons
    confirmSaveBtn.addEventListener('click', saveGame);
    cancelSaveBtn.addEventListener('click', closeSaveModal);

    // Close modal on background click
    saveModal.addEventListener('click', (e) => {
        if (e.target === saveModal) {
            closeSaveModal();
        }
    });

    // Right-click context menu for loading ROM
    document.addEventListener('contextmenu', (e) => {
        if (e.target.id === 'emulator') {
            e.preventDefault();
            romInput.click();
        }
    });
}

// Play/Pause functionality
function togglePlayPause() {
    isPlaying = !isPlaying;
    const icon = playPauseBtn.querySelector('.icon');
    
    if (isPlaying) {
        icon.textContent = '⏸';
        playPauseBtn.querySelector('span:last-child').textContent = 'Pause';
        EJS_player?.run();
    } else {
        icon.textContent = '▶';
        playPauseBtn.querySelector('span:last-child').textContent = 'Play';
        EJS_player?.pause();
    }
}

// Save modal
function openSaveModal() {
    saveModal.style.display = 'flex';
    saveName.focus();
}

function closeSaveModal() {
    saveModal.style.display = 'none';
    saveName.value = '';
}

function saveGame() {
    const name = saveName.value || `Save-${Date.now()}`;
    
    if (EJS_player) {
        const saveData = EJS_player.save();
        localStorage.setItem(`gba-save-${name}`, JSON.stringify(saveData));
        
        // Show confirmation
        const originalText = confirmSaveBtn.textContent;
        confirmSaveBtn.textContent = '✓ Saved!';
        confirmSaveBtn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            confirmSaveBtn.textContent = originalText;
            confirmSaveBtn.style.background = '';
            closeSaveModal();
        }, 1500);
    }
}

function loadGame() {
    const saves = [];
    
    // Collect all saves from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('gba-save-')) {
            saves.push(key.replace('gba-save-', ''));
        }
    }
    
    if (saves.length === 0) {
        alert('No saves found. Create a save first!');
        return;
    }
    
    const saveName = prompt(`Available saves:\n${saves.join('\n')}\n\nEnter save name to load:`, saves[0]);
    
    if (saveName) {
        const saveData = localStorage.getItem(`gba-save-${saveName}`);
        if (saveData) {
            EJS_player?.load(JSON.parse(saveData));
            alert(`Loaded: ${saveName}`);
        } else {
            alert('Save not found!');
        }
    }
}

function resetGame() {
    if (confirm('Are you sure you want to reset the game?')) {
        EJS_player?.reset();
        isPlaying = true;
        playPauseBtn.querySelector('.icon').textContent = '⏸';
        playPauseBtn.querySelector('span:last-child').textContent = 'Pause';
    }
}

// Display settings
function changeScale(scale) {
    if (EJS_player) {
        EJS_player.scale = parseInt(scale);
    }
}

function changeFilter(filter) {
    if (EJS_player) {
        EJS_player.smoothing = (filter === 'linear');
    }
}

// Audio settings
function updateVolume(value) {
    volumeLabel.textContent = `${value}%`;
    if (EJS_player) {
        EJS_player.volume = value / 100;
    }
}

function toggleMute() {
    if (muteCheckbox.checked) {
        if (EJS_player) {
            EJS_player.mute();
        }
        volumeSlider.disabled = true;
    } else {
        if (EJS_player) {
            EJS_player.unmute();
        }
        volumeSlider.disabled = false;
    }
}

// Gamepad support
function monitorGamepad() {
    setInterval(() => {
        const gamepads = navigator.getGamepads();
        let connected = false;
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                connected = true;
                break;
            }
        }
        
        updateGamepadStatus(connected);
    }, 1000);
}

function updateGamepadStatus(connected) {
    if (connected) {
        gamepadStatus.textContent = '🟢 Gamepad Connected';
        gamepadStatus.classList.add('connected');
    } else {
        gamepadStatus.textContent = '🔴 No Gamepad Connected';
        gamepadStatus.classList.remove('connected');
    }
}

// ROM loading
romInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (EJS_player) {
                EJS_player.gameUrl = event.target.result;
                EJS_player.run();
                isPlaying = true;
                playPauseBtn.querySelector('.icon').textContent = '⏸';
                playPauseBtn.querySelector('span:last-child').textContent = 'Pause';
            }
        };
        reader.readAsArrayBuffer(file);
    }
});

// Keyboard controls mapping
document.addEventListener('keydown', (e) => {
    if (!EJS_player) return;
    
    const keyMap = {
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        'z': 'ButtonA',
        'x': 'ButtonB',
        'a': 'ButtonL',
        's': 'ButtonR',
        'Enter': 'Start',
        'Shift': 'Select'
    };
    
    if (keyMap[e.key.toLowerCase()]) {
        e.preventDefault();
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && !e.target.closest('.controls-panel') && !e.target.closest('.menu-toggle')) {
        controlsPanel.classList.remove('open');
    }
});

console.log('🎮 Vael Emulator loaded and ready!');
