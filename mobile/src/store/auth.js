import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuth = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user || null, loading: false });
    if (session?.user) get().fetchProfile();
    supabase.auth.onAuthStateChange(async (_e, session) => {
      set({ session, user: session?.user || null });
      if (session?.user) get().fetchProfile();
      else set({ profile: null });
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase.from('musera_profiles').select('*').eq('id', user.id).single();
    if (data) set({ profile: data });
  },

  updateProfile: async (patch) => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase.from('musera_profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', user.id).select().single();
    if (!error && data) set({ profile: data });
    return { error };
  },

  uploadAvatar: async (uri) => {
    const { user } = get();
    if (!user) return { error: 'no user' };
    const ext = uri.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const res = await fetch(uri);
    const blob = await res.blob();
    const { error } = await supabase.storage.from('musera-avatars').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (error) return { error };
    const { data } = supabase.storage.from('musera-avatars').getPublicUrl(path);
    return get().updateProfile({ avatar_url: data.publicUrl + `?t=${Date.now()}` });
  },

  signUp: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    return { data, error };
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, session: null, user: null });
  },
}));
