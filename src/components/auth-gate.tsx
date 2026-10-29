'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { ContactsManager } from './contacts-manager';

export function AuthGate() {
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
    <div className="border-b border-teal-100 bg-teal-50"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-10"><p className="break-all text-sm text-teal-900">Connecté : {session.user.email}</p><button className="button-secondary" onClick={() => void logout()} disabled={busy}>{busy ? 'Déconnexion…' : 'Se déconnecter'}</button></div>{error && <p role="alert" className="px-5 pb-3 text-center text-sm text-red-700">{error}</p>}</div>
    <ContactsManager key={session.user.id} />
  </>;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
    <div className="mb-8 flex items-center gap-3"><span className="icon-tile" aria-hidden="true">C</span><span className="text-xl font-semibold">Contacts.</span></div>
    <section className="panel"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-700">Supabase DEV</p><h1 className="text-2xl font-semibold tracking-tight">Bienvenue dans votre carnet.</h1><p className="mb-7 mt-3 text-sm leading-6 text-slate-500">Connectez-vous avec le compte de test créé dans Supabase pour retrouver vos contacts.</p>
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={login}><fieldset disabled={busy} className="space-y-5"><div><label htmlFor="login-email" className="mb-2 block text-sm font-medium">Adresse e-mail</label><input className="field" id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div><div><label htmlFor="login-password" className="mb-2 block text-sm font-medium">Mot de passe</label><input className="field" id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div><button className="button-primary w-full" type="submit">{busy ? 'Connexion…' : 'Se connecter'}</button></fieldset></form>
    </section><p className="mt-5 text-sm leading-6 text-slate-500">Environnement de test. Les contacts de chaque compte sont séparés.</p>
  </main>;
}
