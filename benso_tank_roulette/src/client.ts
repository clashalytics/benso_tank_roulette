declare var io: any;

// Establish the connection to the server on the local host
const socket = io();
console.log("Attempting to connect to the Socket.io server...");

// Global variables for the compact mode rotation logic
let currentCompactElementIndex: number = 0;
let compactRotationInterval: any | null = null;
const compactElements: string[] = ['display-compact-streak', 'display-compact-reset_counter', 'display-compact-joker'];
// Select the main display container
const displayContainer: HTMLElement | null = document.querySelector('.display');

// Helper function to generate stage icons based on the current state
const generateStageHTML = (currentStage: number): string => {
    let html = '';
    const totalStages = 4; // Hardcoded to 4 stages based on user template
    for (let i = 1; i <= totalStages; i++) {
        const isChecked = i <= currentStage;
        const stageClass = isChecked ? 'stage-checked' : 'stage-unchecked';
        const iconClass = isChecked ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';

        html += `<div class="stage-container ${stageClass}">
                     <i class="${iconClass}"></i>
                 </div>`;
    }
    return html;
};

// --- HTML Template Generators ---

const getDetailedHTML = (state: AppState): string => {
    const stageHTML = generateStageHTML(state.stage);
    return `
<div class="display-detailed">
    <h3 class="display-heading">
        !Herausforderung
    </h3>
    <div class="display-detailed-values">
        <div class="display-detailed-stages">
            ${stageHTML}
        </div>
        <div class="display-detailed-streak">
            <div class="streak-icon">
                <i class="fa-solid fa-fire"></i>
            </div>
            <div class="streak-text">
                Aktuelle Streak: ${state.streak}/10
            </div>
        </div>
        <div class="display-detailed-reset_counter">
            <div class="reset_counter-icon">
                <i class="fa-solid fa-arrow-rotate-left"></i>
            </div>
            <div class="reset_counter-text">
                Reset Counter: ${state.resetCounter}
            </div>
        </div>
        <div class="display-detailed-joker">
            <div class="joker-icon">
                <i class="fa-solid fa-shield-heart"></i>
            </div>
            <div class="joker-text">
                Verfügbare Joker: ${state.joker}
            </div>
        </div>
    </div>
</div>
    `;
};

const getCompactHTML = (state: AppState): string => {
    const stageHTML = generateStageHTML(state.stage);
    return `
<div class="display-compact">
    <h3 class="display-heading">
        !Herausforderung
    </h3>
    <div class="display-compact-values">
        <div class="display-compact-stages">
            ${stageHTML}
        </div>
        <div class="display-compact-info-rotator">
            <div class="display-compact-streak compact-rotator-item" style="opacity: 1;">
                <div class="streak-icon">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <div class="streak-text">
                    Aktuelle Streak: ${state.streak}/10
                </div>
            </div>
            <div class="display-compact-reset_counter compact-rotator-item">
                <div class="reset_counter-icon">
                    <i class="fa-solid fa-arrow-rotate-left"></i>
                </div>
                <div class="reset_counter-text">
                    Reset Counter: ${state.resetCounter}
                </div>
            </div>
            <div class="display-compact-joker compact-rotator-item">
                <div class="joker-icon">
                    <i class="fa-solid fa-shield-heart"></i>
                </div>
                <div class="joker-text">
                    Verfügbare Joker: ${state.joker}
                </div>
            </div>
        </div>
    </div>
</div>
    `;
};

/**
 * Clears the existing rotation timer.
 */
const clearRotationInterval = (): void => {
    if (compactRotationInterval !== null) {
        clearInterval(compactRotationInterval as any);
        compactRotationInterval = null;
    }
    console.log("Rotation interval cleared.");
};

/**
 * Starts the rotation timer for compact mode.
 */
const startRotation = (intervalMs: number): void => {
    // Prevent rotation if the interval is too small or already running
    if (intervalMs <= 0) return;
    if (compactRotationInterval !== null) clearRotationInterval();

    const rotatorContainer = document.querySelector('.display-compact-info-rotator') as HTMLElement;
    if (!rotatorContainer) return;
    const items = rotatorContainer.querySelectorAll('.compact-rotator-item') as NodeListOf<HTMLElement>;
    if (items.length === 0) return;

    // Set initial state: only the first item is visible
    items.forEach((item, index) => {
        item.style.opacity = index === 0 ? '1' : '0';
    });
    currentCompactElementIndex = 0;

    // Set the rotation timer
    compactRotationInterval = setInterval(() => {
        const oldIndex = currentCompactElementIndex;

        // Calculate the next index
        currentCompactElementIndex = (currentCompactElementIndex + 1) % items.length;
        const newIndex = currentCompactElementIndex;

        // 1. Fade out the old element (opacity 1 -> 0)
        items[oldIndex].style.opacity = '0';

        // 2. Fade in the new element after the transition time (1000ms + buffer)
        setTimeout(() => {
            // Set position (optional, but ensures stacking order is correct)
            items[oldIndex].style.zIndex = '1';
            items[newIndex].style.zIndex = '2';
            items[newIndex].style.opacity = '1';
        }, 1050); // Delay slightly longer than the 1s CSS transition

    }, intervalMs); // Use the interval from the state

    console.log(`Compact mode rotation started with interval: ${intervalMs}ms`);
};


