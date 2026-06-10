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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    const input = plannedExpenseSchema.parse(await request.json());
    const expense = await PlannedExpenseModel.findOneAndUpdate(
      { _id: id, userId: DEFAULT_USER_ID },
      input,
      { new: true },
    ).lean();

    if (!expense) {
      return NextResponse.json({ error: "Planned expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense: serializeDocument(expense) });
  } catch (error) {
    return apiError(error, "Unable to update planned expense");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    await PlannedExpenseModel.deleteOne({ _id: id, userId: DEFAULT_USER_ID });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete planned expense");
  }
}
