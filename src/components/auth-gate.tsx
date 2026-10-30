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
  const [showPassword, setShowPassword] = useState(false);
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
      setShowPassword(false);
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
      <main className="login-loading">
        <span className="login-loader" aria-hidden="true" />
        <p role="status">Ouverture de votre espace…</p>
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
              className="account-error"
            >
              {error}
            </p>
          )}
        </div>
        <ContactsManager key={session.user.id} environment={environment} />
      </>
    );
  return (
    <main
      className="login-canvas"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--login-pointer-x",
          `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
        );
        event.currentTarget.style.setProperty(
          "--login-pointer-y",
          `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
        );
      }}
    >
      <div className="login-aurora login-aurora-one" aria-hidden="true" />
      <div className="login-aurora login-aurora-two" aria-hidden="true" />
      <div className="login-pointer-glow" aria-hidden="true" />
      <header className="login-topbar">
        <Link href="/" className="login-wordmark" aria-label="Contact, accueil">
          <span className="login-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          contact<span className="login-wordmark-dot">.</span>
        </Link>
        <span className="login-environment">
          <i aria-hidden="true" />
          <span className="login-environment-value">{environment}</span>
          <span className="login-environment-divider" />
          <span className="login-environment-description">ESPACE PERSONNEL</span>
        </span>
      </header>
      <div className="login-stage">
        <section className="login-art-panel" aria-labelledby="login-art-title">
          <div className="login-hero-copy">
            <p className="login-overline">
              <span aria-hidden="true" /> CHAQUE CONNEXION OUVRE UNE POSSIBILITÉ
            </p>
            <h1 id="login-art-title">
              Votre réseau.
              <br />
              <span>Sans limites.</span>
            </h1>
            <p className="login-story-copy">
              Un espace pour vos contacts.
              <br />
              De l’énergie pour vos prochaines rencontres.
            </p>
          </div>
          <div className="login-network" aria-hidden="true">
            <div className="login-network-grid" />
            <div className="login-ring login-ring-one">
              <span />
            </div>
            <div className="login-ring login-ring-two">
              <span />
            </div>
            <div className="login-ring login-ring-three" />
            <div className="login-core">
              <div className="login-core-inner">
                <svg viewBox="0 0 80 80" fill="none">
                  <path
                    d="M51 24a23 23 0 1 0 0 32M51 24l-6 9M51 56l-6-9"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <circle cx="58" cy="40" r="5" fill="currentColor" />
                </svg>
              </div>
            </div>
            <div className="login-network-node login-node-one">
              <span>01</span>
              <i />
            </div>
            <div className="login-network-node login-node-two">
              <span>02</span>
              <i />
            </div>
            <div className="login-network-node login-node-three">
              <span>03</span>
              <i />
            </div>
            <span className="login-spark login-spark-one" />
            <span className="login-spark login-spark-two" />
            <span className="login-spark login-spark-three" />
            <span className="login-network-caption">
              <i />
              VOS LIENS. VOTRE UNIVERS.
            </span>
          </div>
          <div className="login-feature-row">
            <span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="m4 10 4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Simple à retrouver
            </span>
            <span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="m4 10 4 4 8-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Juste à vous
            </span>
          </div>
        </section>
        <section className="login-access-panel" aria-labelledby="login-title">
          <div className="login-form-sheen" aria-hidden="true" />
          <div className="login-form-content">
            <span className="login-access-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 5h6v14h-6M4 12h11m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="login-access-label">VOTRE ESPACE VOUS ATTEND</p>
            <h2 id="login-title">On se reconnecte ?</h2>
            <p className="login-access-copy">
              Retrouvez vos contacts. Créez la suite.
            </p>
            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}
            <form onSubmit={login} className="login-form">
              <fieldset disabled={busy}>
                <div className="login-field-group">
                  <label htmlFor="login-email">Adresse e-mail</label>
                  <div className="login-input-wrap">
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect
                        x="2.5"
                        y="4"
                        width="15"
                        height="12"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="m3 5 7 6 7-6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                    </svg>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="vous@exemple.fr"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>
                <div className="login-field-group">
                  <label htmlFor="login-password">Mot de passe</label>
                  <div className="login-input-wrap">
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M6 8V6a4 4 0 0 1 8 0v2M4 8h12v9H4z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="login-reveal"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      aria-controls="login-password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M1.5 10s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="2.2"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        {showPassword && (
                          <path
                            d="m3 3 14 14"
                            stroke="currentColor"
                            strokeWidth="1.3"
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-submit">
                  <span>
                    {busy ? "Connexion en cours…" : "Ouvrir mon espace"}
                  </span>
                  {busy ? (
                    <span className="login-button-spinner" aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12h14m-5-5 5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </fieldset>
            </form>
            <div className="login-private-note">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="m10 2 6 2v5c0 4-6 8-6 8s-6-4-6-8V4z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="m7 9 2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <span>Votre carnet. Votre compte. Votre espace.</span>
            </div>
          </div>
        </section>
      </div>
      <footer className="login-footer">
        <span>contact. — L’humain, au centre.</span>
        <span>
          <i aria-hidden="true" />
          PENSÉ POUR VOS CONNEXIONS
        </span>
      </footer>
    </main>
  );
}
