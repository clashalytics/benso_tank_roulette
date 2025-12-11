# 🎰 Benso Tank Roulette – Anleitung

Dies ist dein lokaler Challenge-Tracker für OBS. Du musst nichts installieren.

## 🚀 Schnellstart
1. Entpacke den Projektordner an einen Ort deiner Wahl.
2. Doppelklicke auf die Datei **`START_SERVER.bat`**.
3. Ein Fenster (Konsole) öffnet sich mit der Meldung: *"Stream Tool läuft! Öffne http://localhost:3000 im Browser"*.
   **WICHTIG:** Lasse dieses Fenster während deines Streams im Hintergrund offen!

## 📺 Einrichtung in OBS
1. Füge eine neue **Browserquelle** zu deiner Szene hinzu.
2. URL: `http://localhost:3000` | Breite: `1920` | Höhe: `1080`.
3. **Zuschneiden (Cropping):** * Halte in OBS die **ALT-Taste** gedrückt und ziehe die Ränder des roten Rahmens so zurecht, dass nur die obere Anzeige sichtbar ist und das untere Control Panel verschwindet.
4. **Hintergrund entfernen (Transparenz):**
   * Rechtsklick auf die Browserquelle -> **Filter**.
   * Füge einen Filter vom Typ **"Chroma Key"** (oder "Color Key") hinzu.
   * Wähle als Schlüsselfarbe "Grün" oder "Benutzerdefinierte Farbe" (Neon-Grün `#00ff00`).
   * Stelle die Ähnlichkeit so ein, dass der grüne Hintergrund komplett verschwindet und nur die Anzeige übrig bleibt.

## 🕹 Steuerung
* Öffne deinen normalen Browser (Chrome/Edge/Firefox) und gehe auf `http://localhost:3000`.
* Hier kannst du während des Streams bequem die Werte für Streak, PB und Token ändern.
* Alle Änderungen werden **sofort** in OBS sichtbar.

---
*Hinweis: Deine Daten werden automatisch in der Datei `data.json` gespeichert. Lösche diese Datei nicht, wenn du deine Statistiken behalten willst.*