/**
 * Main function to update the display div with the correct visualization mode.
 */
const updateDisplayVisualization = (state: AppState): void => {
    if (!displayContainer) return;

    // Check if the HTML structure needs to be fully replaced (mode changed)
    const isDetailed = displayContainer.querySelector('.display-detailed');
    const isCompact = displayContainer.querySelector('.display-compact');
    const modeChanged = (state.displayMode === 'detailed' && !isDetailed) ||
        (state.displayMode === 'compact' && !isCompact);

    if (modeChanged) {
        // --- Full Re-render ---
        let newHTML = '';
        if (state.displayMode === 'detailed') {
            newHTML = getDetailedHTML(state);
            clearRotationInterval(); // Stop rotation if switching to detailed
        } else if (state.displayMode === 'compact') {
            newHTML = getCompactHTML(state);
            // Rotation is started below after injecting HTML
        }
        displayContainer.innerHTML = newHTML;

    } else {
        // --- Simple Content Update (No Re-render of structure) ---
        // This is necessary for detailed mode and for compact mode when only values change

        if (state.displayMode === 'detailed' || state.displayMode === 'compact') {
            // Update stages
            const stagesContainer = displayContainer.querySelector('.display-detailed-stages, .display-compact-stages');
            if (stagesContainer) stagesContainer.innerHTML = generateStageHTML(state.stage);

            // Update values (using the classes from the templates)
            const getEl = (cls: string) => displayContainer.querySelector(`.${cls} .streak-text, .${cls} .reset_counter-text, .${cls} .joker-text`);

            const streakEl = getEl('display-detailed-streak') || getEl('display-compact-streak');
            if (streakEl) streakEl.innerHTML = `Aktuelle Streak: ${state.streak}/10`;

            const resetEl = getEl('display-detailed-reset_counter') || getEl('display-compact-reset_counter');
            if (resetEl) resetEl.innerHTML = `Reset Counter: ${state.resetCounter}`;

            const jokerEl = getEl('display-detailed-joker') || getEl('display-compact-joker');
            if (jokerEl) jokerEl.innerHTML = `Verfügbare Joker: ${state.joker}`;
        }
    }

    // --- Rotation Control ---
    if (state.displayMode === 'compact' && state.interval > 0) {
        // Only restart if the interval is new or the interval is not running
        if (compactRotationInterval === null || (window as any).lastInterval !== state.interval) {
            startRotation(state.interval * 1000); // interval is in seconds
            (window as any).lastInterval = state.interval;
        }
    } else if (state.displayMode !== 'compact' || state.interval <= 0) {
        clearRotationInterval();
    }
};

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
    updateDisplayVisualization(state);

    const inputStreak = document.getElementById('inputStreak') as HTMLInputElement;
    const inputResetCounter = document.getElementById('inputResetCounter') as HTMLInputElement;
    const inputJoker = document.getElementById('inputJoker') as HTMLInputElement;
    const inputInterval = document.getElementById('inputInterval') as HTMLInputElement;

    if (inputStreak) inputStreak.value = state.streak.toString();
    if (inputResetCounter) inputResetCounter.value = state.resetCounter.toString();
    if (inputJoker) inputJoker.value = state.joker.toString();
    if (inputInterval) inputInterval.value = state.interval.toString();

    // 2. Synchronize control buttons (Crucial for multi-client setup)

    // Stage Radio Buttons (0-4) synchronize the control panel visually by switching classes
    const targetStageId = `stage${state.stage}`;
    const targetRadio = document.getElementById(targetStageId) as HTMLInputElement;

    if (targetRadio) {
        // Step 1: Iterate over all stage inputs to clean up the old state and reset classes
        document.querySelectorAll('input[name="btnradio"]').forEach(radio => {
            const label = radio.nextElementSibling as HTMLLabelElement;

            // Uncheck the input and remove the 'checked' attribute
            (radio as HTMLInputElement).checked = false;
            radio.removeAttribute('checked');

            // If the old button had the full 'btn-primary' color, reset it to 'outline'
            if (label) {
                label.classList.remove('btn-primary');
                label.classList.add('btn-outline-primary');
            }
        });

        // Step 2: Set the new state on the target elements

        // Set the 'checked' attribute on the target input
        targetRadio.checked = true;
        targetRadio.setAttribute('checked', 'checked');

        // Find the corresponding label (the adjacent sibling)
        const targetLabel = targetRadio.nextElementSibling as HTMLLabelElement;

        if (targetLabel) {
            // Switch classes to visually highlight the button with full color
            targetLabel.classList.remove('btn-outline-primary');
            targetLabel.classList.add('btn-primary');
            console.log(`[Stage Sync] Switched stage ${state.stage} button to btn-primary.`);
        }

    } else {
        console.warn(`[Stage Sync] Could not find radio button with ID: ${targetStageId}`);
    }

    // Display Mode Radio Buttons synchronize the control panel (using simpler method)
    const displayId = state.displayMode === 'compact' ? 'displayCompact' : 'displayDetailed';
    const displayRadio = document.getElementById(displayId) as HTMLInputElement;
    if (displayRadio) displayRadio.checked = true;

    // 3. Update Stage Visualisation in the OBS Overlay
    updateStageVisualization(state.stage);
});

