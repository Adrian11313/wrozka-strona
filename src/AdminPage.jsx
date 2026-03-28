import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function AdminPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [syncingOrderId, setSyncingOrderId] = useState(null);
    const [completingOrderId, setCompletingOrderId] = useState(null);
    const [closingOrderId, setClosingOrderId] = useState(null);
    const [savingNotesOrderId, setSavingNotesOrderId] = useState(null);
    const [notesDrafts, setNotesDrafts] = useState({});
    const [filter, setFilter] = useState("queue");
    const [expandedOrders, setExpandedOrders] = useState({});
    const [activeTab, setActiveTab] = useState("orders");
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sortMode, setSortMode] = useState("newest");

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
                throw new Error(data.error || "Nie udało się pobrać zamówień.");
            }

            const loadedOrders = data.orders || [];
            setOrders(loadedOrders);

            setNotesDrafts((prev) => {
                const next = { ...prev };
                for (const order of loadedOrders) {
                    if (next[order.id] === undefined) {
                        next[order.id] = order.notes || "";
                    }
                }
                return next;
            });
        } catch (err) {
            setError(err.message || "Błąd pobierania danych.");
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/api/admin/stats`, {
                credentials: "include",
            });

            const data = await response.json();

            if (response.status === 401) {
                navigate("/admin-login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Nie udało się pobrać statystyk.");
            }

            setStats(data);
        } catch (err) {
            setError(err.message || "Błąd pobierania statystyk.");
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        let intervalId;

        const init = async () => {
            const ok = await checkAuth();
            if (!ok) return;

            await loadOrders();
            await loadStats();

            intervalId = setInterval(() => {
                loadOrders();
                loadStats();
            }, 10000);
        };

        init();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    const syncOrderPayment = async (orderId) => {
        try {
            setError("");
            setSyncingOrderId(orderId);

            const response = await fetch(
                `${API_BASE}/api/admin/orders/${orderId}/sync-payment`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                navigate("/admin-login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Nie udało się zsynchronizować statusu.");
            }

            await loadOrders();
            await loadStats();
        } catch (err) {
            setError(err.message || "Błąd synchronizacji.");
        } finally {
            setSyncingOrderId(null);
        }
    };

    const completeOrder = async (orderId) => {
        try {
            setError("");
            setCompletingOrderId(orderId);

            const response = await fetch(
                `${API_BASE}/api/admin/orders/${orderId}/complete`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                navigate("/admin-login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Nie udało się oznaczyć zamówienia.");
            }

            await loadOrders();
            await loadStats();
        } catch (err) {
            setError(err.message || "Błąd oznaczania zamówienia.");
        } finally {
            setCompletingOrderId(null);
        }
    };

    const closeOrder = async (orderId) => {
        try {
            setError("");
            setClosingOrderId(orderId);

            const response = await fetch(
                `${API_BASE}/api/admin/orders/${orderId}/close`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                navigate("/admin-login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Nie udało się zamknąć zamówienia.");
            }

            await loadOrders();
            await loadStats();
        } catch (err) {
            setError(err.message || "Błąd zamykania zamówienia.");
        } finally {
            setClosingOrderId(null);
        }
    };

    const saveNotes = async (orderId) => {
        try {
            setError("");
            setSavingNotesOrderId(orderId);

            const response = await fetch(
                `${API_BASE}/api/admin/orders/${orderId}/notes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        notes: notesDrafts[orderId] || "",
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                navigate("/admin-login");
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || "Nie udało się zapisać notatki.");
            }

            await loadOrders();
        } catch (err) {
            setError(err.message || "Błąd zapisu notatki.");
        } finally {
            setSavingNotesOrderId(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/api/admin/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            navigate("/admin-login");
        }
    };

    const handleNotesChange = (orderId, value) => {
        setNotesDrafts((prev) => ({
            ...prev,
            [orderId]: value,
        }));
    };

    const toggleOrder = (orderId) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const shortenText = (text, maxLength = 90) => {
        if (!text) return "Brak pytania";
        if (text.length <= maxLength) return text;
        return `${text.slice(0, maxLength)}...`;
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

    const formatDateTime = (value) => {
        const date = parseOrderDate(value);

        if (!date) {
            return value || "-";
        }

        return new Intl.DateTimeFormat("pl-PL", {
            timeZone: "Europe/Warsaw",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const filteredOrders = useMemo(() => {
        if (filter === "queue") {
            return orders.filter(
                (order) =>
                    (order.payment_status || "").toLowerCase() === "oplacone" &&
                    (order.order_status || "").toLowerCase() !== "zrealizowane" &&
                    (order.order_status || "").toLowerCase() !== "zamkniete"
            );
        }

        if (filter === "all") {
            return orders;
        }

        if (filter === "paid") {
            return orders.filter(
                (order) => (order.payment_status || "").toLowerCase() === "oplacone"
            );
        }

        if (filter === "pending") {
            return orders.filter(
                (order) =>
                    (order.payment_status || "").toLowerCase() === "oczekuje_na_platnosc" &&
                    (order.order_status || "").toLowerCase() !== "zamkniete" &&
                    (order.order_status || "").toLowerCase() !== "zrealizowane"
            );
        }

        if (filter === "done") {
            return orders.filter(
                (order) => (order.order_status || "").toLowerCase() === "zrealizowane"
            );
        }

        if (filter === "closed") {
            return orders.filter(
                (order) => (order.order_status || "").toLowerCase() === "zamkniete"
            );
        }

        return orders;
    }, [orders, filter]);

    const visibleOrders = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        let result = [...filteredOrders];

        if (normalizedSearch) {
            result = result.filter((order) => {
                const haystack = [
                    String(order.id ?? ""),
                    order.customer_name ?? "",
                    order.customer_email ?? "",
                    order.package_name ?? "",
                    order.question ?? "",
                    order.created_at ?? "",
                    order.updated_at ?? "",
                    order.paid_at ?? "",
                ]
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(normalizedSearch);
            });
        }

        result.sort((a, b) => {
            const aCreated = parseOrderDate(a.created_at)?.getTime() ?? 0;
            const bCreated = parseOrderDate(b.created_at)?.getTime() ?? 0;
            const aPaid = parseOrderDate(a.paid_at)?.getTime() ?? aCreated;
            const bPaid = parseOrderDate(b.paid_at)?.getTime() ?? bCreated;

            if (filter === "queue") {
                return aPaid - bPaid;
            }

            if (sortMode === "oldest") {
                return aCreated - bCreated;
            }

            return bCreated - aCreated;
        });

        return result;
    }, [filteredOrders, search, sortMode, filter]);

    const maxOrdersForChart = Math.max(...(stats?.daily_stats?.map((x) => x.orders_count) || [1]), 1);
    const maxRevenueForChart = Math.max(...(stats?.daily_stats?.map((x) => x.revenue) || [1]), 1);
    const maxPackageCount = Math.max(...(stats?.package_breakdown?.map((x) => x.count) || [1]), 1);

    const styles = {
        page: {
            minHeight: "100vh",
            background: "linear-gradient(180deg, #071226 0%, #0b1730 100%)",
            color: "#f8fafc",
            fontFamily: "Arial, sans-serif",
            padding: "28px",
        },
        wrap: {
            maxWidth: "1440px",
            margin: "0 auto",
        },
        hero: {
            marginBottom: "22px",
            padding: "22px 24px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(37,99,235,0.16) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        },
        title: {
            fontSize: "38px",
            fontWeight: 900,
            marginBottom: "8px",
            letterSpacing: "-0.02em",
        },
        subtitle: {
            color: "#cbd5e1",
            fontSize: "15px",
            lineHeight: 1.5,
        },
        toolbar: {
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
            alignItems: "center",
        },
        sectionCard: {
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
            marginBottom: "18px",
        },
        tabsRow: {
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
        },
        button: {
            padding: "11px 16px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(90deg, #7c3aed 0%, #9333ea 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(124,58,237,0.22)",
        },
        logoutBtn: {
            padding: "11px 16px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(220,38,38,0.22)",
        },
        tabBtn: {
            padding: "10px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#172033",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
        },
        tabBtnActive: {
            padding: "10px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 18px rgba(124,58,237,0.25)",
        },
        filterBtn: {
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#182235",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        filterBtnActive: {
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 18px rgba(37,99,235,0.24)",
        },
        toggleBtn: {
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#1e293b",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: "88px",
        },
        syncBtn: {
            padding: "11px 14px",
            borderRadius: "12px",
            border: "none",
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
        },
        completeBtn: {
            padding: "11px 14px",
            borderRadius: "12px",
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
        },
        closeBtn: {
            padding: "11px 14px",
            borderRadius: "12px",
            border: "none",
            background: "#64748b",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
        },
        saveBtn: {
            padding: "11px 14px",
            borderRadius: "12px",
            border: "none",
            background: "#f59e0b",
            color: "#111827",
            fontWeight: 900,
            cursor: "pointer",
        },
        searchInput: {
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#0b1220",
            color: "#fff",
            minWidth: "320px",
            outline: "none",
            fontSize: "14px",
        },
        select: {
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#0b1220",
            color: "#fff",
            outline: "none",
            fontSize: "14px",
        },
        info: {
            marginBottom: "16px",
            color: "#93c5fd",
            fontSize: "15px",
        },
        error: {
            marginBottom: "16px",
            color: "#fca5a5",
            fontWeight: 800,
            fontSize: "15px",
        },
        grid: {
            display: "grid",
            gap: "18px",
        },
        card: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "22px",
            padding: "0",
            background: "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(10,18,34,0.98) 100%)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
            overflow: "hidden",
        },
        cardTop: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "18px",
            flexWrap: "wrap",
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.00) 100%)",
        },
        cardBody: {
            padding: "18px 22px 20px",
        },
        cardDetails: {
            marginTop: "16px",
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(8, 15, 28, 0.78)",
            border: "1px solid rgba(255,255,255,0.06)",
        },
        id: {
            fontSize: "24px",
            fontWeight: 900,
            color: "#fde68a",
            marginBottom: "4px",
            letterSpacing: "-0.02em",
        },
        subId: {
            color: "#93c5fd",
            fontSize: "13px",
            fontWeight: 800,
            marginBottom: "8px",
        },
        email: {
            color: "#cbd5e1",
            fontSize: "14px",
        },
        queueBadge: {
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
            padding: "7px 12px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
            color: "#111827",
            fontSize: "12px",
            fontWeight: 900,
            boxShadow: "0 10px 18px rgba(245,158,11,0.20)",
        },
        statusWrap: {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
        },
        badgePending: {
            background: "#78350f",
            color: "#fde68a",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
        },
        badgePaid: {
            background: "#14532d",
            color: "#bbf7d0",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
        },
        badgeDone: {
            background: "#1d4ed8",
            color: "#dbeafe",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
        },
        badgeClosed: {
            background: "#475569",
            color: "#e2e8f0",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
        },
        badgeOther: {
            background: "#374151",
            color: "#e5e7eb",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
        },
        summaryGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
        },
        miniCard: {
            padding: "14px 14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
        },
        miniLabel: {
            color: "#93c5fd",
            fontWeight: 700,
            fontSize: "12px",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
        },
        miniValue: {
            color: "#f8fafc",
            fontSize: "15px",
            lineHeight: 1.45,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
        },
        empty: {
            color: "#94a3b8",
            fontStyle: "italic",
        },
        actions: {
            marginTop: "16px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
        },
        notesBox: {
            marginTop: "16px",
            padding: "16px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: "10px",
        },
        notesHeader: {
            color: "#c4b5fd",
            fontWeight: 800,
            fontSize: "14px",
        },
        textarea: {
            width: "100%",
            minHeight: "120px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#0b1220",
            color: "#f8fafc",
            padding: "14px",
            fontSize: "14px",
            boxSizing: "border-box",
            resize: "vertical",
        },
        statsGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
        },
        statCard: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "18px",
            background: "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(12,19,33,0.98) 100%)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
        },
        statLabel: {
            color: "#93c5fd",
            fontSize: "13px",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 700,
        },
        statValue: {
            fontSize: "30px",
            fontWeight: 900,
            color: "#fde68a",
        },
        chartWrap: {
            display: "grid",
            gap: "16px",
        },
        chartCard: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "18px",
            background: "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(12,19,33,0.98) 100%)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
        },
        chartTitle: {
            fontSize: "20px",
            fontWeight: 800,
            marginBottom: "14px",
        },
        barList: {
            display: "grid",
            gap: "10px",
        },
        barRow: {
            display: "grid",
            gridTemplateColumns: "140px 1fr 90px",
            gap: "10px",
            alignItems: "center",
        },
        barTrack: {
            width: "100%",
            height: "12px",
            borderRadius: "999px",
            background: "#1f2937",
            overflow: "hidden",
        },
        barFill: {
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #7c3aed 0%, #3b82f6 100%)",
        },
        smallValue: {
            textAlign: "right",
            color: "#cbd5e1",
            fontSize: "14px",
        },
    };

    const renderPaymentBadge = (status) => {
        const normalized = (status || "").toLowerCase();

        if (normalized === "oplacone") {
            return <span style={styles.badgePaid}>OPŁACONE</span>;
        }

        if (normalized === "oczekuje_na_platnosc") {
            return <span style={styles.badgePending}>OCZEKUJE NA PŁATNOŚĆ</span>;
        }

        return <span style={styles.badgeOther}>{status || "BRAK"}</span>;
    };

    const renderOrderBadge = (status) => {
        const normalized = (status || "").toLowerCase();

        if (normalized === "zrealizowane") {
            return <span style={styles.badgeDone}>ZREALIZOWANE</span>;
        }

        if (normalized === "zamkniete") {
            return <span style={styles.badgeClosed}>ZAMKNIĘTE</span>;
        }

        return <span style={styles.badgeOther}>{status || "NOWE"}</span>;
    };

    const filterButtons = [
        { key: "queue", label: "Kolejka" },
        { key: "pending", label: "Oczekuje na płatność" },
        { key: "paid", label: "Opłacone" },
        { key: "done", label: "Zrealizowane" },
        { key: "closed", label: "Zamknięte" },
        { key: "all", label: "Wszystkie" },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.wrap}>
                <div style={styles.hero}>
                    <div style={styles.title}>Panel admina</div>
                    <div style={styles.subtitle}>
                        Zarządzanie zamówieniami, kolejką, płatnościami i notatkami roboczymi.
                    </div>
                </div>

                <div style={styles.sectionCard}>
                    <div style={styles.toolbar}>
                        <button style={styles.button} onClick={loadOrders}>
                            Odśwież zamówienia
                        </button>

                        <button style={styles.button} onClick={loadStats}>
                            Odśwież statystyki
                        </button>

                        <button style={styles.logoutBtn} onClick={handleLogout}>
                            Wyloguj
                        </button>
                    </div>

                    <div style={styles.tabsRow}>
                        <button
                            style={activeTab === "orders" ? styles.tabBtnActive : styles.tabBtn}
                            onClick={() => setActiveTab("orders")}
                        >
                            Zamówienia
                        </button>

                        <button
                            style={activeTab === "stats" ? styles.tabBtnActive : styles.tabBtn}
                            onClick={() => setActiveTab("stats")}
                        >
                            Statystyki
                        </button>
                    </div>
                </div>

                {activeTab === "orders" && (
                    <>
                        <div style={styles.sectionCard}>
                            <div style={styles.toolbar}>
                                {filterButtons.map((item) => (
                                    <button
                                        key={item.key}
                                        style={filter === item.key ? styles.filterBtnActive : styles.filterBtn}
                                        onClick={() => setFilter(item.key)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div style={styles.toolbar}>
                                <input
                                    style={styles.searchInput}
                                    type="text"
                                    placeholder="Szukaj po imieniu, mailu, numerze, pytaniu..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />

                                <select
                                    style={styles.select}
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value)}
                                >
                                    <option value="newest">Najnowsze</option>
                                    <option value="oldest">Najstarsze</option>
                                </select>
                            </div>

                            <div style={styles.info}>
                                Zamówienia w tym widoku: <b>{visibleOrders.length}</b> • Wszystkie w systemie: {orders.length}
                            </div>

                            {error && <div style={styles.error}>{error}</div>}
                            {loading && <div style={styles.info}>Ładowanie danych...</div>}
                        </div>

                        <div style={styles.grid}>
                            {visibleOrders.map((order, index) => {
                                const isExpanded = !!expandedOrders[order.id];
                                const queuePosition = filter === "queue" ? index + 1 : null;

                                const paymentStatus = (order.payment_status || "").toLowerCase();
                                const orderStatus = (order.order_status || "").toLowerCase();

                                const canSyncPayment =
                                    paymentStatus !== "oplacone" &&
                                    orderStatus !== "zamkniete" &&
                                    orderStatus !== "zrealizowane";

                                const canComplete =
                                    paymentStatus === "oplacone" &&
                                    orderStatus !== "zrealizowane" &&
                                    orderStatus !== "zamkniete";

                                const canClose =
                                    paymentStatus !== "oplacone" &&
                                    orderStatus !== "zrealizowane" &&
                                    orderStatus !== "zamkniete";

                                return (
                                    <div key={order.id} style={styles.card}>
                                        <div style={styles.cardTop}>
                                            <div>
                                                {queuePosition !== null && (
                                                    <div style={styles.queueBadge}>
                                                        <span>●</span>
                                                        <span>Pozycja w kolejce: {queuePosition}</span>
                                                    </div>
                                                )}

                                                <div style={styles.id}>{order.customer_name}</div>
                                                <div style={styles.subId}>Zamówienie #{order.id}</div>
                                                <div style={styles.email}>{order.customer_email}</div>
                                            </div>

                                            <div style={styles.statusWrap}>
                                                {renderPaymentBadge(order.payment_status)}
                                                {renderOrderBadge(order.order_status)}

                                                <button
                                                    style={styles.toggleBtn}
                                                    onClick={() => toggleOrder(order.id)}
                                                >
                                                    {isExpanded ? "Zwiń" : "Rozwiń"}
                                                </button>
                                            </div>
                                        </div>

                                        <div style={styles.cardBody}>
                                            <div style={styles.summaryGrid}>
                                                <div style={styles.miniCard}>
                                                    <div style={styles.miniLabel}>Pakiet</div>
                                                    <div style={styles.miniValue}>{order.package_name || "-"}</div>
                                                </div>

                                                <div style={styles.miniCard}>
                                                    <div style={styles.miniLabel}>Pytanie</div>
                                                    <div style={styles.miniValue}>{shortenText(order.question)}</div>
                                                </div>

                                                <div style={styles.miniCard}>
                                                    <div style={styles.miniLabel}>Data utworzenia</div>
                                                    <div style={styles.miniValue}>{formatDateTime(order.created_at)}</div>
                                                </div>

                                                <div style={styles.miniCard}>
                                                    <div style={styles.miniLabel}>Data opłacenia</div>
                                                    <div style={styles.miniValue}>
                                                        {order.paid_at ? formatDateTime(order.paid_at) : "-"}
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <>
                                                    <div style={styles.cardDetails}>
                                                        <div style={styles.summaryGrid}>
                                                            <div style={styles.miniCard}>
                                                                <div style={styles.miniLabel}>Kwota</div>
                                                                <div style={styles.miniValue}>{order.amount || "-"}</div>
                                                            </div>

                                                            <div style={styles.miniCard}>
                                                                <div style={styles.miniLabel}>Data aktualizacji</div>
                                                                <div style={styles.miniValue}>{formatDateTime(order.updated_at)}</div>
                                                            </div>

                                                            <div style={styles.miniCard}>
                                                                <div style={styles.miniLabel}>ID transakcji Tpay</div>
                                                                <div style={styles.miniValue}>
                                                                    {order.tpay_transaction_id ? (
                                                                        order.tpay_transaction_id
                                                                    ) : (
                                                                        <span style={styles.empty}>Brak</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={styles.miniCard}>
                                                                <div style={styles.miniLabel}>Link płatności</div>
                                                                <div style={styles.miniValue}>
                                                                    {order.tpay_payment_url ? (
                                                                        <a
                                                                            href={order.tpay_payment_url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            style={{ color: "#93c5fd" }}
                                                                        >
                                                                            Otwórz link płatności
                                                                        </a>
                                                                    ) : (
                                                                        <span style={styles.empty}>Brak</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={{ ...styles.miniCard, gridColumn: "1 / -1" }}>
                                                                <div style={styles.miniLabel}>Pełne pytanie</div>
                                                                <div style={styles.miniValue}>
                                                                    {order.question ? (
                                                                        order.question
                                                                    ) : (
                                                                        <span style={styles.empty}>Brak pytania</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={styles.notesBox}>
                                                        <div style={styles.notesHeader}>Notatki wróżki</div>
                                                        <textarea
                                                            style={styles.textarea}
                                                            value={notesDrafts[order.id] ?? ""}
                                                            onChange={(e) => handleNotesChange(order.id, e.target.value)}
                                                            placeholder="Wpisz notatkę wewnętrzną..."
                                                        />

                                                        <div style={styles.actions}>
                                                            {canSyncPayment && (
                                                                <button
                                                                    style={{
                                                                        ...styles.syncBtn,
                                                                        opacity: syncingOrderId === order.id ? 0.7 : 1,
                                                                    }}
                                                                    onClick={() => syncOrderPayment(order.id)}
                                                                    disabled={syncingOrderId === order.id}
                                                                >
                                                                    {syncingOrderId === order.id
                                                                        ? "Synchronizacja..."
                                                                        : "Aktualizuj status"}
                                                                </button>
                                                            )}

                                                            {canComplete && (
                                                                <button
                                                                    style={{
                                                                        ...styles.completeBtn,
                                                                        opacity: completingOrderId === order.id ? 0.7 : 1,
                                                                    }}
                                                                    onClick={() => completeOrder(order.id)}
                                                                    disabled={completingOrderId === order.id}
                                                                >
                                                                    {completingOrderId === order.id
                                                                        ? "Zapisywanie..."
                                                                        : "Oznacz jako zrealizowane"}
                                                                </button>
                                                            )}

                                                            {canClose && (
                                                                <button
                                                                    style={{
                                                                        ...styles.closeBtn,
                                                                        opacity: closingOrderId === order.id ? 0.7 : 1,
                                                                    }}
                                                                    onClick={() => closeOrder(order.id)}
                                                                    disabled={closingOrderId === order.id}
                                                                >
                                                                    {closingOrderId === order.id
                                                                        ? "Zamykanie..."
                                                                        : "Zamknij jako nieopłacone"}
                                                                </button>
                                                            )}

                                                            <button
                                                                style={{
                                                                    ...styles.saveBtn,
                                                                    opacity: savingNotesOrderId === order.id ? 0.7 : 1,
                                                                }}
                                                                onClick={() => saveNotes(order.id)}
                                                                disabled={savingNotesOrderId === order.id}
                                                            >
                                                                {savingNotesOrderId === order.id
                                                                    ? "Zapisywanie..."
                                                                    : "Zapisz notatkę"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {!loading && visibleOrders.length === 0 && (
                                <div style={styles.sectionCard}>
                                    Brak zamówień dla wybranego filtra lub wyszukiwania.
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "stats" && (
                    <>
                        {error && <div style={styles.error}>{error}</div>}
                        {statsLoading && <div style={styles.info}>Ładowanie statystyk...</div>}

                        {stats && (
                            <>
                                <div style={styles.statsGrid}>
                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Zlecenia dziś</div>
                                        <div style={styles.statValue}>{stats.summary.orders_today}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Zlecenia tydzień</div>
                                        <div style={styles.statValue}>{stats.summary.orders_week}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Zlecenia miesiąc</div>
                                        <div style={styles.statValue}>{stats.summary.orders_month}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Opłacone</div>
                                        <div style={styles.statValue}>{stats.summary.paid_count}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Zrealizowane</div>
                                        <div style={styles.statValue}>{stats.summary.done_count}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Kolejka</div>
                                        <div style={styles.statValue}>{stats.summary.queue_count}</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Przychód dziś</div>
                                        <div style={styles.statValue}>{stats.summary.revenue_today} zł</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Przychód tydzień</div>
                                        <div style={styles.statValue}>{stats.summary.revenue_week} zł</div>
                                    </div>

                                    <div style={styles.statCard}>
                                        <div style={styles.statLabel}>Przychód miesiąc</div>
                                        <div style={styles.statValue}>{stats.summary.revenue_month} zł</div>
                                    </div>
                                </div>

                                <div style={styles.chartWrap}>
                                    <div style={styles.chartCard}>
                                        <div style={styles.chartTitle}>Zlecenia per dzień</div>
                                        <div style={styles.barList}>
                                            {stats.daily_stats.map((item) => {
                                                const width = `${(item.orders_count / maxOrdersForChart) * 100}%`;

                                                return (
                                                    <div key={`orders-${item.day}`} style={styles.barRow}>
                                                        <div>{item.day}</div>
                                                        <div style={styles.barTrack}>
                                                            <div style={{ ...styles.barFill, width }} />
                                                        </div>
                                                        <div style={styles.smallValue}>{item.orders_count}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={styles.chartCard}>
                                        <div style={styles.chartTitle}>Przychód per dzień</div>
                                        <div style={styles.barList}>
                                            {stats.daily_stats.map((item) => {
                                                const width = `${(item.revenue / maxRevenueForChart) * 100}%`;

                                                return (
                                                    <div key={`revenue-${item.day}`} style={styles.barRow}>
                                                        <div>{item.day}</div>
                                                        <div style={styles.barTrack}>
                                                            <div style={{ ...styles.barFill, width }} />
                                                        </div>
                                                        <div style={styles.smallValue}>{item.revenue} zł</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={styles.chartCard}>
                                        <div style={styles.chartTitle}>Podział pakietów</div>
                                        <div style={styles.barList}>
                                            {stats.package_breakdown.map((item) => {
                                                const width = `${(item.count / maxPackageCount) * 100}%`;

                                                return (
                                                    <div key={item.package_name} style={styles.barRow}>
                                                        <div>{item.package_name}</div>
                                                        <div style={styles.barTrack}>
                                                            <div style={{ ...styles.barFill, width }} />
                                                        </div>
                                                        <div style={styles.smallValue}>{item.count}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}