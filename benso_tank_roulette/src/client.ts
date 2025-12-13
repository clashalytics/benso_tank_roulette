// src/client.ts

// Since we load Socket.io via a <script> tag in index.html, 
// we must tell TypeScript that the 'io' variable exists globally.
declare var io: any;

// Establish the connection to the server on the local host
const socket = io();
console.log("Attempting to connect to the Socket.io server...");

// =======================================================
// 1. INTERFACES AND DOM REFERENCES
// =======================================================

// Define the structure of the data sent by the server
interface AppState {
    stage: number; // Current stage (0 to 4)
    streak: number;
    resetCounter: number;
    joker: number;
    displayMode: 'compact' | 'detailed';
    interval: number;
}

// References to the UI elements for display (OBS Overlay)
const displayEls = {
    streak: document.getElementById('disp-streak'),
    resetCounter: document.getElementById('disp-reset_counter'),
    joker: document.getElementById('disp-joker'),
    // NEW: References to the stage bars/indicators
    stageIndicators: [
        document.getElementById('stage-indicator-1'), // IDs for your visual bars
        document.getElementById('stage-indicator-2'),
        document.getElementById('stage-indicator-3'),
        document.getElementById('stage-indicator-4'),
    ] as (HTMLElement | null)[],
};

// CSS classes you would define for the stage bars (e.g., 'stage-complete', 'stage-incomplete')
const STAGE_CLASSES = {
    COMPLETE: 'stage-complete',
    INCOMPLETE: 'stage-incomplete',
    ACTIVE: 'stage-active'
};


// =======================================================
// 2. SOCKET EVENT LISTENERS (RECEIVING)
// =======================================================

socket.on('connect', () => {
    console.log("Successfully connected to the server. Client Socket ID:", socket.id);
});

/**
 * Handles incoming state updates from the server.
 * @param state - The full current state of the application.
 */
socket.on('update', (state: AppState) => {
    console.log("Received State Update:", state);

    // 1. Update text content in the OBS display
    if (displayEls.streak) displayEls.streak.innerText = state.streak.toString();
    if (displayEls.resetCounter) displayEls.resetCounter.innerText = state.resetCounter.toString();
    if (displayEls.joker) displayEls.joker.innerText = state.joker.toString();

    // 2. Synchronize control buttons (Crucial for multi-client setup)

    // Stage Radio Buttons (0-4) synchronize control panel
    const stageRadio = document.getElementById(`stage${state.stage}`) as HTMLInputElement;
    if (stageRadio) stageRadio.checked = true;

    // Display Mode Radio Buttons synchronize control panel
    const displayId = state.displayMode === 'compact' ? 'displayCompact' : 'displayDetailed';
    const displayRadio = document.getElementById(displayId) as HTMLInputElement;
    if (displayRadio) displayRadio.checked = true;

    // 3. NEW: Update Stage Visualisation in the OBS Overlay
    updateStageVisualization(state.stage);
});

socket.on('disconnect', () => {
    console.warn("Connection to the server lost!");
});

/**
 * Updates the visual stage indicators based on the current stage number.
 * @param currentStage - The current stage value (0-4).
 */
function updateStageVisualization(currentStage: number): void {
    displayEls.stageIndicators.forEach((indicator, index) => {
        if (!indicator) return;

        // The index is 0-based, so stage 1 corresponds to index 0, stage 4 to index 3.
        const stageNumber = index + 1;

        // Clear all existing stage classes
        indicator.classList.remove(STAGE_CLASSES.COMPLETE, STAGE_CLASSES.INCOMPLETE, STAGE_CLASSES.ACTIVE);

        if (stageNumber <= currentStage) {
            // Stage is completed or is the active stage
            indicator.classList.add(STAGE_CLASSES.COMPLETE);
        } else {
            // Stage is yet to be reached
            indicator.classList.add(STAGE_CLASSES.INCOMPLETE);
        }

        // Optional: Highlight the current active stage if it's the target
        if (stageNumber === currentStage && currentStage > 0) {
            indicator.classList.add(STAGE_CLASSES.ACTIVE);
            indicator.classList.remove(STAGE_CLASSES.COMPLETE); // Remove complete class if you want a different active style
        }

        console.log(`Stage ${stageNumber} indicator updated. Current state: ${stageNumber <= currentStage ? 'Complete' : 'Incomplete'}`);
    });
}


// =======================================================
// 3. SENDING LOGIC (CONTROLS)
// (No changes here, as it uses the generic sendControlAction)
// =======================================================

/**
 * Sends a generic control action to the server.
 * @param type - The action type ('INCREMENT', 'DECREMENT', 'SET', 'RESET', 'RESET_ALL').
 * @param key - The state key to change (e.g., 'streak', 'joker').
 * @param value - Optional value for 'SET' or amount for +/-.
 */
