import type { SMSMessageEnvelope } from "../types";

export interface SMSProvider {
  readonly id: SMSMessageEnvelope["provider"];

  /**
   * Converts a provider-specific request body into the common SMS envelope.
   * Providers can also authenticate the request before normalizing it.
   */
  readMessage(request: Request): Promise<SMSMessageEnvelope>;
}
