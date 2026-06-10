import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = models.User ?? model("User", userSchema);
