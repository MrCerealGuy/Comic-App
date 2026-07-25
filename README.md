# Comic App

Web-App zum Lesen von Comics, mit Android-Wrapper via Capacitor.

**Live:** https://mrcerealguy.github.io/Comic-App/

## Struktur

```
├── index.html              # Comic-Übersicht
├── reader.html             # Reader-Ansicht
├── css/style.css           # Styling
├── js/app.js               # App-Logik
├── data/
│   ├── comics.json         # Metadaten aller Comics
│   └── comic_1/            # Seiten (front.png, page_001.png, ..., back.png)
├── scripts/build-www.js    # Build-Skript für www/
├── capacitor.config.json   # Capacitor-Konfiguration
└── android/                # Android-Projekt (generiert)
```

## Comic hinzufügen

1. Ordner `data/comic_X/` anlegen mit:
   - `front.png` – Cover
   - `page_001.png` bis `page_NNN.png` – Seiten
   - `back.png` – Rückseite

2. In `data/comics.json` einen Eintrag ergänzen:
   ```json
   {
     "id": 2,
     "title": "Titel",
     "author": "Autor",
     "year": 2026,
     "genres": ["Genre1"],
     "pages": 30,
     "available": true
   }
   ```

   > Die Seitennummerierung ist 3-stellig nullgefüllt (`page_001.png`).
   > PNG und JPG werden unterstützt.

## Web lokal starten

```bash
npm start
```

Dann http://localhost:8080 öffnen.

## Android APK bauen

### Voraussetzungen

- [Node.js](https://nodejs.org/) >= 18
- [Android Studio](https://developer.android.com/studio)
- Android SDK (in Android Studio unter SDK Manager installieren)

### Schritte

```bash
# Dependencies installieren
npm install

# Web-Dateien nach www/ kopieren und mit Android synchronisieren
npm run cap:sync

# Android Studio öffnen
npm run cap:open
```

In Android Studio:
1. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. APK liegt unter `android/app/build/outputs/apk/debug/app-debug.apk`

### NPM-Scripts

| Command | Beschreibung |
|---------|-------------|
| `npm start` | lokaler Webserver auf Port 8080 |
| `npm run build:www` | kopiert Web-Dateien nach `www/` |
| `npm run cap:sync` | baut `www/` + synchronisiert mit Android |
| `npm run cap:open` | öffnet Android Studio |
