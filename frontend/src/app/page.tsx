"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";
import SignalScene from "@/components/market/signal-scene";
import { useMarket } from "@/components/market/use-market";
import {
  ASSETS,
  COINS,
  money,
  percent,
  pointsFor,
  windowChange,
  utcTime,
  csv,
  type Coin,
  type Selection,
  type PricePoint,
} from "@/lib/market";
const Chart = dynamic(() => import("@/components/market/market-chart"), {
  ssr: false,
  loading: () => <div className="chart-empty">Preparing chart…</div>,
});
const STEPS = [
  {
    title: "Choose your asset.",
    text: "Four tracked assets. Pick one to inspect its recorded price history, or compare their relative movement.",
  },
  {
    title: "Read the momentum.",
    text: "A 14-period RSI observation adds context to the price. View the reading alongside the samples behind it.",
  },
  {
    title: "Let the alert find you.",
    text: "The collector can deliver threshold alerts through Telegram when you configure your own bot.",
  },
];
function Sparkline({ history, coin }: { history: PricePoint[]; coin: Coin }) {
  const data = pointsFor(history, coin).slice(-30);
  if (data.length < 2)
    return <span className="spark-wait">Awaiting history</span>;
  const values = data.map((p) => p.price),
    min = Math.min(...values),
    range = Math.max(...values) - min || 1;
  const path = data
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${(i / (data.length - 1)) * 160},${45 - ((p.price - min) / range) * 35}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 160 52" className="sparkline" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={ASSETS[coin].color}
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`reveal-block ${className}`}
      initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
