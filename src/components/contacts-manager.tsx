"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Icon } from "./icon";
import { ContactForm } from "./contact-form";
import {
  readContacts,
  saveContact,
  deleteContact,
  type Contact,
  type ContactInput,
} from "@/lib/contacts";

const subscribeViewport = (notify: () => void) => {
  const query = window.matchMedia("(max-width: 600px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const mobileSnapshot = () => window.matchMedia("(max-width: 600px)").matches;
const serverSnapshot = () => false;

type Notice = { kind: "success" | "error"; text: string };
export function ContactsManager({ environment }: { environment: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const lock = useRef(false);
  const editor = useRef<HTMLDialogElement>(null);
  const deletion = useRef<HTMLDialogElement>(null);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "cards" | null>(null);
  const mobile = useSyncExternalStore(
    subscribeViewport,
    mobileSnapshot,
    serverSnapshot,
  );
  const presentation = view ?? (mobile ? "cards" : "list");
  const refresh = useCallback(async (announce = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      setContacts(await readContacts());
      setReady(true);
      if (announce)
        setNotice({
          kind: "success",
          text: "La liste des contacts est à jour.",
        });
    } catch {
      setReady(false);
      setNotice({
        kind: "error",
        text: "Impossible de charger les contacts Supabase. Vérifiez votre connexion puis cliquez sur Actualiser.",
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    readContacts()
      .then((data) => {
        if (active) {
          setContacts(data);
          setReady(true);
          setBusy(false);
        }
      })
      .catch(() => {
        if (active) {
          setBusy(false);
          setNotice({
            kind: "error",
            text: "Impossible de charger les contacts Supabase. Vérifiez votre connexion puis cliquez sur Actualiser.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  function cancel() {
    editor.current?.close();
    setEditing(null);
    setVersion((v) => v + 1);
  }
  function openEditor(contact: Contact | null = null) {
    setEditing(contact);
    setVersion((v) => v + 1);
    editor.current?.showModal();
  }
  async function save(input: ContactInput) {
    if (lock.current || !ready) return false;
    lock.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const saved = await saveContact(input, editing?.id);
      setContacts((current) =>
        editing
          ? current.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...current],
      );
      setNotice({
        kind: "success",
        text: editing
          ? "Le contact a été modifié."
          : "Le contact a été enregistré.",
      });
      cancel();
      return true;
    } catch (e) {
      setNotice({
        kind: "error",
        text:
          e instanceof Error
            ? e.message
            : "Impossible d’enregistrer le contact.",
      });
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function askDelete(contact: Contact) {
    setPendingDelete(contact);
    setDeleteError(null);
    deletion.current?.showModal();
  }
  function cancelDelete() {
    deletion.current?.close();
    setPendingDelete(null);
    setDeleteError(null);
  }
  async function remove(c: Contact) {
    if (lock.current || !ready) return;
    lock.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await deleteContact(c.id);
      setContacts((current) => current.filter((item) => item.id !== c.id));
      if (editing?.id === c.id) cancel();
      cancelDelete();
      setNotice({ kind: "success", text: "Le contact a été supprimé." });
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Impossible de supprimer ce contact.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const search = query.trim().toLocaleLowerCase("fr");
  const visible = contacts.filter((c) =>
    `${c.nom} ${c.prenom} ${c.email}`.toLocaleLowerCase("fr").includes(search),
  );
  return (
    <div className="studio">
      <header className="studio-header">
        <Link href="/" className="studio-brand" aria-label="Contact, accueil">
          <span className="brand-symbol" aria-hidden="true">
            ✳
          </span>
          contact<span>.</span>
        </Link>
        <div className="studio-header-middle">
          <span className="tiny-square" /> UN PEU PLUS PROCHE.
        </div>
        <span className="environment-pill">
          <span className="status-dot" />
          {environment}
        </span>
      </header>
      <main>
        <section className="studio-hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="studio-kicker">
              VOTRE CARNET, RÉINVENTÉ <span>ÉD. 01</span>
            </p>
            <h1 id="page-title">
              Les liens
              <br />
              <em>qui comptent.</em>
              <span className="title-period">●</span>
            </h1>
            <p className="hero-description">
              Des noms, des rencontres, des possibilités.
              <br />
              Tout votre monde, dans un espace à vous.
            </p>
            <button
              className="button-primary hero-button"
              disabled={!ready || busy}
              onClick={() => openEditor()}
            >
              <Icon name="plus" />
              Ajouter un contact
              <span className="button-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-core">
              <span>c.</span>
            </div>
            <div className="art-bead bead-one" />
            <div className="art-bead bead-two" />
            <div className="art-bead bead-three" />
            <span className="art-caption">
              LES BELLES RENCONTRES
              <br />
              NE SE PERDENT PAS.
            </span>
            <span className="art-coordinate">48°51′ N — 02°21′ E</span>
          </div>
        </section>
        <section
          className="collection"
          aria-labelledby="contacts-title"
          aria-busy={busy}
        >
          <div className="collection-heading">
            <div className="collection-title">
              <span className="section-index">01 /</span>
              <h2 id="contacts-title">
                Votre cercle
                <span className="collection-count">
                  {ready ? contacts.length.toString().padStart(2, "0") : "—"}
                </span>
              </h2>
            </div>
            <p>De la première rencontre au prochain échange.</p>
          </div>
          {notice && (
            <div
              role={notice.kind === "error" ? "alert" : "status"}
              className={`studio-notice ${notice.kind}`}
            >
              <Icon name={notice.kind === "error" ? "info" : "check"} />
              {notice.text}
              <button
                aria-label="Fermer le message"
                onClick={() => setNotice(null)}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
          <div className="collection-toolbar">
            <div className="search-wrap">
              <Icon name="search" />
              <label htmlFor="search" className="sr-only">
                Rechercher un contact
              </label>
              <input
                id="search"
                type="search"
                placeholder="Un nom, un prénom, un e-mail…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd aria-hidden="true">RECHERCHER</kbd>
            </div>
            <div className="toolbar-actions">
              <button
                className="refresh-button"
                disabled={busy}
                onClick={() => void refresh(true)}
              >
                <Icon name="refresh" className={busy ? "is-spinning" : ""} />
                <span>{busy ? "Actualisation" : "Actualiser"}</span>
              </button>
              <div
                className="view-switch"
                role="group"
                aria-label="Présentation des contacts"
              >
                <button
                  className={presentation === "list" ? "active" : ""}
                  aria-pressed={presentation === "list"}
                  aria-label="Vue liste"
                  onClick={() => setView("list")}
                >
                  <Icon name="list" />
                </button>
                <button
                  className={presentation === "cards" ? "active" : ""}
                  aria-pressed={presentation === "cards"}
                  aria-label="Vue cartes"
                  onClick={() => setView("cards")}
                >
                  <Icon name="grid" />
                </button>
              </div>
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="studio-empty">
              <div className="empty-art" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="studio-kicker">
                {!ready
                  ? "UN PETIT INSTANT"
                  : search
                    ? "ON CHERCHE ENCORE ?"
                    : "TOUT COMMENCE PAR UN BONJOUR"}
              </p>
              <h3>
                {!ready
                  ? notice?.kind === "error"
                    ? "Le carnet est indisponible."
                    : "Votre cercle prend place…"
                  : search
                    ? "Pas encore de correspondance."
                    : "La première rencontre vous attend."}
              </h3>
              <p>
                {!ready
                  ? notice?.kind === "error"
                    ? "Réessayez avec le bouton Actualiser."
                    : "Nous retrouvons vos contacts."
                  : search
                    ? "Essayez un autre nom ou une autre adresse e-mail."
                    : "Ajoutez votre premier contact. Le reste, c’est une histoire de liens."}
              </p>
              {ready && !search && (
                <button className="empty-add" onClick={() => openEditor()}>
                  Faire le premier pas <span aria-hidden="true">↗</span>
                </button>
              )}
              {search && (
                <button className="empty-add" onClick={() => setQuery("")}>
                  Effacer la recherche <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          ) : presentation === "cards" ? (
            <div className="contact-grid">
              {visible.map((c, i) => (
                <article key={c.id} className="person-card">
                  <div className="person-card-top">
                    <span
                      className={`person-avatar tone-${i % 4}`}
                      aria-hidden="true"
                    >
                      {c.prenom.slice(0, 1)}
                      {c.nom.slice(0, 1)}
                    </span>
                    <span className="person-number">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h3>
                    {c.prenom} <span>{c.nom}</span>
                  </h3>
                  <a className="person-email" href={`mailto:${c.email}`}>
                    {c.email}
                    <Icon name="arrow" />
                  </a>
                  <div className="person-card-footer">
                    <time dateTime={c.created_at}>
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </time>
                    <div className="row-actions">
                      <button
                        aria-label={`Modifier ${c.prenom} ${c.nom}`}
                        title="Modifier"
                        disabled={busy || !ready}
                        onClick={() => openEditor(c)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="delete-button"
                        aria-label={`Supprimer ${c.prenom} ${c.nom}`}
                        title="Supprimer"
                        disabled={busy || !ready}
                        onClick={() => askDelete(c)}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                  <details className="contact-id">
                    <summary>Identifiant</summary>
                    <span>{c.id}</span>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="contact-table-wrap">
              <table className="contact-table">
                <caption className="sr-only">Contacts de votre compte</caption>
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Prénom</th>
                    <th scope="col">Adresse e-mail</th>
                    <th scope="col">Ajouté le</th>
                    <th scope="col">ID</th>
                    <th scope="col" className="actions-heading">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c, i) => (
                    <tr key={c.id}>
                      <td>
                        <div className="person-cell">
                          <span
                            className={`person-avatar tone-${i % 4}`}
                            aria-hidden="true"
                          >
                            {c.prenom.slice(0, 1)}
                            {c.nom.slice(0, 1)}
                          </span>
                          <strong>{c.nom}</strong>
                        </div>
                      </td>
                      <td>{c.prenom}</td>
                      <td>
                        <a className="table-email" href={`mailto:${c.email}`}>
                          {c.email}
                        </a>
                      </td>
                      <td className="table-date">
                        <time dateTime={c.created_at}>
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </time>
                      </td>
                      <td>
                        <span className="table-id" title={c.id}>
                          {c.id.slice(0, 8)}
                          <span className="sr-only"> — {c.id}</span>
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            aria-label={`Modifier ${c.prenom} ${c.nom}`}
                            title="Modifier"
                            disabled={busy || !ready}
                            onClick={() => openEditor(c)}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="delete-button"
                            aria-label={`Supprimer ${c.prenom} ${c.nom}`}
                            title="Supprimer"
                            disabled={busy || !ready}
                            onClick={() => askDelete(c)}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="collection-footer">
            <span>
              {visible.length} contact{visible.length > 1 ? "s" : ""}
              {search ? ` sur ${contacts.length}` : ""}
            </span>
            <span>
              <Icon name="lock" />
              Rien qu’à vous.
            </span>
          </div>
        </section>
        <div className="studio-endnote">
          <span className="endnote-star" aria-hidden="true">
            ✳
          </span>
          <p>
            Un petit carnet.
            <br />
            <em>Un monde de possibilités.</em>
          </p>
          <span className="endnote-signature">
            contact. — CULTIVEZ VOS LIENS.
          </span>
        </div>
      </main>
      <footer className="studio-footer">
        <span>© {new Date().getFullYear()} contact.</span>
        <span>Les gens d’abord. Le reste après.</span>
        <span>{environment}</span>
      </footer>
      <dialog
        ref={deletion}
        className="contact-dialog deletion-dialog"
        aria-labelledby="delete-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else cancelDelete();
        }}
      >
        <div className="dialog-topline">
          <span>PRENDRE UN PEU DE RECUL</span>
          <button
            onClick={cancelDelete}
            disabled={busy}
            aria-label="Annuler la suppression"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="deletion-content">
          <span className="deletion-symbol" aria-hidden="true">
            <Icon name="trash" />
          </span>
          <h2 id="delete-title">
            Retirer ce lien
            <br />
            <em>de votre cercle ?</em>
          </h2>
          <p>
            Le contact{" "}
            <strong>
              {pendingDelete?.prenom} {pendingDelete?.nom}
            </strong>{" "}
            sera supprimé de votre carnet. Cette action est définitive.
          </p>
          {deleteError && (
            <p role="alert" className="form-error">
              {deleteError}
            </p>
          )}
          <div className="deletion-actions">
            <button
              className="button-secondary"
              disabled={busy}
              onClick={cancelDelete}
              autoFocus
            >
              Garder ce contact
            </button>
            <button
              className="button-danger"
              disabled={busy || !pendingDelete}
              onClick={() => {
                if (pendingDelete) void remove(pendingDelete);
              }}
            >
              {busy ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </dialog>
      <dialog
        ref={editor}
        className="contact-dialog"
        aria-labelledby="form-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else cancel();
        }}
      >
        <div className="dialog-topline">
          <span>VOTRE CERCLE S’AGRANDIT</span>
          <button
            onClick={cancel}
            disabled={busy}
            aria-label="Fermer le formulaire"
          >
            <Icon name="close" />
          </button>
        </div>
        <ContactForm
          key={`${editing?.id ?? "new"}-${version}`}
          contact={editing}
          disabled={!ready}
          busy={busy}
          onSave={save}
          onCancel={cancel}
        />
      </dialog>
    </div>
  );
}
