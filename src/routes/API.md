# Backend API

Base URL: `http://localhost:4000`

## Public

- `GET /api/health`
- `GET /api/domains`
- `POST /api/mailboxes/random`
- `POST /api/mailboxes/custom`
- `GET /api/mailboxes/:id`
- `PATCH /api/mailboxes/:id/active`
- `GET /api/mailboxes/:id/emails`

## Admin

All admin routes need header `x-api-key`.

- `GET /api/admin/domains`
- `POST /api/admin/domains`
- `POST /api/admin/maintenance/deactivate-inactive`

Maintenance hanya mengubah mailbox menjadi inactive. Email lama tetap tersimpan.

## Inbound Worker

Cloudflare Email Worker mengirim ke:

- `POST /api/inbound/email`

Header wajib: `x-inbound-secret`.

## Storage

Backend memakai MongoDB/Mongoose. Set `MONGODB_URI` ke MongoDB Atlas atau instance MongoDB lain sebelum menjalankan backend.
