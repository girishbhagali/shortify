# Security Rules — Shortify AI

> **Stack**: FastAPI (Python) backend · Next.js 16 (TypeScript) frontend · Supabase Auth · SQLAlchemy · slowapi · Twilio
>
> Drop these rules apply to every agent, AI tool, or developer working in this repo.
> Non-negotiable. No exceptions. No prompting twice.

---

## 1. Secrets and Environment Variables

**RULE: Never expose secrets in frontend or committed code.**

- ALL secrets live in `.env` (backend) and `.env.local` (frontend) — never committed to git.
- The root `.gitignore` already covers `.env` and `.env.*` — do NOT remove those entries.
- Frontend (Next.js): only `NEXT_PUBLIC_` prefixed variables are allowed client-side. These must NEVER be secret keys.
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally public — the anon key is safe by design when RLS (Row Level Security) is enabled in Supabase.
- Backend: all secrets accessed via `os.getenv("VAR_NAME")` only. Never hardcode.
- The Twilio SID, Auth Token, and phone number are backend-only — never return them to the client.
- A `.env.example` file must exist in both `backend/` and `frontend/` with all required variable names but empty values.

```python
# ✅ Correct
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")

# ❌ Never do this
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Required `.env.example` — backend
```
DATABASE_URL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Required `.env.local.example` — frontend
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 2. Rate Limiting

**RULE: Every public-facing endpoint must have explicit rate limiting via slowapi.**

This project uses `slowapi` on the FastAPI backend. All rate limits are applied per IP via `get_remote_address`.

| Endpoint Type         | Limit             | Current Status  |
|-----------------------|-------------------|-----------------|
| OTP send              | 5/minute          | ✅ Applied       |
| OTP verify            | 10/minute         | ✅ Applied       |
| `/api/info`           | 20/hour           | ✅ Applied       |
| `/api/download`       | 5/hour            | ✅ Applied       |
| `/api/generate`       | 5/hour            | ✅ Applied       |
| `/api/upload`         | 5/hour            | ✅ Applied       |
| `/api/zip`            | ⚠️ **MISSING**    | ❌ Add limiter   |

- Always return `429 Too Many Requests` with `Retry-After` header on limit exceeded.
- Never silently swallow rate limit errors on the frontend — show a clear user message.
- The `/api/zip` endpoint currently has **no rate limit** — add one before shipping.

```python
# Add to /api/zip
@app.post("/api/zip")
@limiter.limit("10/hour")
async def create_zip_archive(request: Request, body: ZipRequest, ...):
```

---

## 3. Input Validation and Sanitization

**RULE: All input is validated server-side using Pydantic. Never trust the client.**

- All request bodies use Pydantic `BaseModel` with field constraints (`max_length`, `min_length`, `Field`).
- URL inputs are checked against `is_valid_youtube_url()` before any processing.
- Phone numbers are validated with a strict regex: `^\+[1-9]\d{6,14}$`.
- For file uploads: validate MIME type and extension on the server — do NOT rely on `Content-Type` headers from the client alone.
- Settings JSON from `Form` data in `/api/upload` is parsed with a try/except — always default to `{}` on parse failure.
- Reject invalid input with `400 Bad Request`. Log the attempt server-side. Never expose raw error details.

```python
# ✅ Correct — Pydantic enforces constraints
class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., description="Full phone number with country code")
    otp: str   = Field(..., min_length=6, max_length=6)

# ❌ Missing — add MIME type validation to /api/upload
ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo"}
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi"}
```

**⚠️ Gap to fix**: The `/api/upload` endpoint trusts the file extension directly from `file.filename` without validating MIME type or allowed extensions. Add server-side MIME validation using `python-magic` or `filetype`.

---

## 4. Authentication and Authorization

**RULE: Use Supabase Auth. Never roll your own auth from scratch.**

- Authentication is handled by Supabase (frontend) — do not re-implement JWT signing or session management.
- The OTP phone flow uses an in-memory store (`_otp_store`). **This resets on server restart** — acceptable for dev, but use Redis or a DB-backed store in production.
- OTPs expire after 10 minutes. Verified OTPs are deleted immediately — ✅ correct.
- **⚠️ Missing**: There is no account lockout after repeated failed OTP attempts. Add a failed-attempt counter per phone number.
- On every protected route, verify both identity (is this user authenticated?) and authorization (does this user own this resource?).
- Never store passwords — Supabase Auth handles password hashing internally.
- JWTs from Supabase are short-lived — do not extend expiry on the frontend.

