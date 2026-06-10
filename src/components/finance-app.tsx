"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Edit,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  type: "credit" | "debit";
  counterpartyName: string;
  note: string;
  category: string;
  source: "manual" | "sms";
  transactionDate: string;
};

type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  note: string;
  createdAt: string;
};

type PlannedExpense = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  note: string;
};

type Budget = {
  id?: string;
  type: "daily" | "weekly" | "monthly" | "yearly";
  periodDate: string;
  budgetAmount: number;
  savingsGoal: number;
  actualSavings: number;
  totalExpenditure: number;
  startingBalance: number;
  endingBalance: number;
};

type Profile = {
  id: string;
  name: string;
  email: string;
  totalBalance: number;
};

type InsightData = {
  spendingPerDay: ChartPoint[];
  spendingPerWeek: ChartPoint[];
  spendingPerMonth: ChartPoint[];
  spendingPerYear: ChartPoint[];
  compareSelectedMonths: ChartPoint[];
  compareSelectedYears: ChartPoint[];
  creditVsDebit: ChartPoint[];
  categoryPie: Array<ChartPoint & { percentage: number }>;
};

type ChartPoint = {
  name: string;
  amount: number;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Investment",
  "Health",
  "Education",
  "Other",
];

const todayInput = () => new Date().toISOString().slice(0, 10);
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 3200);
  }

  return { notice, showNotice };
}

export function HomeClient() {
  const { notice, showNotice } = useNotice();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editingExpense, setEditingExpense] = useState<PlannedExpense | null>(null);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [profileData, transactionData, savingsData, expenseData] =
        await Promise.all([
          api<{ profile: Profile }>("/api/profile"),
          api<{ transactions: Transaction[] }>("/api/transactions"),
          api<{ goals: SavingsGoal[] }>("/api/savings"),
          api<{ expenses: PlannedExpense[] }>("/api/planned-expenses"),
        ]);
      setProfile(profileData.profile);
      setTransactions(transactionData.transactions.slice(0, 3));
      setGoals(savingsData.goals);
      setExpenses(expenseData.expenses);
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const now = new Date();
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(now);
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <section className="home-top">
        <EditableBox title="Current Day" value={day} onEdit={() => undefined} disabledEdit />
        <EditableBox title="Current Date" value={date} onEdit={() => undefined} disabledEdit />
        <EditableBox
          title="Current Balance"
          value={profile ? money(profile.totalBalance) : loading ? "Loading" : money(0)}
          onEdit={() => (window.location.href = "/profile")}
        />
      </section>

      <SectionHeader title="Recent Transactions" />
      <div className="data-grid">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onEdit={() => setEditingTransaction(transaction)}
            onDelete={null}
          />
        ))}
      </div>
      {!transactions.length ? <EmptyData message="No transactions found in MongoDB." /> : null}

      <SectionHeader title="Ongoing Savings" />
      <div className="data-grid">
        {goals.map((goal) => (
          <SavingsCard
            goal={goal}
            key={goal.id}
            onEdit={() => setEditingGoal(goal)}
            onDelete={null}
          />
        ))}
      </div>
      {!goals.length ? <EmptyData message="No active savings goals found in MongoDB." /> : null}

      <SectionHeader
        title="Planned Expenditure"
        action={
          <button className="primary-button" onClick={() => setCreateExpenseOpen(true)} type="button">
            <Plus size={18} />
            Add
          </button>
        }
      />
      <div className="data-grid">
        {expenses.map((expense) => (
          <PlannedExpenseCard
            expense={expense}
            key={expense.id}
            onEdit={() => setEditingExpense(expense)}
            onDelete={null}
          />
        ))}
      </div>
      {!expenses.length ? <EmptyData message="No planned expenses found in MongoDB." /> : null}

      <TransactionModal
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSaved={() => {
          showNotice({ type: "success", message: "Transaction saved." });
          setEditingTransaction(null);
          void load();
        }}
      />
      <SavingsModal
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSaved={() => {
          showNotice({ type: "success", message: "Savings goal saved." });
          setEditingGoal(null);
          void load();
        }}
      />
      <PlannedExpenseModal
        expense={editingExpense}
        open={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        onSaved={() => {
          showNotice({ type: "success", message: "Planned expense saved." });
          setEditingExpense(null);
          void load();
        }}
      />
      <PlannedExpenseModal
        expense={null}
        open={createExpenseOpen}
        onClose={() => setCreateExpenseOpen(false)}
        onSaved={() => {
          showNotice({ type: "success", message: "Planned expense created." });
          setCreateExpenseOpen(false);
          void load();
        }}
      />
    </main>
  );
}

