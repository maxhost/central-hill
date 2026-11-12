# ADR0078 — Form dates and email attachments

2026-11-11. Extends ADR0038 for the requested Forms editor Date and File fields.

Date uses the browser calendar and a strict, real Gregorian YYYY-MM-DD value, with
no timezone conversion. File accepts one PDF, JPEG, PNG, GIF, WebP or AVIF per field,
up to 5 MiB each (5,242,880 bytes). Browser checks are repeated on the server, including
content signatures, declared type/extension, empty files and duplicate/unknown keys.
All file fields together are bounded to 20 MiB, below Resend's 40 MB encoded message
limit. The server action request limit is 21 MiB to leave room for multipart overhead.

Root owns the additive core/email contract: optional attachments containing filename,
base64 content and contentType. Resend maps these to its attachment payload. Existing
callers and console/disabled behavior remain compatible. No attachment URLs are fetched.

Bytes travel in FormData to the existing authenticated test action, after normal session,
revision and archived checks. Validation finishes before test capture or provider calls.
Only verified filename/type/size metadata is stored in the existing JSON test answer;
no file bytes, asset rows, R2 writes or new schema. Attachments exist in memory for the
email attempt. This does not add public form placement or anonymous submissions.

References checked 2026-11-11:
[Resend attachments](https://resend.com/docs/api-reference/emails/send-email),
[Next.js action body limit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).
