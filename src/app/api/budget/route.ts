import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError, serializeDocument } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { BudgetModel } from "@/models/budget";

const budgetSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "yearly"]),
  periodDate: z.coerce.date(),
  budgetAmount: z.coerce.number().min(0, "Budget amount cannot be negative"),
  savingsGoal: z.coerce.number().min(0, "Savings goal cannot be negative"),
  actualSavings: z.coerce.number().min(0, "Actual savings cannot be negative"),
  totalExpenditure: z.coerce.number().min(0, "Total expenditure cannot be negative"),
  startingBalance: z.coerce.number().min(0, "Starting balance cannot be negative"),
  endingBalance: z.coerce.number().min(0, "Ending balance cannot be negative"),
});

export async function GET(request: Request) {
  try {
    await connectToMongoDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "monthly";
    const periodDate = searchParams.get("periodDate");
    const query: Record<string, unknown> = { userId: DEFAULT_USER_ID };

    if (["daily", "weekly", "monthly", "yearly"].includes(type)) {
      query.type = type;
    }

    if (periodDate) {
      query.periodDate = new Date(periodDate);
    }

    const budget = await BudgetModel.findOne(query)
      .sort({ periodDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      budget: budget ? serializeDocument(budget) : null,
    });
  } catch (error) {
    return apiError(error, "Unable to load budget");
  }
}

export async function PUT(request: Request) {
  try {
    await connectToMongoDB();
    const input = budgetSchema.parse(await request.json());
    const budget = await BudgetModel.findOneAndUpdate(
      {
        userId: DEFAULT_USER_ID,
        type: input.type,
        periodDate: input.periodDate,
      },
      {
        ...input,
        userId: DEFAULT_USER_ID,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ budget: serializeDocument(budget) });
  } catch (error) {
    return apiError(error, "Unable to save budget");
  }
}