export function DashboardClient() {
  const cards = [
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/savings", label: "Savings", icon: PiggyBank },
    { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/transactions", label: "Track Your Transactions", icon: ReceiptText },
    { href: "/budget", label: "Budget", icon: Landmark },
  ];

  return (
    <main className="page-stack">
      <SectionHeader title="Dashboard" />
      <section className="card-grid">
        {cards.map(({ href, label, icon: Icon }) => (
          <Link className="action-card" href={href} key={href}>
            <span className="card-icon">
              <Icon size={20} />
            </span>
            <h3>{label}</h3>
          </Link>
        ))}
      </section>
    </main>
  );
}

export function TransactionsClient() {
  const { notice, showNotice } = useNotice();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    type: "",
    category: "",
    date: "",
  });

  async function load() {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const data = await api<{ transactions: Transaction[] }>(
        `/api/transactions?${params.toString()}`,
      );
      setTransactions(data.transactions);
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteTransaction(transaction: Transaction) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      showNotice({ type: "success", message: "Transaction deleted." });
      await load();
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <SectionHeader
        title="Transactions"
        action={
          <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Create Transaction
          </button>
        }
      />
      <section className="panel">
        <div className="form-grid">
          <label className="field">
            <span>Exact Keyword Search</span>
            <input
              value={filters.keyword}
              onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Type Filter</span>
            <select
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </label>
          <label className="field">
            <span>Category Filter</span>
            <select
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Date Filter</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters({ ...filters, date: event.target.value })}
            />
          </label>
        </div>
        <button className="secondary-button" type="button" onClick={() => void load()}>
          Search Transaction
        </button>
      </section>
      <section className="transaction-list">
        {transactions.map((transaction) => (
          <TransactionCard
            transaction={transaction}
            key={transaction.id}
            onEdit={() => setEditing(transaction)}
            onDelete={() => void deleteTransaction(transaction)}
          />
        ))}
      </section>
      {!transactions.length ? <EmptyData message="No transactions match the current database query." /> : null}
      <TransactionModal
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          showNotice({ type: "success", message: "Transaction saved." });
          setEditing(null);
          void load();
        }}
      />
      <TransactionModal
        transaction={null}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          showNotice({ type: "success", message: "Transaction created." });
          setCreateOpen(false);
          void load();
        }}
      />
    </main>
  );
}

export function SavingsClient() {
  const { notice, showNotice } = useNotice();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    try {
      const data = await api<{ goals: SavingsGoal[] }>("/api/savings");
      setGoals(data.goals);
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteGoal(goal: SavingsGoal) {
    if (!window.confirm("Delete this savings goal?")) return;
    try {
      await api(`/api/savings/${goal.id}`, { method: "DELETE" });
      showNotice({ type: "success", message: "Savings goal deleted." });
      await load();
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <SectionHeader
        title="Savings"
        action={
          <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            New Goal
          </button>
        }
      />
      <section className="data-grid">
        {goals.map((goal) => (
          <SavingsCard
            goal={goal}
            key={goal.id}
            onEdit={() => setEditing(goal)}
            onDelete={() => void deleteGoal(goal)}
          />
        ))}
      </section>
      {!goals.length ? <EmptyData message="No savings goals found in MongoDB." /> : null}
      <button className="floating-plus" type="button" onClick={() => setCreateOpen(true)}>
        <Plus size={22} />
      </button>
      <SavingsModal
        goal={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          showNotice({ type: "success", message: "Savings goal saved." });
          setEditing(null);
          void load();
        }}
      />
      <SavingsModal
        goal={null}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          showNotice({ type: "success", message: "Savings goal created." });
          setCreateOpen(false);
          void load();
        }}
      />
    </main>
  );
}

