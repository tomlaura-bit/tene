"use client";

import { useState } from "react";

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

export default function Home() {
  const [steamOpen, setSteamOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [notice, setNotice] = useState("");
  const [screen, setScreen] = useState<Screen>("landing");
  const [balance, setBalance] = useState(24);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);

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
        <button className="steam-button" onClick={() => setSteamOpen(true)}>
          <span className="steam-dot">T</span>Iniciar sesión / Registrarme
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
  const validId = /^7656119\d{10}$/.test(steamId);
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
                    <input defaultValue="Tom Laura" autoComplete="name" />
                  </label>
                  <label>
                    Nickname
                    <input defaultValue="Tom" />
                  </label>
                </>
              )}
              <label>
                Correo electrónico
                <input
                  type="email"
                  defaultValue="tom@correo.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  defaultValue="demostracion"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
              </label>
              {mode === "register" && (
                <label>
                  Fecha de nacimiento
                  <input type="date" defaultValue="2000-08-25" />
                  <small>
                    Debes ser mayor de 18 años. En tu cumpleaños recibes 2 salas
                    gratis.
                  </small>
                </label>
              )}
            </div>
            <button
              className="primary-button w-full"
              onClick={() => (mode === "register" ? setStep(1) : complete())}
            >
              {mode === "register"
                ? "Siguiente: vincular Steam →"
                : "Iniciar sesión demo"}
            </button>
            <p className="auth-security">
              Demostración visual: no se envían ni almacenan credenciales.
            </p>
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
            <button className="steam-openid-button" onClick={() => setStep(2)}>
              <span className="steam-dot">S</span>
              <span>
                <b>Vincular con Steam</b>
                <small>Recomendado · evita errores de identidad</small>
              </span>
            </button>
            <div className="auth-divider">
              <span>o usa el SteamID64 escrito arriba</span>
            </div>
            <button
              className="primary-button w-full"
              disabled={!validId}
              onClick={() => setStep(2)}
            >
              Continuar con Steam
            </button>
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
  };
  compact?: boolean;
}) {
  return (
    <span className={`profile-anchor ${compact ? "compact" : ""}`} tabIndex={0}>
      <img
        src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.name}&backgroundColor=2e1065,312e81,164e63`}
        alt={`Avatar de ${profile.name}`}
      />
      <span className="profile-popover">
        <span className="profile-pop-head">
          <img
            src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.name}&backgroundColor=2e1065,312e81,164e63`}
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
}: {
  balance: number;
  setBalance: (value: number | ((value: number) => number)) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openRoom: () => void;
  goHome: () => void;
  notice: string;
  setNotice: (value: string) => void;
}) {
  const tabs = [
    "Inicio",
    "Cuenta",
    "Salas",
    "Wallet",
    "Beneficios",
    "Conducta",
    "Chat",
    "Historial",
    "Ranking",
    "Staff",
    "Finanzas",
  ];
  const [walletAction, setWalletAction] = useState<
    "deposit" | "withdraw" | null
  >(null);
  const [amount, setAmount] = useState("20");
  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };
  const applyWallet = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    if (walletAction === "deposit") {
      setBalance((current) => current + value);
      flash(`Recarga demo de S/ ${value.toFixed(2)} acreditada`);
    }
    if (walletAction === "withdraw" && value <= balance) {
      setBalance((current) => current - value);
      flash(`Retiro demo de S/ ${value.toFixed(2)} solicitado`);
    }
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
                      Cuenta: "◎",
                      Salas: "◫",
                      Wallet: "◈",
                      Beneficios: "★",
                      Conducta: "◆",
                      Chat: "#",
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
          />
        )}
        {activeTab === "Salas" && <RoomsPanel openRoom={openRoom} />}
        {activeTab === "Wallet" && (
          <WalletPanel
            balance={balance}
            action={(value) => setWalletAction(value)}
          />
        )}
        {activeTab === "Beneficios" && <BenefitsPanel notify={flash} />}
        {activeTab === "Conducta" && <ConductPanel notify={flash} />}
        {activeTab === "Chat" && <CommunityChat notify={flash} />}
        {activeTab === "Historial" && <HistoryPanel />}
        {activeTab === "Ranking" && <RankingPanel />}
        {activeTab === "Staff" && <StaffPanel notify={flash} />}
        {activeTab === "Finanzas" && <FinancePanel notify={flash} />}
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
            {walletAction === "deposit" ? (
              <div className="qr-placeholder">
                <strong>QR</strong>
                <span>El comprobante se validará antes de acreditar</span>
              </div>
            ) : (
              <p className="wallet-help">
                Disponible: S/ {balance.toFixed(2)} · Retiro mínimo S/ 10 ·
                Haber jugado una sala.
              </p>
            )}
            <button className="primary-button w-full" onClick={applyWallet}>
              Confirmar operación demo
            </button>
          </section>
        </div>
      )}
      {activeTab === "Cuenta" && <AccountPanel />}
      {notice && (
        <div className="toast">
          <span className="live-pulse" />
          {notice}
        </div>
      )}
    </main>
  );
}

