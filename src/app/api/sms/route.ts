import { NextResponse } from "next/server";

import { AndroidForwarderProvider } from "@/lib/sms/providers/android-forwarder-provider";
import { SMSIngestionService } from "@/lib/sms/sms-ingestion-service";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing x-user-id header" },
        { status: 401 },
      );
    }

    const provider = new AndroidForwarderProvider();
    const service = new SMSIngestionService(provider);
    const result = await service.ingest(request, userId);

    return NextResponse.json(
      {
        transactionId: result.transactionId,
        parsed: result.parsed,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to ingest SMS message";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
