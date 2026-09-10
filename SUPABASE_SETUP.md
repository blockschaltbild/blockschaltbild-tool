# Cloud-Konten & Projektspeicher einrichten (Supabase)

Diese Anleitung richtet die Nutzerverwaltung und den Cloud-Projektspeicher für den
Blockschaltbild Editor ein. Alles läuft im **kostenlosen** Supabase-Tarif.

Ergebnis:
- Nutzer registrieren sich selbst mit E-Mail/Passwort und bestätigen ihre E-Mail.
- Neue Nutzer haben **30 Tage** Zugang; danach muss ein Admin verlängern.
- Jeder sieht **nur seine eigenen** Projekte (serverseitig über Row Level Security).
- Du hast einen **Admin-Bereich** zur Nutzerverwaltung.

---

## 1. Datenbank-Setup

1. Im [Supabase-Dashboard](https://supabase.com/dashboard) das Projekt öffnen
   (URL `https://wqgdoyyejidcrdujhrfd.supabase.co`).
2. Links **SQL Editor → New query**.
3. Den kompletten Inhalt von `supabase/setup.sql` einfügen und **Run** klicken.

Damit entstehen die Tabellen `profiles`, `projects` und `project_backups`, alle
Sicherheits-Policies und die Trigger (neue Nutzer mit 30 Tagen Zugang; automatische
Sicherung vor jedem Überschreiben/Löschen).

> **Bestehende Installation aktualisieren:** Das Skript ist wiederholbar. Einfach
> die komplette `setup.sql` erneut ausführen – vorhandene Daten bleiben erhalten,
> es kommen nur die Spalte `deleted_at`, die Tabelle `project_backups`, der
> Backup-Trigger und die angepassten Policies dazu.
>
> **Ab Version 1.18.0 (Projekte freigeben):** `setup.sql` erneut ausführen. Neu sind
> die Tabelle `project_shares`, die Funktionen `share_permission` / `is_project_owner`,
> die Policies `projects_select_shared` / `projects_update_shared` und der Trigger
> `trg_projects_protect_owner`. Ohne dieses Update meldet der Freigabe-Dialog
> „relation project_shares does not exist".
>
> **Ab Version 1.20.0 (zentrale Geräteverwaltung):** `setup.sql` erneut ausführen.
> Neu ist die Tabelle `device_library_state` – sie speichert die im neuen Tool
> `geraete-admin.html` gepflegte Gerätebibliothek, die alle Nutzer automatisch
> laden. Nur Admins dürfen sie direkt ändern (lesbar für alle aktiven Nutzer).
>
> **Ab Version 1.20.1:** `setup.sql` erneut ausführen. Neu ist die Funktion
> `submit_device_to_library` – darüber trägt JEDER aktive Nutzer automatisch
> im Hintergrund neu angelegte Geräte zur zentralen Bibliothek bei (rein
> additiv, keine Schreibrechte auf die Tabelle nötig). So wächst der
> Gerätepool von selbst mit der Nutzung.

## 2. E-Mail-Bestätigung & Weiterleitung

Unter **Authentication → Sign In / Providers → Email**:
- **Confirm email** muss **aktiviert** sein (Standard). So ist ein Konto erst nach
  Klick auf den Bestätigungslink nutzbar.

Unter **Authentication → URL Configuration**:
- **Site URL** auf die Adresse setzen, unter der das Tool erreichbar ist
  (z. B. `https://deine-domain.tld/` oder die GitHub-Pages-/Hosting-URL).
- Bei mehreren Adressen die jeweiligen URLs zusätzlich unter **Redirect URLs**
  eintragen. Die Bestätigungs- und Passwort-Reset-Links führen dorthin zurück.

> Ohne korrekte Site URL landet der Bestätigungslink auf `localhost` und funktioniert
> für echte Nutzer nicht.

### Text für die Bestätigungs-E-Mail

Unter **Authentication → Email Templates → Confirm signup** kann der Text der
Bestätigungs-Mail angepasst werden. Vorschlag:

**Betreff:**
```
Bitte bestätige deine kostenlose Registrierung – Blockschaltbild Editor
```

**Inhalt (HTML):**
```html
<h2>Willkommen beim Blockschaltbild Editor!</h2>
<p>Schön, dass du dabei bist. Bitte bestätige deine E-Mail-Adresse mit einem Klick
auf den folgenden Button – danach kannst du deinen kostenlosen Zugang sofort nutzen:</p>
<p><a href="{{ .ConfirmationURL }}"
   style="display:inline-block;padding:12px 24px;background:#4d49bc;color:#fff;
   text-decoration:none;border-radius:8px;font-weight:bold;">
   E-Mail bestätigen &amp; kostenlos loslegen
</a></p>
<p>Dein Zugang ist komplett kostenlos und beginnt mit deiner Bestätigung. Falls du
dich nicht selbst registriert hast, kannst du diese E-Mail einfach ignorieren.</p>
<p>Viele Grüße<br>Dein Blockschaltbild-Editor-Team</p>
```

> Der Platzhalter `{{ .ConfirmationURL }}` wird von Supabase automatisch durch den
> gültigen Bestätigungslink ersetzt.

### Text für die Passwort-Reset-E-Mail

Unter **Authentication → Email Templates → Reset Password** (in neueren Versionen:
**Authentication → Emails/Templates → Reset Password**) kann folgender Text
eingetragen werden:

**Betreff:**
```
Passwort zurücksetzen – Blockschaltbild Editor
```

**Inhalt (HTML):**
```html
<h2>Passwort zurücksetzen</h2>
<p>Du hast angefragt, dein Passwort für deinen kostenlosen Zugang zum
Blockschaltbild Editor zurückzusetzen. Klicke dazu einfach auf den folgenden
Button:</p>
<p><a href="{{ .ConfirmationURL }}"
   style="display:inline-block;padding:12px 24px;background:#4d49bc;color:#fff;
   text-decoration:none;border-radius:8px;font-weight:bold;">
   Neues Passwort vergeben
</a></p>
<p>Der Link ist aus Sicherheitsgründen nur kurze Zeit gültig. Falls du diese
Anfrage nicht selbst gestellt hast, kannst du diese E-Mail einfach ignorieren –
dein Passwort bleibt unverändert und dein kostenloser Zugang bleibt bestehen.</p>
<p>Viele Grüße<br>Dein Blockschaltbild-Editor-Team</p>
```

> Auch hier ersetzt Supabase `{{ .ConfirmationURL }}` automatisch durch den
> gültigen Reset-Link.

## 2b. E-Mail-Versand über Resend (Custom SMTP)

Der eingebaute Supabase-Mailversand ist nur zum Testen gedacht und hat ein sehr
niedriges Stundenlimit (Fehler „email rate limit exceeded"). Für echten Betrieb
richten wir Resend als SMTP-Anbieter ein (kostenloser Tarif).

### Voraussetzung: eigene Domain
Resend kann Bestätigungs-Mails nur über eine **Domain versenden, deren DNS du
kontrollierst** (z. B. `deine-firma.de`). Eine `*.github.io`-Adresse reicht **nicht**,
weil man dort keine DNS-Einträge setzen kann. Ohne verifizierte Domain darf Resend
nur an die eigene Konto-Adresse senden (reiner Testmodus).

### Schritte
1. Bei [resend.com](https://resend.com) kostenlos registrieren.
2. **Domains → Add Domain** → deine Domain eintragen. Resend zeigt DNS-Einträge
   (SPF/DKIM, meist `MX`/`TXT`/`CNAME`). Diese im DNS deiner Domain hinterlegen und
   auf **Verified** warten.
3. **API Keys → Create API Key** (Berechtigung „Sending access"). Den Schlüssel
   (`re_…`) **nur** gleich in Supabase eintragen – niemals in Dateien, Code oder Chat.
4. Im Supabase-Dashboard: **Authentication → Emails → SMTP Settings → Enable Custom SMTP**
   und eintragen:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** der Resend-API-Key (`re_…`)
   - **Sender email:** eine Adresse deiner verifizierten Domain, z. B. `no-reply@deine-firma.de`
   - **Sender name:** z. B. `Blockschaltbild Editor`
5. Speichern. Unter **Authentication → Rate Limits** darf „Emails per hour" jetzt
   höher gesetzt werden (der Resend-Free-Tarif erlaubt deutlich mehr als der Testversand).

Danach werden Bestätigungs- und Passwort-Reset-Mails über Resend verschickt.

## 3. Dich als Administrator freischalten

1. Im Tool ganz normal **registrieren** und die Bestätigungs-Mail anklicken.
2. Im **SQL Editor** einmalig ausführen (E-Mail anpassen):

   ```sql
   update public.profiles
      set role = 'admin', blocked = false, access_expires_at = now() + interval '100 years'
    where email = 'DEINE-ADMIN-EMAIL@example.com';
   ```

3. Im Tool neu anmelden – oben rechts erscheint das Konto-Menü mit dem Punkt
   **„Admin – Nutzerverwaltung …"**.

---

## Bedienung

- **Speichern (Datei → Speichern):** lädt die Datei wie gewohnt lokal herunter **und**
  sichert das Projekt in deiner Cloud. Rechts oben erscheint „☁ In Cloud gesichert".
  Der Cloud-Sync lässt sich im Konto-Menü über „Beim Speichern in Cloud sichern"
  abschalten.
- **Menü Datei:**
  - *☁ In Cloud speichern* – aktuelles Projekt manuell in der Cloud sichern.
  - *☁ Aus Cloud laden …* – gespeicherte Projekte öffnen oder in den Papierkorb verschieben.
    Geteilte Projekte anderer Nutzer erscheinen mit „Bearbeiten"/„Nur lesen" und Eigentümer.
  - *☁ Freigeben …* – aktuelles Cloud-Projekt per E-Mail-Adresse für andere Nutzer freigeben.
- **Konto-Menü (oben rechts):**
  - *Beim Speichern in Cloud sichern* – automatischen Cloud-Sync ein-/ausschalten.
  - *Admin – Nutzerverwaltung* und *Admin – Papierkorb & Sicherungen* – nur für Admins.
  - *Abmelden*.

> Erscheint die Meldung „column projects.deleted_at does not exist", wurde die
> aktuelle `supabase/setup.sql` noch nicht ausgeführt (siehe Abschnitt 1).
- **Admin-Bereich:** Nutzerliste mit Status und Projektanzahl. Pro Nutzer:
  „+30 Tage" (Zugang verlängern), „Sperren/Entsperren", „Zu Admin/Zu Nutzer",
  „Projekte löschen" (verschiebt in den Papierkorb).

## Projekte freigeben (Bearbeiten / Nur lesen)

- Nur der **Eigentümer** kann Freigaben erteilen, ändern oder entfernen (Dialog über
  „Datei → ☁ Freigeben …" oder Button „Freigeben" in der Cloud-Liste).
- Die Zuordnung läuft über die **Anmelde-E-Mail** des Eingeladenen (`auth.email()`).
  Die Person muss noch nicht registriert sein – sobald sie sich mit dieser Adresse
  anmeldet, sieht sie das Projekt unter „Aus Cloud laden …".
- **Bearbeiten:** Alle Beteiligten arbeiten am selben Cloud-Datensatz; wer zuletzt
  speichert, überschreibt (der alte Stand landet wie immer in `project_backups`).
  Bearbeiter können das Projekt nicht löschen, nicht weitergeben und den Eigentümer
  nicht ändern (Trigger `trg_projects_protect_owner`).
- **Nur lesen:** Das Tool öffnet das Projekt im Nur-Lesen-Modus (gelber Hinweisbalken):
  kein Speichern (lokal/Cloud/Autosave), kein Drucken/Export, keine Änderungen.
  Zusätzlich verweigert die Datenbank jedes `UPDATE` (Policy `projects_update_shared`
  verlangt `permission = 'edit'`).
- Das Tool verschickt **keine E-Mails selbst**. „✉ Einladen" öffnet lediglich das
  Mailprogramm des Eigentümers mit einem vorbereiteten Text und dem Link zum Tool.

## Live-Zusammenarbeit (Anwesenheit & Aktualisierung)

- Nutzt **Supabase Realtime** (Presence + Broadcast) über einen Kanal `project:<id>` pro
  geöffnetem Cloud-Projekt. Es ist **keine** zusätzliche Datenbank-Konfiguration nötig
  (keine Replikation der Tabelle `projects`), Realtime muss im Projekt nur aktiviert sein
  (Standard).
- Oben rechts zeigt „👥 …" an, wer das Projekt gerade offen hat und ob jemand ungespeicherte
  Änderungen hat. Nach jedem Cloud-Speichern erhalten alle anderen eine Nachricht und laden
  den neuen Stand automatisch (ohne eigene ungespeicherte Änderungen) oder sehen eine
  „Neu laden"-Leiste.
- Beim Speichern wird `updated_at` verglichen; hat jemand zwischenzeitlich gespeichert,
  erscheint eine Rückfrage, bevor überschrieben wird.

## Schutz vor versehentlichem Löschen

Nutzer können Projekte **nicht endgültig löschen** – die Datenbank erlaubt ihnen kein
`DELETE`. Es gibt zwei Sicherheitsnetze:

1. **Papierkorb (Soft-Delete):** „Löschen" in der Cloud-Liste setzt nur `deleted_at`.
   Das Projekt verschwindet aus der Liste des Nutzers, bleibt aber in der Datenbank.
2. **Automatische Sicherungen:** Ein Datenbank-Trigger schreibt vor jedem
   Überschreiben, jedem Verschieben in den Papierkorb und jedem endgültigen Löschen
   den alten Stand nach `project_backups` (die letzten 20 Stände je Projekt). So lässt
   sich auch ein versehentlich mit einem leeren Diagramm überschriebenes Projekt
   zurückholen. Sicherungen überleben sogar das endgültige Löschen des Projekts.

Wiederherstellung durch den Admin über **Konto-Menü → „Admin – Papierkorb & Sicherungen"**:
- Liste aller Projekte aller Nutzer (Filter nach E-Mail, Name, Projekt-Nr.).
- **Wiederherstellen** – holt ein Projekt aus dem Papierkorb; es erscheint sofort
  wieder beim Nutzer.
- **Versionen** – zeigt die gesicherten Stände; „Diesen Stand zurückspielen" ersetzt
  den aktuellen Inhalt (der jetzige Stand wird dabei selbst wieder gesichert).
- **Endgültig löschen** – nur für Projekte im Papierkorb; die Sicherungen bleiben.
- Einträge „endgültig gelöscht – nur Sicherung" lassen sich mit „Als Projekt
  wiederherstellen" für den ursprünglichen Nutzer neu anlegen, oder mit
  „Sicherungen löschen" final entfernen.

Nur Admins haben Zugriff auf `project_backups` und auf Projekte im Papierkorb
(serverseitig über RLS).

## Grenzen (bewusst)

- Ein Konto **endgültig** aus der Authentifizierung zu löschen, ist mit dem
  öffentlichen Client-Schlüssel nicht möglich. Nutze dafür im Dashboard
  **Authentication → Users → Delete user** (oder „Sperren" im Admin-Bereich, was
  den Zugang praktisch entzieht).
- Der in `supabase-config.js` hinterlegte Schlüssel ist der **publishable/anon key**
  und darf öffentlich sein. Der geheime `service_role`-Key gehört **niemals** ins
  Frontend.

## Kosten

Free-Tier von Supabase (u. a. 500 MB Datenbank). Ein gespeichertes Diagramm ist nur
wenige KB groß – das reicht für sehr viele Nutzer und Projekte. Einzige mögliche
spätere Ausgabe wäre eine eigene Domain (optional).
