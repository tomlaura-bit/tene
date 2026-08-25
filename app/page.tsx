"use client";

import { useState } from "react";

const players = [
  { name: "hoxhi", level: 10, tone: "from-fuchsia-500 to-violet-500" },
  { name: "Tom", level: 8, tone: "from-cyan-400 to-blue-500" },
  { name: "Jericho", level: 7, tone: "from-amber-400 to-orange-500" },
  { name: "k1ng", level: 6, tone: "from-emerald-400 to-teal-500" },
];

const ranking = [
  ["01", "hoxhi", "LVL 10", "1,842"], ["02", "melo", "LVL 10", "1,791"],
  ["03", "Tom", "LVL 8", "1,626"], ["04", "k1ng", "LVL 7", "1,514"],
];

const mapPool = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust II", "Train"];
const draftPool = [
  { name: "melo", level: 9 }, { name: "Tom", level: 8 }, { name: "Jericho", level: 7 }, { name: "k1ng", level: 6 },
  { name: "navi", level: 6 }, { name: "loko", level: 5 }, { name: "shiro", level: 4 }, { name: "neo", level: 3 },
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
    setNotice("Cuenta demo conectada · Perfil verificado");
    window.setTimeout(() => setNotice(""), 3500);
  }

  if (screen === "dashboard") return <EnhancedDashboard balance={balance} setBalance={setBalance} activeTab={activeTab} setActiveTab={setActiveTab} openRoom={() => setScreen("room")} goHome={() => setScreen("landing")} notice={notice} setNotice={setNotice} />;
  if (screen === "room") return <EnhancedRoomFlow balance={balance} bannedMaps={bannedMaps} setBannedMaps={setBannedMaps} onReserve={() => { if (!joined) { setJoined(true); setBalance((value) => value - 6); setNotice("S/ 6 bloqueados · Ya estás dentro de la sala"); window.setTimeout(() => setNotice(""), 3500); } }} joined={joined} goBack={() => setScreen("dashboard")} notice={notice} />;

  return (
    <main className="min-h-screen overflow-hidden bg-[#09080d] text-white">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10">
        <a href="#" className="flex items-center gap-3" aria-label="Tene inicio"><span className="brand-mark">T</span><span className="text-lg font-black tracking-[0.22em]">TENE</span></a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/55 md:flex"><a className="text-white" href="#salas">Salas</a><a className="transition hover:text-white" href="#ranking">Ranking</a><a className="transition hover:text-white" href="#como-funciona">Cómo jugar</a></nav>
        <button className="steam-button" onClick={() => setSteamOpen(true)}><span className="steam-dot">S</span>Entrar con Steam</button>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1440px] gap-12 px-5 pb-16 pt-10 md:px-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <div className="eyebrow"><span /> CS2 competitivo · Perú</div>
          <h1 className="mt-6 text-[clamp(3.4rem,7vw,7.2rem)] font-black leading-[0.84] tracking-[-0.075em]">JUEGA.<br /><span className="gradient-text">COMPITE.</span><br />GANA.</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/55 md:text-lg">Salas privadas 5v5 con servidores peruanos, equipos balanceados y premios reales. Tu nivel decide el reto; tu juego, el resultado.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4"><a className="primary-button" href="#salas">Ver salas disponibles <span>↗</span></a><div className="flex items-center gap-3 text-sm text-white/50"><span className="live-pulse" /> 186 jugadores conectados</div></div>
          <div className="mt-10 flex gap-8 border-t border-white/8 pt-6"><div><strong className="block text-xl">S/ 6</strong><span className="text-xs text-white/40">entrada</span></div><div><strong className="block text-xl">S/ 10</strong><span className="text-xs text-white/40">por ganador</span></div><div><strong className="block text-xl">5v5</strong><span className="text-xs text-white/40">competitivo</span></div></div>
        </div>

        <div id="salas" className="match-shell">
          <div className="match-topbar"><div><span className="status-pill"><i /> FORMANDO EQUIPOS</span><h2 className="mt-3 text-2xl font-bold tracking-tight">Sala Violeta #184</h2></div><div className="text-right"><span className="block text-xs text-white/35">ENTRADA</span><strong className="text-2xl text-violet-300">S/ 6.00</strong></div></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            {players.map((player, index) => <div key={player.name} className="player-card"><div className={`avatar bg-gradient-to-br ${player.tone}`}>{player.name[0].toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="truncate">{player.name}</strong>{index < 2 && <span className="captain">CAP</span>}</div><span className="text-xs text-white/35">{index < 2 ? "Capitán" : "Jugador verificado"}</span></div><span className="level">LVL {player.level}</span></div>)}
            {joined && <div className="player-card ring-1 ring-violet-400/40"><div className="avatar bg-gradient-to-br from-violet-500 to-fuchsia-500">T</div><div className="min-w-0 flex-1"><strong className="block truncate">Tu cuenta</strong><span className="text-xs text-violet-300">Puesto reservado</span></div><span className="level">LVL 5</span></div>}
            {Array.from({ length: joined ? 5 : 6 }, (_, i) => <div key={i} className="empty-slot"><span>+</span> Esperando jugador</div>)}
          </div>
          <div className="match-footer"><div><span className="text-xs text-white/35">JUGADORES</span><strong className="ml-3">{joined ? 5 : 4} / 10</strong></div><div className="progress"><span style={{ width: joined ? "50%" : "40%" }} /></div><button disabled={joined} onClick={joinRoom} className="join-button disabled:cursor-default disabled:opacity-50">{joined ? "Ya estás dentro" : "Unirme por S/ 6"}</button></div>
        </div>
      </section>

      <section id="como-funciona" className="relative z-10 border-y border-white/7 bg-white/[0.018]"><div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px md:grid-cols-4">{[["01","Verifica tu nivel","Conecta Steam y deja que nuestro staff valide tu cuenta."],["02","Recarga tu saldo","Agrega saldo y reserva tu lugar en una sala."],["03","Draft y veto","Capitanes balancean equipos y eligen el mapa."],["04","Juega y gana","Los ganadores reciben S/ 10 directo a su saldo."]].map(([number,title,copy]) => <article key={number} className="border-white/7 p-6 md:border-l md:p-8"><span className="font-mono text-xs text-violet-400">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/38">{copy}</p></article>)}</div></section>

      <section id="ranking" className="relative z-10 mx-auto grid max-w-[1440px] gap-10 px-5 py-20 md:px-10 lg:grid-cols-[.7fr_1.3fr]">
        <div><div className="eyebrow"><span /> Temporada 01</div><h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">El nivel se<br />demuestra jugando.</h2><p className="mt-5 max-w-md leading-7 text-white/45">Cada partida suma historial, reputación y Elo. El staff calibra tu nivel inicial; después, tu rendimiento habla por ti.</p></div>
        <div className="ranking-card"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><strong>Ranking competitivo</strong><span className="text-xs text-white/35">ACTUALIZADO HOY</span></div>{ranking.map(([place,name,level,elo]) => <div className="ranking-row" key={place}><span className="font-mono text-violet-300">{place}</span><strong>{name}</strong><span className="level">{level}</span><span className="ml-auto font-mono text-sm">{elo} ELO</span></div>)}</div>
      </section>

      <footer className="relative z-10 border-t border-white/7 px-5 py-8 text-center text-xs text-white/30">TENE es una plataforma independiente y no está afiliada a Valve Corporation. Solo para mayores de 18 años.</footer>

      {steamOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSteamOpen(false)}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="steam-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" aria-label="Cerrar" onClick={() => setSteamOpen(false)}>×</button><span className="steam-logo-large">S</span><p className="eyebrow justify-center">VERIFICACIÓN OFICIAL</p><h2 id="steam-title" className="mt-4 text-2xl font-black">Conecta tu cuenta de Steam</h2><p className="mt-3 text-sm leading-6 text-white/45">Obtendremos tu SteamID64 y comprobaremos que tu perfil, biblioteca y horas de CS2 sean públicos.</p><button className="primary-button mt-6 w-full" onClick={enterDemo}>Continuar con Steam</button><p className="mt-4 text-[11px] text-white/25">TENE nunca recibe ni almacena tu contraseña de Steam.</p></section></div>}
      {notice && <div className="toast"><span className="live-pulse" />{notice}</div>}
    </main>
  );
}