export function BudgetClient() {
  const { notice, showNotice } = useNotice();
  const [budget, setBudget] = useState<Budget>(emptyBudget());
  const [editing, setEditing] = useState<keyof Budget | "all" | null>(null);

  async function load(type = budget.type, periodDate = budget.periodDate) {
    try {
      const data = await api<{ budget: Budget | null }>(
        `/api/budget?type=${type}&periodDate=${periodDate}`,
      );
      setBudget(data.budget ?? { ...emptyBudget(), type, periodDate });
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const boxes: Array<[keyof Budget, string]> = [
    ["budgetAmount", "Budget Amount"],
    ["savingsGoal", "Savings Goal"],
    ["actualSavings", "Actual Savings"],
    ["totalExpenditure", "Total Expenditure"],
    ["startingBalance", "Starting Balance"],
    ["endingBalance", "Ending Balance"],
  ];
  const overspent = budget.totalExpenditure > budget.budgetAmount && budget.budgetAmount > 0;

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <SectionHeader title="Budget" />
      <section className="panel">
        <div className="form-grid">
          <label className="field">
            <span>Day/Week/Month/Year Selector</span>
            <select
              value={budget.type}
              onChange={(event) => {
                const type = event.target.value as Budget["type"];
                setBudget({ ...budget, type });
                void load(type, budget.periodDate);
              }}
            >
              <option value="daily">Day</option>
              <option value="weekly">Week</option>
              <option value="monthly">Month</option>
              <option value="yearly">Year</option>
            </select>
          </label>
          <label className="field">
            <span>Calendar Selector</span>
            <input
              type="date"
              value={budget.periodDate}
              onChange={(event) => {
                const periodDate = event.target.value;
                setBudget({ ...budget, periodDate });
                void load(budget.type, periodDate);
              }}
            />
          </label>
        </div>
      </section>
      {overspent ? <div className="overspent">OVERSPENT</div> : null}
      <section className="metric-grid">
        {boxes.map(([key, label]) => (
          <EditableBox
            key={key}
            title={label}
            value={money(Number(budget[key]))}
            onEdit={() => setEditing(key)}
          />
        ))}
      </section>
      <BudgetModal
        budget={budget}
        field={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          showNotice({ type: "success", message: "Budget saved." });
          setBudget(saved);
          setEditing(null);
        }}
      />
    </main>
  );
}

export function ProfileClient() {
  const { notice, showNotice } = useNotice();
  const [profile, setProfile] = useState<Profile>({
    id: "",
    name: "",
    email: "",
    totalBalance: 0,
  });
  const [editing, setEditing] = useState(false);

  async function load() {
    try {
      const data = await api<{ profile: Profile }>("/api/profile");
      setProfile(data.profile);
    } catch (error) {
      showNotice({ type: "error", message: errorMessage(error) });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <SectionHeader title="Profile" />
      <section className="metric-grid">
        <EditableBox title="Name" value={profile.name || "Not saved"} onEdit={() => setEditing(true)} />
        <EditableBox title="Email" value={profile.email || "Not saved"} onEdit={() => setEditing(true)} />
        <EditableBox title="Total Balance" value={money(profile.totalBalance)} onEdit={() => setEditing(true)} />
      </section>
      <ProfileModal
        profile={profile}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(saved) => {
          showNotice({ type: "success", message: "Profile saved." });
          setProfile(saved);
          setEditing(false);
        }}
      />
    </main>
  );
}

export function InsightsClient() {
  const { notice, showNotice } = useNotice();
  const [data, setData] = useState<InsightData>(emptyInsights());

  useEffect(() => {
    api<InsightData>("/api/insights")
      .then(setData)
      .catch((error) => showNotice({ type: "error", message: errorMessage(error) }));
  }, []);

  const charts = [
    ["Spending Per Day", data.spendingPerDay],
    ["Spending Per Week", data.spendingPerWeek],
    ["Spending Per Month", data.spendingPerMonth],
    ["Spending Per Year", data.spendingPerYear],
    ["Compare Selected Months", data.compareSelectedMonths],
    ["Compare Selected Years", data.compareSelectedYears],
    ["Credit vs Debit Graph", data.creditVsDebit],
  ] as const;

  return (
    <main className="page-stack">
      <NoticeBanner notice={notice} />
      <SectionHeader title="Insights" />
      <section className="charts-grid">
        {charts.map(([title, rows]) => (
          <ChartBox key={title} title={title} rows={rows} />
        ))}
        <PieChartBox rows={data.categoryPie} />
      </section>
    </main>
  );
}

