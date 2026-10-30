"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { AmbientBackdrop, AnimatedCount, ReactiveCard } from "./motion";
import { ContactForm } from "./contact-form";
import {
  readContacts,
  saveContact,
  deleteContact,
  type Contact,
  type ContactInput,
} from "@/lib/contacts";

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
  const [presentation, setView] = useState<"list" | "cards">("cards");
  const [sort, setSort] = useState<"recent" | "name">("recent");
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
  const openEditor = useCallback((contact: Contact | null = null) => {
    setEditing(contact);
    setVersion((v) => v + 1);
    editor.current?.showModal();
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (editor.current?.open || deletion.current?.open) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("search")?.focus();
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      if (
        event.code === "KeyN" &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        ready &&
        !busy
      ) {
        event.preventDefault();
        openEditor();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [ready, busy, openEditor]);
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
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
  const visible = contacts
    .filter((c) =>
      `${c.nom} ${c.prenom} ${c.email}`
        .toLocaleLowerCase("fr")
        .includes(search),
    )
    .sort((a, b) =>
      sort === "name"
        ? `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr")
        : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
  const now = new Date();
  const addedThisMonth = contacts.filter((c) => {
    const date = new Date(c.created_at);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
  return (
    <div className="studio">
      <AmbientBackdrop />
      <header className="studio-header">
        <Link href="/" className="studio-brand" aria-label="Contact, accueil">
          <span className="brand-symbol" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          contact<span className="brand-os">/OS</span>
        </Link>
        <a href="#contacts-title" className="header-nav">
          <Icon name="grid" /> Mon répertoire
          <span className="nav-dot" />
        </a>
        <span className="environment-pill">
          <span className="status-dot" />
          {environment}
        </span>
      </header>
      <main>
        <section className="studio-hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="studio-kicker">
              <span className="signal-dot" /> VOTRE RÉSEAU. VOTRE ÉNERGIE.
            </p>
            <h1 id="page-title">
              Toutes vos connexions.
              <br />
              <span>
                Un nouveau <em>flow.</em>
              </span>
            </h1>
            <p className="hero-description">
              Les bonnes personnes, au bon endroit.
              <br />
              Un espace fluide pour faire vivre votre réseau.
            </p>
            <div className="hero-cta-row">
              <button
                className="button-primary hero-button"
                disabled={!ready || busy}
                onClick={() => openEditor()}
              >
                <Icon name="plus" /> Nouveau contact{" "}
                <kbd title="Alt / Option + N">⌥ N</kbd>
              </button>
              <span className="hero-privacy">
                <Icon name="lock" /> Votre espace privé
              </span>
            </div>
          </div>
          <div className="network-art" aria-hidden="true">
            <div className="network-grid" />
            <div className="network-ring network-ring-one" />
            <div className="network-ring network-ring-two" />
            <div className="network-ring network-ring-three" />
            <div className="network-core">
              <span className="core-inner">
                c<span>.</span>
              </span>
            </div>
            <div className="network-node node-one">
              <Icon name="person" />
            </div>
            <div className="network-node node-two">
              <Icon name="person" />
            </div>
            <div className="network-node node-three">
              <Icon name="plus" />
            </div>
            <div className="network-label">
              <span className="signal-dot" /> CONNECTED TO YOU
            </div>
            <div className="network-spark spark-one" />
            <div className="network-spark spark-two" />
          </div>
        </section>
        <div className="metrics-row">
          <ReactiveCard className="metric-card">
            <span className="metric-icon">
              <Icon name="people" />
            </span>
            <div>
              <p>Votre réseau</p>
              <strong>
                {ready ? <AnimatedCount value={contacts.length} /> : "—"}
                <span>contacts</span>
              </strong>
            </div>
            <span className="metric-decoration" aria-hidden="true">
              ↗
            </span>
          </ReactiveCard>
          <ReactiveCard className="metric-card">
            <span className="metric-icon metric-cyan">
              <Icon name="sparkles" />
            </span>
            <div>
              <p>Ce mois-ci</p>
              <strong>
                {ready ? <AnimatedCount value={addedThisMonth} /> : "—"}
                <span>nouveaux liens</span>
              </strong>
            </div>
            <span className="metric-pulse" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </ReactiveCard>
          <div className="metric-note">
            <span className="status-dot" />
            <p>
              {ready ? (
                <>
                  Votre carnet est à jour.
                  <br />
                  <span>Chaque lien a sa place.</span>
                </>
              ) : (
                <>
                  {notice?.kind === "error"
                    ? "Connexion interrompue."
                    : "Connexion à votre espace…"}
                  <br />
                  <span>
                    {notice?.kind === "error"
                      ? "Cliquez sur Actualiser."
                      : "On retrouve vos contacts."}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <section
          className="collection"
          aria-labelledby="contacts-title"
          aria-busy={busy}
        >
          <div className="collection-heading">
            <div className="collection-title">
              <span className="section-index">
                <Icon name="people" />
              </span>
              <h2 id="contacts-title">
                Votre répertoire
                <span className="collection-count">
                  {ready ? contacts.length.toString().padStart(2, "0") : "—"}
                </span>
              </h2>
            </div>
            <button
              className="collection-add"
              disabled={!ready || busy}
              onClick={() => openEditor()}
            >
              <Icon name="plus" />
              Ajouter
            </button>
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
              <kbd aria-hidden="true">⌘ K</kbd>
            </div>
            <div className="toolbar-actions">
              <label className="sort-select">
                <span className="sr-only">Trier les contacts</span>
                <Icon name="sort" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "recent" | "name")}
                >
                  <option value="recent">Plus récents</option>
                  <option value="name">Nom A → Z</option>
                </select>
              </label>
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
                <div />
                <Icon name="people" />
                <span />
              </div>
              <p className="studio-kicker">
                {!ready
                  ? "ON PRÉPARE VOTRE ESPACE"
                  : search
                    ? "AFFINONS LA RECHERCHE"
                    : "VOTRE PROCHAINE CONNEXION COMMENCE ICI"}
              </p>
              <h3>
                {!ready
                  ? notice?.kind === "error"
                    ? "Le carnet est indisponible."
                    : "Votre cercle prend place…"
                  : search
                    ? "Pas encore de correspondance."
                    : "Prêt à élargir votre cercle ?"}
              </h3>
              <p>
                {!ready
                  ? notice?.kind === "error"
                    ? "Réessayez avec le bouton Actualiser."
                    : "Nous retrouvons vos contacts."
                  : search
                    ? "Essayez un autre nom ou une autre adresse e-mail."
                    : "Ajoutez votre premier contact et donnez vie à votre réseau."}
              </p>
              {ready && !search && (
                <button className="empty-add" onClick={() => openEditor()}>
                  Ajouter mon premier contact <span aria-hidden="true">↗</span>
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
                <ReactiveCard key={c.id} className="person-card">
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
                </ReactiveCard>
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
      </main>
      <footer className="studio-footer">
        <Link href="/" className="footer-brand">
          contact/OS
        </Link>
        <span>De vraies connexions. Zéro distraction.</span>
        <span className="footer-version">
          <span className="status-dot" />
          {environment} · v.02
        </span>
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
          <span>GÉRER VOTRE RÉSEAU</span>
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
            Supprimer
            <br />
            <em>ce contact ?</em>
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
          <span>VOTRE RÉSEAU PREND VIE</span>
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
