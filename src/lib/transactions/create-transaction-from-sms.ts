import { TransactionModel } from "@/models/transaction";
import { connectToMongoDB } from "@/lib/db/mongodb";
import type { ParsedSMSTransaction } from "@/lib/sms/types";

type CreateTransactionFromSmsInput = {
  userId: string;
  parsed: ParsedSMSTransaction;
};

export async function createTransactionFromSms({
  userId,
  parsed,
}: CreateTransactionFromSmsInput) {
  await connectToMongoDB();

  const transaction = await TransactionModel.create({
    userId,
    amount: parsed.amount,
    type: parsed.type,
    counterpartyName: parsed.counterpartyName,
    note: parsed.note,
    category: "Other",
    source: "sms",
    transactionDate: parsed.transactionDate,
    smsMetadata: {
      parserRuleId: parsed.parserRuleId,
      confidence: parsed.confidence,
      rawText: parsed.rawText,
    },
  });

  return {
    id: transaction._id.toString(),
  };
}
