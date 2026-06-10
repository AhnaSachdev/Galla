import type { ParsedSMSTransaction, SMSTransactionType } from "./types";

type ParserRule = {
  id: string;
  type: SMSTransactionType;
  amountPattern: RegExp;
  counterpartyPattern?: RegExp;
  datePattern?: RegExp;
  confidence: number;
};

const amountFragment = String.raw`(?:rs\.?|inr|\u20b9)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)`;

const parserRules: ParserRule[] = [
  {
    id: "debit-keyword-debited",
    type: "debit",
    amountPattern: new RegExp(`${amountFragment}[^.\\n]*(?:debited|debit)`, "i"),
    counterpartyPattern: /(?:to|at|towards)\s+([a-z0-9 .&'-]{2,60}?)(?:\s+on|\s+for|\.|,|$)/i,
    datePattern: /(?:on|date)\s+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i,
    confidence: 0.92,
  },
  {
    id: "debit-keyword-spent",
    type: "debit",
    amountPattern: new RegExp(`(?:spent|paid|purchase)[^.\\n]*${amountFragment}`, "i"),
    counterpartyPattern: /(?:at|to)\s+([a-z0-9 .&'-]{2,60}?)(?:\s+on|\s+for|\.|,|$)/i,
    datePattern: /(?:on|date)\s+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i,
    confidence: 0.9,
  },
  {
    id: "credit-keyword-credited",
    type: "credit",
    amountPattern: new RegExp(`${amountFragment}[^.\\n]*(?:credited|credit)`, "i"),
    counterpartyPattern: /(?:from|by)\s+([a-z0-9 .&'-]{2,60}?)(?:\s+on|\s+for|\.|,|$)/i,
    datePattern: /(?:on|date)\s+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i,
    confidence: 0.92,
  },
  {
    id: "credit-keyword-received",
    type: "credit",
    amountPattern: new RegExp(`(?:received|deposited)[^.\\n]*${amountFragment}`, "i"),
    counterpartyPattern: /(?:from|by)\s+([a-z0-9 .&'-]{2,60}?)(?:\s+on|\s+for|\.|,|$)/i,
    datePattern: /(?:on|date)\s+([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i,
    confidence: 0.9,
  },
];

export class SMSParserService {
  parse(rawText: string, fallbackDate = new Date()): ParsedSMSTransaction | null {
    const text = normalizeCurrencySymbol(rawText);

    for (const rule of parserRules) {
      const amountMatch = text.match(rule.amountPattern);

      if (!amountMatch?.[1]) {
        continue;
      }

      return {
        amount: Number(amountMatch[1].replaceAll(",", "")),
        type: rule.type,
        counterpartyName: extractCounterparty(text, rule.counterpartyPattern),
        transactionDate: extractTransactionDate(text, rule.datePattern) ?? fallbackDate,
        note: rawText,
        confidence: rule.confidence,
        parserRuleId: rule.id,
        rawText,
      };
    }

    return null;
  }
}

function normalizeCurrencySymbol(text: string) {
  return text
    .replaceAll("\u00e2\u201a\u00b9", "\u20b9")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCounterparty(text: string, pattern?: RegExp) {
  const value = pattern ? text.match(pattern)?.[1]?.trim() : undefined;

  return value ? titleCase(value) : undefined;
}

function extractTransactionDate(text: string, pattern?: RegExp) {
  const value = pattern ? text.match(pattern)?.[1] : undefined;

  if (!value) {
    return undefined;
  }

  const [day, month, year] = value.split(/[-/]/).map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
