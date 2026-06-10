export type SMSTransactionType = "credit" | "debit";

export type SMSProviderId = "android-forwarder";

export type SMSMessageEnvelope = {
  provider: SMSProviderId;
  messageId?: string;
  sender?: string;
  body: string;
  receivedAt?: Date;
  forwardedAt?: Date;
  raw?: unknown;
};

export type ParsedSMSTransaction = {
  amount: number;
  type: SMSTransactionType;
  counterpartyName?: string;
  transactionDate?: Date;
  note: string;
  confidence: number;
  parserRuleId: string;
  rawText: string;
};

export type SMSIngestionResult = {
  message: SMSMessageEnvelope;
  parsed: ParsedSMSTransaction;
  transactionId: string;
};
