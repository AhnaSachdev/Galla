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

export async function GET(request: Request) {
  try {
    await connectToMongoDB();
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    const type = searchParams.get("type")?.trim();
    const category = searchParams.get("category")?.trim();
    const date = searchParams.get("date")?.trim();

    const query: Record<string, unknown> = { userId: DEFAULT_USER_ID };

    if (type === "credit" || type === "debit") {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.transactionDate = { $gte: start, $lt: end };
    }

    if (keyword) {
      query.$or = [
        { counterpartyName: keyword },
        { note: keyword },
        { category: keyword },
      ];
    }

    const transactions = await TransactionModel.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      transactions: transactions.map(serializeDocument),
    });
  } catch (error) {
    return apiError(error, "Unable to load transactions");
  }
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    const input = transactionSchema.parse(await request.json());
    const transaction = await TransactionModel.create({
      ...input,
      userId: DEFAULT_USER_ID,
      source: "manual",
    });

    return NextResponse.json(
      { transaction: serializeDocument(transaction.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, "Unable to create transaction");
  }
}
