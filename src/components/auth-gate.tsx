"use client";
import Link from "next/link";
import "./auth-gate.css";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ContactsManager } from "./contacts-manager";

export function AuthGate({ environment }: { environment: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const client = getSupabaseBrowserClient();
      const { data } = client.auth.onAuthStateChange((_event, current) => {
        if (active) {
          setSession(current);
          setLoading(false);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
      client.auth
        .getSession()
        .then(({ error }) => {
          if (active && error) {
            setError(
              "Impossible de restaurer votre session. Reconnectez-vous.",
            );
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setError(
              "Impossible de vérifier votre session. Rechargez la page.",
            );
            setLoading(false);
          }
        });
    } catch {
      queueMicrotask(() => {
        if (active) {
          setError(
            "Configuration Supabase indisponible. Vérifiez .env.local puis redémarrez le serveur.",
          );
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error } =
        await getSupabaseBrowserClient().auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (error) {
        setError(
          error.code === "email_not_confirmed"
            ? "Confirmez l’adresse e-mail de votre compte dans Supabase avant de vous connecter."
            : "Connexion impossible. Vérifiez votre e-mail, votre mot de passe et votre connexion Internet.",
        );
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre connexion Internet.");
    } finally {
      setPassword("");
      lock.current = false;
      setBusy(false);
    }
  }

  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut({
        scope: "local",
      });
      if (error) setError("La déconnexion a échoué. Réessayez.");
      else setSession(null);
    } catch {
      setError("La déconnexion a échoué. Réessayez.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p role="status" className="text-slate-600">
          Vérification de votre session…
        </p>
      </main>
    );
  if (session)
    return (
      <>
        <div className="account-bar">
          <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-3 sm:px-10">
            <p className="break-all text-sm text-slate-600">
              Connecté : {session.user.email}
            </p>
            <button
              className="button-secondary"
              onClick={() => void logout()}
              disabled={busy}
            >
              {busy ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="px-5 pb-3 text-center text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        <ContactsManager key={session.user.id} environment={environment} />
      </>
    );
  return (
    <main className="login-canvas">
      <section
        className="login-art-panel"
        aria-label="Votre carnet de contacts"
      >
        <div className="login-art-topline">
          <Link
            href="/"
            className="login-wordmark"
            aria-label="Contact, accueil"
          >
            contact<span>.</span>
          </Link>
          <span className="login-edition">LE CARNET PERSONNEL / 01</span>
        </div>

        <div className="login-editorial">
          <p className="login-overline">
            <span /> LE GOÛT DES BELLES RENCONTRES
          </p>
          <h1>
            Gardez le lien.
            <br />
            <span>Créez la suite.</span>
          </h1>
          <p className="login-story-copy">
            Les rencontres ont quelque chose de précieux.
            <br className="login-desktop-break" /> Offrez-leur un endroit à
            part.
          </p>
        </div>

        <div className="login-sculpture" aria-hidden="true">
          <div className="login-orbit login-orbit-one" />
          <div className="login-orbit login-orbit-two" />
          <div className="login-sphere login-sphere-large" />
          <div className="login-sphere login-sphere-small" />
          <span className="login-art-coordinate login-coordinate-one">
            48° 51′ N
          </span>
          <span className="login-art-coordinate login-coordinate-two">
            TOUT COMMENCE PAR UN LIEN.
          </span>
          <span className="login-plus login-plus-one">+</span>
          <span className="login-plus login-plus-two">+</span>
        </div>

        <div className="login-art-footer">
          <span>Moins de distance. Plus de connexions.</span>
          <span>↗</span>
        </div>
      </section>

      <section className="login-access-panel" aria-labelledby="login-title">
        <div className="login-access-topline">
          <span className="login-mobile-wordmark">contact.</span>
          <span className="login-environment">
            <i />
            {environment}
          </span>
        </div>
        <div className="login-form-content">
          <p className="login-overline login-access-overline">
            VOTRE ESPACE, SIMPLEMENT
          </p>
          <h2 id="login-title">
            À vous de
            <br />
            <span>vous connecter.</span>
          </h2>
          <p className="login-access-copy">
            Retrouvez votre carnet. Et les personnes qui font la différence.
          </p>
          {error && (
            <p role="alert" className="login-error">
              {error}
            </p>
          )}
          <form onSubmit={login} className="login-form">
            <fieldset disabled={busy}>
              <div className="login-field-group">
                <label htmlFor="login-email">
                  Adresse e-mail <span>01</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="vous@exemple.fr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="login-field-group">
                <label htmlFor="login-password">
                  Mot de passe <span>02</span>
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="login-submit">
                <span>
                  {busy ? "Connexion en cours…" : "Entrer dans mon carnet"}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </fieldset>
          </form>
          <div className="login-private-note">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M6 9V6a4 4 0 0 1 8 0v3M5 9h10v8H5z"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle cx="10" cy="13" r="1" fill="currentColor" />
            </svg>
            <p>
              Un carnet personnel.
              <br />
              <span>Vos contacts restent dans votre espace.</span>
            </p>
          </div>
        </div>
        <p className="login-access-footer">
          Conçu pour les liens qui comptent.
        </p>
      </section>
    </main>
  );
}
