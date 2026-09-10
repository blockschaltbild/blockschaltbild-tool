// Supabase-Zugang fuer den Blockschaltbild Editor.
//
// Beide Werte sind BEWUSST oeffentlich (Client-Schluessel). Die eigentliche
// Absicherung passiert serverseitig ueber Row Level Security (siehe
// supabase/setup.sql). Der geheime service_role-Key gehoert NICHT hierher.
const SUPABASE_CONFIG = {
    url: 'https://wqgdoyyejidcrdujhrfd.supabase.co',
    anonKey: 'sb_publishable_-IflXQU6Ot7hUUqLLXoEFA_svRZxmHk'
};
