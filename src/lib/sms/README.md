# SMS ingestion architecture

Browsers cannot read SMS messages directly, so SMS import is modeled as a provider-backed backend ingestion flow.

## Current flow

1. A future Android wrapper posts SMS payloads to `POST /api/sms`.
2. `AndroidForwarderProvider` validates and normalizes the request.
3. `SMSParserService` parses the message body into amount, credit/debit type, counterparty, and date.
4. `SMSIngestionService` creates a transaction with `source = sms`.

## Android forwarder payload

```json
{
  "messageId": "device-message-id",
  "sender": "HDFCBK",
  "body": "Rs.500 debited from your account to Swiggy on 05/06/2026",
  "receivedAt": "2026-06-05T09:00:00.000Z"
}
```

Set `SMS_FORWARDER_SECRET` and send it as `x-sms-forwarder-secret` to protect the endpoint.

The route currently expects `x-user-id`. Once authentication is wired in, replace that with the authenticated session user id.
