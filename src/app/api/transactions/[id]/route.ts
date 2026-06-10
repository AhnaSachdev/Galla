import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError, serializeDocument } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { TransactionModel } from "@/models/transaction";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["credit", "debit"]),
  counterpartyName: z.string().trim().min(1, "Counterparty is required"),
  note: z.string().trim().optional().default(""),
  category: z.string().trim().min(1, "Category is required"),
  transactionDate: z.coerce.date(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    const input = transactionSchema.parse(await request.json());
    const transaction = await TransactionModel.findOneAndUpdate(
      { _id: id, userId: DEFAULT_USER_ID },
      input,
      { new: true },
    ).lean();

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: serializeDocument(transaction) });
  } catch (error) {
    return apiError(error, "Unable to update transaction");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;
    await TransactionModel.deleteOne({ _id: id, userId: DEFAULT_USER_ID });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Unable to delete transaction");
  }
}