socket.on('disconnect', () => {
    console.warn("Connection to the server lost!");
});

/**
 * Updates the visual stage indicators based on the current stage number.
 * NOTE: This relies on the 'displayEls.stageIndicators' array being correctly defined.
 * @param currentStage - The current stage value (0-4).
 */
function updateStageVisualization(currentStage: number): void {
    const STAGE_CLASSES = {
        COMPLETE: 'stage-complete',
        INCOMPLETE: 'stage-incomplete',
        ACTIVE: 'stage-active'
    };

    displayEls.stageIndicators.forEach((indicator, index) => {
        if (!indicator) return;

        // Stage numbers are 1-based (1 to 4), index is 0-based (0 to 3).
        const stageNumber = index + 1;

        // Clear all existing stage classes
        indicator.classList.remove(STAGE_CLASSES.COMPLETE, STAGE_CLASSES.INCOMPLETE, STAGE_CLASSES.ACTIVE);

        if (stageNumber <= currentStage && currentStage > 0) {
            // Stage is completed or is the active stage (if > 0)
            indicator.classList.add(STAGE_CLASSES.COMPLETE);
        } else {
            // Stage is yet to be reached or currentStage is 0
            indicator.classList.add(STAGE_CLASSES.INCOMPLETE);
        }

        // Optional: Highlight the current active stage if it's the target
        // We can choose to highlight the bar representing the CURRENT target stage (stage 1, 2, 3, or 4)
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
        if (!confirm(`Sind Sie sicher, dass Sie ${key.toUpperCase()} auf 0 ZURÜCKSETZEN wollen?`)) {
            return;
        }
    }
    if (type === 'RESET_ALL') {
        if (!confirm("Wollen Sie wirklich ALLE Werte (Etappe, Streak, Zähler, Joker) auf 0 zurücksetzen?")) {
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
                                alert("Bitte gib eine gültige Zahl ein (kann nicht kleiner als 0 sein).");
                            }
                        } else if (!isNaN(value)) {
                            sendControlAction('SET', key as keyof AppState, value);
                        } else {
                            alert("Bitte gib eine gültige Zahl ein.");
                        }
                        inputField.value = '';
                    }
                });
            }
        }
    }

    // --- D. Radio-Buttons (Stage and Display Mode) ---
    document.querySelectorAll('input[name="btnradio"]').forEach(radio => {
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

    document.getElementById('serverShutdown')?.addEventListener('click', () => {
        console.error("SERVER CONTROL: Sending shutdown signal. The server console window will close!");
        socket.emit('server_control', { type: 'SHUTDOWN' });
    });

    // --- F. Input Field Handlers ---

    const handleInputUpdate = (e: Event) => {
        const input = e.target as HTMLInputElement;

        const keyMap: { [key: string]: keyof AppState } = {
            inputStreak: 'streak',
            inputResetCounter: 'resetCounter',
            inputJoker: 'joker',
            inputInterval: 'interval'
        };
        const key = keyMap[input.id];
        const value = parseInt(input.value);

        if (key && !isNaN(value)) {
            // Sends the 'SET' action with the new numeric value to the server
            sendControlAction('SET', key, value);
        } else if (key) {
            console.warn(`Invalid input for ${key}. Value: ${input.value}`);
        }
    };

    // Add Listener for 'change' (when field loses focus)
    document.getElementById('inputStreak')?.addEventListener('change', handleInputUpdate);
    document.getElementById('inputResetCounter')?.addEventListener('change', handleInputUpdate);
    document.getElementById('inputJoker')?.addEventListener('change', handleInputUpdate);
    document.getElementById('inputInterval')?.addEventListener('change', handleInputUpdate);

    // Add Listener for the Enter key press
    document.querySelectorAll('input[type="number"]').forEach(input => {

        // Use the generic 'Event' type in the listener signature as required by the DOM API.
        input.addEventListener('keydown', (e: Event) => {

            // Use Type Assertion (as KeyboardEvent) to safely access specific properties like 'key'.
            const keyboardEvent = e as KeyboardEvent;

            if (keyboardEvent.key === 'Enter') {
                keyboardEvent.preventDefault(); // Prevent default form submission (important for Enter key)

                // Execute the logic to transmit the data
                handleInputUpdate(e);

                // Blur the field: this triggers the 'change' event and hides the virtual keyboard on mobile
                (e.target as HTMLInputElement).blur();
            }
        });
    });
});


// Expose the main function globally for debugging in the browser console
(window as any).sendControlAction = sendControlAction;

console.log("Client script fully loaded and DOM listeners attached.");