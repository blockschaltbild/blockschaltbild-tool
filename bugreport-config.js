// Konfiguration der Fehlermeldung ("Fehler melden"-Button unten in der Seitenleiste).
//
// endpoint: URL des Vermittlers (Cloudflare Worker, siehe bug-reports/relay/README.md).
//           Der Vermittler legt die Meldung im GitHub-Repository unter bug-reports/ ab
//           und öffnet ein Issue. Solange die URL leer ist, wird die Meldung als Datei
//           heruntergeladen und ein E-Mail-Entwurf geöffnet (Fallback).
// fallbackEmail: Empfänger für den Fallback per E-Mail.
// maxTotalBytes: Obergrenze für alle Anhänge zusammen.
const BUG_REPORT_CONFIG = {
    endpoint: 'https://blockschaltbild-bug-report.blockschaltbild.workers.dev',
    fallbackEmail: 'bugs@blockschaltbild.example',
    maxTotalBytes: 5 * 1024 * 1024
};
