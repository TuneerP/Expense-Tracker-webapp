import { useState } from "react";
import CoinMascot from "./CoinMascot";

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      onAuthed(data);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--navy)" }}>
      <div
        className="w-full max-w-sm pop-in"
        style={{
          background: "var(--paper)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--paper-line)",
          boxShadow: "0 20px 50px rgba(0,0,0,.35)",
          padding: "32px 26px 28px",
        }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <CoinMascot expression="happy" size={64} className="coin-bob" />
          <div
            className="mt-3 font-bold uppercase tracking-widest"
            style={{ color: "var(--copper)", fontSize: 22, letterSpacing: ".14em" }}
          >
            Tuppence
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {mode === "signup" ? "Set up your ledger" : "Welcome back"}
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-[10.5px] uppercase tracking-wider mb-1.5"
              style={{ color: "var(--muted)", letterSpacing: ".1em" }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. priya92"
              autoComplete="username"
              required
              minLength={3}
              className="w-full bg-transparent outline-none text-base py-2"
              style={{ borderBottom: "1.5px solid var(--paper-line)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label
              className="block text-[10.5px] uppercase tracking-wider mb-1.5"
              style={{ color: "var(--muted)", letterSpacing: ".1em" }}
            >
              {mode === "signup" ? "Choose a PIN (4–8 digits)" : "PIN"}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={4}
              maxLength={8}
              className="w-full bg-transparent outline-none text-base py-2 tracking-widest"
              style={{ borderBottom: "1.5px solid var(--paper-line)", color: "var(--ink)" }}
            />
          </div>

          {error && (
            <div className="text-sm" style={{ color: "var(--rust)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full font-bold py-3 rounded-xl text-[15px] disabled:opacity-60"
            style={{ background: "var(--copper)", color: "var(--cream)" }}
          >
            {loading ? "Just a sec…" : mode === "signup" ? "Create my ledger" : "Log in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError("");
          }}
          className="w-full text-center text-xs mt-5"
          style={{ color: "var(--muted)" }}
        >
          {mode === "signup" ? (
            <>Already have a ledger? <span style={{ color: "var(--copper)", fontWeight: 600 }}>Log in</span></>
          ) : (
            <>New here? <span style={{ color: "var(--copper)", fontWeight: 600 }}>Create a ledger</span></>
          )}
        </button>

        <p className="text-center text-[11px] mt-4" style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Your PIN is stored securely and never shown to anyone — not even us.
          Pick something you&apos;ll remember; there&apos;s no email recovery yet.
        </p>
      </div>
    </div>
  );
}
