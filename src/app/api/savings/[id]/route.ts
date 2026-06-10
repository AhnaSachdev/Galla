import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError, serializeDocument } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { SavingsGoalModel } from "@/models/savings-goal";

const savingsSchema = z.object({
  name: z.string().trim().min(1, "Saving name is required"),
  targetAmount: z.coerce.number().positive("Target amount must be greater than 0"),
  currentAmount: z.coerce.number().min(0, "Current amount cannot be negative"),
  note: z.string().trim().optional().default(""),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    const input = savingsSchema.parse(await request.json());
    const goal = await SavingsGoalModel.findOneAndUpdate(
      { _id: id, userId: DEFAULT_USER_ID },
      input,
      { new: true },
    ).lean();

    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal: serializeDocument(goal) });
  } catch (error) {
    return apiError(error, "Unable to update savings goal");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    await SavingsGoalModel.deleteOne({ _id: id, userId: DEFAULT_USER_ID });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete savings goal");
  }
}
