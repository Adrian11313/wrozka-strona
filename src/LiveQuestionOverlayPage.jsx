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

  const shortenQuestion = (question, maxLength = 105) => {
    const text = cleanQuestion(question);

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
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
    utterance.rate = 0.94;
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
      padding: 0,
      boxSizing: "border-box",
      fontFamily:
        "Georgia, 'Times New Roman', Inter, Arial, system-ui, sans-serif",
      color: "#2b1605",
      overflow: "hidden",
      pointerEvents: "none",
      position: "relative",
    },

    hiddenWrap: {
      position: "absolute",
      left: "50%",
      bottom: "405px",
      width: "850px",
      transform: "translateX(-50%) scaleX(0.03) translateY(18px)",
      transformOrigin: "center center",
      opacity: 0,
      filter: "blur(1.2px)",
      transition:
        "transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 240ms ease, filter 240ms ease",
    },

    visibleWrap: {
      position: "absolute",
      left: "50%",
      bottom: "405px",
      width: "850px",
      transform: "translateX(-50%) scaleX(1) translateY(0)",
      transformOrigin: "center center",
      opacity: 1,
      filter: "blur(0)",
      transition:
        "transform 620ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease, filter 280ms ease",
    },

    parchmentOuter: {
      position: "relative",
      width: "850px",
      minHeight: "132px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    rollLeft: {
      position: "absolute",
      left: "-30px",
      top: "50%",
      width: "72px",
      height: "104px",
      transform: "translateY(-50%)",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, #5b2d0a 0%, #9a5a18 22%, #f3d28b 52%, #a9671d 78%, #5b2d0a 100%)",
      boxShadow:
        "0 14px 26px rgba(0,0,0,0.42), inset 0 0 14px rgba(255,255,255,0.28), inset -10px 0 16px rgba(59,32,8,0.32)",
      zIndex: 1,
    },

    rollRight: {
      position: "absolute",
      right: "-30px",
      top: "50%",
      width: "72px",
      height: "104px",
      transform: "translateY(-50%)",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, #5b2d0a 0%, #a9671d 22%, #f3d28b 52%, #9a5a18 78%, #5b2d0a 100%)",
      boxShadow:
        "0 14px 26px rgba(0,0,0,0.42), inset 0 0 14px rgba(255,255,255,0.28), inset 10px 0 16px rgba(59,32,8,0.32)",
      zIndex: 1,
    },

    rollCapLeft: {
      position: "absolute",
      left: "-16px",
      top: "50%",
      width: "34px",
      height: "126px",
      transform: "translateY(-50%)",
      borderRadius: "18px",
      background:
        "linear-gradient(180deg, #6b340a 0%, #d19945 42%, #7c3f10 100%)",
      boxShadow: "0 12px 22px rgba(0,0,0,0.34)",
      zIndex: 0,
    },

    rollCapRight: {
      position: "absolute",
      right: "-16px",
      top: "50%",
      width: "34px",
      height: "126px",
      transform: "translateY(-50%)",
      borderRadius: "18px",
      background:
        "linear-gradient(180deg, #6b340a 0%, #d19945 42%, #7c3f10 100%)",
      boxShadow: "0 12px 22px rgba(0,0,0,0.34)",
      zIndex: 0,
    },

    parchment: {
      position: "relative",
      zIndex: 2,
      width: "800px",
      minHeight: "122px",
      borderRadius: "16px",
      padding: "18px 58px 20px",
      boxSizing: "border-box",
      background:
        "radial-gradient(circle at 12% 14%, rgba(255,255,255,0.72), transparent 18%), radial-gradient(circle at 82% 82%, rgba(120,53,15,0.16), transparent 28%), linear-gradient(180deg, rgba(255,249,226,0.99) 0%, rgba(246,228,170,0.99) 45%, rgba(214,171,90,0.98) 100%)",
      border: "2px solid rgba(91,45,10,0.42)",
      boxShadow:
        "0 18px 38px rgba(0,0,0,0.42), inset 0 2px 12px rgba(255,255,255,0.62), inset 0 -10px 20px rgba(91,45,10,0.17)",
      overflow: "hidden",
    },

    parchmentTexture: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, rgba(91,45,10,0.12) 0%, transparent 8%, transparent 92%, rgba(91,45,10,0.12) 100%), repeating-linear-gradient(0deg, rgba(91,45,10,0.025) 0px, rgba(91,45,10,0.025) 1px, transparent 1px, transparent 7px)",
      pointerEvents: "none",
    },

    topLine: {
      position: "absolute",
      left: "58px",
      right: "58px",
      top: "13px",
      height: "1px",
      background:
        "linear-gradient(90deg, transparent 0%, rgba(91,45,10,0.34) 18%, rgba(91,45,10,0.38) 50%, rgba(91,45,10,0.34) 82%, transparent 100%)",
    },

    bottomLine: {
      position: "absolute",
      left: "58px",
      right: "58px",
      bottom: "13px",
      height: "1px",
      background:
        "linear-gradient(90deg, transparent 0%, rgba(91,45,10,0.26) 18%, rgba(91,45,10,0.32) 50%, rgba(91,45,10,0.26) 82%, transparent 100%)",
    },

    content: {
      position: "relative",
      zIndex: 3,
      opacity: shouldShow ? 1 : 0,
      transform: shouldShow ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 280ms ease 260ms, transform 280ms ease 260ms",
    },

    name: {
      fontSize: "30px",
      lineHeight: 1,
      fontWeight: 900,
      color: "#2b1605",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      marginBottom: "10px",
      textShadow: "0 1px 0 rgba(255,255,255,0.65)",
    },

    question: {
      fontSize: "28px",
      lineHeight: 1.16,
      fontWeight: 700,
      color: "#3b2208",
      textAlign: "center",
      textShadow: "0 1px 0 rgba(255,255,255,0.55)",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },

    packageBadge: {
      position: "absolute",
      left: "50%",
      bottom: "-20px",
      transform: "translateX(-50%)",
      padding: "8px 18px",
      borderRadius: "999px",
      background:
        "linear-gradient(90deg, rgba(245,158,11,0.98) 0%, rgba(253,224,71,0.98) 100%)",
      color: "#2b1605",
      border: "1px solid rgba(91,45,10,0.30)",
      fontSize: "15px",
      lineHeight: 1,
      fontWeight: 900,
      boxShadow: "0 12px 24px rgba(0,0,0,0.30)",
      zIndex: 4,
      whiteSpace: "nowrap",
    },

    glow: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "760px",
      height: "150px",
      transform: "translate(-50%, -50%)",
      borderRadius: "999px",
      background:
        "radial-gradient(circle, rgba(253,224,71,0.32) 0%, rgba(245,158,11,0.14) 34%, transparent 70%)",
      filter: "blur(14px)",
      zIndex: -1,
    },

    error: {
      position: "fixed",
      left: "36px",
      bottom: "36px",
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
          <div style={styles.parchmentOuter}>
            <div style={styles.glow} />

            <div style={styles.rollCapLeft} />
            <div style={styles.rollCapRight} />
            <div style={styles.rollLeft} />
            <div style={styles.rollRight} />

            <div style={styles.parchment}>
              <div style={styles.parchmentTexture} />
              <div style={styles.topLine} />
              <div style={styles.bottomLine} />

              <div style={styles.content}>
                <div style={styles.name}>{maskName(order.customer_name)}</div>

                <div style={styles.question}>
                  {shortenQuestion(order.question)}
                </div>
              </div>

              <div style={styles.packageBadge}>
                {order.package_name || "Pytanie do kart"}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}