```python
# ⚠️ Add brute-force protection to OTP verify
_otp_attempts: dict[str, int] = {}
MAX_OTP_ATTEMPTS = 5

# In /api/otp/verify:
attempts = _otp_attempts.get(phone, 0)
if attempts >= MAX_OTP_ATTEMPTS:
    raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")
```

---

## 5. SQL and Database Security

**RULE: Use SQLAlchemy ORM only. No raw string-interpolated queries.**

- All DB access goes through SQLAlchemy ORM (`db.add()`, `db.commit()`, `db.query()`).
- The DB connection string is loaded from `os.getenv("DATABASE_URL")` — never hardcoded.
- The DB user in production should have only `SELECT`, `INSERT`, `UPDATE` on required tables — no `DROP`, `TRUNCATE`, or superuser access.
- Never return raw `SQLAlchemy` exceptions to the client — they expose schema and table names.
- DB errors in `/api/generate` and `/api/upload` are caught and only `print()`ed server-side — ✅ correct pattern.

```python
# ✅ Safe ORM usage
db_job = Job(user_id=user_id, original_video_url=url, status="completed")
db.add(db_job)
db.commit()

# ❌ Never do this
db.execute(f"SELECT * FROM jobs WHERE user_id = '{user_id}'")
```

---

## 6. CORS Configuration

**RULE: No wildcard CORS in production. Explicit origin whitelist only.**

```python
# ✅ Current config — correct for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],    # ⚠️ Tighten in production
    allow_headers=["*"],    # ⚠️ Tighten in production
)
```

**⚠️ Before production deploy:**
- Load `allow_origins` from an env variable: `os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")`
- Restrict `allow_methods` to only `["GET", "POST"]` — remove `PUT`, `DELETE`, `PATCH` unless explicitly needed.
- The `CORSStaticFiles` class sets `Access-Control-Allow-Origin: *` on static clip files — this is acceptable for public video delivery but document the intent.

```python
# Production-ready CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

## 7. HTTP Security Headers

**RULE: Always set security headers. Use `starlette` middleware or a custom header injection.**

FastAPI does not include `helmet`. Add security headers via middleware:

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers.pop("X-Powered-By", None)  # Remove framework fingerprint
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

For Next.js frontend, set headers in `next.config.ts`:

```ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

**⚠️ Neither of these are currently implemented — add before production.**

---

## 8. File Upload Security

**RULE: Validate MIME type and extension. Rename with UUID. Store outside web root.**

| Check                        | Status                          |
|-----------------------------|---------------------------------|
| UUID rename                 | ✅ Applied (`file_id = uuid4()`) |
| File size limit (500MB)     | ✅ Applied                       |
| Extension from `file.filename` | ⚠️ Not sanitized              |
| MIME type validation        | ❌ **Missing**                   |
| Stored in `/tmp/` (not web root) | ✅ Applied                  |
| Background cleanup (1 hour) | ✅ Applied                       |

**⚠️ Fix required — add MIME validation to `/api/upload`:**

```python
import filetype  # pip install filetype

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
ALLOWED_MIMES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"}

# After saving the file:
kind = filetype.guess(saved_file_path)
if kind is None or kind.mime not in ALLOWED_MIMES:
    os.remove(saved_file_path)
    raise HTTPException(status_code=400, detail="Invalid file type. Only video files are accepted.")

ext = os.path.splitext(file.filename or "")[1].lower()
if ext not in ALLOWED_EXTENSIONS:
    os.remove(saved_file_path)
    raise HTTPException(status_code=400, detail="Invalid file extension.")
```

---

## 9. Error Handling and Logging

**RULE: Return generic messages to clients. Log full context server-side.**

- All `HTTPException` re-raises use human-readable detail strings — no stack traces, no file paths, no DB errors exposed.
- The `except Exception as e: print(f"Unexpected error: {e}")` pattern is acceptable for dev — use a logging service in production (e.g., Sentry, Logtail).
- Use correct HTTP status codes:
  - `400` — invalid input
  - `403` — forbidden / age-restricted
  - `404` — not found / private video
  - `413` — file too large
  - `429` — rate limited
  - `500` — unexpected server error only
- **⚠️ Gap**: The OTP send endpoint returns `dev_otp` and `error_hint` in the response body in fallback mode. **Remove these fields in production** — they leak the OTP value over the wire.

```python
# ✅ Production-safe OTP response
return {"success": True, "message": "OTP sent via SMS"}

# ❌ Never in production
return {"success": True, "dev_otp": otp, "error_hint": str(e)}
```

---

## 10. Dependency Security

**RULE: Audit dependencies after every install. Pin versions in production.**

```bash
# Python — run after every pip install
pip-audit

# Node — run after every npm install
npm audit
```

