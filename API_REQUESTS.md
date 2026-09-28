# API Requests for Testing

This document is the testing reference for API requests currently used by
Urimai Guide.

## Test setup

Start the Next.js application:

```bash
npm run dev
```

The examples below assume:

```text
http://localhost:3000
```

The routes are same-origin Next.js routes, so no authentication header is
required by the current handlers. Do not put provider credentials in a request
or commit them to the repository. Configure the required server-side variables
in `.env.local` using `.env.example` as the reference.

## Request inventory

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/send-otp` | Implemented | Send an SMS OTP through Twilio Verify |
| `POST` | `/api/auth/verify-otp` | Implemented | Verify an OTP through Twilio Verify and update the phone status |
| `POST` | `/api/intake/correct` | Implemented | Correct complaint text with Gemini |
| `POST` | `/api/v1/auth/register` | Contract only | Registration payload is previewed/logged in the UI; no Next.js route is implemented |

## 1. Send OTP

### Endpoint

```text
POST /api/auth/send-otp
Content-Type: application/json
```

The UI sends the phone number in E.164 format. The handler also accepts the
aliases `mobile_number` and `mobile`, but `phone` is the canonical field.

### Request

```bash
curl -i -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

### Success response (`200`)

```json
{
  "success": true,
  "status": "pending",
  "message": "OTP sent successfully via SMS to +919876543210."
}
```

The actual Twilio SID and destination are not returned by this route.

### Validation/error responses

Missing or non-string phone (`400`):

```json
{
  "success": false,
  "error": "Mobile phone number is required."
}
```

Invalid phone, provider failure, or rate limit (`400`):

```json
{
  "success": false,
  "error": "Invalid phone number format. Please provide a valid mobile number with country code.",
  "code": 60200
}
```

Unexpected server error (`500`):

```json
{
  "success": false,
  "error": "An unexpected server error occurred."
}
```

### Test cases

- Use a valid E.164 mobile number and confirm `success` is `true`.
- Send `{}` and confirm HTTP `400`.
- Send `{"phone":"not-a-phone"}` and confirm HTTP `400`.
- Repeat requests until the provider rate-limit behavior is reached, then
  confirm the response remains JSON and includes `success: false`.
- With Twilio credentials absent or invalid, confirm the response does not
  expose credentials and returns a provider error.

## 2. Verify OTP

### Endpoint

```text
POST /api/auth/verify-otp
Content-Type: application/json
```

The UI sends `phone` and `code`. The handler also accepts `mobile_number` or
`mobile` for the phone and `otp` for the code.

### Request

Use the code received by the phone after calling the Send OTP endpoint:

```bash
curl -i -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","code":"123456"}'
```

### Success response (`200`)

```json
{
  "success": true,
  "verified": true,
  "status": "approved",
  "message": "Mobile number verified successfully."
}
```

### Validation/error responses

Missing phone (`400`):

```json
{
  "success": false,
  "verified": false,
  "error": "Mobile phone number is required."
}
```

Missing code (`400`):

```json
{
  "success": false,
  "verified": false,
  "error": "Verification code is required."
}
```

Invalid, expired, or rejected code (`400`):

```json
{
  "success": false,
  "verified": false,
  "error": "Invalid or expired verification code. Please check and try again.",
  "code": 60202
}
```

Unexpected server error (`500`):

```json
{
  "success": false,
  "verified": false,
  "error": "An unexpected server error occurred."
}
```

### Test cases

- First call Send OTP, then verify with the real code and expect HTTP `200`.
- Send `{}` and confirm HTTP `400`.
- Send a valid phone with `code: "abc"` and confirm HTTP `400`.
- Send a wrong numeric code and confirm `verified: false`.
- Reuse an already-consumed or expired code and confirm it is rejected.
- After a successful verification, confirm the corresponding phone record is
  marked verified in Supabase when the database is configured.

## 3. Correct complaint text

### Endpoint

```text
POST /api/intake/correct
Content-Type: application/json
```

### Request fields

| Field | Type | Required | Allowed values/notes |
| --- | --- | --- | --- |
| `text` | string | Yes | Must contain at least one non-whitespace character |
| `language` | string | No | `ENGLISH`, `TAMIL`, or `HINDI`; unknown/missing values default to English |

### Request

```bash
curl -i -X POST http://localhost:3000/api/intake/correct \
  -H "Content-Type: application/json" \
  -d '{"text":"The phone stopped working after two days and seller did not help.","language":"ENGLISH"}'
```

### Success response (`200`)

