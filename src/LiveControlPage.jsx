import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function LiveControlPage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    voice_enabled: true,
    show_enabled: true,
    auto_hide_seconds: 0,
    hotkey_show: "F8",
    hotkey_complete: "F9",
    hotkey_hide: "F10",
    hotkey_read_again: "F11",
  });

  const [liveState, setLiveState] = useState(null);
  const [queue, setQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/check-auth`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!data.authenticated) {
        navigate("/admin-login");
        return false;
      }

      return true;
    } catch {
      navigate("/admin-login");
      return false;
    }
  };

  const loadConfig = async () => {
    const response = await fetch(`${API_BASE}/api/admin/live-control-config`, {
      credentials: "include",
    });

    const data = await response.json();

    if (response.status === 401) {
      navigate("/admin-login");
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Nie udało się pobrać konfiguracji.");
    }

    setConfig(data);
  };

  const loadLiveState = async () => {
    const response = await fetch(`${API_BASE}/api/live-question`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nie udało się pobrać stanu live.");
    }

    setLiveState(data);
  };

  const loadQueue = async () => {
    const response = await fetch(`${API_BASE}/api/live-queue`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nie udało się pobrać kolejki.");
    }

    setQueue(data.queue || []);
  };

  const refreshAll = async () => {
    try {
      setError("");

      await Promise.all([loadLiveState(), loadQueue()]);
    } catch (err) {
      setError(err.message || "Błąd odświeżania danych.");
    }
  };

  useEffect(() => {
    let intervalId;

    const init = async () => {
      const ok = await checkAuth();
      if (!ok) return;

      try {
        setError("");

        await loadConfig();
        await refreshAll();

        intervalId = setInterval(() => {
          refreshAll();
        }, 3000);
      } catch (err) {
        setError(err.message || "Błąd uruchamiania pilota live.");
      }
    };

    init();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const normalizeKey = (value) => String(value || "").trim().toUpperCase();

  const runAction = async (actionName, url) => {
    try {
      setError("");
      setMessage("");
      setBusyAction(actionName);

      const response = await fetch(`${API_BASE}${url}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wykonać akcji.");
      }

      setMessage("Wykonano akcję.");
      await refreshAll();
    } catch (err) {
      setError(err.message || "Błąd akcji.");
    } finally {
      setBusyAction("");
    }
  };

  const showNextQuestion = () =>
    runAction("show", "/api/admin/live-question/show-next");

  const completeCurrentQuestion = () =>
    runAction("complete", "/api/admin/live-question/complete-current");

  const hideQuestion = () =>
    runAction("hide", "/api/admin/live-question/hide");

  const readAgain = () =>
    runAction("read", "/api/admin/live-question/read-again");

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = normalizeKey(event.key);

      if (
        key === normalizeKey(config.hotkey_show) ||
        key === normalizeKey(config.hotkey_complete) ||
        key === normalizeKey(config.hotkey_hide) ||
        key === normalizeKey(config.hotkey_read_again)
      ) {
        event.preventDefault();
      }

      if (key === normalizeKey(config.hotkey_show)) {
        showNextQuestion();
      }

      if (key === normalizeKey(config.hotkey_complete)) {
        completeCurrentQuestion();
      }

      if (key === normalizeKey(config.hotkey_hide)) {
        hideQuestion();
      }

      if (key === normalizeKey(config.hotkey_read_again)) {
        readAgain();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config]);

  const saveConfig = async () => {
    try {
      setError("");
      setMessage("");
      setSavingConfig(true);

      const response = await fetch(`${API_BASE}/api/admin/live-control-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zapisać konfiguracji.");
      }

      setConfig(data.config);
      setMessage("Zapisano konfigurację sterowania live.");
    } catch (err) {
      setError(err.message || "Błąd zapisu konfiguracji.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const maskName = (name) => {
    const text = String(name || "").trim();

    if (!text) {
      return "Klient";
    }

    const parts = text.split(/\s+/);

    if (parts.length === 1) {
      return parts[0];
    }

    return `${parts[0]} ${parts[1][0]}.`;
  };

  const currentOrder = liveState?.order || null;
  

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "linear-gradient(180deg, #071226 0%, #0b1730 55%, #070d1a 100%)",
      color: "#f8fafc",
      fontFamily: "Arial, sans-serif",
      padding: "28px",
      boxSizing: "border-box",
    },
    wrap: {
      maxWidth: "1280px",
      margin: "0 auto",
    },
    hero: {
      padding: "24px",
      borderRadius: "24px",
      background:
        "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.16))",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
      marginBottom: "20px",
    },
    title: {
      fontSize: "40px",
      fontWeight: 900,
      marginBottom: "8px",
      color: "#fde68a",
    },
    subtitle: {
      color: "#cbd5e1",
      fontSize: "16px",
      lineHeight: 1.5,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "minmax(320px, 1.2fr) minmax(320px, 0.8fr)",
      gap: "18px",
      alignItems: "start",
    },
    card: {
      borderRadius: "22px",
      background:
        "linear-gradient(180deg, rgba(17,24,39,0.96), rgba(10,18,34,0.98))",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
      padding: "20px",
      marginBottom: "18px",
    },
    cardTitle: {
      fontSize: "22px",
      fontWeight: 900,
      color: "#fde68a",
      marginBottom: "14px",
    },
    currentBox: {
      padding: "18px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      marginBottom: "16px",
    },
    label: {
      color: "#93c5fd",
      fontWeight: 800,
      fontSize: "13px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: "8px",
    },
    bigName: {
      fontSize: "34px",
      fontWeight: 900,
      color: "#ffffff",
      marginBottom: "8px",
    },
    question: {
      fontSize: "18px",
      lineHeight: 1.55,
      color: "#e9d5ff",
      whiteSpace: "pre-wrap",
    },
    buttonsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
    },
    primaryBtn: {
      padding: "18px 18px",
      borderRadius: "16px",
      border: "none",
      background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
      color: "#111827",
      fontSize: "16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 26px rgba(245,158,11,0.22)",
    },
    successBtn: {
      padding: "18px 18px",
      borderRadius: "16px",
      border: "none",
      background: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 26px rgba(34,197,94,0.18)",
    },
    secondaryBtn: {
      padding: "18px 18px",
      borderRadius: "16px",
      border: "none",
      background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 26px rgba(59,130,246,0.18)",
    },
    mutedBtn: {
      padding: "18px 18px",
      borderRadius: "16px",
      border: "none",
      background: "#64748b",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 900,
      cursor: "pointer",
    },
    dangerBtn: {
      padding: "13px 15px",
      borderRadius: "13px",
      border: "none",
      background: "#dc2626",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 900,
      cursor: "pointer",
    },
    hotkey: {
      display: "inline-flex",
      marginLeft: "8px",
      padding: "3px 8px",
      borderRadius: "8px",
      background: "rgba(0,0,0,0.24)",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 900,
    },
    inputGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
    },
    field: {
      display: "grid",
      gap: "7px",
    },
    inputLabel: {
      color: "#93c5fd",
      fontWeight: 800,
      fontSize: "13px",
    },
    input: {
      width: "100%",
      padding: "12px 13px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "#0b1220",
      color: "#fff",
      fontSize: "15px",
      boxSizing: "border-box",
      outline: "none",
    },
    checkboxRow: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      color: "#f8fafc",
      fontWeight: 800,
      marginBottom: "10px",
    },
    queueList: {
      display: "grid",
      gap: "10px",
    },
    queueItem: {
      padding: "13px",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
    },
    queueName: {
      fontSize: "18px",
      fontWeight: 900,
      color: "#fff",
      marginBottom: "4px",
    },
    queuePackage: {
      color: "#c4b5fd",
      fontSize: "14px",
      fontWeight: 800,
    },
    info: {
      padding: "12px 14px",
      borderRadius: "14px",
      background: "rgba(37,99,235,0.16)",
      color: "#bfdbfe",
      fontWeight: 800,
      marginBottom: "14px",
    },
    error: {
      padding: "12px 14px",
      borderRadius: "14px",
      background: "rgba(127,29,29,0.34)",
      color: "#fecaca",
      fontWeight: 900,
      marginBottom: "14px",
    },
    empty: {
      color: "#94a3b8",
      fontStyle: "italic",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.hero}>
          <div style={styles.title}>Pilot live</div>
          <div style={styles.subtitle}>
            Sterowanie pytaniem na transmisji. To okno musi być aktywne, jeżeli
            chcesz używać skrótów klawiaturowych.
          </div>
        </div>

        {message && <div style={styles.info}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.grid}>
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Aktualne pytanie na live</div>

              <div style={styles.currentBox}>
                {currentOrder ? (
                  <>
                    <div style={styles.label}>
                      {liveState?.is_visible ? "Widoczne na live" : "Ukryte"}
                    </div>
                    <div style={styles.bigName}>
                      {maskName(currentOrder.customer_name)}
                    </div>
                    <div style={styles.question}>
                      {currentOrder.question || "Brak wpisanego pytania."}
                    </div>
                  </>
                ) : (
                  <div style={styles.empty}>
                    Brak aktualnie wybranego pytania.
                  </div>
                )}
              </div>

              <div style={styles.buttonsGrid}>
                <button
                  type="button"
                  style={{
                    ...styles.primaryBtn,
                    opacity: busyAction === "show" ? 0.7 : 1,
                  }}
                  onClick={showNextQuestion}
                  disabled={!!busyAction}
                >
                  Pokaż następne
                  <span style={styles.hotkey}>{config.hotkey_show}</span>
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.successBtn,
                    opacity: busyAction === "complete" ? 0.7 : 1,
                  }}
                  onClick={completeCurrentQuestion}
                  disabled={!!busyAction}
                >
                  Zakończ i zrealizuj
                  <span style={styles.hotkey}>{config.hotkey_complete}</span>
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.mutedBtn,
                    opacity: busyAction === "hide" ? 0.7 : 1,
                  }}
                  onClick={hideQuestion}
                  disabled={!!busyAction}
                >
                  Ukryj
                  <span style={styles.hotkey}>{config.hotkey_hide}</span>
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.secondaryBtn,
                    opacity: busyAction === "read" ? 0.7 : 1,
                  }}
                  onClick={readAgain}
                  disabled={!!busyAction}
                >
                  Czytaj ponownie
                  <span style={styles.hotkey}>{config.hotkey_read_again}</span>
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Konfiguracja skrótów i głosu</div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={!!config.show_enabled}
                  onChange={(e) =>
                    handleConfigChange("show_enabled", e.target.checked)
                  }
                />
                Pokazywanie pytania na live włączone
              </label>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={!!config.voice_enabled}
                  onChange={(e) =>
                    handleConfigChange("voice_enabled", e.target.checked)
                  }
                />
                Czytanie pytania głosem włączone
              </label>

              <div style={styles.inputGrid}>
                <div style={styles.field}>
                  <div style={styles.inputLabel}>Pokaż pytanie</div>
                  <input
                    style={styles.input}
                    value={config.hotkey_show || ""}
                    onChange={(e) =>
                      handleConfigChange("hotkey_show", e.target.value)
                    }
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.inputLabel}>Zakończ pytanie</div>
                  <input
                    style={styles.input}
                    value={config.hotkey_complete || ""}
                    onChange={(e) =>
                      handleConfigChange("hotkey_complete", e.target.value)
                    }
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.inputLabel}>Ukryj pytanie</div>
                  <input
                    style={styles.input}
                    value={config.hotkey_hide || ""}
                    onChange={(e) =>
                      handleConfigChange("hotkey_hide", e.target.value)
                    }
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.inputLabel}>Czytaj ponownie</div>
                  <input
                    style={styles.input}
                    value={config.hotkey_read_again || ""}
                    onChange={(e) =>
                      handleConfigChange("hotkey_read_again", e.target.value)
                    }
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.inputLabel}>
                    Auto ukrycie po sekundach, 0 = wyłączone
                  </div>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={config.auto_hide_seconds ?? 0}
                    onChange={(e) =>
                      handleConfigChange(
                        "auto_hide_seconds",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: "14px" }}>
                <button
                  type="button"
                  style={{
                    ...styles.secondaryBtn,
                    opacity: savingConfig ? 0.7 : 1,
                  }}
                  onClick={saveConfig}
                  disabled={savingConfig}
                >
                  {savingConfig ? "Zapisywanie..." : "Zapisz konfigurację"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Następne osoby w kolejce</div>

              <div style={styles.queueList}>
                {queue.slice(0, 8).map((item, index) => (
                  <div key={item.id} style={styles.queueItem}>
                    <div style={styles.queueName}>
                      {index + 1}. {maskName(item.customer_name)}
                    </div>
                    <div style={styles.queuePackage}>
                      {item.package_name || "-"}
                    </div>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div style={styles.empty}>Kolejka jest pusta.</div>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>Adresy do OBS</div>

              <div style={styles.currentBox}>
                <div style={styles.label}>Pergamin pytania</div>
                <div style={styles.question}>
                  /live-question-overlay
                </div>
              </div>

              <div style={styles.currentBox}>
                <div style={styles.label}>Kolejka live</div>
                <div style={styles.question}>
                  /live-queue-overlay
                </div>
              </div>

              <button
                type="button"
                style={styles.dangerBtn}
                onClick={() => navigate("/admin")}
              >
                Wróć do panelu admina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}