export default function Home() {
  const market = useMarket();
  const [selection, setSelection] = useState<Selection>("BTC"),
    [menu, setMenu] = useState(false),
    [paused, setPaused] = useState(false),
    [manualPause, setManualPause] = useState(false),
    [systemReduce, setSystemReduce] = useState(false),
    [step, setStep] = useState(0),
    [now, setNow] = useState<number | null>(null);
  const manualChoice = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null),
    menuPanel = useRef<HTMLElement>(null),
    stepRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let stored = false;
    try {
      stored = localStorage.getItem("crypto-motion") === "off";
    } catch {}
    manualChoice.current = stored;
    const apply = () => {
      setSystemReduce(preference.matches);
      setPaused(preference.matches || manualChoice.current);
    };
    setManualPause(stored);
    apply();
    preference.addEventListener("change", apply);
    return () => preference.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("motion-paused", paused);
    return () => document.documentElement.classList.remove("motion-paused");
  }, [paused]);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (
        !menuPanel.current?.contains(e.target as Node) &&
        !menuButton.current?.contains(e.target as Node)
      )
        setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  useEffect(() => {
    let pending = false;
    const update = () => {
      pending = false;
      let index = 0,
        distance = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect(),
          d = Math.abs(rect.top + rect.height * 0.4 - innerHeight * 0.5);
        if (d < distance) {
          distance = d;
          index = i;
        }
      });
      setStep(index);
    };
    const scroll = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener("scroll", scroll, { passive: true });
    update();
    return () => removeEventListener("scroll", scroll);
  }, []);
  const stats = selection === "ALL" ? null : market.stats[selection];
  const selectedPoints = useMemo(
    () =>
      selection === "ALL"
        ? market.history
        : pointsFor(market.history, selection),
    [market.history, selection],
  );
  const price =
    stats && stats.status !== "waiting_for_data" ? stats.price : undefined;
  const sampleTime = stats?.timestamp ? utcTime(stats.timestamp) : NaN;
  const freshest = Math.max(
    0,
    ...Object.values(market.stats)
      .map((s) => (s.timestamp ? utcTime(s.timestamp) || 0 : 0))
      .filter(Number.isFinite),
  );
  const delayed = !!now && freshest > 0 && now - freshest > 180000;
  const connected = market.state === "online";
  const warming = selection !== "ALL" && selectedPoints.length < 15;
  const signal = warming
    ? "Collecting samples"
    : stats?.status === "waiting_for_data"
      ? "Waiting for data"
      : stats?.status.toLowerCase().replaceAll("_", " ") || "Waiting for data";
  const change =
    selection === "ALL" ? null : windowChange(market.history, selection);
  const toggleMotion = () => {
    const value = !manualPause;
    manualChoice.current = value;
    setManualPause(value);
    setPaused(value || systemReduce);
    try {
      localStorage.setItem("crypto-motion", value ? "off" : "on");
    } catch {}
  };
  const choose = (coin: Selection, scroll = false) => {
    setSelection(coin);
    if (scroll)
      document
        .getElementById("terminal")
        ?.scrollIntoView({ behavior: paused ? "instant" : "smooth" });
  };
  const download = () => {
    const blob = new Blob(
      [
        csv(
          selection === "ALL"
            ? market.history
            : market.history.filter((p) => p.symbol === selection),
        ),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `crypto-alerts-${selection.toLowerCase()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const stateText =
    market.state === "connecting"
      ? "Connecting to data"
      : market.state === "offline"
        ? "Data service offline"
        : market.state === "partial"
          ? "Some data unavailable"
          : freshest === 0
            ? "Waiting for samples"
            : delayed
              ? "Samples delayed"
              : "Data service online";
  return (
    <MotionConfig reducedMotion={paused ? "always" : "user"}>
      <div className="app-shell">
        <a href="#terminal" className="skip-link">
          Skip to market terminal
        </a>
        <header className="site-header">
          <div className="header-left">
            <a
              className="brand-mark"
              href="#home"
              aria-label="Crypto Alerts home"
            >
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="11" />
                <path d="m6 19 7-8 5 6 8-5" />
              </svg>
            </a>
            <button
              ref={menuButton}
              type="button"
              className={`menu-button ${menu ? "open" : ""}`}
              aria-expanded={menu}
              aria-controls="site-menu"
              onClick={() => setMenu(!menu)}
            >
              <span aria-hidden="true">{menu ? "×" : "≡"}</span>
              {menu ? "Close" : "Menu"}
            </button>
          </div>
          <div className="header-right">
            <button
              className="motion-control"
              type="button"
              aria-pressed={paused}
              disabled={systemReduce}
              onClick={toggleMotion}
            >
              {systemReduce
                ? "Reduced motion"
                : paused
                  ? "Play motion"
                  : "Pause motion"}
            </button>
            <a className="pill pill-light header-cta" href="#terminal">
              Open terminal <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>
        <nav
          ref={menuPanel}
          id="site-menu"
          className={`menu-panel ${menu ? "is-open" : ""}`}
          aria-label="Main navigation"
          hidden={!menu}
        >
          {[
            ["Market terminal", "#terminal"],
            ["How it works", "#how-it-works"],
            ["The watchlist", "#watchlist"],
            ["Questions", "#questions"],
          ].map(([label, url], i) => (
            <a
              key={url}
              href={url}
              style={{ animationDelay: `${i * 0.055}s` }}
              onClick={() => setMenu(false)}
            >
              {label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
          <div>
            <a href="/login">Account ↗</a>
            <a
              href="https://github.com/BroCoder007/crypto-alerts"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source ↗
            </a>
          </div>
        </nav>
        <main>
          <section
            className="hero dot-field"
            id="home"
            aria-labelledby="hero-title"
          >
            <div className="hero-copy">
              <div className="ticker" aria-label="Tracked assets">
                <div>
                  {[...COINS, ...COINS].map((coin, i) => (
                    <span key={i} aria-hidden={i >= 4}>
                      {coin}
                    </span>
                  ))}
                </div>
              </div>
              <h2>
                A little less noise.
                <br />A clearer market view.
              </h2>
              <p>
                Price history. Momentum.
                <br />
                Four assets, in focus.
              </p>
              <a className="subtle-link" href="#terminal">
                Explore the data <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="hero-scene">
              <SignalScene paused={paused} />
              <div className="scene-caption">
                PROCEDURAL VISUAL / RECORDED PRICES
              </div>
              {COINS.map((coin, i) => (
                <button
                  key={coin}
                  className={`floating-asset float-${i}`}
                  onClick={() => choose(coin, true)}
                  aria-label={`View ${ASSETS[coin].name} in the terminal`}
                >
                  <div className="float-card-head">
                    <span
                      className="coin-glyph"
                      style={{ color: ASSETS[coin].color }}
                    >
                      {ASSETS[coin].glyph}
                    </span>
                    <span>{coin}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <strong>{money(market.stats[coin]?.price)}</strong>
                  <Sparkline history={market.history} coin={coin} />
                  <div className="float-card-meta">
                    <span>USD sample</span>
                    <span>{percent(windowChange(market.history, coin))}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="hero-bottom">
              <h1 id="hero-title">
                Crypto<span>Alerts</span>
              </h1>
              <a className="pill pill-glass" href="#terminal">
                Explore{" "}
                <span className="arrow-disc" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
            <a
              className="scroll-indicator"
              href="#terminal"
              aria-label="Scroll to terminal"
            >
              ↓
            </a>
          </section>
          {process.env.NEXT_PUBLIC_PREVIEW_MODE === "fixture" && (
            <div className="fixture-banner">
              LOCAL FIXTURE PREVIEW · Synthetic samples for interface testing,
              not market prices.
            </div>
          )}
          <section
            className="terminal section-shell"
            id="terminal"
            aria-labelledby="terminal-title"
          >
            <Reveal className="section-heading">
              <div>
                <span className="eyebrow">YOUR MARKET TERMINAL</span>
                <h2 id="terminal-title">
                  Keep the market
                  <br />
                  in perspective.
                </h2>
              </div>
              <span
                className={`connection ${connected && !delayed && freshest ? "online" : ""}`}
                role="status"
              >
                <i />
                {stateText}
              </span>
            </Reveal>
            {(market.state === "offline" || market.state === "partial") && (
              <div className="service-message" role="status">
                {market.state === "offline"
                  ? "The market service is unavailable."
                  : "Some requests could not be refreshed."}{" "}
                Start the FastAPI backend and collector. Previously loaded
                values may remain visible; check each sample time.
              </div>
            )}
            <div className="terminal-toolbar">
              <div
                className="asset-selector"
                role="group"
                aria-label="Choose a chart asset"
              >
                {COINS.map((coin) => (
                  <button
                    key={coin}
                    aria-pressed={selection === coin}
                    onClick={() => choose(coin)}
                  >
                    <span style={{ color: ASSETS[coin].color }}>
                      {ASSETS[coin].glyph}
                    </span>
                    {coin}
                  </button>
                ))}
                <button
                  aria-pressed={selection === "ALL"}
                  onClick={() => choose("ALL")}
                >
                  Compare all ↗
                </button>
              </div>
              <button
                className="export-button"
                disabled={!selectedPoints.length}
                onClick={download}
              >
                Export samples ↓
              </button>
            </div>
            <div className="metrics">
              <div>
                <p>
                  {selection === "ALL"
                    ? "TRACKED ASSETS"
                    : `${selection} / LAST RECORDED PRICE`}
                </p>
                <strong>{selection === "ALL" ? "04" : money(price)}</strong>
                <span>
                  {selection === "ALL"
                    ? "BTC · ETH · SOL · DOGE"
                    : Number.isFinite(sampleTime)
                      ? new Date(sampleTime).toLocaleString()
                      : "Waiting for a recorded sample"}
                </span>
              </div>
              <div>
                <p>
                  {selection === "ALL"
                    ? "COMPARISON BASIS"
                    : "RSI / 14 PERIODS"}
                </p>
                <strong
                  className={
                    stats?.status === "OVERSOLD"
                      ? "positive"
                      : stats?.status === "OVERBOUGHT"
                        ? "negative"
                        : ""
                  }
                >
                  {selection === "ALL"
                    ? "Relative"
                    : warming || !stats || stats.status === "waiting_for_data"
                      ? "—"
                      : stats.rsi.toFixed(1)}
                </strong>
                <span>
                  {selection === "ALL"
                    ? "Each asset’s first loaded sample = 0%"
                    : signal}
                </span>
              </div>
              <div>
                <p>
                  {selection === "ALL"
                    ? "LOADED SAMPLES"
                    : "CHANGE IN LOADED WINDOW"}
                </p>
                <strong
                  className={
                    change !== null
                      ? change >= 0
                        ? "positive"
                        : "negative"
                      : ""
                  }
                >
                  {selection === "ALL"
                    ? market.history.length
                    : percent(change)}
                </strong>
                <span>
                  {selection === "ALL"
                    ? "Up to 500 records from the API"
                    : `${selectedPoints.length} samples · not a 24-hour return`}
                </span>
              </div>
            </div>
            <div className="chart-panel">
              <div className="chart-heading">
                <h3>
                  {selection === "ALL"
                    ? "Relative price movement"
                    : `${ASSETS[selection].name} / USD`}
                </h3>
                <span>
                  {selection === "ALL"
                    ? "ONE-MINUTE BUCKETS · LOCAL TIME"
                    : "UP TO 100 SAMPLES · LOCAL TIME"}
                </span>
              </div>
              <Chart
                history={market.history}
                selection={selection}
                paused={paused}
              />
              <div className="chart-foot">
                <p>
                  {selection === "ALL"
                    ? "Relative change is based on each asset’s own first loaded sample. Gaps are left unfilled; starting times may differ."
                    : "Price history reflects stored samples. A responsive connection does not guarantee the collector is receiving fresh prices."}
                </p>
                {market.received && (
                  <span>
                    Last refresh{" "}
                    {new Date(market.received).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="terminal-bottom">
              <div className="rsi-panel">
                <div className="card-title">
                  <h3>Momentum, with context.</h3>
                  <span>RSI 14</span>
                </div>
                <div className="rsi-scale" aria-hidden="true">
                  {!warming && stats && stats.status !== "waiting_for_data" && (
                    <i
                      style={{
                        left: `${Math.max(0, Math.min(100, stats.rsi))}%`,
                      }}
                    />
                  )}
                </div>
                <div className="rsi-labels">
                  <span>0</span>
                  <span>30 / OVERSOLD</span>
                  <span>70 / OVERBOUGHT</span>
                  <span>100</span>
                </div>
                <p>
                  {selection === "ALL"
                    ? "Choose an asset to inspect its RSI observation."
                    : warming
                      ? "Waiting for at least 15 loaded samples before displaying RSI."
                      : `The latest API observation is ${signal}.`}{" "}
                  Threshold observations are indicators, not trading
                  instructions.
                </p>
              </div>
              <div className="delivery-panel">
                <div className="card-title">
                  <h3>Alerts that meet you.</h3>
                  <span aria-hidden="true">↗</span>
                </div>
                <p>
                  Telegram delivery is configured in the Python collector. This
                  dashboard cannot verify your bot configuration or delivery
                  status.
                </p>
                <a href="#questions" className="subtle-link">
                  How to connect Telegram <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <details className="samples-table">
              <summary>
                Inspect the last 12 loaded samples{" "}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="table-wrap">
                <table>
                  <caption className="sr-only">
                    Latest loaded price records, newest first
                  </caption>
                  <thead>
                    <tr>
                      <th>Recorded at (local)</th>
                      <th>Asset</th>
                      <th>Price / USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedPoints]
                      .sort(
                        (a, b) => utcTime(b.timestamp) - utcTime(a.timestamp),
                      )
                      .slice(0, 12)
                      .map((point, i) => (
                        <tr key={`${point.timestamp}-${point.symbol}-${i}`}>
                          <td>
                            {new Date(
                              utcTime(point.timestamp),
                            ).toLocaleString()}
                          </td>
                          <td>{point.symbol || selection}</td>
                          <td>{money(point.price)}</td>
                        </tr>
                      ))}
                    {!selectedPoints.length && (
                      <tr>
                        <td colSpan={3}>
                          No recorded samples are available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
          <section
            className="how-section dot-field"
            id="how-it-works"
            aria-labelledby="how-title"
          >
            <div className="how-sticky">
              <span className="eyebrow" id="how-title">
                HOW THE SIGNAL TAKES SHAPE
              </span>
              <div
                className={`step-illustration step-scene-${step}`}
                aria-hidden="true"
              >
                <div className="signal-orbit orbit-a" />
                <div className="signal-orbit orbit-b" />
                <div className="signal-core">
                  {step === 0 ? "₿" : step === 1 ? "RSI" : "↗"}
                </div>
                <div className="floating-note note-one">
                  {step === 0
                    ? "BTC / ETH / SOL / DOGE"
                    : step === 1
                      ? "14 recorded periods"
                      : "Your bot. Your channel."}
                </div>
                <div className="floating-note note-two">
                  {step === 0
                    ? "Choose your view"
                    : step === 1
                      ? "30 ← → 70"
                      : "Collector-managed delivery"}
                </div>
              </div>
              <div className="step-copy">
                <div className="step-index">
                  {STEPS.map((_, i) => (
                    <a
                      key={i}
                      href={`#step-${i}`}
                      aria-label={`Go to step ${i + 1}`}
                      aria-current={step === i ? "step" : undefined}
                    >
                      {step === i ? `Step 0${i + 1}` : `0${i + 1}`}
                    </a>
                  ))}
                </div>
                <div>
                  <h2>{STEPS[step].title}</h2>
                  <p>{STEPS[step].text}</p>
                </div>
              </div>
            </div>
            <div className="step-track">
              {STEPS.map((_, i) => (
                <div
                  className="step-anchor"
                  id={`step-${i}`}
                  key={i}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  aria-label={`Step ${i + 1}: ${STEPS[i].title}`}
                />
              ))}
            </div>
          </section>
          <section
            className="watchlist section-shell"
            id="watchlist"
            aria-labelledby="watchlist-title"
          >
            <Reveal className="section-heading">
              <div>
                <span className="eyebrow">THE WATCHLIST</span>
                <h2 id="watchlist-title">
                  Four assets.
                  <br />
                  One place to look.
                </h2>
              </div>
              <p className="section-aside">
                Choose a card to open
                <br />
                its recorded price history.
              </p>
            </Reveal>
            <div className="watchlist-grid">
              {COINS.map((coin, index) => (
                <Reveal key={coin}>
                  <button
                    className="watch-card"
                    onClick={() => choose(coin, true)}
                  >
                    <div className="watch-top">
                      <span>0{index + 1}</span>
                      <span aria-hidden="true">↗</span>
                    </div>
                    <div
                      className="watch-symbol"
                      style={{ color: ASSETS[coin].color }}
                    >
                      {ASSETS[coin].glyph}
                    </div>
                    <h3>{ASSETS[coin].name}</h3>
                    <span className="watch-ticker">{coin} / USD</span>
                    <div className="watch-price">
                      {money(market.stats[coin]?.price)}
                    </div>
                    <Sparkline history={market.history} coin={coin} />
                    <p>
                      {percent(windowChange(market.history, coin))}
                      <span>in the loaded window</span>
                    </p>
                  </button>
                </Reveal>
              ))}
            </div>
          </section>
          <section
            className="questions section-shell"
            id="questions"
            aria-labelledby="question-title"
          >
            <div>
              <span className="eyebrow">A LITTLE CLARITY</span>
              <h2 id="question-title">
                Good questions.
                <br />
                Clear answers.
              </h2>
            </div>
            <div className="faq-list">
              {[
                [
                  "Where do the prices come from?",
                  "The Python collector requests USD prices from CryptoCompare and records them in SQLite. The dashboard reads your FastAPI service, rather than contacting an exchange directly.",
                ],
                [
                  "Why is the chart empty or delayed?",
                  "Start the backend and collector from the project root. New databases need samples before a trend appears. The interface polls every five seconds; the collector requests prices on its own configured interval, currently 60 seconds. Old samples remain old even while the API is reachable.",
                ],
                [
                  "What do RSI observations mean?",
                  "The project calculates a 14-period RSI. Below 30 is labelled oversold; above 70 is labelled overbought. The UI waits for 15 loaded samples before displaying a reading. An observation is not a prediction, recommendation or guarantee.",
                ],
                [
                  "How do I connect Telegram?",
                  "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID as environment variables for the collector, then run main_script.py. Without both values, alert delivery is skipped. Keep credentials private. The dashboard has no delivery-status endpoint, so it does not claim your bot is connected.",
                ],
                [
                  "Do I need to create an account?",
                  "The market dashboard remains public, as in the original project. Optional Google or GitHub sign-in is available only when you configure the providers. Signing in does not protect the public price API.",
                ],
                [
                  "What does Compare all show?",
                  "Each asset is rebased to its first loaded sample, making relative movement visible despite different price scales. Samples are grouped by full UTC minute, displayed in local time. These are loaded-window changes, not 24-hour performance.",
                ],
              ].map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <div>
                    <p>{answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </main>
        <footer className="site-footer dot-field">
          <div className="footer-top">
            <h2>
              Stay curious.
              <br />
              Keep perspective.
            </h2>
            <a className="pill pill-glass" href="#terminal">
              Open terminal{" "}
              <span className="arrow-disc" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
          <div className="footer-wordmark" aria-hidden="true">
            Crypto Alerts
          </div>
          <div className="footer-bottom">
            <span>Built by Abhinav Raghavendra</span>
            <a
              href="https://github.com/BroCoder007/crypto-alerts"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source on GitHub ↗
            </a>
            <a href="#home">Back to top ↑</a>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
