import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const DEFAULT_CONFIG = {
  enabled: true,
  title_text: "Kolejka",
  subtitle_text: "Kto jest następny do wróżby?",
  live_badge_text: "LIVE QUEUE",
  show_live_badge: true,
  show_title: true,
  show_subtitle: true,
  show_queue_count: true,
  show_updated_at: true,
  show_next_person: true,
  show_package_name: true,
  show_position_number: true,
  max_visible_items: 2,
  position_top: 40,
  position_left: 32,
  overlay_width: 340,
  title_font_size: 42,
  subtitle_font_size: 15,
  next_label_font_size: 12,
  next_name_font_size: 36,
  item_name_font_size: 18,
  item_package_font_size: 11,
  badge_font_size: 10,
  line_gap: 8,
  background_opacity: 0,
  text_shadow_enabled: true,
  accent_color: "#f59e0b",
  title_color: "#fde68a",
  text_color: "#ffffff",
  subtitle_color: "#f5d0fe",
  compact_mode: true,
};

export default function LiveQueueOverlayPage() {
  const [orders, setOrders] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const normalizeConfig = (incomingConfig) => ({
    ...DEFAULT_CONFIG,
    ...(incomingConfig || {}),
    enabled: Boolean(incomingConfig?.enabled ?? DEFAULT_CONFIG.enabled),
    show_live_badge: Boolean(
      incomingConfig?.show_live_badge ?? DEFAULT_CONFIG.show_live_badge
    ),
    show_title: Boolean(incomingConfig?.show_title ?? DEFAULT_CONFIG.show_title),
    show_subtitle: Boolean(
      incomingConfig?.show_subtitle ?? DEFAULT_CONFIG.show_subtitle
    ),
    show_queue_count: Boolean(
      incomingConfig?.show_queue_count ?? DEFAULT_CONFIG.show_queue_count
    ),
    show_updated_at: Boolean(
      incomingConfig?.show_updated_at ?? DEFAULT_CONFIG.show_updated_at
    ),
    show_next_person: Boolean(
      incomingConfig?.show_next_person ?? DEFAULT_CONFIG.show_next_person
    ),
    show_package_name: Boolean(
      incomingConfig?.show_package_name ?? DEFAULT_CONFIG.show_package_name
    ),
    show_position_number: Boolean(
      incomingConfig?.show_position_number ?? DEFAULT_CONFIG.show_position_number
    ),
    compact_mode: Boolean(incomingConfig?.compact_mode ?? DEFAULT_CONFIG.compact_mode),
    text_shadow_enabled: Boolean(
      incomingConfig?.text_shadow_enabled ?? DEFAULT_CONFIG.text_shadow_enabled
    ),
    max_visible_items: Number(
      incomingConfig?.max_visible_items ?? DEFAULT_CONFIG.max_visible_items
    ),
    position_top: Number(incomingConfig?.position_top ?? DEFAULT_CONFIG.position_top),
    position_left: Number(
      incomingConfig?.position_left ?? DEFAULT_CONFIG.position_left
    ),
    overlay_width: Number(incomingConfig?.overlay_width ?? DEFAULT_CONFIG.overlay_width),
    title_font_size: Number(
      incomingConfig?.title_font_size ?? DEFAULT_CONFIG.title_font_size
    ),
    subtitle_font_size: Number(
      incomingConfig?.subtitle_font_size ?? DEFAULT_CONFIG.subtitle_font_size
    ),
    next_label_font_size: Number(
      incomingConfig?.next_label_font_size ?? DEFAULT_CONFIG.next_label_font_size
    ),
    next_name_font_size: Number(
      incomingConfig?.next_name_font_size ?? DEFAULT_CONFIG.next_name_font_size
    ),
    item_name_font_size: Number(
      incomingConfig?.item_name_font_size ?? DEFAULT_CONFIG.item_name_font_size
    ),
    item_package_font_size: Number(
      incomingConfig?.item_package_font_size ?? DEFAULT_CONFIG.item_package_font_size
    ),
    badge_font_size: Number(
      incomingConfig?.badge_font_size ?? DEFAULT_CONFIG.badge_font_size
    ),
    line_gap: Number(incomingConfig?.line_gap ?? DEFAULT_CONFIG.line_gap),
    background_opacity: Number(
      incomingConfig?.background_opacity ?? DEFAULT_CONFIG.background_opacity
    ),
  });

  const loadQueue = async () => {
    try {
      setError("");

      const [queueResponse, configResponse] = await Promise.all([
        fetch(`${API_BASE}/api/live-queue`),
        fetch(`${API_BASE}/api/live-queue-config`),
      ]);

      const queueData = await queueResponse.json();

      if (!queueResponse.ok) {
        throw new Error(queueData.error || "Nie udało się pobrać kolejki.");
      }

      setOrders(queueData.queue || []);

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(normalizeConfig(configData));
      }

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
    }, 3000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const safeMaxVisibleItems = Math.max(1, Math.min(Number(config.max_visible_items) || 2, 10));

  const visibleOrders = useMemo(
    () => orders.slice(0, safeMaxVisibleItems),
    [orders, safeMaxVisibleItems]
  );

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

  const textShadow = config.text_shadow_enabled
    ? "0 4px 0 rgba(0,0,0,0.22), 0 10px 28px rgba(0,0,0,0.9)"
    : "none";

  const smallTextShadow = config.text_shadow_enabled
    ? "0 5px 18px rgba(0,0,0,0.85)"
    : "none";

  const overlayBackground =
    Number(config.background_opacity) > 0
      ? `rgba(0, 0, 0, ${Math.max(0, Math.min(config.background_opacity, 1))})`
      : "transparent";

  const styles = {
    page: {
      width: "100%",
      height: "100vh",
      background: "transparent",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
      fontFamily:
        "Inter, Arial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: config.text_color,
      overflow: "hidden",
      position: "relative",
      pointerEvents: "none",
    },

    overlay: {
      position: "absolute",
      top: `${config.position_top}px`,
      left: `${config.position_left}px`,
      width: `${config.overlay_width}px`,
      display: config.enabled ? "grid" : "none",
      gap: `${config.line_gap}px`,
      padding: Number(config.background_opacity) > 0 ? "14px" : 0,
      borderRadius: "22px",
      background: overlayBackground,
      border:
        Number(config.background_opacity) > 0
          ? "1px solid rgba(255,255,255,0.10)"
          : "none",
      backdropFilter: Number(config.background_opacity) > 0 ? "blur(10px)" : "none",
      WebkitBackdropFilter:
        Number(config.background_opacity) > 0 ? "blur(10px)" : "none",
    },

    topBadge: {
      display: config.show_live_badge ? "inline-flex" : "none",
      alignItems: "center",
      gap: "7px",
      width: "fit-content",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.30)",
      border: "1px solid rgba(255,255,255,0.16)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: "0 10px 26px rgba(0,0,0,0.28)",
    },

    liveDot: {
      width: "6px",
      height: "6px",
      borderRadius: "999px",
      background: "#fb7185",
      boxShadow: "0 0 14px rgba(251,113,133,0.95)",
    },

    topBadgeText: {
      fontSize: `${config.badge_font_size}px`,
      fontWeight: 1000,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#ffffff",
      textShadow: smallTextShadow,
    },

    titleBox: {
      display: "grid",
      gap: "3px",
    },

    title: {
      display: config.show_title ? "block" : "none",
      fontSize: `${config.title_font_size}px`,
      lineHeight: 0.92,
      fontWeight: 1000,
      color: config.title_color,
      letterSpacing: "-0.055em",
      textShadow,
    },

    subtitle: {
      display: config.show_subtitle ? "block" : "none",
      fontSize: `${config.subtitle_font_size}px`,
      lineHeight: 1.12,
      fontWeight: 900,
      color: config.subtitle_color,
      textShadow: smallTextShadow,
    },

    metaRow: {
      display:
        config.show_queue_count || config.show_updated_at ? "flex" : "none",
      gap: "6px",
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: "2px",
    },

    metaPill: {
      width: "fit-content",
      padding: "5px 8px",
      borderRadius: "999px",
      background: "rgba(0,0,0,0.30)",
      border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: "#ffffff",
      fontSize: `${Math.max(9, config.badge_font_size)}px`,
      fontWeight: 900,
      textShadow: smallTextShadow,
      lineHeight: 1,
    },

    nextBox: {
      display: config.show_next_person ? "grid" : "none",
      gap: "4px",
      paddingTop: "4px",
    },

    nextLabel: {
      fontSize: `${config.next_label_font_size}px`,
      fontWeight: 1000,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#c4b5fd",
      textShadow: smallTextShadow,
    },

    nextName: {
      fontSize: `${config.next_name_font_size}px`,
      lineHeight: 0.94,
      fontWeight: 1000,
      color: config.text_color,
      letterSpacing: "-0.045em",
      textShadow,
      maxWidth: `${config.overlay_width}px`,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    nextPackage: {
      display: config.show_package_name ? "inline-flex" : "none",
      width: "fit-content",
      maxWidth: `${config.overlay_width}px`,
      padding: "5px 9px",
      borderRadius: "999px",
      background: `linear-gradient(90deg, ${config.accent_color} 0%, #fbbf24 100%)`,
      color: "#241005",
      fontSize: `${Math.max(10, config.item_package_font_size)}px`,
      lineHeight: 1.1,
      fontWeight: 1000,
      boxShadow: "0 10px 22px rgba(245,158,11,0.22)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    list: {
      display: "grid",
      gap: `${Math.max(5, Math.round(config.line_gap * 0.85))}px`,
      marginTop: "2px",
    },

    row: {
      display: "grid",
      gridTemplateColumns: config.show_position_number ? "38px 1fr" : "1fr",
      gap: "8px",
      alignItems: "center",
      minHeight: "42px",
    },

    index: {
      display: config.show_position_number ? "flex" : "none",
      width: "34px",
      height: "34px",
      borderRadius: "999px",
      alignItems: "center",
      justifyContent: "center",
      fontSize: `${Math.max(15, Math.round(config.item_name_font_size * 0.9))}px`,
      fontWeight: 1000,
      color: "#16051f",
      background: `linear-gradient(135deg, #fde68a 0%, ${config.accent_color} 55%, #fb7185 100%)`,
      boxShadow:
        "0 4px 0 rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.44)",
    },

    rowText: {
      display: "grid",
      gap: "1px",
      minWidth: 0,
    },

    rowName: {
      fontSize: `${config.item_name_font_size}px`,
      lineHeight: 1,
      fontWeight: 1000,
      color: config.text_color,
      letterSpacing: "-0.025em",
      textShadow: smallTextShadow,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    rowPackage: {
      display: config.show_package_name ? "block" : "none",
      fontSize: `${config.item_package_font_size}px`,
      lineHeight: 1.12,
      fontWeight: 900,
      color: config.subtitle_color,
      textShadow: smallTextShadow,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    empty: {
      marginTop: "10px",
      fontSize: `${Math.max(22, config.title_font_size * 0.55)}px`,
      lineHeight: 1.05,
      fontWeight: 1000,
      color: config.title_color,
      textShadow,
    },

    emptySub: {
      marginTop: "6px",
      fontSize: `${Math.max(13, config.subtitle_font_size)}px`,
      fontWeight: 900,
      color: config.subtitle_color,
      textShadow: smallTextShadow,
    },

    error: {
      fontSize: "14px",
      fontWeight: 900,
      color: "#fecaca",
      textShadow: smallTextShadow,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.topBadge}>
          <span style={styles.liveDot} />
          <span style={styles.topBadgeText}>
            {config.live_badge_text || "LIVE QUEUE"}
          </span>
        </div>

        <div style={styles.titleBox}>
          <div style={styles.title}>{config.title_text || "Kolejka"}</div>

          <div style={styles.subtitle}>
            {config.subtitle_text || "Kto jest następny do wróżby?"}
          </div>

          <div style={styles.metaRow}>
            {config.show_queue_count && (
              <div style={styles.metaPill}>Osób w kolejce: {orders.length}</div>
            )}

            {config.show_updated_at && lastUpdate && (
              <div style={styles.metaPill}>Aktualizacja: {lastUpdate}</div>
            )}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {nextOrder ? (
          <>
            <div style={styles.nextBox}>
              <div style={styles.nextLabel}>Następna osoba</div>

              <div style={styles.nextName}>
                {maskName(nextOrder.customer_name)}
              </div>

              <div style={styles.nextPackage}>
                {nextOrder.package_name || "-"}
              </div>
            </div>

            <div style={styles.list}>
              {visibleOrders.map((order, index) => (
                <div key={order.id} style={styles.row}>
                  <div style={styles.index}>{index + 1}</div>

                  <div style={styles.rowText}>
                    <div style={styles.rowName}>
                      {maskName(order.customer_name)}
                    </div>

                    <div style={styles.rowPackage}>
                      {order.package_name || "-"}
                    </div>
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