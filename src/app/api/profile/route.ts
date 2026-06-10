import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/lib/app/user";
import { apiError, serializeDocument } from "@/lib/api/errors";
import { connectToMongoDB } from "@/lib/db/mongodb";
import { UserModel } from "@/models/user";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  totalBalance: z.coerce.number().min(0, "Balance cannot be negative"),
  passwordConfirmation: z.string().optional(),
});

export async function GET() {
  try {
    await connectToMongoDB();
    const profile = await UserModel.findById(DEFAULT_USER_ID).lean();

    return NextResponse.json({
      profile: profile
        ? serializeDocument(profile)
        : {
            id: DEFAULT_USER_ID,
            name: "",
            email: "",
            totalBalance: 0,
          },
    });
  } catch (error) {
    return apiError(error, "Unable to load profile");
  }
}

export async function PUT(request: Request) {
  try {
    await connectToMongoDB();
    const input = profileSchema.parse(await request.json());

    if (input.totalBalance > 0 && !input.passwordConfirmation) {
      return NextResponse.json(
        { error: "Password confirmation is required to update balance" },
        { status: 400 },
      );
    }

    const profile = await UserModel.findByIdAndUpdate(
      DEFAULT_USER_ID,
      {
        name: input.name,
        email: input.email,
        totalBalance: input.totalBalance,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ profile: serializeDocument(profile) });
  } catch (error) {
    return apiError(error, "Unable to save profile");
  }
}
