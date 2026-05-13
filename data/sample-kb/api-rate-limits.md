# API Rate Limits

Our API enforces rate limits per workspace, not per API key. This means if a workspace has multiple keys, they share the same quota.

## Default limits

| Plan | Requests / minute | Concurrent connections |
| --- | --- | --- |
| Free | 60 | 5 |
| Pro | 600 | 20 |
| Business | 3000 | 100 |
| Enterprise | Custom | Custom |

## Headers returned

Every API response includes:

- `X-RateLimit-Limit` - your current limit per minute
- `X-RateLimit-Remaining` - requests remaining in the current window
- `X-RateLimit-Reset` - unix timestamp when the window resets

## 429 errors

When a customer exceeds their limit, the API returns HTTP 429 with a `Retry-After` header indicating seconds to wait. The recommended client behavior is exponential backoff starting at the Retry-After value.

## Bursting

Pro and Business plans allow short bursts up to 2x the listed limit for up to 10 seconds. The burst budget refills over 60 seconds.

## How to raise limits

- Pro / Business: customers can upgrade their plan from Settings > Billing.
- Enterprise: limits are set per contract. Direct the customer to their account manager. Do not promise specific numbers - only the account manager can quote.

## Sudden 429 spikes

If a customer reports a sudden burst of 429s without changing their integration, check our status page (status.example.com). We occasionally lower limits temporarily during incidents to protect the platform.
