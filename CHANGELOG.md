# Changelog – Blockschaltbild-Tool

Alle wesentlichen Änderungen am Tool werden in dieser Datei festgehalten.
Archivierte Vorgängerversionen liegen als ZIP unter `blockschaltbild-archiv/`.

## Version 1.11 – 2026-09-07

### Speicherstatus (neu)
- Neue Statuszeile unten in der Seitenleiste zeigt an, ob ungespeicherte Änderungen vorliegen („● Ungespeicherte Änderungen", rot) oder wann zuletzt gespeichert wurde (Datei / Autosave / geladen mit Uhrzeit)
- Erkennung von Änderungen über einen Vergleich des Projektstands (Bibliothek, Gruppen und Kabeltypen zählen nicht als Projektänderung)
- Beim Schließen oder Neuladen der Seite mit ungespeicherten Änderungen warnt der Browser vor Datenverlust
- Dateinamen beim Speichern/Export werden zentral erzeugt; unzulässige Zeichen werden ersetzt
- Versionsnummer, Cache-Busting-Parameter und Service-Worker-Cache auf 1.11 gesetzt
- Vorgängerversion 1.08 archiviert als `blockschaltbild-archiv/blockschaltbild_v1.08_2026-09-07.zip`

## Version 1.10 – 2026-09-07

### Kabellängen prüfen (neu)
- Neuer Menüpunkt Verbindungen → „Kabellängen prüfen": prüft alle Verbindungen auf eine hinterlegte Kabellänge
- Fehlt bei mindestens einer Verbindung die Länge, öffnet sich ein Fenster mit der Liste aller betroffenen Verbindungen; die Länge kann dort direkt je Verbindung eingetragen und gespeichert werden
- Sind bereits überall Längen hinterlegt, erscheint eine Bestätigungsmeldung

## Version 1.09 – 2026-09-07

### Listen-PDF mit Blattauswahl
- „Listen PDF" (Menü Datei und Strg+Shift+P) öffnet jetzt wie der Plan-Export einen Auswahldialog für die Arbeitsbereiche
- Neue Option „Zusammenfassung Gesamtprojekt anhängen": zusätzliche Seiten mit Geräte- und Kabelliste über alle gewählten Arbeitsbereiche inkl. Gesamtsummen
- Export-Dialog wird für Plan- und Listen-Export gemeinsam genutzt (Titel, Hinweistext und Optionen passen sich an)

## Version 1.08 – 2026-09-07

### Installation als App (PWA, neu)
- Das Tool kann in Google Chrome, Brave und Microsoft Edge als eigenständige App installiert werden (eigenes Fenster ohne Browser-Leiste, Symbol im Dock/Startmenü)
- Neuer Menüpunkt Ansicht → „Als App installieren..." öffnet den Installations-Dialog des Browsers; ist er nicht verfügbar, wird eine browserspezifische Anleitung angezeigt (Chrome/Brave: Symbol „Installieren" in der Adressleiste)
- Läuft das Tool bereits als App, zeigt der Menüpunkt „Als App installiert" an
- Web-App-Manifest (`manifest.webmanifest`) mit Name, Farben, Icons (192/512 px unter `icons/`) und Querformat-Vorgabe
- Service Worker (`sw.js`): App-Dateien und CDN-Bibliotheken (pdf.js, jsPDF, html2canvas, SheetJS) werden nach dem ersten Aufruf zwischengespeichert; das Tool lässt sich dadurch auch offline starten. Online wird immer die aktuelle Version geladen (Netzwerk zuerst, Cache als Fallback)
- Dateizuordnung: Installierte App registriert sich für `.ict`/`.json`-Projektdateien; per Doppelklick geöffnete Dateien werden direkt geladen (Chrome/Edge/Brave)
- Theme-Farbe und Apple-Touch-Icon für Safari/iOS ergänzt
- Neue Datei `app-pwa.js`; Versionsnummer und Cache-Busting-Parameter auf 1.08 gesetzt

## Version 1.07 – 2026-09-07

### Tastenkürzel (neu)
- Neuer Menüpunkt Ansicht → „Tastenkürzel…“ öffnet ein Fenster mit allen Kürzeln (Anzeige passt sich an Mac ⌘ / Windows Strg an); Kürzel auch per Strg+/ bzw. Cmd+/
- Bearbeiten: Strg+Z Rückgängig, Strg+Y / Strg+Shift+Z Wiederherstellen, Strg+C markiertes Gerät kopieren, Strg+V Gerät einfügen (wird versetzt neben dem Original platziert, mehrfaches Einfügen möglich)
- Geräte: Strg+F öffnet die Gerätesuche in der Bibliothek (klappt die Seitenleiste bei Bedarf auf), Strg+E öffnet die Geräteverwaltung für das markierte Gerät
- Datei: Strg+S Speichern, Strg+P Plan-PDF (A1), Strg+Shift+P Listen-PDF, Strg+I Projekteigenschaften
- Verbindungen: Strg+B Auto-Verbinden, Strg+Shift+K Kurve, Strg+Shift+E 90° Ecken
- Ansicht: Strg++ / Strg+− Zoom, Strg+0 Zoom auf 100 %, Strg+G Raster an/aus, Strg+Shift+G Einrasten an/aus
- Kürzel wirken nicht in Eingabefeldern und (außer Esc und Strg+/) nicht bei geöffnetem Dialog; Menü-Tooltips zeigen das zugehörige Kürzel
- Neue Datei `app-shortcuts.js`; Versionsnummer und Cache-Busting-Parameter auf 1.07 gesetzt

