import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Archive,
  BookOpen,
  Dices,
  Eye,
  Flame,
  LayoutDashboard,
  Menu,
  Mic,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Star,
  Swords,
  X,
} from "lucide-react";
import {
  JOURNAL_CATEGORIES,
  MOODS,
  SYNC_TYPES,
  TITLES,
  addXp,
  attackLadder,
  bumpStreak,
  defaultDB,
  formatLong,
  formatWhen,
  inspectNumbers,
  isArchive,
  levelProgress,
  loadDB,
  mergeDB,
  moonInfo,
  nextTitle,
  readingById,
  rollDaily,
  saveDB,
  searchDb,
  spinPrompt,
  storageKey,
  syncLevel,
  titleFor,
  todayKey,
  uid,
} from "@/mystic/engine";
import type { DB, Dragon, Reading, ReadingType, Settings } from "@/mystic/engine";

type ViewId =
  | "dashboard"
  | "dragon"
  | "tarot"
  | "shadow"
  | "journal"
  | "voice"
  | "numbers"
  | "universe"
  | "sync"
  | "xp"
  | "archive"
  | "settings";

type Result = { db: DB; toast?: string };

type Api = {
  db: DB;
  view: ViewId;
  setView: (view: ViewId) => void;
  draft: string;
  setDraft: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  mood: string;
  setMood: (value: string) => void;
  forgeDragon: (task: string) => void;
  easier: () => void;
  startDragon: () => void;
  completeDragon: () => void;
  releaseDragon: () => void;
  addJournal: (input: { category: string; text: string; mood: string }) => void;
  removeJournal: (id: string) => void;
  addSync: (input: { type: string; text: string }) => void;
  removeSync: (id: string) => void;
  checkIn: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setName: (name: string) => void;
  restore: (raw: unknown) => boolean;
  resetAll: () => void;
  writePrompt: (text: string, category?: string) => void;
};

const Ctx = createContext<Api | null>(null);

function useOs() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Temple context missing");
  return value;
}

