import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function LiveQueueOverlayPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const loadQueue = async () => {
    try {
      setError("");

      const response = await fetch(`${API_BASE}/api/live-queue`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się pobrać kolejki.");
      }

      setOrders(data.queue || []);
      setLastUpdate(
        new Intl.DateTimeFormat("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    } catch (err) {
      setError(err.message || "Błąd pobierania kolejki.");
    }
  };

  useEffect(() => {
    let intervalId;

    loadQueue();

    intervalId = setInterval(() => {
      loadQueue();
    }, 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const visibleOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const nextOrder = visibleOrders[0];

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

  const styles = {
    page: {
      width: "100%",
      height: "100vh",
      background: "transparent",
      margin: 0,
      padding: "54px 42px",
      boxSizing: "border-box",
      fontFamily:
        "Inter, Arial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#ffffff",
      overflow: "hidden",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    overlay: {
      width: "100%",
      maxWidth: "620px",
      display: "grid",
      gap: "22px",
    },
    topBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      width: "fit-content",
      padding: "10px 16px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.28)",
      border: "1px solid rgba(255,255,255,0.18)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
    },
    liveDot: {
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      background: "#fb7185",
      boxShadow: "0 0 18px rgba(251,113,133,0.95)",
    },
    topBadgeText: {
      fontSize: "17px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "#ffffff",
      textShadow: "0 4px 14px rgba(0,0,0,0.75)",
    },
    titleBox: {
      display: "grid",
      gap: "8px",
    },
    title: {
      fontSize: "64px",
      lineHeight: 0.95,
      fontWeight: 1000,
      color: "#fde68a",
      letterSpacing: "-0.04em",
      textShadow:
        "0 4px 0 rgba(0,0,0,0.24), 0 10px 32px rgba(0,0,0,0.85)",
    },
    subtitle: {
      fontSize: "24px",
      lineHeight: 1.22,
      fontWeight: 800,
      color: "#f5d0fe",
      textShadow: "0 6px 22px rgba(0,0,0,0.85)",
    },
    metaRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    metaPill: {
      width: "fit-content",
      padding: "8px 13px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.28)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: 800,
      textShadow: "0 4px 14px rgba(0,0,0,0.7)",
    },
    nextBox: {
      display: "grid",
      gap: "8px",
      paddingTop: "8px",
    },
    nextLabel: {
      fontSize: "18px",
      fontWeight: 1000,
      letterSpacing: "0.09em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      textShadow: "0 5px 18px rgba(0,0,0,0.85)",
    },
    nextName: {
      fontSize: "76px",
      lineHeight: 0.95,
      fontWeight: 1000,
      color: "#ffffff",
      letterSpacing: "-0.04em",
      textShadow:
        "0 5px 0 rgba(0,0,0,0.22), 0 12px 36px rgba(0,0,0,0.88)",
    },
    nextPackage: {
      width: "fit-content",
      padding: "10px 16px",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, rgba(245,158,11,0.92) 0%, rgba(251,191,36,0.92) 100%)",
      color: "#241005",
      fontSize: "20px",
      lineHeight: 1.1,
      fontWeight: 1000,
      boxShadow: "0 12px 34px rgba(245,158,11,0.25)",
    },
    list: {
      display: "grid",
      gap: "13px",
      marginTop: "4px",
    },
    row: {
      display: "grid",
      gridTemplateColumns: "62px 1fr",
      gap: "14px",
      alignItems: "center",
      minHeight: "72px",
    },
    index: {
      width: "62px",
      height: "62px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "30px",
      fontWeight: 1000,
      color: "#16051f",
      background:
        "linear-gradient(135deg, #fde68a 0%, #f59e0b 55%, #fb7185 100%)",
      boxShadow:
        "0 5px 0 rgba(0,0,0,0.25), 0 12px 30px rgba(0,0,0,0.45)",
    },
    rowText: {
      display: "grid",
      gap: "3px",
    },
    rowName: {
      fontSize: "34px",
      lineHeight: 1,
      fontWeight: 1000,
      color: "#fff7ed",
      letterSpacing: "-0.025em",
      textShadow: "0 6px 22px rgba(0,0,0,0.86)",
    },
    rowPackage: {
      fontSize: "17px",
      lineHeight: 1.2,
      fontWeight: 800,
      color: "#f5d0fe",
      textShadow: "0 5px 18px rgba(0,0,0,0.85)",
    },
    empty: {
      marginTop: "16px",
      fontSize: "36px",
      lineHeight: 1.1,
      fontWeight: 1000,
      color: "#fde68a",
      textShadow:
        "0 5px 0 rgba(0,0,0,0.24), 0 12px 34px rgba(0,0,0,0.85)",
    },
    emptySub: {
      marginTop: "8px",
      fontSize: "20px",
      fontWeight: 800,
      color: "#f5d0fe",
      textShadow: "0 6px 22px rgba(0,0,0,0.85)",
    },
    error: {
      fontSize: "18px",
      fontWeight: 900,
      color: "#fecaca",
      textShadow: "0 5px 18px rgba(0,0,0,0.85)",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div>
          <div style={styles.topBadge}>
            <span style={styles.liveDot} />
            <span style={styles.topBadgeText}>Live queue</span>
          </div>
        </div>

        <div style={styles.titleBox}>
          <div style={styles.title}>Kolejka</div>
          <div style={styles.subtitle}>Kto jest następny do wróżby?</div>

          <div style={styles.metaRow}>
            <div style={styles.metaPill}>Osób w kolejce: {orders.length}</div>
            {lastUpdate && (
              <div style={styles.metaPill}>Aktualizacja: {lastUpdate}</div>
            )}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {nextOrder ? (
          <>
            <div style={styles.nextBox}>
              <div style={styles.nextLabel}>Następna osoba</div>
              <div style={styles.nextName}>{maskName(nextOrder.customer_name)}</div>
              <div style={styles.nextPackage}>{nextOrder.package_name || "-"}</div>
            </div>

            <div style={styles.list}>
              {visibleOrders.map((order, index) => (
                <div key={order.id} style={styles.row}>
                  <div style={styles.index}>{index + 1}</div>

                  <div style={styles.rowText}>
                    <div style={styles.rowName}>{maskName(order.customer_name)}</div>
                    <div style={styles.rowPackage}>{order.package_name || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div style={styles.empty}>Brak osób w kolejce</div>
            <div style={styles.emptySub}>
              Zadaj pytanie i opłać usługę, aby wskoczyć na listę.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
