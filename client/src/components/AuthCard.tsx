import { useState } from "react";

interface AuthCardProps {
  busy: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
}

export default function AuthCard({ busy, onLogin, onSignup }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setPassword("");
  }

  const submit = async () => {
    if (mode === "login") {
      await onLogin(username, password);
      return;
    }

    await onSignup(username, password);
  };

  return (
    <section className="auth-card">
      <div className="auth-card-header">
        <div>
          <div className="eyebrow">Welcome Back</div>
          <h2>Access your workspace.</h2>
        </div>
      </div>

      <p className="auth-copy">Log in to manage your lists and stay on top of your daily tasks.</p>

      <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
        <button className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")} type="button">
          Log in
        </button>
        <button className={mode === "signup" ? "is-active" : ""} onClick={() => switchMode("signup")} type="button">
          Sign up
        </button>
      </div>

      <label className="field">
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="task_captain" />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />
      </label>

      <button className="primary-button" disabled={busy} onClick={submit} type="button">
        {busy ? "Working..." : mode === "login" ? "Enter workspace" : "Create account"}
      </button>

      <div className="auth-footer-note">
        <span />
        <p>{mode === "login" ? "Pick up where you left off." : "Create an account and start fresh."}</p>
      </div>
    </section>
  );
}