function sendControlAction(type: string, key: keyof AppState | 'all', value?: number | string): void {
    const actionPayload = { type, payload: { key, value } };

    // Confirmation dialogs for destructive actions
    if (type === 'RESET' && key !== 'all') {
        if (!confirm(`Are you sure you want to RESET ${key.toUpperCase()} to 0?`)) {
            return;
        }
    }
    if (type === 'RESET_ALL') {
        if (!confirm("Are you sure you want to RESET ALL values (Stage, Streak, Counter, Joker)?")) {
            return;
        }
    }

    console.log(`Sending Action: ${type} for ${key} with value:`, value !== undefined ? value : 'N/A');
    socket.emit('action', actionPayload);
}


// =======================================================
// 4. DOM EVENT ATTACHMENT
// (This section remains mostly the same, but relies on the updated AppState/Key definitions)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- A. Direct Counter Controls (+1, -1, Reset) ---
    const directControls: Record<keyof AppState, [string, string, string]> = {
        streak: ['addStreak', 'subtractStreak', 'resetStreak'],
        resetCounter: ['addResetCounter', 'subtractResetCounter', 'resetResetCounter'],
        joker: ['addJoker', 'subtractJoker', 'resetJoker'],
        stage: ['', '', ''],
        displayMode: ['', '', ''],
        interval: ['', '', ''],
    };

    for (const key in directControls) {
        if (directControls.hasOwnProperty(key)) {
            const [incId, decId, resetId] = directControls[key as keyof AppState] as [string, string, string];
            const stateKey = key as keyof AppState;

            // INCREMENT (+1)
            document.getElementById(incId)?.addEventListener('click', () => {
                sendControlAction('INCREMENT', stateKey, 1);
            });

            // DECREMENT (-1)
            document.getElementById(decId)?.addEventListener('click', () => {
                sendControlAction('DECREMENT', stateKey, 1);
            });

            // RESET
            document.getElementById(resetId)?.addEventListener('click', () => {
                sendControlAction('RESET', stateKey);
            });
        }
    }

    // --- B. General Reset Functions ---
    document.getElementById('resetAllValues')?.addEventListener('click', () => {
        sendControlAction('RESET_ALL', 'all');
    });
    document.getElementById('resetStage')?.addEventListener('click', () => {
        sendControlAction('RESET', 'stage'); // Resets stage to 0
    });


    // --- C. Input Fields (SET Value) ---
    const updateKeys: Record<keyof AppState | 'interval', [string, string]> = {
        streak: ['updateStreak', 'input[placeholder="..."]:nth-of-type(1)'],
        resetCounter: ['updateResetCounter', 'input[placeholder="..."]:nth-of-type(2)'],
        joker: ['updateJoker', 'input[placeholder="..."]:nth-of-type(3)'],
        interval: ['updateInterval', 'input[placeholder="..."]:nth-of-type(4)'],
        stage: ['', ''],
        displayMode: ['', ''],
    };

    for (const key in updateKeys) {
        if (updateKeys.hasOwnProperty(key)) {
            const [updateBtnId] = updateKeys[key as keyof AppState | 'interval'] as [string, string];
            const updateBtn = document.getElementById(updateBtnId);

            if (updateBtn) {
                updateBtn.addEventListener('click', () => {
                    const inputGroup = updateBtn.closest('.input-group');
                    const inputField = inputGroup?.querySelector('input[type="text"]') as HTMLInputElement;

                    if (inputField) {
                        const rawValue = inputField.value;
                        const value = parseInt(rawValue);

                        if (key === 'interval') {
                            if (!isNaN(value) && value > 0) {
                                sendControlAction('SET', 'interval', value);
                            } else {
                                alert("Please enter a valid interval (number > 0).");
                            }
                        } else if (!isNaN(value)) {
                            sendControlAction('SET', key as keyof AppState, value);
                        } else {
                            alert("Please enter a valid number.");
                        }
                        inputField.value = '';
                    }
                });
            }
        }
    }

    // --- D. Radio-Buttons (Stage and Display Mode) ---
    document.querySelectorAll('.control-buttons-stage input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const stageValue = parseInt((e.target as HTMLInputElement).id.replace('stage', ''));
            sendControlAction('SET', 'stage', stageValue);
        });
    });

    document.querySelectorAll('.display-visualization input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = (e.target as HTMLInputElement).id === 'displayCompact' ? 'compact' : 'detailed';
            sendControlAction('SET', 'displayMode', mode);
        });
    });

    // --- E. Server Control Buttons ---
    document.getElementById('serverRestart')?.addEventListener('click', () => {
        console.warn("SERVER CONTROL: Sending restart signal. This functionality relies on specific server-side code (e.g., process spawning).");
        socket.emit('server_control', { type: 'RESTART' });
    });

    document.getElementById('serverShutdown')?.addEventListener('click', () => {
        console.error("SERVER CONTROL: Sending shutdown signal. The server console window will close!");
        socket.emit('server_control', { type: 'SHUTDOWN' });
    });
});


// Expose the main function globally for debugging in the browser console
(window as any).sendControlAction = sendControlAction;

console.log("Client script fully loaded and DOM listeners attached.");