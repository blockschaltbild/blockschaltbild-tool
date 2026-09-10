// ============================================================================
// Cloud-Anbindung fuer den Blockschaltbild Editor (Supabase)
// ----------------------------------------------------------------------------
// - E-Mail/Passwort-Login mit Selbstregistrierung und E-Mail-Bestaetigung
// - Neue Nutzer erhalten 30 Tage Zugang (serverseitig ueber profiles/RLS)
// - Projekte werden beim lokalen Speichern zusaetzlich in die Cloud gesichert
//   (sichtbarer Hinweis + abschaltbar; nichts passiert heimlich)
// - Admin-Bereich fuer den Betreiber: Nutzer verwalten, Zugang verlaengern,
//   sperren, Rolle setzen, Projektanzahl sehen
// ============================================================================
(function () {
    'use strict';

    if (typeof SUPABASE_CONFIG === 'undefined' || !window.supabase) {
        console.error('Supabase ist nicht geladen oder nicht konfiguriert.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const SYNC_PREF_KEY = 'blockschaltbild.cloudSync.enabled';
    const PROJECT_ID_KEY = 'blockschaltbild.cloud.currentProjectId';

    const state = {
        user: null,
        profile: null,
        currentProjectId: localStorage.getItem(PROJECT_ID_KEY) || null,
        currentAccess: 'owner',          // 'owner' | 'edit' | 'view' – Rechte am aktuell geoeffneten Cloud-Projekt
        viewingProjectId: null,          // Projekt, das gerade nur lesend angezeigt wird
        loadedUpdatedAt: null,           // updated_at des Standes, der gerade im Editor liegt (Konflikterkennung)
        live: { channel: null, projectId: null, peers: [], pending: null, dirty: false }
    };

    // ---------------------------------------------------------------- Styles
    function injectStyles() {
        const css = `
        .auth-overlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#3e0d81,#4d49bc);font-family:'Montserrat',sans-serif;padding:20px;}
        .auth-overlay.active{display:flex;}
        .auth-card{background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.35);width:100%;max-width:400px;padding:28px;}
        .auth-card h2{margin:0 0 4px;color:#3e0d81;font-size:1.4rem;}
        .auth-card p.sub{margin:0 0 18px;color:#666;font-size:.9rem;}
        .auth-tabs{display:flex;gap:6px;margin-bottom:18px;}
        .auth-tabs button{flex:1;padding:9px;border:none;border-radius:8px;background:#eee;color:#555;font-weight:600;cursor:pointer;}
        .auth-tabs button.active{background:#4d49bc;color:#fff;}
        .auth-form label{display:block;font-size:.82rem;color:#444;margin:10px 0 4px;font-weight:600;}
        .auth-form input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ccc;border-radius:8px;font-size:.95rem;}
        .auth-form input:focus{outline:none;border-color:#4d49bc;}
        .auth-btn{width:100%;margin-top:18px;padding:11px;border:none;border-radius:8px;background:#4d49bc;color:#fff;
            font-weight:700;font-size:.98rem;cursor:pointer;}
        .auth-btn:disabled{opacity:.6;cursor:default;}
        .auth-link{background:none;border:none;color:#4d49bc;cursor:pointer;font-size:.82rem;margin-top:12px;padding:0;text-decoration:underline;}
        .auth-msg{margin-top:14px;padding:10px 12px;border-radius:8px;font-size:.85rem;display:none;}
        .auth-msg.show{display:block;}
        .auth-msg.error{background:#fdecea;color:#b3261e;}
        .auth-msg.info{background:#e8f0fe;color:#1a56b3;}
        .auth-msg.success{background:#e6f4ea;color:#1e7e34;}

        .account-widget{position:relative;display:flex;align-items:center;gap:8px;}
        .cloud-sync-toast{position:fixed;right:16px;bottom:16px;z-index:8000;max-width:70vw;background:#241a4a;color:#fff;
            border-radius:12px;padding:10px 14px;font-size:.82rem;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer;}
        .account-btn{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.35);
            color:#fff;border-radius:20px;padding:5px 12px;cursor:pointer;font-size:.82rem;max-width:230px;}
        .account-btn .acc-email{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;}
        .acc-badge{background:#f9d057;color:#3e0d81;border-radius:10px;padding:1px 8px;font-weight:700;font-size:.72rem;white-space:nowrap;}
        .acc-badge.warn{background:#ff997f;color:#3e0d81;}
        .acc-badge.admin{background:#2ecc71;color:#08341c;}
        .account-menu{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.25);
            min-width:220px;padding:8px;display:none;z-index:9001;}
        .account-menu.open{display:block;}
        .account-menu .acc-info{padding:8px 10px;border-bottom:1px solid #eee;color:#333;font-size:.8rem;margin-bottom:6px;}
        .account-menu .acc-info b{color:#3e0d81;}
        .account-menu button{display:block;width:100%;text-align:left;background:none;border:none;padding:9px 10px;border-radius:6px;
            cursor:pointer;color:#333;font-size:.88rem;}
        .account-menu button:hover{background:#f0eefc;}

        .cloud-list{max-height:50vh;overflow:auto;margin:10px 0;}
        .cloud-row{display:flex;align-items:center;gap:10px;padding:10px 6px;border-bottom:1px solid #eee;}
        .cloud-row.current{background:#f6f5fd;}
        .cloud-row .cl-main{flex:1 1 auto;min-width:0;}
        .cloud-row .cl-name{font-weight:600;color:#222;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .cloud-row .cl-number{font-size:.8rem;color:#3e0d81;font-weight:600;margin-top:2px;}
        .cloud-row .cl-meta{font-size:.76rem;color:#888;margin-top:2px;}
        .cloud-row .cl-actions{display:flex;gap:6px;flex:0 0 auto;}
        .cloud-row .cl-actions button,.cloud-row .cl-actions button.danger{width:auto;margin:0;padding:6px 12px;border-radius:6px;
            border:1px solid #ccc;background:#fff;color:#333;cursor:pointer;font-size:.8rem;font-weight:500;white-space:nowrap;}
        .cloud-row .cl-actions button:hover{background:#f0eefc;}
        .cloud-row .cl-actions button.danger{color:#b3261e;border-color:#f3b6b0;}
        .cloud-row .cl-actions button.danger:hover{background:#b3261e;color:#fff;}
        .cloud-row.trashed .cl-name{color:#888;text-decoration:line-through;}
        .cl-badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:.7rem;font-weight:700;margin-left:6px;vertical-align:middle;}
        .cl-badge.trash{background:#fdecea;color:#b3261e;}
        .cl-badge.orphan{background:#fff3e0;color:#9a5b00;}
        .restore-filter{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #ccc;border-radius:8px;font-size:.9rem;margin-bottom:6px;}
        .restore-filter:focus{outline:none;border-color:#4d49bc;}
        .cl-versions{margin:4px 0 8px 12px;padding-left:10px;border-left:2px solid #e5e2f5;}
        .cl-versions .cl-version{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:.8rem;color:#444;border-bottom:1px dashed #eee;}
        .cl-versions .cl-version:last-child{border-bottom:none;}
        .cl-versions .cl-version span{flex:1;}
        .cl-versions .cl-version button{width:auto;margin:0;padding:4px 10px;border-radius:6px;border:1px solid #ccc;background:#fff;color:#333;cursor:pointer;font-size:.76rem;white-space:nowrap;}
        .cl-versions .cl-version button:hover{background:#f0eefc;}
        .admin-table{width:100%;border-collapse:collapse;font-size:.82rem;}
        .admin-table th,.admin-table td{padding:7px 8px;border-bottom:1px solid #eee;text-align:left;}
        .admin-table th{color:#3e0d81;font-weight:700;}
        .admin-table .a-actions{display:flex;gap:6px;flex-wrap:wrap;}
        .admin-table button{padding:4px 8px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:.76rem;}
        .admin-table button.danger{color:#b3261e;border-color:#f3b6b0;}
        .admin-pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:.72rem;font-weight:700;}
        .admin-pill.ok{background:#e6f4ea;color:#1e7e34;}
        .admin-pill.exp{background:#fdecea;color:#b3261e;}
        .admin-pill.adm{background:#e8f0fe;color:#1a56b3;}
        .cl-share{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:10px;font-size:.7rem;font-weight:700;vertical-align:middle;}
        .cl-share.edit{background:#e6f4ea;color:#1e7e34;}
        .cl-share.view{background:#fff4d6;color:#8a6500;}
        .cl-share.owner{background:#e8f0fe;color:#1a56b3;}
        .share-form{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0 14px;}
        .share-form input[type=email]{flex:1 1 220px;min-width:0;padding:8px 10px;border:1px solid #ccc;border-radius:8px;font-size:.9rem;}
        .share-form select{padding:8px 10px;border:1px solid #ccc;border-radius:8px;font-size:.9rem;background:#fff;}
        .share-form button{padding:8px 14px;border-radius:8px;border:none;background:#4d49bc;color:#fff;font-weight:600;cursor:pointer;}
        .share-form button:disabled{opacity:.6;cursor:default;}
        .share-row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid #eee;font-size:.9rem;}
        .share-row .sh-email{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-weight:600;color:#222;}
        .share-row select{padding:5px 8px;border:1px solid #ccc;border-radius:6px;font-size:.82rem;background:#fff;}
        .share-row button{width:auto;margin:0;padding:5px 10px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:.8rem;}
        .share-row button.danger{color:#b3261e;border-color:#f3b6b0;}
        .share-row button.danger:hover{background:#b3261e;color:#fff;}
        .share-msg{margin-top:10px;padding:8px 12px;border-radius:8px;font-size:.85rem;display:none;}
        .share-msg.show{display:block;}
        .share-msg.error{background:#fdecea;color:#b3261e;}
        .share-msg.success{background:#e6f4ea;color:#1e7e34;}

        .live-presence{display:none;align-items:center;gap:6px;background:#eef2ff;border:1px solid #c7cdf5;
            color:#2b2a6b;border-radius:20px;padding:4px 10px;font-size:.78rem;white-space:nowrap;cursor:default;position:relative;}
        .live-presence.editing{background:#fff1ec;border-color:#f5c2b3;color:#7a2e1c;}
        .live-presence.show{display:flex;}
        .live-presence .lp-dot{width:8px;height:8px;border-radius:50%;background:#2ecc71;box-shadow:0 0 0 2px rgba(46,204,113,.35);}
        .live-presence.editing .lp-dot{background:#ff997f;box-shadow:0 0 0 2px rgba(255,153,127,.4);animation:lp-pulse 1.2s infinite;}
        @keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .live-presence .lp-list{display:none;position:absolute;right:0;top:calc(100% + 6px);background:#fff;color:#222;border-radius:10px;
            box-shadow:0 10px 30px rgba(0,0,0,.25);padding:8px 0;min-width:260px;z-index:7000;font-size:.82rem;}
        .live-presence:hover .lp-list{display:block;}
        .live-presence .lp-list div{padding:6px 14px;display:flex;justify-content:space-between;gap:12px;}
        .live-presence .lp-list .lp-state{color:#888;font-size:.75rem;}
        .live-presence .lp-list .lp-state.dirty{color:#b3261e;font-weight:600;}
        .live-update-bar{display:none;align-items:center;gap:10px;margin:10px 18px 0 18px;padding:8px 14px;background:#e8f0fe;border:1px solid #a9c4f5;
            border-radius:8px;color:#1a3f7a;font-size:.85rem;flex-shrink:0;}
        .live-update-bar.show{display:flex;}
        .live-update-bar .lu-text{flex:1 1 auto;}
        .live-update-bar button{padding:6px 12px;border-radius:6px;border:1px solid #4d49bc;background:#4d49bc;color:#fff;font-weight:600;cursor:pointer;font-size:.8rem;}
        .live-update-bar button.secondary{background:#fff;color:#4d49bc;}
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------------------------------------------------------------- DOM
    function buildDom() {
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.id = 'authOverlay';
        overlay.innerHTML = `
            <div class="auth-card">
                <h2>Blockschaltbild Editor</h2>
                <p class="sub" id="authSub">Bitte anmelden, um deine Projekte in der Cloud zu speichern.</p>
                <div class="auth-tabs">
                    <button type="button" id="tabLogin" class="active">Anmelden</button>
                    <button type="button" id="tabRegister">Kostenlos registrieren</button>
                </div>
                <form class="auth-form" id="authForm">
                    <label for="authEmail">E-Mail</label>
                    <input type="email" id="authEmail" autocomplete="email" required>
                    <label for="authPassword">Passwort</label>
                    <input type="password" id="authPassword" autocomplete="current-password" minlength="6" required>
                    <button type="submit" class="auth-btn" id="authSubmit">Anmelden</button>
                </form>
                <button type="button" class="auth-link" id="authForgot">Passwort vergessen?</button>
                <div class="auth-msg" id="authMsg"></div>
            </div>`;
        document.body.appendChild(overlay);

        // Status-Hinweis als fester Toast unten rechts (außerhalb der Toolbar,
        // damit sich die Menüleiste nie umbricht, wenn der Text erscheint)
        const toast = document.createElement('div');
        toast.className = 'cloud-sync-toast';
        toast.id = 'cloudSyncToast';
        toast.style.display = 'none';
        toast.title = 'Klicken zum Ausblenden';
        toast.innerHTML = '<span id="cloudSyncStatus"></span>';
        toast.onclick = () => { toast.style.display = 'none'; };
        document.body.appendChild(toast);

        // Konto-Widget in die rechte Toolbar-Gruppe (neben der Zoom-Steuerung,
        // damit beide als Einheit am rechten Rand bleiben)
        const toolbarRight = document.querySelector('.toolbar-right') || document.querySelector('.toolbar');
        const widget = document.createElement('div');
        widget.className = 'account-widget';
        widget.id = 'accountWidget';
        widget.style.display = 'none';
        widget.innerHTML = `
            <button type="button" class="account-btn" id="accountBtn">
                <span>☁</span><span class="acc-email" id="accEmail"></span><span class="acc-badge" id="accBadge"></span>
            </button>
            <div class="account-menu" id="accountMenu">
                <div class="acc-info" id="accInfo"></div>
                <label style="display:flex;align-items:center;gap:8px;padding:9px 10px;font-size:.85rem;color:#333;cursor:pointer;">
                    <input type="checkbox" id="chkCloudSync"> Beim Speichern in Cloud sichern
                </label>
                                <button type="button" id="menuAdmin" style="display:none;">Admin – Nutzerverwaltung …</button>
                <button type="button" id="menuRestore" style="display:none;">Admin – Papierkorb &amp; Sicherungen …</button>
                <button type="button" id="menuLogout" style="color:#b3261e;">Abmelden</button>
            </div>`;
        // Anzeige, wer das geoeffnete Cloud-Projekt gerade ebenfalls offen hat
        const presence = document.createElement('div');
        presence.className = 'live-presence';
        presence.id = 'livePresence';
        presence.innerHTML = '<span class="lp-dot"></span><span id="livePresenceText"></span><div class="lp-list" id="livePresenceList"></div>';
        if (toolbarRight) { toolbarRight.appendChild(presence); toolbarRight.appendChild(widget); }

        // Hinweisleiste: ein anderer Nutzer hat eine neue Version gespeichert
        const updateBar = document.createElement('div');
        updateBar.className = 'live-update-bar';
        updateBar.id = 'liveUpdateBar';
        updateBar.innerHTML = `
            <span>🔄</span><span class="lu-text" id="liveUpdateText"></span>
            <button type="button" id="btnLiveReload">Neu laden</button>
            <button type="button" class="secondary" id="btnLiveIgnore">Ignorieren</button>`;
        const canvasContainer = document.querySelector('.canvas-container');
        const sheetTabs = document.getElementById('sheetTabs');
        if (canvasContainer && sheetTabs) canvasContainer.insertBefore(updateBar, sheetTabs);
        else document.body.appendChild(updateBar);

        // Cloud-Projekte Modal
        const cloudModal = document.createElement('div');
        cloudModal.className = 'modal';
        cloudModal.id = 'cloudProjectsModal';
        cloudModal.innerHTML = `
            <div class="modal-content modal-large">
                <h2>Meine Cloud-Projekte</h2>
                <p class="hint" id="cloudProjectsHint">Projekte werden beim Speichern automatisch hier gesichert. „Löschen" verschiebt in den Papierkorb – ein Administrator kann Projekte und ältere Stände wiederherstellen.</p>
                <div class="cloud-list" id="cloudProjectsList"></div>
                <div class="modal-buttons">
                    <button type="button" id="btnCloseCloudProjects">Schließen</button>
                </div>
            </div>`;
        document.body.appendChild(cloudModal);

        // Freigabe-Modal (Projekt mit anderen Nutzern teilen)
        const shareModal = document.createElement('div');
        shareModal.className = 'modal';
        shareModal.id = 'shareModal';
        shareModal.innerHTML = `
            <div class="modal-content">
                <h2>Projekt freigeben</h2>
                <p class="hint" id="shareProjectTitle"></p>
                <p class="hint">Gib die E-Mail-Adresse ein, mit der sich die Person im Blockschaltbild Editor anmeldet (oder anmelden wird). <b>Bearbeiten</b>: darf das Projekt ändern und in der Cloud speichern. <b>Nur lesen</b>: darf das Projekt nur ansehen – kein Speichern, Drucken oder Ändern.</p>
                <form class="share-form" id="shareForm">
                    <input type="email" id="shareEmail" placeholder="name@firma.de" autocomplete="off" required>
                    <select id="sharePermission">
                        <option value="edit">Bearbeiten</option>
                        <option value="view">Nur lesen</option>
                    </select>
                    <button type="submit" id="btnShareAdd">Freigeben</button>
                </form>
                <div class="cloud-list" id="shareList"></div>
                <div class="share-msg" id="shareMsg"></div>
                <div class="modal-buttons">
                    <button type="button" id="btnCloseShare">Schließen</button>
                </div>
            </div>`;
        document.body.appendChild(shareModal);

        // Admin Modal
        const adminModal = document.createElement('div');
        adminModal.className = 'modal';
        adminModal.id = 'adminModal';
        adminModal.innerHTML = `
            <div class="modal-content modal-large">
                <h2>Nutzerverwaltung</h2>
                <p class="hint">Zugang verlängern, sperren, Rolle ändern. „Konto endgültig löschen" ist nur im Supabase-Dashboard möglich.</p>
                <div class="cloud-list"><table class="admin-table"><thead>
                    <tr><th>E-Mail</th><th>Status</th><th>Zugang bis</th><th>Projekte</th><th>Aktionen</th></tr>
                </thead><tbody id="adminTableBody"></tbody></table></div>
                <div class="modal-buttons">
                    <button type="button" id="btnReloadAdmin">Aktualisieren</button>
                    <button type="button" id="btnCloseAdmin">Schließen</button>
                </div>
            </div>`;
        document.body.appendChild(adminModal);

        // Admin: Papierkorb & Sicherungen
        const restoreModal = document.createElement('div');
        restoreModal.className = 'modal';
        restoreModal.id = 'restoreModal';
        restoreModal.innerHTML = `
            <div class="modal-content modal-large">
                <h2>Papierkorb &amp; Sicherungen</h2>
                <p class="hint">Alle Projekte aller Nutzer. Vor jedem Überschreiben oder Löschen wird der alte Stand automatisch gesichert (max. 20 je Projekt). Wiederhergestellte Projekte erscheinen sofort wieder in der Liste des Nutzers.</p>
                <input type="text" id="restoreFilter" class="restore-filter" placeholder="Filtern nach E-Mail, Projektname oder Projekt-Nr. …">
                <div class="cloud-list" id="restoreList"></div>
                <div class="modal-buttons">
                    <button type="button" id="btnReloadRestore">Aktualisieren</button>
                    <button type="button" id="btnCloseRestore">Schließen</button>
                </div>
            </div>`;
        document.body.appendChild(restoreModal);
    }

    // ---------------------------------------------------------------- Helpers
    const $ = (id) => document.getElementById(id);

    function showMsg(kind, text) {
        const el = $('authMsg');
        el.className = 'auth-msg show ' + kind;
        el.textContent = text;
    }
    function clearMsg() {
        const el = $('authMsg');
        el.className = 'auth-msg';
        el.textContent = '';
    }

    let authMode = 'login';
    function setMode(mode) {
        authMode = mode;
        $('tabLogin').classList.toggle('active', mode === 'login');
        $('tabRegister').classList.toggle('active', mode === 'register');
        $('authSubmit').textContent = mode === 'login' ? 'Anmelden' : 'Kostenlos registrieren';
        $('authPassword').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
        clearMsg();
    }

    function daysLeft(profile) {
        if (!profile || !profile.access_expires_at) return null;
        const ms = new Date(profile.access_expires_at).getTime() - Date.now();
        return Math.ceil(ms / (1000 * 60 * 60 * 24));
    }

    function isActive(profile) {
        if (!profile) return false;
        if (profile.blocked) return false;
        if (profile.role === 'admin') return true;
        return new Date(profile.access_expires_at).getTime() > Date.now();
    }

    function setCurrentProjectId(id, access) {
        state.currentProjectId = id;
        state.currentAccess = id ? (access || 'owner') : 'owner';
        state.viewingProjectId = null;
        if (id) localStorage.setItem(PROJECT_ID_KEY, id);
        else { localStorage.removeItem(PROJECT_ID_KEY); state.loadedUpdatedAt = null; leaveLive(); }
    }

    function isValidEmail(s) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }

    // ---------------------------------------------------------------- Auth flow
    async function loadProfile() {
        if (!state.user) return null;
        const { data, error } = await client
            .from('profiles')
            .select('id,email,role,blocked,access_expires_at')
            .eq('id', state.user.id)
            .maybeSingle();
        if (error) { console.warn('Profil konnte nicht geladen werden:', error.message); return null; }
        state.profile = data;
        return data;
    }

    function showOverlay(subText) {
        $('accountWidget').style.display = 'none';
        const ov = $('authOverlay');
        ov.classList.add('active');
        if (subText) $('authSub').textContent = subText;
    }
    function hideOverlay() {
        $('authOverlay').classList.remove('active');
    }

    async function refreshGate() {
        const { data: { session } } = await client.auth.getSession();
        state.user = session ? session.user : null;

        if (!state.user) {
            state.profile = null;
            leaveLive();
            showOverlay('Bitte anmelden, um deine Projekte in der Cloud zu speichern.');
            return;
        }
        await loadProfile();

        if (!isActive(state.profile)) {
            let reason = 'Dein Zugang ist nicht aktiv.';
            if (state.profile && state.profile.blocked) reason = 'Dein Konto wurde gesperrt. Bitte wende dich an den Administrator.';
            else if (state.profile) reason = 'Dein 30-Tage-Zugang ist abgelaufen. Bitte wende dich an den Administrator, um ihn zu verlängern.';
            showOverlay(reason);
            showMsg('error', reason);
            $('authForm').style.display = 'none';
            $('authForgot').style.display = 'none';
            document.querySelector('.auth-tabs').style.display = 'none';
            const card = $('authOverlay').querySelector('.auth-card');
            if (!$('gateLogout')) {
                const b = document.createElement('button');
                b.id = 'gateLogout'; b.className = 'auth-btn'; b.textContent = 'Abmelden';
                b.onclick = () => client.auth.signOut();
                card.appendChild(b);
            }
            return;
        }

        // aktiv -> App freigeben
        hideOverlay();
        renderAccount();
        hookEditorDirty();
        if (state.currentProjectId && state.currentAccess !== 'view') joinLive(state.currentProjectId);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        clearMsg();
        const email = $('authEmail').value.trim();
        const password = $('authPassword').value;
        $('authSubmit').disabled = true;
        try {
            if (authMode === 'register') {
                const { error } = await client.auth.signUp({
                    email, password,
                    options: { emailRedirectTo: window.location.origin + window.location.pathname }
                });
                if (error) throw error;
                showMsg('success', 'Fast geschafft! Wir haben dir eine Bestätigungs-Mail geschickt. Bitte bestätige deine E-Mail-Adresse und melde dich anschließend an.');
            } else {
                const { error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err) {
            let m = err.message || String(err);
            if (/email not confirmed/i.test(m)) m = 'Bitte bestätige zuerst deine E-Mail-Adresse (Link in der Bestätigungs-Mail).';
            else if (/invalid login credentials/i.test(m)) m = 'E-Mail oder Passwort ist falsch.';
            else if (/already registered/i.test(m)) m = 'Diese E-Mail ist bereits registriert. Bitte melde dich an.';
            showMsg('error', m);
        } finally {
            $('authSubmit').disabled = false;
        }
    }

    async function handleForgot() {
        const email = $('authEmail').value.trim();
        if (!email) { showMsg('info', 'Bitte zuerst deine E-Mail-Adresse eingeben, dann auf „Passwort vergessen?" klicken.'); return; }
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });
        if (error) showMsg('error', error.message);
        else showMsg('success', 'Falls die Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts verschickt.');
    }

    // ---------------------------------------------------------------- Account UI
    function renderAccount() {
        const w = $('accountWidget');
        w.style.display = 'flex';
        $('accEmail').textContent = state.profile ? state.profile.email : state.user.email;
        const badge = $('accBadge');
        const admin = state.profile && state.profile.role === 'admin';
        if (admin) {
            badge.textContent = 'Admin'; badge.className = 'acc-badge admin';
        } else {
            const d = daysLeft(state.profile);
            badge.textContent = d != null ? `${d} Tage` : '';
            badge.className = 'acc-badge' + (d != null && d <= 5 ? ' warn' : '');
        }
        const info = $('accInfo');
        if (admin) info.innerHTML = `Angemeldet als <b>${state.user.email}</b><br>Rolle: Administrator`;
        else info.innerHTML = `Angemeldet als <b>${state.user.email}</b><br>Zugang noch <b>${daysLeft(state.profile)} Tage</b>`;
        $('menuAdmin').style.display = admin ? 'block' : 'none';
        $('menuRestore').style.display = admin ? 'block' : 'none';
        $('chkCloudSync').checked = getSyncEnabled();
    }

    function getSyncEnabled() {
        const v = localStorage.getItem(SYNC_PREF_KEY);
        return v === null ? true : v === '1';
    }
    function setSyncEnabled(on) {
        localStorage.setItem(SYNC_PREF_KEY, on ? '1' : '0');
    }

    let cloudStatusTimer = null;
    function setCloudStatus(text) {
        const el = $('cloudSyncStatus');
        const toast = $('cloudSyncToast');
        if (!el || !toast) return;
        el.textContent = text || '';
        const failed = !!text && text.indexOf('⚠') === 0;
        toast.style.display = text ? 'block' : 'none';
        if (cloudStatusTimer) { clearTimeout(cloudStatusTimer); cloudStatusTimer = null; }
        if (text && !failed) cloudStatusTimer = setTimeout(() => { toast.style.display = 'none'; }, 6000);
    }

    // ---------------------------------------------------------------- Cloud sync
    async function saveCurrentToCloud(opts) {
        opts = opts || {};
        if (!state.user || !isActive(state.profile)) { if (opts.manual) alert('Bitte zuerst anmelden, um in der Cloud zu speichern.'); return; }
        const editor = window.editor;
        if (!editor || typeof editor.serializeDiagram !== 'function') return;
        if (editor.readOnly || state.currentAccess === 'view') {
            if (opts.manual) alert('Dieses Projekt wurde dir nur zum Lesen freigegeben und kann nicht gespeichert werden.');
            return;
        }
        const data = editor.serializeDiagram();
        const name = editor.projectName || 'Unbenannt';
        const projectNumber = editor.projectNumber || '';
        setCloudStatus('☁ Speichere …');
        try {
            let result;
            if (state.currentProjectId) {
                // Konflikterkennung: hat jemand anderes seit dem Laden gespeichert?
                if (state.loadedUpdatedAt) {
                    const { data: cur } = await client.from('projects').select('updated_at').eq('id', state.currentProjectId).maybeSingle();
                    if (cur && cur.updated_at && cur.updated_at !== state.loadedUpdatedAt) {
                        const who = state.live.pending && state.live.pending.email ? state.live.pending.email : 'Ein anderer Nutzer';
                        const when = new Date(cur.updated_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                        const ok = confirm(`${who} hat dieses Projekt um ${when} in der Cloud gespeichert, nachdem du es geladen hast.\n\nWenn du fortfährst, überschreibst du diese Version mit deinem Stand (der alte Stand bleibt als Sicherung erhalten).\n\nTrotzdem speichern?`);
                        if (!ok) { setCloudStatus('☁ Cloud-Speichern abgebrochen'); return; }
                    }
                }
                // Kein user_id-Filter: auch mit „Bearbeiten" freigegebene Projekte anderer Nutzer
                // duerfen gespeichert werden (RLS prueft die Berechtigung serverseitig)
                result = await client.from('projects')
                    .update({ name, project_number: projectNumber, data })
                    .eq('id', state.currentProjectId)
                    .select('id,updated_at').maybeSingle();
                if (!result.error && !result.data) {
                    if (state.currentAccess === 'edit') {
                        throw new Error('Die Freigabe für dieses Projekt wurde entzogen oder das Projekt wurde gelöscht. Speichere es über „Datei → Speichern" als eigene Datei.');
                    }
                    // Datensatz existiert nicht mehr -> neu anlegen
                    setCurrentProjectId(null);
                }
            }
            if (!state.currentProjectId) {
                result = await client.from('projects')
                    .insert({ user_id: state.user.id, name, project_number: projectNumber, data })
                    .select('id,updated_at').single();
                if (!result.error && result.data) setCurrentProjectId(result.data.id);
            }
            if (result && result.error) throw result.error;
            if (result && result.data && result.data.updated_at) state.loadedUpdatedAt = result.data.updated_at;
            hideLiveUpdate();
            joinLive(state.currentProjectId);
            broadcastSaved();
            const t = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            setCloudStatus('☁ In Cloud gesichert ' + t);
        } catch (err) {
            console.warn('Cloud-Speichern fehlgeschlagen:', err);
            setCloudStatus('⚠ Cloud-Speichern fehlgeschlagen');
            if (opts.manual) alert('Cloud-Speichern fehlgeschlagen: ' + dbErr(err));
        }
    }

    // Verstaendliche Meldung, wenn die Datenbank noch nicht auf den aktuellen Stand gebracht wurde
    function dbErr(error) {
        const m = (error && error.message) || String(error);
        if (/deleted_at|project_backups|does not exist/i.test(m)) {
            return m + '\n\nDie Datenbank ist noch nicht aktuell: Bitte im Supabase-Dashboard unter „SQL Editor" die komplette Datei supabase/setup.sql erneut ausführen (siehe SUPABASE_SETUP.md).';
        }
        return m;
    }

    async function openCloudProjects() {
        const list = $('cloudProjectsList');
        list.innerHTML = '<p class="hint">Lade …</p>';
        $('cloudProjectsModal').classList.add('active');
        const [{ data, error }, { data: shares }] = await Promise.all([
            client.from('projects')
                .select('id,name,project_number,updated_at,user_id')
                .is('deleted_at', null)
                .order('updated_at', { ascending: false }),
            client.from('project_shares').select('project_id,email,permission,owner_email')
        ]);
        if (error) { list.innerHTML = `<p class="hint">Fehler: ${escapeHtml(dbErr(error)).replace(/\n/g, '<br>')}</p>`; return; }
        if (!data || !data.length) { list.innerHTML = '<p class="hint">Noch keine Projekte in der Cloud.</p>'; return; }
        const myEmail = (state.user.email || '').toLowerCase();
        const sharedWithMe = {};   // project_id -> Freigabe an mich
        const sharedByMe = {};     // project_id -> Anzahl Freigaben, die ich erteilt habe
        (shares || []).forEach(s => {
            if ((s.email || '').toLowerCase() === myEmail) sharedWithMe[s.project_id] = s;
            else sharedByMe[s.project_id] = (sharedByMe[s.project_id] || 0) + 1;
        });
        const openId = state.currentProjectId || state.viewingProjectId;
        list.innerHTML = '';
        data.forEach(p => {
            const own = p.user_id === state.user.id;
            const share = own ? null : sharedWithMe[p.id];
            const perm = own ? 'owner' : (share ? share.permission : 'view');
            const row = document.createElement('div');
            row.className = 'cloud-row' + (p.id === openId ? ' current' : '');
            const when = p.updated_at
                ? new Date(p.updated_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'unbekannt';
            let badge = '';
            if (!own) badge = perm === 'edit' ? '<span class="cl-share edit">Bearbeiten</span>' : '<span class="cl-share view">Nur lesen</span>';
            else if (sharedByMe[p.id]) badge = `<span class="cl-share owner">Geteilt mit ${sharedByMe[p.id]}</span>`;
            const from = !own && share && share.owner_email ? ` · freigegeben von ${escapeHtml(share.owner_email)}` : (!own ? ' · freigegeben' : '');
            row.innerHTML = `
                <div class="cl-main">
                    <div class="cl-name">${escapeHtml(p.name || 'Unbenannt')}${badge}</div>
                    <div class="cl-number">${p.project_number ? 'Projekt-Nr. ' + escapeHtml(p.project_number) : 'Keine Projekt-Nr.'}</div>
                    <div class="cl-meta">Gespeichert: ${when}${from}${p.id === openId ? ' · aktuell geöffnet' : ''}</div>
                </div>
                <div class="cl-actions">
                    <button type="button" data-open="${p.id}" data-perm="${perm}" data-owner="${escapeHtml(share && share.owner_email ? share.owner_email : '')}">Öffnen</button>
                    ${own ? `<button type="button" data-share="${p.id}" data-name="${escapeHtml(p.name || 'Unbenannt')}">Freigeben</button>` : ''}
                    ${own ? `<button type="button" class="danger" data-del="${p.id}">Löschen</button>` : ''}
                </div>`;
            list.appendChild(row);
        });
        list.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openProject(b.getAttribute('data-open'), b.getAttribute('data-perm'), b.getAttribute('data-owner')));
        list.querySelectorAll('[data-share]').forEach(b => b.onclick = () => openShare(b.getAttribute('data-share'), b.getAttribute('data-name')));
        list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteProject(b.getAttribute('data-del')));
    }

    async function openProject(id, perm, ownerEmail) {
        const { data, error } = await client.from('projects').select('id,data,user_id,updated_at').eq('id', id).single();
        if (error) { alert('Konnte Projekt nicht laden: ' + error.message); return; }
        try {
            if (window.editor && typeof window.editor.applyDiagramData === 'function') {
                if (window.editor.isDirty && !confirm('Ungespeicherte Änderungen gehen verloren. Cloud-Projekt trotzdem öffnen?')) return;
                const access = data.user_id === state.user.id ? 'owner' : (perm === 'edit' ? 'edit' : 'view');
                if (window.editor.readOnly) window.editor.setReadOnly(false);
                if (typeof window.editor.recordHistory === 'function') window.editor.recordHistory();
                await window.editor.applyDiagramData(data.data);
                if (access === 'view') {
                    // Kein Cloud-Projekt „im Zugriff" – nichts, wohin gespeichert werden koennte
                    setCurrentProjectId(null);
                    state.currentAccess = 'view';
                    state.viewingProjectId = id;
                    window.editor.setReadOnly(true, { ownerEmail: ownerEmail || '' });
                } else {
                    setCurrentProjectId(id, access);
                }
                state.loadedUpdatedAt = data.updated_at || null;
                hideLiveUpdate();
                joinLive(id);
                $('cloudProjectsModal').classList.remove('active');
                setCloudStatus(access === 'view' ? '☁ Nur lesen – aus Cloud geladen' : (access === 'edit' ? '☁ Geteiltes Projekt geladen (Bearbeiten)' : '☁ Aus Cloud geladen'));
            }
        } catch (err) {
            alert('Fehler beim Öffnen: ' + (err.message || err));
        }
    }

    // ---------------------------------------------------------------- Live (Presence + Aktualisierung)
    // Supabase Realtime: pro Cloud-Projekt ein Kanal. Presence zeigt, wer das Projekt offen hat
    // (und ob er ungespeicherte Aenderungen hat). Nach jedem Cloud-Speichern wird ein
    // Broadcast gesendet; die anderen laden den neuen Stand automatisch, sofern sie selbst
    // keine ungespeicherten Aenderungen haben – sonst erscheint eine Leiste mit „Neu laden".
    function fmtTime(iso) {
        return new Date(iso || Date.now()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    function presencePayload() {
        return {
            email: state.user ? state.user.email : '',
            access: state.currentAccess,
            dirty: !!(window.editor && window.editor.isDirty && !window.editor.readOnly),
            since: new Date().toISOString()
        };
    }

    function joinLive(projectId) {
        if (!projectId || !state.user) return;
        if (state.live.projectId === projectId && state.live.channel) return;
        leaveLive();
        const channel = client.channel('project:' + projectId, {
            config: { presence: { key: state.user.id }, broadcast: { self: false } }
        });
        channel
            .on('presence', { event: 'sync' }, () => {
                const all = channel.presenceState();
                const peers = [];
                Object.keys(all).forEach(key => {
                    if (key === state.user.id) return;
                    const p = all[key][all[key].length - 1];
                    if (p) peers.push(p);
                });
                state.live.peers = peers;
                renderPresence();
            })
            .on('broadcast', { event: 'saved' }, ({ payload }) => onRemoteSaved(payload || {}))
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') channel.track(presencePayload());
            });
        state.live.channel = channel;
        state.live.projectId = projectId;
    }

    function leaveLive() {
        if (state.live.channel) {
            try { client.removeChannel(state.live.channel); } catch (e) { /* ignore */ }
        }
        state.live.channel = null;
        state.live.projectId = null;
        state.live.peers = [];
        state.live.pending = null;
        renderPresence();
        hideLiveUpdate();
    }

    let presenceTrackTimer = null;
    function updatePresence() {
        if (!state.live.channel) return;
        if (presenceTrackTimer) clearTimeout(presenceTrackTimer);
        presenceTrackTimer = setTimeout(() => {
            presenceTrackTimer = null;
            if (state.live.channel) state.live.channel.track(presencePayload());
        }, 400);
    }

    function renderPresence() {
        const box = $('livePresence');
        if (!box) return;
        const peers = state.live.peers;
        if (!state.live.projectId || !peers.length) { box.classList.remove('show', 'editing'); return; }
        const editing = peers.filter(p => p.dirty);
        const label = peers.length === 1
            ? (editing.length ? `${peers[0].email} bearbeitet gerade` : `${peers[0].email} hat das Projekt offen`)
            : (editing.length ? `${peers.length} Nutzer online · ${editing.length} bearbeite${editing.length === 1 ? 't' : 'n'}` : `${peers.length} Nutzer haben das Projekt offen`);
        $('livePresenceText').textContent = '👥 ' + label;
        $('livePresenceList').innerHTML = peers.map(p => {
            const acc = p.access === 'view' ? 'Nur lesen' : (p.access === 'edit' ? 'Bearbeiten' : 'Eigentümer');
            const st = p.dirty ? '<span class="lp-state dirty">bearbeitet – ungespeichert</span>' : `<span class="lp-state">${acc} · seit ${fmtTime(p.since)}</span>`;
            return `<div><span>${escapeHtml(p.email || 'Unbekannt')}</span>${st}</div>`;
        }).join('');
        box.classList.add('show');
        box.classList.toggle('editing', editing.length > 0);
        box.title = editing.length ? 'Achtung: Jemand bearbeitet dieses Projekt gerade – beim Speichern kann es zu Überschneidungen kommen.' : 'Weitere Nutzer haben dieses Projekt geöffnet';
    }

    function broadcastSaved() {
        if (!state.live.channel) return;
        state.live.channel.send({
            type: 'broadcast', event: 'saved',
            payload: { email: state.user.email, at: new Date().toISOString(), updated_at: state.loadedUpdatedAt }
        });
    }

    async function onRemoteSaved(payload) {
        if (!state.live.projectId) return;
        if (payload.updated_at && payload.updated_at === state.loadedUpdatedAt) return;
        state.live.pending = { email: payload.email || 'Ein anderer Nutzer', at: payload.at || new Date().toISOString(), updated_at: payload.updated_at || null };
        const editor = window.editor;
        const canAutoReload = editor && (!editor.isDirty || editor.readOnly) && !document.querySelector('.modal.active');
        if (canAutoReload) {
            await reloadFromCloud(true);
        } else {
            showLiveUpdate();
        }
    }

    function showLiveUpdate() {
        const bar = $('liveUpdateBar');
        const p = state.live.pending;
        if (!bar || !p) return;
        $('liveUpdateText').innerHTML = `<b>${escapeHtml(p.email)}</b> hat um ${fmtTime(p.at)} eine neue Version gespeichert. Du hast ungespeicherte Änderungen – „Neu laden" verwirft sie und zeigt den aktuellen Stand.`;
        bar.classList.add('show');
    }

    function hideLiveUpdate() {
        const bar = $('liveUpdateBar');
        if (bar) bar.classList.remove('show');
    }

    async function reloadFromCloud(silent) {
        const id = state.live.projectId || state.currentProjectId || state.viewingProjectId;
        if (!id || !window.editor) return;
        const { data, error } = await client.from('projects').select('id,data,updated_at').eq('id', id).maybeSingle();
        if (error || !data) {
            setCloudStatus('⚠ Aktualisierung fehlgeschlagen');
            if (!silent) alert('Neu laden fehlgeschlagen: ' + (error ? dbErr(error) : 'Projekt nicht gefunden.'));
            return;
        }
        const editor = window.editor;
        const wasReadOnly = editor.readOnly;
        const roInfo = editor.readOnlyInfo;
        const sheetIdx = editor.activeSheet;
        const zoom = editor.zoom;
        try {
            if (wasReadOnly) editor.setReadOnly(false);
            if (typeof editor.recordHistory === 'function') editor.recordHistory();
            const payload = Object.assign({}, data.data, { activeSheet: (typeof sheetIdx === 'number' && data.data && Array.isArray(data.data.sheets) && sheetIdx < data.data.sheets.length) ? sheetIdx : (data.data ? data.data.activeSheet : 0) });
            await editor.applyDiagramData(payload);
            if (typeof zoom === 'number' && typeof editor.setZoom === 'function') editor.setZoom(zoom);
            if (wasReadOnly) editor.setReadOnly(true, roInfo || {});
            state.loadedUpdatedAt = data.updated_at || null;
            const who = state.live.pending ? state.live.pending.email : 'anderem Nutzer';
            state.live.pending = null;
            hideLiveUpdate();
            updatePresence();
            setCloudStatus(`🔄 Aktualisiert – Änderungen von ${who} übernommen (${fmtTime()})`);
        } catch (err) {
            if (wasReadOnly) editor.setReadOnly(true, roInfo || {});
            setCloudStatus('⚠ Aktualisierung fehlgeschlagen');
            if (!silent) alert('Neu laden fehlgeschlagen: ' + (err.message || err));
        }
    }

    // Editor meldet Aenderungen am „ungespeichert"-Status -> Presence aktualisieren
    function hookEditorDirty() {
        const editor = window.editor;
        if (!editor || editor.__liveHooked) return;
        editor.__liveHooked = true;
        const orig = editor.updateSaveStatus;
        editor.updateSaveStatus = function () {
            const r = orig.apply(this, arguments);
            if (this.isDirty !== state.live.dirty) { state.live.dirty = this.isDirty; updatePresence(); }
            return r;
        };
    }

    // ---------------------------------------------------------------- Freigaben
    let shareProject = null;

    function showShareMsg(text, type) {
        const el = $('shareMsg');
        el.textContent = text;
        el.className = 'share-msg show ' + (type || 'success');
    }

    async function openShare(projectId, projectName) {
        if (!state.user || !isActive(state.profile)) { alert('Bitte zuerst anmelden.'); return; }
        shareProject = { id: projectId, name: projectName || 'Unbenannt' };
        $('shareProjectTitle').innerHTML = `Projekt: <b>${escapeHtml(shareProject.name)}</b>`;
        $('shareEmail').value = '';
        $('sharePermission').value = 'edit';
        $('shareMsg').className = 'share-msg';
        $('shareModal').classList.add('active');
        await renderShareList();
        $('shareEmail').focus();
    }

    async function openShareForCurrent() {
        if (!state.user || !isActive(state.profile)) { alert('Bitte zuerst anmelden, um Projekte freizugeben.'); return; }
        if (state.currentAccess === 'view' || (window.editor && window.editor.readOnly)) {
            alert('Dieses Projekt wurde dir nur zum Lesen freigegeben und kann nicht weitergegeben werden.');
            return;
        }
        if (state.currentAccess === 'edit') {
            alert('Nur der Eigentümer eines Projekts kann Freigaben erteilen.');
            return;
        }
        if (!state.currentProjectId) {
            if (!confirm('Das Projekt liegt noch nicht in der Cloud. Jetzt in der Cloud speichern und danach freigeben?')) return;
            await saveCurrentToCloud({ manual: true });
            if (!state.currentProjectId) return;
        }
        const name = window.editor && window.editor.projectName ? window.editor.projectName : 'Unbenannt';
        openShare(state.currentProjectId, name);
    }

    async function renderShareList() {
        const list = $('shareList');
        list.innerHTML = '<p class="hint">Lade ...</p>';
        const { data, error } = await client.from('project_shares')
            .select('id,email,permission,created_at')
            .eq('project_id', shareProject.id)
            .order('created_at', { ascending: true });
        if (error) { list.innerHTML = `<p class="hint">Fehler: ${escapeHtml(dbErr(error)).replace(/\n/g, '<br>')}</p>`; return; }
        if (!data || !data.length) { list.innerHTML = '<p class="hint">Noch keine Freigaben für dieses Projekt.</p>'; return; }
        list.innerHTML = '';
        data.forEach(s => {
            const row = document.createElement('div');
            row.className = 'share-row';
            const subject = encodeURIComponent(`Blockschaltbild „${shareProject.name}" wurde für dich freigegeben`);
            const body = encodeURIComponent(`Hallo,\n\nich habe das Blockschaltbild „${shareProject.name}" für dich freigegeben (${s.permission === 'edit' ? 'Bearbeiten' : 'Nur lesen'}).\n\nMelde dich im Blockschaltbild Editor mit dieser E-Mail-Adresse (${s.email}) an und öffne das Projekt über „Datei → Aus Cloud laden ...".\n\n${location.origin}${location.pathname}\n\nViele Grüße`);
            row.innerHTML = `
                <span class="sh-email" title="${escapeHtml(s.email)}">${escapeHtml(s.email)}</span>
                <select data-perm="${s.id}" title="Berechtigung ändern">
                    <option value="edit"${s.permission === 'edit' ? ' selected' : ''}>Bearbeiten</option>
                    <option value="view"${s.permission === 'view' ? ' selected' : ''}>Nur lesen</option>
                </select>
                <a href="mailto:${encodeURIComponent(s.email)}?subject=${subject}&body=${body}" title="Einladung mit deinem E-Mail-Programm senden"><button type="button">✉ Einladen</button></a>
                <button type="button" class="danger" data-rm="${s.id}" title="Freigabe entfernen">Entfernen</button>`;
            list.appendChild(row);
        });
        list.querySelectorAll('[data-perm]').forEach(sel => sel.onchange = () => updateShare(sel.getAttribute('data-perm'), sel.value));
        list.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => removeShare(b.getAttribute('data-rm')));
    }

    async function addShare(e) {
        e.preventDefault();
        if (!shareProject) return;
        const email = $('shareEmail').value.trim().toLowerCase();
        const permission = $('sharePermission').value === 'edit' ? 'edit' : 'view';
        if (!isValidEmail(email)) { showShareMsg('Bitte eine gültige E-Mail-Adresse eingeben.', 'error'); return; }
        if (email === (state.user.email || '').toLowerCase()) { showShareMsg('Das ist deine eigene E-Mail-Adresse – du bist bereits Eigentümer.', 'error'); return; }
        const btn = $('btnShareAdd');
        btn.disabled = true;
        try {
            const { error } = await client.from('project_shares')
                .upsert({ project_id: shareProject.id, owner_id: state.user.id, owner_email: state.user.email, email, permission }, { onConflict: 'project_id,email' });
            if (error) throw error;
            $('shareEmail').value = '';
            showShareMsg(`Freigabe für ${email} (${permission === 'edit' ? 'Bearbeiten' : 'Nur lesen'}) gespeichert. Über „✉ Einladen" kannst du die Person benachrichtigen.`, 'success');
            await renderShareList();
        } catch (err) {
            showShareMsg('Freigabe fehlgeschlagen: ' + dbErr(err), 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function updateShare(shareId, permission) {
        const { error } = await client.from('project_shares').update({ permission }).eq('id', shareId);
        if (error) { showShareMsg('Änderung fehlgeschlagen: ' + dbErr(error), 'error'); await renderShareList(); return; }
        showShareMsg(`Berechtigung geändert auf „${permission === 'edit' ? 'Bearbeiten' : 'Nur lesen'}".`, 'success');
    }

    async function removeShare(shareId) {
        if (!confirm('Diese Freigabe entfernen? Die Person hat dann keinen Zugriff mehr auf das Projekt.')) return;
        const { error } = await client.from('project_shares').delete().eq('id', shareId);
        if (error) { showShareMsg('Entfernen fehlgeschlagen: ' + dbErr(error), 'error'); return; }
        showShareMsg('Freigabe entfernt.', 'success');
        await renderShareList();
    }

    async function deleteProject(id) {
        if (!confirm('Dieses Cloud-Projekt in den Papierkorb verschieben?\n\nEs verschwindet aus deiner Liste. Ein Administrator kann es bei Bedarf wiederherstellen.')) return;
        const { data, error } = await client.from('projects')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id).is('deleted_at', null)
            .select('id').maybeSingle();
        if (error) { alert('Löschen fehlgeschlagen: ' + dbErr(error)); return; }
        if (!data) { alert('Projekt wurde nicht gefunden oder liegt bereits im Papierkorb.'); }
        if (state.currentProjectId === id) setCurrentProjectId(null);
        openCloudProjects();
    }

    // ---------------------------------------------------------------- Admin
    async function openAdmin() {
        $('adminModal').classList.add('active');
        const body = $('adminTableBody');
        body.innerHTML = '<tr><td colspan="5">Lade …</td></tr>';
        const [{ data: profiles, error: pErr }, { data: projs, error: prErr }] = await Promise.all([
            client.from('profiles').select('id,email,role,blocked,access_expires_at').order('created_at', { ascending: true }),
            client.from('projects').select('user_id').is('deleted_at', null)
        ]);
        if (pErr) { body.innerHTML = `<tr><td colspan="5">Fehler: ${pErr.message}</td></tr>`; return; }
        const counts = {};
        if (!prErr && projs) projs.forEach(p => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });
        body.innerHTML = '';
        (profiles || []).forEach(p => {
            const active = isActive(p);
            const admin = p.role === 'admin';
            const exp = p.access_expires_at ? new Date(p.access_expires_at).toLocaleDateString('de-DE') : '–';
            let statusPill;
            if (admin) statusPill = '<span class="admin-pill adm">Admin</span>';
            else if (p.blocked) statusPill = '<span class="admin-pill exp">Gesperrt</span>';
            else if (active) statusPill = '<span class="admin-pill ok">Aktiv</span>';
            else statusPill = '<span class="admin-pill exp">Abgelaufen</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(p.email || '')}</td>
                <td>${statusPill}</td>
                <td>${admin ? '∞' : exp}</td>
                <td>${counts[p.id] || 0}</td>
                <td><div class="a-actions">
                    <button data-ext="${p.id}">+30 Tage</button>
                    <button data-blk="${p.id}" data-cur="${p.blocked ? 1 : 0}">${p.blocked ? 'Entsperren' : 'Sperren'}</button>
                    <button data-role="${p.id}" data-cur="${p.role}">${admin ? 'Zu Nutzer' : 'Zu Admin'}</button>
                    <button class="danger" data-delp="${p.id}">Projekte löschen</button>
                </div></td>`;
            body.appendChild(tr);
        });
        body.querySelectorAll('[data-ext]').forEach(b => b.onclick = () => adminExtend(b.getAttribute('data-ext')));
        body.querySelectorAll('[data-blk]').forEach(b => b.onclick = () => adminBlock(b.getAttribute('data-blk'), b.getAttribute('data-cur') === '1'));
        body.querySelectorAll('[data-role]').forEach(b => b.onclick = () => adminRole(b.getAttribute('data-role'), b.getAttribute('data-cur')));
        body.querySelectorAll('[data-delp]').forEach(b => b.onclick = () => adminDeleteProjects(b.getAttribute('data-delp')));
    }

    async function adminExtend(id) {
        const { data: prof } = await client.from('profiles').select('access_expires_at').eq('id', id).single();
        const base = prof && new Date(prof.access_expires_at) > new Date() ? new Date(prof.access_expires_at) : new Date();
        base.setDate(base.getDate() + 30);
        const { error } = await client.from('profiles').update({ access_expires_at: base.toISOString(), blocked: false }).eq('id', id);
        if (error) alert('Fehler: ' + error.message); else openAdmin();
    }
    async function adminBlock(id, currentlyBlocked) {
        const { error } = await client.from('profiles').update({ blocked: !currentlyBlocked }).eq('id', id);
        if (error) alert('Fehler: ' + error.message); else openAdmin();
    }
    async function adminRole(id, currentRole) {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Rolle wirklich auf „${newRole}" setzen?`)) return;
        const { error } = await client.from('profiles').update({ role: newRole }).eq('id', id);
        if (error) alert('Fehler: ' + error.message); else openAdmin();
    }
    async function adminDeleteProjects(id) {
        if (!confirm('ALLE Cloud-Projekte dieses Nutzers in den Papierkorb verschieben?\n\nSie lassen sich unter „Papierkorb & Sicherungen" wiederherstellen oder endgültig löschen.')) return;
        const { error } = await client.from('projects')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', id).is('deleted_at', null);
        if (error) alert('Fehler: ' + error.message); else openAdmin();
    }

    // ---------------------------------------------------------------- Admin: Papierkorb & Sicherungen
    const restoreState = { projects: [], backups: [], emails: {}, expanded: {} };

    function fmtDate(iso) {
        return iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'unbekannt';
    }

    async function openRestore() {
        $('restoreModal').classList.add('active');
        $('restoreList').innerHTML = '<p class="hint">Lade …</p>';
        const [{ data: projects, error: e1 }, { data: backups, error: e2 }, { data: profiles }] = await Promise.all([
            client.from('projects').select('id,user_id,name,project_number,updated_at,deleted_at').order('updated_at', { ascending: false }),
            client.from('project_backups').select('id,project_id,user_id,name,project_number,reason,saved_at,created_at').order('created_at', { ascending: false }),
            client.from('profiles').select('id,email')
        ]);
        if (e1 || e2) { $('restoreList').innerHTML = `<p class="hint">Fehler: ${escapeHtml(dbErr(e1 || e2)).replace(/\n/g, '<br>')}</p>`; return; }
        restoreState.projects = projects || [];
        restoreState.backups = backups || [];
        restoreState.emails = {};
        (profiles || []).forEach(p => { restoreState.emails[p.id] = p.email || p.id; });
        renderRestore();
    }

    function renderRestore() {
        const list = $('restoreList');
        const q = ($('restoreFilter').value || '').trim().toLowerCase();
        const emailOf = (uid) => restoreState.emails[uid] || uid;
        const matches = (name, num, uid) => !q || [name, num, emailOf(uid)].some(v => String(v || '').toLowerCase().includes(q));

        const knownIds = new Set(restoreState.projects.map(p => p.id));
        const backupsByProject = {};
        restoreState.backups.forEach(b => { (backupsByProject[b.project_id] = backupsByProject[b.project_id] || []).push(b); });

        // Verwaiste Sicherungen: Projekt wurde endgueltig geloescht, Sicherung existiert noch
        const orphans = Object.keys(backupsByProject).filter(pid => !knownIds.has(pid)).map(pid => {
            const newest = backupsByProject[pid][0];
            return { id: pid, user_id: newest.user_id, name: newest.name, project_number: newest.project_number, updated_at: newest.saved_at, orphan: true };
        });

        const rows = restoreState.projects.concat(orphans).filter(p => matches(p.name, p.project_number, p.user_id));
        list.innerHTML = '';
        if (!rows.length) { list.innerHTML = '<p class="hint">Keine Projekte gefunden.</p>'; return; }

        rows.forEach(p => {
            const versions = backupsByProject[p.id] || [];
            const trashed = !!p.deleted_at;
            const row = document.createElement('div');
            row.className = 'cloud-row' + (trashed || p.orphan ? ' trashed' : '');
            let badge = '';
            if (p.orphan) badge = '<span class="cl-badge orphan">endgültig gelöscht – nur Sicherung</span>';
            else if (trashed) badge = '<span class="cl-badge trash">Papierkorb</span>';
            const actions = [];
            if (trashed) actions.push(`<button type="button" data-restore="${p.id}">Wiederherstellen</button>`);
            if (versions.length) actions.push(`<button type="button" data-versions="${p.id}">${restoreState.expanded[p.id] ? 'Versionen ▴' : `Versionen (${versions.length}) ▾`}</button>`);
            if (trashed) actions.push(`<button type="button" class="danger" data-purge="${p.id}">Endgültig löschen</button>`);
            if (p.orphan) actions.push(`<button type="button" class="danger" data-purge-backups="${p.id}">Sicherungen löschen</button>`);
            row.innerHTML = `
                <div class="cl-main">
                    <div class="cl-name">${escapeHtml(p.name || 'Unbenannt')}${badge}</div>
                    <div class="cl-number">${p.project_number ? 'Projekt-Nr. ' + escapeHtml(p.project_number) : 'Keine Projekt-Nr.'} · ${escapeHtml(emailOf(p.user_id))}</div>
                    <div class="cl-meta">${p.orphan ? 'Letzte Sicherung' : 'Gespeichert'}: ${fmtDate(p.updated_at)}${trashed ? ' · gelöscht: ' + fmtDate(p.deleted_at) : ''}</div>
                </div>
                <div class="cl-actions">${actions.join('')}</div>`;
            list.appendChild(row);

            if (restoreState.expanded[p.id] && versions.length) {
                const box = document.createElement('div');
                box.className = 'cl-versions';
                const reasonText = { update: 'vor Überschreiben', trash: 'vor Papierkorb', delete: 'vor endgültigem Löschen' };
                versions.forEach(v => {
                    const line = document.createElement('div');
                    line.className = 'cl-version';
                    line.innerHTML = `<span>Stand vom ${fmtDate(v.saved_at)} · gesichert ${fmtDate(v.created_at)} (${reasonText[v.reason] || v.reason})</span>
                        <button type="button" data-restore-version="${v.id}">${p.orphan ? 'Als Projekt wiederherstellen' : 'Diesen Stand zurückspielen'}</button>`;
                    box.appendChild(line);
                });
                list.appendChild(box);
            }
        });

        list.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => restoreFromTrash(b.getAttribute('data-restore')));
        list.querySelectorAll('[data-versions]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-versions'); restoreState.expanded[id] = !restoreState.expanded[id]; renderRestore(); });
        list.querySelectorAll('[data-purge]').forEach(b => b.onclick = () => purgeProject(b.getAttribute('data-purge')));
        list.querySelectorAll('[data-purge-backups]').forEach(b => b.onclick = () => purgeBackups(b.getAttribute('data-purge-backups')));
        list.querySelectorAll('[data-restore-version]').forEach(b => b.onclick = () => restoreVersion(b.getAttribute('data-restore-version')));
    }

    async function restoreFromTrash(id) {
        const { error } = await client.from('projects').update({ deleted_at: null }).eq('id', id);
        if (error) alert('Wiederherstellen fehlgeschlagen: ' + dbErr(error)); else openRestore();
    }

    async function purgeProject(id) {
        if (!confirm('Projekt ENDGÜLTIG löschen?\n\nDie automatischen Sicherungen bleiben erhalten und können weiterhin als neues Projekt wiederhergestellt werden.')) return;
        const { error } = await client.from('projects').delete().eq('id', id);
        if (error) alert('Löschen fehlgeschlagen: ' + dbErr(error)); else openRestore();
    }

    async function purgeBackups(projectId) {
        if (!confirm('Alle Sicherungen dieses Projekts endgültig löschen? Danach ist keine Wiederherstellung mehr möglich.')) return;
        const { error } = await client.from('project_backups').delete().eq('project_id', projectId);
        if (error) alert('Löschen fehlgeschlagen: ' + dbErr(error)); else openRestore();
    }

    async function restoreVersion(backupId) {
        const { data: b, error } = await client.from('project_backups').select('*').eq('id', backupId).single();
        if (error) { alert('Sicherung konnte nicht geladen werden: ' + dbErr(error)); return; }
        const existing = restoreState.projects.find(p => p.id === b.project_id);
        if (existing) {
            if (!confirm(`Den aktuellen Stand von „${b.name || 'Unbenannt'}" durch die Sicherung vom ${fmtDate(b.saved_at)} ersetzen?\n\nDer jetzige Stand wird vorher automatisch gesichert.`)) return;
            const { error: e } = await client.from('projects')
                .update({ name: b.name, project_number: b.project_number, data: b.data, deleted_at: null })
                .eq('id', b.project_id);
            if (e) { alert('Zurückspielen fehlgeschlagen: ' + e.message); return; }
        } else {
            if (!confirm(`Sicherung vom ${fmtDate(b.saved_at)} als neues Projekt für ${restoreState.emails[b.user_id] || b.user_id} anlegen?`)) return;
            const { error: e } = await client.from('projects')
                .insert({ id: b.project_id, user_id: b.user_id, name: b.name, project_number: b.project_number, data: b.data });
            if (e) { alert('Wiederherstellen fehlgeschlagen: ' + e.message); return; }
        }
        openRestore();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ---------------------------------------------------------------- Wire up
    function wireEvents() {
        $('tabLogin').onclick = () => setMode('login');
        $('tabRegister').onclick = () => setMode('register');
        $('authForm').onsubmit = handleSubmit;
        $('authForgot').onclick = handleForgot;

        const accBtn = $('accountBtn'), accMenu = $('accountMenu');
        accBtn.onclick = (e) => { e.stopPropagation(); accMenu.classList.toggle('open'); };
        document.addEventListener('click', (e) => {
            if (!accMenu.contains(e.target) && e.target !== accBtn) accMenu.classList.remove('open');
        });
        $('menuLogout').onclick = () => client.auth.signOut();
        if ($('btnCloudLoad')) $('btnCloudLoad').onclick = () => openCloudProjects();
        if ($('btnCloudSave')) $('btnCloudSave').onclick = () => saveCurrentToCloud({ manual: true });
        if ($('btnCloudShare')) $('btnCloudShare').onclick = () => openShareForCurrent();
        $('btnLiveReload').onclick = () => reloadFromCloud(false);
        $('btnLiveIgnore').onclick = () => hideLiveUpdate();
        window.addEventListener('beforeunload', () => leaveLive());
        $('shareForm').addEventListener('submit', addShare);
        $('btnCloseShare').onclick = () => $('shareModal').classList.remove('active');
        $('shareModal').addEventListener('click', (e) => { if (e.target === $('shareModal')) $('shareModal').classList.remove('active'); });
        $('menuAdmin').onclick = () => { accMenu.classList.remove('open'); openAdmin(); };
        $('menuRestore').onclick = () => { accMenu.classList.remove('open'); openRestore(); };
        $('btnCloseRestore').onclick = () => $('restoreModal').classList.remove('active');
        $('btnReloadRestore').onclick = () => openRestore();
        $('restoreFilter').oninput = () => renderRestore();
        $('restoreModal').addEventListener('click', (e) => { if (e.target === $('restoreModal')) $('restoreModal').classList.remove('active'); });
        $('chkCloudSync').onchange = (e) => setSyncEnabled(e.target.checked);

        $('btnCloseCloudProjects').onclick = () => $('cloudProjectsModal').classList.remove('active');
        $('cloudProjectsModal').addEventListener('click', (e) => { if (e.target === $('cloudProjectsModal')) $('cloudProjectsModal').classList.remove('active'); });
        $('btnCloseAdmin').onclick = () => $('adminModal').classList.remove('active');
        $('btnReloadAdmin').onclick = () => openAdmin();
        $('adminModal').addEventListener('click', (e) => { if (e.target === $('adminModal')) $('adminModal').classList.remove('active'); });
    }

    // Oeffentliche Schnittstelle fuer app-export.js (Hook beim lokalen Speichern)
    window.cloudSync = {
        onLocalSave: function () { if (getSyncEnabled()) saveCurrentToCloud(); },
        isEnabled: getSyncEnabled,
        markNewProject: function () { setCurrentProjectId(null); }
    };

    // ---------------------------------------------------------------- Init
    function init() {
        injectStyles();
        buildDom();
        wireEvents();
        setMode('login');

        client.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                const np = prompt('Bitte neues Passwort eingeben (mindestens 6 Zeichen):');
                if (np && np.length >= 6) client.auth.updateUser({ password: np }).then(({ error }) => {
                    alert(error ? 'Fehler: ' + error.message : 'Passwort wurde geändert. Bitte neu anmelden.');
                });
                return;
            }
            refreshGate();
        });
        refreshGate();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