function Dashboard({ balance, activeTab, setActiveTab, openRoom, goHome, notice }: { balance: number; activeTab: string; setActiveTab: (tab: string) => void; openRoom: () => void; goHome: () => void; notice: string }) {
  const tabs = ["Inicio", "Salas", "Wallet", "Historial", "Ranking"];
  return <main className="app-bg min-h-screen text-white">
    <aside className="app-sidebar"><button className="flex items-center gap-3" onClick={goHome}><span className="brand-mark">T</span><span className="font-black tracking-[.2em]">TENE</span></button><nav>{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}><span>{({ Inicio: "⌂", Salas: "◫", Wallet: "◈", Historial: "↺", Ranking: "⌁" } as Record<string,string>)[tab]}</span>{tab}</button>)}</nav><div className="sidebar-bottom"><span className="avatar small bg-gradient-to-br from-violet-500 to-fuchsia-500">T</span><div><strong>Tom</strong><small>LVL 5 · Verificado</small></div></div></aside>
    <div className="app-content">
      <header className="app-header"><div><p className="eyebrow"><span /> PANEL DEL JUGADOR</p><h1>{activeTab === "Inicio" ? "Buenos días, Tom" : activeTab}</h1></div><div className="header-actions"><button className="balance-chip"><small>SALDO DISPONIBLE</small><strong>S/ {balance.toFixed(2)}</strong></button><button className="icon-button">●</button></div></header>
      <section className="dashboard-grid">
        <article className="verification-card"><div><span className="verified-badge">✓ CUENTA VERIFICADA</span><h2>Listo para competir</h2><p>Tu SteamID64, perfil público y 1,284 horas de CS2 fueron revisados por el staff.</p></div><div className="level-orbit"><small>NIVEL</small><strong>5</strong><span>1,298 ELO</span></div></article>
        <article className="wallet-card"><div className="card-label">TU WALLET</div><strong className="wallet-total">S/ {balance.toFixed(2)}</strong><div className="wallet-split"><span><small>Disponible</small>S/ {balance.toFixed(2)}</span><span><small>Bloqueado</small>S/ 0.00</span></div><div className="wallet-actions"><button onClick={() => setActiveTab("Wallet")}>＋ Recargar</button><button onClick={() => setActiveTab("Wallet")}>↗ Retirar</button></div></article>
        <article className="rooms-panel"><div className="panel-title"><div><span className="live-pulse" /><strong>Salas disponibles</strong></div><button onClick={() => setActiveTab("Salas")}>Ver todas →</button></div><RoomRow name="Sala Violeta #184" players="4 / 10" average="LVL 6.8" openRoom={openRoom} /><RoomRow name="Sala Nocturna #183" players="8 / 10" average="LVL 8.2" openRoom={openRoom} /><RoomRow name="Sala Base #182" players="2 / 10" average="LVL 3.5" openRoom={openRoom} /></article>
        <article className="stats-card"><div className="card-label">TU TEMPORADA</div><div className="stat-big"><strong>68%</strong><span>WIN RATE</span></div><div className="stats-line"><span><small>Partidas</small>19</span><span><small>Victorias</small>13</span><span><small>Racha</small>W3</span></div></article>
        <article className="activity-card"><div className="panel-title"><strong>Últimos movimientos</strong><button onClick={() => setActiveTab("Historial")}>Historial →</button></div>{[["Premio · Sala #176","+ S/ 10.00","win"],["Entrada · Sala #176","− S/ 6.00",""],["Recarga Yape","+ S/ 20.00","win"]].map(([label,value,tone]) => <div className="activity-row" key={label}><span className={tone ? "positive-dot" : "neutral-dot"} /><div><strong>{label}</strong><small>24 ago · 22:14</small></div><b className={tone ? "positive" : ""}>{value}</b></div>)}</article>
      </section>
    </div>{notice && <div className="toast"><span className="live-pulse" />{notice}</div>}
  </main>;
}

