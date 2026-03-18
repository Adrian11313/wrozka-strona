import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function AdminLoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          login,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd logowania");
      }

      navigate("/admin");
    } catch (err) {
      setError(err.message || "Błąd logowania");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0f172a",
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },
    card: {
      width: "100%",
      maxWidth: "420px",
      background: "#111827",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    title: {
      fontSize: "30px",
      fontWeight: 900,
      marginBottom: "10px",
    },
    subtitle: {
      color: "#cbd5e1",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#0b1220",
      color: "#fff",
      boxSizing: "border-box",
      marginBottom: "12px",
      outline: "none",
      fontSize: "14px",
    },
    button: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "none",
      background: "#7c3aed",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
    },
    error: {
      color: "#fca5a5",
      marginBottom: "12px",
      fontWeight: 700,
    },
    note: {
      marginTop: "14px",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>Logowanie admina</div>
        <div style={styles.subtitle}>Panel wróżki Kamelii</div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <input
            style={styles.input}
            placeholder="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div style={styles.note}>
          Dostęp tylko dla administratora panelu.
        </div>
      </div>
    </div>
  );
}