# Changelog – Blockschaltbild-Tool

Alle wesentlichen Änderungen am Tool werden in dieser Datei festgehalten.
Archivierte Vorgängerversionen liegen als ZIP unter `blockschaltbild-archiv/`.

## Version 1.28.0 – 2026-09-10

- **Direktes Speichern ohne erneute Nachfrage:** Wurde eine Datei bereits einmal lokal gespeichert (oder über „Laden" geöffnet, im Browser unterstützt), überschreibt der „Speichern"-Button (bzw. Strg/Cmd+S) diese Datei jetzt direkt – ohne dass erneut nach Name und Speicherort gefragt wird.
- **Neu: „Speichern unter ..."** im Menü „Datei" (bzw. Strg/Cmd+Umschalt+S): Sichert das aktuelle Projekt unter einem frei wählbaren Namen/Pfad. Danach überschreibt „Speichern" wieder direkt diese neue Datei, ohne Rückfrage.
- Hinweis: Diese Direktspeicherung nutzt die File-System-Access-API des Browsers (aktuell u. a. Chrome/Edge). In Browsern ohne Unterstützung (z. B. Firefox, Safari) funktioniert „Speichern" weiterhin über den klassischen Download-Dialog des Browsers.

## Version 1.27.1 – 2026-09-10

- Fehlerbehebung: Beim PDF-Export mit mehreren Seiten (Arbeitsbereiche und/oder Gruppen-Zeichenblätter) wurde jede Seite unabhängig auf den verfügbaren Platz im A1-Rahmen skaliert. Dadurch wirkten Geräte auf Seiten mit wenig Inhalt (z. B. einer kleinen Gruppe) deutlich größer als auf dem Hauptblatt. Der PDF-Export verwendet jetzt für alle Seiten eines Exportvorgangs einen einheitlichen Maßstab, sodass Geräte auf jeder Seite gleich groß dargestellt werden.

## Version 1.27.0 – 2026-09-10

- **Gruppen-Zeichenblätter im PDF- und Listen-Export:** Im Dialog „Plan als PDF exportieren" (A1) sowie „Listen als PDF exportieren" werden zusammengeklappte Gruppen jetzt zusätzlich unter dem jeweiligen Arbeitsbereich aufgeführt und können einzeln an-/abgewählt werden. Ausgewählte Gruppen werden als eigene Seite (Gruppen-Zeichenblatt bzw. eigene Geräte-/Kabelliste) in das PDF aufgenommen.

## Version 1.26.0 – 2026-09-10

- **Marquee-Auswahl (Aufziehrechteck):** Bei gedrückter linker Maustaste auf einer leeren Stelle der Zeichenfläche lässt sich jetzt ein Auswahlrechteck aufziehen; alle darin liegenden Geräte werden automatisch markiert. Mit gedrückter Umschalttaste wird zur bestehenden Auswahl hinzugefügt.
- **Gemeinsames Verschieben markierter Geräte:** Sind mehrere Geräte per Mehrfachauswahl (Umschalttaste oder Aufziehrechteck) markiert, werden sie beim Ziehen eines der markierten Geräte nun alle gemeinsam verschoben.
- Die bestehende Funktion „Auswahl gruppieren“ funktioniert jetzt auch mit einer per Aufziehrechteck erstellten Mehrfachauswahl.

## Version 1.25.2 – 2026-09-10

- Fehlerbehebung: Beim Verschieben eines Geräts in der Gruppen-Zeichenfläche wurden die gestrichelten Stummel-Linien für ein-/ausgehende externe Verbindungen bei jedem Neuzeichnen zusätzlich angehängt statt ersetzt, wodurch sich Linien und Beschriftungen sichtbar überlagerten. Die Zeichenfläche wird jetzt vor jedem Neuzeichnen korrekt geleert.

## Version 1.25.1 – 2026-09-10

- Fehlerbehebung: Beim Verschieben von Geräten innerhalb der Gruppen-Zeichenfläche sprang der eingeklappte Gruppenblock beim Zurückkehren zum Ursprungsblatt auf eine neue Position. Die Position des eingeklappten Blocks im Ursprungsblatt bleibt jetzt unverändert (Vorrang), unabhängig davon, wie die Geräte innerhalb der Gruppen-Zeichenfläche angeordnet wurden – interne Anordnungsänderungen werden beim Zurückspielen automatisch auf die ursprüngliche Position ausgerichtet.

## Version 1.25.0 – 2026-09-10

- **Externe Verbindungen in der Gruppen-Zeichenfläche:** Führt eine Verbindung von außerhalb in die Gruppe hinein oder aus ihr heraus zu einem anderen Gerät, wird dies in der Gruppen-Zeichenfläche jetzt als gestrichelte Stummel-Linie mit Pfeilspitze am betroffenen Anschluss dargestellt, beschriftet mit Name (und Anschlussbezeichnung) des externen Geräts sowie Pfeilrichtung. So bleibt beim konzentrierten Bearbeiten einer Gruppe erkennbar, woher eine Verbindung kommt bzw. wohin sie führt, ohne das externe Gerät selbst einzublenden.

## Version 1.24.1 – 2026-09-10

- Fehlerbehebung: Der eingeklappte Gruppenblock hatte je nach Layout der enthaltenen Geräte eine stark variierende, teils sehr große Breite. Er hat jetzt immer die Standardbreite eines Geräts (kann bei vielen Mitgliedern nur noch in der Höhe wachsen); Titel und Geräteliste werden bei Bedarf sauber abgeschnitten.
- Fehlerbehebung: Der Reiter der Gruppen-Zeichenfläche (und deren Titelleiste) übernahm beim Umbenennen einer eingeklappten Gruppe nicht sofort den neuen Namen. Reiter und Titel folgen jetzt direkt der Umbenennung.

## Version 1.24.0 – 2026-09-10

- **Eigene Zeichenfläche für eingeklappte Gruppen:** Sobald eine Gruppe eingeklappt ist, erscheint oben (neben den Blatt-Reitern) ein eigener „📦"-Reiter für diese Gruppe; alternativ per Doppelklick auf den eingeklappten Block oder über „📦 Gruppen-Zeichenfläche öffnen" im Rechtsklick-Kontextmenü. Die Zeichenfläche zeigt konzentriert nur die Geräte und internen Verbindungen der Gruppe, ohne Ablenkung durch das restliche Blatt. Alle dort vorgenommenen Änderungen (verschieben, verbinden, neue Geräte hinzufügen, löschen) werden automatisch in die eingeklappte Gruppe zurückgespielt. Über „← Zurück zum Blatt" verlässt man die Zeichenfläche (Gruppe bleibt eingeklappt), über „📂 Gruppe ausklappen & schließen" werden die Änderungen übernommen, die Gruppe ausgeklappt und die Zeichenfläche verschwindet wieder.

## Version 1.23.1 – 2026-09-10

- **Tastenkürzel für Gruppierung:** Neue Tastenkürzel (sichtbar über „Tastenkürzel anzeigen"): **Strg+J** gruppiert die aktuelle Mehrfachauswahl, **Strg+Umschalt+J** hebt die Gruppierung des ausgewählten/zuletzt aktiven gruppierten Geräts bzw. der eingeklappten Gruppe auf, **Strg+K** klappt die Gruppe des ausgewählten Geräts bzw. der aktiven Gruppe ein oder aus.
- Fehlerbehebung: Wird ein extern mit einer eingeklappten Gruppe verbundenes Gerät verschoben, folgt die gebündelte Verbindungslinie am Gruppenblock jetzt korrekt (vorher nur beim Verschieben der Gruppe selbst).

## Version 1.23.0 – 2026-09-10

- **Gruppen einklappen:** Eine Gruppierung kann jetzt zusätzlich zur normalen Ansicht zu einem einzigen Block zusammengeklappt werden (Kontextmenü „📦 Gruppe einklappen" auf einem gruppierten Gerät bzw. „📂 Gruppe ausklappen" per Rechtsklick auf den Block). Der zusammengeklappte Block trägt den Namen der Gruppe als Titel und listet alle enthaltenen Geräte auf. Alle Verbindungen, die in die Gruppe hinein- bzw. aus ihr herausführen, werden dabei zu genau einer eingehenden und einer ausgehenden Linie gebündelt (interne Verbindungen zwischen Gruppenmitgliedern werden ausgeblendet); bei mehr als einer gebündelten Verbindung zeigt eine „×N"-Markierung die Anzahl an. Der Block lässt sich wie ein Gerät ziehen und bewegt dabei alle enthaltenen Geräte mit. Unterstützt Umbenennen, Gruppierung aufheben (klappt dabei automatisch aus), Rückgängig/Wiederherstellen und wird mit dem Projekt gespeichert.

## Version 1.22.0 – 2026-09-10

- **Geräte gruppieren:** Mehrere Geräte (inkl. ihrer Verbindungen) können jetzt gruppiert werden, um ganze Blöcke gemeinsam zu verschieben. Mit Umschalt-Klick werden mehrere Geräte ausgewählt (gestrichelter violetter Rahmen), über den Button „Auswahl gruppieren" im Eigenschaften-Panel oder direkt im Rechtsklick-Kontextmenü wird daraus eine Gruppierung. Ein Rechtsklick auf ein bereits mehrfach ausgewähltes Gerät behält die Auswahl bei, sodass „Auswahl gruppieren" dort erscheint. Gruppierte Geräte sind von einem gestrichelten Rahmen mit Namensbeschriftung umgeben (Standard: fortlaufend „Gruppe 1", „Gruppe 2" usw.); wird ein Gerät der Gruppe verschoben, ziehen alle anderen Geräte der Gruppe (und die daran hängenden Verbindungen) automatisch mit. Der Gruppenname lässt sich per Doppelklick auf die Beschriftung oder über „Gruppierung umbenennen" im Kontextmenü ändern. Über „Gruppierung aufheben" im Kontextmenü lässt sich die Gruppierung wieder lösen. Gruppierungen werden mit dem Projekt gespeichert und unterstützen Rückgängig/Wiederherstellen.

## Version 1.21.1 – 2026-09-10

- **Löschen mit Backspace:** Ein markiertes Gerät (bzw. markierte Verbindung/Textfeld) kann jetzt auch mit der Rücktaste (Backspace) gelöscht werden, nicht nur mit Entf.

## Version 1.21.0 – 2026-09-10

- **Ein-/Ausgänge per Drag & Drop umsortieren:** Beim Anlegen und Bearbeiten von Geräten (Geräte-Dialog im Tool sowie Gerätebibliothek-Verwaltung) können Eingänge und Ausgänge jetzt über den Griff „⋮⋮" links neben dem Feld per Drag & Drop in eine andere Reihenfolge gebracht werden. Die Nummerierung wird dabei automatisch angepasst.

## Version 1.20.6 – 2026-09-10

- **Ein CVT-10 versorgt mehrere Cat5/6-Eingänge:** Ein LC/LC-Ausgang wird über *einen* automatisch eingefügten CVT-10 auf so viele Cat5/6-Eingänge des Zielgeräts geführt, wie der Konverter Cat5/6-Ausgänge hat (bisher wurde pro Eingang ein neuer CVT-10 eingefügt). Gilt für Auto-Verbinden („Glasfaser bevorzugen" und Konverter-Zuordnung) sowie für manuell gezogene Verbindungen: Wird von einem bereits belegten LC/LC-Ausgang eine weitere Verbindung auf einen Cat5/6-Eingang gezogen, wird der dort hängende CVT-10 mitgenutzt, solange er freie Cat5/6-Ausgänge hat.
- Standard-Vorlage CVT-10 (ohne zentrale Bibliothek) hat jetzt 8 Cat5/6-Ausgänge.

## Version 1.20.5 – 2026-09-10

- Auto-Konverter LC/LC ↔ Cat5/6: Es wird jetzt gezielt der bestehende **CVT-10 Signalkonverter (Artikel-Nr. 1022136)** aus der Gerätebibliothek zwischengeschaltet (statt der alten Vorlage „CVT-10 Medienkonverter"). Konverter-Regeln können dafür eine Artikel-Nr. angeben; die Suche bevorzugt Artikel-Nr., dann exakten Namen, dann Namens-/Typ-Teiltreffer. Standard-Vorlage entsprechend auf Signalkonverter / 1022136 umgestellt.

## Version 1.20.4 – 2026-09-10

- Button „Drucken" aus dem Menü „Datei" entfernt.

## Version 1.20.3 – 2026-09-10

- **Neu: „Cloud speichern unter ..."** (Menü „Datei"): Legt das aktuell geöffnete Projekt als neue, eigenständige Kopie unter frei wählbarem Namen/Projekt-Nr. in der Cloud ab. Das ursprüngliche Cloud-Projekt bleibt dabei unverändert; ab dem Speichern-unter arbeitet man in der neuen Kopie weiter (auch „In Cloud speichern" sichert danach in die Kopie).

## Version 1.20.2 – 2026-09-10

- Cloud-Liste „Meine Cloud-Projekte": Bei mit mir geteilten Projekten steht jetzt gut sichtbar in einer eigenen Zeile „👤 Freigegeben von: <E-Mail des Eigentümers>" (statt nur unauffällig neben dem Speicherdatum).

## Version 1.20.1 – 2026-09-10

- **Gerätepool wächst automatisch mit:** Jedes neu angelegte Gerät (manuell, per PDF-/Websuche-Import oder JSON-Bibliotheksimport) wird von jedem angemeldeten Nutzer automatisch und im Hintergrund zur zentralen Gerätebibliothek beigetragen – nicht mehr nur, wenn ein Admin aktiv „veröffentlicht“. Neue Datenbankfunktion `submit_device_to_library` (rein additiv: bestehende Geräte/Gruppen/Kabeltypen werden dabei nie verändert oder überschrieben, Duplikate anhand Name + Artikel-Nr. werden übersprungen).
- Datenbank-Erweiterung: `submit_device_to_library` in `supabase/setup.sql` – muss einmalig im Supabase-SQL-Editor ausgeführt werden.

## Version 1.20.0 – 2026-09-10

- **Neues Admin-Tool „Geräteverwaltung“** (`geraete-admin.html`, separat vom Editor aufrufbar über Konto-Menü „Admin – Geräteverwaltung ...“): zentrale, online gepflegte Gerätebibliothek mit Übersicht, Suche, Sortierung (per ↑/↓ innerhalb der Gruppe), Bearbeiten/Duplizieren/Löschen von Geräten, Verwaltung von Gruppen und Kabeltypen sowie Import/Export als JSON.
- **Zentrale Gerätebibliothek für alle Nutzer:** Der Blockschaltbild Editor lädt die im Admin-Tool veröffentlichte Bibliothek beim Anmelden automatisch (`device_library_state` in Supabase) – jeder Nutzer sieht damit immer denselben aktuellen Gerätebestand. Admins können den lokalen Bibliotheksstand über „Geräte verwalten → In zentrale Bibliothek veröffentlichen“ auch direkt aus dem Editor heraus zentral speichern (z. B. nach einem PDF-/Websuche-Import).
- Datenbank-Erweiterung: neue Tabelle `device_library_state` in `supabase/setup.sql` – muss einmalig im Supabase-SQL-Editor ausgeführt werden (siehe `SUPABASE_SETUP.md`).

## Version 1.19.0 – 2026-09-10

- Live-Zusammenarbeit an Cloud-Projekten (Supabase Realtime, keine Datenbankänderung nötig):
  - **Anwesenheitsanzeige** oben rechts: „👥 max@firma.de hat das Projekt offen" bzw. „… bearbeitet gerade" (pulsierender Punkt, sobald jemand ungespeicherte Änderungen hat). Beim Überfahren erscheint die Liste aller Nutzer mit Rolle (Eigentümer/Bearbeiten/Nur lesen) und Status.
  - **Automatische Aktualisierung:** Speichert ein anderer Nutzer das Projekt in der Cloud, wird der neue Stand bei allen, die keine eigenen ungespeicherten Änderungen haben (z. B. Nur-Lesen-Betrachter), sofort nachgeladen – aktuelles Blatt und Zoom bleiben erhalten. Hinweis „🔄 Aktualisiert – Änderungen von … übernommen".
  - **Neu-laden-Leiste:** Hat man selbst ungespeicherte Änderungen, erscheint stattdessen eine blaue Leiste „… hat um HH:MM eine neue Version gespeichert" mit den Buttons **Neu laden** (eigene Änderungen verwerfen) und **Ignorieren**.
  - **Konfliktschutz beim Speichern:** Wurde das Projekt seit dem eigenen Laden von jemand anderem gespeichert, fragt das Tool vor dem Überschreiben nach (die überschriebene Version bleibt als Sicherung in `project_backups`).
- Hinweis: Es handelt sich um Speicher-basierte Synchronisation, kein gleichzeitiges Zeichnen am selben Objekt in Echtzeit. Änderungen werden sichtbar, sobald der andere Nutzer speichert (manuell oder per Autosave mit aktivierter Cloud-Synchronisation).

## Version 1.18.1 – 2026-09-09

- Fehlerbehebung Freigeben („Could not find the table 'public.project_shares' in the schema cache"): Die Tabelle `project_shares` war in der Datenbank noch nicht angelegt – `supabase/setup.sql` muss im Supabase-SQL-Editor (neu) ausgeführt werden (siehe `SUPABASE_SETUP.md`).
- Setup-Skript robuster gemacht: `auth.email()` ist keine Standardfunktion aller Supabase-Instanzen und hätte die Ausführung des Freigabe-Teils abbrechen lassen – ersetzt durch `auth.jwt() ->> 'email'` (Funktion `share_permission` und Policy `shares_select_invited`).

## Version 1.18.0 – 2026-09-09

- Projekte freigeben: Cloud-Projekte lassen sich per E-Mail-Adresse mit anderen Nutzern teilen (Menü „Datei → ☁ Freigeben …" für das aktuelle Projekt oder Button „Freigeben" in „Aus Cloud laden …"). Je Person wählbar: **Bearbeiten** (alle Beteiligten arbeiten am selben Cloud-Projekt und speichern es gemeinsam) oder **Nur lesen**. Freigaben lassen sich nachträglich ändern oder entfernen; „✉ Einladen" öffnet eine vorbereitete E-Mail im Mailprogramm. Die Zuordnung erfolgt über die Anmelde-E-Mail, der Eingeladene muss zum Zeitpunkt der Freigabe noch nicht registriert sein.
- Nur-Lesen-Modus: Wird ein nur lesend freigegebenes Projekt geöffnet, erscheint ein gelber Hinweisbalken; Speichern (lokal, Cloud, Autosave), Drucken, PDF-/Listen-/Excel-Export, Geräte einfügen/importieren, Verbindungen, Textfelder, Blätter, Projektdaten, Bibliotheksverwaltung, Undo/Redo, Kontextmenü, Drag & Drop, Tastenkürzel (außer Ansicht/Zoom) und Eigenschaften-Änderungen sind deaktiviert – sowohl in der Oberfläche als auch in den zugehörigen Funktionen. Auswahl, Zoom, Blattwechsel und Ansehen bleiben möglich. Der Modus endet mit „Neu", „Laden" oder dem Öffnen eines eigenen/bearbeitbaren Projekts.
- Cloud-Liste zeigt bei geteilten Projekten „Bearbeiten"/„Nur lesen" und den Eigentümer, bei eigenen Projekten „Geteilt mit N". Eingeladene können fremde Projekte nicht löschen oder weitergeben (auch serverseitig über RLS gesperrt).
- Datenbank: neue Tabelle `project_shares`, Policies für geteilte Projekte und Schutz des Eigentümers – `supabase/setup.sql` erneut ausführen (siehe `SUPABASE_SETUP.md`).

## Version 1.17.3 – 2026-09-09

- Konto-Menü: Hinweis „Cloud speichern / laden: Menü „Datei“" entfernt – die Funktionen sind bereits direkt im Menü „Datei“ verfügbar.

## Version 1.17.2 – 2026-09-09

- Fehlerbehebung Cloud-Speichern: Der Status-Hinweis („☁ In Cloud gesichert …" bzw. „⚠ Cloud-Speichern fehlgeschlagen") erschien bisher im Konto-Widget der Menüleiste und machte das Widget je nach Text bis zu ~200 px breiter. Überschritt die Zeile dadurch die Fensterbreite, brach die flexible Menüleiste um: Sie wurde höher und ordnete Zoom-Steuerung und Konto-/Profil-Anzeige neu an. Der Hinweis erscheint jetzt als fester Toast unten rechts (klickbar zum Ausblenden, Erfolgsmeldungen verschwinden nach 6 Sekunden) und verändert die Menüleiste nicht mehr.
- Konto-Widget klebt jetzt direkt neben der Zoom-Steuerung am rechten Rand (kein zweiter `margin-left:auto`-Abstand mehr); im mobilen Layout (bis 1100 px) bleibt es wie bisher rechts ausgerichtet.

## Version 1.17.1 – 2026-09-09

- Cloud-Konten (Supabase): Anmeldung mit E-Mail/Passwort, Selbstregistrierung mit E-Mail-Bestätigung. Neue Nutzer erhalten automatisch 30 Tage Zugang; danach ist der Zugang gesperrt, bis ein Administrator verlängert.
- Projekte werden beim Speichern zusätzlich in der persönlichen Cloud gesichert (sichtbarer Hinweis „☁ In Cloud gesichert", in den Kontoeinstellungen abschaltbar). Jeder Nutzer sieht ausschließlich seine eigenen Projekte (serverseitig über Row Level Security erzwungen).
- Neuer Dialog „Meine Cloud-Projekte": gespeicherte Projekte öffnen oder löschen. Jede Zeile zeigt Projektname, Projekt-Nr. und Speicherdatum (TT.MM.JJJJ, HH:MM); das aktuell geöffnete Projekt ist hervorgehoben. Behoben: Der globale Stil für `button.danger` (volle Breite) hatte die Zeile zusammengedrückt, sodass Name/Nummer/Datum nicht lesbar waren.
- Schutz vor versehentlichem Löschen: „Löschen" verschiebt Cloud-Projekte nur in einen Papierkorb (Soft-Delete); Nutzer können nichts endgültig löschen. Ein Datenbank-Trigger sichert vor jedem Überschreiben/Löschen automatisch den alten Stand (letzte 20 je Projekt, bleiben auch nach endgültigem Löschen erhalten).
- Cloud-Speichern und „Aus Cloud laden …“ sind jetzt im Menü „Datei“ (neben Speichern/Laden); im Konto-Menü bleibt der Sync-Schalter. Eine fehlende Datenbank-Aktualisierung wird mit klarem Hinweis auf setup.sql gemeldet.
- Neuer Admin-Dialog „Papierkorb & Sicherungen": alle Projekte aller Nutzer mit Filter; aus dem Papierkorb wiederherstellen, ältere Stände zurückspielen, endgültig gelöschte Projekte aus der Sicherung neu anlegen, endgültig löschen.
- Admin-Bereich (nur für Administratoren): Nutzerliste mit Status, Zugang um 30 Tage verlängern, sperren/entsperren, Rolle ändern, Projektanzahl je Nutzer.
- Einrichtung: siehe `SUPABASE_SETUP.md` und `supabase/setup.sql`.

## Version 1.16.7 – 2026-09-08

- Datenblatt-Import: Neuer Parser für Datenblätter mit Ein-/Ausgangs-Tabelle (z. B. PureLink PT-HDBT-1020C-RX): Zeilen „Eingänge 1x HDBT (RJ45)", „Ausgänge 1x USB 3.2 Gen1 (USB-C)", „Inputs 2x HDMI, 1x DP" werden direkt in Anschlüsse übersetzt (Zähler „Nx" pro Eintrag, Steckertyp aus Beschreibung vor Klammer). Ergebnis: Name „HDBaseT 3.0 USB-C Video- und Daten-Receiver", Artikel „PT-HDBT-1020C-RX", Typ Receiver, Gruppe Video, 1 Eingang HDBaseT (Cat5/6), 1 Ausgang USB-C – statt bisher „PureLink HDCP 2" mit erfundenen HDMI-Ports.
- Steckerliste: HDBaseT wird als eigener Anschluss „HDBaseT" (Kabel Cat5/6) erkannt statt als LAN; USB-C zählt als Video-/Datenanschluss (Kabel USB), USB-A/-B, RS232 und IR weiterhin nicht.
- Modellkennungen mit mehreren Bindestrichen (PT-HDBT-1020C-RX) werden als Modell/Artikel erkannt; Produktbeschreibung unter der Modellkennung wird als Gerätename übernommen. Typerkennung um Receiver/Transmitter/Extender/Switch/Converter/Splitter aus der Kopfzeile ergänzt.
- Der neue Parser greift auch beim Website-Import (Produktseiten und Web-PDFs mit derselben Tabellenform).

## Version 1.16.6 – 2026-09-08

- Import-Fenster: Neues optionales Feld „Gerätebezeichnung" (z. B. „Yamaha DM3"), gilt für Datei-Upload (PDF) und Website-Adresse.
- Die Bezeichnung steuert die Analyse: Websuche sucht gezielt nach „<Bezeichnung> technisches Datenblatt"; Suchtreffer und ausgelesene Quellen (Seiten wie PDFs) ohne diese Modellkennung werden verworfen, damit keine Daten fremder Geräte einfließen. Der Gerätename wird auf die Bezeichnung gesetzt.
- Enthält das hochgeladene Datenblatt bzw. die angegebene Seite die Modellkennung nicht, wird das Ergebnis als unsicher behandelt (Anschlüsse bevorzugt aus passenden Web-Quellen) und im Fenstertitel darauf hingewiesen.

## Version 1.16.5 – 2026-09-08

- Website-Import arbeitet jetzt nach dem Ansatz des Datenblatt-Imports: Die angegebene Seite (oder ein verlinktes PDF) wird mit derselben Parserkette ausgewertet (Produktseite > Display-Datenblatt > Hersteller-Datenblatt; Schlüsselwort-Schätzung nur als schwacher Fallback), anschließend werden die Angaben per Websuche ergänzt und alle belastbaren Treffer zusammengeführt – Angaben der angegebenen Seite haben Vorrang, Lücken füllen die Web-Quellen.
- Websuche (PDF- und Website-Import): Es wird immer zuerst nach „<Gerät> technisches Datenblatt" gesucht, danach nach „technische Daten" und „datasheet specifications", bis mindestens 10 passende weitere Treffer vorliegen (bisher 3). Vermittler und Reader-Fallback liefern bis zu 20 Treffer pro Suche. Herstellerseiten und PDF-Datenblätter werden bevorzugt, Shops/Social Media weiterhin ausgeschlossen, die Ausgangsseite wird nicht doppelt gezählt.
- PDF-Datenblätter aus Suchtreffern werden nicht mehr übersprungen, sondern geladen (pdf.js, bei CORS-Sperre über den Reader-Dienst) und mit den Datenblatt-Parsern (ICT/Display/Hersteller) ausgelesen.
- Quellen werden parallel (3 gleichzeitig) geladen; Statustext zeigt den Fortschritt („Schritt 3/3: Lese 10 Quellen (4/10, zuletzt yamaha.com)...").
- Hersteller wird bei Web-Quellen aus Titel/Kopfzeilen bzw. „Hersteller: X" ergänzt (z. B. „Yamaha DM3" statt „DM3"); Fenstertitel nennt genutzte und zusätzlich geprüfte Quellen.
- Hinweis: Der Vermittler (`relay/worker.js`) muss neu veröffentlicht werden, damit die Suche 20 statt 10 Treffer liefert; ohne Neuveröffentlichung greift die Mindestzahl über die zusätzlichen Suchvarianten.

## Version 1.16.4 – 2026-09-07

- Website-Import: Warteanzeige übernommen vom Datenblatt-Import – das Import-Fenster öffnet sich sofort mit Spinner und Statustext („Schritt 1/3: Lese Produktseite…“, „Schritt 3/3: Lese Quelle 2/3 (host)…“). Der bisherige Fortschrittsbalken im Adress-Formular entfällt.
- Schlägt das Auslesen fehl, kehrt das Tool zum Adress-Formular zurück und zeigt dort wie bisher den Fehlerhinweis und das Einfügefeld für den Seitentext.

## Version 1.16.3 – 2026-09-07

- Datenblatt-Import (PDF): Neuer Parser für Display-/Signage-Datenblätter (z. B. Samsung QM85N) mit Tabellenzeilen „Eingang RGB/Video/Audio …“, „Ausgang …“, „LAN Ja“. Erkennt DVI, DisplayPort („Display Port“), 2x HDMI, Klinke sowie LAN; USB/RS232/IR werden wie bisher nicht als Signalanschlüsse übernommen.
- Gerätename und Hersteller sauberer: Hersteller aus Kopfzeilen, Dateiname, „Hersteller/Lieferant: …“ oder Firmierung (Liste um Samsung, LG, NEC, Philips, BenQ, Logitech u. a. erweitert). Modellkennung aus „Artikelname/Modell/Modellnummer …“, dem Dateinamen (Datenblatt_QM85N → QM85N) oder der Titelzeile („Digital Mixing Console DM3“ → DM3); generische Überschriften („Technical Data Sheet“, „Datenblatt“, Seitenzahlen) werden übersprungen. Ergebnis z. B. „Samsung QM85N“ statt „SMART“, „Yamaha DM3“ statt „Yamaha Technical Data Sheet“.
- Artikelnummer auch aus „Artikelnummer LH85QMNEBGC/EN“, „Bestellnummer“, „Part No.“ usw.
- Typerkennung: Kopfzeilen haben Vorrang vor Fließtext („eingebauter Lautsprecher“ macht ein Display nicht mehr zum Speaker).
- PDF-Text wird jetzt mit Zeilenumbrüchen ausgelesen (pdf.js hasEOL/Y-Position), damit Tabellenzeilen erkennbar bleiben.
- Websuche beim PDF-Import: Trefferliste des Reader-Dienstes wird korrekt ausgewertet (URL und Snippet in einer Zeile); ist der Vermittler nicht erreichbar, wird der Reader-Dienst direkt genutzt. Reine Schlüsselwort-Schätzungen aus Webseiten (Standard-Portanzahl) werden nicht mehr in Datenblatt-Ergebnisse gemischt. Fenstertitel unterscheidet „ergänzt aus Web: …“ (Daten übernommen) und „per Websuche geprüft: …“ (nichts zu ergänzen).
- Kabeltypen-Standardliste um DVI und VGA erweitert (gilt für neue Bibliotheken; bestehende Listen lassen sich in der Kabelverwaltung ergänzen).

## Version 1.16.2 – 2026-09-07

- Datenblatt-Import (PDF): Jedes Datenblatt wird jetzt immer per Websuche geprüft – nicht mehr nur bei fehlenden Angaben. Ausnahme: ICT-Datenblätter (Kopfzeile „ICT AG | ...", Abschnitte Signaleingänge/-ausgänge) werden ohne Websuche übernommen.
- Dabei gilt das gleiche Prinzip wie beim Website-Import: bis zu drei passende Quellen (Modellnummer muss vorkommen, Hersteller bevorzugt, Shops/Videoportale ausgeschlossen) werden ausgelesen und alle relevanten Treffer zusammengeführt. Die Datenblatt-Angaben haben Vorrang, die Webquellen füllen Lücken nach Vollständigkeit. Fortschritt (Quelle 1/3 ...) erscheint im Statustext, genutzte Quellen im Fenstertitel.

## Version 1.16.1 – 2026-09-07

- Datenblatt-Import (PDF): Fehlen nach der Analyse Angaben (Typ, Ein-/Ausgänge) oder bleibt der Typ unbestimmt, ergänzt das Tool automatisch per Websuche (gleicher Mechanismus wie beim Website-Import) und führt beide Ergebnisse zusammen – die Datenblatt-Angaben haben dabei Vorrang, die Websuche füllt nur Lücken. Genutzte Quellen erscheinen im Fenstertitel.
- Entfernter Hinweistext „Seitentext hier einfügen ..." im Einfügefeld des Website-Imports (Funktion wird nicht mehr in dieser Form genutzt).

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
