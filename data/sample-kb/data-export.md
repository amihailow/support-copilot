# Data Export

Customers can export their data at any time. Exports are available in CSV and JSON formats.

## Self-service export

Available on all paid plans:

1. Go to Settings > Data.
2. Click "Request export".
3. Choose format (CSV or JSON) and date range.
4. The export runs in the background. Customers receive an email when it is ready (usually within 30 minutes, can take up to 24 hours for large workspaces).

## What is included

Customer data:
- All records the user has access to (respects workspace permissions).
- Custom fields and tags.
- File attachments are exported as separate ZIPs, linked from the main file by record ID.

Customer data NOT included:
- Other users' personal information (replaced with internal IDs).
- Audit logs older than 90 days (available on Business plan and above only).
- Data deleted before the export request.

## API-based export

Enterprise customers can use the streaming export API to pull data programmatically. Endpoint: `POST /v2/exports`. Documentation at docs.example.com/api/exports.

## GDPR / Data deletion requests

If the customer is asking for a GDPR data deletion (not just an export), route the ticket to privacy@example.com. Do not delete data through standard tools - the privacy team has the audited deletion workflow.

## Failed exports

If a customer reports the export email never arrived:

1. Check the email is in their spam folder.
2. Verify the export job did not fail in the admin panel (Operations > Exports).
3. If failed, the most common cause is workspace size over 50GB. In that case, recommend they use the API or split the export by date range.
