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

export async function GET() {
  try {
    await connectToMongoDB();
    const goals = await SavingsGoalModel.find({
      userId: DEFAULT_USER_ID,
      active: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ goals: goals.map(serializeDocument) });
  } catch (error) {
    return apiError(error, "Unable to load savings goals");
  }
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    const input = savingsSchema.parse(await request.json());
    const goal = await SavingsGoalModel.create({
      ...input,
      userId: DEFAULT_USER_ID,
      active: true,
    });

    return NextResponse.json(
      { goal: serializeDocument(goal.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, "Unable to create savings goal");
  }
}