const NAV: { id: ViewId; label: string; icon: typeof Moon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "dragon", label: "Dragon Slayer", icon: Swords },
  { id: "tarot", label: "Tarot Oracle", icon: Sparkles },
  { id: "shadow", label: "Shadow Work", icon: Moon },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "voice", label: "Voice Journal", icon: Mic },
  { id: "numbers", label: "Cosmic Numbers", icon: Dices },
  { id: "universe", label: "Universe Messages", icon: Star },
  { id: "sync", label: "Synchronicities", icon: Eye },
  { id: "xp", label: "Courage XP", icon: Flame },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function OsApp() {
  const [db, setDb] = useState<DB | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setViewState] = useState<ViewId>("dashboard");
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<string>(JOURNAL_CATEGORIES[1]);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [systemReduce, setSystemReduce] = useState(false);
  const pending = useRef<string | null>(null);
  const booted = useRef(false);
  const ready = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const had = localStorage.getItem(storageKey());
    let next = loadDB();
    if (!had && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      next = { ...next, settings: { ...next.settings, reducedMotion: true } };
    }
    next = syncLevel(rollDaily(next));
    saveDB(next);
    setDb(next);
  }, []);

  useEffect(() => {
    if (!db) return;
    if (!ready.current) {
      ready.current = true;
      return;
    }
    saveDB(db);
    if (pending.current) {
      setToast(pending.current);
      pending.current = null;
    }
  }, [db]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!db) return;
    const root = document.documentElement;
    root.dataset.theme = db.settings.darkMode ? "void" : "dawn";
    root.dataset.contrast = db.settings.highContrast ? "high" : "normal";
    root.dataset.motion = db.settings.reducedMotion || !db.settings.animations ? "reduce" : "full";
  }, [db]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setSystemReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const setView = useCallback((next: ViewId) => {
    setViewState(next);
    setQuery("");
    setNavOpen(false);
  }, []);

  const mutate = useCallback((fn: (current: DB) => Result) => {
    setDb((prev) => {
      if (!prev) return prev;
      const result = fn(prev);
      pending.current = result.toast ?? null;
      return syncLevel(rollDaily(result.db));
    });
  }, []);

  const api: Api | null = db
    ? {
        db,
        view,
        setView,
        draft,
        setDraft,
        category,
        setCategory,
        mood,
        setMood,
        forgeDragon: (task) => {
          const clean = task.trim();
          if (!clean) return;
          mutate((current) => {
            const dragon: Dragon = {
              id: uid(),
              task: clean,
              attacks: attackLadder(clean),
              attackIndex: 0,
              started: false,
              completed: false,
              date: todayKey(),
              awarded: { generated: true, started: false, completed: false },
            };
            const history = current.dragon.current
              ? [current.dragon.current, ...current.dragon.history].slice(0, 200)
              : current.dragon.history;
            return {
              db: addXp({ ...current, dragon: { current: dragon, history } }, 10, "Attack generated"),
              toast: "Courage +10 · tiny attack ready",
            };
          });
        },
        easier: () =>
          mutate((current) => {
            const dragon = current.dragon.current;
            if (!dragon || dragon.completed) return { db: current };
            if (dragon.attackIndex >= dragon.attacks.length - 1) {
              return { db: current, toast: "This is already the smallest step." };
            }
            return {
              db: {
                ...current,
                dragon: { ...current.dragon, current: { ...dragon, attackIndex: dragon.attackIndex + 1 } },
              },
              toast: "The step got smaller.",
            };
          }),
        startDragon: () =>
          mutate((current) => {
            const dragon = current.dragon.current;
            if (!dragon || dragon.started || dragon.completed) return { db: current };
            return {
              db: addXp(
                {
                  ...current,
                  dragon: {
                    ...current.dragon,
                    current: { ...dragon, started: true, awarded: { ...dragon.awarded, started: true } },
                  },
                },
                15,
                "Dragon faced",
              ),
              toast: "Courage +15 · you started",
            };
          }),
        completeDragon: () =>
          mutate((current) => {
            const dragon = current.dragon.current;
            if (!dragon || dragon.completed) return { db: current };
            const today = todayKey();
            const streak = bumpStreak(current.streaks.dragon, current.streaks.lastDragon, today);
            let next: DB = {
              ...current,
              streaks: { ...current.streaks, dragon: streak.value, lastDragon: streak.last },
              dragon: {
                ...current.dragon,
                current: {
                  ...dragon,
                  started: true,
                  completed: true,
                  awarded: { ...dragon.awarded, started: true, completed: true },
                },
              },
            };
            let gained = 40;
            if (!dragon.awarded.started) {
              next = addXp(next, 15, "Dragon faced");
              gained += 15;
            }
            next = addXp(next, 40, "Dragon completed");
            return { db: next, toast: `Courage +${gained} · dragon completed` };
          }),
        releaseDragon: () =>
          mutate((current) => {
            if (!current.dragon.current) return { db: current };
            return {
              db: {
                ...current,
                dragon: {
                  current: null,
                  history: [current.dragon.current, ...current.dragon.history].slice(0, 200),
                },
              },
              toast: "Dragon released. Naming it was already a kind of courage.",
            };
          }),
        addJournal: (input) => {
          const text = input.text.trim();
          if (!text) return;
          mutate((current) => {
            const today = todayKey();
            const first = current.streaks.lastJournal !== today;
            const streak = bumpStreak(current.streaks.journal, current.streaks.lastJournal, today);
            const amount = first ? 20 : 8;
            const entry = {
              id: uid(),
              timestamp: new Date().toISOString(),
              category: input.category,
              text,
              mood: input.mood,
            };
            return {
              db: addXp(
                {
                  ...current,
                  streaks: { ...current.streaks, journal: streak.value, lastJournal: streak.last },
                  journalEntries: [entry, ...current.journalEntries],
                },
                amount,
                first ? "Journal entry" : "Further journaling",
              ),
              toast: `Courage +${amount} · journal kept`,
            };
          });
        },
        removeJournal: (id) =>
          mutate((current) => ({
            db: { ...current, journalEntries: current.journalEntries.filter((entry) => entry.id !== id) },
            toast: "Entry released",
          })),
        addSync: (input) => {
          const text = input.text.trim();
          if (!text) return;
          mutate((current) => ({
            db: addXp(
              {
                ...current,
                synchronicities: [
                  { id: uid(), type: input.type, text, timestamp: new Date().toISOString() },
                  ...current.synchronicities,
                ],
              },
              12,
              "Synchronicity",
            ),
            toast: "Courage +12 · sign logged",
          }));
        },
        removeSync: (id) =>
          mutate((current) => ({
            db: { ...current, synchronicities: current.synchronicities.filter((item) => item.id !== id) },
            toast: "Sign released",
          })),
        checkIn: () =>
          mutate((current) => {
            if (!current.dailyState || current.dailyState.checkedIn) return { db: current };
            return {
              db: addXp({ ...current, dailyState: { ...current.dailyState, checkedIn: true } }, 10, "Daily check-in"),
              toast: "Courage +10 · checked in",
            };
          }),
        updateSettings: (patch) => mutate((current) => ({ db: { ...current, settings: { ...current.settings, ...patch } } })),
        setName: (name) => mutate((current) => ({ db: { ...current, profile: { name } } })),
        restore: (raw) => {
          if (!isArchive(raw)) return false;
          pending.current = "Archive restored";
          setDb(syncLevel(rollDaily(mergeDB(raw))));
          return true;
        },
        resetAll: () => {
          pending.current = "The temple is clear";
          setDraft("");
          setDb(syncLevel(rollDaily(defaultDB(), { grantTarot: false })));
        },
        writePrompt: (text, nextCategory) => {
          setDraft(text);
          if (nextCategory) setCategory(nextCategory);
          setView("journal");
        },
      }
    : null;

  if (!db || !api) {
    return (
      <main className="boot">
        <p className="eyebrow">Opening</p>
        <h1>Mystic Command Center</h1>
        <p>The temple is lighting its lamps.</p>
      </main>
    );
  }

  const motion = db.settings.animations && !db.settings.reducedMotion && !systemReduce;

  return (
    <Ctx.Provider value={api}>
      <Shell
        toast={toast}
        query={query}
        setQuery={setQuery}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        motion={motion}
      />
    </Ctx.Provider>
  );
}