function TransactionModal({
  transaction,
  open,
  onClose,
  onSaved,
}: {
  transaction: Transaction | null;
  open?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isOpen = open ?? Boolean(transaction);
  const [form, setForm] = useState({
    amount: "",
    type: "debit",
    counterpartyName: "",
    note: "",
    category: "Other",
    transactionDate: todayInput(),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: String(transaction.amount),
        type: transaction.type,
        counterpartyName: transaction.counterpartyName,
        note: transaction.note,
        category: transaction.category,
        transactionDate: new Date(transaction.transactionDate).toISOString().slice(0, 10),
      });
    } else {
      setForm({
        amount: "",
        type: "debit",
        counterpartyName: "",
        note: "",
        category: "Other",
        transactionDate: todayInput(),
      });
    }
    setError("");
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  async function submit() {
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!form.counterpartyName.trim()) {
      setError("Counterparty is required.");
      return;
    }
    setSaving(true);
    try {
      await api(transaction ? `/api/transactions/${transaction.id}` : "/api/transactions", {
        method: transaction ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={transaction ? "Edit Transaction" : "Create Transaction"} onClose={onClose}>
      <FormError message={error} />
      <div className="form-grid">
        <Field label="Amount">
          <input value={form.amount} inputMode="decimal" onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </Field>
        <Field label="Counterparty">
          <input value={form.counterpartyName} onChange={(event) => setForm({ ...form, counterpartyName: event.target.value })} />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} />
        </Field>
        <Field label="Note">
          <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button" disabled={saving} type="button" onClick={() => void submit()}>
        <Save size={18} />
        {saving ? "Saving" : "Save"}
      </button>
    </Modal>
  );
}

function SavingsModal({
  goal,
  open,
  onClose,
  onSaved,
}: {
  goal: SavingsGoal | null;
  open?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isOpen = open ?? Boolean(goal);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "", note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      goal
        ? {
            name: goal.name,
            targetAmount: String(goal.targetAmount),
            currentAmount: String(goal.currentAmount),
            note: goal.note,
          }
        : { name: "", targetAmount: "", currentAmount: "", note: "" },
    );
    setError("");
  }, [goal, isOpen]);

  if (!isOpen) return null;

  async function submit() {
    if (!form.name.trim()) return setError("Saving name is required.");
    if (Number(form.targetAmount) <= 0) return setError("Target amount must be greater than 0.");
    if (Number(form.currentAmount) < 0) return setError("Current amount cannot be negative.");
    setSaving(true);
    try {
      await api(goal ? `/api/savings/${goal.id}` : "/api/savings", {
        method: goal ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={goal ? "Edit Saving" : "Create Saving"} onClose={onClose}>
      <FormError message={error} />
      <div className="form-grid">
        <Field label="Name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Target Amount">
          <input value={form.targetAmount} inputMode="decimal" onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} />
        </Field>
        <Field label="Current Amount">
          <input value={form.currentAmount} inputMode="decimal" onChange={(event) => setForm({ ...form, currentAmount: event.target.value })} />
        </Field>
        <Field label="Note">
          <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button" disabled={saving} type="button" onClick={() => void submit()}>
        <Save size={18} />
        {saving ? "Saving" : "Save"}
      </button>
    </Modal>
  );
}

function PlannedExpenseModal({
  expense,
  open,
  onClose,
  onSaved,
}: {
  expense: PlannedExpense | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: "", amount: "", dueDate: todayInput(), note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      expense
        ? {
            name: expense.name,
            amount: String(expense.amount),
            dueDate: new Date(expense.dueDate).toISOString().slice(0, 10),
            note: expense.note,
          }
        : { name: "", amount: "", dueDate: todayInput(), note: "" },
    );
    setError("");
  }, [expense, open]);

  if (!open) return null;

  async function submit() {
    if (!form.name.trim()) return setError("Expense name is required.");
    if (Number(form.amount) <= 0) return setError("Amount must be greater than 0.");
    setSaving(true);
    try {
      await api(expense ? `/api/planned-expenses/${expense.id}` : "/api/planned-expenses", {
        method: expense ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={expense ? "Edit Planned Expenditure" : "Create Planned Expenditure"} onClose={onClose}>
      <FormError message={error} />
      <div className="form-grid">
        <Field label="Name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Amount">
          <input value={form.amount} inputMode="decimal" onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </Field>
        <Field label="Due Date">
          <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </Field>
        <Field label="Note">
          <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button" disabled={saving} type="button" onClick={() => void submit()}>
        <Save size={18} />
        {saving ? "Saving" : "Save"}
      </button>
    </Modal>
  );
}

function BudgetModal({
  budget,
  field,
  onClose,
  onSaved,
}: {
  budget: Budget;
  field: keyof Budget | "all" | null;
  onClose: () => void;
  onSaved: (budget: Budget) => void;
}) {
  const [form, setForm] = useState<Budget>(budget);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(budget);
    setError("");
  }, [budget, field]);

  if (!field) return null;

  const fields: Array<[keyof Budget, string]> =
    field === "all"
      ? [
          ["budgetAmount", "Budget Amount"],
          ["savingsGoal", "Savings Goal"],
          ["actualSavings", "Actual Savings"],
          ["totalExpenditure", "Total Expenditure"],
          ["startingBalance", "Starting Balance"],
          ["endingBalance", "Ending Balance"],
        ]
      : [[field, labelForBudgetField(field)]];

  async function submit() {
    setSaving(true);
    try {
      const data = await api<{ budget: Budget }>("/api/budget", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onSaved(data.budget);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Budget" onClose={onClose}>
      <FormError message={error} />
      <div className="form-grid">
        {fields.map(([key, label]) => (
          <Field label={label} key={key}>
            <input
              inputMode="decimal"
              value={String(form[key])}
              onChange={(event) =>
                setForm({ ...form, [key]: Number(event.target.value) || 0 })
              }
            />
          </Field>
        ))}
      </div>
      <button className="primary-button" disabled={saving} type="button" onClick={() => void submit()}>
        <Save size={18} />
        {saving ? "Saving" : "Save"}
      </button>
    </Modal>
  );
}

function ProfileModal({
  profile,
  open,
  onClose,
  onSaved,
}: {
  profile: Profile;
  open: boolean;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    totalBalance: String(profile.totalBalance),
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: profile.name,
      email: profile.email,
      totalBalance: String(profile.totalBalance),
      passwordConfirmation: "",
    });
    setError("");
  }, [profile, open]);

  if (!open) return null;

  async function submit() {
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.includes("@")) return setError("Valid email is required.");
    if (!form.passwordConfirmation && Number(form.totalBalance) !== profile.totalBalance) {
      return setError("Password confirmation is required to update total balance.");
    }
    setSaving(true);
    try {
      const data = await api<{ profile: Profile }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onSaved(data.profile);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <FormError message={error} />
      <div className="form-grid">
        <Field label="Name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Total Balance">
          <input inputMode="decimal" value={form.totalBalance} onChange={(event) => setForm({ ...form, totalBalance: event.target.value })} />
        </Field>
        <Field label="Confirm Password">
          <input type="password" value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button" disabled={saving} type="button" onClick={() => void submit()}>
        <Save size={18} />
        {saving ? "Saving" : "Save"}
      </button>
    </Modal>
  );
}