## Version 1.06 – 2026-09-07

### Rückgängig / Wiederherstellen (neu)
- Zwei neue Icons in der Menüleiste (neben Projektname/-nummer): Rückgängig und Wiederherstellen
- Bis zu 20 Bearbeitungsschritte können rückgängig gemacht und wieder vorgesprungen werden
- Tastenkürzel: Strg+Z / Cmd+Z (Rückgängig), Strg+Y bzw. Cmd+Shift+Z (Wiederherstellen); in Eingabefeldern bleibt die normale Browser-Funktion aktiv
- Erfasst werden: Geräte/Textfelder/Verbindungen hinzufügen, löschen, verschieben; Verbindungen umstecken, Knickpunkte ziehen, Kurve zurücksetzen; Eigenschaften (Name, Typ, Gruppe, Farbe, Kabeltyp, Länge, Beschriftung, Textfeld-Text/-Größe/-Farben); Auto-Verbinden, Verbindungen löschen, Signale prüfen/Konverter; Arbeitsbereiche anlegen/löschen/umbenennen; Neu, Laden und Autosave-Wiederherstellung
- Zusammenhängende Aktionen (z. B. Löschen eines Geräts inkl. seiner Verbindungen, fortlaufendes Tippen in einem Textfeld) werden als ein Schritt behandelt
- Icons sind ausgegraut, wenn kein Schritt verfügbar ist; der Tooltip zeigt die Anzahl der verfügbaren Schritte
- Neue Datei `app-history.js`; Versionsnummer und Cache-Busting-Parameter auf 1.06 gesetzt

## Version 1.05 – 2026-09-07

### Autosave (neu)
- Automatische Sicherung des Diagramms im Browser (localStorage), ein-/ausschaltbar im Menü „Datei"
- Intervall frei einstellbar (1–120 Minuten, Standard 5 Minuten); Einstellungen werden gespeichert
- Statusanzeige im Menü zeigt den Zeitpunkt der letzten Sicherung
- Neuer Menüpunkt „Autosave wiederherstellen" lädt die letzte automatische Sicherung

### Speichern / Laden
- Neues Projekt-Dateiformat `.ict` (Inhalt bleibt JSON, bestehende `.json`-Dateien lassen sich weiterhin laden)
- Dateiname beim Speichern enthält jetzt das Datum: `Projektname_JJJJ_MM_TT.ict`
- Serialisierung des Diagramms in eigene Funktion ausgelagert (gemeinsam genutzt von Speichern und Autosave)

### Sonstiges
- Favicon hinzugefügt (`favicon.png`)
- Versionsnummer und Cache-Busting-Parameter auf 1.05 gesetzt
- Vorgängerversion 1.04 archiviert als `blockschaltbild-archiv/blockschaltbild_v1.04_2026-09-07.zip`

## Version 1.04 – 2026-09-07

Enthält alle Änderungen der internen Offline-Version 1.03 (nicht veröffentlicht).

### Auto-Verbinden (neu aufgebaut)
- Auto-Verbinden öffnet jetzt einen eigenen Dialog mit Auswahl von Startgerät (Ausgänge) und Endgerät (Eingänge)
- Vorbelegung der Auswahl anhand markierter Geräte bzw. der Position im Plan (links → rechts)
- Vorschauliste aller geplanten Verbindungen mit Checkboxen; einzelne Verbindungen können vor dem Erstellen abgewählt werden
- Zuordnung in mehreren Durchläufen: gleicher Kabeltyp → gleicher Signaltyp → gleicher Anschlussname → freie Zuordnung
- Option „Auch Anschlüsse ohne erkennbaren Signaltyp der Reihe nach verbinden"
- Option „Glasfaser bevorzugen": LC/LC-Ausgänge werden über einen automatisch eingefügten CVT-10 Medienkonverter auf Cat5/6-Eingänge geführt
- Bei inkompatiblen Signalen wird (wenn aktiviert) automatisch ein passender Konverter eingefügt
- Hinweis, wenn weniger als zwei Geräte im Plan sind oder keine passenden freien Anschlüsse gefunden werden

