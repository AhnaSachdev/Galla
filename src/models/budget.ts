import { Schema, model, models } from "mongoose";

const budgetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
      default: "monthly",
    },
    periodDate: {
      type: Date,
      required: true,
      index: true,
    },
    budgetAmount: {
      type: Number,
      default: 0,
    },
    savingsGoal: {
      type: Number,
      default: 0,
    },
    actualSavings: {
      type: Number,
      default: 0,
    },
    totalExpenditure: {
      type: Number,
      default: 0,
    },
    startingBalance: {
      type: Number,
      default: 0,
    },
    endingBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const BudgetModel = models.Budget ?? model("Budget", budgetSchema);
