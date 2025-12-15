import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// =======================================================
// pkg detection & base paths
// =======================================================

const isPkg = !!(process as any).pkg;

const BASE_PATH = isPkg
    ? process.cwd()
    : path.join(__dirname, "..");

// =======================================================
// 1. INTERFACES AND INITIAL SETUP
// =======================================================

// Define the structure of the application state
interface AppState {
    stage: number;
    streak: number;
    resetCounter: number;
    joker: number;
    displayMode: 'compact' | 'detailed';
    interval: number; // Interval in seconds
}

// Define the path for the persistent data file
const DATA_FILE = path.join(BASE_PATH, 'data.json');
const PORT = 3000;
const INITIAL_STATE: AppState = {
    stage: 0,
    streak: 0,
    resetCounter: 0,
    joker: 0,
    displayMode: 'detailed',
    interval: 5,
};

let currentState: AppState = { ...INITIAL_STATE };

// =======================================================
// 2. DATA MANAGEMENT (FILE I/O)
// =======================================================

/**
 * Loads the application state from the data file, or uses the initial state if the file doesn't exist.
 */
function loadState(): void {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            currentState = JSON.parse(data) as AppState;
            console.log("State successfully loaded from data.json.");
        } else {
            console.log("data.json not found. Initializing with default state.");
            saveState(); // Create the file for the first time
        }
    } catch (error) {
        console.error("Error loading state, using initial state:", error);
        currentState = { ...INITIAL_STATE };
    }
}

/**
 * Saves the current application state to the persistent data file.
 */
function saveState(): void {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentState, null, 2), 'utf8');
        console.log("State saved to data.json.");
    } catch (error) {
        console.error("Error saving state:", error);
    }
}

// =======================================================
// 3. SERVER INITIALIZATION (EXPRESS & SOCKET.IO)
// =======================================================

loadState(); // Load state before starting the server

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow connections from any origin
    }
});

// --- Express Middleware & Routing ---

// Serves the public folder (index.html, style.css, vendor files)
const PUBLIC_PATH = path.join(BASE_PATH, 'public');

app.use(express.static(PUBLIC_PATH));
console.log(`Serving static files from: ${PUBLIC_PATH}`);


// Serves the compiled JS files (client.js) from the 'dist' folder
// The browser requests this via /dist/client.js
const DIST_PATH = path.join(BASE_PATH, 'dist');

app.use('/dist', express.static(DIST_PATH));
console.log(`Serving compiled client code from: ${DIST_PATH}`);


// Root route delivers the control panel (index.html)
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});


// --- Socket.io Handlers ---

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}. Sending current state.`);

    // Immediately send the full state to the new client
    socket.emit('update', currentState);

    /**
     * Handles control actions sent from the client (buttons, inputs).
     */
    socket.on('action', (action: { type: string, payload: any }) => {
        console.log(`Received action type: ${action.type}, payload:`, action.payload);

        let shouldUpdate = false;
        const { key, value } = action.payload;

        switch (action.type) {
            case 'INCREMENT':
            case 'DECREMENT': {
                const keyName = key as keyof AppState;
                // Determine the change: +1 for INCREMENT, -1 for DECREMENT
                const change = action.type === 'INCREMENT' ? 1 : -1;

                // Ensure we only perform arithmetic on properties that are numbers
                if (typeof currentState[keyName] === 'number') {

                    // TS FIX: Use 'as any' to bypass strict index access signature check,
                    // as we know the value is a number from the 'if' condition.
                    (currentState as any)[keyName] += change;

                    // Logic: Ensure counts do not go below zero (except potentially resetCounter if needed, but safer to keep it non-negative)
                    if (keyName !== 'resetCounter' && (currentState as any)[keyName] < 0) {
                        (currentState as any)[keyName] = 0;
                    }
                    shouldUpdate = true;
                } else {
                    console.warn(`Attempted ${action.type} on non-numeric key: ${keyName}`);
                }
                break;
            }
            case 'SET': {
                const keyName = key as keyof AppState;
                if (keyName in currentState) {

                    // Handle numeric values (streak, joker, stage, interval)
                    if (typeof currentState[keyName] === 'number') {
                        const numericValue = parseInt(value as string);
                        if (!isNaN(numericValue)) {
                            (currentState as any)[keyName] = numericValue;
                            shouldUpdate = true;
                        }
                        // Handle string values (displayMode)
                    } else if (typeof currentState[keyName] === 'string') {
                        // Ensure the value is one of the allowed literals
                        if (value === 'compact' || value === 'detailed') {
                            (currentState as any)[keyName] = value;
                            shouldUpdate = true;
                        }
                    }
                }
                break;
            }
            case 'RESET': {
                // Key here is the name of the state property to reset (e.g., 'streak')
                const keyName = action.payload as keyof AppState;
                if (keyName in INITIAL_STATE) {
                    (currentState as any)[keyName] = INITIAL_STATE[keyName]; // Reset to initial state value
                    shouldUpdate = true;
                }
                break;
            }
            case 'RESET_ALL': {
                currentState = { ...INITIAL_STATE };
                shouldUpdate = true;
                break;
            }
            default:
                console.warn(`Unknown action type received: ${action.type}`);
        }

        if (shouldUpdate) {
            saveState(); // Save changes to the data file
            // Broadcast the new state to ALL connected clients (OBS and all control panels)
            io.emit('update', currentState);
            console.log("New State Broadcasted:", currentState);
        }
    });

    /**
     * Handles specific server control commands (Shutdown).
     */
    socket.on('server_control', (data: { type: string }) => {
        console.log(`Received server control command: ${data.type}`);

        if (data.type === 'SHUTDOWN') {
            console.warn("Server is shutting down... Closing process (process.exit(0)).");
            // Perform a clean shutdown (e.g., save data one last time)
            saveState();

            // Exit the Node.js process cleanly.
            // This will close the console window for the streamer.
            process.exit(0);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// =======================================================
// 4. START SERVER
// =======================================================

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  Benso Tank Roulette Server is running!`);
    console.log(`  Access Control Panel at: http://localhost:${PORT}`);
    console.log(`  (Keep this window open during streaming.)`);
    console.log(`======================================================\n`);
});