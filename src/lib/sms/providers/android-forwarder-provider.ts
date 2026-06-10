import { z } from "zod";

import type { SMSProvider } from "./sms-provider";
import type { SMSMessageEnvelope } from "../types";

const androidForwarderPayloadSchema = z.object({
  messageId: z.string().trim().optional(),
  sender: z.string().trim().optional(),
  body: z.string().trim().min(1, "SMS body is required"),
  receivedAt: z.coerce.date().optional(),
});

export class AndroidForwarderProvider implements SMSProvider {
  readonly id = "android-forwarder" as const;

  async readMessage(request: Request): Promise<SMSMessageEnvelope> {
    const sharedSecret = process.env.SMS_FORWARDER_SECRET;

    if (sharedSecret) {
      const providedSecret = request.headers.get("x-sms-forwarder-secret");

      if (providedSecret !== sharedSecret) {
        throw new Error("Invalid SMS forwarder secret");
      }
    }

    const payload = androidForwarderPayloadSchema.parse(await request.json());
    const now = new Date();

    return {
      provider: this.id,
      messageId: payload.messageId,
      sender: payload.sender,
      body: payload.body,
      receivedAt: payload.receivedAt ?? now,
      forwardedAt: now,
      raw: payload,
    };
  }
}