function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: (() => void) | null;
}) {
  return (
    <article className="data-card">
      <div>
        <p className={transaction.type === "credit" ? "amount-credit" : "amount-debit"}>
          {money(transaction.amount)}
        </p>
        <h3>
          {transaction.type === "credit" ? "Credited From" : "Debited To"}{" "}
          {transaction.counterpartyName}
        </h3>
        <p>Type: {transaction.type}</p>
        <p>Note: {transaction.note || "No note saved"}</p>
        <p>Category: {transaction.category}</p>
        <p>Date: {new Date(transaction.transactionDate).toLocaleDateString("en-IN")}</p>
      </div>
      <CardActions onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}

function SavingsCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: (() => void) | null;
}) {
  const progress = goal.targetAmount ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

  return (
    <article className="data-card">
      <div>
        <h3>{goal.name}</h3>
        <p>Created On: {new Date(goal.createdAt).toLocaleDateString("en-IN")}</p>
        <p>Note: {goal.note || "No note saved"}</p>
        <p>Current Saved: {money(goal.currentAmount)}</p>
        <p>Target Amount: {money(goal.targetAmount)}</p>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>Progress: {progress.toFixed(1)}%</p>
      </div>
      <CardActions onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}

function PlannedExpenseCard({
  expense,
  onEdit,
  onDelete,
}: {
  expense: PlannedExpense;
  onEdit: () => void;
  onDelete: (() => void) | null;
}) {
  return (
    <article className="data-card">
      <div>
        <h3>{expense.name}</h3>
        <p>Amount: {money(expense.amount)}</p>
        <p>Due Date: {new Date(expense.dueDate).toLocaleDateString("en-IN")}</p>
        <p>Note: {expense.note || "No note saved"}</p>
      </div>
      <CardActions onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}

function ChartBox({ title, rows }: { title: string; rows: ChartPoint[] }) {
  return (
    <section className="panel chart-panel">
      <h3>{title}</h3>
      {rows.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line dataKey="amount" stroke="#0f8b8d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyData message="No matching transaction data in MongoDB." />
      )}
    </section>
  );
}

function PieChartBox({ rows }: { rows: Array<ChartPoint & { percentage: number }> }) {
  const colors = ["#0f8b8d", "#118c5a", "#bf3f3f", "#7c5cff", "#d79822", "#3867d6"];

  return (
    <section className="panel chart-panel">
      <h3>Category Pie Chart</h3>
      {rows.length ? (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={rows} dataKey="amount" nameKey="name" label>
                {rows.map((row, index) => (
                  <Cell fill={colors[index % colors.length]} key={row.name} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="transaction-list">
            {rows.map((row) => (
              <div className="mini-row" key={row.name}>
                <span>{row.name}</span>
                <strong>
                  {money(row.amount)} - {row.percentage}%
                </strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyData message="No category spending data in MongoDB." />
      )}
    </section>
  );
}

function EditableBox({
  title,
  value,
  onEdit,
  disabledEdit,
}: {
  title: string;
  value: string;
  onEdit: () => void;
  disabledEdit?: boolean;
}) {
  return (
    <article className="metric editable-box">
      <span>{title}</span>
      <strong>{value}</strong>
      {!disabledEdit ? (
        <button className="edit-button" type="button" onClick={onEdit} aria-label={`Edit ${title}`}>
          <Edit size={16} />
        </button>
      ) : null}
    </article>
  );
}

function CardActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: (() => void) | null;
}) {
  return (
    <div className="card-actions">
      <button className="edit-button" type="button" onClick={onEdit} aria-label="Edit">
        <Edit size={16} />
      </button>
      {onDelete ? (
        <button className="delete-button" type="button" onClick={onDelete} aria-label="Delete">
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="section-title">
          <h2>{title}</h2>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <h1>{title}</h1>
      {action}
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return <div className={`notice notice-${notice.type}`}>{notice.message}</div>;
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <div className="form-error">{message}</div>;
}

function EmptyData({ message }: { message: string }) {
  return <div className="empty-data">{message}</div>;
}

function emptyBudget(): Budget {
  return {
    type: "monthly",
    periodDate: todayInput(),
    budgetAmount: 0,
    savingsGoal: 0,
    actualSavings: 0,
    totalExpenditure: 0,
    startingBalance: 0,
    endingBalance: 0,
  };
}

function emptyInsights(): InsightData {
  return {
    spendingPerDay: [],
    spendingPerWeek: [],
    spendingPerMonth: [],
    spendingPerYear: [],
    compareSelectedMonths: [],
    compareSelectedYears: [],
    creditVsDebit: [],
    categoryPie: [],
  };
}

function labelForBudgetField(field: keyof Budget) {
  const labels: Record<string, string> = {
    budgetAmount: "Budget Amount",
    savingsGoal: "Savings Goal",
    actualSavings: "Actual Savings",
    totalExpenditure: "Total Expenditure",
    startingBalance: "Starting Balance",
    endingBalance: "Ending Balance",
  };
  return labels[field] ?? String(field);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
