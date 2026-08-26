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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as SessionData & {
          onboardingRequired?: boolean;
        };
        return body.onboardingRequired ? null : body;
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
    setJoined(true);
    setNotice("Puesto reservado · S/ 6 bloqueados de tu saldo");
    window.setTimeout(() => setNotice(""), 3500);
  }

  function enterDemo() {
    setSteamOpen(false);
    setScreen("dashboard");
    setNotice("Verificación demo aprobada · Ya puedes entrar a las salas");
    window.setTimeout(() => setNotice(""), 3500);
  }

  if (screen === "dashboard")
    return (
      <EnhancedDashboard
        balance={balance}
        setBalance={setBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openRoom={() => setScreen("room")}
        goHome={() => setScreen("landing")}
        notice={notice}
        setNotice={setNotice}
        session={session}
      />
    );
  if (screen === "room")
    return (
      <EnhancedRoomFlow
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
    <main className="min-h-screen overflow-hidden bg-[#09080d] text-white">
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
          <a className="text-white" href="#salas">
            Salas
          </a>
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

      <section className="relative z-10 mx-auto grid max-w-[1440px] gap-12 px-5 pb-16 pt-10 md:px-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
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
            Salas privadas 5v5 con servidores peruanos, equipos balanceados y
            premios reales. Tu nivel decide el reto; tu juego, el resultado.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a className="primary-button" href="#salas">
              Ver salas disponibles <span>↗</span>
            </a>
            <div className="flex items-center gap-3 text-sm text-white/50">
              <span className="live-pulse" /> 186 jugadores conectados
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
        </div>

        <div id="salas" className="match-shell">
          <div className="match-topbar">
            <div>
              <span className="status-pill">
                <i /> FORMANDO EQUIPOS
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Sala Violeta #184
              </h2>
            </div>
            <div className="text-right">
              <span className="block text-xs text-white/35">ENTRADA</span>
              <strong className="text-2xl text-violet-300">S/ 6.00</strong>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            {players.map((player, index) => (
              <div key={player.name} className="player-card">
                <div className={`avatar bg-gradient-to-br ${player.tone}`}>
                  {player.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="truncate">{player.name}</strong>
                    {index < 2 && <span className="captain">CAP</span>}
                  </div>
                  <span className="text-xs text-white/35">
                    {index < 2 ? "Capitán" : "Jugador verificado"}
                  </span>
                </div>
                <span className="level">LVL {player.level}</span>
              </div>
            ))}
            {joined && (
              <div className="player-card ring-1 ring-violet-400/40">
                <div className="avatar bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  T
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">Tu cuenta</strong>
                  <span className="text-xs text-violet-300">
                    Puesto reservado
                  </span>
                </div>
                <span className="level">LVL 5</span>
              </div>
            )}
            {Array.from({ length: joined ? 5 : 6 }, (_, i) => (
              <div key={i} className="empty-slot">
                <span>+</span> Esperando jugador
              </div>
            ))}
          </div>
          <div className="match-footer">
            <div>
              <span className="text-xs text-white/35">JUGADORES</span>
              <strong className="ml-3">{joined ? 5 : 4} / 10</strong>
            </div>
            <div className="progress">
              <span style={{ width: joined ? "50%" : "40%" }} />
            </div>
            <button
              disabled={joined}
              onClick={joinRoom}
              className="join-button disabled:cursor-default disabled:opacity-50"
            >
              {joined ? "Ya estás dentro" : "Unirme por S/ 6"}
            </button>
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
            <span /> Temporada 01
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            El nivel se
            <br />
            demuestra jugando.
          </h2>
          <p className="mt-5 max-w-md leading-7 text-white/45">
            Cada partida suma historial, reputación y Elo. El staff calibra tu
            nivel inicial; después, tu rendimiento habla por ti.
          </p>
        </div>
        <div className="ranking-card">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <strong>Ranking competitivo</strong>
            <span className="text-xs text-white/35">ACTUALIZADO HOY</span>
          </div>
          {ranking.map(([place, name, level, elo]) => (
            <div className="ranking-row" key={place}>
              <span className="font-mono text-violet-300">{place}</span>
              <strong>{name}</strong>
              <span className="level">{level}</span>
              <span className="ml-auto font-mono text-sm">{elo} ELO</span>
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
          complete={enterDemo}
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
}: {
  close: () => void;
  complete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [steamId, setSteamId] = useState("76561198442891307");
  const [fullName, setFullName] = useState("Tom Laura");
  const [nickname, setNickname] = useState("Tom");
  const [email, setEmail] = useState("tom@correo.com");
  const [birthDate, setBirthDate] = useState("2000-08-25");
  const [backendMessage, setBackendMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const validId = /^7656119\d{10}$/.test(steamId);
  const saveProfile = async () => {
    setSaving(true);
    setBackendMessage("");
    try {
      const response = await fetch("/api/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, nickname, email, birthDate }),
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
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
              <label>
                Seguridad
                <input value="Protegida por ChatGPT" disabled />
              </label>
              {mode === "register" && (
                <label>
                  Fecha de nacimiento
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                  />
                  <small>
                    Debes ser mayor de 18 años. En tu cumpleaños recibes 2 salas
                    gratis.
                  </small>
                </label>
              )}
            </div>
            <button
              className="primary-button w-full"
              disabled={saving}
              onClick={() =>
                mode === "register"
                  ? saveProfile()
                  : window.location.assign("/signin-with-chatgpt?return_to=/")
              }
            >
              {mode === "register"
                ? "Siguiente: vincular Steam →"
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
                src="https://api.dicebear.com/9.x/thumbs/svg?seed=Maddison&backgroundColor=2e1065,312e81"
                alt="Avatar del perfil de Steam"
              />
              <div>
                <small>PERFIL ENCONTRADO</small>
                <strong>Maddison</strong>
                <span>{steamId}</span>
              </div>
            </div>
            <h2>Comprobación de requisitos</h2>
            <div className="registration-checks">
              <span>
                <i>✓</i>
                <b>Perfil público</b>
                <small>Información básica visible</small>
              </span>
              <span>
                <i>✓</i>
                <b>Detalles de juego públicos</b>
                <small>Biblioteca y horas visibles</small>
              </span>
              <span>
                <i>✓</i>
                <b>2,341 horas en CS2</b>
                <small>Supera el mínimo de 500 h</small>
              </span>
              <span>
                <i>✓</i>
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
              onClick={() => setStep(3)}
            >
              Enviar solicitud al staff
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
                <small>SOLICITUD</small>VER-2041
              </span>
              <span>
                <small>ESTADO</small>
                <b>Pendiente</b>
              </span>
              <span>
                <small>TIEMPO ESTIMADO</small>Hasta 24 h
              </span>
            </div>
            <button className="primary-button w-full" onClick={complete}>
              Simular aprobación y entrar
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
  openRoom: () => void;
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
  ];
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
                      Salas: "◫",
                      Wallet: "◈",
                      Beneficios: "★",
                      Conducta: "◆",
                      Historial: "↺",
                      Ranking: "⌁",
                      Staff: "⚙",
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
              <span /> PANEL DEL JUGADOR
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
              <span>1,298 ELO</span>
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
            <div className="card-label">TU TEMPORADA</div>
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
  openRoom: () => void;
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
          <span>
            <small>PROMEDIO</small>
            {average}
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
      <button className="room-enter" onClick={openRoom}>
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
            <small>ELO</small>
            {profile.elo}
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
        <button>Ver perfil completo</button>
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
  openRoom: () => void;
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
  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };
  const applyWallet = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const response = await fetch("/api/wallet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: walletAction === "deposit" ? "deposit" : "withdrawal",
        method: paymentMethod,
        amountCents: Math.round(value * 100),
        operationCode: walletAction === "deposit" ? operationCode : undefined,
      }),
    });
    const body = (await response.json()) as {
      error?: string;
      wallet?: { availableCents: number };
    };
    const labels: Record<string, string> = {
      operation_code_required: "Ingresa el código de operación de Yape o Plin",
      withdrawal_minimum: "El retiro mínimo es S/ 10",
      one_room_required: "Debes haber participado en una sala antes de retirar",
      insufficient_balance: "No tienes saldo suficiente",
      duplicate_operation: "Ese código de operación ya fue registrado",
      invalid_request: "Revisa el monto y los datos de la solicitud",
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
        <header className="app-header">
          <div>
            <p className="eyebrow">
              <span /> PANEL DEL JUGADOR
            </p>
            <h1>
              {activeTab === "Inicio" ? `Buenos días, ${nickname}` : activeTab}
            </h1>
          </div>
          <div className="header-actions">
            <button
              className="balance-chip"
              onClick={() => setActiveTab("Wallet")}
            >
              <small>SALDO DISPONIBLE</small>
              <strong>S/ {balance.toFixed(2)}</strong>
            </button>
            <button className="icon-button">●</button>
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
        {activeTab === "Perfil" && <PublicProfilePanel />}
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
            <label>
              Monto en soles
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
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
            </label>
            {walletAction === "deposit" ? (
              <div className="qr-placeholder">
                <strong>QR</strong>
                <span>El comprobante se validará antes de acreditar</span>
                <input
                  value={operationCode}
                  onChange={(event) => setOperationCode(event.target.value)}
                  placeholder="Código de operación"
                  aria-label="Código de operación"
                />
              </div>
            ) : (
              <p className="wallet-help">
                Disponible: S/ {balance.toFixed(2)} · Retiro mínimo S/ 10 ·
                Haber jugado una sala.
              </p>
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
      }),
    });
    setProfileStatus(
      response.ok
        ? "Cambios guardados."
        : "No se pudieron guardar los cambios.",
    );
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
              <span className="verified-badge">TEMPORADA ACTUAL</span>
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
              <small>Elo</small>
              <strong>{session?.rating?.elo ?? 1000}</strong>
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
            <input type="checkbox" defaultChecked />
          </label>
          <label className="privacy-option">
            <span>
              <strong>Mostrar horas de CS2</strong>
              <small>Necesario para conservar la verificación.</small>
            </span>
            <input type="checkbox" defaultChecked disabled />
          </label>
        </div>
      )}
    </section>
  );
}

function HomePanel({
  balance,
  openRoom,
  setActiveTab,
  wallet,
  session,
}: {
  balance: number;
  openRoom: () => void;
  setActiveTab: (tab: string) => void;
  wallet: (action: "deposit" | "withdraw") => void;
  session: SessionData | null;
}) {
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
          <span>{(rating?.elo ?? 1000).toLocaleString()} ELO</span>
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
        <div className="card-label">TU TEMPORADA</div>
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
        <Transactions compact />
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
  openRoom: () => void;
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
    };
    const labels: Record<string, string> = {
      insufficient_balance: "Saldo insuficiente: necesitas S/ 6 disponibles",
      staff_verification_required:
        "El staff debe verificar tu cuenta antes de jugar",
      room_full: "La sala ya está completa",
      room_unavailable: "La sala ya no está disponible",
      authentication_required: "Inicia sesión para reservar",
    };
    if (!response.ok)
      return notify(
        labels[body.error ?? ""] ?? "No se pudo reservar el puesto",
      );
    if (body.wallet) setBalance(body.wallet.availableCents / 100);
    notify(
      body.alreadyJoined
        ? "Ya tienes un puesto en esta sala"
        : "Puesto reservado · S/ 6 bloqueados",
    );
    await loadRooms();
    openRoom();
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
        <div className="filter-pills">
          <button className="active">Todas</button>
          <button>LVL 1–5</button>
          <button>LVL 6–10</button>
          {canCreate && <button onClick={createRoom}>＋ Crear sala</button>}
        </div>
      </div>
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
    </section>
  );
}

