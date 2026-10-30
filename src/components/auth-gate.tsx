'use client';
import Link from 'next/link';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { ContactsManager } from './contacts-manager';

export function AuthGate({ environment }: { environment: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const client = getSupabaseBrowserClient();
      const { data } = client.auth.onAuthStateChange((_event, current) => {
        if (active) { setSession(current); setLoading(false); }
      });
      unsubscribe = () => data.subscription.unsubscribe();
      client.auth.getSession().then(({ error }) => {
        if (active && error) { setError('Impossible de restaurer votre session. Reconnectez-vous.'); setLoading(false); }
      }).catch(() => {
        if (active) { setError('Impossible de vérifier votre session. Rechargez la page.'); setLoading(false); }
      });
    } catch {
      queueMicrotask(() => { if (active) { setError('Configuration Supabase indisponible. Vérifiez .env.local puis redémarrez le serveur.'); setLoading(false); } });
    }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(error.code === 'email_not_confirmed' ? 'Confirmez l’adresse e-mail de votre compte dans Supabase avant de vous connecter.' : 'Connexion impossible. Vérifiez votre e-mail, votre mot de passe et votre connexion Internet.');
      }
    } catch { setError('Connexion impossible. Vérifiez votre connexion Internet.'); }
    finally { setPassword(''); lock.current = false; setBusy(false); }
  }

  async function logout() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut({ scope: 'local' });
      if (error) setError('La déconnexion a échoué. Réessayez.');
      else setSession(null);
    } catch { setError('La déconnexion a échoué. Réessayez.'); }
    finally { lock.current = false; setBusy(false); }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center px-6"><p role="status" className="text-slate-600">Vérification de votre session…</p></main>;
  if (session) return <>
    <div className="account-bar"><div className="flex flex-wrap items-center justify-end gap-3 px-5 py-3 sm:px-10"><p className="break-all text-sm text-slate-600">Connecté : {session.user.email}</p><button className="button-secondary" onClick={() => void logout()} disabled={busy}>{busy ? 'Déconnexion…' : 'Se déconnecter'}</button></div>{error && <p role="alert" className="px-5 pb-3 text-center text-sm text-red-700">{error}</p>}</div>
    <ContactsManager key={session.user.id} environment={environment} />
  </>;
  return <main className="login-layout">
    <section className="login-story" aria-label="Votre carnet de contacts"><Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">c</span>contact.</Link><div className="login-story-content"><span className="story-tag">VOTRE RÉSEAU. VOTRE ESPACE.</span><h2>Les bonnes relations<br />méritent une<br /><em>bonne place.</em></h2><p>Un carnet simple et personnel pour retrouver les personnes qui comptent.</p><div className="connection-art" aria-hidden="true"><span>AM</span><i /><span>VOUS</span><i /><span>CL</span></div></div><p className="text-xs text-indigo-200/60">Simple à utiliser. Agréable à retrouver.</p></section>
    <div className="login-form-wrap"><div className="w-full max-w-sm">
    <p className="eyebrow mb-7">HEUREUX DE VOUS RETROUVER</p>
    <section><h1 className="text-3xl font-semibold leading-tight tracking-tight">Un lien avec votre réseau.</h1><p className="mb-7 mt-3 text-sm leading-6 text-slate-500">Connectez-vous pour retrouver votre carnet et continuer là où vous en étiez.</p>
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={login}><fieldset disabled={busy} className="space-y-5"><div><label htmlFor="login-email" className="mb-2 block text-sm font-medium">Adresse e-mail</label><input className="field" id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div><div><label htmlFor="login-password" className="mb-2 block text-sm font-medium">Mot de passe</label><input className="field" id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div><button className="button-primary w-full" type="submit">{busy ? 'Connexion…' : 'Ouvrir mon carnet  →'}</button></fieldset></form>
    </section><p className="mt-5 text-sm leading-6 text-slate-500">{environment} · Votre carnet reste personnel.</p></div></div>
  </main>;
}