- `requirements.txt` pins minimum versions (`>=`) — acceptable for dev. **Use exact pins in production.**
- Flag any package with no updates in 2+ years for review.
- Do not install packages with suspicious install scripts without reviewing `setup.py` / `pyproject.toml`.
- Check `npm audit` output after each `npm install` in the frontend.

---

## 11. XSS Prevention (Frontend)

**RULE: Never render dynamic user content as raw HTML.**

- Do NOT use `dangerouslySetInnerHTML` unless the content is fully sanitized with `DOMPurify`.
- Never use `eval()` or `new Function()` with dynamic data.
- Avoid `innerHTML` with user-controlled content.
- LLM or AI-generated text rendered in the UI must be treated as untrusted — sanitize before display.

```tsx
// ✅ Safe — use text content only
<p>{userContent}</p>

// ❌ Never without DOMPurify
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ If HTML rendering is required
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

---

## 12. Deployment Checklist

Run through every item before every production deploy. This takes 2 minutes.

### Secrets
- [ ] `backend/.env` is not committed to git
- [ ] `frontend/.env.local` is not committed to git
- [ ] All secrets are set in the hosting platform's environment variable config
- [ ] `backend/.env.example` and `frontend/.env.local.example` are committed and up to date

### Backend
- [ ] `print(f"[DEV MODE] ... dev_otp: {otp}")` lines are removed or gated behind `APP_ENV != "production"`
- [ ] `dev_otp` and `error_hint` fields are removed from OTP API responses
- [ ] Rate limiting is active on ALL endpoints including `/api/zip`
- [ ] CORS `allow_origins` is loaded from env — not hardcoded to `localhost`
- [ ] Security headers middleware is added
- [ ] MIME type validation is added to `/api/upload`
- [ ] OTP brute-force lockout is implemented
- [ ] Database user has minimum required permissions only
- [ ] `quiet: False` in yt-dlp opts is changed to `True` in production (reduces log noise)

### Frontend
- [ ] `NEXT_PUBLIC_` variables contain only truly public values (Supabase URL + anon key are fine)
- [ ] No hardcoded API URLs — use env variables for backend URL
- [ ] Security headers are set in `next.config.ts`
- [ ] No `dangerouslySetInnerHTML` without DOMPurify

### Infrastructure
- [ ] HTTPS is enforced end-to-end
- [ ] Database is not publicly exposed (use connection pooler / private network)
- [ ] `/tmp/` cleanup background tasks are verified to be running
- [ ] Debug mode / verbose logging is disabled

---

## AI / LLM-Specific Rules

*(Apply if any AI/LLM API calls are added to this project)*

- Never send raw user input directly to an LLM — sanitize for prompt injection first.
- Always set `max_tokens` on every LLM call.
- Store LLM API keys server-side only. Route ALL calls through the FastAPI backend — never from the Next.js client.
- Log token usage per user/session to detect abuse.
- Implement per-user token budgets.
- Sanitize and escape all LLM output before rendering in the UI — generated HTML is an XSS risk.

---

## Quick Reference

| Area               | Rule                                               | Stack-Specific Tool                    |
|--------------------|----------------------------------------------------|----------------------------------------|
| Secrets            | `.env` only. Never in frontend or git.             | `.gitignore`, `python-dotenv`          |
| Rate Limiting      | All endpoints. `/api/zip` needs a limiter added.   | `slowapi`, `get_remote_address`        |
| Input Validation   | Pydantic on all bodies. MIME check on uploads.     | `Pydantic`, `filetype`                 |
| Auth               | Supabase Auth. Add OTP brute-force lockout.        | `@supabase/supabase-js`                |
| SQL Security       | ORM only. No f-string queries.                     | `SQLAlchemy`                           |
| CORS               | Env-driven origins. Tighten methods in prod.       | `CORSMiddleware`                       |
| HTTP Headers       | Add middleware to FastAPI + headers to next.config  | Custom `BaseHTTPMiddleware`            |
| File Uploads       | UUID rename + MIME check + size limit.             | `filetype`, `/tmp/` storage            |
| Error Handling     | Generic to client. Remove `dev_otp` in prod.       | `HTTPException`, Sentry                |
| Dependencies       | Audit after every install.                         | `pip-audit`, `npm audit`               |
| XSS                | No raw HTML render. DOMPurify if needed.           | `DOMPurify`                            |
| Deploy Gate        | Run Section 12 checklist before every ship.        | See above                              |
| AI / LLM           | Server-side keys. `max_tokens`. Sanitize output.   | FastAPI proxy endpoint                 |
