# 🌟 Benso Tank Roulette Stream-Tool 🌟

Dieses Tool dient zur Steuerung und Visualisierung der "Tank Roulette" Herausforderung für Twitch/YouTube Streams und wurde speziell für die Nutzung als OBS-Overlay entwickelt.

## 🚀 Installation & Start

Dieses Tool wird als eigenständige ausführbare Datei (`.exe`) bereitgestellt und benötigt keine separate Installation von Node.js oder anderen Abhängigkeiten.

### 1. Starten des Servers

1.  Doppelklicke die Datei **`benso-roulette.exe`** im `release/`-Ordner.
2.  Es öffnet sich ein Konsolenfenster. Der Server läuft nun im Hintergrund.
3.  **Wichtig:** Lasse das Konsolenfenster während des gesamten Streams geöffnet.

### 2. Zugriff auf das Control Panel (Steuerung)

Das Control Panel dient zur manuellen Änderung aller Counter und Einstellungen.

Öffne diese URL in einem beliebigen Browser auf deinem PC:

**🔗 Tank Roulette Dashboard:** `http://localhost:3000`

## 📺 OBS-Integration (Overlay)

Das Overlay zur Anzeige der Werte im Stream wird über die Hauptseite des Servers bereitgestellt.

### 1. Browser Source hinzufügen

1.  Füge in OBS eine neue **"Browser Source"** hinzu.
2.  Deaktiviere das Kontrollkästchen **"Lokale Datei"**.

### 2. URL für das Overlay

Füge diese URL als Quelle ein:

**🔗 OBS Overlay URL:** `http://localhost:3000/`

### 3. Anpassungen in OBS

* Stelle die **Breite** und **Höhe** der Browser Source entsprechend den Styling-Anforderungen deines Overlays ein (z. B. 600x150 Pixel).
* Das Styling (Schriftart, Hintergrund, Farben) wird über die Datei `public/style.css` definiert, die in der Anwendung gebündelt ist.

## 🕹️ Features des Control Panels

Das Control Panel ermöglicht die Echtzeit-Steuerung der Stream-Visualisierung:

### A. Zähler-Steuerung

| Zähler            | Funktion                                                          |
|:------------------|:------------------------------------------------------------------|
| **Etappe**        | Aktuelle Etappe erfolgreicher Herausforderungsstreaks (maximal 4) |
| **Streak**        | Aktuelle Serie erfolgreicher Herausforderungen (maximal 10).      |
| **Reset Counter** | Zählt, wie oft die Streak auf 0 zurückgesetzt wurde.              |
| **Joker**         | Verfügbare Joker, die vor einem Reset verwendet werden können.    |

### B. Stage-Steuerung

* **Stage/Runde:** Definiert, in welcher Phase der aktuellen Challenge du dich befindest (visualisiert durch 4 Kreise im Overlay).

### C. Einstellungen

* **Visualisierungsmodus (`displayMode`):** Schaltet das OBS-Overlay um:
   * `detailliert`: Zeigt alle Werte (Streak, Reset, Joker) gleichzeitig an.
   * `kompakt`: Zeigt nur einen Wert an und rotiert automatisch zwischen Streak, Reset Counter und Joker.
* **Intervall (`interval`):** Definiert, wie lange jeder Wert im **kompakten Modus** sichtbar ist, bevor er zum nächsten Wert wechselt (in Sekunden).

### D. Reset-Funktionen

* **Reset All:** Setzt die Zähler `Streak`, `Reset Counter` und `Joker` auf 0 zurück. **Das eingestellte `Intervall` wird beibehalten.**
---
*Hinweis: Deine Daten werden automatisch in der Datei `data.json` gespeichert. Lösche diese Datei nicht, wenn du deine Statistiken behalten willst.*