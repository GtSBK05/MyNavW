// web/components/AuthPanel.js
import { useState } from "react";
import { apiLogin, apiRegister } from "@/lib/api";

export default function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fn = mode === "login" ? apiLogin : apiRegister;
      const data = await fn(email, password);

      if (typeof window !== "undefined") {
        localStorage.setItem("mynavw_token", data.token);
        localStorage.setItem("mynavw_user", JSON.stringify(data.user));
      }

      onAuth(data.user);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {/* HEADER SAMA STRUKTUR DENGAN TODO */}
      <header className="app-header prts-header">
        <div className="prts-left">
          <div className="prts-logo">
            <div className="prts-diamond" />
            <span className="prts-logo-text">MNW</span>
          </div>
          <div className="prts-title-block">
            <div className="prts-title-main">MYNAVW</div>
            <div className="prts-title-sub">
              {mode === "login"
                ? "Masuk ke panel MyNavW"
                : "Buat akun baru MyNavW"}
            </div>
          </div>
        </div>

        <div className="prts-right">
          <span className="prts-status-chip">
            {mode === "login" ? "LOGIN" : "REGISTER"}
          </span>
        </div>
      </header>

      {/* MAIN: FORM LOGIN / REGISTER */}
      <main className="app-main auth-main">
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Alamat email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password (min 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk"
              : "Daftar"}
          </button>
        </form>
      </main>

      {/* FOOTER: SWITCH MODE */}
      <footer className="app-footer auth-footer">
        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode("register")}
              >
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode("login")}
              >
                Masuk
              </button>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
