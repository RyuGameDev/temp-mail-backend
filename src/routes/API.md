# Backend API

Base URL: `http://localhost:4000`

## Public

Untuk penggunaan API eksternal, sertakan header `x-api-key`. Dapatkan akses dari owner di `https://t.me/yonkounoryu`.

- `GET /api/health`
- `GET /api/domains`
- `POST /api/mailboxes/random`
- `POST /api/mailboxes/custom`
- `GET /api/mailboxes/by-address/:address`
- `GET /api/mailboxes/:id`
- `PATCH /api/mailboxes/:id/active`
- `DELETE /api/mailboxes/:id`
- `GET /api/mailboxes/:id/emails`
- `GET /api/mailboxes/:id/emails/:emailId`
- `PATCH /api/mailboxes/:id/emails/:emailId/read`
- `DELETE /api/mailboxes/:id/emails/:emailId`

### Contoh Body

```json
{ "domain": "example.com" }
```

```json
{ "localPart": "demo", "domain": "example.com" }
```

```json
{ "active": true }
```

```json
{ "read": true }
```

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
