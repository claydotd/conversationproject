import { FormEvent, useState } from "react";
import { loginAdmin } from "../../lib/api";

export function AdminLogin({
  passwordConfigured,
  onSignedIn,
}: {
  passwordConfigured: boolean;
  onSignedIn: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginAdmin(password);
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
          Edit the live website copy, testimonials, and contact details without
          changing code.
        </p>
        {!passwordConfigured ? (
          <p className="banner">
            Set <code>ADMIN_PASSWORD</code> and{" "}
            <code>ADMIN_SESSION_SECRET</code> in your environment before signing
            in.
          </p>
        ) : null}
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