function Shell({
  toast,
  query,
  setQuery,
  navOpen,
  setNavOpen,
  collapsed,
  setCollapsed,
  motion,
}: {
  toast: string | null;
  query: string;
  setQuery: (value: string) => void;
  navOpen: boolean;
  setNavOpen: (value: boolean) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  motion: boolean;
}) {
  const { db, view, setView } = useOs();
  const daily = db.dailyState;
  const moon = moonInfo();
  const progress = levelProgress(db.xp.value);
  const themeKey = `${db.settings.darkMode}-${db.settings.highContrast}`;

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Starfield enabled={motion} />
      <div className="sticky-cluster">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            type="button"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            aria-controls="temple-nav"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X className="ico" /> : <Menu className="ico" />}
          </button>
          <div className="brand">
            <TempleMark />
            <div>
              <h1 className="brand-name">Mystic Command</h1>
              <p className="brand-sub">{db.profile.name.trim() || "Local temple"}</p>
            </div>
          </div>
          <div className="moon-block">
            <MoonMark frac={moon.frac} name={moon.name} illumination={moon.illumination} themeKey={themeKey} />
            <div className="moon-copy">
              <strong>{moon.name}</strong>
              <span className="meta">
                {daily ? formatLong(daily.date) : formatLong(todayKey())} · {moon.illumination}% lit
              </span>
            </div>
          </div>
          <div className="xp-chip">
            <div className="xp-line">
              <span>
                Lv {progress.level} · {titleFor(progress.level)}
              </span>
              <span>{db.xp.value} XP</span>
            </div>
            <Progress xp={db.xp.value} />
          </div>
          <div className="search">
            <Search className="ico" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              value={query}
              placeholder="Search the temple"
              aria-label="Search journal, tarot, synchronicities, universe messages, and dragons"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </header>
        <DragonDock />
      </div>
      {navOpen ? (
        <button className="scrim" type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} />
      ) : null}
      <div className={collapsed ? "workspace is-collapsed" : "workspace"}>
        <nav id="temple-nav" className={navOpen ? "nav is-open" : collapsed ? "nav is-collapsed" : "nav"} aria-label="Temple">
          <button
            className="btn btn-ghost collapse-btn"
            type="button"
            aria-pressed={collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen className="ico" /> : <PanelLeftClose className="ico" />}
            <span className="nav-label">{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <div className="nav-scroll">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id && !query.trim();
              return (
                <button
                  key={item.id}
                  className={active ? "nav-btn is-active" : "nav-btn"}
                  type="button"
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setView(item.id)}
                >
                  <Icon className="ico" aria-hidden="true" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
          <p className="nav-foot">
            {titleFor(progress.level)}
            <br />
            <span className="meta">Kept in this browser</span>
          </p>
        </nav>
        <main id="main" className="stage">
          {query.trim() ? <SearchResults query={query} onClear={() => setQuery("")} /> : <ViewSwitch />}
        </main>
      </div>
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ViewSwitch() {
  const { view } = useOs();
  if (view === "dashboard") return <Dashboard />;
  if (view === "dragon") return <DragonView />;
  if (view === "tarot") return <TarotView />;
  if (view === "shadow") return <ShadowView />;
  if (view === "journal") return <JournalView />;
  if (view === "voice") return <VoiceView />;
  if (view === "numbers") return <NumbersView />;
  if (view === "universe") return <UniverseView />;
  if (view === "sync") return <SyncView />;
  if (view === "xp") return <XpView />;
  if (view === "archive") return <ArchiveView />;
  return <SettingsView />;
}

function DragonDock() {
  const { db, setView, easier, startDragon, completeDragon } = useOs();
  const dragon = db.dragon.current;
  const attack = dragon ? dragon.attacks[dragon.attackIndex] ?? dragon.attacks[0] : "";
  return (
    <div className="dock" aria-label="Today's dragon">
      <div className="dock-copy">
        <p className="eyebrow">Today's dragon — always in view</p>
        <p className="clamp">
          <strong>{dragon ? dragon.task : "No dragon named yet."}</strong>
        </p>
        <p className="meta clamp">{dragon ? `Tiny attack: ${attack}` : "Name the task you are avoiding. It gets smaller from here."}</p>
      </div>
      <div className="row-actions">
        {dragon && !dragon.completed ? (
          <>
            <button className="btn" type="button" onClick={easier} disabled={dragon.attackIndex >= dragon.attacks.length - 1}>
              Easier step
            </button>
            <button className="btn" type="button" onClick={startDragon} disabled={dragon.started}>
              {dragon.started ? "Started" : "I started"}
            </button>
            <button className="btn btn-gold" type="button" onClick={completeDragon}>
              I finished
            </button>
          </>
        ) : (
          <button className="btn btn-gold" type="button" onClick={() => setView("dragon")}>
            {dragon?.completed ? "Name another" : "Name the dragon"}
          </button>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { db, checkIn, writePrompt, setView } = useOs();
  const daily = db.dailyState;
  const reading = readingById(db, daily?.readingId);
  const progress = levelProgress(db.xp.value);
  const moon = moonInfo();
  return (
    <section className="stack" aria-labelledby="dash-title">
      <div className="view-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 id="dash-title">The day, gathered</h2>
        </div>
        <button className="btn btn-gold" type="button" onClick={checkIn} disabled={!daily || daily.checkedIn}>
          {daily?.checkedIn ? "Checked in today" : "Daily check-in"}
        </button>
      </div>
      <div className="stat-grid">
        <article className="crystal stat">
          <p className="eyebrow">Courage</p>
          <strong>
            Lv {progress.level}
          </strong>
          <span className="meta">
            {titleFor(progress.level)} · {db.xp.value} XP · {progress.pct}%
          </span>
          <Progress xp={db.xp.value} />
        </article>
        <article className="crystal stat">
          <p className="eyebrow">Journal streak</p>
          <strong>{db.streaks.journal}</strong>
          <span className="meta">{db.streaks.journal ? "days of return" : "Begins when you write"}</span>
        </article>
        <article className="crystal stat">
          <p className="eyebrow">Dragon streak</p>
          <strong>{db.streaks.dragon}</strong>
          <span className="meta">{db.streaks.dragon ? "dragons met" : "Begins when one is finished"}</span>
        </article>
      </div>
      <div className="dash">
        <div className="stack">
          <article className="crystal">
            <p className="eyebrow">Today's dragon</p>
            {db.dragon.current ? (
              <>
                <h3>{db.dragon.current.task}</h3>
                <p>{db.dragon.current.attacks[db.dragon.current.attackIndex]}</p>
                <p className="meta">{db.dragon.current.completed ? "Completed today." : db.dragon.current.started ? "Started. Small still counts." : "Not started. The tiny attack is enough."}</p>
              </>
            ) : (
              <>
                <h3>Nothing named</h3>
                <p>Avoidance gets heavier in the dark. Give it a name and the temple will hand you a smaller door.</p>
                <button className="btn" type="button" onClick={() => setView("dragon")}>
                  Face it
                </button>
              </>
            )}
          </article>
          <article className="crystal stack">
            <p className="eyebrow">Today's tarot · {daily?.spreadSize ?? 3} cards</p>
            {reading ? (
              <>
                <Omen type={reading.type} />
                <p className="oracle">{reading.oracle}</p>
                <div className="row-actions">
                  {reading.cards.map((card) => (
                    <span key={`${card.id}-${card.position}`} className="chip">
                      {card.name}
                      {card.reversed ? " · rev" : ""}
                    </span>
                  ))}
                </div>
                <button className="btn" type="button" onClick={() => setView("tarot")}>
                  Open the spread
                </button>
              </>
            ) : (
              <p>The cards are still settling.</p>
            )}
          </article>
          <article className="crystal">
            <p className="eyebrow">Journal prompt</p>
            <h3>{daily?.prompt}</h3>
            <button className="btn" type="button" onClick={() => daily && writePrompt(daily.prompt)}>
              Write with this prompt
            </button>
          </article>
        </div>
        <div className="stack">
          <article className="crystal">
            <p className="eyebrow">Moon</p>
            <h3>{moon.name}</h3>
            <p className="meta">
              Day {Math.round(moon.age)} of the cycle · {moon.illumination}% illuminated
              {db.streaks.app ? ` · temple streak ${db.streaks.app}` : ""}
            </p>
          </article>
          <article className="crystal">
            <p className="eyebrow">Universe message</p>
            <p className="oracle">{daily?.universe}</p>
          </article>
          <article className="crystal stack">
            <p className="eyebrow">Cosmic numbers</p>
            {daily ? <Numbers nums={daily.numbers} /> : null}
          </article>
        </div>
      </div>
    </section>
  );
}

function DragonView() {
  const { db, forgeDragon, easier, startDragon, completeDragon, releaseDragon } = useOs();
  const [task, setTask] = useState("");
  const dragon = db.dragon.current;
  const attack = dragon ? dragon.attacks[dragon.attackIndex] ?? "" : "";
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Dragon Slayer</p>
          <h2>Make the avoided thing smaller</h2>
        </div>
      </div>
      <article className="crystal">
        <p>This is not a to-do list. Name the task you are orbiting. The temple answers with a tiny attack, then a smaller one, until starting is almost nothing.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!task.trim()) return;
            forgeDragon(task);
            setTask("");
          }}
        >
          <label className="field">
            <span>What task am I avoiding?</span>
            <input value={task} onChange={(event) => setTask(event.target.value)} placeholder="The email, the form, the first sentence…" />
          </label>
          <button className="btn btn-gold" type="submit">
            {dragon ? "Replace today's dragon" : "Name today's dragon"}
          </button>
        </form>
      </article>
      {dragon ? (
        <article className="crystal stack">
          <p className="eyebrow">{dragon.completed ? "Completed" : "Today's dragon"}</p>
          <h3>{dragon.task}</h3>
          <p className="oracle">{attack}</p>
          <p className="meta">
            Step {Math.min(dragon.attackIndex + 1, dragon.attacks.length)} of {dragon.attacks.length}. Each easier step is still a real move.
          </p>
          <div className="row-actions">
            <button className="btn" type="button" onClick={easier} disabled={dragon.completed || dragon.attackIndex >= dragon.attacks.length - 1}>
              Generate easier step
            </button>
            <button className="btn" type="button" onClick={startDragon} disabled={dragon.started || dragon.completed}>
              {dragon.started ? "Started" : "I started"}
            </button>
            <button className="btn btn-gold" type="button" onClick={completeDragon} disabled={dragon.completed}>
              {dragon.completed ? "Finished" : "I finished"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={releaseDragon}>
              Release this dragon
            </button>
          </div>
        </article>
      ) : null}
    </section>
  );
}

function TarotView() {
  const reading = useTodayReading();
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Tarot Oracle</p>
          <h2>{reading ? `${reading.spreadSize}-card spread` : "Today's spread"}</h2>
        </div>
        <p className="meta">The wheel turns 3, then 6, then 9, and begins again. One reading each day.</p>
      </div>
      {reading ? <Spread reading={reading} /> : <p className="crystal">The cards have not settled.</p>}
    </section>
  );
}

