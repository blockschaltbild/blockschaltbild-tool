// ============================================================================
// Geräteverwaltung – separates Admin-Tool für den Blockschaltbild Editor
// ----------------------------------------------------------------------------
// Verwaltet die zentrale, online gespeicherte Gerätebibliothek (Supabase-
// Tabelle "device_library_state", siehe supabase/setup.sql). Jeder Nutzer des
// Editors laedt diesen Stand automatisch (app-library.js: syncLibraryFromCloud).
// Nur Nutzer mit Rolle "admin" duerfen hier aendern (serverseitig per RLS
// zusaetzlich abgesichert).
// ============================================================================
(function () {
    'use strict';

    if (typeof SUPABASE_CONFIG === 'undefined' || !window.supabase) {
        alert('Supabase ist nicht geladen oder nicht konfiguriert.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
    });

    const $ = (id) => document.getElementById(id);

    const state = {
        user: null,
        profile: null,
        library: { templates: [], groups: [], cableTypes: [] },
        updatedAt: null,
        updatedByEmail: null,
        activeGroup: 'all',
        search: '',
        dirty: false,
        editingIndex: null
    };

    function defaultGroups() {
        return [
            { id: 'audio', name: 'Ton', color: '#3498db' },
            { id: 'video', name: 'Video', color: '#9b59b6' },
            { id: 'light', name: 'Licht', color: '#f1c40f' },
            { id: 'control', name: 'Steuerung', color: '#e67e22' },
            { id: 'other', name: 'Sonstiges', color: '#95a5a6' }
        ];
    }

    function defaultCableTypes() {
        return ['XLR', 'Klinke', 'Cinch', 'HDMI', 'DVI', 'VGA', 'SDI', 'DP', 'Cat5/6', 'Speakon', 'Powercon', 'DMX', 'Dante', 'AES/EBU', 'SPDIF', 'USB', 'Coax', 'Glasfaser', 'Glasfaser LC/LC', 'HDBaseT', 'USB-C'];
    }

    function setDirty(v) {
        state.dirty = v;
        $('btnSaveLib').disabled = !v;
    }

    function groupColor(id) {
        const g = state.library.groups.find(g => g.id === id);
        return (g && g.color) || '#95a5a6';
    }

    function groupName(id) {
        const g = state.library.groups.find(g => g.id === id);
        return (g && g.name) || id || 'Sonstiges';
    }

    // ------------------------------------------------------------ Auth-Gate
    async function handleGateSubmit(e) {
        e.preventDefault();
        const email = $('gateEmail').value.trim();
        const password = $('gatePassword').value;
        const msg = $('gateMsg');
        msg.textContent = ''; msg.className = 'msg';
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            msg.textContent = /invalid login credentials/i.test(error.message) ? 'E-Mail oder Passwort ist falsch.' : error.message;
            msg.className = 'msg error';
        }
    }

    async function checkAccess() {
        const { data: { session } } = await client.auth.getSession();
        state.user = session ? session.user : null;
        if (!state.user) {
            $('gate').style.display = 'block';
            $('app').style.display = 'none';
            return;
        }
        const { data: profile, error } = await client.from('profiles').select('id,email,role,blocked,access_expires_at').eq('id', state.user.id).maybeSingle();
        state.profile = error ? null : profile;
        const active = state.profile && !state.profile.blocked && (state.profile.role === 'admin' || new Date(state.profile.access_expires_at).getTime() > Date.now());
        if (!active) {
            $('gate').style.display = 'block';
            $('app').style.display = 'none';
            $('gateMsg').textContent = 'Dein Konto ist nicht aktiv. Bitte wende dich an einen Administrator.';
            $('gateMsg').className = 'msg error';
            return;
        }
        if (state.profile.role !== 'admin') {
            $('gate').style.display = 'block';
            $('app').style.display = 'none';
            $('gateMsg').textContent = 'Dieses Tool ist nur für Administratoren. Angemeldet als ' + state.profile.email + '.';
            $('gateMsg').className = 'msg error';
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = 'Abmelden'; b.style.marginTop = '10px';
            b.onclick = () => client.auth.signOut();
            $('gate').appendChild(b);
            return;
        }
        $('gate').style.display = 'none';
        $('app').style.display = 'block';
        $('accWho').textContent = state.profile.email + ' (Admin)';
        await loadLibrary();
    }

    // ------------------------------------------------------------ Bibliothek laden/speichern
    async function loadLibrary() {
        const { data, error } = await client.from('device_library_state').select('data,updated_at,updated_by_email').eq('id', true).maybeSingle();
        if (error) {
            $('libInfo').textContent = 'Fehler beim Laden: ' + error.message;
            return;
        }
        if (data && data.data) {
            state.library = {
                templates: Array.isArray(data.data.templates) ? data.data.templates : [],
                groups: Array.isArray(data.data.groups) && data.data.groups.length ? data.data.groups : defaultGroups(),
                cableTypes: Array.isArray(data.data.cableTypes) && data.data.cableTypes.length ? data.data.cableTypes : defaultCableTypes()
            };
            state.updatedAt = data.updated_at;
            state.updatedByEmail = data.updated_by_email;
        } else {
            state.library = { templates: [], groups: defaultGroups(), cableTypes: defaultCableTypes() };
            state.updatedAt = null;
            state.updatedByEmail = null;
        }
        setDirty(false);
        renderAll();
    }

    async function saveLibrary() {
        $('btnSaveLib').disabled = true;
        $('btnSaveLib').textContent = 'Speichere ...';
        const { error } = await client.from('device_library_state').upsert({
            id: true,
            data: state.library,
            updated_at: new Date().toISOString(),
            updated_by: state.user.id,
            updated_by_email: state.user.email
        });
        $('btnSaveLib').textContent = '💾 Änderungen speichern';
        if (error) {
            alert('Fehler beim Speichern: ' + error.message);
            setDirty(true);
        } else {
            setDirty(false);
            await loadLibrary();
            alert('Gespeichert. Alle Nutzer erhalten diesen Stand automatisch beim nächsten Öffnen des Editors.');
        }
    }

    // ------------------------------------------------------------ Rendering
    function renderAll() {
        renderGroups();
        renderCables();
        renderDevices();
        const when = state.updatedAt ? new Date(state.updatedAt).toLocaleString('de-DE') : 'noch nie';
        $('libInfo').textContent = `Zuletzt veröffentlicht: ${when}${state.updatedByEmail ? ' von ' + state.updatedByEmail : ''}. ${state.library.templates.length} Gerät(e) in ${state.library.groups.length} Gruppe(n).`;
    }

    function renderGroups() {
        const wrap = $('groupList');
        wrap.innerHTML = '';
        const allRow = document.createElement('div');
        allRow.className = 'group-row' + (state.activeGroup === 'all' ? ' active' : '');
        allRow.innerHTML = `<span class="gname">Alle Geräte (${state.library.templates.length})</span>`;
        allRow.querySelector('.gname').onclick = () => { state.activeGroup = 'all'; renderGroups(); renderDevices(); };
        wrap.appendChild(allRow);

        state.library.groups.forEach(g => {
            const count = state.library.templates.filter(t => (t.group || 'other') === g.id).length;
            const row = document.createElement('div');
            row.className = 'group-row' + (state.activeGroup === g.id ? ' active' : '');
            row.innerHTML = `
                <input type="color" class="swatch" value="${g.color || '#95a5a6'}" title="Farbe ändern">
                <span class="gname">${g.name} (${count})</span>
                <button class="small" data-act="rename" title="Umbenennen">✎</button>
                <button class="small" data-act="del" title="Löschen">🗑</button>`;
            row.querySelector('.gname').onclick = () => { state.activeGroup = g.id; renderGroups(); renderDevices(); };
            row.querySelector('.swatch').onchange = (e) => { g.color = e.target.value; setDirty(true); renderDevices(); };
            row.querySelector('[data-act="rename"]').onclick = () => {
                const name = prompt('Neuer Name der Gruppe:', g.name);
                if (name && name.trim()) { g.name = name.trim(); setDirty(true); renderGroups(); renderDevices(); }
            };
            row.querySelector('[data-act="del"]').onclick = () => {
                if (count > 0) { alert('Diese Gruppe wird noch von ' + count + ' Gerät(en) verwendet und kann nicht gelöscht werden.'); return; }
                if (!confirm('Gruppe "' + g.name + '" wirklich löschen?')) return;
                state.library.groups = state.library.groups.filter(x => x !== g);
                if (state.activeGroup === g.id) state.activeGroup = 'all';
                setDirty(true); renderAll();
            };
            wrap.appendChild(row);
        });
    }

    function renderCables() {
        const wrap = $('cableList');
        wrap.innerHTML = '';
        state.library.cableTypes.forEach(c => {
            const chip = document.createElement('span');
            chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:var(--ict-gray-2);padding:3px 8px;border-radius:12px;font-size:.76rem;';
            chip.innerHTML = `${c} <button class="small" style="border:none;background:none;cursor:pointer;padding:0;">✕</button>`;
            chip.querySelector('button').onclick = () => {
                state.library.cableTypes = state.library.cableTypes.filter(x => x !== c);
                setDirty(true); renderCables();
            };
            wrap.appendChild(chip);
        });
    }

    function renderDevices() {
        const wrap = $('deviceListWrap');
        const search = state.search.toLowerCase().trim();
        let items = state.library.templates.map((t, idx) => ({ t, idx })).filter(({ t }) => {
            if (state.activeGroup !== 'all' && (t.group || 'other') !== state.activeGroup) return false;
            if (!search) return true;
            const hay = [t.name, t.type, t.article, ...(t.inputs || []), ...(t.outputs || [])].join(' ').toLowerCase();
            return hay.includes(search);
        });
        $('deviceListTitle').textContent = state.activeGroup === 'all' ? 'Alle Geräte' : groupName(state.activeGroup);

        if (items.length === 0) {
            wrap.innerHTML = '<div class="empty-hint">Keine Geräte gefunden.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'device-table';
        table.innerHTML = '<thead><tr><th>Name</th><th>Typ</th><th>Artikel-Nr.</th><th>Gruppe</th><th>E/A</th><th>Reihenfolge</th><th>Aktionen</th></tr></thead>';
        const tbody = document.createElement('tbody');
        items.forEach(({ t, idx }, pos) => {
            const tr = document.createElement('tr');
            const groupSiblings = state.library.templates.map((x, i) => ({ x, i })).filter(({ x }) => (x.group || 'other') === (t.group || 'other'));
            const posInGroup = groupSiblings.findIndex(s => s.i === idx);
            tr.innerHTML = `
                <td><b>${t.name || ''}</b></td>
                <td>${t.type || ''}</td>
                <td>${t.article || ''}</td>
                <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${groupColor(t.group)};margin-right:5px;"></span>${groupName(t.group)}</td>
                <td class="io-preview">${(t.inputs || []).length} In / ${(t.outputs || []).length} Out</td>
                <td class="dt-actions"></td>
                <td class="dt-actions"></td>`;
            const orderCell = tr.children[5];
            const upBtn = document.createElement('button'); upBtn.className = 'small'; upBtn.textContent = '↑'; upBtn.disabled = posInGroup <= 0;
            upBtn.onclick = () => { moveTemplate(idx, groupSiblings[posInGroup - 1].i); };
            const downBtn = document.createElement('button'); downBtn.className = 'small'; downBtn.textContent = '↓'; downBtn.disabled = posInGroup >= groupSiblings.length - 1;
            downBtn.onclick = () => { moveTemplate(idx, groupSiblings[posInGroup + 1].i); };
            orderCell.appendChild(upBtn); orderCell.appendChild(downBtn);

            const actCell = tr.children[6];
            const editBtn = document.createElement('button'); editBtn.className = 'small'; editBtn.textContent = 'Bearbeiten';
            editBtn.onclick = () => openDeviceModal(idx);
            const dupBtn = document.createElement('button'); dupBtn.className = 'small'; dupBtn.textContent = 'Duplizieren';
            dupBtn.onclick = () => {
                const copy = JSON.parse(JSON.stringify(t));
                copy.name = copy.name + ' (Kopie)';
                state.library.templates.splice(idx + 1, 0, copy);
                setDirty(true); renderAll();
            };
            const delBtn = document.createElement('button'); delBtn.className = 'small danger'; delBtn.textContent = 'Löschen';
            delBtn.onclick = () => {
                if (!confirm('Gerät "' + t.name + '" wirklich löschen?')) return;
                state.library.templates.splice(idx, 1);
                setDirty(true); renderAll();
            };
            actCell.appendChild(editBtn); actCell.appendChild(dupBtn); actCell.appendChild(delBtn);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.innerHTML = '';
        wrap.appendChild(table);
    }

    function moveTemplate(fromIdx, toIdx) {
        const arr = state.library.templates;
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        setDirty(true); renderAll();
    }

    // ------------------------------------------------------------ Gerät-Modal
    function fillGroupSelect() {
        const sel = $('fGroup');
        sel.innerHTML = state.library.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }

    function portRow(container, name, cable) {
        const row = document.createElement('div');
        row.className = 'port-row';
        const cableOptions = ['', ...state.library.cableTypes].map(c => `<option value="${c}" ${c === cable ? 'selected' : ''}>${c || '(kein Kabeltyp)'}</option>`).join('');
        row.innerHTML = `<input type="text" placeholder="Bezeichnung" value="${name || ''}"><select>${cableOptions}</select><button class="small" type="button">✕</button>`;
        row.querySelector('button').onclick = () => row.remove();
        container.appendChild(row);
        return row;
    }

    function readPorts(container) {
        return Array.from(container.querySelectorAll('.port-row')).map(row => ({
            name: row.querySelector('input').value.trim(),
            cable: row.querySelector('select').value
        })).filter(p => p.name);
    }

    function openDeviceModal(idx) {
        state.editingIndex = idx === undefined ? null : idx;
        fillGroupSelect();
        const t = idx !== undefined && idx !== null ? state.library.templates[idx] : null;
        $('deviceModalTitle').textContent = t ? 'Gerät bearbeiten' : 'Neues Gerät';
        $('fName').value = t ? t.name || '' : '';
        $('fType').value = t ? t.type || '' : '';
        $('fArticle').value = t ? t.article || '' : '';
        $('fGroup').value = t ? (t.group || 'other') : (state.activeGroup !== 'all' ? state.activeGroup : 'other');
        $('fColor').value = t ? (t.color || groupColor($('fGroup').value)) : groupColor($('fGroup').value);
        $('fInputs').innerHTML = '';
        $('fOutputs').innerHTML = '';
        if (t) {
            (t.inputs || []).forEach((name, i) => portRow($('fInputs'), name, (t.inputCables || [])[i]));
            (t.outputs || []).forEach((name, i) => portRow($('fOutputs'), name, (t.outputCables || [])[i]));
        }
        $('deviceModal').classList.add('active');
    }

    function closeDeviceModal() {
        $('deviceModal').classList.remove('active');
    }

    function saveDeviceFromModal() {
        const name = $('fName').value.trim();
        if (!name) { alert('Bitte einen Namen angeben.'); return; }
        const inputs = readPorts($('fInputs'));
        const outputs = readPorts($('fOutputs'));
        const template = {
            name,
            type: $('fType').value.trim(),
            article: $('fArticle').value.trim(),
            group: $('fGroup').value,
            color: $('fColor').value,
            inputs: inputs.map(p => p.name),
            inputCables: inputs.map(p => p.cable),
            outputs: outputs.map(p => p.name),
            outputCables: outputs.map(p => p.cable)
        };
        if (state.editingIndex !== null) {
            state.library.templates[state.editingIndex] = template;
        } else {
            state.library.templates.push(template);
        }
        setDirty(true);
        closeDeviceModal();
        renderAll();
    }

    // ------------------------------------------------------------ Import/Export JSON
    function exportJson() {
        const blob = new Blob([JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ...state.library }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'geraetebibliothek.json'; a.click();
        URL.revokeObjectURL(url);
    }

    function templateKey(t) {
        return `${(t.name || '').trim().toLowerCase()}|${(t.article || '').trim().toLowerCase()}`;
    }

    function importJson(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                let added = 0, groupsAdded = 0, cablesAdded = 0;
                if (Array.isArray(data.groups)) {
                    data.groups.forEach(g => {
                        if (!g || !g.id || state.library.groups.some(x => x.id === g.id)) return;
                        state.library.groups.push(g); groupsAdded++;
                    });
                }
                if (Array.isArray(data.cableTypes)) {
                    data.cableTypes.forEach(c => {
                        if (!c || state.library.cableTypes.includes(c)) return;
                        state.library.cableTypes.push(c); cablesAdded++;
                    });
                }
                if (Array.isArray(data.templates)) {
                    const known = new Set(state.library.templates.map(templateKey));
                    data.templates.forEach(t => {
                        if (!t || !t.name || t.placeholder) return;
                        const key = templateKey(t);
                        if (known.has(key)) return;
                        known.add(key);
                        state.library.templates.push(t);
                        added++;
                    });
                }
                if (added || groupsAdded || cablesAdded) { setDirty(true); renderAll(); }
                alert(`Übernommen: ${added} Gerät(e), ${groupsAdded} Gruppe(n), ${cablesAdded} Kabeltyp(en).`);
            } catch (err) {
                alert('Fehler beim Import: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ------------------------------------------------------------ Events
    function wireEvents() {
        $('gateForm').addEventListener('submit', handleGateSubmit);
        $('btnSignOut').addEventListener('click', () => client.auth.signOut());
        $('searchInput').addEventListener('input', (e) => { state.search = e.target.value; renderDevices(); });
        $('btnReload').addEventListener('click', () => {
            if (state.dirty && !confirm('Ungespeicherte Änderungen gehen verloren. Trotzdem neu laden?')) return;
            loadLibrary();
        });
        $('btnSaveLib').addEventListener('click', saveLibrary);
        $('btnAddDevice').addEventListener('click', () => openDeviceModal());
        $('btnCancelDevice').addEventListener('click', closeDeviceModal);
        $('btnSaveDevice').addEventListener('click', saveDeviceFromModal);
        $('btnAddInput').addEventListener('click', () => portRow($('fInputs'), '', ''));
        $('btnAddOutput').addEventListener('click', () => portRow($('fOutputs'), '', ''));
        $('deviceModal').addEventListener('click', (e) => { if (e.target === $('deviceModal')) closeDeviceModal(); });
        $('btnAddGroup').addEventListener('click', () => {
            const name = prompt('Name der neuen Gruppe:');
            if (!name || !name.trim()) return;
            const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('gruppe-' + Date.now());
            if (state.library.groups.some(g => g.id === id)) { alert('Es gibt bereits eine Gruppe mit dieser Kennung.'); return; }
            state.library.groups.push({ id, name: name.trim(), color: '#95a5a6' });
            setDirty(true); renderAll();
        });
        $('btnAddCable').addEventListener('click', () => {
            const name = prompt('Name des neuen Kabeltyps:');
            if (!name || !name.trim() || state.library.cableTypes.includes(name.trim())) return;
            state.library.cableTypes.push(name.trim());
            setDirty(true); renderCables();
        });
        $('btnExportJson').addEventListener('click', exportJson);
        $('btnImportJson').addEventListener('click', () => $('fileImportJson').click());
        $('fileImportJson').addEventListener('change', importJson);
        window.addEventListener('beforeunload', (e) => {
            if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
        });
        client.auth.onAuthStateChange(() => checkAccess());
    }

    wireEvents();
    checkAccess();
})();