function RoomRow({ name, players: count, average, openRoom }: { name: string; players: string; average: string; openRoom: () => void }) {
  return <button className="room-row" onClick={openRoom}><span className="room-symbol">T</span><span><strong>{name}</strong><small>Entrada S/ 6 · Premio S/ 10</small></span><span className="room-metric"><small>JUGADORES</small>{count}</span><span className="room-metric"><small>PROMEDIO</small>{average}</span><b>Entrar →</b></button>;
}

function RoomFlow({ balance, bannedMaps, setBannedMaps, onReserve, joined, goBack, notice }: { balance: number; bannedMaps: string[]; setBannedMaps: (maps: string[]) => void; onReserve: () => void; joined: boolean; goBack: () => void; notice: string }) {
  const remaining = mapPool.filter((map) => !bannedMaps.includes(map));
  const currentCaptain = bannedMaps.length % 2 === 0 ? "Capitán A" : "Capitán B";
  return <main className="app-bg room-screen min-h-screen text-white"><header className="room-header"><button onClick={goBack}>← Volver a salas</button><div><span className="status-pill"><i /> SALA ABIERTA</span><strong>Sala Violeta #184</strong></div><div className="room-balance"><small>SALDO</small>S/ {balance.toFixed(2)}</div></header>
    <section className="room-layout"><div className="room-main"><div className="room-stage"><div><p className="eyebrow"><span /> ETAPA 1 DE 3</p><h1>{joined ? "Draft y veto" : "Reserva tu puesto"}</h1><p>{joined ? "La sala está en modo demostración. Prueba el veto de mapas para ver cómo funcionará cuando se complete." : "El importe queda bloqueado al entrar y solo se liquida cuando termina la partida."}</p></div><div className="room-count"><strong>{joined ? "5" : "4"}/10</strong><span>jugadores</span></div></div>
      {!joined ? <article className="reserve-card"><div className="price-breakdown"><span><small>Entrada total</small><strong>S/ 6.00</strong></span><span><small>Fondo de premio</small><strong>S/ 5.00</strong></span><span><small>Servicio</small><strong>S/ 1.00</strong></span></div><button className="primary-button" onClick={onReserve}>Confirmar y entrar por S/ 6</button><p>Cuenta verificada · Saldo suficiente · Sin sanciones activas</p></article> : <VetoBoard bannedMaps={bannedMaps} remaining={remaining} currentCaptain={currentCaptain} ban={(map) => remaining.length > 1 && setBannedMaps([...bannedMaps, map])} reset={() => setBannedMaps([])} />}
    </div><aside className="room-side"><div className="side-title"><strong>Jugadores</strong><span>{joined ? 5 : 4}/10</span></div>{[...players, ...(joined ? [{ name: "Tom", level: 5, tone: "from-violet-500 to-fuchsia-500" }] : [])].map((p,i) => <div className="side-player" key={`${p.name}-${i}`}><span className={`avatar small bg-gradient-to-br ${p.tone}`}>{p.name[0]}</span><div><strong>{p.name}</strong><small>{i < 2 ? "Capitán provisional" : "Verificado"}</small></div><span className="level">LVL {p.level}</span></div>)}{Array.from({length: joined ? 5 : 6},(_,i)=><div className="side-empty" key={i}>Puesto disponible</div>)}</aside></section>{notice && <div className="toast"><span className="live-pulse" />{notice}</div>}
  </main>;
}

