import type { SMSProvider } from "./providers/sms-provider";
import { SMSParserService } from "./sms-parser-service";
import type { SMSIngestionResult } from "./types";
import { createTransactionFromSms } from "../transactions/create-transaction-from-sms";

export class SMSIngestionService {
  constructor(
    private readonly provider: SMSProvider,
    private readonly parser = new SMSParserService(),
  ) {}

  async ingest(request: Request, userId: string): Promise<SMSIngestionResult> {
    const message = await this.provider.readMessage(request);
    const parsed = this.parser.parse(message.body, message.receivedAt);

    if (!parsed) {
      throw new Error("SMS message does not look like a credit or debit transaction");
    }

    const transaction = await createTransactionFromSms({
      userId,
      parsed,
    });

    return {
      message,
      parsed,
      transactionId: transaction.id,
    };
  }
}
