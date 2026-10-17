import { useEffect, useState } from "react";

function App() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState([]);
  const [savingExpense, setSavingExpense] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [recordedSettlements, setRecordedSettlements] = useState([]);
  const [loadingRecordedSettlements, setLoadingRecordedSettlements] = useState(false);

  async function fetchGroups() {
    try {
      const response = await fetch("http://localhost:5000/api/groups");

      if (!response.ok) {
        throw new Error("Could not load groups");
      }

      const data = await response.json();
      setGroups(data.groups || []);
      setError("");
    } catch {
      setError("Could not load groups. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpenses(groupId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/expenses/group/${groupId}`
      );

      if (!response.ok) {
        throw new Error("Could not load expenses");
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch {
      setExpenses([]);
      setError("Could not load expenses for this group.");
    }
  }

  async function fetchBalances(groupId) {
    setLoadingBalances(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/expenses/group/${groupId}/balances`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load balances.");
      }

      setBalances(data.balances || {});
    } catch (err) {
      setBalances({});
      setError(err.message || "Could not load balances.");
    } finally {
      setLoadingBalances(false);
    }
  }

  async function fetchSettlements(groupId) {
    setLoadingSettlements(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/expenses/group/${groupId}/settle-up`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not calculate settlements.");
      }

      setSettlements(data.settlements || data.transactions || []);
    } catch (err) {
      setSettlements([]);
      setError(err.message || "Could not calculate settlements.");
    } finally {
      setLoadingSettlements(false);
    }
  }
 async function fetchRecordedSettlements(groupId) {
  setLoadingRecordedSettlements(true);

  try {
    const response = await fetch(
      `http://localhost:5000/api/settlements/group/${groupId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load recorded payments."
      );
    }

    setRecordedSettlements(data.settlements || []);
  } catch (err) {
    setRecordedSettlements([]);
    setError(err.message || "Could not load recorded payments.");
  } finally {
    setLoadingRecordedSettlements(false);
  }
}

async function markPaymentCompleted(paymentId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/settlements/${paymentId}/complete`,
      {
        method: "PATCH",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not complete payment."
      );
    }

    if (selectedGroup) {
      await fetchRecordedSettlements(selectedGroup._id);
    }
  } catch (err) {
    setError(err.message || "Could not complete payment.");
  }
}


  useEffect(() => {
    fetchGroups();
  }, []);

  async function createGroup(event) {
    event.preventDefault();
    setError("");

    const memberList = members
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);

    if (!groupName.trim() || memberList.length === 0) {
      setError("Enter a group name and at least one member.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          members: memberList,
          createdBy: memberList[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create group.");
      }

      setGroupName("");
      setMembers("");
      setShowForm(false);
      await fetchGroups();
    } catch (err) {
      setError(err.message || "Could not create group.");
    } finally {
      setSaving(false);
    }
  }

  async function createExpense(event) {
    event.preventDefault();
    setError("");

    if (!selectedGroup) {
      setError("Please select a group first.");
      return;
    }

    if (
      !expenseTitle.trim() ||
      !expenseAmount ||
      !Number.isFinite(Number(expenseAmount)) ||
      Number(expenseAmount) <= 0 ||
      !paidBy ||
      splitAmong.length === 0
    ) {
      setError("Please fill in all expense details.");
      return;
    }

    setSavingExpense(true);

    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: Number(expenseAmount),
          paidBy,
          groupId: selectedGroup._id,
          splitAmong,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create expense.");
      }

      setExpenseTitle("");
      setExpenseAmount("");
      setPaidBy("");
      setSplitAmong([]);
      setShowExpenseForm(false);

      await refreshGroupData(selectedGroup._id);
      alert("Expense added successfully!");
    } catch (err) {
      setError(err.message || "Could not create expense.");
    } finally {
      setSavingExpense(false);
    }
  }

 async function refreshGroupData(groupId) {
  await Promise.all([
    fetchExpenses(groupId),
    fetchBalances(groupId),
    fetchSettlements(groupId),
    fetchRecordedSettlements(groupId),
  ]);
}

  function selectGroup(group) {
    setSelectedGroup(group);
    setPaidBy("");
    setSplitAmong([]);
    setExpenses([]);
    setBalances({});
    setSettlements([]);
    setRecordedSettlements([]);
    setShowExpenseForm(false);
    setError("");
    refreshGroupData(group._id);
  }

  function toggleMember(member) {
    setSplitAmong((previous) =>
      previous.includes(member)
        ? previous.filter((item) => item !== member)
        : [...previous, member]
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold text-emerald-400">SettleUp</h1>
        <p className="mt-1 text-sm text-slate-400">
          Split expenses. Settle smarter.
        </p>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="mt-2 text-slate-400">
              Manage your groups and shared expenses in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {showForm ? "Cancel" : "+ Create Group"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Total Groups</p>
            <h3 className="mt-3 text-3xl font-bold">{groups.length}</h3>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Expenses in Selected Group</p>
            <h3 className="mt-3 text-3xl font-bold">{expenses.length}</h3>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Selected Group</p>
            <h3 className="mt-3 text-xl font-bold text-emerald-400">
              {selectedGroup ? selectedGroup.name : "None selected"}
            </h3>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={createGroup}
            className="mt-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-xl font-semibold">Create a group</h3>

            <input
              required
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name (e.g. Goa Trip)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-emerald-400"
            />

            <input
              required
              value={members}
              onChange={(event) => setMembers(event.target.value)}
              placeholder="Members separated by commas (e.g. Sahil, Rahul, Aman)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-emerald-400"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Save Group"}
            </button>
          </form>
        )}

        {error && <p className="mt-5 text-red-400">{error}</p>}

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-8">
          <h3 className="text-xl font-semibold">Your Groups</h3>

          {loading && (
            <p className="mt-4 text-slate-400">Loading groups...</p>
          )}

          {!loading && groups.length === 0 && !error && (
            <p className="mt-4 text-slate-400">No groups found yet.</p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <button
                key={group._id}
                type="button"
                onClick={() => selectGroup(group)}
                className={`w-full rounded-lg border p-5 text-left transition ${
                  selectedGroup?._id === group._id
                    ? "border-emerald-400 bg-slate-800"
                    : "border-slate-700 hover:border-emerald-400"
                }`}
              >
                <h4 className="text-lg font-semibold">{group.name}</h4>
                <p className="mt-2 text-sm text-slate-400">
                  {group.members?.length || 0} members
                </p>
                <p className="mt-3 text-sm text-emerald-400">
                  {selectedGroup?._id === group._id
                    ? "Selected"
                    : "Click to select →"}
                </p>
              </button>
            ))}
          </div>

          {selectedGroup && (
            <div className="mt-6 rounded-lg border border-emerald-500/40 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-lg font-semibold">{selectedGroup.name}</h4>

                <button
                  type="button"
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  {showExpenseForm ? "Cancel" : "+ Add Expense"}
                </button>
              </div>

              <p className="mt-4 text-sm text-slate-400">Group members</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedGroup.members?.map((member, index) => (
                  <span
                    key={`${member}-${index}`}
                    className="rounded-full bg-slate-800 px-3 py-1 text-sm"
                  >
                    {member}
                  </span>
                ))}
              </div>

              {showExpenseForm && (
                <form
                  onSubmit={createExpense}
                  className="mt-6 space-y-4 rounded-lg border border-slate-800 p-5"
                >
                  <h4 className="text-lg font-semibold">Add an expense</h4>

                  <input
                    required
                    value={expenseTitle}
                    onChange={(event) => setExpenseTitle(event.target.value)}
                    placeholder="Expense title (e.g. Pizza)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none focus:border-emerald-400"
                  />

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(event) => setExpenseAmount(event.target.value)}
                    placeholder="Amount in ₹"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 outline-none focus:border-emerald-400"
                  />

                  <label className="block text-sm text-slate-300">
                    Who paid?
                  </label>

                  <select
                    required
                    value={paidBy}
                    onChange={(event) => setPaidBy(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="">Select payer</option>
                    {selectedGroup.members?.map((member, index) => (
                      <option key={`${member}-${index}`} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>

                  <p className="text-sm text-slate-300">Split expense among:</p>

                  <div className="space-y-2">
                    {selectedGroup.members?.map((member, index) => (
                      <label
                        key={`${member}-${index}`}
                        className="flex items-center gap-3 rounded-lg bg-slate-900 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={splitAmong.includes(member)}
                          onChange={() => toggleMember(member)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <span>{member}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={savingExpense}
                    className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {savingExpense ? "Saving..." : "Save Expense"}
                  </button>
                </form>
              )}

              <div className="mt-8">
                <h4 className="text-lg font-semibold">Group Expenses</h4>

                {expenses.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No expenses found for this group yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {expenses.map((expense) => (
                      <div
                        key={expense._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 p-4"
                      >
                        <div>
                          <p className="font-semibold">{expense.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Paid by {expense.paidBy}
                          </p>
                        </div>
                        <p className="font-semibold text-emerald-400">
                          ₹{Number(expense.amount).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <h4 className="text-lg font-semibold">Member Balances</h4>

                {loadingBalances ? (
                  <p className="mt-3 text-sm text-slate-400">
                    Calculating balances...
                  </p>
                ) : Object.keys(balances).length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No balance information available yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {Object.entries(balances).map(([member, balance]) => (
                      <div
                        key={member}
                        className="flex items-center justify-between rounded-lg border border-slate-800 p-4"
                      >
                        <span>{member}</span>
                        <span
                          className={`font-semibold ${
                            balance > 0
                              ? "text-emerald-400"
                              : balance < 0
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {balance > 0 ? "+" : ""}
                          ₹{Number(balance).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  Positive means money to receive; negative means money owed.
                </p>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-6">
                <h4 className="text-lg font-semibold">Settle Up</h4>

                {loadingSettlements ? (
                  <p className="mt-3 text-sm text-slate-400">
                    Calculating settlements...
                  </p>
                ) : settlements.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No settlements needed, or no settlement data is available.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {settlements.map((item, index) => {
                      const from =
                        item.from || item.fromMember || item.debtor;
                      const to =
                        item.to || item.toMember || item.creditor;
                      const amount = item.amount ?? item.value;

                      return (
                        <div
                          key={`${from}-${to}-${index}`}
                          className="rounded-lg border border-slate-800 p-4"
                        >
                          <p>
                            <span className="font-semibold">{from}</span>
                            <span className="mx-2 text-slate-400">pays</span>
                            <span className="font-semibold">{to}</span>
                          </p>
                          <p className="mt-2 font-semibold text-emerald-400">
                            ₹{Number(amount).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
               
              <div className="mt-8 border-t border-slate-800 pt-6">
                <h4 className="text-lg font-semibold">Recorded Payments</h4>

                {loadingRecordedSettlements ? (
                  <p className="mt-3 text-sm text-slate-400">
                    Loading recorded payments...
                  </p>
                ) : recordedSettlements.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No recorded payments yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recordedSettlements.map((payment) => (
                      <div
                        key={payment._id}
                        className="rounded-lg border border-slate-800 p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <p>
                            <span className="font-semibold">{payment.paidBy}</span>
                            <span className="mx-2 text-slate-400">paid</span>
                            <span className="font-semibold">{payment.paidTo}</span>
                          </p>

                          <span className="font-semibold text-emerald-400">
                            ₹{Number(payment.amount).toFixed(2)}
                          </span>
                        </div>
<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
  <p className="text-sm text-slate-400">
    Status: {payment.status}
  </p>

  {payment.status === "pending" && (
    <button
      type="button"
      onClick={() => markPaymentCompleted(payment._id)}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
    >
      Mark as Completed
    </button>
  )}
</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedGroup(null);
                  setExpenses([]);
                  setBalances({});
                  setSettlements([]);
                  setShowExpenseForm(false);
                  setError("");
                }}
                className="mt-6 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
              >
                Back to groups
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;