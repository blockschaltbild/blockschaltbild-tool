# Changelog – Blockschaltbild-Tool

Alle wesentlichen Änderungen am Tool werden in dieser Datei festgehalten.
Archivierte Vorgängerversionen liegen als ZIP unter `blockschaltbild-archiv/`.

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
