// Da wir Socket.io über ein <script>-Tag in index.html laden,
// müssen wir TypeScript mitteilen, dass die 'io' Variable existiert.
declare var io: any;

// Stellt die Verbindung zum Server auf dem lokalen Host her
const socket = io();

// Interface zur strikten Typisierung der empfangenen Daten
interface AppState {
    streak: number;
    pb: number;
    token: number;
}

// UI Elemente aus dem DOM holen (stellen Sie sicher, dass diese IDs in Ihrer index.html existieren)
const els = {
    streak: document.getElementById('disp-streak'),
    pb: document.getElementById('disp-pb'),
    token: document.getElementById('disp-token') // Angepasst auf 'token'
};

// =======================================================
// 1. EMPFANGEN: Daten vom Server (wird bei jeder Änderung gesendet)
// =======================================================
socket.on('update', (state: AppState) => {
    // Aktualisiert die Textinhalte in der OBS-Anzeige
    if (els.streak) els.streak.innerText = state.streak.toString();
    if (els.pb) els.pb.innerText = state.pb.toString();
    if (els.token) els.token.innerText = state.token.toString();
});

// Bei Verbindungsabbruch (z.B. wenn der Server gestoppt wird)
socket.on('disconnect', () => {
    console.warn("Verbindung zum Server verloren!");
    // Optional: Hier könnten Sie eine Fehlermeldung in der Anzeige einblenden
});


// =======================================================
// 2. SENDEN: Aktionen an den Server (wird von Buttons aufgerufen)
// =======================================================

/**
 * Sendet einen Befehl zur inkrementellen Änderung (+1 oder -1) an den Server.
 * @param key - Welcher Wert soll geändert werden ('streak', 'pb', 'token').
 * @param val - Die Änderung (+1 oder -1).
 */
function sendUpdate(key: keyof AppState, val: number): void {
    // Senden des Action-Objekts an den Server
    socket.emit('action', {
        type: 'UPDATE',
        payload: { key, val }
    });
}

/**
 * Sendet einen Befehl zum Zurücksetzen eines einzelnen Wertes auf 0.
 * @param key - Welcher Wert soll zurückgesetzt werden.
 */
function sendReset(key: keyof AppState): void {
    if (confirm(`Sicher, dass Sie ${key.toUpperCase()} auf 0 zurücksetzen wollen?`)) {
        socket.emit('action', {
            type: 'RESET',
            payload: key
        });
    }
}

/**
 * Sendet einen Befehl zum Zurücksetzen aller Werte auf 0.
 */
function sendResetAll(): void {
    if (confirm("Wirklich ALLE Werte (Streak, PB, Token) auf 0 zurücksetzen?")) {
        socket.emit('action', {
            type: 'RESET_ALL'
            // payload ist hier nicht nötig
        });
    }
}

// Die Funktionen dem globalen Window-Objekt hinzufügen,
// damit sie über die onclick-Attribute in der index.html aufrufbar sind.
(window as any).sendUpdate = sendUpdate;
(window as any).sendReset = sendReset;
(window as any).sendResetAll = sendResetAll;

// Initialer Log, um zu prüfen, ob das Skript geladen wurde
console.log("Client-Skript für Benso Tank Roulette geladen und verbunden.");