function VetoBoard({ bannedMaps, remaining, currentCaptain, ban, reset }: { bannedMaps: string[]; remaining: string[]; currentCaptain: string; ban: (map: string) => void; reset: () => void }) {
  return <article className="veto-card"><div className="veto-head"><div><small>TURNO ACTUAL</small><strong>{remaining.length === 1 ? "Mapa definido" : `${currentCaptain} banea`}</strong></div><button onClick={reset}>Reiniciar demo</button></div><div className="maps-grid">{mapPool.map((map) => { const banned = bannedMaps.includes(map); const selected = remaining.length === 1 && remaining[0] === map; return <button key={map} disabled={banned || selected} onClick={() => ban(map)} className={`${banned ? "banned" : ""} ${selected ? "selected" : ""}`}><span>{map.slice(0,2).toUpperCase()}</span><strong>{map}</strong><small>{banned ? "BANEADO" : selected ? "MAPA ELEGIDO" : "BANEAR"}</small></button>; })}</div><div className="veto-log"><span>Veto: {bannedMaps.length ? bannedMaps.join(" → ") : "Aún no hay mapas baneados"}</span>{remaining.length === 1 && <strong>{remaining[0]} · El otro capitán elige CT o T</strong>}</div></article>;
}

function EnhancedDashboard({ balance, setBalance, activeTab, setActiveTab, openRoom, goHome, notice, setNotice }: { balance: number; setBalance: (value: number | ((value: number) => number)) => void; activeTab: string; setActiveTab: (tab: string) => void; openRoom: () => void; goHome: () => void; notice: string; setNotice: (value: string) => void }) {
  const tabs = ["Inicio", "Salas", "Wallet", "Historial", "Ranking"];
  const [walletAction, setWalletAction] = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("20");
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3500); };
  const applyWallet = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    if (walletAction === "deposit") { setBalance((current) => current + value); flash(`Recarga demo de S/ ${value.toFixed(2)} acreditada`); }
    if (walletAction === "withdraw" && value <= balance) { setBalance((current) => current - value); flash(`Retiro demo de S/ ${value.toFixed(2)} solicitado`); }
    setWalletAction(null);
  };
  return <main className="app-bg min-h-screen text-white">
    <aside className="app-sidebar"><button className="flex items-center gap-3" onClick={goHome}><span className="brand-mark">T</span><span className="font-black tracking-[.2em]">TENE</span></button><nav>{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}><span>{({ Inicio: "⌂", Salas: "◫", Wallet: "◈", Historial: "↺", Ranking: "⌁" } as Record<string,string>)[tab]}</span>{tab}</button>)}</nav><div className="sidebar-bottom"><span className="avatar small bg-gradient-to-br from-violet-500 to-fuchsia-500">T</span><div><strong>Tom</strong><small>LVL 5 · Verificado</small></div></div></aside>
    <div className="app-content"><header className="app-header"><div><p className="eyebrow"><span /> PANEL DEL JUGADOR</p><h1>{activeTab === "Inicio" ? "Buenos días, Tom" : activeTab}</h1></div><div className="header-actions"><button className="balance-chip" onClick={() => setActiveTab("Wallet")}><small>SALDO DISPONIBLE</small><strong>S/ {balance.toFixed(2)}</strong></button><button className="icon-button">●</button></div></header>
      {activeTab === "Inicio" && <HomePanel balance={balance} openRoom={openRoom} setActiveTab={setActiveTab} wallet={(action) => setWalletAction(action)} />}
      {activeTab === "Salas" && <RoomsPanel openRoom={openRoom} />}
      {activeTab === "Wallet" && <WalletPanel balance={balance} action={(value) => setWalletAction(value)} />}
      {activeTab === "Historial" && <HistoryPanel />}
      {activeTab === "Ranking" && <RankingPanel />}
    </div>
    {walletAction && <div className="modal-backdrop" onMouseDown={() => setWalletAction(null)}><section className="wallet-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setWalletAction(null)}>×</button><span className="wallet-modal-icon">{walletAction === "deposit" ? "+" : "↗"}</span><p className="card-label">{walletAction === "deposit" ? "RECARGA CON YAPE / PLIN" : "RETIRO DE SALDO"}</p><h2>{walletAction === "deposit" ? "Agregar saldo" : "Solicitar retiro"}</h2><label>Monto en soles<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>{walletAction === "deposit" ? <div className="qr-placeholder"><strong>QR</strong><span>El comprobante se validará antes de acreditar</span></div> : <p className="wallet-help">Disponible: S/ {balance.toFixed(2)} · Retiro mínimo S/ 10 · Haber jugado una sala.</p>}<button className="primary-button w-full" onClick={applyWallet}>Confirmar operación demo</button></section></div>}
    {notice && <div className="toast"><span className="live-pulse" />{notice}</div>}
  </main>;
}

