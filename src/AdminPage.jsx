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
                    (order.order_status || "").toLowerCase() !== "zrealizowane"
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
                (order) => (order.payment_status || "").toLowerCase() === "oczekuje_na_platnosc"
            );
        }

        if (filter === "done") {
            return orders.filter(
                (order) => (order.order_status || "").toLowerCase() === "zrealizowane"
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
                ]
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(normalizedSearch);
            });
        }

        result.sort((a, b) => {
            const aCreated = parseOrderDate(a.created_at)?.getTime() ?? 0;
            const bCreated = parseOrderDate(b.created_at)?.getTime() ?? 0;
            const aUpdated = parseOrderDate(a.updated_at)?.getTime() ?? aCreated;
            const bUpdated = parseOrderDate(b.updated_at)?.getTime() ?? bCreated;

            if (filter === "queue") {
                return aUpdated - bUpdated;
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
            background: "#0f172a",
            color: "#f8fafc",
            fontFamily: "Arial, sans-serif",
            padding: "24px",
        },
        wrap: {
            maxWidth: "1400px",
            margin: "0 auto",
        },
        title: {
            fontSize: "36px",
            fontWeight: 900,
            marginBottom: "8px",
        },
        subtitle: {
            color: "#cbd5e1",
            marginBottom: "24px",
        },
        toolbar: {
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
            alignItems: "center",
        },
        tabsRow: {
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
        },
        button: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        logoutBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#dc2626",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        tabBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#1f2937",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        tabBtnActive: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        filterBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#1f2937",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        filterBtnActive: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        toggleBtn: {
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#1e293b",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: "88px",
        },
        syncBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        completeBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#16a34a",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
        },
        saveBtn: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#f59e0b",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
        },
        searchInput: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#0b1220",
            color: "#fff",
            minWidth: "280px",
            outline: "none",
            fontSize: "14px",
        },
        select: {
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#0b1220",
            color: "#fff",
            outline: "none",
            fontSize: "14px",
        },
        info: {
            marginBottom: "16px",
            color: "#93c5fd",
        },
        error: {
            marginBottom: "16px",
            color: "#fca5a5",
            fontWeight: 700,
        },
        grid: {
            display: "grid",
            gap: "16px",
        },
        card: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "18px",
            background: "#111827",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        },
        topRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "12px",
        },
        id: {
            fontSize: "22px",
            fontWeight: 900,
            color: "#fde68a",
            marginBottom: "6px",
        },
        subId: {
            color: "#93c5fd",
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "6px",
        },
        email: {
            color: "#cbd5e1",
            fontSize: "14px",
        },
        statusWrap: {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
        },
        badgePending: {
            background: "#78350f",
            color: "#fde68a",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
        },
        badgePaid: {
            background: "#14532d",
            color: "#bbf7d0",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
        },
        badgeDone: {
            background: "#1d4ed8",
            color: "#dbeafe",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
        },
        badgeOther: {
            background: "#374151",
            color: "#e5e7eb",
            padding: "6px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
        },
        rows: {
            display: "grid",
            gap: "8px",
        },
        row: {
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "10px",
            alignItems: "start",
        },
        label: {
            color: "#93c5fd",
            fontWeight: 700,
            fontSize: "14px",
        },
        value: {
            color: "#f8fafc",
            fontSize: "14px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
        },
        empty: {
            color: "#cbd5e1",
            fontStyle: "italic",
        },
        actions: {
            marginTop: "14px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
        },
        notesBox: {
            marginTop: "14px",
            display: "grid",
            gap: "10px",
        },
        textarea: {
            width: "100%",
            minHeight: "90px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "#0b1220",
            color: "#f8fafc",
            padding: "12px",
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
            borderRadius: "16px",
            padding: "18px",
            background: "#111827",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        },
        statLabel: {
            color: "#93c5fd",
            fontSize: "14px",
            marginBottom: "8px",
        },
        statValue: {
            fontSize: "28px",
            fontWeight: 900,
            color: "#fde68a",
        },
        chartWrap: {
            display: "grid",
            gap: "16px",
        },
        chartCard: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "18px",
            background: "#111827",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
            background: "#7c3aed",
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

        return <span style={styles.badgeOther}>{status || "nowe"}</span>;
    };

    const filterButtons = [
        { key: "queue", label: "Kolejka" },
        { key: "all", label: "Wszystkie" },
        { key: "pending", label: "Oczekuje na płatność" },
        { key: "paid", label: "Tylko opłacone" },
        { key: "done", label: "Tylko zrealizowane" },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.wrap}>
                <div style={styles.title}>Panel admina</div>
                <div style={styles.subtitle}>
                    Zamówienia, pytania, notatki, statusy płatności i statystyki.
                </div>

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

                {activeTab === "orders" && (
                    <>
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
                            Liczba widocznych zamówień: <b>{visibleOrders.length}</b> / {orders.length}
                        </div>

                        {error && <div style={styles.error}>{error}</div>}
                        {loading && <div style={styles.info}>Ładowanie danych...</div>}

                        <div style={styles.grid}>
                            {visibleOrders.map((order, index) => {
                                const isExpanded = !!expandedOrders[order.id];
                                const queuePosition = filter === "queue" ? index + 1 : null;

                                return (
                                    <div key={order.id} style={styles.card}>
                                        <div style={styles.topRow}>
                                            <div>
                                                {queuePosition !== null && (
                                                    <div style={styles.subId}>Pozycja w kolejce: {queuePosition}</div>
                                                )}

                                                <div style={styles.id}>
                                                    {order.customer_name}
                                                </div>

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

                                        <div style={styles.rows}>
                                            <div style={styles.row}>
                                                <div style={styles.label}>Pakiet</div>
                                                <div style={styles.value}>{order.package_name || "-"}</div>
                                            </div>

                                            <div style={styles.row}>
                                                <div style={styles.label}>Pytanie</div>
                                                <div style={styles.value}>{shortenText(order.question)}</div>
                                            </div>

                                            <div style={styles.row}>
                                                <div style={styles.label}>Data utworzenia</div>
                                                <div style={styles.value}>{formatDateTime(order.created_at)}</div>
                                            </div>

                                            <div style={styles.row}>
                                                <div style={styles.label}>Data aktualizacji</div>
                                                <div style={styles.value}>{formatDateTime(order.updated_at)}</div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <>
                                                <div style={styles.rows}>
                                                    <div style={styles.row}>
                                                        <div style={styles.label}>Kwota</div>
                                                        <div style={styles.value}>{order.amount || "-"}</div>
                                                    </div>

                                                    <div style={styles.row}>
                                                        <div style={styles.label}>Pełne pytanie</div>
                                                        <div style={styles.value}>
                                                            {order.question ? (
                                                                order.question
                                                            ) : (
                                                                <span style={styles.empty}>Brak pytania</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={styles.row}>
                                                        <div style={styles.label}>ID transakcji Tpay</div>
                                                        <div style={styles.value}>
                                                            {order.tpay_transaction_id ? (
                                                                order.tpay_transaction_id
                                                            ) : (
                                                                <span style={styles.empty}>Brak</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={styles.row}>
                                                        <div style={styles.label}>Link płatności</div>
                                                        <div style={styles.value}>
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
                                                </div>

                                                <div style={styles.notesBox}>
                                                    <div style={styles.label}>Notatki wróżki</div>
                                                    <textarea
                                                        style={styles.textarea}
                                                        value={notesDrafts[order.id] ?? ""}
                                                        onChange={(e) => handleNotesChange(order.id, e.target.value)}
                                                        placeholder="Wpisz notatkę wewnętrzną..."
                                                    />
                                                </div>

                                                <div style={styles.actions}>
                                                    {(order.payment_status || "").toLowerCase() !== "oplacone" && (
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

                                                    {(order.order_status || "").toLowerCase() !== "zrealizowane" && (
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
                                            </>
                                        )}
                                    </div>
                                );
                            })}

                            {!loading && visibleOrders.length === 0 && (
                                <div style={styles.card}>Brak zamówień dla wybranego filtra lub wyszukiwania.</div>
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