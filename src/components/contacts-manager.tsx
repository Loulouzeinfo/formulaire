'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContactForm } from './contact-form';
import { readContacts, saveContact, deleteContact, type Contact, type ContactInput } from '@/lib/contacts';

type Notice = { kind: 'success' | 'error'; text: string };
export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState('');
  const lock = useRef(false);
  const refresh = useCallback(async (announce = false) => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { setContacts(await readContacts()); setReady(true); if (announce) setNotice({ kind: 'success', text: 'La liste des contacts est à jour.' }); }
    catch { setReady(false); setNotice({ kind: 'error', text: 'Impossible de charger les contacts Supabase. Vérifiez votre connexion puis cliquez sur Actualiser.' }); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  useEffect(() => {
    let active = true;
    readContacts().then(data => {
      if (active) { setContacts(data); setReady(true); }
    }).catch(() => {
      if (active) setNotice({ kind: 'error', text: 'Impossible de charger les contacts Supabase. Vérifiez votre connexion puis cliquez sur Actualiser.' });
    });
    return () => { active = false; };
  }, [refresh]);
  function cancel() { setEditing(null); setVersion(v => v + 1); }
  async function save(input: ContactInput) {
    if (lock.current || !ready) return false;
    lock.current = true; setBusy(true); setNotice(null);
    try { const saved = await saveContact(input, editing?.id); setContacts(current => editing ? current.map(c => c.id === saved.id ? saved : c) : [saved, ...current]); setNotice({ kind: 'success', text: editing ? 'Le contact a été modifié.' : 'Le contact a été enregistré.' }); cancel(); return true; }
    catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Impossible d’enregistrer le contact.' }); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove(c: Contact) {
    if (lock.current || !window.confirm(`Supprimer le contact ${c.prenom} ${c.nom} ?`)) return;
    lock.current = true; setBusy(true); setNotice(null);
    try { await deleteContact(c.id); setContacts(current => current.filter(item => item.id !== c.id)); if (editing?.id === c.id) cancel(); setNotice({ kind: 'success', text: 'Le contact a été supprimé.' }); }
    catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Impossible de supprimer ce contact.' }); }
    finally { lock.current = false; setBusy(false); }
  }
  const search = query.trim().toLocaleLowerCase('fr');
  const visible = contacts.filter(c => `${c.nom} ${c.prenom} ${c.email}`.toLocaleLowerCase('fr').includes(search));
  return <div className="min-h-screen">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-10"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-xl font-semibold text-white" aria-hidden="true">C</span><span className="text-xl font-semibold tracking-tight">Contacts<span className="text-teal-600">.</span></span></div><span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">● Supabase DEV</span></div></header>
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10 sm:py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Votre carnet d’adresses</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Un endroit pour tous vos contacts.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-500">Ajoutez, retrouvez et mettez à jour vos contacts en quelques instants.</p>
      <div className="my-7 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-6 text-teal-900">Environnement de test DEV · Vos contacts sont enregistrés dans Supabase et accessibles uniquement avec votre compte. Les anciens contacts du mode local ne sont pas importés.</div>
      {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${notice.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{notice.text}</div>}
      <div className="grid items-start gap-7 lg:grid-cols-[340px_minmax(0,1fr)]">
        <ContactForm key={`${editing?.id ?? 'new'}-${version}`} contact={editing} disabled={!ready} busy={busy} onSave={save} onCancel={cancel} />
        <section className="panel min-w-0" aria-labelledby="contacts-title" aria-busy={busy}>
          <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="contacts-title" className="text-lg font-semibold">Mes contacts <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{contacts.length}</span></h2><button className="button-secondary" disabled={busy} onClick={() => void refresh(true)}>{busy ? 'Chargement…' : '↻ Actualiser'}</button></div>
          <label htmlFor="search" className="sr-only">Rechercher un contact</label><input id="search" type="search" className="field my-6" placeholder="Rechercher un nom, un prénom, un e-mail…" value={query} onChange={e => setQuery(e.target.value)} />
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Contacts de votre compte Supabase DEV</caption>
            <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">{['ID', 'Nom', 'Prénom', 'Email', 'Créé le', 'Actions'].map(h => <th key={h} scope="col" className="whitespace-nowrap px-3 py-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>{visible.map(c => <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-3 py-5"><span title={c.id} className="font-mono text-xs text-slate-400">{c.id.slice(0, 8)}</span><span className="sr-only">{c.id}</span></td>
              <td className="max-w-48 break-words px-3 py-5 font-medium">{c.nom}</td><td className="max-w-48 break-words px-3 py-5">{c.prenom}</td><td className="max-w-64 break-words px-3 py-5 text-slate-600">{c.email}</td>
              <td className="whitespace-nowrap px-3 py-5 text-slate-500"><time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</time></td>
              <td className="px-3 py-5"><div className="flex gap-3"><button className="text-teal-800 hover:underline disabled:opacity-40" disabled={busy || !ready} aria-label={`Modifier ${c.prenom} ${c.nom}`} onClick={() => { setEditing(c); setVersion(v => v + 1); requestAnimationFrame(() => document.getElementById('nom')?.focus()); }}>Modifier</button><button className="text-red-700 hover:underline disabled:opacity-40" disabled={busy || !ready} aria-label={`Supprimer ${c.prenom} ${c.nom}`} onClick={() => void remove(c)}>Supprimer</button></div></td>
            </tr>)}{visible.length === 0 && <tr><td colSpan={6} className="px-4 py-16 text-center"><p className="mb-2 font-medium text-slate-700">{!ready ? busy ? 'Chargement des contacts…' : 'Chargement indisponible' : search ? 'Aucun résultat' : 'Votre carnet attend son premier contact'}</p><p className="text-sm text-slate-500">{!ready ? 'Cliquez sur Actualiser pour réessayer.' : search ? 'Essayez un autre nom ou une autre adresse e-mail.' : 'Remplissez le formulaire pour commencer.'}</p></td></tr>}</tbody>
          </table></div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">{visible.length} contact{visible.length > 1 ? 's' : ''} affiché{visible.length > 1 ? 's' : ''} · Enregistrés dans Supabase DEV</p>
        </section>
      </div>
    </main><footer className="mx-auto max-w-7xl px-5 pb-8 text-xs text-slate-400 sm:px-10">Contacts · Environnement DEV</footer>
  </div>;
}