function ShadowView() {
  const { db, addJournal } = useOs();
  const reading = useTodayReading();
  const reversed = reading?.cards.filter((card) => card.reversed) ?? [];
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string>("Tender");
  const [extra, setExtra] = useState<string | null>(null);
  const prompt = extra ?? db.dailyState?.shadowPrompt ?? "";
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Shadow Work</p>
          <h2>A kinder mirror</h2>
        </div>
        <button className="btn" type="button" onClick={() => setExtra(spinPrompt("shadow"))}>
          Another prompt
        </button>
      </div>
      <article className="crystal">
        <p className="eyebrow">Today's shadow prompt</p>
        <h3>{prompt}</h3>
      </article>
      {reversed.length ? (
        <article className="crystal">
          <p className="eyebrow">Reversed mirrors</p>
          <ul className="list">
            {reversed.map((card) => (
              <li key={`${card.id}-${card.position}`} className="entry">
                <h3>
                  {card.position}: {card.name}
                </h3>
                <p>{card.meaning}</p>
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <p className="crystal">No reversed cards in today's spread. Shadow work can still be a quiet inventory — nothing is wrong if the mirror is clear.</p>
      )}
      <form
        className="crystal"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          addJournal({ category: "Shadow Work", text: `${prompt}\n\n${text.trim()}`, mood });
          setText("");
        }}
      >
        <label className="field">
          <span>Mood</span>
          <select value={mood} onChange={(event) => setMood(event.target.value)} aria-label="Mood">
            {MOODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Write into the shadow</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button className="btn btn-gold" type="submit">
          Keep in the journal
        </button>
      </form>
    </section>
  );
}

function JournalView() {
  const { db, draft, setDraft, category, setCategory, mood, setMood, addJournal, removeJournal } = useOs();
  const [pending, setPending] = useState<string | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Journal</p>
          <h2>What wants words</h2>
        </div>
        <button className="btn" type="button" onClick={() => setExtra(spinPrompt("journal"))}>
          Another prompt
        </button>
      </div>
      <article className="crystal">
        <p className="eyebrow">Current prompt</p>
        <h3>{extra ?? db.dailyState?.prompt}</h3>
      </article>
      <form
        className="crystal"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          addJournal({ category, text: draft, mood });
          setDraft("");
        }}
      >
        <div className="two">
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {JOURNAL_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Mood</span>
            <select value={mood} onChange={(event) => setMood(event.target.value)}>
              {MOODS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Entry</span>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button className="btn btn-gold" type="submit">
          Keep entry
        </button>
      </form>
      <EntryList
        empty="The journal is a quiet room. The first sentence can be ordinary."
        items={db.journalEntries.map((entry) => ({
          id: entry.id,
          kicker: `${entry.category} · ${entry.mood}`,
          title: formatWhen(entry.timestamp),
          body: entry.text,
        }))}
        pending={pending}
        setPending={setPending}
        onRemove={removeJournal}
      />
    </section>
  );
}

