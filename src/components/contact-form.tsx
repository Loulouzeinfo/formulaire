"use client";
import { useState, type FormEvent } from "react";
import type { Contact, ContactInput } from "@/lib/contacts";
import { Icon } from "./icon";
type Props = {
  contact: Contact | null;
  disabled: boolean;
  busy: boolean;
  onSave: (input: ContactInput) => Promise<boolean>;
  onCancel: () => void;
};
export function ContactForm({
  contact,
  disabled,
  busy,
  onSave,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ContactInput>(
    contact ?? { nom: "", prenom: "", email: "" },
  );
  const [error, setError] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    if (await onSave(values)) setValues({ nom: "", prenom: "", email: "" });
    else setError(true);
  }
  return (
    <section className="contact-form-panel" aria-labelledby="form-title">
      <span className="form-symbol" aria-hidden="true">
        {contact ? "↗" : "✳"}
      </span>
      <h2 id="form-title">
        {contact ? (
          <>
            Un lien,
            <br />
            <em>mis à jour.</em>
          </>
        ) : (
          <>
            Une rencontre,
            <br />
            <em>ça se garde.</em>
          </>
        )}
      </h2>
      <p className="form-intro">
        {contact
          ? "Ajustez les détails de votre contact."
          : "Quelques détails. Une place dans votre carnet."}
      </p>
      {error && (
        <p role="alert" className="form-error">
          L’enregistrement n’a pas abouti. Vérifiez les champs et votre
          connexion, puis réessayez. Vos informations sont conservées.
        </p>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={disabled || busy}>
          <div className="form-name-grid">
            {(
              [
                ["nom", "Nom", "Dupont", "family-name"],
                ["prenom", "Prénom", "Camille", "given-name"],
              ] as const
            ).map(([name, label, placeholder, autoComplete]) => (
              <div className="form-group" key={name}>
                <label htmlFor={name}>
                  {label}
                  <span>*</span>
                </label>
                <input
                  autoFocus={name === "nom"}
                  id={name}
                  name={name}
                  type="text"
                  required
                  maxLength={100}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  value={values[name]}
                  onChange={(e) =>
                    setValues({ ...values, [name]: e.target.value })
                  }
                  className="field"
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label htmlFor="email">
              Adresse e-mail<span>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="camille@exemple.fr"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              className="field"
            />
          </div>
          <p className="form-required">* Les trois champs sont nécessaires.</p>
          <button type="submit" className="button-primary form-submit">
            <span>
              {busy
                ? "Enregistrement…"
                : contact
                  ? "Enregistrer les modifications"
                  : "Faire une place dans mon cercle"}
            </span>
            <Icon
              name={busy ? "refresh" : "arrow"}
              className={busy ? "is-spinning" : ""}
            />
          </button>
          <button
            type="button"
            className="form-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            Revenir au carnet
          </button>
        </fieldset>
      </form>
    </section>
  );
}
