"use client";

import { useEffect, useState, type FormEvent } from "react";

const players = [
  { name: "hoxhi", level: 10, tone: "from-fuchsia-500 to-violet-500" },
  { name: "Tom", level: 8, tone: "from-cyan-400 to-blue-500" },
  { name: "Jericho", level: 7, tone: "from-amber-400 to-orange-500" },
  { name: "k1ng", level: 6, tone: "from-emerald-400 to-teal-500" },
];

const ranking = [
  ["01", "hoxhi", "LVL 10", "1,842"],
  ["02", "melo", "LVL 10", "1,791"],
  ["03", "Tom", "LVL 8", "1,626"],
  ["04", "k1ng", "LVL 7", "1,514"],
];

const mapPool = [
  "Mirage",
  "Inferno",
  "Nuke",
  "Ancient",
  "Anubis",
  "Dust II",
  "Train",
];
const draftPool = [
  { name: "melo", level: 9 },
  { name: "Tom", level: 8 },
  { name: "Jericho", level: 7 },
  { name: "k1ng", level: 6 },
  { name: "navi", level: 6 },
  { name: "loko", level: 5 },
  { name: "shiro", level: 4 },
  { name: "neo", level: 3 },
  { name: "ace", level: 2 },
];
type Screen = "landing" | "dashboard" | "room";

type SessionData = {
  user: {
    email: string | null;
    fullName: string | null;
    birthDate: string | null;
    nickname: string;
    steamId64: string | null;
    steamPersonaName: string | null;
    steamAvatarUrl: string | null;
    cs2Minutes: number;
    level: number;
    status: "pending" | "verified" | "rejected" | "suspended" | "banned";
    role: "player" | "sub" | "streamer" | "mod" | "admin" | "owner";
    legalVersion: string | null;
    termsAcceptedAt: string | null;
  };
  wallet: {
    availableCents: number;
    lockedCents: number;
    debtCents: number;
  } | null;
  rating: {
    elo: number;
    level: number;
    matches: number;
    wins: number;
    losses: number;
    calibrationStatus: "pending" | "staff_assigned" | "established";
  } | null;
  privacy?: { matchHistoryVisible: boolean };
};

type RoomData = {
  id: string;
  name: string;
  status: string;
  entryCents: number;
  prizePerWinnerCents: number;
  creator: { nickname: string; avatarUrl: string | null } | null;
  players: Array<{
    userId: string;
    nickname: string;
    avatarUrl: string | null;
    steamId64: string | null;
    hours: number;
    level: number;
    elo: number;
    conduct: string;
  }>;
};

type WalletData = {
  wallet: {
    availableCents: number;
    lockedCents: number;
    debtCents: number;
  } | null;
  entries: Array<{
    id: string;
    type: string;
    amountCents: number;
    description: string;
    createdAt: string | number;
  }>;
  requests: Array<{
    id: string;
    type: "deposit" | "withdrawal";
    method: "yape" | "plin";
    amountCents: number;
    status: string;
    requestedAt: string | number;
  }>;
};