function VoiceView() {
  const { addJournal } = useOs();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("Intuition");
  const [mood, setMood] = useState<string>("Stirred");
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(!!getRecognition());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  function start() {
    const Ctor = getRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-AU";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i++) {
        spoken += `${event.results[i]?.[0]?.transcript ?? ""} `;
      }
      setText(spoken.replace(/\s+/g, " ").trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }

  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Voice Journal</p>
          <h2>Speak, then keep it</h2>
        </div>
      </div>
      {supported === false ? (
        <p className="crystal">
          This browser does not expose speech recognition. Chrome and Edge usually do; Firefox and some in-app browsers do not. You can still write in the Journal.
        </p>
      ) : (
        <div className="crystal stack">
          <div className="row-actions">
            <button className="btn btn-gold" type="button" onClick={start} disabled={listening || supported === null}>
              Start recording
            </button>
            <button className="btn" type="button" onClick={stop} disabled={!listening}>
              Stop recording
            </button>
            <span className="meta" role="status">
              {listening ? "Listening…" : "Idle"}
            </span>
          </div>
          <label className="field">
            <span>Live transcript</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} aria-live="polite" />
          </label>
          <div className="two">
            <label className="field">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {JOURNAL_CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Mood</span>
              <select value={mood} onChange={(event) => setMood(event.target.value)}>
                {MOODS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="btn btn-gold"
            type="button"
            onClick={() => {
              if (!text.trim()) return;
              addJournal({ category, text, mood });
              setText("");
            }}
          >
            Append to journal
          </button>
        </div>
      )}
    </section>
  );
}

function NumbersView() {
  const daily = useOs().db.dailyState;
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Cosmic Numbers</p>
          <h2>Nine figures for the day</h2>
        </div>
      </div>
      <article className="crystal stack">
        <p>Angel numbers 11, 22, 33, 44, 55, 66, 77, 88, and 99 are marked in gold. Mirrors, repeats, and runs are noted underneath. They renew tomorrow.</p>
        {daily ? <Numbers nums={daily.numbers} /> : null}
      </article>
    </section>
  );
}

