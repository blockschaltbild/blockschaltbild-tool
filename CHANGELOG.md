# Changelog – Blockschaltbild-Tool

Alle wesentlichen Änderungen am Tool werden in dieser Datei festgehalten.
Archivierte Vorgängerversionen liegen als ZIP unter `blockschaltbild-archiv/`.

## Version 1.16 – 2026-09-07

- Website-Import lernt selbstständig dazu: Nach dem Auslesen der angegebenen Seite sucht das Tool im Hintergrund nach weiteren Quellen (Hersteller bevorzugt), liest bis zu drei zusätzliche Seiten aus und übernimmt das vollständigste Ergebnis. Die verwendeten Quellen stehen im Fenstertitel.
- Fortschrittsanzeige (Balken + Schritt 1/3 … 3/3) während Abruf, Suche und Auswertung.
- Fehlermeldungen erscheinen erst nach Abschluss aller Schritte und nur, wenn keine einzige Quelle ausgelesen werden konnte.
- Vermittler: neuer Endpoint `/search` (Websuche); Browser-Fallback über Reader-Dienst, falls die Suche vom Vermittler blockiert wird.

## Version 1.15.1 – 2026-09-07

- Website-Import: Funkempfänger werden erkannt (z. B. Shure SLXD4Q+): n× XLR OUT + n× Klinke OUT, Ethernet-Ports einzeln (LAN 1, LAN 2), Antenne A/B als Eingang und Loop-Ausgang (Coax). Typ „Funkempfänger".

## Version 1.15 – 2026-09-07

- Website-Import: Wenn eine Produktseite automatische Abrufe blockiert (z. B. thomann.de, HTTP 403), erscheint statt einer Fehlermeldung ein Textfeld. Der Seitentext kann dort manuell eingefügt und mit „Seite auslesen" analysiert werden.
- Website-Import: Blockiert eine Seite den Vermittler (thomann.de), wird die Seite automatisch über einen Reader-Dienst (r.jina.ai) direkt aus dem Browser geladen – thomann.de funktioniert damit ohne manuelles Einfügen.
- Website-Import: Fehlermeldung unterscheidet jetzt zwischen blockierter Seite und sonstigen Abruffehlern.

## Version 1.14 – 2026-09-07

### Geräte-Import per Website-Adresse (neu)
- „Geräte importieren" öffnet jetzt eine Auswahl: **Datei hochladen** (PDF/Excel/TXT) oder **Website-Adresse angeben**
- Produktseiten (z. B. rockshop.de) werden über den Vermittler (Cloudflare Worker, neuer Endpoint `GET /fetch?url=…`) als Text ausgelesen und mit `analyzeWebsiteText` interpretiert: Name aus Seitentitel, Typ aus Beschreibung, Ports aus „Analoge E/A: 32 Eingänge / 16 Ausgänge", „AES/EBU: …", „Dante: …"
- Regeln für Website-Import: analoge Anschlüsse ohne Steckerangabe → XLR; Dante → Dante Primary/Secondary beidseitig (Cat5/6); LAN-Port immer; USB, Phones, Steckplätze ignoriert; **keine Artikelnummer** (Händlernummern werden nicht übernommen)
- Vermittler: Website-Abruf nur http/https, private/lokale Adressen werden abgewiesen; CORS auf GET erweitert; Browser-User-Agent (thomann.de blockiert dennoch mit 403)
- Website-Parser: Video-Geräte („Inputs: HDMI, SDI" / „INPUTS | 1x HDMI …" → Converter/Switch, Gruppe Video), „Mic-Preamps" als Eingänge, „AES Ausgang", Dante nur bei eingebauter Schnittstelle (optionale Karten ignoriert), Zubehör-Abschnitte ausgeblendet
- Standardbibliothek: „Yamaha DM7" (Digital Mixer, 32 XLR IN / 16 XLR OUT, 2× AES, Dante P/S, LAN) ergänzt

