import { FormEvent, useState } from "react";
import { loginAdmin } from "../../lib/api";

export function AdminLogin({
  passwordConfigured,
  onSignedIn,
}: {
  passwordConfigured: boolean;
  onSignedIn: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginAdmin(username, password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <h1>Admin</h1>
        <p className="muted">
          This is where you can edit text and images on the live website.
        </p>
        {!passwordConfigured ? (
          <p className="banner">
            Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code>, and{" "}
            <code>ADMIN_SESSION_SECRET</code> in your environment before signing
            in.
          </p>
        ) : null}
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="banner">{error}</p> : null}
        <button type="submit" disabled={submitting || !passwordConfigured}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
