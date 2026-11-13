# ADR0086 — Production attachment budget

2026-11-12/13. Supersedes the attachment-size limits in ADR0078.

The user approved publishing on Vercel with at most **3 MiB per file and 3 MiB
across all files in one submission** (3,145,728 bytes). The previous 5 MiB/file,
20 MiB aggregate contract cannot fit Vercel's 4.5 MB function request limit.
Next.js's action limit cannot raise the platform ingress limit. Use a 4 MiB action
request budget and leave space around the 3 MiB file allowance for multipart data
and ordinary answers. This is a bounded attachment allowance, not a guarantee that
an arbitrarily large non-file request will pass the request-body limit.

Browser checks and server validation use the same byte limits. The aggregate
includes retained files from every wizard step. Choosing an oversized file clears
that selection, reports the localized limit, and prevents submission until fixed.
The server rejects individual or aggregate overflow before constructing attachments
or capturing a submission; aggregate errors discard all partial output.

One supported PDF/image per File field, MIME/signature verification, safe filename
handling, visual ordering, historical metadata, idempotency and existing quotas
remain unchanged. Bytes remain in memory for the notification attempt; no asset
upload, persistent bytes, public URLs or new schema are introduced.

EN/ES/PT/FR help and error text describe the 3 MiB limits. Boundary tests cover
single files and multiple files totaling exactly 3 MiB and one byte above, browser
handlers across steps, and actual multipart encoding with ordinary answers under
the request budget. Deployed smoke tests must still verify the hosting transport.

For this release the user explicitly permits operation without email notifications,
with requests reviewed in Admin → Leads. This decision does not claim inbox delivery
or persistent attachment availability while the email provider is disabled; Resend
setup and a controlled real delivery/attachment check remain separate work.

Reference reviewed in the go-live plan:
[Vercel Functions limits](https://vercel.com/docs/functions/limitations).
