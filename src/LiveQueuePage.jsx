import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function LiveQueuePage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const parseOrderDate = (value) => {
    if (!value) return null;

    const normalized = String(value).replace(" ", "T");
    const candidate = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
    const date = new Date(candidate);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const loadOrders = async () => {
    try {
      setError("");

      const response = await fetch(`${API_BASE}/api/admin/orders`, {
        credentials: "include",
      });
      const data = await response.json();

      if (response.status === 401) {
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się pobrać kolejki.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Błąd pobierania kolejki.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;

    const init = async () => {
      const ok = await checkAuth();
      if (!ok) return;

      await loadOrders();

      intervalId = setInterval(() => {
        loadOrders();
      }, 10000);
    };

    init();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const queueOrders = useMemo(() => {
    const result = orders.filter((order) => {
      const paymentStatus = (order.payment_status || "").toLowerCase();
      const orderStatus = (order.order_status || "").toLowerCase();

      return (
        paymentStatus === "oplacone" &&
        orderStatus !== "zrealizowane" &&
        orderStatus !== "zamkniete"
      );
    });

    result.sort((a, b) => {
      const aPaid =
        parseOrderDate(a.paid_at)?.getTime() ??
        parseOrderDate(a.created_at)?.getTime() ??
        0;
      const bPaid =
        parseOrderDate(b.paid_at)?.getTime() ??
        parseOrderDate(b.created_at)?.getTime() ??
        0;
      return aPaid - bPaid;
    });

    return result;
  }, [orders]);

  const maskName = (name) => {
    const text = String(name || "").trim();
    if (!text) return "Klient";

    const parts = text.split(/\s+/);
    if (parts.length === 1) return parts[0];

    const first = parts[0];
    const second = parts[1];
    return `${first} ${second[0]}.`;
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #14051f 0%, #1f0a2e 100%)",
      color: "#fff7ed",
      fontFamily: "Arial, sans-serif",
      padding: "24px",
      boxSizing: "border-box",
    },
    wrap: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    hero: {
      borderRadius: "28px",
      padding: "28px",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(168,85,247,0.18) 50%, rgba(236,72,153,0.16) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
      marginBottom: "22px",
    },
    title: {
      fontSize: "42px",
      fontWeight: 900,
      marginBottom: "8px",
      color: "#fde68a",
    },
    subtitle: {
      fontSize: "18px",
      color: "#f5d0fe",
      lineHeight: 1.5,
    },
    infoBar: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
      fontSize: "16px",
      color: "#e9d5ff",
    },
    nextCard: {
      borderRadius: "28px",
      padding: "28px",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
      marginBottom: "20px",
    },
    nextLabel: {
      fontSize: "14px",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#c4b5fd",
      marginBottom: "12px",
      fontWeight: 800,
    },
    nextName: {
      fontSize: "52px",
      fontWeight: 900,
      color: "#fde68a",
      lineHeight: 1.05,
      marginBottom: "12px",
    },
    nextPackage: {
      fontSize: "24px",
      color: "#f5d0fe",
      fontWeight: 700,
    },
    queueList: {
      display: "grid",
      gap: "14px",
    },
    queueItem: {
      display: "grid",
      gridTemplateColumns: "80px 1fr",
      gap: "16px",
      alignItems: "center",
      borderRadius: "22px",
      padding: "18px 20px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    queueIndex: {
      width: "64px",
      height: "64px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
      color: "#1f2937",
      fontWeight: 900,
      fontSize: "24px",
      boxShadow: "0 10px 20px rgba(245,158,11,0.22)",
    },
    queueName: {
      fontSize: "28px",
      fontWeight: 900,
      color: "#fff7ed",
      marginBottom: "4px",
    },
    queuePackage: {
      fontSize: "16px",
      color: "#e9d5ff",
    },
    empty: {
      borderRadius: "22px",
      padding: "22px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "22px",
      color: "#f5d0fe",
      textAlign: "center",
    },
    error: {
      color: "#fecaca",
      fontWeight: 800,
      marginBottom: "16px",
      fontSize: "16px",
    },
    loading: {
      textAlign: "center",
      fontSize: "22px",
      color: "#f5d0fe",
      padding: "40px 20px",
    },
  };

  const nextOrder = queueOrders[0];
  const nextItems = queueOrders.slice(0, 5);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.hero}>
          <div style={styles.title}>Aktualna kolejka</div>
          <div style={styles.subtitle}>
            Widok pod transmisję live — pokazuje kolejność opłaconych zgłoszeń.
          </div>
        </div>

        <div style={styles.infoBar}>
          <div>
            Liczba osób w kolejce: <b>{queueOrders.length}</b>
          </div>
          <div>Odświeżanie automatyczne co 10 sekund</div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {loading && <div style={styles.loading}>Ładowanie kolejki...</div>}

        {!loading && nextOrder && (
          <div style={styles.nextCard}>
            <div style={styles.nextLabel}>Następna osoba</div>
            <div style={styles.nextName}>{maskName(nextOrder.customer_name)}</div>
            <div style={styles.nextPackage}>{nextOrder.package_name || "-"}</div>
          </div>
        )}

        {!loading && nextItems.length > 0 && (
          <div style={styles.queueList}>
            {nextItems.map((order, index) => (
              <div key={order.id} style={styles.queueItem}>
                <div style={styles.queueIndex}>{index + 1}</div>
                <div>
                  <div style={styles.queueName}>{maskName(order.customer_name)}</div>
                  <div style={styles.queuePackage}>{order.package_name || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && nextItems.length === 0 && (
          <div style={styles.empty}>Brak osób w kolejce.</div>
        )}
      </div>
    </div>
  );
}