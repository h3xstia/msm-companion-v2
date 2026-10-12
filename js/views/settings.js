import { html, useEffect, useState } from '../lib.js';
import { save, ui, setUi, commit, replaceSave, emptySave, toast } from '../store.js';
import { syncConfigured, useSync, signIn, signOut, resolveConflict, deleteAccount } from '../sync.js';
import { WIKI_PAGE } from '../wiki.js';
import { allIslandImages, setIslandImage } from './islands.js';
import { relTime, plural } from '../util.js';
import { Icon, Segmented, Dialog } from '../ui.js';

function exportSave() {
  const file = { app: 'msm-companion', version: 2, exported: new Date().toISOString(), save, islandImages: allIslandImages() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `msm-companion-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importSave() {
  const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'msm-companion' || data.version !== 2) {
        const looksV1 = data && typeof data.owned === 'object' && ('zapTracked' in data || 'wubboxBoxed' in data);
        throw new Error(looksV1 ? 'This is a save from the old site. Importing those is coming soon.' : "This doesn't look like an MSM Companion save file.");
      }
      commit(() => {}, { undoable: 'Loaded save file' }); // snapshot first so it can be undone
      replaceSave({ ...data.save, updatedAt: Date.now() });
      Object.entries(data.islandImages || {}).forEach(([k, v]) => setIslandImage(k, v));
    } catch (e) {
      toast(e.message || "Couldn't read that file", { tone: 'error', ms: 8000 });
    }
  };
  inp.click();
}

function Account() {
  const s = useSync();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    const open = () => setConfirmDelete(true);
    document.addEventListener('msm:delete-account', open);
    return () => document.removeEventListener('msm:delete-account', open);
  }, []);
  if (!syncConfigured) return html`<p class="muted">Cloud sync isn't set up on this copy of the site. Your progress is saved in this browser. Use a save file to move it.</p>`;
  if (s.user) {
    return html`
      ${s.conflict && html`<div class="notice">
        <strong>This device and the cloud both have changes.</strong> Which one do you want to keep?
        <div class="row"><button class="btn" onClick=${() => resolveConflict('local')}>Keep this device</button>
          <button class="btn" onClick=${() => resolveConflict('cloud')}>Use the cloud save</button></div></div>`}
      <div class="row"><${Icon} name="user" /><span class="grow">Signed in as <strong>${s.user.email}</strong></span>
        <span class="muted small">${{ synced: 'Synced', saving: 'Saving…', loading: 'Loading…', error: 'Sync failed', conflict: 'Needs a choice' }[s.status] || ''}</span>
        <button class="btn ghost sm" onClick=${signOut}>Sign out</button></div>
      <${Dialog} open=${confirmDelete} onClose=${() => setConfirmDelete(false)} title="Delete your account?"
        footer=${html`<button class="btn ghost" onClick=${() => setConfirmDelete(false)}>Cancel</button>
          <button class="btn danger" disabled=${busy} onClick=${async () => {
            setBusy(true);
            try { await deleteAccount(); toast('Account deleted'); setConfirmDelete(false); }
            catch (e) { toast("Couldn't delete the account: " + e.message, { tone: 'error', ms: 8000 }); }
            setBusy(false);
          }}>Delete account</button>`}>
        <p>This deletes your account and your cloud save. Progress on this device stays, so you can keep using the site without an account.</p>
      <//>`;
  }
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const r = await signIn(email.trim(), pass, mode === 'signup');
      if (r.needsConfirm) setMsg('Check your email to confirm your account, then sign in.');
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  return html`<form class="form" onSubmit=${submit}>
    <p class="muted">Sign in to keep your progress in sync across devices.</p>
    <label>Email<input type="email" autocomplete="email" required value=${email} onInput=${(e) => setEmail(e.currentTarget.value)} /></label>
    <label>Password<input type="password" autocomplete=${mode === 'signup' ? 'new-password' : 'current-password'} required minlength="6"
      value=${pass} onInput=${(e) => setPass(e.currentTarget.value)} /></label>
    ${mode === 'signup' && html`<label class="check"><input type="checkbox" required /> I'm 13 or older</label>
      <p class="muted small">You don't need an account. Everything works without one, it's only for syncing between devices.</p>`}
    ${msg && html`<p class="small ${msg.startsWith('Check') ? '' : 'danger'}">${msg}</p>`}
    <div class="row"><button class="btn primary" disabled=${busy}>${mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      <button type="button" class="link" onClick=${() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMsg(''); }}>
        ${mode === 'signup' ? 'I already have an account' : 'Create an account'}</button></div>
  </form>`;
}

export function SettingsView() {
  const [confirmReset, setConfirmReset] = useState(false);
  const owned = Object.values(save.owned).reduce((n, row) => n + Object.keys(row).length, 0);
  const boxed = Object.values(save.boxed).reduce((n, row) => n + Object.keys(row).length, 0);
  const imgs = Object.keys(allIslandImages()).length;
  return html`<section class="pane">
    <header class="pane-head"><div><h1>Settings</h1></div></header>
    <div class="settings-grid">
    <div class="card"><h2>Appearance</h2>
      <${Segmented} value=${ui.theme} options=${[['auto', 'Match device'], ['dark', 'Dark'], ['light', 'Light']]} onChange=${(v) => setUi({ theme: v })} />
    </div>
    <div class="card"><h2>Account & sync</h2><${Account} /></div>
    <div class="card"><h2>Backup</h2>
      <p class="muted">Download everything (including island plan images) as a file, or load one back in.</p>
      <div class="row">
        <button class="btn" onClick=${exportSave}><${Icon} name="download" size=${16} />Download save file</button>
        <button class="btn" onClick=${importSave}><${Icon} name="upload" size=${16} />Load save file</button>
      </div>
      <p class="muted small">${plural(owned, 'owned entry', 'owned entries')} · ${plural(save.zaps.length, 'zap target')} ·
        ${boxed} boxed · ${plural(imgs, 'island image')}${save.updatedAt ? ` · last change ${relTime(save.updatedAt)}` : ''}</p>
    </div>
    <div class="card danger-zone"><h2>Reset</h2>
      <p class="muted">Clear all progress on this device. Island images are kept.</p>
      <button class="btn danger" onClick=${() => setConfirmReset(true)}><${Icon} name="trash" size=${16} />Reset all progress</button>
    </div>
    <details class="card info">
      <summary><h2>Privacy & info</h2></summary>
      <h3>What gets stored</h3>
      <p>Your progress and settings are saved in this browser. Nothing leaves your device unless you sign in.</p>
      <p>If you create an account, your email address and your progress are stored with Supabase so they can sync between devices. Passwords are handled by Supabase and never stored by this site.</p>
      <p>No ads, no analytics, no tracking cookies.</p>
      <h3>Other services</h3>
      <p>The site is hosted on GitHub Pages and loads its UI library from jsDelivr. The Available tab fetches data from the MSM Wiki on Fandom. Like any website, these services can see your IP address when your browser contacts them.</p>
      <h3>Deleting your data</h3>
      <p>Reset all progress (above) clears this device. If you have an account, sign in and use Delete account to remove it and your cloud save.</p>
      ${useSync().user && html`<button class="btn danger sm" onClick=${() => document.dispatchEvent(new Event('msm:delete-account'))}><${Icon} name="trash" size=${14} />Delete account</button>`}
      <h3>About</h3>
      <p>MSM Companion is a fan-made tool and isn't affiliated with or endorsed by Big Blue Bubble. My Singing Monsters, its monsters and artwork belong to Big Blue Bubble Inc.</p>
      <p>Availability data comes from the <a href=${WIKI_PAGE} target="_blank" rel="noopener">My Singing Monsters Wiki</a> on Fandom (CC BY-SA).</p>
      <p>Accounts are for ages 13 and up.</p>
    </details>
    </div>
    <${Dialog} open=${confirmReset} onClose=${() => setConfirmReset(false)} title="Reset all progress?"
      footer=${html`<button class="btn ghost" onClick=${() => setConfirmReset(false)}>Cancel</button>
        <button class="btn danger" onClick=${() => { commit((s) => Object.assign(s, emptySave()), { undoable: 'Progress reset' }); setConfirmReset(false); }}>Reset</button>`}>
      <p>Your collection, zap targets, Wubboxes and availability will be cleared. You can undo right after.</p>
    <//>
  </section>`;
}