function RealRoomRow({ room, join }: { room: RoomData; join: () => void }) {
  const average = room.players.length
    ? room.players.reduce((sum, player) => sum + player.level, 0) /
      room.players.length
    : 0;
  const creatorName = room.creator?.nickname ?? "Staff TENE";
  return (
    <article className="room-row-rich">
      <div className="room-info">
        <div className="room-title-line">
          <span className="room-symbol">T</span>
          <div>
            <strong>{room.name}</strong>
            <small>
              <i />{" "}
              {room.status === "open" ? "Esperando jugadores" : room.status}
            </small>
          </div>
        </div>
        <div className="room-created">
          Creada por <b>{creatorName}</b>
        </div>
        <div className="room-economy">
          <span>
            <small>ENTRADA</small>S/ {(room.entryCents / 100).toFixed(0)}
          </span>
          <span>
            <small>PREMIO</small>S/{" "}
            {(room.prizePerWinnerCents / 100).toFixed(0)}
          </span>
          <span>
            <small>PROMEDIO</small>LVL {average.toFixed(1)}
          </span>
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
  const [subscribed, setSubscribed] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(false);
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
            onClick={() => {
              setSubscribed(true);
              notify("Suscripción demo activada por 30 días");
            }}
          >
            {subscribed ? "✓ Suscripción activa" : "Activar suscripción demo"}
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
            disabled={!subscribed || dailyUsed}
            onClick={() => {
              setDailyUsed(true);
              notify("Pase diario demo reservado");
            }}
          >
            {dailyUsed
              ? "Usado hoy"
              : subscribed
                ? "Usar pase diario"
                : "Requiere Sub"}
          </button>
        </article>
        <article>
          <span>02</span>
          <h3>Prefijo exclusivo</h3>
          <p>Etiqueta SUB visible en perfil, salas, chat y Discord.</p>
          <div className="prefix-preview">
            <b>SUB</b>
            <strong>Tom</strong>
            <small>LVL 5</small>
          </div>
        </article>
        <article>
          <span>03</span>
          <h3>Beneficios futuros</h3>
          <p>
            Acceso anticipado a eventos y salas especiales, sin ventajas
            competitivas.
          </p>
          <i>Próximamente</i>
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
            <small>DISPONIBLES</small>2
          </span>
          <span>
            <small>VENCEN</small>01 sep.
          </span>
          <button
            onClick={() =>
              notify("Se usará un pase de cumpleaños en tu próxima sala")
            }
          >
            Usar en próxima sala
          </button>
        </div>
      </div>
      <div className="benefit-history">
        <strong>Historial de beneficios</strong>
        {[
          ["Pase cumpleaños", "2 salas otorgadas", "25 ago. 2026"],
          ["TENE Sub", "Activación demo", "25 ago. 2026"],
          ["Pase diario", "Disponible", "Hoy"],
        ].map((row) => (
          <div key={row[0]}>
            <span>{row[0]}</span>
            <b>{row[1]}</b>
            <small>{row[2]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConductPanel({ notify }: { notify: (message: string) => void }) {
  const [appealing, setAppealing] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <section className="conduct-panel">
      <div className="conduct-hero">
        <div>
          <span className="verified-badge">CONDUCTA BUENA</span>
          <h2>Tu reputación competitiva</h2>
          <p>
            La puntualidad, permanencia y comportamiento determinan si puedes
            participar en las salas.
          </p>
        </div>
        <div className="conduct-score">
          <strong>92</strong>
          <span>/ 100</span>
          <small>Sin restricciones</small>
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
          <article>
            <span className="sanction-dot resolved" />
            <div>
              <b>No-show · Sala #142</b>
              <small>12 jul. 2026 · Llegaste después del límite</small>
            </div>
            <strong>− S/ 3</strong>
            <i>Pagada</i>
            <button onClick={() => setAppealing(true)}>Apelar</button>
          </article>
          <article>
            <span className="sanction-dot good" />
            <div>
              <b>32 partidas sin incidentes</b>
              <small>Racha actual de buena conducta</small>
            </div>
            <strong>+ 8 pts</strong>
            <i>Activo</i>
          </article>
        </div>
        <aside className="conduct-status">
          <span className="card-label">ESTADO ACTUAL</span>
          <div>
            <small>Deuda disciplinaria</small>
            <strong>S/ 0.00</strong>
          </div>
          <div>
            <small>Suspensión activa</small>
            <strong>No</strong>
          </div>
          <div>
            <small>Mutes activos</small>
            <strong>0</strong>
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
            <h2>No-show · Sala #142</h2>
            <p>
              Explica por qué consideras que la sanción debe revisarse. La multa
              no se elimina mientras la apelación esté pendiente.
            </p>
            <label>
              Motivo
              <textarea placeholder="Describe lo sucedido y cualquier evidencia…" />
            </label>
            <div className="evidence-box">
              ＋ Adjuntar captura o evidencia demo
            </div>
            <button
              className="primary-button w-full"
              disabled={sent}
              onClick={() => {
                setSent(true);
                notify("Apelación demo enviada al staff");
              }}
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
const chatChannels = {
  General: "general",
  "Busco sala": "looking_for_room",
  Soporte: "support",
  Anuncios: "announcements",
} as const;

function CommunityChat({
  notify,
  session,
}: {
  notify: (message: string) => void;
  session: SessionData | null;
}) {
  const [channel, setChannel] = useState("General");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat?channel=${chatChannels[channel as keyof typeof chatChannels]}`);
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
  }, [channel]);

  const send = async () => {
    if (!text.trim()) return;
    if (!session) return notify("Inicia sesión para escribir en el chat");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: chatChannels[channel as keyof typeof chatChannels],
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
          <small>CANALES</small>
          {["General", "Busco sala", "Soporte", "Anuncios"].map((item) => (
            <button
              className={channel === item ? "active" : ""}
              onClick={() => setChannel(item)}
              key={item}
            >
              <span>#</span>
              {item}
              {item === "Soporte" && <i>2</i>}
            </button>
          ))}
          <small>SALAS ACTIVAS</small>
          <button>
            <span>●</span>Sala #184
          </button>
          <button>
            <span>●</span>Sala #183
          </button>
          <div className="discord-card">
            <b>Discord conectado</b>
            <p>Los roles y prefijos se sincronizarán.</p>
            <button
              onClick={() =>
                notify("Vinculación con Discord disponible próximamente")
              }
            >
              Configurar
            </button>
          </div>
        </aside>
        <main className="chat-main">
          <header>
            <div>
              <strong># {channel}</strong>
              <small>
                {channel === "General"
                  ? "Conversación de la comunidad peruana"
                  : "Canal de coordinación y soporte"}
              </small>
            </div>
            <span>186 conectados</span>
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
                      onClick={() =>
                        notify(
                          `${message.name}: reporte demo enviado a moderación`,
                        )
                      }
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
              placeholder={`Enviar mensaje a #${channel.toLowerCase()}…`}
            />
            <span>{text.length}/240</span>
            <button disabled={sending || !text.trim()} onClick={() => void send()}>
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </main>
        <aside className="online-list">
          <strong>EN LÍNEA — 6</strong>
          {[
            ["hoxhi", "DUEÑO", 10],
            ["Tom", "DUEÑO", 5],
            ["Jericho", "MOD", 7],
            ["Maddison", "SUB", 8],
            ["Shiro", "STREAMER", 7],
            ["rayo", "JUGADOR", 4],
          ].map(([name, role, level]) => (
            <div key={String(name)}>
              <span className="online-avatar">{String(name)[0]}</span>
              <span>
                <b>{name}</b>
                <small className={`role-text ${String(role).toLowerCase()}`}>
                  {role}
                </small>
              </span>
              <i>LVL {level}</i>
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
          onClick={() => notify("Reglas de comunidad abiertas en modo demo")}
        >
          Ver reglas del chat
        </button>
      </div>
    </section>
  );
}

function NotificationsPanel({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState("Todas");
  const [read, setRead] = useState<number[]>([5]);
  const [prefs, setPrefs] = useState({
    rooms: true,
    money: true,
    staff: true,
    community: false,
  });
  const items = [
    {
      id: 1,
      type: "Partida",
      icon: "▶",
      title: "Tu servidor está listo",
      copy: "Sala #184 · Conéctate antes de 5 minutos para evitar una multa.",
      time: "Ahora",
      action: "Abrir sala",
    },
    {
      id: 2,
      type: "Partida",
      icon: "⚔",
      title: "Es tu turno en el draft",
      copy: "Eres Capitán A. Elige al siguiente jugador.",
      time: "Hace 2 min",
      action: "Ir al draft",
    },
    {
      id: 3,
      type: "Dinero",
      icon: "S/",
      title: "Recarga aprobada",
      copy: "Se acreditaron S/ 20.00 a tu saldo disponible.",
      time: "Hace 18 min",
      action: "Ver movimiento",
    },
    {
      id: 4,
      type: "Staff",
      icon: "✓",
      title: "Cuenta verificada",
      copy: "El staff aprobó tu perfil y te asignó LVL 5.",
      time: "Hoy 10:41",
      action: "Ver perfil",
    },
    {
      id: 5,
      type: "Comunidad",
      icon: "#",
      title: "Nueva respuesta en Soporte",
      copy: "Jericho respondió tu consulta sobre la Sala #176.",
      time: "Ayer",
      action: "Abrir chat",
    },
  ];
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
        <button onClick={() => setRead(items.map((item) => item.id))}>
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
                    notify(`${item.action} · demostración`);
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
                onChange={() =>
                  setPrefs({
                    ...prefs,
                    [key]: !prefs[key as keyof typeof prefs],
                  })
                }
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
function PublicProfilePanel() {
  const [profileSection, setProfileSection] = useState<"general" | "matches">(
    "general",
  );
  return (
    <section className="public-profile-panel">
      <article className="profile-cover">
        <div className="profile-identity">
          <img
            src="https://api.dicebear.com/9.x/thumbs/svg?seed=Tom&backgroundColor=2e1065,312e81,164e63"
            alt="Avatar de Tom"
          />
          <div>
            <span className="verified-badge">✓ STEAM VERIFICADO</span>
            <h2>Tom</h2>
            <p>Miembro desde agosto de 2026 · Lima, Perú</p>
            <div className="profile-tags">
              <b>Dueño</b>
              <b>Fundador</b>
              <b>Temporada 01</b>
            </div>
          </div>
        </div>
        <div className="profile-main-rating">
          <small>RATING COMPETITIVO</small>
          <strong>LVL 5</strong>
          <b>1,298 ELO</b>
          <span>#6 esta temporada</span>
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
        <a href="https://steamcommunity.com/" target="_blank" rel="noreferrer">
          Ver Steam ↗
        </a>
      </nav>
      {profileSection === "general" ? (
        <div className="profile-dashboard">
          <div className="profile-left">
            <div className="profile-kpis">
              <article>
                <small>PARTIDAS</small>
                <strong>19</strong>
                <span>12 ganadas · 7 perdidas</span>
              </article>
              <article>
                <small>WIN RATE</small>
                <strong>63%</strong>
                <span>+8% últimas 10</span>
              </article>
              <article>
                <small>HORAS CS2</small>
                <strong>1,284</strong>
                <span>Perfil público</span>
              </article>
              <article>
                <small>RACHA</small>
                <strong>3 W</strong>
                <span>Mejor: 6 victorias</span>
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
              {[
                ["Mirage", "72%", 72],
                ["Ancient", "65%", 65],
                ["Inferno", "58%", 58],
                ["Nuke", "50%", 50],
              ].map(([map, rate, width]) => (
                <div key={String(map)}>
                  <strong>{map}</strong>
                  <span>
                    <i style={{ width: `${width}%` }} />
                  </span>
                  <b>{rate}</b>
                </div>
              ))}
            </article>
          </div>
          <aside className="profile-reputation">
            <span>CONDUCTA</span>
            <div className="conduct-score">
              <strong>96</strong>
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
                <b title="Conducta excelente">96</b>
                <b title="Temporada 01">S1</b>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="public-match-list">
          {[
            ["Victoria", "Sala #176", "Mirage", "13 — 9", "+18"],
            ["Derrota", "Sala #169", "Ancient", "11 — 13", "−14"],
            ["Victoria", "Sala #161", "Nuke", "13 — 7", "+16"],
          ].map(([result, room, map, score, delta]) => (
            <article key={room}>
              <span
                className={result === "Victoria" ? "result-win" : "result-loss"}
              >
                {result}
              </span>
              <strong>{room}</strong>
              <small>{map}</small>
              <b>{score}</b>
              <em>{delta} ELO</em>
            </article>
          ))}
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
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">19 PARTIDAS</span>
          <h2>Historial competitivo</h2>
          <p>
            Resultados, mapas y variación de Elo registrados por nuestros
            servidores.
          </p>
        </div>
      </div>
      <div className="match-history">
        {[
          ["#176", "Victoria", "Mirage", "13 — 9", "+18"],
          ["#169", "Derrota", "Ancient", "11 — 13", "−14"],
          ["#161", "Victoria", "Nuke", "13 — 7", "+16"],
          ["#154", "Victoria", "Inferno", "13 — 11", "+12"],
        ].map(([id, result, map, score, elo]) => (
          <article key={id}>
            <span
              className={result === "Victoria" ? "result-win" : "result-loss"}
            >
              {result}
            </span>
            <strong>Sala {id}</strong>
            <span>{map}</span>
            <b>{score}</b>
            <em>{elo} ELO</em>
            <button>Ver demo</button>
          </article>
        ))}
      </div>
    </section>
  );
}
function RankingPanel() {
  const [balanceMode, setBalanceMode] = useState<"suggested" | "alternate">(
    "suggested",
  );
  const [seasonView, setSeasonView] = useState<"current" | "previous">(
    "current",
  );
  const suggested = {
    a: ["hoxhi", "Jericho", "k1ng", "neo", "ace"],
    b: ["melo", "Tom", "navi", "loko", "shiro"],
    aElo: 7341,
    bElo: 7328,
  };
  const alternate = {
    a: ["hoxhi", "Tom", "loko", "shiro", "ace"],
    b: ["melo", "Jericho", "k1ng", "navi", "neo"],
    aElo: 7396,
    bElo: 7273,
  };
  const balance = balanceMode === "suggested" ? suggested : alternate;
  const difference = Math.abs(balance.aElo - balance.bElo);
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">TEMPORADA 01</span>
          <h2>Ranking competitivo</h2>
          <p>
            El staff asigna el nivel inicial y, después, cada resultado
            confirmado actualiza el Elo automáticamente.
          </p>
        </div>
      </div>
      <div className="competitive-grid">
        <div className="rating-column">
          <article className="my-rating-card">
            <div className="rating-level">
              <small>NIVEL ACTUAL</small>
              <strong>5</strong>
            </div>
            <div className="rating-progress">
              <span>Tom · 1,298 ELO</span>
              <div>
                <i style={{ width: "66%" }} />
              </div>
              <small>52 ELO para alcanzar LVL 6</small>
            </div>
            <div className="season-record">
              <b>19</b>
              <small>PARTIDAS</small>
              <b>12–7</b>
              <small>VICTORIAS</small>
            </div>
          </article>
          <div className="ranking-large">
            {ranking
              .concat([
                ["05", "loko", "LVL 7", "1,472"],
                ["06", "Tom", "LVL 5", "1,298"],
              ])
              .map(([place, name, level, elo]) => (
                <div
                  key={`${place}-${name}`}
                  className={name === "Tom" ? "is-me" : ""}
                >
                  <span>#{place}</span>
                  <strong>{name}</strong>
                  <i>{level}</i>
                  <b>{elo} ELO</b>
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
              {difference} ELO de diferencia
            </span>
          </div>
          <div className="balanced-teams">
            {(["a", "b"] as const).map((side) => (
              <div key={side}>
                <span>EQUIPO {side.toUpperCase()}</span>
                <strong>
                  {side === "a" ? balance.aElo : balance.bElo} ELO
                </strong>
                {(side === "a" ? balance.a : balance.b).map((name, index) => (
                  <p key={name}>
                    <i>{index + 1}</i>
                    {name}
                    <small>LVL {10 - index - (side === "b" ? 1 : 0)}</small>
                  </p>
                ))}
              </div>
            ))}
          </div>
          <button
            className="balance-button"
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
            El sistema minimiza la diferencia total de Elo. Los dos jugadores
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
          <strong>Subes o bajas por tu Elo</strong>
          <span>Sin cambios manuales ocultos</span>
        </div>
      </div>
      <section className="season-center">
        <header>
          <div>
            <small>CENTRO DE TEMPORADA</small>
            <h3>
              {seasonView === "current"
                ? "Temporada 01 · Lima"
                : "Pretemporada · Fundadores"}
            </h3>
            <p>
              {seasonView === "current"
                ? "19 ago — 30 sep · Quedan 36 días"
                : "Finalizada · 18 ago 2026"}
            </p>
          </div>
          <div className="season-switch">
            <button
              className={seasonView === "current" ? "active" : ""}
              onClick={() => setSeasonView("current")}
            >
              Actual
            </button>
            <button
              className={seasonView === "previous" ? "active" : ""}
              onClick={() => setSeasonView("previous")}
            >
              Historial
            </button>
          </div>
        </header>
        {seasonView === "current" ? (
          <div className="season-body">
            <div className="season-track">
              <div>
                <span>Tu posición</span>
                <strong>#6</strong>
                <small>Top 18% · 1,298 ELO</small>
              </div>
              <div className="season-progress">
                <span>
                  <i style={{ width: "58%" }} />
                </span>
                <div>
                  <small>Partida 19</small>
                  <small>Meta: 30 partidas</small>
                </div>
              </div>
            </div>
            <div className="season-rewards">
              <article>
                <span>TOP 10</span>
                <b>Insignia Violeta</b>
                <small>Visible en perfil y salas</small>
              </article>
              <article>
                <span>TOP 3</span>
                <b>Podio de temporada</b>
                <small>Marco exclusivo permanente</small>
              </article>
              <article>
                <span>#1</span>
                <b>Campeón TENE</b>
                <small>Título histórico verificado</small>
              </article>
            </div>
            <p className="season-policy">
              Los premios son reconocimientos dentro de TENE, no apuestas ni
              dinero adicional. Al cerrar la temporada, el Elo se comprime
              parcialmente para conservar el nivel sin congelar el ranking.
            </p>
          </div>
        ) : (
          <div className="past-seasons">
            <article>
              <span>PRETEMPORADA</span>
              <strong>#1 hoxhi</strong>
              <b>1,804 ELO</b>
              <small>Tu posición: #9 · 1,241 ELO</small>
            </article>
            <article>
              <span>REINICIO CONTROLADO</span>
              <strong>−25% hacia 1,000</strong>
              <b>Sin borrar historial</b>
              <small>Calibración conservada por el staff</small>
            </article>
          </div>
        )}
      </section>
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

function EnhancedRoomFlow({
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
  const [draftPicks, setDraftPicks] = useState<string[]>([]);
  const [phase, setPhase] = useState<"draft" | "veto" | "match">("draft");
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
            <small>SANCIONES ACTIVAS</small>2
          </span>
          <span>
            <small>RETIROS EN REVISIÓN</small>4
          </span>
        </div>
      </div>
      <div className="staff-tabs">
        {[
          "Solicitudes",
          "Disputas",
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
      {staffTab === "Disputas" && <DisputeReview notify={notify} />}
      {staffTab === "Usuarios" && (
        <StaffTable
          title="Usuarios verificados"
          rows={[
            ["hoxhi", "LVL 10", "Dueño", "Activo"],
            ["Maddison", "LVL 8", "Jugador", "Activo"],
            ["Jericho", "LVL 7", "Mod", "Activo"],
            ["Rayo", "LVL 4", "Jugador", "Pendiente"],
          ]}
        />
      )}
      {staffTab === "Roles" && <RolesManager notify={notify} />}
      {staffTab === "Sanciones" && (
        <StaffTable
          title="Sanciones recientes"
          rows={[
            ["neo", "Abandono", "Deuda S/ 6", "Suspendido"],
            ["ace", "No-show", "Multa S/ 3", "Activo"],
            ["loko", "Chat tóxico", "Mute 24 h", "Activo"],
          ]}
        />
      )}
      {staffTab === "Auditoría" && (
        <StaffTable
          title="Registro administrativo"
          rows={[
            ["Tom", "Aprobó a Maddison", "LVL 8", "Hace 12 min"],
            ["Jericho", "Silenció a loko", "24 horas", "Hace 1 h"],
            ["Tom", "Ajuste contable", "+ S/ 10", "Ayer"],
          ]}
        />
      )}
    </section>
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
        status: string;
        nickname: string;
      }>;
    };
    const mapped = body.requests.map((item) => ({
      id: item.id,
      user: item.nickname,
      type: item.type === "deposit" ? "Recarga" : "Retiro",
      method: item.method === "yape" ? "Yape" : "Plin",
      amount: item.amountCents / 100,
      operation: item.operationCode ?? "—",
      status:
        item.status === "pending"
          ? "Pendiente"
          : item.status === "rejected"
            ? "Rechazada"
            : "Aprobada",
    }));
    setRequests(mapped);
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
                  {selected.user}
                </span>
                <span>
                  <small>ESTADO</small>
                  {selected.status}
                </span>
              </div>
              {selected.type === "Recarga" ? (
                <div className="receipt-demo">
                  <span>COMPROBANTE DEMO</span>
                  <strong>{selected.method}</strong>
                  <b>S/ {selected.amount.toFixed(2)}</b>
                  <small>Operación {selected.operation} · Hoy 10:24</small>
                </div>
              ) : (
                <div className="withdraw-checks">
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
                  Aprobar y registrar
                </button>
              </div>
            </article>
          )}
        </div>
      ) : (
        <LedgerPanel />
      )}
    </section>
  );
}
function LedgerPanel() {
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
      {[
        [
          "LED-9812",
          "Maddison",
          "Recarga",
          "PAY-2037",
          "—",
          "S/ 20.00",
          "S/ 26.00",
        ],
        [
          "LED-9811",
          "hoxhi",
          "Premio",
          "ROOM-176",
          "—",
          "S/ 10.00",
          "S/ 44.00",
        ],
        [
          "LED-9810",
          "hoxhi",
          "Entrada",
          "ROOM-176",
          "S/ 6.00",
          "—",
          "S/ 34.00",
        ],
        [
          "LED-9809",
          "neo",
          "Penalización",
          "SAN-104",
          "S/ 3.00",
          "—",
          "S/ 9.00",
        ],
        [
          "LED-9808",
          "Jericho",
          "Retiro",
          "PAY-2035",
          "S/ 20.00",
          "—",
          "S/ 18.00",
        ],
      ].map((row) => (
        <div key={row[0]}>
          {row.map((cell, index) => (
            <span
              className={index === 5 ? "positive" : ""}
              key={`${row[0]}-${index}`}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