function UniverseView() {
  const log = useOs().db.dailyState?.universeLog ?? [];
  const today = log[0];
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Universe Messages</p>
          <h2>One line, until tomorrow</h2>
        </div>
      </div>
      <article className="crystal">
        <p className="eyebrow">{today?.date}</p>
        <p className="oracle">{today?.message}</p>
      </article>
      {log.length > 1 ? (
        <ul className="list crystal">
          {log.slice(1).map((note) => (
            <li key={note.date} className="entry">
              <p className="eyebrow">{note.date}</p>
              <p>{note.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">Earlier messages gather here after the next dawn.</p>
      )}
    </section>
  );
}

function SyncView() {
  const { db, addSync, removeSync } = useOs();
  const [type, setType] = useState<string>(SYNC_TYPES[0]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const counts = SYNC_TYPES.map((item) => ({
    type: item,
    count: db.synchronicities.filter((row) => row.type === item).length,
  }));
  const shown = db.synchronicities.filter((row) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return `${row.type} ${row.text}`.toLowerCase().includes(q);
  });
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Synchronicities</p>
          <h2>Signs worth keeping</h2>
        </div>
      </div>
      <div className="freq">
        {counts.map((row) => (
          <article key={row.type} className="crystal stat">
            <p className="eyebrow">{row.type}</p>
            <strong>{row.count}</strong>
          </article>
        ))}
      </div>
      <form
        className="crystal"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          addSync({ type, text });
          setText("");
        }}
      >
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {SYNC_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>What appeared?</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button className="btn btn-gold" type="submit">
          Log sign
        </button>
      </form>
      <label className="field">
        <span>Filter signs</span>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Dream, owl, 11:11…" />
      </label>
      <EntryList
        empty="No signs match. The log can stay empty; noticing later still counts."
        items={shown.map((item) => ({
          id: item.id,
          kicker: item.type,
          title: formatWhen(item.timestamp),
          body: item.text,
        }))}
        pending={pending}
        setPending={setPending}
        onRemove={removeSync}
      />
    </section>
  );
}

function XpView() {
  const { db } = useOs();
  const progress = levelProgress(db.xp.value);
  const upcoming = nextTitle(progress.level);
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Courage XP</p>
          <h2>
            {titleFor(progress.level)} · level {progress.level}
          </h2>
        </div>
      </div>
      <article className="crystal">
        <p>
          {db.xp.value} XP · {progress.level === 100 ? "The last gate is open." : `${progress.into} / ${progress.need} toward the next level`}
        </p>
        <Progress xp={db.xp.value} />
        <p className="meta">{upcoming ? `Next title: ${upcoming.title} at level ${upcoming.level}.` : "Ascendant. The ladder ends here, the practice does not."}</p>
      </article>
      <div className="freq">
        {TITLES.map((row) => (
          <article key={row.title} className="crystal">
            <p className="eyebrow">Level {row.level}</p>
            <h3>{row.title}</h3>
            <p className="meta">{progress.level >= row.level ? "Held" : "Ahead"}</p>
          </article>
        ))}
      </div>
      <article className="crystal">
        <p className="eyebrow">How courage is counted</p>
        <p>Daily tarot 15 · check-in 10 · first journal of the day 20 · later entries 8 · a logged sign 12 · naming a dragon 10 · starting 15 · finishing 40.</p>
      </article>
      <ul className="list crystal">
        {db.xp.log.length === 0 ? <li>No courage logged yet. Opening the day already begins the count.</li> : null}
        {db.xp.log.map((event, index) => (
          <li key={`${event.at}-${index}`} className="entry">
            <p className="eyebrow">+{event.amount}</p>
            <h3>{event.reason}</h3>
            <p className="meta">{formatWhen(event.at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArchiveView() {
  const history = useOs().db.tarotHistory;
  const [kind, setKind] = useState<"all" | ReadingType>("all");
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const items = history.filter((reading) => {
    if (kind !== "all" && reading.type !== kind) return false;
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return `${reading.date} ${reading.oracle} ${reading.type} ${reading.cards.map((card) => card.name).join(" ")}`.toLowerCase().includes(q);
  });
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Archive</p>
          <h2>Every spread kept</h2>
        </div>
      </div>
      <div className="filter-row">
        {(["all", "shadow", "flow", "mixed"] as const).map((item) => (
          <button key={item} className={kind === item ? "btn btn-gold" : "btn"} type="button" onClick={() => setKind(item)} aria-pressed={kind === item}>
            {item === "all" ? "All" : item === "mixed" ? "Woven" : item === "shadow" ? "Shadow" : "Flow"}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Filter archive</span>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="A card, a date, a phrase" />
      </label>
      {items.length === 0 ? <p className="crystal empty">No readings match.</p> : null}
      <div className="stack">
        {items.map((reading) => (
          <article key={reading.id} className="crystal stack">
            <div className="view-head">
              <div>
                <p className="eyebrow">
                  {reading.date} · {reading.spreadSize} cards · {labelType(reading.type)}
                </p>
                <h3>{reading.oracle}</h3>
              </div>
              <button className="btn" type="button" aria-expanded={open === reading.id} onClick={() => setOpen(open === reading.id ? null : reading.id)}>
                {open === reading.id ? "Hide" : "Open"}
              </button>
            </div>
            {open === reading.id ? <Spread reading={reading} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView() {
  const { db, updateSettings, setName, restore, resetAll } = useOs();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>The temple's keys</h2>
        </div>
      </div>
      <article className="crystal stack">
        <label className="field">
          <span>What should the temple call you?</span>
          <input value={db.profile.name} onChange={(event) => setName(event.target.value)} autoComplete="nickname" />
        </label>
        <Toggle label="Dark mode" hint="Void crystal. Turn off for temple dawn." checked={db.settings.darkMode} onClick={() => updateSettings({ darkMode: !db.settings.darkMode })} />
        <Toggle label="High contrast" hint="Stronger edges and brighter text." checked={db.settings.highContrast} onClick={() => updateSettings({ highContrast: !db.settings.highContrast })} />
        <Toggle label="Animations" hint="Drifting stars and soft motion." checked={db.settings.animations} onClick={() => updateSettings({ animations: !db.settings.animations })} />
        <Toggle
          label="Reduced motion"
          hint="Stops the starfield and shortens transitions. Also follows your system setting."
          checked={db.settings.reducedMotion}
          onClick={() => updateSettings({ reducedMotion: !db.settings.reducedMotion })}
        />
      </article>
      <article className="crystal stack">
        <p className="eyebrow">Archive file</p>
        <p>Everything lives in this browser. Export a JSON file to keep a copy, or import one to restore it.</p>
        <div className="row-actions">
          <button
            className="btn btn-gold"
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `mystic-command-center-${db.dailyState?.date ?? "export"}.json`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Export data
          </button>
          <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
            Import data
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/json"
            aria-label="Import temple archive"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const ok = restore(JSON.parse(String(reader.result)) as unknown);
                  setNotice(ok ? "Archive restored." : "That file is not a temple archive.");
                } catch {
                  setNotice("That file could not be read.");
                }
              };
              reader.readAsText(file);
            }}
          />
        </div>
        {notice ? <p role="status">{notice}</p> : null}
        {confirm ? (
          <div className="row-actions">
            <button
              className="btn btn-gold"
              type="button"
              onClick={() => {
                resetAll();
                setConfirm(false);
                setNotice("The temple was cleared.");
              }}
            >
              Confirm reset
            </button>
            <button className="btn" type="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={() => setConfirm(true)}>
            Reset application
          </button>
        )}
      </article>
    </section>
  );
}

function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const hits = searchDb(useOs().db, query);
  return (
    <section className="stack">
      <div className="view-head">
        <div>
          <p className="eyebrow">Global search</p>
          <h2>
            {hits.length} match{hits.length === 1 ? "" : "es"}
          </h2>
        </div>
        <button className="btn" type="button" onClick={onClear}>
          Clear search
        </button>
      </div>
      {hits.length === 0 ? (
        <p className="crystal empty">Nothing in the journal, cards, signs, messages, or dragons matches that.</p>
      ) : (
        <ul className="list crystal">
          {hits.map((hit, index) => (
            <li key={`${hit.kind}-${hit.when}-${index}`} className="entry">
              <p className="eyebrow">{hit.kind}</p>
              <h3>{hit.title}</h3>
              <p>{hit.excerpt}</p>
              <p className="meta">{formatWhen(hit.when)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Spread({ reading }: { reading: Reading }) {
  return (
    <div className="stack">
      <Omen type={reading.type} />
      <blockquote className="oracle">{reading.oracle}</blockquote>
      <div className="spread" data-size={String(reading.spreadSize)}>
        {reading.cards.map((card) => (
          <article key={`${reading.id}-${card.position}-${card.id}`} className={card.reversed ? "tarot is-reversed" : "tarot"}>
            <header>
              <span>{card.reversed ? "Reversed" : "Upright"}</span>
              <span>{card.position}</span>
            </header>
            <SuitMark suit={card.suit} />
            <h3>{card.name}</h3>
            <p className="keywords">{card.keywords.join(" · ")}</p>
          </article>
        ))}
      </div>
      <div className="reading-list">
        {reading.cards.map((card) => (
          <article key={`${card.position}-${card.id}-text`} className="crystal">
            <p className="eyebrow">
              {card.position} · {card.reversed ? "Reversed" : "Upright"}
            </p>
            <h3>{card.name}</h3>
            <p>{card.meaning}</p>
            <p>
              <strong>Prompt. </strong>
              {card.prompt}
            </p>
            <p>
              <strong>Action. </strong>
              {card.action}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Omen({ type }: { type: ReadingType }) {
  if (type === "shadow") {
    return (
      <div className="banner banner-shadow">
        <p className="eyebrow">Shadow Reading</p>
        <h3>Three or more cards are reversed</h3>
        <p>Not a verdict — a mirror. Something wants a smaller, truer step.</p>
      </div>
    );
  }
  if (type === "flow") {
    return (
      <div className="banner banner-flow">
        <p className="eyebrow">Flow State</p>
        <h3>Every card stands upright</h3>
        <p>The current is open. Keep the next action small enough to actually take.</p>
      </div>
    );
  }
  return null;
}

function Numbers({ nums }: { nums: number[] }) {
  const info = inspectNumbers(nums);
  const notes = [
    ...info.items.filter((item) => item.angel).map((item) => `${item.value} is an angel number`),
    ...info.mirrors.map((pair) => `Mirrored pair: ${pair}`),
    ...info.runs.map((run) => `Sequence: ${run}`),
    ...info.echoes,
  ];
  const repeats = [...new Set(info.items.filter((item) => item.repeat).map((item) => item.value))];
  if (repeats.length) notes.push(`Repeated: ${repeats.join(", ")}`);
  return (
    <div className="stack">
      <ol className="num-row">
        {info.items.map((item, index) => {
          const kind = item.angel ? "Angel number" : item.palindrome ? "Mirrored number" : item.repeat ? "Repeated number" : "Number";
          return (
            <li key={`${item.value}-${index}`} className={item.angel ? "num is-angel" : item.palindrome || item.repeat ? "num is-special" : "num"}>
              <span className="num-value">{item.value}</span>
              <span className="num-tag">{item.angel ? "Angel" : item.palindrome ? "Mirror" : item.repeat ? "Repeat" : kind === "Number" ? "" : ""}</span>
              <span className="sr-only">{kind}</span>
            </li>
          );
        })}
      </ol>
      <p className="meta">{notes.length ? notes.join(" · ") : "No angel numbers, mirrors, or repeating patterns today. A quiet field is still a message."}</p>
    </div>
  );
}

function EntryList({
  items,
  empty,
  pending,
  setPending,
  onRemove,
}: {
  items: { id: string; kicker: string; title: string; body: string }[];
  empty: string;
  pending: string | null;
  setPending: (id: string | null) => void;
  onRemove: (id: string) => void;
}) {
  if (!items.length) return <p className="crystal empty">{empty}</p>;
  return (
    <ul className="list crystal">
      {items.map((item) => (
        <li key={item.id} className="entry">
          <p className="eyebrow">{item.kicker}</p>
          <h3>{item.title}</h3>
          <p className="body-text">{item.body}</p>
          {pending === item.id ? (
            <div className="row-actions">
              <button className="btn" type="button" onClick={() => { onRemove(item.id); setPending(null); }}>
                Confirm remove
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setPending(null)}>
                Keep
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost" type="button" onClick={() => setPending(item.id)}>
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Toggle({ label, hint, checked, onClick }: { label: string; hint: string; checked: boolean; onClick: () => void }) {
  return (
    <button className={checked ? "switch is-on" : "switch"} type="button" role="switch" aria-checked={checked} onClick={onClick}>
      <span className="knob" aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <br />
        <span className="meta">{hint}</span>
      </span>
    </button>
  );
}

function Progress({ xp }: { xp: number }) {
  const progress = levelProgress(xp);
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct} aria-label={`Level progress ${progress.pct} percent`}>
      <span style={{ width: `${progress.pct}%` }} />
    </div>
  );
}

function useTodayReading() {
  const { db } = useOs();
  return readingById(db, db.dailyState?.readingId);
}

function labelType(type: ReadingType) {
  if (type === "shadow") return "Shadow Reading";
  if (type === "flow") return "Flow State";
  return "Woven";
}

function TempleMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="8" fill="none" stroke="var(--violet)" strokeWidth="1.2" />
      <path d="M24 6 L26 22 L24 20 L22 22 Z M24 42 L26 26 L24 28 L22 26 Z M6 24 L22 22 L20 24 L22 26 Z M42 24 L26 22 L28 24 L26 26 Z" fill="var(--gold)" />
    </svg>
  );
}

function SuitMark({ suit }: { suit: string }) {
  const common = { className: "tarot-seal", viewBox: "0 0 64 64", "aria-hidden": true as const };
  if (suit === "Cups") {
    return (
      <svg {...common}>
        <path d="M18 16h28l-3 18a11 11 0 0 1-22 0Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M32 40v8M24 52h16" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (suit === "Wands") {
    return (
      <svg {...common}>
        <path d="M20 50 L40 14" stroke="currentColor" strokeWidth="2" />
        <path d="M34 12h10v8M30 18l8-2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (suit === "Swords") {
    return (
      <svg {...common}>
        <path d="M32 10v36M24 46h16M28 18h8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (suit === "Pentacles") {
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M32 22l2.6 6.2H41l-5.2 4 2 6.4L32 35.2 26.2 38.6l2-6.4-5.2-4h6.4Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}

function MoonMark({ frac, name, illumination, themeKey }: { frac: number; name: string; illumination: number; themeKey: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = 56;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const styles = getComputedStyle(document.documentElement);
    const gold = styles.getPropertyValue("--gold").trim() || "#e6c27a";
    const south = /Australia|Auckland|Lord_Howe|Chatham|Antarctica|Buenos_Aires|Sao_Paulo|Santiago|Johannesburg/.test(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    const phi = frac * Math.PI * 2;
    const sunX = Math.sin(phi) * (south ? -1 : 1);
    const sunZ = -Math.cos(phi);
    const cx = size / 2;
    const cy = size / 2;
    const radius = 22;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.fillStyle = "rgba(8, 6, 18, 0.9)";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5 - cx) / radius;
        const ny = (y + 0.5 - cy) / radius;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const z = Math.sqrt(1 - r2);
        if (nx * sunX + z * sunZ <= 0) ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }, [frac, themeKey]);
  return <canvas ref={ref} className="moon-canvas" role="img" aria-label={`${name}, ${illumination} percent illuminated`} />;
}

function Starfield({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stars = Array.from({ length: 52 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      a: Math.random() * Math.PI * 2,
      s: 0.2 + Math.random() * 0.55,
      gold: Math.random() > 0.84,
    }));
    let frame = 0;
    let stop = false;
    const draw = (time: number) => {
      if (stop) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const star of stars) {
        const twinkle = enabled ? 0.35 + Math.sin(time * 0.001 * star.s + star.a) * 0.35 : 0.5;
        const y = enabled ? (star.y * h + time * 0.006 * star.s) % h : star.y * h;
        ctx.beginPath();
        ctx.fillStyle = star.gold ? `rgba(230, 194, 122, ${0.25 + twinkle * 0.5})` : `rgba(214, 206, 255, ${0.12 + twinkle * 0.35})`;
        ctx.arc(star.x * w, y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (enabled) frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      stop = true;
      window.cancelAnimationFrame(frame);
    };
  }, [enabled]);
  return <canvas ref={ref} className="stars" aria-hidden="true" />;
}

type SpeechAlt = { transcript: string };
type SpeechResultLike = { isFinal: boolean; 0?: SpeechAlt; [index: number]: SpeechAlt | undefined };
type SpeechEventLike = Event & { results: { length: number; [index: number]: SpeechResultLike | undefined } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition() {
  if (typeof window === "undefined") return null;
  const host = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}
