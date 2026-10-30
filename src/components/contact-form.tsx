'use client';
import { useState, type FormEvent } from 'react';
import type { Contact, ContactInput } from '@/lib/contacts';

type Props = { contact: Contact | null; disabled: boolean; busy: boolean; onSave: (input: ContactInput) => Promise<boolean>; onCancel: () => void };
export function ContactForm({ contact, disabled, busy, onSave, onCancel }: Props) {
  const [values, setValues] = useState<ContactInput>(contact ?? { nom: '', prenom: '', email: '' });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await onSave(values)) setValues({ nom: '', prenom: '', email: '' });
  }
  return <section className="panel contact-form-panel" aria-labelledby="form-title">
    <div className="mb-7 flex items-start gap-3"><span className="icon-tile" aria-hidden="true">{contact ? '✎' : '+'}</span><div><h2 id="form-title" className="text-lg font-semibold">{contact ? 'Modifier le contact' : 'Nouveau contact'}</h2><p className="mt-1 text-sm text-slate-500">Une nouvelle rencontre à garder.</p></div></div>
    <form onSubmit={submit}><fieldset disabled={disabled || busy} className="space-y-5 disabled:opacity-60">
      {([['nom', 'Nom', 'Dupont', 'family-name'], ['prenom', 'Prénom', 'Camille', 'given-name'], ['email', 'Adresse e-mail', 'camille@exemple.fr', 'email']] as const).map(([name, label, placeholder, autoComplete]) => <div key={name}>
        <label htmlFor={name} className="mb-2 block text-sm font-medium">{label} <span className="text-teal-700">*</span></label>
        <input id={name} name={name} type={name === 'email' ? 'email' : 'text'} required maxLength={name === 'email' ? 254 : 100} autoComplete={autoComplete} placeholder={placeholder} value={values[name]} onChange={e => setValues({ ...values, [name]: e.target.value })} className="field" />
      </div>)}
      <button type="submit" className="button-primary w-full">{busy ? 'Enregistrement…' : contact ? 'Enregistrer les modifications' : 'Ajouter au carnet  +'}</button>
      {contact && <button type="button" className="button-secondary w-full" onClick={onCancel}>Annuler la modification</button>}
    </fieldset></form>
  </section>;
}
