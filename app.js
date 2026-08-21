let EJS_player = null;
let isPlaying = false;

// Initialize the emulator
function initializeEmulator() {
    EJS_player = new EJS({
        element: document.getElementById('emulator'),
        gameUrl: '', // Will be set when user loads ROM
        biosUrl: '',
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
    setupROMLoading();
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
    loadBtn.addEventListener('click', () => romInput.click());
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
        if (e.target.id === 'emulator' || e.target.closest('#emulator')) {
            e.preventDefault();
            romInput.click();
        }
    });
}

// ROM Loading Setup
function setupROMLoading() {
    romInput.addEventListener('change', handleROMLoad);
}

function handleROMLoad(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Loading ROM:', file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const romData = event.target.result;
            
            // Create a blob URL for the ROM
            const blob = new Blob([romData], { type: 'application/octet-stream' });
            const romUrl = URL.createObjectURL(blob);
            
            // Update the emulator with the new ROM
            if (EJS_player) {
                EJS_player.gameUrl = romUrl;
                EJS_player.run();
                
                // Update UI
                isPlaying = true;
                playPauseBtn.querySelector('.icon').textContent = '⏸';
                playPauseBtn.querySelector('span:last-child').textContent = 'Pause';
                
                console.log('✅ ROM loaded successfully!');
                alert('✅ ROM loaded! Use keyboard or gamepad to play.');
            }
        } catch (error) {
            console.error('Error loading ROM:', error);
            alert('Error loading ROM. Make sure it\'s a valid .gba file');
        }
    };
    
    reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset file input so same file can be loaded again
    romInput.value = '';
}

// Play/Pause functionality
function togglePlayPause() {
    if (!EJS_player) {
        alert('Please load a ROM first!');
        return;
    }

    isPlaying = !isPlaying;
    const icon = playPauseBtn.querySelector('.icon');
    
    if (isPlaying) {
        icon.textContent = '⏸';
        playPauseBtn.querySelector('span:last-child').textContent = 'Pause';
        if (EJS_player.run) EJS_player.run();
    } else {
        icon.textContent = '▶';
        playPauseBtn.querySelector('span:last-child').textContent = 'Play';
        if (EJS_player.pause) EJS_player.pause();
    }
}

// Save modal
function openSaveModal() {
    if (!isPlaying) {
        alert('No game is running! Load a ROM first.');
        return;
    }
    saveModal.style.display = 'flex';
    saveName.focus();
}

function closeSaveModal() {
    saveModal.style.display = 'none';
    saveName.value = '';
}

function saveGame() {
    const name = saveName.value || `Save-${Date.now()}`;
    
    if (EJS_player && EJS_player.save) {
        try {
            const saveData = EJS_player.save();
            localStorage.setItem(`gba-save-${name}`, JSON.stringify(saveData));
            
            // Show confirmation
            const originalText = confirmSaveBtn.textContent;
            confirmSaveBtn.textContent = '✓ Saved!';
            
            setTimeout(() => {
                confirmSaveBtn.textContent = originalText;
                closeSaveModal();
            }, 1500);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Could not save game state.');
        }
    } else {
        alert('Save feature not available yet. Start playing first!');
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
        if (saveData && EJS_player && EJS_player.load) {
            try {
                EJS_player.load(JSON.parse(saveData));
                alert(`Loaded: ${saveName}`);
            } catch (error) {
                console.error('Error loading save:', error);
                alert('Could not load save state.');
            }
        } else {
            alert('Save not found!');
        }
    }
}

function resetGame() {
    if (!isPlaying) {
        alert('No game is running!');
        return;
    }
    
    if (confirm('Are you sure you want to reset the game?')) {
        if (EJS_player && EJS_player.reset) {
            EJS_player.reset();
        }
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
        if (EJS_player && EJS_player.mute) {
            EJS_player.mute();
        }
        volumeSlider.disabled = true;
    } else {
        if (EJS_player && EJS_player.unmute) {
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

console.log('🎮 Vael Emulator loaded and ready! Right-click the game area or click Load to select your ROM.');
