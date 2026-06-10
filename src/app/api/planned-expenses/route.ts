import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError, serializeDocument } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { PlannedExpenseModel } from "@/models/planned-expense";

const plannedExpenseSchema = z.object({
  name: z.string().trim().min(1, "Expense name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.coerce.date(),
  note: z.string().trim().optional().default(""),
});

export async function GET() {
  try {
    await connectToMongoDB();
    const expenses = await PlannedExpenseModel.find({ userId: DEFAULT_USER_ID })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json({ expenses: expenses.map(serializeDocument) });
  } catch (error) {
    return apiError(error, "Unable to load planned expenses");
  }
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    const input = plannedExpenseSchema.parse(await request.json());
    const expense = await PlannedExpenseModel.create({
      ...input,
      userId: DEFAULT_USER_ID,
    });

    return NextResponse.json(
      { expense: serializeDocument(expense.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, "Unable to create planned expense");
  }
}
