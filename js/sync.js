// supabase sync. url + key get filled in by the deploy workflow
// (uses a separate table so old site saves are left alone)
import { save, replaceSave, onSaveChange, toast } from './store.js';
import { useEffect, useState } from './lib.js';

const SUPABASE_URL = '%%SUPABASE_URL%%';
const SUPABASE_KEY = '%%SUPABASE_KEY%%';
const TABLE = 'user_saves_v2';
const SYNC_KEY = 'msm2:lastSynced';

export const syncConfigured = SUPABASE_URL.includes('supabase.co') && SUPABASE_KEY.length > 20;

let client = null;
export const sync = { user: null, status: '', conflict: null };
const listeners = new Set();
const set = (patch) => { Object.assign(sync, patch); listeners.forEach((fn) => fn({ ...sync })); };

export function useSync() {
  const [s, setS] = useState({ ...sync });
  useEffect(() => { listeners.add(setS); return () => listeners.delete(setS); }, []);
  return s;
}

const lastSynced = () => Number(localStorage.getItem(SYNC_KEY) || 0);
const markSynced = (t) => { try { localStorage.setItem(SYNC_KEY, String(t)); } catch { /* ignore */ } };

async function getClient() {
  if (!syncConfigured) return null;
  if (!client) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
    client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return client;
}

export async function initSync() {
  const sb = await getClient();
  if (!sb) return;
  sb.auth.onAuthStateChange((event, session) => {
    set({ user: session?.user || null });
    if (event === 'SIGNED_IN') pull();
    if (event === 'SIGNED_OUT') set({ status: '' });
  });
  const { data } = await sb.auth.getSession();
  if (data.session) { set({ user: data.session.user }); pull(); }
  let timer;
  onSaveChange(() => {
    if (!sync.user) return;
    set({ status: 'saving' });
    clearTimeout(timer);
    timer = setTimeout(push, 2000);
  });
}

export async function signIn(email, password, signUp = false) {
  const sb = await getClient();
  if (!sb) throw new Error('Cloud sync is not set up on this site.');
  // needs to be in supabase redirect urls
  const emailRedirectTo = location.origin + location.pathname;
  const res = signUp
    ? await sb.auth.signUp({ email, password, options: { emailRedirectTo } })
    : await sb.auth.signInWithPassword({ email, password });
  if (res.error) throw res.error;
  return { needsConfirm: signUp && !res.data.session };
}

export async function signOut() { (await getClient())?.auth.signOut(); }

// the old site's cloud save (read only, from the old table)
export async function fetchV1Cloud() {
  const sb = await getClient();
  if (!sb || !sync.user) throw new Error('Sign in first.');
  const { data, error } = await sb.from('user_saves').select('data').eq('id', sync.user.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

// needs the delete_my_account function set up in supabase. the cloud save goes with it (on delete cascade)
export async function deleteAccount() {
  const sb = await getClient();
  const { error } = await sb.rpc('delete_my_account');
  if (error) throw error;
  try { localStorage.removeItem(SYNC_KEY); } catch { /* ignore */ }
  await sb.auth.signOut();
}

async function push() {
  const sb = await getClient();
  if (!sb || !sync.user) return;
  const { error } = await sb.from(TABLE).upsert({ id: sync.user.id, data: save, updated_at: new Date().toISOString() });
  if (error) { set({ status: 'error' }); return; }
  markSynced(save.updatedAt);
  set({ status: 'synced' });
}

async function pull() {
  const sb = await getClient();
  if (!sb || !sync.user) return;
  set({ status: 'loading' });
  const { data, error } = await sb.from(TABLE).select('data').eq('id', sync.user.id).maybeSingle();
  if (error) { set({ status: 'error' }); return; }
  const cloud = data?.data;
  if (!cloud) return push();
  const since = lastSynced();
  const localChanged = save.updatedAt > since;
  const cloudChanged = cloud.updatedAt > since;
  if (cloud.updatedAt === save.updatedAt || (!cloudChanged && !localChanged)) { set({ status: 'synced' }); return; }
  if (localChanged && cloudChanged && since) {
    set({ status: 'conflict', conflict: { cloud } }); // the user picks in Settings
    return;
  }
  if (cloud.updatedAt > save.updatedAt) useCloud(cloud); else push();
}

function useCloud(cloud) {
  replaceSave(cloud);
  markSynced(cloud.updatedAt);
  set({ status: 'synced', conflict: null });
  toast('Loaded your progress from the cloud');
}

export function resolveConflict(keep) {
  const c = sync.conflict;
  if (!c) return;
  if (keep === 'cloud') useCloud(c.cloud);
  else { set({ conflict: null }); push(); }
}
