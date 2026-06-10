import { Schema, model, models } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    counterpartyName: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "Other",
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "sms"],
      required: true,
      default: "manual",
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    smsMetadata: {
      parserRuleId: String,
      confidence: Number,
      rawText: String,
    },
  },
  {
    timestamps: true,
  },
);

export const TransactionModel =
  models.Transaction ?? model("Transaction", transactionSchema);