function HomePanel({ balance, openRoom, setActiveTab, wallet }: { balance: number; openRoom: () => void; setActiveTab: (tab: string) => void; wallet: (action: "deposit" | "withdraw") => void }) {
  return <section className="dashboard-grid"><article className="verification-card"><div><span className="verified-badge">✓ CUENTA VERIFICADA</span><h2>Listo para competir</h2><p>SteamID64 verificado · Perfil público · 1,284 horas de CS2 · Revisión del staff completada.</p><button className="text-action">Ver datos de verificación →</button></div><div className="level-orbit"><small>NIVEL</small><strong>5</strong><span>1,298 ELO</span></div></article><article className="wallet-card"><div className="card-label">TU WALLET</div><strong className="wallet-total">S/ {balance.toFixed(2)}</strong><div className="wallet-split"><span><small>Disponible</small>S/ {balance.toFixed(2)}</span><span><small>Bloqueado</small>S/ 0.00</span></div><div className="wallet-actions"><button onClick={() => wallet("deposit")}>＋ Recargar</button><button onClick={() => wallet("withdraw")}>↗ Retirar</button></div></article><article className="rooms-panel"><div className="panel-title"><div><span className="live-pulse" /><strong>Salas disponibles</strong></div><button onClick={() => setActiveTab("Salas")}>Ver todas →</button></div><RoomRow name="Sala Violeta #184" players="4 / 10" average="LVL 6.8" openRoom={openRoom} /><RoomRow name="Sala Nocturna #183" players="8 / 10" average="LVL 8.2" openRoom={openRoom} /><RoomRow name="Sala Base #182" players="2 / 10" average="LVL 3.5" openRoom={openRoom} /></article><article className="stats-card"><div className="card-label">TU TEMPORADA</div><div className="stat-big"><strong>68%</strong><span>WIN RATE</span></div><div className="stats-line"><span><small>Partidas</small>19</span><span><small>Victorias</small>13</span><span><small>Racha</small>W3</span></div></article><article className="activity-card"><div className="panel-title"><strong>Últimos movimientos</strong><button onClick={() => setActiveTab("Historial")}>Historial →</button></div><Transactions compact /></article></section>;
}