export default function Home() {
  const [steamOpen, setSteamOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [notice, setNotice] = useState("");
  const [screen, setScreen] = useState<Screen>("landing");
  const [balance, setBalance] = useState(0);
  const [session, setSession] = useState<SessionData | null>(null);
  const [onboardingIdentity, setOnboardingIdentity] = useState<{ email: string; fullName: string | null } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<{ activePlayers: number; rooms: Array<{ id: string; name: string; status: string; entryCents: number; players: Array<{ nickname: string; avatarUrl: string | null; level: number | null; isCaptain: boolean }> }>; ranking: Array<{ userId: string; name: string; elo: number; level: number; position: number }> } | null>(null);

  useEffect(() => {
    void fetch("/api/public", { cache: "no-store" }).then(async (response) => { if (response.ok) setPublicData(await response.json()); });
    void fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as SessionData & {
          onboardingRequired?: boolean;
          identity?: { email: string; fullName: string | null };
        };
        if (body.onboardingRequired) {
          setOnboardingIdentity(body.identity ?? null);
          setSteamOpen(true);
          return null;
        }
        return body;
      })
      .then((data) => {
        setSession(data);
        if (data?.wallet) setBalance(data.wallet.availableCents / 100);
      })
      .finally(() => setSessionLoading(false));

    const steamResult = new URLSearchParams(window.location.search).get(
      "steam",
    );
    if (steamResult === "verified" || steamResult === "linked") {
      setScreen("dashboard");
      setActiveTab("Cuenta");
      setNotice(
        steamResult === "verified"
          ? "Steam verificado · Cuenta apta para revisión del staff"
          : "Steam vinculado · Revisa el estado de validación",
      );
      window.setTimeout(() => setNotice(""), 5000);
    }
  }, []);

  function joinRoom() {
    if (!session) return setSteamOpen(true);
    setActiveTab("Salas");
    setScreen("dashboard");
  }

  async function completeOnboarding() {
    setSteamOpen(false);
    const response = await fetch("/api/me", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json() as SessionData & { onboardingRequired?: boolean };
      if (!data.onboardingRequired) {
        setSession(data);
        setOnboardingIdentity(null);
        if (data.wallet) setBalance(data.wallet.availableCents / 100);
        setScreen("dashboard");
        setActiveTab("Cuenta");
      }
    }
    setNotice("Solicitud registrada · el staff debe aprobar tu cuenta antes de jugar");
    window.setTimeout(() => setNotice(""), 3500);
  }

  if (screen === "dashboard")
    return (
      <EnhancedDashboard
        balance={balance}
        setBalance={setBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openRoom={(roomId) => { setSelectedRoomId(roomId ?? null); setScreen("room"); }}
        goHome={() => setScreen("landing")}
        notice={notice}
        setNotice={setNotice}
        session={session}
      />
    );
  if (screen === "room")
    return (
      <EnhancedRoomFlow
        roomId={selectedRoomId}
        session={session}
        balance={balance}
        bannedMaps={bannedMaps}
        setBannedMaps={setBannedMaps}
        onReserve={() => {
          if (!joined) {
            setJoined(true);
            setBalance((value) => value - 6);
            setNotice("S/ 6 bloqueados · Ya estás dentro de la sala");
            window.setTimeout(() => setNotice(""), 3500);
          }
        }}
        joined={joined}
        goBack={() => setScreen("dashboard")}
        notice={notice}
      />
    );

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#09080d] text-white">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10">
        <a
          href="#"
          className="flex items-center gap-3"
          aria-label="Tene inicio"
        >
          <span className="brand-mark">T</span>
          <span className="text-lg font-black tracking-[0.22em]">TENE</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/55 md:flex">
          <button className="text-white" onClick={joinRoom}>
            Salas
          </button>
          <a className="transition hover:text-white" href="#ranking">
            Ranking
          </a>
          <a className="transition hover:text-white" href="#como-funciona">
            Cómo jugar
          </a>
        </nav>
        <button
          className="steam-button"
          disabled={sessionLoading}
          onClick={() =>
            session ? setScreen("dashboard") : setSteamOpen(true)
          }
        >
          <span className="steam-dot">
            {session?.user.nickname?.slice(0, 1).toUpperCase() ?? "T"}
          </span>
          {sessionLoading
            ? "Comprobando sesión…"
            : session
              ? "Ir a mi cuenta"
              : "Iniciar sesión / Registrarme"}
        </button>
      </header>

      <section className="landing-simple relative z-10 mx-auto max-w-[1440px] px-5 pb-20 pt-12 md:px-10 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl">
          <div className="eyebrow">
            <span /> CS2 competitivo · Perú
          </div>
          <h1 className="mt-6 text-[clamp(3.4rem,7vw,7.2rem)] font-black leading-[0.84] tracking-[-0.075em]">
            JUEGA.
            <br />
            <span className="gradient-text">COMPITE.</span>
            <br />
            GANA.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/55 md:text-lg">
            Partidas privadas 5v5 de CS2 para la comunidad peruana. Entra,
            compite con jugadores de tu nivel y demuestra tu juego.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button className="primary-button" onClick={joinRoom}>
              Ver salas disponibles <span>↗</span>
            </button>
            <div className="flex items-center gap-3 text-sm text-white/50">
              <span className="live-pulse" /> {publicData?.activePlayers ?? 0} jugadores en salas activas
            </div>
          </div>
          <div className="mt-10 flex gap-8 border-t border-white/8 pt-6">
            <div>
              <strong className="block text-xl">S/ 6</strong>
              <span className="text-xs text-white/40">entrada</span>
            </div>
            <div>
              <strong className="block text-xl">S/ 10</strong>
              <span className="text-xs text-white/40">por ganador</span>
            </div>
            <div>
              <strong className="block text-xl">5v5</strong>
              <span className="text-xs text-white/40">competitivo</span>
            </div>
          </div>
          <div className="hero-motivation">
            <span>CLUTCH</span><i />
            <span>COMUNICACIÓN</span><i />
            <span>EQUIPO</span>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative z-10 border-y border-white/7 bg-white/[0.018]"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px md:grid-cols-4">
          {[
            [
              "01",
              "Verifica tu nivel",
              "Conecta Steam y deja que nuestro staff valide tu cuenta.",
            ],
            [
              "02",
              "Recarga tu saldo",
              "Agrega saldo y reserva tu lugar en una sala.",
            ],
            [
              "03",
              "Draft y veto",
              "Capitanes balancean equipos y eligen el mapa.",
            ],
            [
              "04",
              "Juega y gana",
              "Los ganadores reciben S/ 10 directo a su saldo.",
            ],
          ].map(([number, title, copy]) => (
            <article
              key={number}
              className="border-white/7 p-6 md:border-l md:p-8"
            >
              <span className="font-mono text-xs text-violet-400">
                {number}
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/38">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="ranking"
        className="relative z-10 mx-auto grid max-w-[1440px] gap-10 px-5 py-20 md:px-10 lg:grid-cols-[.7fr_1.3fr]"
      >
        <div>
          <div className="eyebrow">
            <span /> Ranking abierto
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            El nivel se
            <br />
            demuestra jugando.
          </h2>
          <p className="mt-5 max-w-md leading-7 text-white/45">
            Cada partida suma historial y reputación. El staff calibra tu nivel
            inicial; después, tus resultados determinan si subes o bajas.
          </p>
        </div>
        <div className="ranking-card">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <strong>Ranking competitivo</strong>
            <span className="text-xs text-white/35">ACTUALIZADO HOY</span>
          </div>
          {(publicData?.ranking ?? []).map((player) => (
            <div className="ranking-row" key={player.userId}>
              <span className="font-mono text-violet-300">{String(player.position).padStart(2, "0")}</span>
              <strong>{player.name}</strong>
              <span className="level">LVL {player.level}</span>
              <span className="ml-auto font-mono text-sm">NIVEL {player.level}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/7 px-5 py-8 text-center text-xs text-white/30">
        TENE es una plataforma independiente y no está afiliada a Valve
        Corporation. Solo para mayores de 18 años.
      </footer>

      {steamOpen && (
        <SteamRegistrationModal
          close={() => setSteamOpen(false)}
          complete={completeOnboarding}
          identity={onboardingIdentity}
        />
      )}
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function SteamRegistrationModal({
  close,
  complete,
  identity,
}: {
  close: () => void;
  complete: () => Promise<void>;
  identity: { email: string; fullName: string | null } | null;
}) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [steamId, setSteamId] = useState("");
  const [fullName, setFullName] = useState(identity?.fullName ?? "");
  const [nickname, setNickname] = useState("");
  const [email] = useState(identity?.email ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [steamCheck, setSteamCheck] = useState<{ personaName: string; avatarUrl: string | null; profilePublic: boolean; gameDetailsPublic: boolean; ownsCs2: boolean; cs2Minutes: number; eligible: boolean } | null>(null);
  const validId = /^7656119\d{10}$/.test(steamId);
  const saveProfile = async () => {
    setSaving(true);
    setBackendMessage("");
    try {
      const response = await fetch("/api/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, nickname, email, birthDate, acceptTerms: acceptedLegal }),
      });
      if (response.status === 401) {
        window.location.href = "/signin-with-chatgpt?return_to=/";
        return;
      }
      if (!response.ok) throw new Error("No se pudo guardar el perfil");
      setStep(1);
    } catch {
      setBackendMessage("Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };
  const saveSteam = async () => {
    if (!validId) return;
    setSaving(true);
    setBackendMessage("");
    try {
      const response = await fetch("/api/me/steam", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ steamId64: steamId }),
      });
      if (response.status === 401) {
        window.location.href = "/signin-with-chatgpt?return_to=/";
        return;
      }
      if (!response.ok) throw new Error("No se pudo registrar Steam");
      const checkResponse = await fetch("/api/me/steam/recheck", { method: "POST" });
      if (!checkResponse.ok) throw new Error("No se pudo consultar Steam");
      const checked = await checkResponse.json() as { result: typeof steamCheck };
      setSteamCheck(checked.result);
      setStep(2);
    } catch {
      setBackendMessage("No pudimos registrar ese SteamID64.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="steam-registration"
        role="dialog"
        aria-modal="true"
        aria-labelledby="steam-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" aria-label="Cerrar" onClick={close}>
          ×
        </button>
        {step > 0 && (
          <div className="registration-progress">
            {[1, 2, 3].map((number) => (
              <span key={number} className={step >= number ? "active" : ""}>
                <i>{step > number ? "✓" : number}</i>
                <small>
                  {number === 1
                    ? "Steam"
                    : number === 2
                      ? "Requisitos"
                      : "Staff"}
                </small>
              </span>
            ))}
          </div>
        )}
        {step === 0 && (
          <>
            <div className="auth-switch">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Iniciar sesión
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => setMode("register")}
              >
                Registrarme
              </button>
            </div>
            <p className="eyebrow justify-center">CUENTA TENE</p>
            <h2 id="steam-title">
              {mode === "register" ? "Crea tu cuenta" : "Bienvenido de nuevo"}
            </h2>
            <p className="registration-copy">
              {mode === "register"
                ? "Primero creamos tu perfil TENE. Después vincularemos tu Steam de forma obligatoria."
                : "Ingresa con el correo de tu cuenta TENE."}
            </p>
            <div className="account-form">
              {mode === "register" && (
                <>
                  <label>
                    Nombre completo
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Nickname
                    <input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                    />
                  </label>
                </>
              )}
              <label>
                Correo electrónico
                <input
                  type="email"
                  value={email}
                  readOnly
                  autoComplete="email"
                />
                <small>Correo verificado por el sistema de acceso.</small>
              </label>
              <label>
                Seguridad
                <input value="Protegida por ChatGPT" disabled />
              </label>
              {mode === "register" && (
                <><label>
                  Fecha de nacimiento
                  <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                  <small>Debes ser mayor de 18 años. En tu cumpleaños recibes 2 salas gratis.</small>
                </label><label className="legal-consent"><input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} /><span>Acepto los términos, las reglas competitivas, la política de privacidad y confirmo que soy mayor de 18 años.</span></label></>
              )}
            </div>
            <button
              className="primary-button w-full"
              disabled={saving || (mode === "register" && identity !== null && !acceptedLegal)}
              onClick={() =>
                mode === "register"
                  ? identity
                    ? saveProfile()
                    : window.location.assign("/signin-with-chatgpt?return_to=/")
                  : window.location.assign("/signin-with-chatgpt?return_to=/")
              }
            >
              {mode === "register"
                ? identity ? "Siguiente: vincular Steam →" : "Validar correo y continuar"
                : "Iniciar sesión segura"}
            </button>
            <p className="auth-security">
              TENE no recibe ni almacena contraseñas. La sesión se valida de
              forma segura.
            </p>
            {backendMessage && (
              <p className="backend-error">{backendMessage}</p>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <span className="steam-logo-large">S</span>
            <p className="eyebrow justify-center">REGISTRO DE JUGADOR</p>
            <h2 id="steam-title">Conecta tu cuenta de Steam</h2>
            <p className="registration-copy">
              Steam confirma tu identidad. TENE nunca recibe ni almacena tu
              contraseña.
            </p>
            <label className="steam-id-field">
              SteamID64
              <input
                value={steamId}
                onChange={(event) =>
                  setSteamId(event.target.value.replace(/\D/g, "").slice(0, 17))
                }
              />
              <small>
                {validId
                  ? "✓ Formato válido de 17 dígitos"
                  : "Debe empezar con 7656119 y tener 17 dígitos"}
              </small>
              <a href="https://steamid.xyz/" target="_blank" rel="noreferrer">
                ¿No sabes tu SteamID64? Encuéntralo aquí ↗
              </a>
            </label>
            <button
              className="steam-openid-button"
              onClick={() => window.location.assign("/api/auth/steam")}
            >
              <span className="steam-dot">S</span>
              <span>
                <b>Vincular oficialmente con Steam</b>
                <small>OpenID verificado · recomendado</small>
              </span>
            </button>
            <div className="auth-divider">
              <span>o usa el SteamID64 escrito arriba</span>
            </div>
            <button
              className="primary-button w-full"
              disabled={!validId}
              onClick={saveSteam}
            >
              {saving ? "Guardando…" : "Continuar con Steam"}
            </button>
            {backendMessage && (
              <p className="backend-error">{backendMessage}</p>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <div className="steam-profile-preview">
              <img
                src={steamCheck?.avatarUrl ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${steamId}`}
                alt="Avatar del perfil de Steam"
              />
              <div>
                <small>PERFIL ENCONTRADO</small>
                <strong>{steamCheck?.personaName ?? "Cuenta Steam"}</strong>
                <span>{steamId}</span>
              </div>
            </div>
            <h2>Comprobación de requisitos</h2>
            <div className="registration-checks">
              <span>
                <i>{steamCheck?.profilePublic ? "✓" : "×"}</i>
                <b>Perfil público</b>
                <small>Información básica visible</small>
              </span>
              <span>
                <i>{steamCheck?.gameDetailsPublic ? "✓" : "×"}</i>
                <b>Detalles de juego públicos</b>
                <small>Biblioteca y horas visibles</small>
              </span>
              <span>
                <i>{(steamCheck?.cs2Minutes ?? 0) >= 30000 ? "✓" : "×"}</i>
                <b>{Math.floor((steamCheck?.cs2Minutes ?? 0) / 60).toLocaleString()} horas en CS2</b>
                <small>Supera el mínimo de 500 h</small>
              </span>
              <span>
                <i>{steamCheck?.ownsCs2 ? "✓" : "×"}</i>
                <b>CS2 detectado</b>
                <small>AppID 730 en la cuenta</small>
              </span>
            </div>
            <p className="registration-notice">
              Estas comprobaciones determinan si puedes solicitar revisión. Solo
              el staff puede habilitarte para entrar a salas.
            </p>
            <button
              className="primary-button w-full"
              disabled={!steamCheck?.eligible}
              onClick={() => setStep(3)}
            >
              {steamCheck?.eligible ? "Enviar solicitud al staff" : "Requisitos incompletos"}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <span className="pending-seal">⌛</span>
            <p className="eyebrow justify-center">SOLICITUD CREADA</p>
            <h2>Revisión pendiente</h2>
            <p className="registration-copy">
              Tu cuenta cumple los requisitos automáticos. El staff revisará el
              perfil y asignará un nivel inicial del 1 al 10.
            </p>
            <div className="request-ticket">
              <span>
                <small>SOLICITUD</small>VER-{steamId.slice(-8) || "PENDIENTE"}
              </span>
              <span>
                <small>ESTADO</small>
                <b>Pendiente</b>
              </span>
              <span>
                <small>TIEMPO ESTIMADO</small>Hasta 24 h
              </span>
            </div>
            <button className="primary-button w-full" onClick={() => void complete()}>
              Ir a mi cuenta
            </button>
            <button className="secondary-registration" onClick={close}>
              Cerrar y esperar revisión
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Dashboard({
  balance,
  activeTab,
  setActiveTab,
  openRoom,
  goHome,
  notice,
}: {
  balance: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openRoom: (roomId?: string) => void;
  goHome: () => void;
  notice: string;
}) {
  const tabs = [
    "Inicio",
    "Perfil",
    "Cuenta",
    "Salas",
    "Wallet",
    "Beneficios",
    "Conducta",
    "Historial",
    "Ranking",
    "Staff",
    "Finanzas",
    "Reglas legales",
  ];
  return (
    <main className="app-bg min-h-screen text-white" data-section={activeTab}>
      <aside className="app-sidebar">
        <button className="flex items-center gap-3" onClick={goHome}>
          <span className="brand-mark">T</span>
          <span className="font-black tracking-[.2em]">TENE</span>
        </button>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "active" : ""}
            >
              <span>
                {
                  (
                    {
                      Inicio: "⌂",
                      Salas: "◫",
                      Wallet: "◈",
                      Beneficios: "★",
                      Conducta: "◆",
                      Historial: "↺",
                      Ranking: "⌁",
                      Staff: "⚙",
                      "Reglas legales": "§",
                      Finanzas: "S/",
                    } as Record<string, string>
                  )[tab]
                }
              </span>
              {tab}
              {tab === "Staff" && <i className="staff-count">3</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar small bg-gradient-to-br from-violet-500 to-fuchsia-500">
            T
          </span>
          <div>
            <strong>Tom</strong>
            <small>Dueño · Acceso total</small>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">
              <span /> {({ Inicio: "CENTRO COMPETITIVO", Salas: "MATCHMAKING 5V5", Beneficios: "RECOMPENSAS DE COMUNIDAD", Ranking: "CAMINO A LA CIMA", Wallet: "FONDOS DEL JUGADOR", Chat: "COMUNIDAD EN VIVO", Conducta: "FAIR PLAY", Historial: "REGISTRO COMPETITIVO", Cuenta: "IDENTIDAD DEL JUGADOR", Perfil: "PERFIL COMPETITIVO", Alertas: "CENTRO DE AVISOS", Staff: "OPERACIONES TENE", Finanzas: "CONTROL FINANCIERO", "Reglas legales": "REGLAMENTO OFICIAL" } as Record<string, string>)[activeTab] ?? "PANEL DEL JUGADOR"}
            </p>
            <h1>{activeTab === "Inicio" ? "Buenos días, Tom" : activeTab}</h1>
          </div>
          <div className="header-actions">
            <button className="balance-chip">
              <small>SALDO DISPONIBLE</small>
              <strong>S/ {balance.toFixed(2)}</strong>
            </button>
            <button className="icon-button">●</button>
          </div>
        </header>
        <section className="dashboard-grid">
          <article className="verification-card">
            <div>
              <span className="verified-badge">✓ CUENTA VERIFICADA</span>
              <h2>Listo para competir</h2>
              <p>
                Tu SteamID64, perfil público y 1,284 horas de CS2 fueron
                revisados por el staff.
              </p>
            </div>
            <div className="level-orbit">
              <small>NIVEL</small>
              <strong>5</strong>
              <span>Nivel competitivo verificado</span>
            </div>
          </article>
          <article className="wallet-card">
            <div className="card-label">TU WALLET</div>
            <strong className="wallet-total">S/ {balance.toFixed(2)}</strong>
            <div className="wallet-split">
              <span>
                <small>Disponible</small>S/ {balance.toFixed(2)}
              </span>
              <span>
                <small>Bloqueado</small>S/ 0.00
              </span>
            </div>
            <div className="wallet-actions">
              <button onClick={() => setActiveTab("Wallet")}>
                ＋ Recargar
              </button>
              <button onClick={() => setActiveTab("Wallet")}>↗ Retirar</button>
            </div>
          </article>
          <article className="rooms-panel">
            <div className="panel-title">
              <div>
                <span className="live-pulse" />
                <strong>Salas disponibles</strong>
              </div>
              <button onClick={() => setActiveTab("Salas")}>Ver todas →</button>
            </div>
            <RoomRow
              name="Sala Violeta #184"
              players="4 / 10"
              average="LVL 6.8"
              openRoom={openRoom}
            />
            <RoomRow
              name="Sala Nocturna #183"
              players="8 / 10"
              average="LVL 8.2"
              openRoom={openRoom}
            />
            <RoomRow
              name="Sala Base #182"
              players="2 / 10"
              average="LVL 3.5"
              openRoom={openRoom}
            />
          </article>
          <article className="stats-card">
            <div className="card-label">TU RENDIMIENTO</div>
            <div className="stat-big">
              <strong>68%</strong>
              <span>WIN RATE</span>
            </div>
            <div className="stats-line">
              <span>
                <small>Partidas</small>19
              </span>
              <span>
                <small>Victorias</small>13
              </span>
              <span>
                <small>Racha</small>W3
              </span>
            </div>
          </article>
          <article className="activity-card">
            <div className="panel-title">
              <strong>Últimos movimientos</strong>
              <button onClick={() => setActiveTab("Historial")}>
                Historial →
              </button>
            </div>
            {[
              ["Premio · Sala #176", "+ S/ 10.00", "win"],
              ["Entrada · Sala #176", "− S/ 6.00", ""],
              ["Recarga Yape", "+ S/ 20.00", "win"],
            ].map(([label, value, tone]) => (
              <div className="activity-row" key={label}>
                <span className={tone ? "positive-dot" : "neutral-dot"} />
                <div>
                  <strong>{label}</strong>
                  <small>24 ago · 22:14</small>
                </div>
                <b className={tone ? "positive" : ""}>{value}</b>
              </div>
            ))}
          </article>
        </section>
      </div>
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function RoomRow({
  name,
  players: count,
  average,
  openRoom,
}: {
  name: string;
  players: string;
  average: string;
  openRoom: (roomId?: string) => void;
}) {
  const roomProfiles = name.includes("Violeta")
    ? [
        {
          name: "hoxhi",
          level: 10,
          elo: 1842,
          hours: 4260,
          conduct: "Excelente",
        },
        { name: "Tom", level: 8, elo: 1626, hours: 1284, conduct: "Excelente" },
        { name: "Jericho", level: 7, elo: 1514, hours: 2110, conduct: "Buena" },
        { name: "k1ng", level: 6, elo: 1438, hours: 980, conduct: "Buena" },
      ]
    : name.includes("Nocturna")
      ? [
          {
            name: "melo",
            level: 10,
            elo: 1791,
            hours: 3890,
            conduct: "Excelente",
          },
          { name: "navi", level: 8, elo: 1654, hours: 2740, conduct: "Buena" },
          {
            name: "shiro",
            level: 7,
            elo: 1532,
            hours: 1980,
            conduct: "Excelente",
          },
          { name: "loko", level: 6, elo: 1441, hours: 1105, conduct: "Buena" },
          { name: "ace", level: 5, elo: 1372, hours: 840, conduct: "Buena" },
        ]
      : [
          { name: "neo", level: 4, elo: 1218, hours: 720, conduct: "Buena" },
          {
            name: "rayo",
            level: 3,
            elo: 1140,
            hours: 610,
            conduct: "Excelente",
          },
        ];
  const creator = roomProfiles[0];
  return (
    <article className="room-row-rich">
      <div className="room-info">
        <div className="room-title-line">
          <span className="room-symbol">T</span>
          <div>
            <strong>{name}</strong>
            <small>
              <i /> Esperando jugadores
            </small>
          </div>
        </div>
        <div className="room-created">
          Creada por <ProfileAvatar profile={creator} compact />{" "}
          <b>{creator.name}</b>
        </div>
        <div className="room-economy">
          <span>
            <small>ENTRADA</small>S/ 6
          </span>
          <span>
            <small>PREMIO</small>S/ 10
          </span>
        </div>
      </div>
      <div className="room-people">
        <div className="room-capacity">
          <span>{count} jugadores</span>
          <div className="mini-progress">
            <i
              style={{ width: `${Number(count.split("/")[0].trim()) * 10}%` }}
            />
          </div>
        </div>
        <div className="avatar-strip">
          {roomProfiles.map((profile) => (
            <ProfileAvatar key={profile.name} profile={profile} />
          ))}
          {Array.from(
            { length: Math.max(0, 10 - roomProfiles.length) },
            (_, i) => (
              <span className="vacant-avatar" key={i} />
            ),
          )}
        </div>
      </div>
      <button className="room-enter" onClick={() => openRoom()}>
        Entrar <span>→</span>
      </button>
    </article>
  );
}

function ProfileAvatar({
  profile,
  compact = false,
}: {
  profile: {
    name: string;
    level: number;
    elo: number;
    hours: number;
    conduct: string;
    avatarUrl?: string | null;
    steamId64?: string | null;
  };
  compact?: boolean;
}) {
  return (
    <span className={`profile-anchor ${compact ? "compact" : ""}`} tabIndex={0}>
      <img
        src={
          profile.avatarUrl ??
          `https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.name}&backgroundColor=2e1065,312e81,164e63`
        }
        alt={`Avatar de ${profile.name}`}
      />
      <span className="profile-popover">
        <span className="profile-pop-head">
          <img
            src={
              profile.avatarUrl ??
              `https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.name}&backgroundColor=2e1065,312e81,164e63`
            }
            alt=""
          />
          <span>
            <strong>{profile.name}</strong>
            <small>Steam conectado · Verificado</small>
          </span>
          <b>LVL {profile.level}</b>
        </span>
        <span className="profile-stats">
          <span>
            <small>NIVEL</small>
            {profile.level}
          </span>
          <span>
            <small>HORAS CS2</small>
            {profile.hours.toLocaleString()}
          </span>
          <span>
            <small>CONDUCTA</small>
            {profile.conduct}
          </span>
        </span>
        {profile.steamId64 ? (
          <a href={`https://steamcommunity.com/profiles/${profile.steamId64}`} target="_blank" rel="noreferrer">Ver perfil de Steam ↗</a>
        ) : (
          <span className="profile-verified-label">Perfil TENE verificado</span>
        )}
      </span>
    </span>
  );
}

function RoomFlow({
  balance,
  bannedMaps,
  setBannedMaps,
  onReserve,
  joined,
  goBack,
  notice,
}: {
  balance: number;
  bannedMaps: string[];
  setBannedMaps: (maps: string[]) => void;
  onReserve: () => void;
  joined: boolean;
  goBack: () => void;
  notice: string;
}) {
  const remaining = mapPool.filter((map) => !bannedMaps.includes(map));
  const currentCaptain =
    bannedMaps.length % 2 === 0 ? "Capitán A" : "Capitán B";
  return (
    <main className="app-bg room-screen min-h-screen text-white">
      <header className="room-header">
        <button onClick={goBack}>← Volver a salas</button>
        <div>
          <span className="status-pill">
            <i /> SALA ABIERTA
          </span>
          <strong>Sala Violeta #184</strong>
        </div>
        <div className="room-balance">
          <small>SALDO</small>S/ {balance.toFixed(2)}
        </div>
      </header>
      <section className="room-layout">
        <div className="room-main">
          <div className="room-stage">
            <div>
              <p className="eyebrow">
                <span /> ETAPA 1 DE 3
              </p>
              <h1>{joined ? "Draft y veto" : "Reserva tu puesto"}</h1>
              <p>
                {joined
                  ? "La sala está en modo demostración. Prueba el veto de mapas para ver cómo funcionará cuando se complete."
                  : "El importe queda bloqueado al entrar y solo se liquida cuando termina la partida."}
              </p>
            </div>
            <div className="room-count">
              <strong>{joined ? "5" : "4"}/10</strong>
              <span>jugadores</span>
            </div>
          </div>
          {!joined ? (
            <article className="reserve-card">
              <div className="price-breakdown">
                <span>
                  <small>Entrada total</small>
                  <strong>S/ 6.00</strong>
                </span>
                <span>
                  <small>Fondo de premio</small>
                  <strong>S/ 5.00</strong>
                </span>
                <span>
                  <small>Servicio</small>
                  <strong>S/ 1.00</strong>
                </span>
              </div>
              <button className="primary-button" onClick={onReserve}>
                Confirmar y entrar por S/ 6
              </button>
              <p>
                Cuenta verificada · Saldo suficiente · Sin sanciones activas
              </p>
            </article>
          ) : (
            <VetoBoard
              bannedMaps={bannedMaps}
              remaining={remaining}
              currentCaptain={currentCaptain}
              ban={(map) =>
                remaining.length > 1 && setBannedMaps([...bannedMaps, map])
              }
              reset={() => setBannedMaps([])}
            />
          )}
        </div>
        <aside className="room-side">
          <div className="side-title">
            <strong>Jugadores</strong>
            <span>{joined ? 5 : 4}/10</span>
          </div>
          {[
            ...players,
            ...(joined
              ? [
                  {
                    name: "Tom",
                    level: 5,
                    tone: "from-violet-500 to-fuchsia-500",
                  },
                ]
              : []),
          ].map((p, i) => (
            <div className="side-player" key={`${p.name}-${i}`}>
              <span className={`avatar small bg-gradient-to-br ${p.tone}`}>
                {p.name[0]}
              </span>
              <div>
                <strong>{p.name}</strong>
                <small>{i < 2 ? "Capitán provisional" : "Verificado"}</small>
              </div>
              <span className="level">LVL {p.level}</span>
            </div>
          ))}
          {Array.from({ length: joined ? 5 : 6 }, (_, i) => (
            <div className="side-empty" key={i}>
              Puesto disponible
            </div>
          ))}
        </aside>
      </section>
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function VetoBoard({
  bannedMaps,
  remaining,
  currentCaptain,
  ban,
  reset,
  next,
}: {
  bannedMaps: string[];
  remaining: string[];
  currentCaptain: string;
  ban: (map: string) => void;
  reset: () => void;
  next?: () => void;
}) {
  return (
    <article className="veto-card">
      <div className="veto-head">
        <div>
          <small>TURNO ACTUAL</small>
          <strong>
            {remaining.length === 1
              ? "Mapa definido"
              : `${currentCaptain} banea`}
          </strong>
        </div>
        <button onClick={reset}>Reiniciar demo</button>
      </div>
      <div className="maps-grid">
        {mapPool.map((map) => {
          const banned = bannedMaps.includes(map);
          const selected = remaining.length === 1 && remaining[0] === map;
          return (
            <button
              key={map}
              disabled={banned || selected}
              onClick={() => ban(map)}
              className={`${banned ? "banned" : ""} ${selected ? "selected" : ""}`}
            >
              <span>{map.slice(0, 2).toUpperCase()}</span>
              <strong>{map}</strong>
              <small>
                {banned ? "BANEADO" : selected ? "MAPA ELEGIDO" : "BANEAR"}
              </small>
            </button>
          );
        })}
      </div>
      <div className="veto-log">
        <span>
          Veto:{" "}
          {bannedMaps.length
            ? bannedMaps.join(" → ")
            : "Aún no hay mapas baneados"}
        </span>
        {remaining.length === 1 && (
          <strong>{remaining[0]} · El otro capitán elige CT o T</strong>
        )}
      </div>
      {remaining.length === 1 && next && (
        <div className="veto-next">
          <button className="primary-button" onClick={next}>
            Preparar servidor →
          </button>
        </div>
      )}
    </article>
  );
}

function EnhancedDashboard({
  balance,
  setBalance,
  activeTab,
  setActiveTab,
  openRoom,
  goHome,
  notice,
  setNotice,
  session,
}: {
  balance: number;
  setBalance: (value: number | ((value: number) => number)) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openRoom: (roomId?: string) => void;
  goHome: () => void;
  notice: string;
  setNotice: (value: string) => void;
  session: SessionData | null;
}) {
  const nickname = session?.user.nickname ?? "Jugador";
  const roleLabels: Record<SessionData["user"]["role"], string> = {
    player: "Jugador",
    sub: "Sub",
    streamer: "Streamer",
    mod: "Moderador",
    admin: "Administrador",
    owner: "Dueño",
  };
  const tabs = [
    "Inicio",
    "Cuenta",
    "Salas",
    "Wallet",
    "Beneficios",
    "Conducta",
    "Chat",
    "Alertas",
    "Historial",
    "Ranking",
    "Staff",
    "Finanzas",
  ].filter((tab) => {
    if (tab === "Finanzas")
      return session?.user.role === "owner" || session?.user.role === "admin";
    if (tab === "Staff")
      return ["owner", "admin", "mod"].includes(session?.user.role ?? "");
    return true;
  });
  const [walletAction, setWalletAction] = useState<
    "deposit" | "withdraw" | null
  >(null);
  const [amount, setAmount] = useState("20");
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "plin">("yape");
  const [operationCode, setOperationCode] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentTime, setPaymentTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [payerName, setPayerName] = useState("");
  const [withdrawalName, setWithdrawalName] = useState("");
  const [withdrawalPhone, setWithdrawalPhone] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };
  const applyWallet = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const form = new FormData();
    form.set("type", walletAction === "deposit" ? "deposit" : "withdrawal");
    form.set("method", paymentMethod);
    form.set("amountCents", String(Math.round(value * 100)));
    if (walletAction === "deposit") {
      form.set("operationCode", operationCode);
      form.set("paymentDate", paymentDate);
      form.set("paymentTime", paymentTime);
      form.set("payerName", payerName);
      if (paymentProof) form.set("proof", paymentProof);
    } else {
      form.set("destinationName", withdrawalName);
      form.set("destinationPhone", withdrawalPhone);
    }
    const response = await fetch("/api/wallet", { method: "POST", body: form });
    const body = (await response.json()) as {
      error?: string;
      wallet?: { availableCents: number };
    };
    const labels: Record<string, string> = {
      operation_code_required: "Ingresa el código de operación de Yape o Plin",
      proof_required: "Adjunta una captura del comprobante",
      invalid_proof: "El comprobante debe ser JPG, PNG o WebP y pesar máximo 5 MB",
      withdrawal_minimum: "El retiro mínimo es S/ 10",
      one_room_required: "Debes haber participado en una sala antes de retirar",
      insufficient_balance: "No tienes saldo suficiente",
      duplicate_operation: "Ese código de operación ya fue registrado",
      invalid_request: "Revisa el monto y los datos de la solicitud",
      withdrawal_destination_required: "Ingresa el titular y un celular peruano válido de 9 dígitos",
      payment_datetime_required: "Confirma la fecha y hora que aparecen en el voucher",
    };
    if (!response.ok)
      return flash(
        labels[body.error ?? ""] ?? "No se pudo registrar la solicitud",
      );
    if (body.wallet) setBalance(body.wallet.availableCents / 100);
    flash(
      walletAction === "deposit"
        ? "Recarga enviada · pendiente de validación del staff"
        : "Retiro solicitado · saldo bloqueado hasta su aprobación",
    );
    setOperationCode("");
    setPaymentProof(null);
    setProofPreview("");
    setPayerName("");
    setWithdrawalName("");
    setWithdrawalPhone("");
    setWalletAction(null);
  };
  return (
    <main className="app-bg min-h-screen text-white">
      <aside className="app-sidebar">
        <button className="flex items-center gap-3" onClick={goHome}>
          <span className="brand-mark">T</span>
          <span className="font-black tracking-[.2em]">TENE</span>
        </button>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "active" : ""}
            >
              <span>
                {
                  (
                    {
                      Inicio: "⌂",
                      Perfil: "◉",
                      Cuenta: "◎",
                      Salas: "◫",
                      Wallet: "◈",
                      Beneficios: "★",
                      Conducta: "◆",
                      Chat: "#",
                      Alertas: "●",
                      Historial: "↺",
                      Ranking: "⌁",
                      Staff: "⚙",
                    } as Record<string, string>
                  )[tab]
                }
              </span>
              {tab}
              {tab === "Staff" && <i className="staff-count">3</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {session?.user.steamAvatarUrl ? (
            <img
              className="avatar small"
              src={session.user.steamAvatarUrl}
              alt={`Avatar de ${nickname}`}
            />
          ) : (
            <span className="avatar small bg-gradient-to-br from-violet-500 to-fuchsia-500">
              {nickname.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <strong>{nickname}</strong>
            <small>
              {session
                ? roleLabels[session.user.role]
                : "Sesión de demostración"}
            </small>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <nav className="dashboard-topbar">
          <button className="topbar-brand" onClick={goHome}><span className="brand-mark">T</span><b>TENE</b></button>
          <div className="primary-navigation">
            {["Salas", "Beneficios", "Ranking"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setProfileMenuOpen(false); }}>{tab}</button>)}
          </div>
          <div className="topbar-account">
            <button className="topbar-balance" onClick={() => { setActiveTab("Wallet"); setProfileMenuOpen(false); }}>S/ {balance.toFixed(2)}</button>
            <div className="profile-menu-wrap" onMouseEnter={() => setProfileMenuOpen(true)} onMouseLeave={() => setProfileMenuOpen(false)}>
              <button className="profile-trigger" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}>
                {session?.user.steamAvatarUrl ? <img src={session.user.steamAvatarUrl} alt="" /> : <span>{nickname.slice(0, 1).toUpperCase()}</span>}
                <span><b>{nickname}</b><small>LVL {session?.rating?.level ?? session?.user.level ?? 1}</small></span><i>⌄</i>
              </button>
              {profileMenuOpen && <div className="profile-dropdown">
                <button onClick={() => { setActiveTab("Cuenta"); setProfileMenuOpen(false); }}>◎ Mi cuenta</button>
                <button onClick={() => { setActiveTab("Wallet"); setProfileMenuOpen(false); }}>◈ Wallet</button>
                <button onClick={() => { setWalletAction("deposit"); setProfileMenuOpen(false); }}>＋ Recargar</button>
                <button onClick={() => { setWalletAction("withdraw"); setProfileMenuOpen(false); }}>↗ Retirar</button>
                <button onClick={() => { setActiveTab("Historial"); setProfileMenuOpen(false); }}>↺ Partidas</button>
                <button onClick={() => { setActiveTab("Conducta"); setProfileMenuOpen(false); }}>◆ Conducta</button>
                <button onClick={() => { setActiveTab("Chat"); setProfileMenuOpen(false); }}># Chat y soporte</button>
                <button onClick={() => { setActiveTab("Alertas"); setProfileMenuOpen(false); }}>● Alertas</button>
                {tabs.includes("Staff") && <button onClick={() => { setActiveTab("Staff"); setProfileMenuOpen(false); }}>⚙ Staff</button>}
                {tabs.includes("Finanzas") && <button onClick={() => { setActiveTab("Finanzas"); setProfileMenuOpen(false); }}>S/ Finanzas</button>}
                <button onClick={() => { setActiveTab("Reglas legales"); setProfileMenuOpen(false); }}>§ Reglas legales</button>
                <a href="/signout-with-chatgpt?return_to=/">⇥ Cerrar sesión</a>
              </div>}
            </div>
          </div>
        </nav>
        <header className="app-header">
          <div>
            <p className="eyebrow">
              <span /> PANEL DEL JUGADOR
            </p>
            <h1>
              {activeTab === "Inicio" ? `Buenos días, ${nickname}` : activeTab}
            </h1>
          </div>
        </header>
        {activeTab === "Inicio" && (
          <HomePanel
            balance={balance}
            openRoom={openRoom}
            setActiveTab={setActiveTab}
            wallet={(action) => setWalletAction(action)}
            session={session}
          />
        )}
        {activeTab === "Perfil" && <PublicProfilePanel session={session} />}
        {activeTab === "Salas" && (
          <RoomsPanel
            openRoom={openRoom}
            session={session}
            setBalance={setBalance}
            notify={flash}
          />
        )}
        {activeTab === "Wallet" && (
          <WalletPanel
            setBalance={setBalance}
            action={(value) => setWalletAction(value)}
            session={session}
          />
        )}
        {activeTab === "Beneficios" && <BenefitsPanel notify={flash} />}
        {activeTab === "Conducta" && <ConductPanel notify={flash} />}
        {activeTab === "Chat" && (
          <CommunityChat notify={flash} session={session} />
        )}
        {activeTab === "Alertas" && <NotificationsPanel notify={flash} />}
        {activeTab === "Historial" && <HistoryPanel />}
        {activeTab === "Ranking" && <RankingPanel />}
        {activeTab === "Staff" && <StaffPanel notify={flash} />}
        {activeTab === "Finanzas" && <FinancePanel notify={flash} />}
        {activeTab === "Cuenta" && <AccountPanel session={session} />}
        {activeTab === "Reglas legales" && <LegalPanel />}
      </div>
      {walletAction && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setWalletAction(null)}
        >
          <section
            className="wallet-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setWalletAction(null)}
            >
              ×
            </button>
            <span className="wallet-modal-icon">
              {walletAction === "deposit" ? "+" : "↗"}
            </span>
            <p className="card-label">
              {walletAction === "deposit"
                ? "RECARGA CON YAPE / PLIN"
                : "RETIRO DE SALDO"}
            </p>
            <h2>
              {walletAction === "deposit"
                ? "Agregar saldo"
                : "Solicitar retiro"}
            </h2>
            {walletAction === "withdraw" && <><label>
              Monto en soles
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label><label>
              Método
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as "yape" | "plin")
                }
              >
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </label></>}
            {walletAction === "deposit" ? (
              <div className="voucher-form">
                <div className="voucher-status">🔒 Revisa que los datos coincidan con tu voucher antes de enviarlo.</div>
                <label className="voucher-preview">{proofPreview ? <img src={proofPreview} alt="Vista previa del voucher" /> : <span>Sube tu voucher<br/><small>JPG, PNG o WebP</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setPaymentProof(file); if (!file) return setProofPreview(""); const reader = new FileReader(); reader.onload = () => setProofPreview(String(reader.result ?? "")); reader.readAsDataURL(file); }} /></label>
                <div className="voucher-fields">
                  <label>Aplicación<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "yape" | "plin")}><option value="yape">Yape</option><option value="plin">Plin</option></select></label>
                  <label>Llegó a la cuenta<input value="Cuenta oficial TENE" readOnly /></label>
                  <label>Monto (S/)<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
                  <label>N.º de operación<input value={operationCode} onChange={(event) => setOperationCode(event.target.value.replace(/\s/g, ""))} placeholder="Código del voucher" /></label>
                  <label>Fecha del pago<input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></label>
                  <label>Hora del pago<input type="time" value={paymentTime} onChange={(event) => setPaymentTime(event.target.value)} /></label>
                  <label className="voucher-payer">Tu nombre en Yape/Plin (opcional)<input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="Como aparece al pagar" /></label>
                </div>
                <small className="voucher-warning">El saldo quedará pendiente hasta que el administrador valide el comprobante. Vouchers falsos o repetidos pueden generar suspensión.</small>
              </div>
            ) : (
              <div className="withdrawal-fields"><p className="wallet-help">Disponible: S/ {balance.toFixed(2)} · Retiro mínimo S/ 10 · Haber jugado una sala.</p><label>Titular de Yape/Plin<input value={withdrawalName} onChange={(event) => setWithdrawalName(event.target.value)} placeholder="Nombre completo" /></label><label>Celular de destino<input inputMode="numeric" value={withdrawalPhone} onChange={(event) => setWithdrawalPhone(event.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="9XXXXXXXX" /></label></div>
            )}
            <button className="primary-button w-full" onClick={applyWallet}>
              Enviar solicitud
            </button>
          </section>
        </div>
      )}
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function AccountPanel({ session }: { session: SessionData | null }) {
  const [tab, setTab] = useState<
    "Cuenta" | "Steam" | "Partidas" | "Conducta" | "Movimientos" | "Privacidad"
  >("Cuenta");
  const [steamState, setSteamState] = useState<{
    steam?: {
      steamId64: string;
      personaName: string | null;
      avatarUrl: string | null;
      status: string;
      cs2Minutes: number;
    };
    lastCheck?: {
      profilePublic: boolean;
      gameDetailsPublic: boolean;
      ownsCs2: boolean;
      eligible: boolean;
    };
  } | null>(null);
  const [steamStatus, setSteamStatus] = useState("");
  const [checkingSteam, setCheckingSteam] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const [historyVisible, setHistoryVisible] = useState(session?.privacy?.matchHistoryVisible ?? true);
  const [privacyStatus, setPrivacyStatus] = useState("");
  const loadSteam = async () => {
    const response = await fetch("/api/me/steam/recheck");
    if (response.ok) setSteamState(await response.json());
  };
  useEffect(() => {
    const steamResult = new URLSearchParams(window.location.search).get(
      "steam",
    );
    if (steamResult === "verified" || steamResult === "linked") {
      setTab("Steam");
      window.history.replaceState({}, "", window.location.pathname);
    }
    void loadSteam();
  }, []);
  const recheckSteam = async () => {
    setCheckingSteam(true);
    setSteamStatus("");
    try {
      const response = await fetch("/api/me/steam/recheck", { method: "POST" });
      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: { eligible: boolean; reason: string; cs2Minutes: number };
      };
      const labels: Record<string, string> = {
        profile_private: "Steam todavía reporta el perfil como privado.",
        game_details_private: "Los detalles de juego siguen privados.",
        cs2_not_visible: "CS2 no aparece visible en la biblioteca.",
        hours_below_minimum: "La cuenta tiene menos de 500 horas visibles.",
        steam_api_unavailable: "Steam no respondió; inténtalo nuevamente.",
        eligible: "Cuenta apta para revisión del staff.",
      };
      setSteamStatus(
        body.ok && body.result
          ? labels[body.result.reason]
          : (labels[body.error ?? ""] ??
              "No se pudo completar la comprobación."),
      );
      await loadSteam();
    } finally {
      setCheckingSteam(false);
    }
  };
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileStatus("Guardando…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/me", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        nickname: form.get("nickname"),
        email: form.get("email"),
        birthDate: form.get("birthDate"),
        acceptTerms: form.get("acceptTerms") === "on",
      }),
    });
    setProfileStatus(
      response.ok
        ? "Cambios guardados."
        : "No se pudieron guardar los cambios.",
    );
  };
  const savePrivacy = async (visible: boolean) => {
    setHistoryVisible(visible);
    setPrivacyStatus("Guardando…");
    const response = await fetch("/api/me/privacy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ matchHistoryVisible: visible }) });
    if (!response.ok) setHistoryVisible(!visible);
    setPrivacyStatus(response.ok ? "Preferencia guardada." : "No se pudo guardar la preferencia.");
  };
  return (
    <section className="account-panel">
      <div className="account-tabs">
        <button
          className={tab === "Cuenta" ? "active" : ""}
          onClick={() => setTab("Cuenta")}
        >
          Cuenta
        </button>
        <button
          className={tab === "Steam" ? "active" : ""}
          onClick={() => setTab("Steam")}
        >
          Steam
        </button>
        {(["Partidas", "Conducta", "Movimientos", "Privacidad"] as const).map(
          (item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      {tab === "Cuenta" && (
        <div className="account-surface">
          <div className="account-title">
            <div>
              <span className="verified-badge">CUENTA ACTIVA</span>
              <h2>Información de la cuenta</h2>
              <p>Administra tus datos personales y seguridad.</p>
            </div>
            <span className="birthday-gift">
              🎁 2 salas gratis en tu cumpleaños
            </span>
          </div>
          <form onSubmit={saveProfile}>
            <div className="profile-fields">
              <label>
                Nombre completo
                <input
                  name="fullName"
                  defaultValue={session?.user.fullName ?? ""}
                />
              </label>
              <label>
                Nickname
                <input
                  name="nickname"
                  defaultValue={session?.user.nickname ?? ""}
                />
              </label>
              <label>
                Correo electrónico
                <input
                  name="email"
                  type="email"
                  defaultValue={session?.user.email ?? ""}
                />
              </label>
              <label>
                Fecha de nacimiento
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={session?.user.birthDate ?? ""}
                />
              </label>
            </div>
            <button className="primary-button" type="submit">
              Guardar cambios
            </button>
            {session?.user.legalVersion !== "2026-08-27" && <label className="legal-consent"><input name="acceptTerms" type="checkbox" required /><span>Acepto la versión vigente de los términos, reglas competitivas y política de privacidad.</span></label>}
            {profileStatus && (
              <p className="steam-check-result">{profileStatus}</p>
            )}
          </form>
          <div className="password-section">
            <h3>Sesión y seguridad</h3>
            <p className="wallet-help">
              Tu acceso está protegido por ChatGPT. TENE no almacena tu
              contraseña.
            </p>
            <a
              className="secondary-button"
              href="/signout-with-chatgpt?return_to=/"
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      )}
      {tab === "Steam" && (
        <div className="account-surface">
          <div className="account-title">
            <div>
              <span className="verified-badge">
                {steamState?.steam?.status === "verified"
                  ? "✓ STEAM VERIFICADO"
                  : "STEAM VINCULADO · REVISIÓN PENDIENTE"}
              </span>
              <h2>Cuenta de Steam</h2>
              <p>Esta asociación protege tu identidad competitiva.</p>
            </div>
          </div>
          <div className="linked-steam">
            <img
              src={
                steamState?.steam?.avatarUrl ??
                "https://api.dicebear.com/9.x/thumbs/svg?seed=Steam&backgroundColor=2e1065,312e81"
              }
              alt="Avatar Steam"
            />
            <div>
              <strong>
                {steamState?.steam?.personaName ?? "Cuenta vinculada"}
              </strong>
              <span>
                {steamState?.steam?.steamId64 ?? "Cargando SteamID64…"}
              </span>
              <small>
                {steamState?.steam?.status === "verified"
                  ? "Requisitos automáticos aprobados"
                  : "Pendiente de validación automática o staff"}
              </small>
            </div>
            <b>LVL {session?.rating?.level ?? session?.user.level ?? 1}</b>
          </div>
          <div className="steam-validation">
            <strong>
              {steamState?.steam
                ? `${Math.floor(steamState.steam.cs2Minutes / 60).toLocaleString()} horas de CS2 detectadas`
                : "Consultando Steam…"}
            </strong>
            <span>
              {steamState?.lastCheck
                ? `${steamState.lastCheck.profilePublic ? "Perfil público" : "Perfil privado"} · ${steamState.lastCheck.gameDetailsPublic ? "Juegos públicos" : "Juegos privados"} · ${steamState.lastCheck.ownsCs2 ? "CS2 visible" : "CS2 no visible"}`
                : "Sin comprobación registrada"}
            </span>
            <button
              className="secondary-button"
              disabled={checkingSteam || !steamState?.steam}
              onClick={recheckSteam}
            >
              {checkingSteam ? "Comprobando…" : "Volver a comprobar ahora"}
            </button>
            {steamStatus && <p className="steam-check-result">{steamStatus}</p>}
          </div>
          <p className="permanent-link">
            La vinculación es personal y no puede cambiarse sin revisión del
            staff.
          </p>
        </div>
      )}
      {tab === "Partidas" && (
        <div className="account-surface account-section-content">
          <div className="account-title">
            <div>
              <span className="verified-badge">HISTORIAL COMPETITIVO</span>
              <h2>Partidas competitivas</h2>
              <p>Tu actividad aparecerá aquí después de jugar una sala real.</p>
            </div>
          </div>
          <div className="account-metric-grid">
            <span>
              <small>Partidas</small>
              <strong>{session?.rating?.matches ?? 0}</strong>
            </span>
            <span>
              <small>Victorias</small>
              <strong>{session?.rating?.wins ?? 0}</strong>
            </span>
            <span>
              <small>Derrotas</small>
              <strong>{session?.rating?.losses ?? 0}</strong>
            </span>
            <span>
              <small>Nivel</small>
              <strong>LVL {session?.rating?.level ?? session?.user.level ?? 1}</strong>
            </span>
          </div>
        </div>
      )}
      {tab === "Conducta" && (
        <div className="account-surface account-section-content">
          <div className="account-title">
            <div>
              <span className="verified-badge">SIN SANCIONES ACTIVAS</span>
              <h2>Estado de conducta</h2>
              <p>
                Aquí se mostrarán advertencias, multas, suspensiones y
                apelaciones.
              </p>
            </div>
          </div>
          <div className="account-info-row">
            <strong>Estado actual</strong>
            <span>Buena conducta</span>
          </div>
          <div className="account-info-row">
            <strong>Abandonos</strong>
            <span>0 registrados</span>
          </div>
          <div className="account-info-row">
            <strong>Apelaciones</strong>
            <span>Ninguna pendiente</span>
          </div>
        </div>
      )}
      {tab === "Movimientos" && (
        <div className="account-surface account-section-content">
          <div className="account-title">
            <div>
              <span className="verified-badge">WALLET TENE</span>
              <h2>Movimientos de saldo</h2>
              <p>Recargas, reservas, premios, retiros y penalizaciones.</p>
            </div>
          </div>
          <WalletActivity compact />
        </div>
      )}
      {tab === "Privacidad" && (
        <div className="account-surface account-section-content">
          <div className="account-title">
            <div>
              <span className="verified-badge">CONTROL DE PERFIL</span>
              <h2>Privacidad</h2>
              <p>
                Los datos competitivos necesarios permanecen visibles para
                verificar partidas.
              </p>
            </div>
          </div>
          <label className="privacy-option">
            <span>
              <strong>Perfil público</strong>
              <small>Requerido para participar en salas.</small>
            </span>
            <input type="checkbox" defaultChecked disabled />
          </label>
          <label className="privacy-option">
            <span>
              <strong>Historial de partidas</strong>
              <small>Permite que otros jugadores revisen tus resultados.</small>
            </span>
            <input type="checkbox" checked={historyVisible} onChange={(event) => void savePrivacy(event.target.checked)} />
          </label>
          <label className="privacy-option">
            <span>
              <strong>Mostrar horas de CS2</strong>
              <small>Necesario para conservar la verificación.</small>
            </span>
            <input type="checkbox" defaultChecked disabled />
          </label>
          {privacyStatus && <p className="steam-check-result">{privacyStatus}</p>}
        </div>
      )}
    </section>
  );
}

function LegalPanel() {
  return <section className="legal-panel">
    <div className="legal-hero"><span className="verified-badge">VERSIÓN 27/08/2026</span><h2>Reglas, dinero y privacidad sin letra pequeña</h2><p>Resumen operativo aplicable a todos los jugadores de TENE.</p></div>
    <div className="legal-grid">
      <article><h3>Participación</h3><p>Servicio exclusivo para mayores de 18 años. Se requiere SteamID64 propio, perfil y detalles de juego públicos, CS2 visible, mínimo 500 horas y aprobación del staff.</p></article>
      <article><h3>Entrada y premios</h3><p>La entrada cuesta S/ 6. Se bloquea antes de entrar: S/ 5 financian el premio y S/ 1 corresponde al servicio. Cada integrante del equipo ganador recibe S/ 10.</p></article>
      <article><h3>Faltas</h3><p>No presentarse implica S/ 3 de penalidad. Abandonar implica S/ 12. Hacks, suplantación, colusión o manipulación pueden ocasionar cancelación, pérdida de la entrada y suspensión o baneo.</p></article>
      <article><h3>Recargas y retiros</h3><p>Las recargas aprobadas se convierten en saldo retirables; no se revierten como compra. Para retirar debes haber jugado al menos una sala. Cada operación queda registrada y revisada.</p></article>
      <article><h3>Impugnaciones</h3><p>Un reporte congela la liquidación hasta revisión. Debe indicar motivo, jugador y evidencia cuando exista. El staff puede confirmar el resultado, cancelar o sancionar.</p></article>
      <article><h3>Privacidad</h3><p>TENE usa identidad, mayoría de edad, SteamID64, horas, avatar, resultados y movimientos para operar las salas. Nunca almacena tu contraseña de ChatGPT ni de Steam.</p></article>
    </div>
    <div className="legal-note"><strong>Juego competitivo, no apuesta contra la casa.</strong><span>TENE no fija cuotas ni participa como rival. Organiza partidas de habilidad y cobra una tarifa de servicio informada.</span></div>
  </section>;
}

function HomePanel({
  balance,
  openRoom,
  setActiveTab,
  wallet,
  session,
}: {
  balance: number;
  openRoom: (roomId?: string) => void;
  setActiveTab: (tab: string) => void;
  wallet: (action: "deposit" | "withdraw") => void;
  session: SessionData | null;
}) {
  const [homeRooms, setHomeRooms] = useState<RoomData[]>([]);
  useEffect(() => { void fetch("/api/rooms").then(async (response) => { if (response.ok) setHomeRooms(((await response.json()) as { rooms: RoomData[] }).rooms.slice(0, 3)); }); }, []);
  const rating = session?.rating;
  const user = session?.user;
  const statusCopy = user
    ? user.status === "verified"
      ? "Cuenta verificada"
      : user.steamId64
        ? "Pendiente de revisión del staff"
        : "Vincula tu cuenta de Steam"
    : "Sesión de demostración";
  const hours = Math.floor((user?.cs2Minutes ?? 0) / 60);
  const winRate = rating?.matches
    ? Math.round((rating.wins / rating.matches) * 100)
    : 0;
  return (
    <section className="dashboard-grid">
      <article className="verification-card">
        <div>
          <span className="verified-badge">{statusCopy.toUpperCase()}</span>
          <h2>
            {user?.status === "verified" ? "Listo para competir" : statusCopy}
          </h2>
          <p>
            {user?.steamId64
              ? `SteamID64 ${user.steamId64} · ${hours.toLocaleString()} horas de CS2`
              : "Completa la vinculación de Steam para validar tu perfil y horas de CS2."}
          </p>
          <button
            className="text-action"
            onClick={() => setActiveTab("Cuenta")}
          >
            Ver datos de verificación →
          </button>
        </div>
        <div className="level-orbit">
          <small>NIVEL</small>
          <strong>{rating?.level ?? user?.level ?? 1}</strong>
          <span>NIVEL {rating?.level ?? session?.user.level ?? 1}</span>
        </div>
      </article>
      <article className="wallet-card">
        <div className="card-label">TU WALLET</div>
        <strong className="wallet-total">S/ {balance.toFixed(2)}</strong>
        <div className="wallet-split">
          <span>
            <small>Disponible</small>S/ {balance.toFixed(2)}
          </span>
          <span>
            <small>Bloqueado</small>S/{" "}
            {((session?.wallet?.lockedCents ?? 0) / 100).toFixed(2)}
          </span>
        </div>
        <div className="wallet-actions">
          <button onClick={() => wallet("deposit")}>＋ Recargar</button>
          <button onClick={() => wallet("withdraw")}>↗ Retirar</button>
        </div>
      </article>
      <article className="rooms-panel">
        <div className="panel-title">
          <div>
            <span className="live-pulse" />
            <strong>Salas disponibles</strong>
          </div>
          <button onClick={() => setActiveTab("Salas")}>Ver todas →</button>
        </div>
        {homeRooms.map((room) => <RealRoomRow key={room.id} room={room} join={() => setActiveTab("Salas")} />)}
        {!homeRooms.length && <p className="wallet-help">No hay salas registradas.</p>}
      </article>
      <article className="stats-card">
        <div className="card-label">TU RENDIMIENTO</div>
        <div className="stat-big">
          <strong>{winRate}%</strong>
          <span>WIN RATE</span>
        </div>
        <div className="stats-line">
          <span>
            <small>Partidas</small>
            {rating?.matches ?? 0}
          </span>
          <span>
            <small>Victorias</small>
            {rating?.wins ?? 0}
          </span>
          <span>
            <small>Derrotas</small>
            {rating?.losses ?? 0}
          </span>
        </div>
      </article>
      <article className="activity-card">
        <div className="panel-title">
          <strong>Últimos movimientos</strong>
          <button onClick={() => setActiveTab("Historial")}>Historial →</button>
        </div>
        <WalletActivity compact />
      </article>
    </section>
  );
}

function RoomsPanel({
  openRoom,
  session,
  setBalance,
  notify,
}: {
  openRoom: (roomId?: string) => void;
  session: SessionData | null;
  setBalance: (value: number) => void;
  notify: (message: string) => void;
}) {
  const [realRooms, setRealRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRooms = async () => {
    const response = await fetch("/api/rooms");
    if (response.ok) {
      const body = (await response.json()) as { rooms: RoomData[] };
      setRealRooms(body.rooms);
    }
    setLoading(false);
  };
  useEffect(() => {
    void loadRooms();
  }, []);
  const createRoom = async () => {
    const name = window.prompt("Nombre de la nueva sala", "Sala TENE");
    if (!name) return;
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    notify(
      response.ok
        ? "Sala creada correctamente"
        : "No tienes permiso para crear salas",
    );
    if (response.ok) await loadRooms();
  };
  const join = async (roomId: string) => {
    const response = await fetch(`/api/rooms/${roomId}/join`, {
      method: "POST",
    });
    const body = (await response.json()) as {
      error?: string;
      wallet?: { availableCents: number };
      alreadyJoined?: boolean;
      usedPass?: boolean;
    };
    const labels: Record<string, string> = {
      insufficient_balance: "Saldo insuficiente: necesitas S/ 6 disponibles",
      staff_verification_required:
        "El staff debe verificar tu cuenta antes de jugar",
      room_full: "La sala ya está completa",
      room_unavailable: "La sala ya no está disponible",
      authentication_required: "Inicia sesión para reservar",
      legal_acceptance_required: "Acepta las reglas vigentes desde Cuenta antes de jugar",
    };
    if (!response.ok)
      return notify(
        labels[body.error ?? ""] ?? "No se pudo reservar el puesto",
      );
    if (body.wallet) setBalance(body.wallet.availableCents / 100);
    notify(
      body.alreadyJoined
        ? "Ya tienes un puesto en esta sala"
        : body.usedPass ? "Puesto reservado · pase gratuito utilizado" : "Puesto reservado · S/ 6 bloqueados",
    );
    await loadRooms();
    openRoom(roomId);
  };
  const canCreate =
    session && ["owner", "admin", "mod"].includes(session.user.role);
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">
            {realRooms.length} SALAS REGISTRADAS
          </span>
          <h2>Elige dónde competir</h2>
          <p>
            Tu saldo se bloquea al reservar el puesto. Todos los niveles pueden
            jugar; el draft mantiene el balance.
          </p>
        </div>
        {canCreate && <button className="create-room-action" onClick={createRoom}>＋ Crear sala</button>}
      </div>
      <div className="rooms-with-chat">
      <div className="rooms-catalog">
        {loading && <p className="wallet-help">Cargando salas…</p>}
        {!loading && !realRooms.length && (
          <article className="account-surface">
            <h3>Todavía no hay salas abiertas</h3>
            <p className="wallet-help">
              Cuando el staff cree la primera sala aparecerá aquí en tiempo
              real.
            </p>
          </article>
        )}
        {realRooms.map((room) => (
          <RealRoomRow key={room.id} room={room} join={() => join(room.id)} />
        ))}
      </div>
      <RoomsChat session={session} notify={notify} />
      </div>
    </section>
  );
}

function RoomsChat({ session, notify }: { session: SessionData | null; notify: (message: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const load = async () => {
    const response = await fetch("/api/chat?channel=general", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { messages?: ChatMessage[] };
    setMessages(data.messages ?? []);
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, []);
  const send = async () => {
    if (!text.trim()) return;
    if (!session) return notify("Inicia sesión para escribir en el chat");
    setSending(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "general", message: text.trim() }),
    });
    setSending(false);
    if (!response.ok) return notify("No se pudo enviar el mensaje");
    setText("");
    await load();
  };
  return (
    <aside className="rooms-chat">
      <header><div><span className="live-pulse" /><strong>Chat general</strong></div><small>Comunidad TENE</small></header>
      <div className="rooms-chat-stream">
        {!messages.length && <p>Escribe el primer mensaje.</p>}
        {messages.slice(-30).map((message) => (
          <article key={message.id}>
            <span className="rooms-chat-avatar">{message.name.slice(0, 1).toUpperCase()}</span>
            <div><p><strong>{message.name}</strong><time>{new Date(message.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</time></p><span>{message.body}</span></div>
          </article>
        ))}
      </div>
      <div className="rooms-chat-compose">
        <input aria-label="Mensaje para el chat general" maxLength={240} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} placeholder={session ? "Escribe un mensaje…" : "Inicia sesión para escribir"} />
        <button aria-label="Enviar mensaje" disabled={sending || !text.trim()} onClick={() => void send()}>➤</button>
      </div>
    </aside>
  );
}

function RealRoomRow({ room, join }: { room: RoomData; join: () => void }) {
  const creatorName = room.creator?.nickname ?? "Staff TENE";
  return (
    <article className="room-row-rich">
      <div className="room-info">
        <div className="room-title-line">
          <span className="room-symbol">T</span>
          <div className="room-title-copy">
            <div className="room-heading">
              <strong>{room.name}</strong>
              <span>ENTRADA <b>S/ {(room.entryCents / 100).toFixed(0)}</b></span>
              <span>PREMIO <b>S/ {(room.prizePerWinnerCents / 100).toFixed(0)}</b></span>
            </div>
            <small>
              <i />{" "}
              {room.status === "open" ? "Esperando jugadores" : room.status}
            </small>
          </div>
        </div>
        <div className="room-created">
          Creada por <b>{creatorName}</b>
        </div>
      </div>
      <div className="room-people">
        <div className="room-capacity">
          <span>{room.players.length} / 10 jugadores</span>
          <div className="mini-progress">
            <i style={{ width: `${room.players.length * 10}%` }} />
          </div>
        </div>
        <div className="avatar-strip">
          {room.players.map((player) => (
            <ProfileAvatar
              key={player.userId}
              profile={{
                name: player.nickname,
                level: player.level,
                elo: player.elo,
                hours: player.hours,
                conduct: player.conduct,
                avatarUrl: player.avatarUrl,
                steamId64: player.steamId64,
              }}
            />
          ))}
          {Array.from(
            { length: Math.max(0, 10 - room.players.length) },
            (_, i) => (
              <span className="vacant-avatar" key={i} />
            ),
          )}
        </div>
      </div>
      <button
        className="room-enter"
        onClick={join}
        disabled={room.players.length >= 10}
      >
        Reservar S/ 6 <span>→</span>
      </button>
    </article>
  );
}
function BenefitsPanel({ notify }: { notify: (message: string) => void }) {
  const [data, setData] = useState<{ subscription: { status: string; endsAt: string } | null; passes: Array<{ id: string; source: string; status: string; expiresAt: string | null; createdAt: string }> } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { const response = await fetch("/api/benefits", { cache: "no-store" }); if (response.ok) setData(await response.json()); };
  useEffect(() => { void load(); }, []);
  const subscribed = data?.subscription?.status === "active" && new Date(data.subscription.endsAt) > new Date();
  const available = data?.passes.filter((pass) => pass.status === "available") ?? [];
  const daily = data?.passes.find((pass) => pass.source === "daily_sub" && pass.status === "available");
  const birthday = available.filter((pass) => pass.source === "birthday");
  const subscribe = async () => { setBusy(true); const response = await fetch("/api/benefits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "subscribe" }) }); setBusy(false); notify(response.ok ? "TENE Sub activado por 30 días" : response.status === 402 ? "Necesitas S/ 20 de saldo disponible" : "No se pudo activar la suscripción"); if (response.ok) await load(); };
  return (
    <section className="benefits-panel">
      <div className="benefits-hero">
        <div>
          <span className="sub-badge">TENE SUB</span>
          <h2>Más partidas. Más identidad.</h2>
          <p>
            Una membresía simple para jugadores frecuentes. No mejora tu nivel
            ni te da ventajas dentro de la partida.
          </p>
          <div className="sub-price">
            <strong>S/ 20</strong>
            <span>
              al mes
              <br />
              renovación manual
            </span>
          </div>
          <button
            className="primary-button"
            disabled={busy || subscribed}
            onClick={() => void subscribe()}
          >
            {subscribed ? `✓ Activa hasta ${new Date(data!.subscription!.endsAt).toLocaleDateString("es-PE")}` : "Activar por S/ 20"}
          </button>
        </div>
        <div className="sub-mark">
          SUB<small>MIEMBRO</small>
        </div>
      </div>
      <div className="benefit-grid">
        <article>
          <span>01</span>
          <h3>Una sala gratis diaria</h3>
          <p>Un pase de S/6 cada día. No se acumula y vence a medianoche.</p>
          <button
            disabled={!daily}
            onClick={() => notify(daily ? "El pase se aplicará automáticamente al entrar a una sala" : "No tienes pase disponible")}
          >
            {daily ? "Disponible para tu próxima sala" : subscribed ? "Usado hoy" : "Requiere Sub"}
          </button>
        </article>
        <article>
          <span>02</span>
          <h3>Prefijo exclusivo</h3>
          <p>Etiqueta SUB visible en tu perfil, las salas y el chat general.</p>
          <div className="prefix-preview">
            <b>SUB</b>
            <strong>Tom</strong>
            <small>LVL 5</small>
          </div>
        </article>
      </div>
      <div className="rewards-board">
        <div>
          <span>🎁</span>
          <div>
            <small>BENEFICIO ANUAL</small>
            <h3>Regalo de cumpleaños</h3>
            <p>
              Recibes dos salas gratuitas el día de tu cumpleaños. Válidas
              durante 7 días y una sola vez por año.
            </p>
          </div>
        </div>
        <div className="reward-counter">
          <span>
              <small>DISPONIBLES</small>{birthday.length}
          </span>
          <span>
              <small>VENCEN</small>{birthday[0]?.expiresAt ? new Date(birthday[0].expiresAt).toLocaleDateString("es-PE") : "—"}
          </span>
          <button
            onClick={() =>
              notify(birthday.length ? "El pase se aplicará automáticamente en tu próxima sala" : "No tienes pases de cumpleaños disponibles")
            }
          >
            Usar en próxima sala
          </button>
        </div>
      </div>
      <div className="benefit-history">
        <strong>Historial de beneficios</strong>
        {(data?.passes ?? []).map((pass) => (
          <div key={pass.id}>
            <span>{pass.source === "birthday" ? "Pase cumpleaños" : pass.source === "daily_sub" ? "Pase diario Sub" : "Pase promocional"}</span>
            <b>{pass.status === "available" ? "Disponible" : pass.status === "used" ? "Utilizado" : "Vencido"}</b>
            <small>{new Date(pass.createdAt).toLocaleDateString("es-PE")}</small>
          </div>
        ))}
        {data && !data.passes.length && <p className="wallet-help">Todavía no tienes beneficios emitidos.</p>}
      </div>
    </section>
  );
}

function ConductPanel({ notify }: { notify: (message: string) => void }) {
  const [appealing, setAppealing] = useState(false);
  const [sent, setSent] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [selectedSanction, setSelectedSanction] = useState("");
  const [conduct, setConduct] = useState<{ score: number; debtCents: number; activeSuspension: boolean; activeMutes: number; sanctions: Array<{ id: string; type: string; reason: string; penaltyCents: number; createdAt: string; revokedAt: string | null }> } | null>(null);
  useEffect(() => { void fetch("/api/conduct").then(async (response) => { if (response.ok) setConduct(await response.json()); }); }, []);
  const score = conduct?.score ?? 100;
  return (
    <section className="conduct-panel">
      <div className="conduct-hero">
        <div>
          <span className="verified-badge">CONDUCTA {score >= 80 ? "BUENA" : score >= 50 ? "EN OBSERVACIÓN" : "RESTRINGIDA"}</span>
          <h2>Tu reputación competitiva</h2>
          <p>
            La puntualidad, permanencia y comportamiento determinan si puedes
            participar en las salas.
          </p>
        </div>
        <div className="conduct-score">
          <strong>{score}</strong>
          <span>/ 100</span>
          <small>{conduct?.activeSuspension ? "Suspensión activa" : "Sin restricciones"}</small>
        </div>
      </div>
      <div className="conduct-rules">
        <article>
          <span className="rule-icon warning">½</span>
          <div>
            <h3>No conectarse a tiempo</h3>
            <p>Multa de la mitad del precio de entrada.</p>
          </div>
          <strong>S/ 3</strong>
        </article>
        <article>
          <span className="rule-icon danger">×2</span>
          <div>
            <h3>Abandonar la partida</h3>
            <p>Multa equivalente al doble de la entrada.</p>
          </div>
          <strong>S/ 12</strong>
        </article>
        <article>
          <span className="rule-icon ban">⊘</span>
          <div>
            <h3>Hack, mafia o manipulación</h3>
            <p>Cancelación, pérdida de entrada y suspensión o ban.</p>
          </div>
          <strong>Ban</strong>
        </article>
      </div>
      <div className="conduct-grid">
        <div className="sanction-history">
          <div className="panel-title">
            <strong>Historial disciplinario</strong>
            <span>Últimos 90 días</span>
          </div>
          {conduct?.sanctions.map((sanction) => <article key={sanction.id}><span className={`sanction-dot ${sanction.revokedAt ? "resolved" : "warning"}`} /><div><b>{sanction.type.replaceAll("_", " ")}</b><small>{new Date(sanction.createdAt).toLocaleDateString("es-PE")} · {sanction.reason}</small></div><strong>{sanction.penaltyCents ? `− S/ ${(sanction.penaltyCents / 100).toFixed(2)}` : "Aviso"}</strong><i>{sanction.revokedAt ? "Revocada" : "Activa"}</i><button onClick={() => { setSelectedSanction(sanction.id); setAppealing(true); }}>Apelar</button></article>)}
          {conduct && !conduct.sanctions.length && <article><span className="sanction-dot good" /><div><b>Sin incidentes registrados</b><small>Mantén una conducta responsable en cada sala.</small></div><strong>100 pts</strong><i>Activo</i></article>}
        </div>
        <aside className="conduct-status">
          <span className="card-label">ESTADO ACTUAL</span>
          <div>
            <small>Deuda disciplinaria</small>
            <strong>S/ {((conduct?.debtCents ?? 0) / 100).toFixed(2)}</strong>
          </div>
          <div>
            <small>Suspensión activa</small>
            <strong>{conduct?.activeSuspension ? "Sí" : "No"}</strong>
          </div>
          <div>
            <small>Mutes activos</small>
            <strong>{conduct?.activeMutes ?? 0}</strong>
          </div>
          <p>✓ Puedes entrar a salas y retirar saldo.</p>
        </aside>
      </div>
      {appealing && (
        <div className="modal-backdrop" onMouseDown={() => setAppealing(false)}>
          <section
            className="appeal-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setAppealing(false)}>
              ×
            </button>
            <span className="staff-role">APELACIÓN</span>
            <h2>Solicitar revisión de sanción</h2>
            <p>
              Explica por qué consideras que la sanción debe revisarse. La multa
              no se elimina mientras la apelación esté pendiente.
            </p>
            <label>
              Motivo
              <textarea value={appealReason} onChange={(event) => setAppealReason(event.target.value)} placeholder="Describe lo sucedido y cualquier evidencia…" />
            </label>
            <div className="evidence-box">Incluye enlaces a capturas, clips o demos dentro de la descripción.</div>
            <button
              className="primary-button w-full"
              disabled={sent || appealReason.trim().length < 10}
              onClick={async () => { const response = await fetch("/api/conduct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sanctionId: selectedSanction, reason: appealReason }) }); setSent(response.ok); notify(response.ok ? "Apelación enviada al staff" : "No se pudo enviar la apelación"); }}
            >
              {sent ? "✓ Apelación enviada" : "Enviar apelación"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

type ChatMessage = {
  id: string;
  name: string;
  role: string;
  body: string;
  createdAt: string;
  level: number;
  elo: number;
  hours: number;
  avatarUrl?: string | null;
};
function CommunityChat({
  notify,
  session,
}: {
  notify: (message: string) => void;
  session: SessionData | null;
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [community, setCommunity] = useState<{ activePlayers: number; rooms: Array<{ id: string; name: string; status: string }>; ranking: Array<{ userId: string; name: string; level: number }> } | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat?channel=general");
      const data = (await response.json()) as { ok: boolean; messages?: ChatMessage[] };
      if (response.ok && data.messages) setMessages(data.messages);
      else notify("No se pudo cargar este canal");
    } catch {
      notify("No se pudo conectar con el chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);
  useEffect(() => { void fetch("/api/public", { cache: "no-store" }).then(async (response) => { if (response.ok) setCommunity(await response.json()); }); }, []);

  const send = async () => {
    if (!text.trim()) return;
    if (!session) return notify("Inicia sesión para escribir en el chat");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "general",
          message: text.trim(),
        }),
      });
      if (!response.ok) throw new Error("send_failed");
      setText("");
      await loadMessages();
    } catch {
      notify("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="community-panel">
      <div className="chat-layout">
        <aside className="channel-list">
          <div>
            <span className="brand-mark">T</span>
            <strong>Comunidad TENE</strong>
          </div>
          <small>CHAT GLOBAL</small>
          <button className="active" onClick={() => void loadMessages()}>
            <span>#</span>
            General
          </button>
        </aside>
        <main className="chat-main">
          <header>
            <div>
              <strong># General</strong>
              <small>Conversación global de la comunidad TENE</small>
            </div>
            <span>{community?.activePlayers ?? 0} en salas activas</span>
          </header>
          <div className="message-stream">
            {loading && <p className="chat-empty">Cargando mensajes…</p>}
            {!loading && messages.length === 0 && (
              <p className="chat-empty">Todavía no hay mensajes en este canal.</p>
            )}
            {messages.map((message) => (
              <article key={message.id}>
                <ProfileAvatar
                  profile={{
                    name: message.name,
                    level: message.level,
                    elo: message.elo,
                    hours: message.hours,
                    conduct: "Buena",
                    avatarUrl: message.avatarUrl,
                  }}
                  compact
                />
                <div>
                  <div className="message-meta">
                    <b className={`role-prefix ${message.role.toLowerCase()}`}>
                      {message.role}
                    </b>
                    <strong>{message.name}</strong>
                    <small>
                      {new Date(message.createdAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                    <button
                      aria-label={`Reportar mensaje de ${message.name}`}
                      onClick={async () => {
                        const response = await fetch(`/api/chat/${message.id}/report`, { method: "POST" });
                        notify(response.ok ? `${message.name}: reporte enviado a moderación` : "No se pudo enviar el reporte");
                      }}
                    >
                      •••
                    </button>
                  </div>
                  <p>{message.body}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="chat-compose">
            <input
              value={text}
              maxLength={240}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void send()}
              placeholder="Enviar mensaje al chat general…"
            />
            <span>{text.length}/240</span>
            <button disabled={sending || !text.trim()} onClick={() => void send()}>
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </main>
        <aside className="online-list">
          <strong>JUGADORES DESTACADOS</strong>
          {(community?.ranking ?? []).slice(0, 6).map((player) => (
            <div key={player.userId}>
              <span className="online-avatar">{player.name[0]}</span>
              <span>
                <b>{player.name}</b>
                <small className="role-text player">RANKING</small>
              </span>
              <i>LVL {player.level}</i>
            </div>
          ))}
        </aside>
      </div>
      <div className="chat-safety">
        <span>
          Los moderadores pueden eliminar mensajes, mutear y banear. Todos los
          reportes quedan registrados.
        </span>
        <button
          onClick={() => notify("Reglas: respeto, sin spam, sin suplantación y cero coordinación para manipular partidas")}
        >
          Ver reglas del chat
        </button>
      </div>
    </section>
  );
}

function NotificationsPanel({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState("Todas");
  const [read, setRead] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({
    rooms: true,
    money: true,
    staff: true,
    community: false,
  });
  const [items, setItems] = useState<Array<{ id: string; type: string; icon: string; title: string; copy: string; time: string; action: string }>>([]);
  useEffect(() => { void fetch("/api/notifications").then(async (response) => { if (!response.ok) return; const data = await response.json() as { items: Array<{ id: string; type: string; title: string; body: string; createdAt: string; readAt: string | null }>; preferences: { matches: boolean; wallet: boolean; staff: boolean; community: boolean } }; setItems(data.items.map((item) => ({ id: item.id, type: ({ match: "Partida", wallet: "Dinero", staff: "Staff", community: "Comunidad", sanction: "Staff", birthday: "Comunidad", security: "Staff" } as Record<string,string>)[item.type] ?? "Comunidad", icon: item.type === "wallet" ? "S/" : item.type === "match" ? "▶" : item.type === "staff" ? "✓" : "#", title: item.title, copy: item.body, time: new Date(item.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }), action: "Abrir" }))); setRead(data.items.filter((item) => item.readAt).map((item) => item.id)); setPrefs({ rooms: data.preferences.matches, money: data.preferences.wallet, staff: data.preferences.staff, community: data.preferences.community }); }); }, []);
  const visible =
    filter === "Todas" ? items : items.filter((item) => item.type === filter);
  return (
    <section className="notifications-panel">
      <div className="notification-head">
        <div>
          <span className="verified-badge">CENTRO DE ALERTAS</span>
          <h2>No te pierdas tu partida</h2>
          <p>
            Los avisos críticos de conexión y sanciones siempre permanecen
            activos dentro de TENE.
          </p>
        </div>
        <button onClick={() => { setRead(items.map((item) => item.id)); void fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ readAll: true }) }); }}>
          Marcar todas como leídas
        </button>
      </div>
      <div className="notification-layout">
        <main>
          <div className="notification-filters">
            {["Todas", "Partida", "Dinero", "Staff", "Comunidad"].map(
              (item) => (
                <button
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                  key={item}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="notification-list">
            {visible.map((item) => (
              <article
                className={read.includes(item.id) ? "read" : ""}
                key={item.id}
                onClick={() => setRead([...new Set([...read, item.id])])}
              >
                <span
                  className={`notification-icon ${item.type.toLowerCase()}`}
                >
                  {item.icon}
                </span>
                <div>
                  <div>
                    <strong>{item.title}</strong>
                    {!read.includes(item.id) && <i />}
                  </div>
                  <p>{item.copy}</p>
                  <small>{item.time}</small>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setRead([...new Set([...read, item.id])]);
                    void fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ notificationId: item.id }) });
                    notify(item.title);
                  }}
                >
                  {item.action} →
                </button>
              </article>
            ))}
          </div>
        </main>
        <aside className="notification-prefs">
          <span className="card-label">PREFERENCIAS</span>
          <h3>Cómo avisarte</h3>
          <p>
            Las alertas en la web están activas. El correo será opcional para
            eventos importantes.
          </p>
          {[
            ["rooms", "Salas y partidas", "Ready, draft y servidor"],
            ["money", "Dinero", "Recargas, retiros y premios"],
            ["staff", "Staff y sanciones", "Verificación, reportes y mutes"],
            ["community", "Comunidad", "Chat y anuncios generales"],
          ].map(([key, title, copy]) => (
            <label key={key}>
              <span>
                <b>{title}</b>
                <small>{copy}</small>
              </span>
              <input
                type="checkbox"
                checked={prefs[key as keyof typeof prefs]}
                onChange={() => { const next = { ...prefs, [key]: !prefs[key as keyof typeof prefs] }; setPrefs(next); void fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ preferences: { matches: next.rooms, wallet: next.money, staff: next.staff, community: next.community } }) }); }}
              />
            </label>
          ))}
          <div className="critical-note">
            Las alertas de conexión, sanciones y seguridad no se pueden
            desactivar.
          </div>
        </aside>
      </div>
    </section>
  );
}

function WalletPanel({
  setBalance,
  action,
  session,
}: {
  setBalance: (value: number) => void;
  action: (value: "deposit" | "withdraw") => void;
  session: SessionData | null;
}) {
  const [liveWallet, setLiveWallet] = useState(
    session?.wallet ?? { availableCents: 0, lockedCents: 0, debtCents: 0 },
  );
  useEffect(() => {
    const refreshWallet = async () => {
      const response = await fetch("/api/wallet", { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as WalletData;
      if (body.wallet) {
        setLiveWallet(body.wallet);
        setBalance(body.wallet.availableCents / 100);
      }
    };
    void refreshWallet();
    window.addEventListener("focus", refreshWallet);
    return () => window.removeEventListener("focus", refreshWallet);
  }, [setBalance]);
  const liveBalance = liveWallet.availableCents / 100;
  return (
    <section className="section-panel">
      <div className="wallet-hero">
        <div>
          <span className="card-label">SALDO TOTAL</span>
          <strong>S/ {liveBalance.toFixed(2)}</strong>
          <p>Disponible para salas o retiro</p>
        </div>
        <div>
          <button className="primary-button" onClick={() => action("deposit")}>
            ＋ Recargar
          </button>
          <button
            className="secondary-button"
            onClick={() => action("withdraw")}
          >
            ↗ Retirar
          </button>
        </div>
      </div>
      <div className="wallet-rules">
        <article>
          <b>Saldo disponible</b>
          <strong>S/ {liveBalance.toFixed(2)}</strong>
          <p>Se puede usar o retirar.</p>
        </article>
        <article>
          <b>Saldo bloqueado</b>
          <strong>S/ {(liveWallet.lockedCents / 100).toFixed(2)}</strong>
          <p>Reservado en salas activas.</p>
        </article>
        <article>
          <b>Deuda disciplinaria</b>
          <strong>S/ {(liveWallet.debtCents / 100).toFixed(2)}</strong>
          <p>Sin sanciones pendientes.</p>
        </article>
      </div>
      <div className="ledger-card">
        <div className="panel-title">
          <strong>Libro de movimientos</strong>
          <span>Todos los importes están en PEN</span>
        </div>
        <WalletActivity />
      </div>
    </section>
  );
}

function WalletActivity({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<WalletData | null>(null);
  useEffect(() => {
    void fetch("/api/wallet").then(async (response) => {
      if (response.ok) setData(await response.json());
    });
  }, []);
  if (!data) return <p className="wallet-help">Cargando movimientos…</p>;
  const rows = [
    ...data.requests.map((request) => ({
      id: request.id,
      label: `${request.type === "deposit" ? "Recarga" : "Retiro"} ${request.method.toUpperCase()} · ${request.status}`,
      date: request.requestedAt,
      amountCents:
        request.type === "deposit" ? request.amountCents : -request.amountCents,
      pending: request.status === "pending",
    })),
    ...data.entries.map((entry) => ({
      id: entry.id,
      label: entry.description,
      date: entry.createdAt,
      amountCents: entry.amountCents,
      pending: false,
    })),
  ].slice(0, compact ? 4 : 12);
  if (!rows.length)
    return (
      <p className="wallet-help">Todavía no tienes movimientos registrados.</p>
    );
  return (
    <>
      {rows.map((row) => (
        <div className="activity-row" key={row.id}>
          <span
            className={row.amountCents > 0 ? "positive-dot" : "neutral-dot"}
          />
          <div>
            <strong>{row.label}</strong>
            <small>
              {row.pending ? "Pendiente de revisión · " : ""}
              {new Date(row.date).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </small>
          </div>
          <b className={row.amountCents > 0 ? "positive" : ""}>
            {row.amountCents > 0 ? "+" : "−"} S/{" "}
            {(Math.abs(row.amountCents) / 100).toFixed(2)}
          </b>
        </div>
      ))}
    </>
  );
}
function PublicProfilePanel({ session }: { session: SessionData | null }) {
  const [profileSection, setProfileSection] = useState<"general" | "matches">(
    "general",
  );
  const [competitive, setCompetitive] = useState<{ me: { name: string; elo: number; level: number; matches: number; wins: number; losses: number; position: number } | null; history: Array<{ id: string; roomName: string | null; delta: number; map: string | null; teamAScore: number | null; teamBScore: number | null }> } | null>(null);
  const [conductScore, setConductScore] = useState(100);
  useEffect(() => { void fetch("/api/competitive").then(async (response) => { if (response.ok) setCompetitive(await response.json() as NonNullable<typeof competitive>); }); void fetch("/api/conduct").then(async (response) => { if (response.ok) setConductScore(((await response.json()) as { score: number }).score); }); }, []);
  const me = competitive?.me;
  const matches = me?.matches ?? 0;
  const wins = me?.wins ?? 0;
  const historyRows = competitive?.history ?? [];
  const winStreak = historyRows.findIndex((match) => match.delta < 0) === -1 ? historyRows.filter((match) => match.delta > 0).length : historyRows.findIndex((match) => match.delta < 0);
  const mapStats = Object.entries(historyRows.reduce((acc, match) => { const map = match.map ?? "Sin mapa"; const current = acc[map] ?? { wins: 0, total: 0 }; current.total += 1; if (match.delta > 0) current.wins += 1; acc[map] = current; return acc; }, {} as Record<string, { wins: number; total: number }>)).map(([map, value]) => ({ map, rate: Math.round((value.wins / value.total) * 100) })).sort((a, b) => b.rate - a.rate).slice(0, 4);
  return (
    <section className="public-profile-panel">
      <article className="profile-cover">
        <div className="profile-identity">
          <img
            src={session?.user.steamAvatarUrl ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${session?.user.nickname ?? "TENE"}`}
            alt={`Avatar de ${session?.user.nickname ?? "jugador"}`}
          />
          <div>
            <span className="verified-badge">✓ STEAM VERIFICADO</span>
            <h2>{session?.user.nickname ?? me?.name ?? "Jugador"}</h2>
            <p>{Math.floor((session?.user.cs2Minutes ?? 0) / 60).toLocaleString()} horas de CS2 verificadas</p>
            <div className="profile-tags">
              <b>{session?.user.role ?? "Jugador"}</b>
              <b>CS2 competitivo</b>
            </div>
          </div>
        </div>
        <div className="profile-main-rating">
          <small>RATING COMPETITIVO</small>
          <strong>LVL {me?.level ?? session?.user.level ?? 1}</strong>
          <b>Nivel competitivo verificado</b>
          <span>#{me?.position ?? "—"} en el ranking</span>
        </div>
      </article>
      <nav className="profile-subnav">
        <button
          className={profileSection === "general" ? "active" : ""}
          onClick={() => setProfileSection("general")}
        >
          Resumen
        </button>
        <button
          className={profileSection === "matches" ? "active" : ""}
          onClick={() => setProfileSection("matches")}
        >
          Últimas partidas
        </button>
        <a href={session?.user.steamId64 ? `https://steamcommunity.com/profiles/${session.user.steamId64}` : "https://steamcommunity.com/"} target="_blank" rel="noreferrer">
          Ver Steam ↗
        </a>
      </nav>
      {profileSection === "general" ? (
        <div className="profile-dashboard">
          <div className="profile-left">
            <div className="profile-kpis">
              <article>
                <small>PARTIDAS</small>
                <strong>{matches}</strong>
                <span>{wins} ganadas · {me?.losses ?? 0} perdidas</span>
              </article>
              <article>
                <small>WIN RATE</small>
                <strong>{matches ? Math.round((wins / matches) * 100) : 0}%</strong>
                <span>Resultados confirmados</span>
              </article>
              <article>
                <small>HORAS CS2</small>
                <strong>{Math.floor((session?.user.cs2Minutes ?? 0) / 60).toLocaleString()}</strong>
                <span>Perfil público</span>
              </article>
              <article>
                <small>RACHA</small>
                <strong>{winStreak} W</strong>
                <span>Racha actual confirmada</span>
              </article>
            </div>
            <article className="map-performance">
              <header>
                <div>
                  <small>RENDIMIENTO POR MAPA</small>
                  <h3>Mapas destacados</h3>
                </div>
                <span>Últimas 20 partidas</span>
              </header>
              {mapStats.map(({ map, rate }) => (
                <div key={map}>
                  <strong>{map}</strong>
                  <span>
                    <i style={{ width: `${rate}%` }} />
                  </span>
                  <b>{rate}%</b>
                </div>
              ))}
              {!mapStats.length && <p className="wallet-help">Sin partidas suficientes para calcular rendimiento por mapa.</p>}
            </article>
          </div>
          <aside className="profile-reputation">
            <span>CONDUCTA</span>
            <div className="conduct-score">
              <strong>{conductScore}</strong>
              <small>/ 100</small>
            </div>
            <b>Excelente</b>
            <p>
              Sin abandonos ni sanciones activas. Tus compañeros pueden revisar
              esta información antes de entrar a una sala.
            </p>
            <div className="reputation-list">
              <span>
                <i>✓</i>18 partidas sin reportes
              </span>
              <span>
                <i>✓</i>100% ready a tiempo
              </span>
              <span>
                <i>✓</i>Steam y horas verificadas
              </span>
            </div>
            <div className="badge-shelf">
              <small>INSIGNIAS</small>
              <div>
                <b title="Cuenta fundadora">F</b>
                <b title="Conducta">{conductScore}</b>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="public-match-list">
          {(competitive?.history ?? []).map((match) => {
            const result = match.delta >= 0 ? "Victoria" : "Derrota";
            return <article key={match.id}>
              <span
                className={result === "Victoria" ? "result-win" : "result-loss"}
              >
                {result}
              </span>
              <strong>{match.roomName ?? "Sala competitiva"}</strong>
              <small>{match.map ?? "Sin mapa"}</small>
              <b>{match.teamAScore ?? 0} — {match.teamBScore ?? 0}</b>
              <em>{result}</em>
            </article>})}
          {competitive && !competitive.history.length && <p className="wallet-help">Aún no tienes partidas liquidadas.</p>}
        </div>
      )}
      <p className="profile-privacy">
        El correo, nombre completo, fecha de nacimiento, saldo y movimientos
        nunca aparecen en el perfil público.
      </p>
    </section>
  );
}

function HistoryPanel() {
  const [history, setHistory] = useState<Array<{ id: string; roomName: string | null; beforeElo: number; afterElo: number; delta: number; map: string | null; teamAScore: number | null; teamBScore: number | null; createdAt: string }>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => { void fetch("/api/competitive").then(async (response) => { if (response.ok) setHistory(((await response.json()) as { history: typeof history }).history); }); }, []);
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">{history.length} PARTIDAS REGISTRADAS</span>
          <h2>Historial competitivo</h2>
          <p>
            Resultados, mapas y evolución de nivel registrados por nuestros servidores.
          </p>
        </div>
      </div>
      <div className="match-history">
        {history.map((match) => {
          const result = match.delta >= 0 ? "Victoria" : "Derrota";
          return <article key={match.id} className={expandedId === match.id ? "expanded" : ""}>
            <span
              className={result === "Victoria" ? "result-win" : "result-loss"}
            >
              {result}
            </span>
            <strong>{match.roomName ?? "Sala competitiva"}</strong>
            <span>{match.map ?? "Mapa sin registrar"}</span>
            <b>{match.teamAScore ?? 0} — {match.teamBScore ?? 0}</b>
            <em>{result}</em>
            <button onClick={() => setExpandedId((current) => current === match.id ? null : match.id)}>{expandedId === match.id ? "Ocultar" : "Ver detalle"}</button>
            {expandedId === match.id && <div className="history-detail"><span><small>FECHA</small>{new Date(match.createdAt).toLocaleString("es-PE")}</span><span><small>MAPA</small>{match.map ?? "Sin registrar"}</span><span><small>PROGRESIÓN</small>Recalculada por el sistema</span><span><small>RESULTADO</small>{match.teamAScore ?? 0} — {match.teamBScore ?? 0}</span></div>}
          </article>;
        })}
        {!history.length && <p className="wallet-help">Todavía no tienes resultados competitivos confirmados.</p>}
      </div>
    </section>
  );
}
function RankingPanel() {
  const [liveRanking, setLiveRanking] = useState<Array<{ userId: string; name: string; elo: number; level: number; matches: number; wins: number; losses: number; position: number }>>([]);
  const [myRating, setMyRating] = useState<{ userId: string; name: string; elo: number; level: number; matches: number; wins: number; losses: number; position: number } | null>(null);
  useEffect(() => { void fetch("/api/competitive").then(async (response) => { if (!response.ok) return; const data = await response.json() as { ranking: typeof liveRanking; me: typeof myRating }; setLiveRanking(data.ranking); setMyRating(data.me); }); }, []);
  const [balanceMode, setBalanceMode] = useState<"suggested" | "alternate">(
    "suggested",
  );
  const buildBalance = (players: typeof liveRanking) => {
    const teams = { a: [] as typeof liveRanking, b: [] as typeof liveRanking };
    const totals = { a: 0, b: 0 };
    players.forEach((player) => {
      const side = teams.a.length >= 5 ? "b" : teams.b.length >= 5 ? "a" : totals.a <= totals.b ? "a" : "b";
      teams[side].push(player);
      totals[side] += player.elo;
    });
    return { ...teams, aElo: totals.a, bElo: totals.b, aLevel: teams.a.length ? (teams.a.reduce((sum, player) => sum + player.level, 0) / teams.a.length).toFixed(1) : "0", bLevel: teams.b.length ? (teams.b.reduce((sum, player) => sum + player.level, 0) / teams.b.length).toFixed(1) : "0" };
  };
  const rankingPool = liveRanking.slice(0, 10);
  const alternatePool = rankingPool.length > 1 ? [...rankingPool.slice(1), rankingPool[0]] : rankingPool;
  const balance = buildBalance(balanceMode === "suggested" ? rankingPool : alternatePool);
  const difference = Math.abs(Number(balance.aLevel) - Number(balance.bLevel));
  const eloProgress = myRating ? Math.max(0, Math.min(100, ((myRating.elo - 900) % 100 + 100) % 100)) : 0;
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">NIVELES 1–10</span>
          <h2>Ranking competitivo</h2>
          <p>
            El staff asigna el nivel inicial y, después, cada resultado
            confirmado actualiza tu nivel automáticamente.
          </p>
        </div>
      </div>
      <div className="competitive-grid">
        <div className="rating-column">
          <article className="my-rating-card">
            <div className="rating-level">
              <small>NIVEL ACTUAL</small>
              <strong>{myRating?.level ?? 1}</strong>
            </div>
            <div className="rating-progress">
              <span>{myRating?.name ?? "Jugador"} · NIVEL {myRating?.level ?? 1}</span>
              <div>
                <i style={{ width: `${eloProgress}%` }} />
              </div>
              <small>Posición #{myRating?.position ?? "—"} del ranking general</small>
            </div>
            <div className="season-record">
              <b>{myRating?.matches ?? 0}</b>
              <small>PARTIDAS</small>
              <b>{myRating?.wins ?? 0}–{myRating?.losses ?? 0}</b>
              <small>VICTORIAS</small>
            </div>
          </article>
          <div className="ranking-large">
            {liveRanking.map((player) => (
                <div
                  key={player.userId}
                  className={player.userId === myRating?.userId ? "is-me" : ""}
                >
                  <span>#{String(player.position).padStart(2, "0")}</span>
                  <strong>{player.name}</strong>
                  <i>LVL {player.level}</i>
                  <b>NIVEL {player.level}</b>
                </div>
              ))}
          </div>
        </div>
        <aside className="balance-lab">
          <div className="balance-heading">
            <div>
              <small>BALANCE AUTOMÁTICO</small>
              <h3>Equipos sugeridos</h3>
            </div>
            <span
              className={difference <= 25 ? "balance-good" : "balance-warning"}
            >
              {rankingPool.length === 10 ? `${difference.toFixed(1)} niveles de diferencia` : `${rankingPool.length}/10 jugadores con nivel`}
            </span>
          </div>
          <div className="balanced-teams">
            {(["a", "b"] as const).map((side) => (
              <div key={side}>
                <span>EQUIPO {side.toUpperCase()}</span>
                <strong>
                  Nivel promedio {side === "a" ? balance.aLevel : balance.bLevel}
                </strong>
                {(side === "a" ? balance.a : balance.b).map((player, index) => (
                  <p key={player.userId}>
                    <i>{index + 1}</i>
                    {player.name}
                    <small>LVL {player.level}</small>
                  </p>
                ))}
                {!(side === "a" ? balance.a : balance.b).length && <p>Sin jugadores disponibles</p>}
              </div>
            ))}
          </div>
          <button
            className="balance-button"
            disabled={rankingPool.length < 2}
            onClick={() =>
              setBalanceMode(
                balanceMode === "suggested" ? "alternate" : "suggested",
              )
            }
          >
            {balanceMode === "suggested"
              ? "Ver otra combinación"
              : "Usar balance recomendado"}
          </button>
          <p className="balance-note">
            El sistema minimiza la diferencia de niveles. Los dos jugadores
            con mayor nivel siguen siendo capitanes.
          </p>
        </aside>
      </div>
      <div className="level-ladder">
        <div>
          <small>CALIBRACIÓN</small>
          <strong>Staff revisa perfil, horas y experiencia</strong>
          <span>Asignación inicial LVL 1–10</span>
        </div>
        <div>
          <small>RESULTADO</small>
          <strong>Victoria o derrota confirmada</strong>
          <span>Ajuste según dificultad del rival</span>
        </div>
        <div>
          <small>PROGRESIÓN</small>
          <strong>Subes o bajas de nivel</strong>
          <span>Sin cambios manuales ocultos</span>
        </div>
      </div>
    </section>
  );
}
function Transactions({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Premio · Sala #176", "24 ago · 22:14", "+ S/ 10.00", "win"],
    ["Entrada · Sala #176", "24 ago · 21:32", "− S/ 6.00", ""],
    ["Recarga Yape", "24 ago · 20:10", "+ S/ 20.00", "win"],
    ["Entrada · Sala #169", "23 ago · 23:45", "− S/ 6.00", ""],
  ];
  return (
    <>
      {rows.slice(0, compact ? 3 : 4).map(([label, date, value, tone]) => (
        <div className="activity-row" key={`${label}-${date}`}>
          <span className={tone ? "positive-dot" : "neutral-dot"} />
          <div>
            <strong>{label}</strong>
            <small>{date}</small>
          </div>
          <b className={tone ? "positive" : ""}>{value}</b>
        </div>
      ))}
    </>
  );
}

type LiveRoomState = {
  room: { id: string; name: string; status: string };
  players: Array<{ userId: string; nickname: string; avatarUrl: string | null; level: number; elo: number; team: "pool" | "a" | "b"; isCaptain: boolean }>;
  viewer: { userId: string; team: "pool" | "a" | "b"; isCaptain: boolean } | null;
  server: { map: string | null; status: string; provider: string; region: string; addressEncrypted: string | null; passwordEncrypted: string | null; teamAScore: number; teamBScore: number } | null;
  disputes: Array<{ id: string; reporterId: string; accusedUserId: string | null; reason: string; description: string; status: string; resolution: string | null }>;
  events: Array<{ id: string; type: string; payload: Record<string, string | number> }>;
};

function LiveRoomFlow({ roomId, balance, goBack, notice, session }: { roomId: string; balance: number; goBack: () => void; notice: string; session: SessionData | null }) {
  const [data, setData] = useState<LiveRoomState | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { const response = await fetch(`/api/rooms/${roomId}/state`, { cache: "no-store" }); if (response.ok) setData(await response.json()); };
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [roomId]);
  const act = async (path: string, body: Record<string, string>) => { setBusy(true); const response = await fetch(`/api/rooms/${roomId}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); setBusy(false); await load(); return response.ok; };
  if (!data) return <main className="app-bg room-screen min-h-screen text-white"><div className="room-loading">Cargando sala…</div></main>;
  const picks = data.events.filter((event) => event.type === "draft_pick");
  const bans = data.events.filter((event) => event.type === "map_ban").map((event) => String(event.payload.map));
  const vetoStart = data.events.find((event) => event.type === "veto_start");
  const firstTeam = String(vetoStart?.payload.team ?? "a");
  const expectedDraftTeam = ["a", "b", "b", "a", "a", "b", "b", "a"][picks.length];
  const expectedVetoTeam = bans.length % 2 === 0 ? firstTeam : firstTeam === "a" ? "b" : "a";
  const remainingMaps = mapPool.filter((map) => !bans.includes(map));
  const lastBanTeam = String(data.events.filter((event) => event.type === "map_ban").at(-1)?.payload.team ?? "");
  const sideChooser = lastBanTeam === "a" ? "b" : "a";
  return <main className="app-bg room-screen min-h-screen text-white">
    <header className="room-header"><button onClick={goBack}>← Volver a salas</button><div><span className="status-pill"><i /> {data.room.status.toUpperCase()}</span><strong>{data.room.name}</strong></div><div className="room-balance"><small>SALDO</small>S/ {balance.toFixed(2)}</div></header>
    <section className="room-layout"><div className="room-main"><div className="room-stage"><div><p className="eyebrow"><span /> FLUJO COMPETITIVO</p><h1>{data.room.status === "open" ? "Esperando jugadores" : data.room.status === "draft" ? "Draft de equipos" : data.room.status === "veto" ? "Veto de mapas" : "Partida preparada"}</h1><p>Los cambios quedan guardados y solo el capitán del turno puede actuar.</p></div><div className="room-count"><strong>{data.players.length}/10</strong><span>jugadores</span></div></div>
      {data.room.status === "open" && <article className="reserve-card"><h3>Tu puesto está reservado</h3><p>El draft comienza automáticamente cuando se completa la sala.</p></article>}
      {data.room.status === "draft" && <article className="draft-board"><div className="veto-head"><div><small>TURNO ACTUAL</small><strong>{expectedDraftTeam ? `Capitán ${expectedDraftTeam.toUpperCase()} elige` : "Equipos completos"}</strong></div><span>{picks.length}/8 elecciones</span></div><div className="draft-columns"><div><span className="team-label a">EQUIPO A</span>{data.players.filter((p) => p.team === "a").map((p) => <b key={p.userId}>{p.nickname}{p.isCaptain ? " · CAP" : ""}</b>)}</div><div className="draft-pool"><small>JUGADORES DISPONIBLES</small>{data.players.filter((p) => p.team === "pool").map((p) => <button disabled={busy || !data.viewer?.isCaptain || data.viewer.team !== expectedDraftTeam} key={p.userId} onClick={() => void act("draft", { playerId: p.userId })}><span>{p.nickname[0]}</span><b>{p.nickname}</b><i>LVL {p.level}</i></button>)}</div><div><span className="team-label b">EQUIPO B</span>{data.players.filter((p) => p.team === "b").map((p) => <b key={p.userId}>{p.nickname}{p.isCaptain ? " · CAP" : ""}</b>)}</div></div></article>}
      {data.room.status === "veto" && <article className="veto-card"><div className="veto-head"><div><small>TURNO ACTUAL</small><strong>{bans.length < 6 ? `Capitán ${expectedVetoTeam.toUpperCase()} banea` : `Capitán ${sideChooser.toUpperCase()} elige lado`}</strong></div><span>{bans.length}/6 baneos</span></div>{bans.length < 6 ? <div className="maps-grid">{mapPool.map((map) => <button key={map} className={bans.includes(map) ? "banned" : ""} disabled={busy || bans.includes(map) || !data.viewer?.isCaptain || data.viewer.team !== expectedVetoTeam} onClick={() => void act("veto", { map })}><span>{map.slice(0,2).toUpperCase()}</span><strong>{map}</strong><small>{bans.includes(map) ? "BANEADO" : "BANEAR"}</small></button>)}</div> : <div className="veto-next"><strong>{remainingMaps[0]} será el mapa</strong><button disabled={busy || !data.viewer?.isCaptain || data.viewer.team !== sideChooser} className="primary-button" onClick={() => void act("veto", { side: "ct" })}>Elegir CT</button><button disabled={busy || !data.viewer?.isCaptain || data.viewer.team !== sideChooser} className="secondary-button" onClick={() => void act("veto", { side: "t" })}>Elegir T</button></div>}</article>}
      {["live", "review", "settled", "cancelled"].includes(data.room.status) && <LiveMatchOperations roomId={roomId} data={data} session={session} reload={load} />}
    </div><aside className="room-side"><div className="side-title"><strong>Jugadores</strong><span>{data.players.length}/10</span></div>{data.players.map((player) => <div className="side-player" key={player.userId}>{player.avatarUrl ? <img className="avatar small" src={player.avatarUrl} alt="" /> : <span className="avatar small">{player.nickname[0]}</span>}<div><strong>{player.nickname}</strong><small>{player.isCaptain ? `Capitán ${player.team.toUpperCase()}` : player.team === "pool" ? "Disponible" : `Equipo ${player.team.toUpperCase()}`}</small></div><span className="level">LVL {player.level}</span></div>)}</aside></section>{notice && <div className="toast"><span className="live-pulse" />{notice}</div>}
  </main>;
}

function EnhancedRoomFlow({
  roomId,
  session,
  balance,
  bannedMaps,
  setBannedMaps,
  onReserve,
  joined,
  goBack,
  notice,
}: {
  roomId: string | null;
  session: SessionData | null;
  balance: number;
  bannedMaps: string[];
  setBannedMaps: (maps: string[]) => void;
  onReserve: () => void;
  joined: boolean;
  goBack: () => void;
  notice: string;
}) {
  const [draftPicks, setDraftPicks] = useState<string[]>([]);
  const [phase, setPhase] = useState<"draft" | "veto" | "match">("draft");
  if (roomId) return <LiveRoomFlow roomId={roomId} balance={balance} goBack={goBack} notice={notice} session={session} />;
  const sequence = ["A", "B", "B", "A", "A", "B", "B", "A"];
  const remainingMaps = mapPool.filter((map) => !bannedMaps.includes(map));
  const currentCaptain =
    bannedMaps.length % 2 === 0 ? "Capitán A" : "Capitán B";
  const teamA = [
    "hoxhi",
    ...draftPicks.filter((_, index) => sequence[index] === "A"),
  ];
  const teamB = [
    "melo",
    ...draftPicks.filter((_, index) => sequence[index] === "B"),
  ];
  const title = !joined
    ? "Reserva tu puesto"
    : phase === "draft"
      ? "Draft de equipos"
      : phase === "veto"
        ? "Veto de mapas"
        : "Partida en servidor";
  return (
    <main className="app-bg room-screen min-h-screen text-white">
      <header className="room-header">
        <button onClick={goBack}>← Volver a salas</button>
        <div>
          <span className="status-pill">
            <i /> {phase === "match" ? "SERVIDOR ACTIVO" : "SALA ABIERTA"}
          </span>
          <strong>Sala Violeta #184</strong>
        </div>
        <div className="room-balance">
          <small>SALDO</small>S/ {balance.toFixed(2)}
        </div>
      </header>
      <section className="room-layout">
        <div className="room-main">
          <div className="room-stage">
            <div>
              <p className="eyebrow">
                <span />{" "}
                {joined
                  ? `ETAPA ${phase === "draft" ? 2 : phase === "veto" ? 3 : 4} DE 4`
                  : "ETAPA 1 DE 4"}
              </p>
              <h1>{title}</h1>
              <p>
                {!joined
                  ? "El importe queda bloqueado al entrar y solo se liquida cuando termina la partida."
                  : phase === "draft"
                    ? "Los dos jugadores de mayor nivel son capitanes. La secuencia es A–B–B–A–A–B–B–A."
                    : phase === "veto"
                      ? "Los capitanes banean alternadamente hasta dejar un mapa."
                      : "MatchZy controla ready, inicio, marcador y resultado del servidor."}
              </p>
            </div>
            <div className="room-count">
              <strong>{joined ? "10" : "4"}/10</strong>
              <span>jugadores</span>
            </div>
          </div>
          {!joined ? (
            <article className="reserve-card">
              <div className="price-breakdown">
                <span>
                  <small>Entrada total</small>
                  <strong>S/ 6.00</strong>
                </span>
                <span>
                  <small>Fondo de premio</small>
                  <strong>S/ 5.00</strong>
                </span>
                <span>
                  <small>Servicio</small>
                  <strong>S/ 1.00</strong>
                </span>
              </div>
              <button className="primary-button" onClick={onReserve}>
                Confirmar y entrar por S/ 6
              </button>
              <p>
                Cuenta verificada · Saldo suficiente · Sin sanciones activas
              </p>
            </article>
          ) : phase === "draft" ? (
            <DraftBoard
              picks={draftPicks}
              teamA={teamA}
              teamB={teamB}
              pick={(name) => setDraftPicks([...draftPicks, name])}
              current={sequence[draftPicks.length]}
              next={() => setPhase("veto")}
              reset={() => setDraftPicks([])}
            />
          ) : phase === "veto" ? (
            <VetoBoard
              bannedMaps={bannedMaps}
              remaining={remainingMaps}
              currentCaptain={currentCaptain}
              ban={(map) =>
                remainingMaps.length > 1 && setBannedMaps([...bannedMaps, map])
              }
              reset={() => setBannedMaps([])}
              next={() => setPhase("match")}
            />
          ) : (
            <MatchOperations map={remainingMaps[0] || "Mirage"} />
          )}
        </div>
        <aside className="room-side">
          <div className="side-title">
            <strong>{joined ? "Equipos" : "Jugadores"}</strong>
            <span>{joined ? "5v5" : "4/10"}</span>
          </div>
          {joined ? (
            <>
              <TeamList title="EQUIPO A" names={teamA} />
              <TeamList title="EQUIPO B" names={teamB} />
            </>
          ) : (
            players.map((p, i) => (
              <div className="side-player" key={`${p.name}-${i}`}>
                <span className={`avatar small bg-gradient-to-br ${p.tone}`}>
                  {p.name[0]}
                </span>
                <div>
                  <strong>{p.name}</strong>
                  <small>{i < 2 ? "Capitán provisional" : "Verificado"}</small>
                </div>
                <span className="level">LVL {p.level}</span>
              </div>
            ))
          )}
        </aside>
      </section>
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function LiveMatchOperations({ roomId, data, session, reload }: { roomId: string; data: LiveRoomState; session: SessionData | null; reload: () => Promise<void> }) {
  const [scoreA, setScoreA] = useState(() => data.server?.teamAScore ?? 13);
  const [scoreB, setScoreB] = useState(() => data.server?.teamBScore ?? 9);
  const [reason, setReason] = useState("hacking");
  const [description, setDescription] = useState("");
  const [accusedUserId, setAccusedUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const isFinanceStaff = ["owner", "admin"].includes(session?.user.role ?? "");
  const pending = data.disputes.find((item) => item.status === "pending");
  useEffect(() => {
    if (data.room.status === "review" && data.server) {
      setScoreA(data.server.teamAScore);
      setScoreB(data.server.teamBScore);
    }
  }, [data.room.status, data.server?.teamAScore, data.server?.teamBScore]);
  const send = async (url: string, body: Record<string, unknown>) => {
    setBusy(true); setMessage("");
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    setMessage(response.ok ? "Operación guardada correctamente." : `No se pudo completar: ${result.error ?? "error"}`);
    await reload();
  };
  const submitDispute = async () => {
    setBusy(true); setMessage("");
    const form = new FormData();
    form.set("reason", reason); form.set("description", description);
    if (accusedUserId) form.set("accusedUserId", accusedUserId);
    if (evidenceFile) form.set("evidence", evidenceFile);
    const response = await fetch(`/api/rooms/${roomId}/disputes`, { method: "POST", body: form });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    setMessage(response.ok ? "Impugnación registrada y liquidación congelada." : result.error === "invalid_evidence" ? "La evidencia no cumple el formato o tamaño permitido." : `No se pudo completar: ${result.error ?? "error"}`);
    if (response.ok) { setDescription(""); setEvidenceFile(null); }
    await reload();
  };
  const statusLabel = data.room.status === "settled" ? "Resultado liquidado" : data.room.status === "review" ? "Liquidación congelada" : data.room.status === "cancelled" ? "Sala cancelada" : "Partida en vivo";
  return <article className="match-ops">
    <div className="server-head"><div><span className={`server-light ${data.server?.status ?? data.room.status}`} /><div><small>{data.server?.provider === "dathost" ? "DATHOST · SANTIAGO" : "SERVIDOR TENE"}</small><strong>{statusLabel}</strong></div></div><span>{data.server?.map ?? "Por definir"} · MR12</span></div>
    {data.viewer && data.server?.addressEncrypted && ["live", "review"].includes(data.room.status) && <div className="connect-box"><small>DIRECCIÓN DEL SERVIDOR</small><code>connect {data.server.addressEncrypted}{data.server.passwordEncrypted ? `; password ${data.server.passwordEncrypted}` : ""}</code><button onClick={() => void navigator.clipboard?.writeText(`connect ${data.server!.addressEncrypted}${data.server!.passwordEncrypted ? `; password ${data.server!.passwordEncrypted}` : ""}`)}>Copiar</button></div>}
    {data.room.status === "settled" && <div className="result-confirm"><span>✓</span><h3>Equipo {data.server!.teamAScore > data.server!.teamBScore ? "A" : "B"} ganó {data.server!.teamAScore} — {data.server!.teamBScore}</h3><p>La entrada bloqueada fue liquidada, cada ganador recibió S/ 10 y el ranking fue actualizado.</p><div className="settlement-status"><small>LIQUIDACIÓN COMPLETA</small><b>S/ 50 en premios · S/ 10 de servicio</b></div></div>}
    {data.room.status === "cancelled" && <div className="result-confirm"><span>×</span><h3>Partida cancelada</h3><p>Las entradas de jugadores no sancionados fueron devueltas automáticamente.</p></div>}
    {data.room.status === "review" && <div className="result-confirm"><span>⌛</span><h3>{pending ? "Resultado congelado por revisión" : "Resultado recibido · pendiente de confirmación"}</h3><p>{pending ? "Ningún premio ni entrada se liquidará mientras exista una impugnación pendiente." : "El servidor envió el marcador. Un administrador debe confirmarlo antes de liquidar los premios."}</p>{pending && <div className="settlement-status"><small>CASO {pending.id.slice(-8).toUpperCase()}</small><b>{pending.description}</b></div>}</div>}
    {data.room.status === "review" && pending && isFinanceStaff && <div className="admin-result-controls"><h3>Resolver impugnación</h3><p>Descartar devuelve la partida a estado en vivo. Confirmar mantiene el dinero congelado para cancelar y sancionar.</p><button disabled={busy} className="secondary-button" onClick={() => void send(`/api/staff/disputes/${pending.id}/review`, { decision: "dismissed", resolution: "Reporte revisado por staff; no se encontró una infracción suficiente." })}>Descartar y reanudar</button><button disabled={busy} className="primary-button" onClick={() => void send(`/api/staff/disputes/${pending.id}/review`, { decision: "upheld", resolution: "Infracción confirmada por el staff. La sala debe cancelarse y aplicar la retención correspondiente." })}>Confirmar infracción</button></div>}
    {data.room.status === "live" && <div className="live-score"><div><small>EQUIPO A</small><strong>{scoreA}</strong></div><span><b>MARCADOR</b><i>STAFF</i><em>EN VIVO</em></span><div><small>EQUIPO B</small><strong>{scoreB}</strong></div></div>}
    {["live", "review"].includes(data.room.status) && !pending && isFinanceStaff && <div className="admin-result-controls"><h3>Confirmar resultado y liquidar</h3><p>Esta acción libera los S/ 6 bloqueados, acredita S/ 10 a cada ganador y actualiza los niveles.</p><div className="score-inputs"><label>Equipo A<input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} /></label><label>Equipo B<input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} /></label></div><button disabled={busy} className="primary-button" onClick={() => void send(`/api/staff/rooms/${roomId}/result`, { teamAScore: scoreA, teamBScore: scoreB })}>Confirmar y liquidar</button></div>}
    {data.room.status === "live" && data.viewer && <div className="dispute-form"><h3>Impugnar partida</h3><p>Úsalo únicamente para hacks, coordinación ilegal, suplantación o marcador incorrecto.</p><label>Motivo<select value={reason} onChange={(e) => setReason(e.target.value)}><option value="hacking">Sospecha de hacks</option><option value="collusion">Coordinación o mafia</option><option value="wrong_result">Resultado incorrecto</option><option value="impersonation">Suplantación</option><option value="other">Otro</option></select></label><label>Jugador implicado (opcional)<select value={accusedUserId} onChange={(e) => setAccusedUserId(e.target.value)}><option value="">Sin seleccionar</option>{data.players.filter((p) => p.userId !== data.viewer?.userId).map((p) => <option key={p.userId} value={p.userId}>{p.nickname}</option>)}</select></label><label>Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Indica jugador, ronda y lo ocurrido…" /></label><label className="evidence-upload"><span>{evidenceFile ? evidenceFile.name : "Adjuntar captura, clip o demo (opcional)"}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.zip,.bz2,.dem" onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)} /></label><button disabled={busy || description.trim().length < 10} className="dispute-button" onClick={() => void submitDispute()}>⚑ Enviar y congelar liquidación</button></div>}
    {["live", "review"].includes(data.room.status) && isFinanceStaff && <div className="cancel-match"><button disabled={busy} className="secondary-button" onClick={() => { const why = window.prompt("Motivo de cancelación (las entradas serán devueltas):"); if (why) void send(`/api/staff/rooms/${roomId}/cancel`, { reason: why, sanctionedUserId: pending?.accusedUserId || undefined }); }}>Cancelar sala {pending?.accusedUserId ? "y retener entrada del infractor" : "y devolver entradas"}</button></div>}
    {message && <p className="form-message">{message}</p>}
  </article>;
}

function MatchOperations({ map }: { map: string }) {
  const [state, setState] = useState<"ready" | "live" | "finished">("ready");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState("Sospecha de uso de hacks");
  const ready = state === "ready" ? 8 : 10;
  return (
    <article className="match-ops">
      <div className="server-head">
        <div>
          <span className={`server-light ${state}`} />
          <div>
            <small>SERVIDOR PERÚ · MATCHZY</small>
            <strong>
              {state === "ready"
                ? "Esperando jugadores"
                : state === "live"
                  ? "Partida en vivo"
                  : "Resultado recibido"}
            </strong>
          </div>
        </div>
        <span>{map} · MR12</span>
      </div>
      {state === "ready" && (
        <>
          <div className="ready-grid">
            {[
              "hoxhi",
              "Tom",
              "Jericho",
              "k1ng",
              "navi",
              "melo",
              "shiro",
              "loko",
              "neo",
              "ace",
            ].map((name, index) => (
              <span key={name} className={index < 8 ? "ok" : ""}>
                <i>{index < 8 ? "✓" : "…"}</i>
                {name}
                <small>{index < 8 ? "READY" : "Conectando"}</small>
              </span>
            ))}
          </div>
          <div className="connect-box">
            <small>DIRECCIÓN DEL SERVIDOR</small>
            <code>connect lima-01.tene.gg:27015</code>
            <button
              onClick={() =>
                navigator.clipboard?.writeText("connect lima-01.tene.gg:27015")
              }
            >
              Copiar
            </button>
          </div>
          <div className="ready-footer">
            <span>{ready}/10 confirmados · límite 5:00 min</span>
            <button className="primary-button" onClick={() => setState("live")}>
              Simular todos ready
            </button>
          </div>
        </>
      )}
      {state === "live" && (
        <>
          <div className="live-score">
            <div>
              <small>EQUIPO A · CT</small>
              <strong>7</strong>
            </div>
            <span>
              <b>RONDA 13</b>
              <i>01:18</i>
              <em>EN VIVO</em>
            </span>
            <div>
              <small>EQUIPO B · T</small>
              <strong>5</strong>
            </div>
          </div>
          <div className="match-events">
            <span>
              <i>13</i> hoxhi eliminó a melo
            </span>
            <span>
              <i>12</i> Equipo A ganó por desactivación
            </span>
            <span>
              <i>11</i> Tom consiguió una baja doble
            </span>
          </div>
          <button
            className="primary-button match-finish"
            onClick={() => setState("finished")}
          >
            Simular resultado final
          </button>
        </>
      )}
      {state === "finished" && (
        <div className="result-confirm">
          <span>{reported ? "⌛" : "✓"}</span>
          <h3>
            {reported
              ? "Resultado congelado por revisión"
              : "Equipo A ganó 13 — 9"}
          </h3>
          <p>
            {reported
              ? "El dinero permanece bloqueado hasta que el staff resuelva la impugnación. Nadie recibe premio mientras el caso esté abierto."
              : "Resultado recibido desde MatchZy. Se liquidará automáticamente al terminar la ventana de impugnación."}
          </p>
          <div className="settlement-status">
            <small>{reported ? "CASO DSP-031" : "LIQUIDACIÓN EN 14:32"}</small>
            <b>{reported ? reason : "S/ 50 en premios · S/ 10 de servicio"}</b>
          </div>
          {!reported && (
            <button
              className="dispute-button"
              onClick={() => setReporting(true)}
            >
              ⚑ Impugnar resultado
            </button>
          )}
        </div>
      )}
      {reporting && (
        <div className="dispute-overlay">
          <div>
            <button onClick={() => setReporting(false)}>×</button>
            <span className="staff-role">REPORTE DE PARTIDA</span>
            <h3>Impugnar resultado</h3>
            <p>
              Solo úsalo para hackers, acuerdos entre jugadores o manipulación
              del resultado.
            </p>
            <label>
              Motivo
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                <option>Sospecha de uso de hacks</option>
                <option>Coordinación o “mafia”</option>
                <option>Resultado incorrecto</option>
                <option>Suplantación de jugador</option>
              </select>
            </label>
            <label>
              Descripción
              <textarea placeholder="Ronda, jugador y detalle de lo ocurrido…" />
            </label>
            <div className="evidence-box">
              ＋ Adjuntar evidencia demo, clip o captura
            </div>
            <button
              className="primary-button w-full"
              onClick={() => {
                setReported(true);
                setReporting(false);
              }}
            >
              Enviar y congelar liquidación
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
function DraftBoard({
  picks,
  teamA,
  teamB,
  pick,
  current,
  next,
  reset,
}: {
  picks: string[];
  teamA: string[];
  teamB: string[];
  pick: (name: string) => void;
  current: string;
  next: () => void;
  reset: () => void;
}) {
  return (
    <article className="draft-board">
      <div className="veto-head">
        <div>
          <small>TURNO ACTUAL</small>
          <strong>
            {picks.length === 8
              ? "Equipos completos"
              : `Capitán ${current} elige`}
          </strong>
        </div>
        <button onClick={reset}>Reiniciar draft</button>
      </div>
      <div className="draft-columns">
        <div>
          <span className="team-label a">
            EQUIPO A ·{" "}
            {teamA.reduce(
              (sum, name) =>
                sum +
                (name === "hoxhi"
                  ? 10
                  : draftPool.find((p) => p.name === name)?.level || 0),
              0,
            )}{" "}
            PTS
          </span>
          {teamA.map((name) => (
            <b key={name}>{name}</b>
          ))}
        </div>
        <div className="draft-pool">
          <small>JUGADORES DISPONIBLES</small>
          {draftPool
            .filter(
              (player) =>
                !picks.includes(player.name) && player.name !== "melo",
            )
            .map((player) => (
              <button key={player.name} onClick={() => pick(player.name)}>
                <span>{player.name[0]}</span>
                <b>{player.name}</b>
                <i>LVL {player.level}</i>
              </button>
            ))}
          {picks.length === 8 && (
            <button className="primary-button draft-next" onClick={next}>
              Continuar al veto →
            </button>
          )}
        </div>
        <div>
          <span className="team-label b">
            EQUIPO B ·{" "}
            {teamB.reduce(
              (sum, name) =>
                sum +
                (name === "melo"
                  ? 9
                  : draftPool.find((p) => p.name === name)?.level || 0),
              0,
            )}{" "}
            PTS
          </span>
          {teamB.map((name) => (
            <b key={name}>{name}</b>
          ))}
        </div>
      </div>
    </article>
  );
}
function TeamList({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="team-list">
      <span>{title}</span>
      {names.map((name) => (
        <div key={name}>
          <b>{name}</b>
          <small>{name === names[0] ? "CAPITÁN" : "JUGADOR"}</small>
        </div>
      ))}
    </div>
  );
}

type Candidate = {
  id: string;
  name: string;
  steamId: string;
  hours: number;
  accountYears: number;
  status: "Pendiente" | "Verificado" | "Rechazado";
  level: number;
};
const initialCandidates: Candidate[] = [
  {
    id: "u1",
    name: "Rayo",
    steamId: "76561199128403124",
    hours: 842,
    accountYears: 6,
    status: "Pendiente",
    level: 4,
  },
  {
    id: "u2",
    name: "Maddison",
    steamId: "76561198442891307",
    hours: 2341,
    accountYears: 11,
    status: "Pendiente",
    level: 8,
  },
  {
    id: "u3",
    name: "Akira",
    steamId: "76561199570188216",
    hours: 317,
    accountYears: 2,
    status: "Pendiente",
    level: 2,
  },
];
function StaffPanel({ notify }: { notify: (message: string) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [staffTab, setStaffTab] = useState("Solicitudes");
  const [notes, setNotes] = useState("");
  const [staffCounts, setStaffCounts] = useState({ sanctions: 0, withdrawals: 0 });
  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ||
    candidates[0] ||
    null;
  const loadCandidates = async () => {
    const response = await fetch("/api/staff/verifications");
    if (!response.ok) return;
    const body = (await response.json()) as {
      candidates: Array<{
        user: {
          id: string;
          nickname: string;
          steamId64: string | null;
          cs2Minutes: number;
          level: number;
          status: string;
        };
        check: { eligible: boolean } | null;
      }>;
    };
    const mapped: Candidate[] = body.candidates.map(({ user }) => ({
      id: user.id,
      name: user.nickname,
      steamId: user.steamId64 ?? "Sin Steam",
      hours: Math.floor(user.cs2Minutes / 60),
      accountYears: 0,
      status: user.status === "rejected" ? "Rechazado" : "Pendiente",
      level: user.level,
    }));
    setCandidates(mapped);
    setSelectedId((current) => current || mapped[0]?.id || "");
  };
  useEffect(() => {
    void loadCandidates();
    void Promise.all([
      fetch("/api/staff/operations", { cache: "no-store" }),
      fetch("/api/staff/payments", { cache: "no-store" }),
    ]).then(async ([operationsResponse, paymentsResponse]) => {
      const operations = operationsResponse.ok ? await operationsResponse.json() as OperationsData : null;
      const payments = paymentsResponse.ok ? await paymentsResponse.json() as { requests: Array<{ type: string; status: string }> } : null;
      const now = Date.now();
      setStaffCounts({
        sanctions: operations?.sanctions.filter((item) => !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt).getTime() > now)).length ?? 0,
        withdrawals: payments?.requests.filter((item) => item.type === "withdrawal" && item.status === "pending").length ?? 0,
      });
    });
  }, []);
  const update = (values: Partial<Candidate>) =>
    setCandidates((items) =>
      items.map((item) =>
        item.id === selected?.id ? { ...item, ...values } : item,
      ),
    );
  const resolve = async (status: "Verificado" | "Rechazado") => {
    if (!selected) return;
    const response = await fetch(
      `/api/staff/verifications/${selected.id}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: status === "Verificado" ? "approve" : "reject",
          level: selected.level,
          notes,
        }),
      },
    );
    notify(
      response.ok
        ? `${selected.name}: solicitud ${status === "Verificado" ? "aprobada" : "rechazada"}`
        : "No se pudo registrar la revisión",
    );
    if (response.ok) await loadCandidates();
  };
  return (
    <section className="staff-panel">
      <div className="staff-top">
        <div>
          <span className="staff-role">PANEL DE STAFF · DUEÑO</span>
          <h2>Control operativo</h2>
          <p>
            Las acciones sensibles quedan registradas y nunca modifican saldo
            sin un movimiento contable.
          </p>
        </div>
        <div className="staff-kpis">
          <span>
            <small>PENDIENTES</small>
            {candidates.filter((item) => item.status === "Pendiente").length}
          </span>
          <span>
            <small>SANCIONES ACTIVAS</small>{staffCounts.sanctions}
          </span>
          <span>
            <small>RETIROS EN REVISIÓN</small>{staffCounts.withdrawals}
          </span>
        </div>
      </div>
      <div className="staff-tabs">
        {[
          "Solicitudes",
          "Disputas",
          "Reportes chat",
          "Usuarios",
          "Roles",
          "Sanciones",
          "Auditoría",
        ].map((tab) => (
          <button
            className={staffTab === tab ? "active" : ""}
            onClick={() => setStaffTab(tab)}
            key={tab}
          >
            {tab}
          </button>
        ))}
      </div>
      {staffTab === "Solicitudes" && (
        <div className="staff-workspace">
          <aside className="candidate-list">
            <div className="candidate-filter">
              <strong>Verificaciones</strong>
              <span>{candidates.length} cuentas</span>
            </div>
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                className={selected.id === candidate.id ? "active" : ""}
                onClick={() => setSelectedId(candidate.id)}
              >
                <img
                  src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${candidate.name}&backgroundColor=2e1065,312e81`}
                  alt=""
                />
                <span>
                  <strong>{candidate.name}</strong>
                  <small>
                    {candidate.hours.toLocaleString()} h · Cuenta{" "}
                    {candidate.accountYears} años
                  </small>
                </span>
                <i
                  className={`request-status ${candidate.status.toLowerCase()}`}
                >
                  {candidate.status}
                </i>
              </button>
            ))}
          </aside>
          {selected ? (
            <article className="review-card">
              <div className="review-head">
                <img
                  src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${selected.name}&backgroundColor=2e1065,312e81`}
                  alt={`Avatar de ${selected.name}`}
                />
                <div>
                  <span className="verified-badge">STEAM CONECTADO</span>
                  <h3>{selected.name}</h3>
                  <p>{selected.steamId}</p>
                </div>
                <i
                  className={`request-status ${selected.status.toLowerCase()}`}
                >
                  {selected.status}
                </i>
              </div>
              <div className="verification-checks">
                <div>
                  <span>✓</span>
                  <b>Perfil público</b>
                  <small>La información es visible.</small>
                </div>
                <div>
                  <span>✓</span>
                  <b>CS2 en biblioteca</b>
                  <small>AppID 730 detectado.</small>
                </div>
                <div className={selected.hours < 500 ? "failed" : ""}>
                  <span>{selected.hours >= 500 ? "✓" : "!"}</span>
                  <b>{selected.hours.toLocaleString()} horas</b>
                  <small>Mínimo requerido: 500 h.</small>
                </div>
                <div>
                  <span>✓</span>
                  <b>Sin VAC reciente</b>
                  <small>Sin señales críticas.</small>
                </div>
              </div>
              <div className="level-control">
                <label>
                  Nivel inicial asignado <strong>LVL {selected.level}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={selected.level}
                  onChange={(event) =>
                    update({ level: Number(event.target.value) })
                  }
                />
                <div>
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
              <label className="staff-notes">
                Notas internas
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Motivo del nivel, referencias o señales de riesgo…"
                />
              </label>
              <div className="review-actions">
                <button className="reject" onClick={() => resolve("Rechazado")}>
                  Rechazar
                </button>
                <button
                  className="approve"
                  disabled={selected.hours < 500}
                  onClick={() => resolve("Verificado")}
                >
                  Aprobar como LVL {selected.level}
                </button>
              </div>
            </article>
          ) : (
            <article className="review-card">
              <h3>No hay verificaciones pendientes</h3>
              <p className="wallet-help">
                Las nuevas cuentas vinculadas aparecerán aquí.
              </p>
            </article>
          )}
        </div>
      )}
      {staffTab === "Disputas" && <StaffOperations mode="disputes" notify={notify} />}
      {staffTab === "Reportes chat" && <ChatReportsManager notify={notify} />}
      {staffTab === "Usuarios" && <StaffOperations mode="users" notify={notify} />}
      {staffTab === "Roles" && <RolesManager notify={notify} />}
      {staffTab === "Sanciones" && <StaffOperations mode="sanctions" notify={notify} />}
      {staffTab === "Auditoría" && <StaffOperations mode="audit" notify={notify} />}
    </section>
  );
}

function SeasonsManager({ notify }: { notify: (message: string) => void }) {
  const [data, setData] = useState<{ active: { id: string; name: string; startsAt: string; endsAt: string } | null; closed: Array<{ id: string; name: string; podium: Array<{ position: number; nickname: string; elo: number }> }> } | null>(null);
  const [name, setName] = useState("Temporada 01 · Lima");
  const [endsAt, setEndsAt] = useState(() => new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const load = async () => { const response = await fetch("/api/seasons", { cache: "no-store" }); if (response.ok) setData(await response.json()); };
  useEffect(() => { void load(); }, []);
  const submit = async () => {
    setBusy(true);
    const response = await fetch("/api/seasons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data?.active ? { action: "close_and_start", nextName: name, nextEndsAt: endsAt } : { action: "initialize", name, endsAt }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    const errors: Record<string, string> = { active_rooms_exist: "No se puede cerrar mientras existan partidas activas o en revisión", invalid_season: "Revisa el nombre y la fecha", invalid_next_season: "Revisa el nombre y la fecha de la siguiente temporada" };
    notify(response.ok ? (data?.active ? "Temporada cerrada, podio guardado y nueva temporada iniciada" : "Primera temporada iniciada") : result.error ? errors[result.error] ?? "No se pudo procesar la temporada" : "No se pudo procesar la temporada");
    if (response.ok) await load();
  };
  return <section className="season-admin"><div className="roles-intro"><div><span className="staff-role">CONTROL COMPETITIVO</span><h3>Temporadas</h3><p>El cierre guarda todas las posiciones, entrega insignias y reajusta los niveles para la siguiente temporada.</p></div></div>{data?.active && <article className="account-surface"><span className="verified-badge">TEMPORADA ACTIVA</span><h3>{data.active.name}</h3><p className="wallet-help">Final programado: {new Date(data.active.endsAt).toLocaleDateString("es-PE")}</p></article>}<div className="admin-result-controls"><h3>{data?.active ? "Cerrar e iniciar la siguiente" : "Inicializar primera temporada"}</h3><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Fecha de cierre<input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label><button className="primary-button" disabled={busy || name.trim().length < 3} onClick={() => void submit()}>{busy ? "Procesando…" : data?.active ? "Cerrar temporada y guardar podio" : "Iniciar temporada"}</button></div><div className="staff-table"><div><strong>Archivo histórico</strong><span>{data?.closed.length ?? 0} temporadas</span></div>{(data?.closed ?? []).map((season) => <article key={season.id}><span>{season.name}</span><span>{season.podium.map((player) => `#${player.position} ${player.nickname}`).join(" · ") || "Sin clasificados"}</span></article>)}</div></section>;
}

type OperationsData = {
  disputes: Array<{ id: string; roomId: string; roomName: string | null; accusedUserId: string | null; reason: string; description: string; status: string; resolution: string | null; createdAt: string; evidence: Array<{ id: string; type: string; description: string | null }> }>;
  sanctions: Array<{ id: string; userId: string; nickname: string; type: string; reason: string; penaltyCents: number; expiresAt: string | null; revokedAt: string | null; createdAt: string }>;
  appeals: Array<{ id: string; sanctionId: string; nickname: string; reason: string; status: string; resolution: string | null; createdAt: string }>;
  audits: Array<{ id: string; action: string; entityType: string; entityId: string | null; reason: string | null; createdAt: string }>;
  users: Array<{ id: string; nickname: string; role: string; status: string; level: number }>;
};

function StaffOperations({ mode, notify }: { mode: "disputes" | "sanctions" | "audit" | "users"; notify: (message: string) => void }) {
  const [data, setData] = useState<OperationsData | null>(null);
  const [target, setTarget] = useState("");
  const [type, setType] = useState("warning");
  const [reason, setReason] = useState("");
  const load = async () => { const response = await fetch("/api/staff/operations", { cache: "no-store" }); if (response.ok) { const body = await response.json() as OperationsData; setData(body); setTarget((current) => current || body.users[0]?.id || ""); } };
  useEffect(() => { void load(); }, []);
  const reviewDispute = async (item: OperationsData["disputes"][number], decision: "dismissed" | "upheld") => { const resolution = decision === "dismissed" ? "Revisado por staff: reporte descartado." : "Infracción confirmada por el staff."; let response = await fetch(`/api/staff/disputes/${item.id}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, resolution }) }); if (response.ok && decision === "upheld") response = await fetch(`/api/staff/rooms/${item.roomId}/cancel`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: resolution, sanctionedUserId: item.accusedUserId || undefined }) }); notify(response.ok ? "Caso resuelto y registrado" : "No se pudo resolver el caso"); if (response.ok) await load(); };
  const sanction = async () => { const penalties: Record<string, number> = { no_show: 300, abandonment: 1200 }; const response = await fetch("/api/staff/operations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sanction", userId: target, type, reason, penaltyCents: penalties[type] ?? 0, expiresHours: type === "ban" ? undefined : 24 }) }); notify(response.ok ? "Sanción aplicada y auditada" : "No se pudo aplicar la sanción"); if (response.ok) { setReason(""); await load(); } };
  const reviewAppeal = async (id: string, decision: "accepted" | "rejected") => { const response = await fetch("/api/staff/operations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "review_appeal", appealId: id, decision, resolution: decision === "accepted" ? "Apelación aceptada; sanción revocada y saldo regularizado." : "Apelación revisada y rechazada por el staff." }) }); notify(response.ok ? "Apelación resuelta" : "No se pudo resolver la apelación"); if (response.ok) await load(); };
  if (!data) return <p className="wallet-help">Cargando información operativa…</p>;
  if (mode === "disputes") return <div className="staff-table"><div><strong>Disputas reales</strong><span>{data.disputes.filter((x) => x.status === "pending").length} pendientes</span></div>{data.disputes.map((item) => <article key={item.id}><span>{item.roomName ?? item.roomId}</span><span>{item.reason}</span><span>{item.description}</span><span>{item.status}</span><span className="evidence-links">{item.evidence.map((file) => <a key={file.id} href={`/api/staff/disputes/${item.id}/evidence/${file.id}`} target="_blank" rel="noreferrer">{file.type}: {file.description ?? "evidencia"}</a>)}{!item.evidence.length && "Sin adjuntos"}</span>{item.status === "pending" ? <span><button onClick={() => void reviewDispute(item, "dismissed")}>Descartar</button><button onClick={() => void reviewDispute(item, "upheld")}>Confirmar y cancelar</button></span> : <span>{item.resolution}</span>}</article>)}{!data.disputes.length && <p className="wallet-help">No hay disputas registradas.</p>}</div>;
  if (mode === "users") return <div className="staff-table"><div><strong>Usuarios registrados</strong><span>{data.users.length} cuentas</span></div>{data.users.map((item) => <article key={item.id}><span>{item.nickname}</span><span>LVL {item.level}</span><span>{item.role}</span><span>{item.status}</span></article>)}</div>;
  if (mode === "audit") return <div className="staff-table"><div><strong>Auditoría administrativa</strong><span>{data.audits.length} registros recientes</span></div>{data.audits.map((item) => <article key={item.id}><span>{item.action.replaceAll("_", " ")}</span><span>{item.entityType}</span><span>{item.reason ?? "Sin observación"}</span><span>{new Date(item.createdAt).toLocaleString("es-PE")}</span></article>)}</div>;
  return <section><div className="roles-intro"><div><span className="staff-role">DISCIPLINA REAL</span><h3>Aplicar sanción</h3></div></div><div className="admin-result-controls"><label>Jugador<select value={target} onChange={(e) => setTarget(e.target.value)}>{data.users.map((user) => <option value={user.id} key={user.id}>{user.nickname}</option>)}</select></label><label>Tipo<select value={type} onChange={(e) => setType(e.target.value)}><option value="warning">Advertencia</option><option value="mute">Mute 24 h</option><option value="no_show">No-show · S/ 3</option><option value="abandonment">Abandono · S/ 12</option><option value="suspension">Suspensión</option><option value="ban">Ban</option></select></label><label>Motivo<textarea value={reason} onChange={(e) => setReason(e.target.value)} /></label><button className="primary-button" disabled={reason.trim().length < 5} onClick={() => void sanction()}>Aplicar y registrar</button></div><div className="staff-table"><div><strong>Sanciones</strong><span>{data.sanctions.length} registros</span></div>{data.sanctions.map((item) => <article key={item.id}><span>{item.nickname}</span><span>{item.type}</span><span>{item.reason}</span><span>{item.penaltyCents ? `S/ ${(item.penaltyCents / 100).toFixed(2)}` : "Sin multa"}</span><span>{item.revokedAt ? "Revocada" : "Activa"}</span></article>)}</div><div className="staff-table"><div><strong>Apelaciones</strong><span>{data.appeals.filter((x) => x.status === "pending").length} pendientes</span></div>{data.appeals.map((item) => <article key={item.id}><span>{item.nickname}</span><span>{item.reason}</span><span>{item.status}</span>{item.status === "pending" && <span><button onClick={() => void reviewAppeal(item.id, "rejected")}>Rechazar</button><button onClick={() => void reviewAppeal(item.id, "accepted")}>Aceptar</button></span>}</article>)}</div></section>;
}

type ChatReportItem = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  message: string;
  author: string;
  reporter: string;
};

function ChatReportsManager({ notify }: { notify: (message: string) => void }) {
  const [reports, setReports] = useState<ChatReportItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const load = async () => {
    const response = await fetch("/api/staff/chat-reports");
    if (!response.ok) return;
    const body = (await response.json()) as { reports: ChatReportItem[] };
    setReports(body.reports);
    setSelectedId((current) => current || body.reports[0]?.id || "");
  };
  useEffect(() => { void load(); }, []);
  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];
  const review = async (decision: "remove" | "dismiss") => {
    if (!selected) return;
    const response = await fetch(`/api/staff/chat-reports/${selected.id}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    notify(response.ok ? (decision === "remove" ? "Mensaje retirado y reporte resuelto" : "Reporte descartado") : "No se pudo resolver el reporte");
    if (response.ok) await load();
  };
  return (
    <div className="staff-workspace">
      <aside className="candidate-list">
        <div className="candidate-filter"><strong>Reportes del chat</strong><span>{reports.filter((r) => r.status === "pending").length} pendientes</span></div>
        {reports.map((report) => (
          <button key={report.id} className={selected?.id === report.id ? "active" : ""} onClick={() => setSelectedId(report.id)}>
            <span className="case-alert">!</span>
            <span><strong>{report.author}</strong><small>Reportado por {report.reporter}</small></span>
            <i className={`request-status ${report.status}`}>{report.status}</i>
          </button>
        ))}
      </aside>
      <article className="review-card">
        {selected ? (
          <>
            <span className="staff-role">MODERACIÓN DE COMUNIDAD</span>
            <h3>Mensaje de {selected.author}</h3>
            <p className="wallet-help">“{selected.message}”</p>
            <div className="case-policy"><strong>Motivo del reporte</strong><span>{selected.reason}</span><span>Reportado por {selected.reporter}</span></div>
            {selected.status === "pending" && <div className="review-actions"><button className="reject" onClick={() => void review("dismiss")}>Descartar</button><button className="approve" onClick={() => void review("remove")}>Retirar mensaje</button></div>}
          </>
        ) : <><h3>No hay reportes de chat</h3><p className="wallet-help">Los mensajes denunciados aparecerán aquí.</p></>}
      </article>
    </div>
  );
}

function RolesManager({ notify }: { notify: (message: string) => void }) {
  const [roles, setRoles] = useState<
    Array<{ id: string; name: string; role: string }>
  >([]);
  const loadRoles = async () => {
    const response = await fetch("/api/staff/users");
    if (!response.ok) return;
    const body = (await response.json()) as {
      users: Array<{ id: string; nickname: string; role: string }>;
    };
    setRoles(
      body.users.map((user) => ({
        id: user.id,
        name: user.nickname,
        role: user.role,
      })),
    );
  };
  useEffect(() => {
    void loadRoles();
  }, []);
  const permissions = [
    {
      role: "Dueño",
      tone: "owner",
      items: [true, true, true, true, true, true],
      note: "Acceso total y único rol que gestiona administradores.",
    },
    {
      role: "Admin",
      tone: "admin",
      items: [true, true, true, true, true, false],
      note: "Opera plataforma, finanzas, salas y moderación.",
    },
    {
      role: "Mod",
      tone: "mod",
      items: [false, true, true, true, false, false],
      note: "Crea salas, modera chat y aplica sanciones.",
    },
    {
      role: "Streamer",
      tone: "streamer",
      items: [false, false, false, false, false, false],
      note: "Prefijo visible y beneficios promocionales.",
    },
    {
      role: "Sub",
      tone: "sub",
      items: [false, false, false, false, false, false],
      note: "Prefijo y una sala gratuita diaria.",
    },
  ];
  const columns = [
    "Saldos",
    "Salas",
    "Ban / mute",
    "Verificaciones",
    "Roles",
    "Admins",
  ];
  const change = async (item: { id: string; name: string }, role: string) => {
    const response = await fetch(`/api/staff/users/${item.id}/role`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, reason: "Asignación desde panel de roles" }),
    });
    notify(
      response.ok
        ? `${item.name}: rol actualizado`
        : "No tienes permiso para realizar ese cambio",
    );
    if (response.ok) await loadRoles();
  };
  return (
    <section className="roles-manager">
      <div className="roles-intro">
        <div>
          <span className="staff-role">CONTROL DE ACCESO</span>
          <h3>Roles y permisos</h3>
          <p>
            Cada cambio requiere un motivo y queda registrado. Nadie puede
            otorgarse permisos a sí mismo.
          </p>
        </div>
        <span>
          <small>CUENTAS REGISTRADAS</small>
          {roles.length} personas
        </span>
      </div>
      <div className="permissions-table">
        <div className="permissions-head">
          <strong>ROL</strong>
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        {permissions.map((row) => (
          <div key={row.role}>
            <span className={`role-card ${row.tone}`}>
              <b>{row.role}</b>
              <small>{row.note}</small>
            </span>
            {row.items.map((allowed, index) => (
              <i
                className={allowed ? "allowed" : "denied"}
                key={`${row.role}-${index}`}
              >
                {allowed ? "✓" : "—"}
              </i>
            ))}
          </div>
        ))}
      </div>
      <div className="role-assignments">
        <div className="panel-title">
          <strong>Asignaciones actuales</strong>
          <span>Solo Dueño y Admin autorizados</span>
        </div>
        {roles.map((item) => (
          <article key={item.id}>
            <span className="online-avatar">{item.name[0]}</span>
            <div>
              <strong>{item.name}</strong>
              <small>Cuenta verificada · Sin restricciones</small>
            </div>
            <select
              value={item.role}
              onChange={(event) => void change(item, event.target.value)}
            >
              <option value="player">Jugador</option>
              <option value="sub">Sub</option>
              <option value="streamer">Streamer</option>
              <option value="mod">Mod</option>
              <option value="admin">Admin</option>
              <option value="owner">Dueño</option>
            </select>
            <button onClick={() => notify(`${item.name}: permisos revisados`)}>
              Revisar
            </button>
          </article>
        ))}
      </div>
      <div className="role-warning">
        El rol Streamer y Sub no recibe permisos administrativos. Sus beneficios
        son únicamente visuales o promocionales.
      </div>
    </section>
  );
}

function DisputeReview({ notify }: { notify: (message: string) => void }) {
  const [status, setStatus] = useState("Pendiente");
  const resolve = (result: string) => {
    setStatus(result);
    notify(`Caso DSP-031: ${result}`);
  };
  return (
    <div className="dispute-review">
      <aside>
        <div className="candidate-filter">
          <strong>Casos abiertos</strong>
          <span>1 pendiente</span>
        </div>
        <button className="active">
          <span className="case-alert">!</span>
          <span>
            <strong>DSP-031 · Sala #184</strong>
            <small>Hacks · Reportado por Tom</small>
          </span>
          <i className={`request-status ${status.toLowerCase()}`}>{status}</i>
        </button>
      </aside>
      <article>
        <div className="case-head">
          <div>
            <span className="staff-role">PRIORIDAD ALTA</span>
            <h3>Sospecha de uso de hacks</h3>
            <p>Sala Violeta #184 · Mirage · Equipo A 13—9</p>
          </div>
          <i className={`request-status ${status.toLowerCase()}`}>{status}</i>
        </div>
        <div className="case-evidence">
          <span>
            <small>REPORTADO</small>neo · Equipo B
          </span>
          <span>
            <small>RONDA SEÑALADA</small>Ronda 17
          </span>
          <span>
            <small>DEMO MATCHZY</small>
            <b>Disponible</b>
          </span>
          <span>
            <small>DINERO</small>S/ 60 bloqueados
          </span>
        </div>
        <div className="demo-timeline">
          <div>
            <b>▶ Demo de la partida</b>
            <span>17:42 / 38:10</span>
          </div>
          <div className="timeline-bar">
            <i />
          </div>
          <p>
            Marca del denunciante: “pre-aim repetido y seguimiento a través del
            humo”.
          </p>
        </div>
        <label className="staff-notes">
          Resolución interna
          <textarea placeholder="Describe la evidencia revisada y el motivo de la decisión…" />
        </label>
        <div className="case-policy">
          <strong>Si se confirma la infracción:</strong>
          <span>
            Se cancela la partida y se devuelve S/ 6 a los nueve jugadores
            inocentes.
          </span>
          <span>
            El sancionado pierde su entrada y recibe suspensión o ban.
          </span>
          <span>
            La decisión genera movimientos contables y registro de auditoría.
          </span>
        </div>
        <div className="case-actions">
          <button onClick={() => resolve("Desestimado")}>
            Desestimar reporte
          </button>
          <button onClick={() => resolve("Sancionado")}>
            Confirmar infracción y cancelar
          </button>
        </div>
      </article>
    </div>
  );
}
function StaffTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="staff-table">
      <div>
        <strong>{title}</strong>
        <span>Solo lectura en esta demostración</span>
      </div>
      {rows.map((row, index) => (
        <article key={`${row[0]}-${index}`}>
          {row.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
          <button>Revisar →</button>
        </article>
      ))}
    </div>
  );
}

type PaymentRequest = {
  id: string;
  user: string;
  type: "Recarga" | "Retiro";
  method: "Yape" | "Plin";
  amount: number;
  operation: string;
  proofUrl?: string | null;
  destinationName?: string | null;
  destinationPhone?: string | null;
  paymentDate?: string | null;
  paymentTime?: string | null;
  payerName?: string | null;
  status: "Pendiente" | "Aprobada" | "Rechazada";
};
const seedPayments: PaymentRequest[] = [
  {
    id: "PAY-2041",
    user: "Maddison",
    type: "Recarga",
    method: "Yape",
    amount: 20,
    operation: "88419321",
    status: "Pendiente",
  },
  {
    id: "PAY-2040",
    user: "hoxhi",
    type: "Retiro",
    method: "Plin",
    amount: 40,
    operation: "—",
    status: "Pendiente",
  },
  {
    id: "PAY-2039",
    user: "Jericho",
    type: "Recarga",
    method: "Yape",
    amount: 12,
    operation: "88417106",
    status: "Pendiente",
  },
  {
    id: "PAY-2038",
    user: "neo",
    type: "Retiro",
    method: "Yape",
    amount: 10,
    operation: "—",
    status: "Pendiente",
  },
];
function FinancePanel({ notify }: { notify: (message: string) => void }) {
  const [requests, setRequests] = useState(seedPayments.slice(0, 0));
  const [selectedId, setSelectedId] = useState("");
  const [financeTab, setFinanceTab] = useState("Pendientes");
  const [financeError, setFinanceError] = useState("");
  const [ledger, setLedger] = useState<Array<{ id: string; nickname: string; roomId: string | null; type: string; amountCents: number; description: string; createdAt: string }>>([]);
  const loadPayments = async () => {
    const response = await fetch("/api/staff/payments");
    if (!response.ok) {
      setFinanceError(
        "Solo Dueño y Admin pueden gestionar solicitudes financieras.",
      );
      return;
    }
    const body = (await response.json()) as {
      requests: Array<{
        id: string;
        type: "deposit" | "withdrawal";
        method: "yape" | "plin";
        amountCents: number;
        operationCode: string | null;
        proofUrl: string | null;
        destinationName: string | null;
        destinationPhone: string | null;
        paymentDate: string | null;
        paymentTime: string | null;
        payerName: string | null;
        status: string;
        nickname: string;
      }>;
      ledger: typeof ledger;
    };
    const mapped: PaymentRequest[] = body.requests.map((item) => ({
      id: item.id,
      user: item.nickname,
      type: item.type === "deposit" ? "Recarga" : "Retiro",
      method: item.method === "yape" ? "Yape" : "Plin",
      amount: item.amountCents / 100,
      operation: item.operationCode ?? "—",
      proofUrl: item.proofUrl,
      destinationName: item.destinationName,
      destinationPhone: item.destinationPhone,
      paymentDate: item.paymentDate,
      paymentTime: item.paymentTime,
      payerName: item.payerName,
      status:
        item.status === "pending"
          ? "Pendiente"
          : item.status === "rejected"
            ? "Rechazada"
            : "Aprobada",
    }));
    setRequests(mapped);
    setLedger(body.ledger ?? []);
    setSelectedId((current) => current || mapped[0]?.id || "");
  };
  useEffect(() => {
    void loadPayments();
  }, []);
  const selected =
    requests.find((item) => item.id === selectedId) || requests[0] || null;
  const resolve = async (status: "Aprobada" | "Rechazada") => {
    if (!selected) return;
    const response = await fetch(`/api/staff/payments/${selected.id}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decision: status === "Aprobada" ? "approve" : "reject",
      }),
    });
    notify(
      response.ok
        ? `${selected.id}: operación ${status.toLowerCase()}`
        : "No se pudo procesar la solicitud",
    );
    if (response.ok) await loadPayments();
  };
  const visible =
    financeTab === "Pendientes"
      ? requests.filter((item) => item.status === "Pendiente")
      : requests.filter((item) => item.status !== "Pendiente");
  const pending = requests.filter((item) => item.status === "Pendiente");
  const pendingTotal = pending.reduce((sum, item) => sum + item.amount, 0);
  const approvedDeposits = requests
    .filter((item) => item.status === "Aprobada" && item.type === "Recarga")
    .reduce((sum, item) => sum + item.amount, 0);
  const approvedWithdrawals = requests
    .filter((item) => item.status === "Aprobada" && item.type === "Retiro")
    .reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="finance-panel">
      <div className="staff-top">
        <div>
          <span className="staff-role">CONTROL FINANCIERO · EN VIVO</span>
          <h2>Wallet y conciliación</h2>
          <p>
            Cada cambio genera un movimiento contable. Los administradores
            aprueban solicitudes, pero no editan saldos directamente.
          </p>
        </div>
        <div className="staff-kpis">
          <span>
            <small>SOLICITUDES</small>
            {requests.length}
          </span>
          <span>
            <small>PENDIENTES</small>
            {pending.length}
          </span>
          <span>
            <small>EN REVISIÓN</small>S/ {pendingTotal.toFixed(2)}
          </span>
        </div>
      </div>
      {financeError && <div className="payment-warning">{financeError}</div>}
      <div className="finance-summary">
        <article>
          <span>Entradas de hoy</span>
          <strong>+ S/ {approvedDeposits.toFixed(2)}</strong>
          <small>Recargas confirmadas</small>
        </article>
        <article>
          <span>Salidas de hoy</span>
          <strong>− S/ {approvedWithdrawals.toFixed(2)}</strong>
          <small>Retiros procesados</small>
        </article>
        <article>
          <span>Cuadre esperado</span>
          <strong>
            S/ {(approvedDeposits - approvedWithdrawals).toFixed(2)}
          </strong>
          <small className="reconciled">✓ Conciliado</small>
        </article>
        <article>
          <span>Fondos en revisión</span>
          <strong>S/ {pendingTotal.toFixed(2)}</strong>
          <small>{pending.length} solicitudes pendientes</small>
        </article>
      </div>
      <div className="staff-tabs">
        {["Pendientes", "Procesadas", "Libro mayor"].map((tab) => (
          <button
            key={tab}
            className={financeTab === tab ? "active" : ""}
            onClick={() => setFinanceTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {financeTab !== "Libro mayor" ? (
        <div className="finance-workspace">
          <aside className="payment-list">
            <div className="candidate-filter">
              <strong>{financeTab}</strong>
              <span>{visible.length} operaciones</span>
            </div>
            {visible.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={selected.id === item.id ? "active" : ""}
              >
                <span className={`payment-type ${item.type.toLowerCase()}`}>
                  {item.type === "Recarga" ? "+" : "↗"}
                </span>
                <span>
                  <strong>{item.user}</strong>
                  <small>
                    {item.id} · {item.method}
                  </small>
                </span>
                <b>S/ {item.amount.toFixed(2)}</b>
                <i className={`request-status ${item.status.toLowerCase()}`}>
                  {item.status}
                </i>
              </button>
            ))}
            {!visible.length && (
              <p className="empty-finance">No hay operaciones en esta vista.</p>
            )}
          </aside>
          {selected && (
            <article className="payment-review">
              <div className="payment-review-head">
                <div>
                  <span
                    className={`payment-type ${selected.type.toLowerCase()}`}
                  >
                    {selected.type === "Recarga" ? "+" : "↗"}
                  </span>
                  <div>
                    <small>{selected.id}</small>
                    <h3>
                      {selected.type} de {selected.user}
                    </h3>
                  </div>
                </div>
                <strong>S/ {selected.amount.toFixed(2)}</strong>
              </div>
              <div className="payment-data">
                <span>
                  <small>MÉTODO</small>
                  {selected.method}
                </span>
                <span>
                  <small>OPERACIÓN</small>
                  {selected.operation}
                </span>
                <span>
                  <small>TITULAR</small>
                  {selected.destinationName ?? selected.user}
                </span>
                <span>
                  <small>ESTADO</small>
                  {selected.status}
                </span>
                {selected.type === "Recarga" && <><span><small>FECHA Y HORA</small>{selected.paymentDate ?? "—"} · {selected.paymentTime ?? "—"}</span><span><small>NOMBRE DEL PAGADOR</small>{selected.payerName ?? "No indicado"}</span></>}
              </div>
              {selected.type === "Recarga" ? (
                <div className="receipt-demo">
                  {selected.proofUrl ? (
                    <img className="payment-proof" src={`/api/staff/payments/${selected.id}/proof`} alt={`Comprobante ${selected.operation}`} />
                  ) : (
                    <><span>SIN COMPROBANTE ADJUNTO</span><strong>{selected.method}</strong><b>S/ {selected.amount.toFixed(2)}</b></>
                  )}
                  <small>Operación {selected.operation}</small>
                </div>
              ) : (
                <div className="withdraw-checks">
                  <span>Destino: {selected.destinationPhone ?? "Sin registrar"}</span>
                  <span>✓ Jugó al menos una sala</span>
                  <span>✓ Saldo disponible suficiente</span>
                  <span>✓ Titular verificado</span>
                  <span>✓ Sin deuda disciplinaria</span>
                </div>
              )}
              <div className="payment-warning">
                Verificar que el número de operación no haya sido utilizado
                previamente y que el titular coincida con la cuenta.
              </div>
              <div className="review-actions">
                <button
                  className="reject"
                  disabled={selected.status !== "Pendiente"}
                  onClick={() => resolve("Rechazada")}
                >
                  Rechazar
                </button>
                <button
                  className="approve"
                  disabled={selected.status !== "Pendiente"}
                  onClick={() => resolve("Aprobada")}
                >
                  {selected.type === "Retiro" ? "Marcar como pagado" : "Aprobar y acreditar"}
                </button>
              </div>
            </article>
          )}
        </div>
      ) : (
        <LedgerPanel entries={ledger} />
      )}
    </section>
  );
}
function LedgerPanel({ entries }: { entries: Array<{ id: string; nickname: string; roomId: string | null; type: string; amountCents: number; description: string; createdAt: string }> }) {
  return (
    <div className="ledger-full">
      <div className="ledger-head">
        <span>ID</span>
        <span>USUARIO</span>
        <span>TIPO</span>
        <span>REFERENCIA</span>
        <span>DÉBITO</span>
        <span>CRÉDITO</span>
        <span>SALDO</span>
      </div>
      {entries.map((entry) => <div key={entry.id}><span>{entry.id.slice(-8)}</span><span>{entry.nickname}</span><span>{entry.type}</span><span>{entry.roomId ?? entry.description}</span><span>{entry.amountCents < 0 ? `S/ ${Math.abs(entry.amountCents / 100).toFixed(2)}` : "—"}</span><span className="positive">{entry.amountCents > 0 ? `S/ ${(entry.amountCents / 100).toFixed(2)}` : "—"}</span><span>{new Date(entry.createdAt).toLocaleString("es-PE")}</span></div>)}
      {!entries.length && <p className="wallet-help">No hay movimientos contables registrados.</p>}
    </div>
  );
}