```json
{
  "originalText": "The phone stopped working after two days and seller did not help.",
  "correctedText": "The phone stopped working after two days, and the seller did not help.",
  "changed": true
}
```

If the text needs no correction, `changed` is `false` and
`correctedText` matches `originalText`.

### Validation/error responses

Invalid JSON (`400`):

```json
{
  "error": "INVALID_REQUEST"
}
```

Missing or blank text (`400`):

```json
{
  "error": "EMPTY_TEXT"
}
```

Gemini is not configured (`503`):

```json
{
  "error": "NOT_CONFIGURED"
}
```

Provider failure or timeout (`502`):

```json
{
  "error": "AI_ERROR"
}
```

Possible provider/network errors are `AI_EMPTY_RESPONSE`, `AI_TIMEOUT`, and
`NETWORK_ERROR`.

### Test cases

- Submit clear English, Tamil, and Hindi text and confirm the response has all
  three fields: `originalText`, `correctedText`, and `changed`.
- Submit whitespace-only text and confirm HTTP `400`.
- Submit malformed JSON and confirm HTTP `400`.
- Omit `language` and confirm the request is processed as English.
- Temporarily remove `GEMINI_API_KEY` and confirm HTTP `503`.
- Use a short network/provider timeout scenario and confirm HTTP `502` without
  leaking the API key.

## 4. Registration contract (not currently a live route)

The registration screen builds and logs a request for:

```text
POST /api/v1/auth/register
```

There is currently no `app/api/v1/auth/register/route.ts` implementation and
the browser does not send this request. The following is the frontend contract
to use when testing the eventual FastAPI backend, not a request that can be
run against the current Next.js app.

### Request body

```json
{
  "full_name": "Ravi Kumar",
  "mobile_number": "9876543210",
  "email": "ravi@example.com",
  "state": "Tamil Nadu",
  "district": "Chennai",
  "pincode": "600001",
  "preferred_language": "ENGLISH",
  "is_nri": false,
  "nri_country": null,
  "password": "<plaintext password>",
  "otp_verified": true,
  "fcm_token": null
}
```

The UI preview masks the password as `••••••••`; a real backend request must
send the actual password over HTTPS so the backend can hash it. Never record a
real password in test logs.

### Field validation

- `full_name`: 2–100 characters.
- `mobile_number`: exactly 10 digits, without the `+91` country code.
- `email`: optional; if present, must be a valid email address.
- `state`: required; use one of the Indian states or union territories shown in
  the registration form.
- `district`: required.
- `pincode`: exactly 6 digits.
- `preferred_language`: `ENGLISH`, `TAMIL`, or `HINDI`.
- `nri_country`: required when `is_nri` is `true`; otherwise `null`.
- `password`: at least 8 characters, including at least one letter and one
  number.
- `otp_verified`: must be `true`.

### Example against the configured FastAPI backend

```bash
curl -i -X POST "${NEXT_PUBLIC_API_BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name":"Ravi Kumar",
    "mobile_number":"9876543210",
    "email":"ravi@example.com",
    "state":"Tamil Nadu",
    "district":"Chennai",
    "pincode":"600001",
    "preferred_language":"ENGLISH",
    "is_nri":false,
    "nri_country":null,
    "password":"TestPassword1",
    "otp_verified":true,
    "fcm_token":null
  }'
```

The UI's sample response contains `success`, `user_id`, `access_token`,
`refresh_token`, `token_expiry_seconds`, `user_profile`, `onboarding_complete`,
and `next_step`. Confirm the real backend's response schema before writing
automated assertions.

## Upstream provider requests

These requests are made server-to-server by the implemented routes and should
normally be tested through the local endpoints above:

- **Twilio Verify create:** `POST` to Twilio's Verify service with `to` and
  `channel: "sms"` when `/api/auth/send-otp` is called.
- **Twilio Verify check:** `POST` to Twilio's Verify service with `to` and
  `code` when `/api/auth/verify-otp` is called.
- **Google Gemini generateContent:** `POST` to
  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}`
  when `/api/intake/correct` is called.

Do not call these provider URLs directly in browser tests. Direct provider
testing would require exposing secrets and would bypass the application's
validation and error handling.

## Automated test checklist

- Verify HTTP status, `Content-Type: application/json`, and response JSON for
  every request.
- Assert that error responses do not contain provider credentials, tokens, or
  plaintext passwords.
- Run the happy path in order: Send OTP -> Verify OTP -> registration contract
  request -> complaint correction.
- Test malformed JSON, missing required fields, invalid values, provider
  failures, timeouts, and rate limits.
- Use test phone numbers and provider test credentials where available; do not
  send OTPs to users without consent.
