# Comic Schachtel

Web-App zum Lesen von Comics, mit Android-Wrapper via Capacitor.

**Live:** https://mrcerealguy.github.io/Comic-App/

## Struktur

```
├── start.html               # Startscreen (Vollbild, Klick → Bibliothek)
├── start.png                # Startbild
├── index.html               # Comic-Bibliothek
├── reader.html              # Reader-Ansicht
├── css/style.css            # Styling
├── js/app.js                # App-Logik
├── data/
│   ├── comics.json          # Metadaten aller Comics
│   └── comic_1/             # Seiten (front.jpg, page_001.jpg, ..., back.jpg)
├── scripts/
│   ├── build-www.js         # Build-Skript für www/
│   └── import-comic.js      # Comic-Import-Skript
├── capacitor.config.json    # Capacitor-Konfiguration
└── android/                 # Android-Projekt (generiert, gitignored)
```

## Comic hinzufügen

### Automatisch (empfohlen)

1. Bilder von Google Fotos in den Ordner `inbox/` herunterladen
2. Import starten:

```bash
npm run import
```

Das Skript fragt nach Comic-Nr, Titel, Autor, Jahr, Genres sowie Front-/Back-Cover
und erledigt dann automatisch:

- Konvertierung PNG → JPG und Skalierung (max. 800px Breite, Qualität 80%)
- Umbenennung (`front.jpg`, `page_001.jpg` bis `page_NNN.jpg`, `back.jpg`)
- Verschiebung nach `data/comic_X/`
- Aktualisierung von `data/comics.json`
- Commit + Push nach GitHub

### Manuell

1. Ordner `data/comic_X/` anlegen mit:
   - `front.jpg` – Cover
   - `page_001.jpg` bis `page_NNN.jpg` – Seiten
   - `back.jpg` – Rückseite (optional)

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

   > Die Seitennummerierung ist 3-stellig nullgefüllt (`page_001.jpg`).
   > Nur JPG wird unterstützt.

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
- JDK 21 (Capacitor 8)

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

Die App lädt alle Inhalte live von GitHub Pages (keine Comics in der APK).
Der Startscreen (`start.html`) wird beim Start vollflächig angezeigt;
ein Klick auf das Bild führt in die Comic-Bibliothek.

### NPM-Scripts

| Command | Beschreibung |
|---------|-------------|
| `npm start` | lokaler Webserver auf Port 8080 |
| `npm run build:www` | kopiert Web-Dateien nach `www/` |
| `npm run import` | Comic-Import aus `inbox/` |
| `npm run cap:sync` | baut `www/` + synchronisiert mit Android |
| `npm run cap:open` | öffnet Android Studio |