function RoomsPanel({ openRoom }: { openRoom: () => void }) { return <section className="section-panel"><div className="section-intro"><div><span className="verified-badge">3 SALAS ABIERTAS</span><h2>Elige dónde competir</h2><p>Tu saldo se bloquea al reservar el puesto. Todos los niveles pueden jugar; el draft mantiene el balance.</p></div><div className="filter-pills"><button className="active">Todas</button><button>LVL 1–5</button><button>LVL 6–10</button></div></div><div className="rooms-catalog"><RoomRow name="Sala Violeta #184" players="4 / 10" average="LVL 6.8" openRoom={openRoom} /><RoomRow name="Sala Nocturna #183" players="8 / 10" average="LVL 8.2" openRoom={openRoom} /><RoomRow name="Sala Base #182" players="2 / 10" average="LVL 3.5" openRoom={openRoom} /></div></section>; }
function WalletPanel({ balance, action }: { balance: number; action: (value: "deposit" | "withdraw") => void }) { return <section className="section-panel"><div className="wallet-hero"><div><span className="card-label">SALDO TOTAL</span><strong>S/ {balance.toFixed(2)}</strong><p>Disponible para salas o retiro</p></div><div><button className="primary-button" onClick={() => action("deposit")}>＋ Recargar</button><button className="secondary-button" onClick={() => action("withdraw")}>↗ Retirar</button></div></div><div className="wallet-rules"><article><b>Saldo disponible</b><strong>S/ {balance.toFixed(2)}</strong><p>Se puede usar o retirar.</p></article><article><b>Saldo bloqueado</b><strong>S/ 0.00</strong><p>Reservado en salas activas.</p></article><article><b>Deuda disciplinaria</b><strong>S/ 0.00</strong><p>Sin sanciones pendientes.</p></article></div><div className="ledger-card"><div className="panel-title"><strong>Libro de movimientos</strong><span>Todos los importes están en PEN</span></div><Transactions /></div></section>; }
function HistoryPanel() { return <section className="section-panel"><div className="section-intro"><div><span className="verified-badge">19 PARTIDAS</span><h2>Historial competitivo</h2><p>Resultados, mapas y variación de Elo registrados por nuestros servidores.</p></div></div><div className="match-history">{[["#176","Victoria","Mirage","13 — 9","+18"],["#169","Derrota","Ancient","11 — 13","−14"],["#161","Victoria","Nuke","13 — 7","+16"],["#154","Victoria","Inferno","13 — 11","+12"]].map(([id,result,map,score,elo]) => <article key={id}><span className={result === "Victoria" ? "result-win" : "result-loss"}>{result}</span><strong>Sala {id}</strong><span>{map}</span><b>{score}</b><em>{elo} ELO</em><button>Ver demo</button></article>)}</div></section>; }
function RankingPanel() { return <section className="section-panel"><div className="section-intro"><div><span className="verified-badge">TEMPORADA 01</span><h2>Ranking competitivo</h2><p>El Elo se actualiza después de cada resultado confirmado.</p></div></div><div className="ranking-large">{ranking.concat([["05","loko","LVL 7","1,472"],["06","Tom","LVL 5","1,298"]]).map(([place,name,level,elo]) => <div key={`${place}-${name}`}><span>#{place}</span><strong>{name}</strong><i>{level}</i><b>{elo} ELO</b></div>)}</div></section>; }
function Transactions({ compact = false }: { compact?: boolean }) { const rows = [["Premio · Sala #176","24 ago · 22:14","+ S/ 10.00","win"],["Entrada · Sala #176","24 ago · 21:32","− S/ 6.00",""],["Recarga Yape","24 ago · 20:10","+ S/ 20.00","win"],["Entrada · Sala #169","23 ago · 23:45","− S/ 6.00",""]]; return <>{rows.slice(0,compact ? 3 : 4).map(([label,date,value,tone]) => <div className="activity-row" key={`${label}-${date}`}><span className={tone ? "positive-dot" : "neutral-dot"} /><div><strong>{label}</strong><small>{date}</small></div><b className={tone ? "positive" : ""}>{value}</b></div>)}</>; }

function EnhancedRoomFlow({ balance, bannedMaps, setBannedMaps, onReserve, joined, goBack, notice }: { balance: number; bannedMaps: string[]; setBannedMaps: (maps: string[]) => void; onReserve: () => void; joined: boolean; goBack: () => void; notice: string }) {
  const [draftPicks, setDraftPicks] = useState<string[]>([]); const [phase, setPhase] = useState<"draft" | "veto">("draft");
  const sequence = ["A","B","B","A","A","B","B","A"]; const remainingMaps = mapPool.filter((map) => !bannedMaps.includes(map)); const currentCaptain = bannedMaps.length % 2 === 0 ? "Capitán A" : "Capitán B";
  const teamA = ["hoxhi", ...draftPicks.filter((_, index) => sequence[index] === "A")]; const teamB = ["melo", ...draftPicks.filter((_, index) => sequence[index] === "B")];
  return <main className="app-bg room-screen min-h-screen text-white"><header className="room-header"><button onClick={goBack}>← Volver a salas</button><div><span className="status-pill"><i /> SALA ABIERTA</span><strong>Sala Violeta #184</strong></div><div className="room-balance"><small>SALDO</small>S/ {balance.toFixed(2)}</div></header><section className="room-layout"><div className="room-main"><div className="room-stage"><div><p className="eyebrow"><span /> {joined ? (phase === "draft" ? "ETAPA 2 DE 3" : "ETAPA 3 DE 3") : "ETAPA 1 DE 3"}</p><h1>{!joined ? "Reserva tu puesto" : phase === "draft" ? "Draft de equipos" : "Veto de mapas"}</h1><p>{!joined ? "El importe queda bloqueado al entrar y solo se liquida cuando termina la partida." : phase === "draft" ? "Los dos jugadores de mayor nivel son capitanes. La secuencia es A–B–B–A–A–B–B–A." : "Los capitanes banean alternadamente hasta dejar un mapa."}</p></div><div className="room-count"><strong>{joined ? "10" : "4"}/10</strong><span>jugadores</span></div></div>{!joined ? <article className="reserve-card"><div className="price-breakdown"><span><small>Entrada total</small><strong>S/ 6.00</strong></span><span><small>Fondo de premio</small><strong>S/ 5.00</strong></span><span><small>Servicio</small><strong>S/ 1.00</strong></span></div><button className="primary-button" onClick={onReserve}>Confirmar y entrar por S/ 6</button><p>Cuenta verificada · Saldo suficiente · Sin sanciones activas</p></article> : phase === "draft" ? <DraftBoard picks={draftPicks} teamA={teamA} teamB={teamB} pick={(name) => setDraftPicks([...draftPicks,name])} current={sequence[draftPicks.length]} next={() => setPhase("veto")} reset={() => setDraftPicks([])} /> : <VetoBoard bannedMaps={bannedMaps} remaining={remainingMaps} currentCaptain={currentCaptain} ban={(map) => remainingMaps.length > 1 && setBannedMaps([...bannedMaps,map])} reset={() => setBannedMaps([])} />}</div><aside className="room-side"><div className="side-title"><strong>{joined ? "Equipos" : "Jugadores"}</strong><span>{joined ? "5v5" : "4/10"}</span></div>{joined ? <><TeamList title="EQUIPO A" names={teamA} /><TeamList title="EQUIPO B" names={teamB} /></> : players.map((p,i) => <div className="side-player" key={`${p.name}-${i}`}><span className={`avatar small bg-gradient-to-br ${p.tone}`}>{p.name[0]}</span><div><strong>{p.name}</strong><small>{i < 2 ? "Capitán provisional" : "Verificado"}</small></div><span className="level">LVL {p.level}</span></div>)}</aside></section>{notice && <div className="toast"><span className="live-pulse" />{notice}</div>}</main>;
}
function DraftBoard({ picks, teamA, teamB, pick, current, next, reset }: { picks: string[]; teamA: string[]; teamB: string[]; pick: (name: string) => void; current: string; next: () => void; reset: () => void }) { return <article className="draft-board"><div className="veto-head"><div><small>TURNO ACTUAL</small><strong>{picks.length === 8 ? "Equipos completos" : `Capitán ${current} elige`}</strong></div><button onClick={reset}>Reiniciar draft</button></div><div className="draft-columns"><div><span className="team-label a">EQUIPO A · {teamA.reduce((sum,name) => sum + (name === "hoxhi" ? 10 : draftPool.find((p) => p.name === name)?.level || 0),0)} PTS</span>{teamA.map((name) => <b key={name}>{name}</b>)}</div><div className="draft-pool"><small>JUGADORES DISPONIBLES</small>{draftPool.filter((player) => !picks.includes(player.name) && player.name !== "melo").map((player) => <button key={player.name} onClick={() => pick(player.name)}><span>{player.name[0]}</span><b>{player.name}</b><i>LVL {player.level}</i></button>)}{picks.length === 8 && <button className="primary-button draft-next" onClick={next}>Continuar al veto →</button>}</div><div><span className="team-label b">EQUIPO B · {teamB.reduce((sum,name) => sum + (name === "melo" ? 9 : draftPool.find((p) => p.name === name)?.level || 0),0)} PTS</span>{teamB.map((name) => <b key={name}>{name}</b>)}</div></div></article>; }
function TeamList({ title, names }: { title: string; names: string[] }) { return <div className="team-list"><span>{title}</span>{names.map((name) => <div key={name}><b>{name}</b><small>{name === names[0] ? "CAPITÁN" : "JUGADOR"}</small></div>)}</div>; }