function AccountPanel() {
  const [tab, setTab] = useState<"Cuenta" | "Steam">("Cuenta");
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
        <button>Partidas</button>
        <button>Conducta</button>
        <button>Movimientos</button>
        <button>Privacidad</button>
      </div>
      {tab === "Cuenta" ? (
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
          <div className="profile-fields">
            <label>
              Nombre completo
              <input defaultValue="Tom Laura" />
            </label>
            <label>
              Nickname
              <input defaultValue="Tom" />
            </label>
            <label>
              Correo electrónico
              <input type="email" defaultValue="tom@correo.com" />
            </label>
            <label>
              Fecha de nacimiento
              <input type="date" defaultValue="2000-08-25" />
            </label>
          </div>
          <button className="primary-button">Guardar cambios demo</button>
          <div className="password-section">
            <h3>Cambiar contraseña</h3>
            <div>
              <label>
                Contraseña actual
                <input type="password" placeholder="••••••••" />
              </label>
              <label>
                Nueva contraseña
                <input type="password" placeholder="••••••••" />
              </label>
              <label>
                Confirmar contraseña
                <input type="password" placeholder="••••••••" />
              </label>
            </div>
            <button className="secondary-button">Cambiar contraseña</button>
          </div>
        </div>
      ) : (
        <div className="account-surface">
          <div className="account-title">
            <div>
              <span className="verified-badge">✓ STEAM VINCULADO</span>
              <h2>Cuenta de Steam</h2>
              <p>Esta asociación protege tu identidad competitiva.</p>
            </div>
          </div>
          <div className="linked-steam">
            <img
              src="https://api.dicebear.com/9.x/thumbs/svg?seed=Maddison&backgroundColor=2e1065,312e81"
              alt="Avatar Steam"
            />
            <div>
              <strong>Maddison</strong>
              <span>76561198442891307</span>
              <small>Vinculada el 25 ago. 2026 · Validada por moderación</small>
            </div>
            <b>LVL 5</b>
          </div>
          <div className="steam-validation">
            <strong>✓ 2,341 horas de CS2 detectadas</strong>
            <span>Perfil y detalles de juego públicos · AppID 730</span>
            <button className="secondary-button">Volver a validar horas</button>
          </div>
          <p className="permanent-link">
            La vinculación es personal y no puede cambiarse sin revisión del
            staff.
          </p>
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
}: {
  balance: number;
  openRoom: () => void;
  setActiveTab: (tab: string) => void;
  wallet: (action: "deposit" | "withdraw") => void;
}) {
  return (
    <section className="dashboard-grid">
      <article className="verification-card">
        <div>
          <span className="verified-badge">✓ CUENTA VERIFICADA</span>
          <h2>Listo para competir</h2>
          <p>
            SteamID64 verificado · Perfil público · 1,284 horas de CS2 ·
            Revisión del staff completada.
          </p>
          <button className="text-action">Ver datos de verificación →</button>
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
          <button onClick={() => setActiveTab("Historial")}>Historial →</button>
        </div>
        <Transactions compact />
      </article>
    </section>
  );
}

function RoomsPanel({ openRoom }: { openRoom: () => void }) {
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">3 SALAS ABIERTAS</span>
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
        </div>
      </div>
      <div className="rooms-catalog">
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
      </div>
    </section>
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
  id: number;
  name: string;
  role: string;
  text: string;
  time: string;
  level: number;
};
function CommunityChat({ notify }: { notify: (message: string) => void }) {
  const [channel, setChannel] = useState("General");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      name: "hoxhi",
      role: "DUEÑO",
      text: "Sala nocturna abierta, entren rápido.",
      time: "11:32",
      level: 10,
    },
    {
      id: 2,
      name: "Jericho",
      role: "MOD",
      text: "Recuerden tener perfil y horas públicas antes de solicitar revisión.",
      time: "11:34",
      level: 7,
    },
    {
      id: 3,
      name: "Maddison",
      role: "SUB",
      text: "¿Alguien para una sala LVL 6–8?",
      time: "11:35",
      level: 8,
    },
    {
      id: 4,
      name: "rayo",
      role: "JUGADOR",
      text: "Me apunto, tengo saldo listo.",
      time: "11:36",
      level: 4,
    },
  ]);
  const send = () => {
    if (!text.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        name: "Tom",
        role: "DUEÑO",
        text: text.trim(),
        time: "Ahora",
        level: 5,
      },
    ]);
    setText("");
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
            {messages.map((message) => (
              <article key={message.id}>
                <PlayerProfile
                  profile={{
                    name: message.name,
                    level: message.level,
                    elo: 1298 + message.level * 20,
                    hours: 600 + message.level * 210,
                    conduct: "Buena",
                  }}
                  compact
                />
                <div>
                  <div className="message-meta">
                    <b className={`role-prefix ${message.role.toLowerCase()}`}>
                      {message.role}
                    </b>
                    <strong>{message.name}</strong>
                    <small>{message.time}</small>
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
                  <p>{message.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="chat-compose">
            <input
              value={text}
              maxLength={240}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && send()}
              placeholder={`Enviar mensaje a #${channel.toLowerCase()}…`}
            />
            <span>{text.length}/240</span>
            <button onClick={send}>Enviar</button>
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

function WalletPanel({
  balance,
  action,
}: {
  balance: number;
  action: (value: "deposit" | "withdraw") => void;
}) {
  return (
    <section className="section-panel">
      <div className="wallet-hero">
        <div>
          <span className="card-label">SALDO TOTAL</span>
          <strong>S/ {balance.toFixed(2)}</strong>
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
          <strong>S/ {balance.toFixed(2)}</strong>
          <p>Se puede usar o retirar.</p>
        </article>
        <article>
          <b>Saldo bloqueado</b>
          <strong>S/ 0.00</strong>
          <p>Reservado en salas activas.</p>
        </article>
        <article>
          <b>Deuda disciplinaria</b>
          <strong>S/ 0.00</strong>
          <p>Sin sanciones pendientes.</p>
        </article>
      </div>
      <div className="ledger-card">
        <div className="panel-title">
          <strong>Libro de movimientos</strong>
          <span>Todos los importes están en PEN</span>
        </div>
        <Transactions />
      </div>
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
  return (
    <section className="section-panel">
      <div className="section-intro">
        <div>
          <span className="verified-badge">TEMPORADA 01</span>
          <h2>Ranking competitivo</h2>
          <p>El Elo se actualiza después de cada resultado confirmado.</p>
        </div>
      </div>
      <div className="ranking-large">
        {ranking
          .concat([
            ["05", "loko", "LVL 7", "1,472"],
            ["06", "Tom", "LVL 5", "1,298"],
          ])
          .map(([place, name, level, elo]) => (
            <div key={`${place}-${name}`}>
              <span>#{place}</span>
              <strong>{name}</strong>
              <i>{level}</i>
              <b>{elo} ELO</b>
            </div>
          ))}
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
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedId, setSelectedId] = useState("u1");
  const [staffTab, setStaffTab] = useState("Solicitudes");
  const [notes, setNotes] = useState("");
  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ||
    candidates[0];
  const update = (values: Partial<Candidate>) =>
    setCandidates((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, ...values } : item,
      ),
    );
  const resolve = (status: "Verificado" | "Rechazado") => {
    update({ status });
    notify(
      `${selected.name}: solicitud ${status === "Verificado" ? "aprobada" : "rechazada"}`,
    );
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
        {["Solicitudes", "Disputas", "Usuarios", "Sanciones", "Auditoría"].map(
          (tab) => (
            <button
              className={staffTab === tab ? "active" : ""}
              onClick={() => setStaffTab(tab)}
              key={tab}
            >
              {tab}
            </button>
          ),
        )}
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
              <i className={`request-status ${selected.status.toLowerCase()}`}>
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
  const [requests, setRequests] = useState(seedPayments);
  const [selectedId, setSelectedId] = useState(seedPayments[0].id);
  const [financeTab, setFinanceTab] = useState("Pendientes");
  const selected =
    requests.find((item) => item.id === selectedId) || requests[0];
  const resolve = (status: "Aprobada" | "Rechazada") => {
    setRequests((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, status } : item,
      ),
    );
    notify(`${selected.id}: operación ${status.toLowerCase()}`);
  };
  const visible =
    financeTab === "Pendientes"
      ? requests.filter((item) => item.status === "Pendiente")
      : requests.filter((item) => item.status !== "Pendiente");
  return (
    <section className="finance-panel">
      <div className="staff-top">
        <div>
          <span className="staff-role">CONTROL FINANCIERO · DEMO</span>
          <h2>Wallet y conciliación</h2>
          <p>
            Cada cambio genera un movimiento contable. Los administradores
            aprueban solicitudes, pero no editan saldos directamente.
          </p>
        </div>
        <div className="staff-kpis">
          <span>
            <small>SALDO DE USUARIOS</small>S/ 428
          </span>
          <span>
            <small>FONDOS BLOQUEADOS</small>S/ 84
          </span>
          <span>
            <small>COMISIÓN HOY</small>S/ 37
          </span>
        </div>
      </div>
      <div className="finance-summary">
        <article>
          <span>Entradas de hoy</span>
          <strong>+ S/ 312.00</strong>
          <small>21 recargas confirmadas</small>
        </article>
        <article>
          <span>Salidas de hoy</span>
          <strong>− S/ 180.00</strong>
          <small>9 retiros procesados</small>
        </article>
        <article>
          <span>Cuadre esperado</span>
          <strong>S/ 132.00</strong>
          <small className="reconciled">✓ Conciliado</small>
        </article>
        <article>
          <span>Fondos en revisión</span>
          <strong>S/ 82.00</strong>
          <small>4 solicitudes pendientes</small>
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
          <article className="payment-review">
            <div className="payment-review-head">
              <div>
                <span className={`payment-type ${selected.type.toLowerCase()}`}>
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
