"use client";
import { useEffect, useState } from "react";
import { getProviders, signIn, type ClientSafeProvider } from "next-auth/react";
export default function Login() {
  const [providers, setProviders] = useState<Record<
      string,
      ClientSafeProvider
    > | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    getProviders()
      .then((value) => {
        if (alive) {
          setProviders(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (alive) {
          setError("Sign-in configuration could not be loaded.");
          setLoaded(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <main className="login-page dot-field">
      <a className="login-brand" href="/">
        Crypto Alerts ↗
      </a>
      <section className="account-card" aria-labelledby="account-title">
        <span className="eyebrow">OPTIONAL ACCOUNT</span>
        <h1 id="account-title">
          Your next
          <br />
          point of view.
        </h1>
        <p>
          The market terminal is public. Optional provider sign-in is available
          when configured by the app owner.
        </p>
        <div className="provider-buttons">
          {!loaded && <p role="status">Checking sign-in options…</p>}
          {loaded &&
            Object.values(providers || {}).map((provider) => (
              <button
                type="button"
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              >
                Continue with {provider.name} ↗
              </button>
            ))}
          {loaded && !Object.keys(providers || {}).length && (
            <p>
              No sign-in providers are configured. You can use the terminal
              without an account.
            </p>
          )}
          {error && <p role="status">{error}</p>}
        </div>
        <a href="/#terminal" className="pill pill-light">
          Back to terminal ↗
        </a>
        <p className="account-note">
          No email/password registration is implemented in this project.
          Provider sign-in does not restrict access to the public market API.
        </p>
      </section>
    </main>
  );
}