### Kontextmenü für Geräte (neu)
- Rechtsklick auf ein Gerät im Plan öffnet ein Kontextmenü
- Einträge: Geräteeigenschaften öffnen, Gruppe wechseln (Untermenü mit Farbvorschau), Farbe direkt ändern, Zurücksetzen, Löschen
- Platzhalter-Geräte werden im Menü als solche gekennzeichnet
- Menü schließt automatisch bei Klick außerhalb, Scrollen oder Fenstergrößenänderung
- „Zurücksetzen" stellt die Ursprungswerte des Geräts (Name, Typ, Artikel, Gruppe, Farbe) aus der Bibliothek wieder her

### Geräteeigenschaften und Bibliothek
- Änderungen an Name, Typ, Artikelnummer, Gruppe oder Farbe im Eigenschaften-Panel werden auf alle gleichen Geräte (gleicher Name + Artikel) über alle Blätter hinweg übernommen und in die Bibliotheksvorlage zurückgeschrieben
- Gruppenwechsel setzt automatisch die Gruppenfarbe, sofern keine eigene Farbe gewählt wurde
- „Geräteeigenschaften öffnen" aus dem Kontextmenü springt direkt in den Bibliotheks-Editor der zugehörigen Vorlage (Suchfeld wird vorbelegt)
- Änderungen an einer Bibliotheksvorlage werden auf alle bereits platzierten Geräte dieser Vorlage übertragen
- Eigenschaften-Panel wird beim Öffnen eingeblendet, hervorgehoben (kurzes Aufblinken) und das erste Feld fokussiert; eingeklappte Sidebar wird automatisch ausgeklappt
- Geräte aus der Bibliothek werden jetzt per Einfachklick (statt Doppelklick) hinzugefügt
- Neue Geräte werden in der Mitte des sichtbaren Canvas-Bereichs platziert (zoomabhängig) und direkt ausgewählt
- Jedes platzierte Gerät speichert seine Ursprungswerte (`origin`) für die Zurücksetzen-Funktion
- Neue Bibliotheksvorlage: CVT-10 Medienkonverter (LC/LC ↔ Cat5/6)
- Neuer Kabeltyp „Glasfaser LC/LC"
- Signalerkennung erweitert: LC/LC, Glasfaser, LWL, Fiber/Fibre → „LC"; Cat5–8, RJ45, Ethernet, LAN → „CAT"
- Konverter-Regeln erweitert: LC → CAT und CAT → LC über CVT-10

### Projekt laden / Performance
- Neuer Lade-Overlay mit Fortschrittsbalken beim Öffnen eines Projekts (Datei lesen → Daten analysieren → Bibliothek abgleichen → Geräte zeichnen → Verbindungen zeichnen → Kreuzungen berechnen → Signalprüfung)
- Fortschrittsanzeige zeigt Dateiname, Dateigröße sowie Anzahl gezeichneter Geräte/Verbindungen an
- Blatt-Aufbau erfolgt asynchron in Blöcken, damit die Oberfläche bei großen Plänen nicht einfriert
- Fehlermeldung, wenn eine Projektdatei nicht gelesen werden kann
- Kreuzungsberechnung (Brücken) deutlich beschleunigt: Bounding-Box-Vorprüfung pro Verbindung und pro Segment, Zwischenspeicher für abgetastete Pfade
- Sammel-Rendering (`bulkRender`): Beim Blattwechsel werden Kreuzungen nur einmal am Ende berechnet statt nach jeder einzelnen Verbindung

### Bedienung / Menüs
- Dropdown-Menüs in der Toolbar schließen sich nach Klick auf einen Menüpunkt bzw. nach Auswahl in einem Auswahlfeld automatisch
- Klicks innerhalb eines Menü-Panels schließen das Menü nicht mehr versehentlich

### Sonstiges
- Versionsnummer auf 1.04 gesetzt (Anzeige unten links in der Geräte-Bibliothek)
- Cache-Busting-Parameter aller JS/CSS-Dateien auf 1.04 aktualisiert
- Vorgängerversion 1.02 archiviert als `blockschaltbild-archiv/blockschaltbild_v1.02_2026-09-07.zip`

## Version 1.02 – 2026-09-07

- Versionsanzeige unten links in der Geräte-Bibliothek
- Zentrale `version.js` für die Versionsnummer
- Cache-Busting für JS/CSS-Dateien

## Version 1.01 – 2026-09-07

- Mehrseitiger Plan-PDF-Export über Blattauswahl
- Export-Funktionen ins Menü „Datei" verschoben

## Version 1.0 – 2026-09-04

- Erste Veröffentlichung als statische Web-App (GitHub Pages)
- Archiviert als `blockschaltbild-archiv/blockschaltbild_v1.0_2026-09-04.zip`
