import { useEffect, useRef, useState } from "react";

const API = "http://localhost:5000/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const initial = (name) =>
  String(name || "?").trim().charAt(0).toUpperCase() || "?";

/* ---------- Small UI helpers (no extra dependencies) ---------- */

const ICONS = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  layers: (
    <>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  swap: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  trend: (
    <>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/* Counts up to a value. Respects prefers-reduced-motion. */
function AnimatedNumber({ value, format = (v) => v, duration = 700 }) {
  const target = Number(value || 0);
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      fromRef.current = target;
      setDisplay(target);
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      fromRef.current = current;
      setDisplay(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <>{format(display)}</>;
}

/* Decorative rupee symbols. Sits behind everything, never clickable. */
const RUPEES = [
  { top: 5, left: 3, size: 210, rotate: -12, opacity: 0.05 },
  { top: 18, left: 76, size: 310, rotate: 10, opacity: 0.045 },
  { top: 50, left: -3, size: 340, rotate: 8, opacity: 0.04 },
  { top: 62, left: 58, size: 190, rotate: -8, opacity: 0.05 },
  { top: 84, left: 24, size: 250, rotate: 14, opacity: 0.04 },
  { top: 38, left: 42, size: 130, rotate: -6, opacity: 0.035 },
  { top: 90, left: 86, size: 160, rotate: 5, opacity: 0.045 },
];

function BackgroundDecor() {
  return (
    <div className="su-bg" aria-hidden="true">
      {RUPEES.map((item, index) => (
        <span
          key={index}
          className="su-rupee"
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            opacity: item.opacity,
            fontSize: `clamp(${Math.round(item.size * 0.4)}px, ${(
              item.size / 14
            ).toFixed(1)}vw, ${item.size}px)`,
            transform: `rotate(${item.rotate}deg)`,
          }}
        >
          ₹
        </span>
      ))}
    </div>
  );
}

function Brand({ centered = false }) {
  return (
    <div className={`su-brand ${centered ? "is-centered" : ""}`}>
      <span className="su-mark">₹</span>
      <div>
        <h1 className="su-logo">SettleUp</h1>
        <p className="su-tagline">Split expenses. Settle smarter.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("settleup_token") || ""
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("settleup_user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [groupName, setGroupName] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [recordedSettlements, setRecordedSettlements] = useState([]);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  async function apiFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status}).`);
    }

    return data;
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const body =
        authMode === "login"
          ? { email: authEmail.trim(), password: authPassword }
          : {
              name: authName.trim(),
              email: authEmail.trim(),
              password: authPassword,
            };

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await readResponse(response);

      if (authMode === "register") {
        setAuthMode("login");
        setAuthPassword("");
        setAuthError("Registration successful. Please log in.");
        return;
      }

      if (!data.token || !data.user) {
        throw new Error("Login response is missing the token or user.");
      }

      localStorage.setItem("settleup_token", data.token);
      localStorage.setItem("settleup_user", JSON.stringify(data.user));

      setToken(data.token);
      setCurrentUser(data.user);
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("settleup_token");
    localStorage.removeItem("settleup_user");

    setToken("");
    setCurrentUser(null);
    setGroups([]);
    setSelectedGroup(null);
    setExpenses([]);
    setBalances({});
    setSettlements([]);
    setRecordedSettlements([]);
    setError("");
  }

  async function fetchGroups() {
    try {
      const response = await apiFetch(`${API}/groups`);
      const data = await readResponse(response);
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || "Could not load groups.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroupData(groupId) {
    if (!groupId) return;

    setLoadingDetails(true);
    setError("");

    try {
      const results = await Promise.all([
        apiFetch(`${API}/expenses/group/${groupId}`),
        apiFetch(`${API}/expenses/group/${groupId}/balances`),
        apiFetch(`${API}/expenses/group/${groupId}/settle-up`),
        apiFetch(`${API}/settlements/group/${groupId}`),
      ]);

      const data = await Promise.all(results.map(readResponse));

      setExpenses(data[0].expenses || []);
      setBalances(data[1].balances || {});
      setSettlements(data[2].transactions || data[2].settlements || []);
      setRecordedSettlements(data[3].settlements || []);
    } catch (err) {
      setError(err.message || "Could not load this group's details.");
    } finally {
      setLoadingDetails(false);
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchGroups();
    } else {
      setLoading(false);
    }
    // Load groups when login state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function selectGroup(group) {
    if (!group?._id) {
      setError("This group has an invalid ID. Refresh your groups.");
      return;
    }

    setSelectedGroup(group);
    setExpenses([]);
    setBalances({});
    setSettlements([]);
    setRecordedSettlements([]);
    setPaidBy("");
    setSplitAmong([]);
    setShowExpenseForm(false);
    setError("");

    fetchGroupData(group._id);
  }

  async function createGroup(event) {
    event.preventDefault();
    setError("");

    const members = membersInput
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);

    if (!groupName.trim() || members.length === 0) {
      setError("Enter a group name and at least one member.");
      return;
    }

    if (new Set(members).size !== members.length) {
      setError("Remove duplicate member names.");
      return;
    }

    setSavingGroup(true);

    try {
      const response = await apiFetch(`${API}/groups`, {
        method: "POST",
        body: JSON.stringify({
          name: groupName.trim(),
          members,
          createdBy: currentUser?.name || members[0],
        }),
      });

      const data = await readResponse(response);

      setGroupName("");
      setMembersInput("");
      setShowGroupForm(false);

      await fetchGroups();

      if (data.group) {
        selectGroup(data.group);
      }
    } catch (err) {
      setError(err.message || "Could not create group.");
    } finally {
      setSavingGroup(false);
    }
  }

  function toggleMember(member) {
    setSplitAmong((previous) =>
      previous.includes(member)
        ? previous.filter((item) => item !== member)
        : [...previous, member]
    );
  }

  async function createExpense(event) {
    event.preventDefault();

    if (!selectedGroup) {
      setError("Select a group first.");
      return;
    }

    if (
      !expenseTitle.trim() ||
      !Number.isFinite(Number(expenseAmount)) ||
      Number(expenseAmount) <= 0 ||
      !paidBy ||
      splitAmong.length === 0
    ) {
      setError("Fill in the expense details and select split members.");
      return;
    }

    setSavingExpense(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/expenses`, {
        method: "POST",
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: Number(expenseAmount),
          paidBy,
          groupId: selectedGroup._id,
          splitAmong,
        }),
      });

      await readResponse(response);

      setExpenseTitle("");
      setExpenseAmount("");
      setPaidBy("");
      setSplitAmong([]);
      setShowExpenseForm(false);

      await fetchGroupData(selectedGroup._id);
    } catch (err) {
      setError(err.message || "Could not save the expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  async function completeRecordedPayment(paymentId) {
    if (!paymentId || !selectedGroup) return;

    setProcessingPayment(paymentId);
    setError("");

    try {
      const response = await apiFetch(
        `${API}/settlements/${paymentId}/complete`,
        { method: "PATCH" }
      );

      await readResponse(response);
      await fetchGroupData(selectedGroup._id);
    } catch (err) {
      setError(err.message || "Could not complete payment.");
    } finally {
      setProcessingPayment(null);
    }
  }

  async function recordSuggestedPayment(from, to, amount, paymentKey) {
    if (!selectedGroup || !from || !to || !Number.isFinite(amount) || amount <= 0) {
      setError("Invalid suggested payment details.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm that ${from} paid ${to} ${money(amount)}?`
    );

    if (!confirmed) return;

    setProcessingPayment(paymentKey);
    setError("");

    try {
      const response = await apiFetch(`${API}/settlements`, {
        method: "POST",
        body: JSON.stringify({
          groupId: selectedGroup._id,
          paidBy: from,
          paidTo: to,
          amount,
        }),
      });

      const data = await readResponse(response);

      if (!data.settlement?._id) {
        throw new Error("Payment was recorded but no payment ID was returned.");
      }

      const completeResponse = await apiFetch(
        `${API}/settlements/${data.settlement._id}/complete`,
        { method: "PATCH" }
      );

      await readResponse(completeResponse);
      await fetchGroupData(selectedGroup._id);
    } catch (err) {
      setError(err.message || "Could not record the payment.");
    } finally {
      setProcessingPayment(null);
    }
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  /* ---------------- Login / Register ---------------- */

  if (!token) {
    const authIsSuccess = authError.startsWith("Registration successful");

    return (
      <div className="su-app">
        <BackgroundDecor />
        <main className="su-auth">
          <form onSubmit={handleAuth} className="su-auth-card su-enter">
            <Brand centered />

            <h2 className="su-auth-title">
              {authMode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="su-auth-sub">
              {authMode === "login"
                ? "Log in to manage your shared expenses."
                : "Start splitting expenses with your friends."}
            </p>

            {authError && (
              <p
                className={`su-alert ${
                  authIsSuccess ? "su-alert-ok" : "su-alert-err"
                }`}
                role="alert"
              >
                <Icon name={authIsSuccess ? "check" : "alert"} size={16} />
                <span>{authError}</span>
              </p>
            )}

            {authMode === "register" && (
              <label className="su-label">
                <span>Full name</span>
                <input
                  className="su-input"
                  required
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
            )}

            <label className="su-label">
              <span>Email</span>
              <input
                className="su-input"
                type="email"
                required
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label className="su-label">
              <span>Password</span>
              <input
                className="su-input"
                type="password"
                required
                minLength={8}
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
              />
            </label>

            <button className="su-btn su-btn-block" disabled={authLoading}>
              {authLoading ? (
                <>
                  <span className="su-spinner" /> Please wait...
                </>
              ) : authMode === "login" ? (
                "Log in"
              ) : (
                "Create account"
              )}
            </button>

            <button
              type="button"
              className="su-btn su-btn-ghost su-btn-block"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
            >
              {authMode === "login"
                ? "Need an account? Register"
                : "Already registered? Log in"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  /* ---------------- Dashboard ---------------- */

  return (
    <div className="su-app">
      <BackgroundDecor />

      <main className="su-shell">
        <header className="su-header">
          <Brand />
          <div className="su-user">
            <span className="su-user-chip">
              <span className="su-avatar">
                {initial(currentUser?.name || "Me")}
              </span>
              <span className="su-user-name">
                {currentUser?.name || "My account"}
              </span>
            </span>
            <button className="su-btn su-btn-ghost" onClick={logout}>
              <Icon name="logout" size={16} />
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="su-alert su-alert-err su-enter" role="alert">
            <Icon name="alert" size={18} />
            <span className="su-alert-text">{error}</span>
            <button
              className="su-alert-close"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <section className="su-stats">
          <article className="su-stat su-enter" style={{ animationDelay: "0ms" }}>
            <span className="su-icon su-icon-blue">
              <Icon name="layers" size={22} />
            </span>
            <div className="su-stat-body">
              <p className="su-stat-label">Total groups</p>
              <h2 className="su-stat-value">
                <AnimatedNumber
                  value={groups.length}
                  format={(v) => Math.round(v)}
                />
              </h2>
            </div>
          </article>

          <article className="su-stat su-enter" style={{ animationDelay: "70ms" }}>
            <span className="su-icon su-icon-green">
              <Icon name="trend" size={22} />
            </span>
            <div className="su-stat-body">
              <p className="su-stat-label">Selected group expenses</p>
              <h2 className="su-stat-value">
                <AnimatedNumber value={totalExpenses} format={money} />
              </h2>
            </div>
          </article>

          <article className="su-stat su-enter" style={{ animationDelay: "140ms" }}>
            <span className="su-icon su-icon-sky">
              <Icon name="eye" size={22} />
            </span>
            <div className="su-stat-body">
              <p className="su-stat-label">Currently selected</p>
              <h2 className="su-stat-value su-stat-text">
                {selectedGroup?.name || "None"}
              </h2>
            </div>
          </article>
        </section>

        <section className="su-card su-enter" style={{ animationDelay: "200ms" }}>
          <div className="su-section-head">
            <div>
              <h2 className="su-title">Your groups</h2>
              <p className="su-sub">Select a group to view its details.</p>
            </div>
            <button
              className="su-btn"
              onClick={() => setShowGroupForm(!showGroupForm)}
            >
              <Icon name={showGroupForm ? "x" : "plus"} size={16} />
              {showGroupForm ? "Cancel" : "Create group"}
            </button>
          </div>

          {showGroupForm && (
            <form onSubmit={createGroup} className="su-form su-enter">
              <div className="su-form-grid">
                <label className="su-label">
                  <span>Group name</span>
                  <input
                    className="su-input"
                    required
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="e.g. Kullu Trip"
                  />
                </label>
                <label className="su-label">
                  <span>Members, separated by commas</span>
                  <input
                    className="su-input"
                    required
                    value={membersInput}
                    onChange={(event) => setMembersInput(event.target.value)}
                    placeholder="Sahil, Rahul, Aman"
                  />
                </label>
              </div>
              <div className="su-form-actions">
                <button className="su-btn" disabled={savingGroup}>
                  {savingGroup ? (
                    <>
                      <span className="su-spinner" /> Creating...
                    </>
                  ) : (
                    "Save group"
                  )}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="su-loading">
              <span className="su-spinner" /> Loading groups...
            </p>
          ) : groups.length === 0 ? (
            <div className="su-empty">
              <span className="su-icon su-icon-blue">
                <Icon name="users" size={22} />
              </span>
              <p>No groups yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="su-groups">
              {groups.map((group, index) => {
                const isSelected = selectedGroup?._id === group._id;

                return (
                  <button
                    key={group._id}
                    className={`su-group su-enter ${isSelected ? "is-selected" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                    onClick={() => selectGroup(group)}
                    aria-pressed={isSelected}
                  >
                    <span className="su-group-top">
                      <span className="su-icon su-icon-blue su-icon-sm">
                        <Icon name="users" size={18} />
                      </span>
                      {isSelected ? (
                        <span className="su-badge su-badge-blue">
                          <Icon name="check" size={12} /> Selected
                        </span>
                      ) : (
                        <span className="su-badge">
                          {group.members?.length || 0} members
                        </span>
                      )}
                    </span>
                    <strong className="su-group-name">{group.name}</strong>
                    <span className="su-group-members">
                      {(group.members || []).join(", ")}
                    </span>
                    <span className="su-group-cta">
                      {isSelected ? "Viewing group" : "Open group"}
                      <Icon name="arrow" size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedGroup && (
          <section key={selectedGroup._id} className="su-card su-enter">
            <div className="su-section-head">
              <div>
                <h2 className="su-title">{selectedGroup.name}</h2>
                <p className="su-sub">
                  Members: {(selectedGroup.members || []).join(", ")}
                </p>
              </div>
              <button
                className="su-btn"
                onClick={() => setShowExpenseForm(!showExpenseForm)}
              >
                <Icon name={showExpenseForm ? "x" : "plus"} size={16} />
                {showExpenseForm ? "Cancel" : "Add expense"}
              </button>
            </div>

            {loadingDetails && (
              <p className="su-loading">
                <span className="su-spinner" /> Loading group details...
              </p>
            )}

            {showExpenseForm && (
              <form onSubmit={createExpense} className="su-form su-enter">
                <div className="su-form-grid">
                  <label className="su-label">
                    <span>Expense title</span>
                    <input
                      className="su-input"
                      required
                      value={expenseTitle}
                      onChange={(event) => setExpenseTitle(event.target.value)}
                      placeholder="e.g. Hotel"
                    />
                  </label>

                  <label className="su-label">
                    <span>Amount (₹)</span>
                    <input
                      className="su-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={expenseAmount}
                      onChange={(event) => setExpenseAmount(event.target.value)}
                      placeholder="0.00"
                    />
                  </label>

                  <label className="su-label">
                    <span>Who paid?</span>
                    <select
                      className="su-input"
                      required
                      value={paidBy}
                      onChange={(event) => setPaidBy(event.target.value)}
                    >
                      <option value="">Select payer</option>
                      {(selectedGroup.members || []).map((member, index) => (
                        <option key={`${member}-${index}`} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="su-label">
                  <span>Split among</span>
                  <div className="su-chips">
                    {(selectedGroup.members || []).map((member, index) => {
                      const checked = splitAmong.includes(member);

                      return (
                        <label
                          key={`${member}-${index}`}
                          className={`su-chip ${checked ? "is-on" : ""}`}
                        >
                          <input
                            className="sr-only"
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(member)}
                          />
                          <span className="su-chip-dot">
                            {checked ? <Icon name="check" size={12} /> : null}
                          </span>
                          {member}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="su-form-actions">
                  <button className="su-btn" disabled={savingExpense}>
                    {savingExpense ? (
                      <>
                        <span className="su-spinner" /> Saving...
                      </>
                    ) : (
                      "Save expense"
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="su-details">
              <article className="su-panel su-enter" style={{ animationDelay: "0ms" }}>
                <div className="su-panel-head">
                  <h3>
                    <Icon name="receipt" size={18} /> Group expenses
                  </h3>
                  <span className="su-badge">{expenses.length}</span>
                </div>
                {expenses.length === 0 ? (
                  <p className="su-empty-text">No expenses yet.</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense._id} className="su-row">
                      <span className="su-row-main">
                        <span className="su-avatar su-avatar-blue">
                          <Icon name="receipt" size={16} />
                        </span>
                        <span className="su-row-text">
                          <strong>{expense.title}</strong>
                          <small>Paid by {expense.paidBy}</small>
                        </span>
                      </span>
                      <strong className="su-amount">{money(expense.amount)}</strong>
                    </div>
                  ))
                )}
              </article>

              <article className="su-panel su-enter" style={{ animationDelay: "70ms" }}>
                <div className="su-panel-head">
                  <h3>
                    <Icon name="wallet" size={18} /> Member balances
                  </h3>
                </div>
                {Object.keys(balances).length === 0 ? (
                  <p className="su-empty-text">No balance information yet.</p>
                ) : (
                  Object.entries(balances).map(([member, balance]) => {
                    const value = Number(balance);
                    const tone = value > 0 ? "pos" : value < 0 ? "neg" : "zero";

                    return (
                      <div key={member} className="su-row">
                        <span className="su-row-main">
                          <span className="su-avatar">{initial(member)}</span>
                          <span className="su-row-text">
                            <strong>{member}</strong>
                            <small>
                              {value > 0
                                ? "Gets back"
                                : value < 0
                                  ? "Owes"
                                  : "All settled"}
                            </small>
                          </span>
                        </span>
                        <strong className={`su-amount su-amount-${tone}`}>
                          {value > 0 ? "+" : ""}
                          {money(balance)}
                        </strong>
                      </div>
                    );
                  })
                )}
                <p className="su-hint">
                  Positive = money to receive. Negative = money owed.
                </p>
              </article>

              <article className="su-panel su-enter" style={{ animationDelay: "140ms" }}>
                <div className="su-panel-head">
                  <h3>
                    <Icon name="swap" size={18} /> Suggested minimum payments
                  </h3>
                  <span className="su-badge">{settlements.length}</span>
                </div>
                {settlements.length === 0 ? (
                  <p className="su-empty-text">No payments suggested.</p>
                ) : (
                  settlements.map((settlement, index) => {
                    const from =
                      settlement.from ||
                      settlement.fromMember ||
                      settlement.debtor ||
                      settlement.paidBy;
                    const to =
                      settlement.to ||
                      settlement.toMember ||
                      settlement.creditor ||
                      settlement.paidTo;
                    const amount = Number(
                      settlement.amount ?? settlement.value
                    );
                    const key = `${from}-${to}-${index}`;

                    return (
                      <div key={key} className="su-pay">
                        <div className="su-pay-info">
                          <p className="su-pay-line">
                            <strong>{from}</strong>
                            <span className="su-pay-arrow">
                              <Icon name="arrow" size={14} />
                            </span>
                            <strong>{to}</strong>
                          </p>
                          <div className="su-amount su-amount-sky">
                            {money(amount)}
                          </div>
                        </div>
                        <button
                          className="su-btn su-btn-success su-btn-sm"
                          disabled={Boolean(processingPayment)}
                          onClick={() =>
                            recordSuggestedPayment(from, to, amount, key)
                          }
                        >
                          {processingPayment === key ? (
                            <>
                              <span className="su-spinner" /> Processing...
                            </>
                          ) : (
                            <>
                              <Icon name="check" size={15} /> Mark as Paid
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </article>

              <article className="su-panel su-enter" style={{ animationDelay: "210ms" }}>
                <div className="su-panel-head">
                  <h3>
                    <Icon name="check" size={18} /> Recorded payments
                  </h3>
                  <span className="su-badge">{recordedSettlements.length}</span>
                </div>
                {recordedSettlements.length === 0 ? (
                  <p className="su-empty-text">No recorded payments yet.</p>
                ) : (
                  recordedSettlements.map((payment) => (
                    <div key={payment._id} className="su-pay">
                      <div className="su-pay-info">
                        <p className="su-pay-line">
                          <strong>{payment.paidBy}</strong>
                          <span className="su-pay-arrow">
                            <Icon name="arrow" size={14} />
                          </span>
                          <strong>{payment.paidTo}</strong>
                        </p>
                        <div className="su-pay-meta">
                          <span
                            className={`su-badge ${
                              payment.status === "completed"
                                ? "su-badge-green"
                                : "su-badge-amber"
                            }`}
                          >
                            {payment.status}
                          </span>
                          <strong className="su-amount">
                            {money(payment.amount)}
                          </strong>
                        </div>
                      </div>
                      {payment.status !== "completed" && (
                        <button
                          className="su-btn su-btn-success su-btn-sm"
                          disabled={Boolean(processingPayment)}
                          onClick={() => completeRecordedPayment(payment._id)}
                        >
                          {processingPayment === payment._id ? (
                            <>
                              <span className="su-spinner" /> Processing...
                            </>
                          ) : (
                            "Mark complete"
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </article>
            </div>
          </section>
        )}

        <footer className="su-footer">
          SettleUp · Split expenses. Settle smarter.
        </footer>
      </main>
    </div>
  );
}
