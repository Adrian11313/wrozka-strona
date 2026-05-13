import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function LiveQuestionOverlayPage() {
  const [state, setState] = useState({
    is_visible: false,
    voice_enabled: true,
    show_enabled: true,
    read_token: 0,
    auto_hide_seconds: 0,
    order: null,
  });

  const [error, setError] = useState("");
  const lastReadTokenRef = useRef(null);
  const hideTimerRef = useRef(null);

  const loadLiveQuestion = async () => {
    try {
      setError("");

      const response = await fetch(`${API_BASE}/api/live-question`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się pobrać pytania live.");
      }

      setState(data);

      if (
        data.is_visible &&
        data.voice_enabled &&
        data.order &&
        data.read_token !== lastReadTokenRef.current
      ) {
        lastReadTokenRef.current = data.read_token;
        speakQuestion(data.order);
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (
        data.is_visible &&
        data.auto_hide_seconds &&
        Number(data.auto_hide_seconds) > 0
      ) {
        hideTimerRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            is_visible: false,
          }));
        }, Number(data.auto_hide_seconds) * 1000);
      }
    } catch (err) {
      setError(err.message || "Błąd pobierania pytania live.");
    }
  };

  useEffect(() => {
    let intervalId;

    loadLiveQuestion();

    intervalId = setInterval(() => {
      loadLiveQuestion();
    }, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const cleanQuestion = (question) => {
    const text = String(question || "").trim();

    if (!text) {
      return "Brak wpisanego pytania.";
    }

    return text;
  };

  const speakQuestion = (order) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const name = maskName(order.customer_name);
    const question = cleanQuestion(order.question);

    const textToRead = `Pytanie od ${name}. ${question}`;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "pl-PL";
    utterance.rate = 0.95;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const polishVoice =
      voices.find((voice) => voice.lang === "pl-PL") ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("pl")) ||
      null;

    if (polishVoice) {
      utterance.voice = polishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const order = state.order;
  const shouldShow = state.is_visible && state.show_enabled && order;

  const styles = {
    page: {
      width: "100%",
      height: "100vh",
      background: "transparent",
      margin: 0,
      padding: "48px",
      boxSizing: "border-box",
      fontFamily:
        "Georgia, 'Times New Roman', Inter, Arial, system-ui, sans-serif",
      color: "#3b2208",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "none",
    },
    hiddenWrap: {
      opacity: 0,
      transform: "scale(0.96) translateY(20px)",
      transition: "all 350ms ease",
    },
    visibleWrap: {
      opacity: 1,
      transform: "scale(1) translateY(0)",
      transition: "all 350ms ease",
    },
    scroll: {
      width: "min(900px, 88vw)",
      minHeight: "420px",
      position: "relative",
      borderRadius: "38px",
      padding: "54px 62px",
      boxSizing: "border-box",
      background:
        "radial-gradient(circle at 20% 12%, rgba(255,255,255,0.55), transparent 18%), radial-gradient(circle at 84% 82%, rgba(120,53,15,0.12), transparent 24%), linear-gradient(135deg, rgba(254,243,199,0.98) 0%, rgba(253,230,138,0.97) 42%, rgba(245,158,11,0.92) 100%)",
      border: "2px solid rgba(120,53,15,0.34)",
      boxShadow:
        "0 18px 0 rgba(120,53,15,0.22), 0 34px 90px rgba(0,0,0,0.50), inset 0 0 40px rgba(255,255,255,0.34)",
      overflow: "hidden",
    },
    scrollBefore: {
      position: "absolute",
      inset: "18px",
      borderRadius: "28px",
      border: "2px dashed rgba(120,53,15,0.24)",
      pointerEvents: "none",
    },
    topRibbon: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 16px",
      borderRadius: "999px",
      background: "rgba(120,53,15,0.14)",
      border: "1px solid rgba(120,53,15,0.18)",
      color: "#78350f",
      fontSize: "17px",
      fontWeight: 900,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "22px",
    },
    dot: {
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      background: "#be123c",
      boxShadow: "0 0 14px rgba(190,18,60,0.7)",
    },
    name: {
      fontSize: "58px",
      lineHeight: 1,
      fontWeight: 900,
      color: "#431407",
      marginBottom: "10px",
      textShadow: "0 2px 0 rgba(255,255,255,0.28)",
      letterSpacing: "-0.035em",
    },
    packageName: {
      width: "fit-content",
      padding: "9px 15px",
      borderRadius: "999px",
      background: "rgba(67,20,7,0.12)",
      color: "#78350f",
      fontSize: "19px",
      fontWeight: 900,
      marginBottom: "30px",
    },
    questionBox: {
      padding: "26px 28px",
      borderRadius: "24px",
      background: "rgba(255,255,255,0.28)",
      border: "1px solid rgba(120,53,15,0.16)",
      boxShadow: "inset 0 0 24px rgba(255,255,255,0.22)",
    },
    questionLabel: {
      fontSize: "18px",
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#92400e",
      marginBottom: "12px",
    },
    question: {
      fontSize: "40px",
      lineHeight: 1.18,
      fontWeight: 900,
      color: "#3b2208",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    footer: {
      marginTop: "24px",
      fontSize: "17px",
      fontWeight: 800,
      color: "rgba(67,20,7,0.74)",
      textAlign: "right",
    },
    error: {
      position: "fixed",
      left: "40px",
      bottom: "40px",
      maxWidth: "620px",
      padding: "14px 18px",
      borderRadius: "18px",
      background: "rgba(127,29,29,0.82)",
      color: "#fecaca",
      fontSize: "18px",
      fontWeight: 900,
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    },
  };

  return (
    <div style={styles.page}>
      <div style={shouldShow ? styles.visibleWrap : styles.hiddenWrap}>
        {shouldShow && (
          <div style={styles.scroll}>
            <div style={styles.scrollBefore} />

            <div style={styles.topRibbon}>
              <span style={styles.dot} />
              <span>Pytanie do kart</span>
            </div>

            <div style={styles.name}>{maskName(order.customer_name)}</div>

            <div style={styles.packageName}>{order.package_name || "Pakiet"}</div>

            <div style={styles.questionBox}>
              <div style={styles.questionLabel}>Treść pytania</div>
              <div style={styles.question}>
                {cleanQuestion(order.question)}
              </div>
            </div>

            <div style={styles.footer}>Wróżka Kamelia ✦ live</div>
          </div>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}