### PDF-Datenblatt-Import (ICT-Datenblätter)
- Neuer Parser für ICT-Datenblätter (`analyzeIctDatasheet`): Gerätename aus der Titelzeile, Artikelnummer aus „Artikelnummer", Ein-/Ausgänge aus „Signaleingänge"/„Signalausgänge"
- Anschlusslisten wie „2x DP(1x mini-DP), 2x HDMI" werden in einzelne Ports mit Kabeltyp umgesetzt (DP IN 1, DP IN 2, HDMI IN 1, …); Klammerzusätze (mini-DP, MST, 3,5mm) werden ignoriert, USB/Hub zählen nicht als Signalanschluss
- Typ „Monitor" wird über Display-Merkmale erkannt; „Integrierte Lautsprecher: -" führt nicht mehr zu Typ „Speaker"/Gruppe „Audio"
- Erkannte Kabeltypen werden im Import-Formular vorbelegt
- Standardbibliothek: „Dell U2414H" (Monitor, Art. 1012229) und „iiyama ProLite TE8668MIS-B1AG" (Touchdisplay, Art. 1017366) ergänzt
- Kabeltyp für DisplayPort-Anschlüsse heißt jetzt einheitlich „DP" (Standard-Kabeltypen, Vorlagen, PDF-Import); der Import gleicht erkannte Kabeltypen mit den im System angelegten ab (z. B. „DisplayPort" in bestehenden Bibliotheken)
- Displays mit Touch-Merkmal erhalten den Typ „Touchdisplay"; SPDIF-Anschlüsse werden erkannt
- RJ45/Ethernet-Schnittstellen werden immer als Port „LAN" (Cat5/6) übernommen – bei ICT-Datenblättern aus „Bedienung/Konfiguration" (tolerant gegenüber Tippfehlern wie „RJ52")

### PDF-Datenblatt-Import (Hersteller-Datenblätter)
- Neuer Parser `analyzeManufacturerDatasheet` für englische Hersteller-Datenblätter (z. B. Yamaha Technical Data Sheet): Modell aus Titelzeile, Hersteller aus Text/Dateiname, Typ aus Untertitel („Digital Mixing Console" → Digital Mixer)
- Ein-/Ausgänge aus Mustern wie „16 Mic/Line (12 XLR + …) inputs, and 8 (XLR) outputs"; alle Kanäle werden einzeln mit generischen Namen angelegt (XLR IN 1 …, XLR OUT 1 …)
- Dante wird als „Dante Primary"/„Dante Secondary" beidseitig (Ein- und Ausgang) mit Kabeltyp Cat5/6 angelegt; USB, Phones/Kopfhörer werden ignoriert
- Standardbibliothek: „Yamaha DM3" (Digital Mixer) ergänzt; „iiyama ProLite TE8668MIS-B1AG" um LAN-Port erweitert

## Version 1.13.2 – 2026-09-07

- „Fehler melden"-Button durch ein Piktogramm (Käfer mit Warndreieck, schwarze Linien) ersetzt

## Version 1.13.1 – 2026-09-07

- Vermittler für „Fehler melden" eingerichtet: Meldungen werden jetzt direkt in das Bug-Report-Repository übertragen (kein lokaler Download mehr)

## Version 1.13 – 2026-09-07

### Fehler melden (neu)
- Neuer Button „🐞 Fehler melden" rechts unten in der Seitenleiste (neben Version und Speicherstatus)
- Formular für Fehler, Verbesserungsvorschläge und Fragen mit Betreff, Beschreibung, optionaler E-Mail und Anhängen (Screenshots, Dateien, max. 5 MB); der aktuelle Projektstand (.ict) kann mitgesendet werden
- Version, Browser, Bildschirmgröße und Projektumfang werden automatisch mitgeschickt
- Meldungen gehen über einen Vermittler (Cloudflare Worker) in das private GitHub-Repository `blockschaltbild-bug-reports` (Ordner `reports/<id>/` mit Bericht und Anhängen) und öffnen dort ein Issue; eine GitHub Action erzeugt daraus eine Analyse mit Prompt-Vorschlag zur Behebung
- Ohne konfigurierten Vermittler (`bugreport-config.js`) wird die Meldung als Datei gespeichert und ein E-Mail-Entwurf geöffnet
- Versionsnummer, Cache-Busting-Parameter und Service-Worker-Cache auf 1.13 gesetzt

## Version 1.12 – 2026-09-07

### Signale prüfen (überarbeitet)
- „Signale prüfen" zeigt das Ergebnis jetzt als Liste in einem Fenster statt als kurze Meldung
- Jede Verbindung wird geprüft, ob der Signaltyp des Ausgangs zum Signaltyp des Eingangs passt (HDMI, SDI, DP, LC, CAT); Verbindungen mit gleichem Typ gelten als korrekt
- Einträge werden als Fehler (inkompatibel / kein Konverter / Konverter erforderlich bei deaktiviertem Auto-Konverter), Warnung (unterschiedliche Kabeltypen ohne bekannten Signaltyp, z.B. XLR → Klinke) oder Info (Konverter automatisch eingefügt) angezeigt
- Über „Anzeigen" springt man direkt zur betroffenen Verbindung; sie wird ausgewählt und in den sichtbaren Bereich gescrollt
- Verbindungen an Platzhaltergeräten werden nicht geprüft (Anzahl wird in der Zusammenfassung genannt)
- Konverter werden nur noch automatisch eingefügt, wenn „Auto-Konverter" aktiviert ist
- Versionsnummer, Cache-Busting-Parameter und Service-Worker-Cache auf 1.12 gesetzt

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
