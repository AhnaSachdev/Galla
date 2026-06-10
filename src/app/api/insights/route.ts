import { NextResponse } from "next/server";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { TransactionModel } from "@/models/transaction";

type TransactionInsightRow = {
  amount: number;
  type: "credit" | "debit";
  category?: string;
  transactionDate: Date;
};

export async function GET() {
  try {
    await connectToMongoDB();
    const transactions = await TransactionModel.find({ userId: DEFAULT_USER_ID })
      .select("amount type category transactionDate")
      .lean<TransactionInsightRow[]>();

    const debits = transactions.filter((transaction) => transaction.type === "debit");
    const credits = transactions.filter((transaction) => transaction.type === "credit");

    return NextResponse.json({
      spendingPerDay: groupByDatePart(debits, "day"),
      spendingPerWeek: groupByDatePart(debits, "week"),
      spendingPerMonth: groupByDatePart(debits, "month"),
      spendingPerYear: groupByDatePart(debits, "year"),
      compareSelectedMonths: groupByDatePart(debits, "month"),
      compareSelectedYears: groupByDatePart(debits, "year"),
      creditVsDebit: [
        { name: "Credit", amount: sum(credits) },
        { name: "Debit", amount: sum(debits) },
      ],
      categoryPie: categoryPie(debits),
    });
  } catch (error) {
    return apiError(error, "Unable to load insights");
  }
}

function groupByDatePart(rows: TransactionInsightRow[], part: "day" | "week" | "month" | "year") {
  const grouped = new Map<string, number>();

  for (const row of rows) {
    const key = formatKey(row.transactionDate, part);
    grouped.set(key, (grouped.get(key) ?? 0) + row.amount);
  }

  return [...grouped.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function categoryPie(rows: TransactionInsightRow[]) {
  const grouped = new Map<string, number>();
  const total = sum(rows);

  for (const row of rows) {
    const key = row.category || "Other";
    grouped.set(key, (grouped.get(key) ?? 0) + row.amount);
  }

  return [...grouped.entries()].map(([name, amount]) => ({
    name,
    amount,
    percentage: total ? Number(((amount / total) * 100).toFixed(2)) : 0,
  }));
}

function sum(rows: TransactionInsightRow[]) {
  return rows.reduce((total, row) => total + row.amount, 0);
}

function formatKey(value: Date, part: "day" | "week" | "month" | "year") {
  const date = new Date(value);

  if (part === "day") {
    return date.toISOString().slice(0, 10);
  }

  if (part === "week") {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((date.getTime() - firstDay.getTime()) / 86400000 + firstDay.getDay() + 1) / 7,
    );
    return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  if (part === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return String(date.getFullYear());
}
