import { useMemo, useState } from "react";
import kameliaAvatar from "./assets/kamelia-avatar.jpg";
import kameliaMain from "./assets/kamelia-main.jpg";
import kameliaForm from "./assets/kamelia-form.jpg";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    packageName: "Szybka odpowiedź",
    question: "",
    customAmount: "",
  });

  const [loadingQuick, setLoadingQuick] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const plans = useMemo(
    () => [
      {
        name: "Szybka odpowiedź",
        price: "29.00",
        label: "29 zł",
        description: "Jedno pytanie i szybka odpowiedź.",
        isCustomAmount: false,
      },
      {
        name: "Rozkład dnia",
        price: "59.00",
        label: "59 zł",
        description: "Szersza interpretacja i wskazówki.",
        isCustomAmount: false,
      },
      {
        name: "Sesja premium",
        price: "119.00",
        label: "119 zł",
        description: "Rozbudowana analiza z priorytetem.",
        isCustomAmount: false,
      },
      {
        name: "Dowolny datek",
        price: "",
        label: "Wpłać ile chcesz",
        description: "Wesprzyj Wróżkę Kamelii dowolną kwotą.",
        isCustomAmount: true,
      },
    ],
    []
  );

  const selectedPlan =
    plans.find((p) => p.name === form.packageName) || plans[0];

  const socialLinks = [
    { label: "TikTok", url: "https://www.tiktok.com/@wrozka_kamelia" },
    { label: "Instagram", url: "https://www.instagram.com/wrozka_kamelia" },
    { label: "Facebook", url: "https://www.facebook.com/Kamelia.Wrozka" },
    { label: "WWW", url: "https://www.wrozkakamelia.pl/" },
  ];

  const quickLinks = [
    {
      title: "PORTAL – zadaj pytanie teraz",
      subtitle: "Szybka konsultacja i płatność online",
      image: kameliaForm,
      action: () => {
        setForm((prev) => ({
          ...prev,
          packageName: "Szybka odpowiedź",
          message: "",
        }));
        setMessage("");
        setShowModal(true);
      },
      highlight: true,
    },
    {
      title: "CENNIK – pakiety i zasady",
      subtitle: "Sprawdź ofertę i wybierz wariant",
      image: kameliaMain,
      action: () => {
        const section = document.getElementById("pakiety");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      highlight: false,
    },
    {
      title: "Oficjalna strona Kamelii",
      subtitle: "Pełna oferta i kontakt",
      image: kameliaAvatar,
      href: "https://www.wrozkakamelia.pl/",
      highlight: false,
    },
    {
      title: "TikTok",
      subtitle: "Live i krótkie materiały",
      image: kameliaMain,
      href: "https://www.tiktok.com/@wrozka_kamelia",
      highlight: false,
    },
    {
      title: "Instagram",
      subtitle: "Aktualności i kontakt",
      image: kameliaForm,
      href: "https://www.instagram.com/wrozka_kamelia",
      highlight: false,
    },
    {
      title: "Facebook",
      subtitle: "Społeczność i informacje",
      image: kameliaAvatar,
      href: "https://www.facebook.com/Kamelia.Wrozka",
      highlight: false,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getErrorMessageFromResponse = (data) => {
    if (!data) return "Wystąpił błąd.";
    return data.details || data.error || data.message || "Nie udało się utworzyć płatności.";
  };

  const getNormalizedCustomAmount = (value) => {
    const normalized = String(value || "").replace(",", ".").trim();

    if (!normalized) {
      throw new Error("Wpisz kwotę datku.");
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      throw new Error("Kwota musi być poprawną liczbą.");
    }

    if (parsed < 1) {
      throw new Error("Minimalna kwota datku to 1 zł.");
    }

    return parsed.toFixed(2);
  };

  const createPaymentRequest = async ({
    name,
    email,
    amount,
    description,
    question = "",
    package_name = "",
  }) => {
    const response = await fetch(`${API_BASE}/api/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        amount,
        description,
        question,
        package_name,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessageFromResponse(data));
    }

    if (!data.payment_url) {
      throw new Error("Backend nie zwrócił linku płatności.");
    }

    return data.payment_url;
  };

  const handleQuickOrder = async (plan) => {
    if (plan.isCustomAmount) {
      setForm((prev) => ({
        ...prev,
        packageName: "Dowolny datek",
        question: "",
      }));
      setMessage("");
      setShowModal(true);
      return;
    }

    setLoadingQuick(plan.name);
    setMessage("");

    try {
      const paymentUrl = await createPaymentRequest({
        name: form.name.trim().length >= 3 ? form.name.trim() : "Klient testowy",
        email: form.email || "test@example.com",
        amount: plan.price,
        description: `${plan.name} - Wróżka Kamelia`,
        question: form.question || "",
        package_name: plan.name,
      });

      window.location.href = paymentUrl;
    } catch (error) {
      setMessage(error.message || "Wystąpił błąd.");
    } finally {
      setLoadingQuick(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    setMessage("");

    try {
      if (form.name.trim().length < 3) {
        throw new Error("Imię musi mieć co najmniej 3 znaki.");
      }

      if (!form.email.trim()) {
        throw new Error("Wpisz adres e-mail.");
      }

      const isCustomAmountPlan = form.packageName === "Dowolny datek";

      const finalAmount = isCustomAmountPlan
        ? getNormalizedCustomAmount(form.customAmount)
        : selectedPlan.price;

      const finalDescription = isCustomAmountPlan
        ? `Dowolny datek | Kwota: ${finalAmount} zł`
        : `${form.packageName} | Pytanie: ${form.question.trim() || "brak"}`;

      const paymentUrl = await createPaymentRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        amount: finalAmount,
        description: finalDescription,
        question: isCustomAmountPlan ? "" : form.question.trim(),
        package_name: form.packageName,
      });

      window.location.href = paymentUrl;
    } catch (error) {
      setMessage(error.message || "Wystąpił błąd.");
    } finally {
      setLoadingForm(false);
    }
  };

  const closeModal = () => {
    if (loadingForm) return;
    setShowModal(false);
    setMessage("");
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, rgba(217,119,255,0.18), transparent 24%), radial-gradient(circle at bottom, rgba(244,114,182,0.15), transparent 22%), linear-gradient(180deg, #1b0826 0%, #240d33 52%, #18071f 100%)",
      fontFamily: "Arial, sans-serif",
      color: "#fdf4ff",
      padding: "24px 16px 40px",
      display: "flex",
      justifyContent: "center",
    },
    wrapper: {
      width: "100%",
      maxWidth: "560px",
      margin: "0 auto",
      paddingTop: "10px",
      paddingBottom: "30px",
    },
    header: {
      textAlign: "center",
      padding: "12px 18px 18px",
    },
    avatarRing: {
      width: "110px",
      height: "110px",
      margin: "0 auto 16px",
      padding: "4px",
      borderRadius: "999px",
      background:
        "linear-gradient(135deg, rgba(253,224,71,0.95), rgba(236,72,153,0.9), rgba(168,85,247,0.95))",
      boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
    },
    avatar: {
      width: "102px",
      height: "102px",
      borderRadius: "999px",
      overflow: "hidden",
      border: "2px solid rgba(255,255,255,0.15)",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      borderRadius: "999px",
    },
    name: {
      fontSize: "52px",
      lineHeight: 1,
      margin: "0 0 12px",
      fontWeight: 900,
      color: "#fef3c7",
      textShadow: "0 0 20px rgba(251,191,36,0.16)",
    },
    bio: {
      margin: "0 auto 16px",
      maxWidth: "420px",
      fontSize: "19px",
      lineHeight: 1.5,
      color: "#f5d0fe",
    },
    iconsRow: {
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginTop: "16px",
    },
    iconLink: {
      textDecoration: "none",
      width: "46px",
      height: "46px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#fff7ed",
      fontWeight: 800,
      boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    },
    linkStack: {
      display: "grid",
      gap: "16px",
      marginTop: "18px",
    },
    linkCard: {
      borderRadius: "24px",
      background: "linear-gradient(180deg, rgba(236,196,255,0.96) 0%, rgba(225,177,244,0.96) 100%)",
      color: "#3b0764",
      padding: "14px 16px",
      display: "grid",
      gridTemplateColumns: "54px 1fr 20px",
      alignItems: "center",
      gap: "14px",
      textDecoration: "none",
      border: "1px solid rgba(255,255,255,0.22)",
      boxShadow: "0 14px 32px rgba(0,0,0,0.24)",
      cursor: "pointer",
      width: "100%",
      boxSizing: "border-box",
    },
    linkCardStrong: {
      borderRadius: "24px",
      background: "linear-gradient(180deg, rgba(250,232,255,0.98) 0%, rgba(236,196,255,0.96) 100%)",
      color: "#4a044e",
      padding: "14px 16px",
      display: "grid",
      gridTemplateColumns: "54px 1fr 20px",
      alignItems: "center",
      gap: "14px",
      textDecoration: "none",
      border: "1px solid rgba(255,255,255,0.28)",
      boxShadow: "0 18px 36px rgba(0,0,0,0.28)",
      cursor: "pointer",
      width: "100%",
      boxSizing: "border-box",
    },
    miniAvatar: {
      width: "52px",
      height: "52px",
      borderRadius: "999px",
      overflow: "hidden",
      border: "2px solid rgba(255,255,255,0.65)",
      boxSizing: "border-box",
      background: "#2e1065",
      flexShrink: 0,
    },
    miniAvatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      borderRadius: "999px",
    },
    linkTitle: {
      fontSize: "18px",
      fontWeight: 800,
      lineHeight: 1.25,
      marginBottom: "4px",
    },
    linkSubtitle: {
      fontSize: "13px",
      lineHeight: 1.35,
      color: "rgba(76,29,149,0.78)",
    },
    dots: {
      fontSize: "20px",
      fontWeight: 700,
      textAlign: "right",
      opacity: 0.65,
      background: "transparent",
      border: "none",
      padding: 0,
    },
    visualCard: {
      marginTop: "2px",
      borderRadius: "28px",
      background: "linear-gradient(180deg, rgba(236,196,255,0.96) 0%, rgba(225,177,244,0.96) 100%)",
      padding: "12px",
      border: "1px solid rgba(255,255,255,0.22)",
      boxShadow: "0 18px 36px rgba(0,0,0,0.26)",
    },
    visualInner: {
      borderRadius: "20px",
      minHeight: "320px",
      position: "relative",
      overflow: "hidden",
      background: "#24103a",
    },
    visualImage: {
      width: "100%",
      height: "320px",
      objectFit: "cover",
      display: "block",
      filter: "brightness(0.78)",
    },
    visualOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(10,10,20,0.10) 0%, rgba(14,8,25,0.24) 55%, rgba(12,7,20,0.58) 100%)",
    },
    visualText: {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      padding: "24px",
      textAlign: "left",
      boxSizing: "border-box",
    },
    visualTextBox: {
      maxWidth: "85%",
    },
    visualTitle: {
      fontSize: "44px",
      lineHeight: 1.02,
      margin: 0,
      color: "#fde68a",
      textShadow: "0 0 18px rgba(251,191,36,0.18)",
      fontFamily: "Georgia, serif",
    },
    visualSub: {
      marginTop: "10px",
      color: "#f5d0fe",
      fontSize: "16px",
      lineHeight: 1.4,
    },
    sectionWrap: {
      marginTop: "16px",
    },
    priceGrid: {
      display: "grid",
      gap: "14px",
      marginTop: "12px",
    },
    planCard: {
      borderRadius: "24px",
      background: "rgba(255,255,255,0.09)",
      border: "1px solid rgba(255,255,255,0.12)",
      padding: "18px",
      boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    },
    planName: {
      fontSize: "22px",
      fontWeight: 900,
      color: "#fef3c7",
      marginBottom: "8px",
    },
    planPrice: {
      fontSize: "32px",
      fontWeight: 900,
      color: "#facc15",
      marginBottom: "8px",
    },
    planDesc: {
      fontSize: "15px",
      lineHeight: 1.55,
      color: "#f5d0fe",
      marginBottom: "14px",
    },
    orderBtn: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(90deg, #e879f9 0%, #c084fc 100%)",
      color: "#3b0764",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(192,132,252,0.24)",
      fontSize: "15px",
    },
    footer: {
      textAlign: "center",
      fontSize: "12px",
      color: "rgba(250,232,255,0.68)",
      marginTop: "22px",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(9, 4, 17, 0.72)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      display: showModal ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px",
      zIndex: 9999,
    },
    modalCard: {
      width: "100%",
      maxWidth: "520px",
      maxHeight: "90vh",
      overflowY: "auto",
      borderRadius: "28px",
      background:
        "linear-gradient(180deg, rgba(29,11,42,0.98) 0%, rgba(39,16,57,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.42)",
      padding: "20px",
      boxSizing: "border-box",
    },
    modalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "14px",
    },
    modalTitleWrap: {
      minWidth: 0,
    },
    modalTitle: {
      fontSize: "28px",
      fontWeight: 900,
      color: "#fef3c7",
      margin: 0,
    },
    modalSub: {
      marginTop: "6px",
      fontSize: "14px",
      lineHeight: 1.5,
      color: "#f5d0fe",
    },
    closeBtn: {
      width: "42px",
      height: "42px",
      minWidth: "42px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: "22px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
    },
    modalHero: {
      borderRadius: "22px",
      overflow: "hidden",
      position: "relative",
      marginBottom: "16px",
      background: "#24103a",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    modalHeroImage: {
      width: "100%",
      height: "200px",
      objectFit: "cover",
      display: "block",
      filter: "brightness(0.78)",
    },
    modalHeroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(20,8,31,0.10) 0%, rgba(20,8,31,0.28) 50%, rgba(20,8,31,0.58) 100%)",
    },
    modalHeroText: {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "flex-end",
      padding: "18px",
      boxSizing: "border-box",
    },
    modalHeroTextInner: {
      color: "#fff7ed",
    },
    modalHeroHeadline: {
      fontSize: "30px",
      lineHeight: 1.02,
      fontWeight: 900,
      color: "#fde68a",
      margin: 0,
      fontFamily: "Georgia, serif",
    },
    modalHeroDesc: {
      marginTop: "8px",
      fontSize: "14px",
      color: "#f5d0fe",
      lineHeight: 1.45,
    },
    formText: {
      fontSize: "14px",
      lineHeight: 1.55,
      color: "#f5d0fe",
      marginBottom: "14px",
    },
    input: {
      width: "100%",
      padding: "15px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.10)",
      color: "#ffffff",
      boxSizing: "border-box",
      outline: "none",
      fontSize: "15px",
      marginBottom: "10px",
    },
    textarea: {
      width: "100%",
      padding: "15px 14px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.10)",
      color: "#ffffff",
      boxSizing: "border-box",
      outline: "none",
      fontSize: "15px",
      minHeight: "140px",
      resize: "vertical",
      marginBottom: "10px",
    },
    submitBtn: {
      width: "100%",
      padding: "15px 16px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(90deg, #fde68a 0%, #f59e0b 100%)",
      color: "#431407",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 26px rgba(245,158,11,0.24)",
      fontSize: "15px",
    },
    error: {
      color: "#fecaca",
      fontWeight: 700,
      lineHeight: 1.55,
      marginTop: "12px",
      whiteSpace: "pre-wrap",
    },
  };

  return (
    <>
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <header style={styles.header}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>
                <img
                  src={kameliaAvatar}
                  alt="Wróżka Kamelia"
                  style={styles.avatarImage}
                />
              </div>
            </div>

            <h1 style={styles.name}>Kamelia</h1>
            <p style={styles.bio}>
              Duchowa przewodniczka, tarot i odpowiedzi online. Zadaj pytanie, wybierz pakiet i przejdź do płatności.
            </p>

            <div style={styles.iconsRow}>
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.iconLink}
                >
                  {link.label[0]}
                </a>
              ))}
            </div>
          </header>

          <div style={styles.linkStack}>
            {quickLinks.slice(0, 2).map((item) => {
              const cardStyle = item.highlight ? styles.linkCardStrong : styles.linkCard;

              return (
                <button key={item.title} type="button" onClick={item.action} style={cardStyle}>
                  <div style={styles.miniAvatar}>
                    <img src={item.image} alt={item.title} style={styles.miniAvatarImage} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={styles.linkTitle}>{item.title}</div>
                    <div style={styles.linkSubtitle}>{item.subtitle}</div>
                  </div>
                  <div style={styles.dots}>⋮</div>
                </button>
              );
            })}

            <div style={styles.visualCard}>
              <div style={styles.visualInner}>
                <img
                  src={kameliaMain}
                  alt="Kamelia"
                  style={styles.visualImage}
                />
                <div style={styles.visualOverlay} />
                <div style={styles.visualText}>
                  <div style={styles.visualTextBox}>
                    <h2 style={styles.visualTitle}>Kamelia zaprasza</h2>
                    <div style={styles.visualSub}>
                      Tarot, energia i odpowiedzi dla Ciebie
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {quickLinks.slice(2).map((item) => (
              <a key={item.title} href={item.href} target="_blank" rel="noreferrer" style={styles.linkCard}>
                <div style={styles.miniAvatar}>
                  <img src={item.image} alt={item.title} style={styles.miniAvatarImage} />
                </div>
                <div>
                  <div style={styles.linkTitle}>{item.title}</div>
                  <div style={styles.linkSubtitle}>{item.subtitle}</div>
                </div>
                <div style={styles.dots}>⋮</div>
              </a>
            ))}
          </div>

          <section id="pakiety" style={styles.sectionWrap}>
            <div style={styles.priceGrid}>
              {plans.map((plan) => (
                <div key={plan.name} style={styles.planCard}>
                  <div style={styles.planName}>{plan.name}</div>
                  <div style={styles.planPrice}>{plan.label}</div>
                  <div style={styles.planDesc}>{plan.description}</div>
                  <button
                    type="button"
                    onClick={() => handleQuickOrder(plan)}
                    disabled={loadingQuick !== null || loadingForm}
                    style={{
                      ...styles.orderBtn,
                      opacity: loadingQuick !== null || loadingForm ? 0.72 : 1,
                    }}
                  >
                    {loadingQuick === plan.name ? "Przetwarzanie..." : "Zamów i zapłać"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div style={styles.footer}>Wróżka Kamelia • wersja testowa • React + Flask + Tpay</div>
        </div>
      </div>

      <div style={styles.modalOverlay} onClick={closeModal}>
        <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div style={styles.modalTitleWrap}>
              <h2 style={styles.modalTitle}>Portal pytań</h2>
              <div style={styles.modalSub}>
                Wpisz dane, wybierz pakiet i przejdź do płatności.
              </div>
            </div>

            <button type="button" onClick={closeModal} style={styles.closeBtn}>
              ×
            </button>
          </div>

          <div style={styles.modalHero}>
            <img src={kameliaForm} alt="Kamelia" style={styles.modalHeroImage} />
            <div style={styles.modalHeroOverlay} />
            <div style={styles.modalHeroText}>
              <div style={styles.modalHeroTextInner}>
                <h3 style={styles.modalHeroHeadline}>Zadaj pytanie</h3>
                <div style={styles.modalHeroDesc}>
                  Tarot, energia, relacje i szybka odpowiedź online.
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div style={styles.formText}>
              Podaj imię, e-mail, wybierz pakiet i przejdź do płatności Tpay.
              {form.packageName !== "Dowolny datek"
                ? " Możesz też wpisać pytanie do wróżki."
                : " W przypadku datku wpisz własną kwotę."}
            </div>

            <input
              type="text"
              name="name"
              placeholder="Imię"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />

            <select
              name="packageName"
              value={form.packageName}
              onChange={handleChange}
              style={styles.input}
            >
              {plans.map((plan) => (
                <option key={plan.name} value={plan.name}>
                  {plan.name} - {plan.label}
                </option>
              ))}
            </select>

            {form.packageName === "Dowolny datek" && (
              <input
                type="text"
                name="customAmount"
                placeholder="Kwota datku, np. 20"
                value={form.customAmount}
                onChange={handleChange}
                style={styles.input}
              />
            )}

            {form.packageName !== "Dowolny datek" && (
              <textarea
                name="question"
                placeholder="Wpisz pytanie do wróżki..."
                value={form.question}
                onChange={handleChange}
                rows={6}
                style={styles.textarea}
              />
            )}

            <button
              type="submit"
              disabled={loadingForm || loadingQuick !== null}
              style={{
                ...styles.submitBtn,
                opacity: loadingForm || loadingQuick !== null ? 0.72 : 1,
              }}
            >
              {loadingForm ? "Przetwarzanie..." : "Przejdź do płatności"}
            </button>

            {message && <div style={styles.error}>{message}</div>}
          </form>
        </div>
      </div>
    </>
  );
}