# Render Deployment

This project deploys to Render as two separate services:

1. A Vite static site for the public website
2. A Docker web service for the PHP backend and admin API

## Recommended: Use the Blueprint

This repo now includes `render.yaml`, so the simplest path is:

1. Push the latest code to GitHub.
2. In Render, choose `New` -> `Blueprint`.
3. Select this repository.
4. Render will detect the two services defined in `render.yaml`.

Render will ask you for the `sync: false` variables. Use these values:

### Frontend

- `VITE_API_BASE_URL`
  - Set this to `https://<your-backend-service-name>.onrender.com/api`
  - Example: `https://mq-qm-api.onrender.com/api`

### Backend

- `APP_ALLOWED_ORIGINS`
  - Set this to your frontend URL
  - Example: `https://mq-qm-website.onrender.com`
- `ADMIN_DEFAULT_PASSWORD`
  - Your real admin password
- `ADMIN_DEFAULT_EMAIL`
  - Your admin email address
- `ADMIN_DEFAULT_PHONE`
  - Your admin phone number
- `SMTP_HOST`
  - Usually `smtp.gmail.com`
- `SMTP_USERNAME`
  - Your Google Workspace sender mailbox
- `SMTP_PASSWORD`
  - Your Google app password
- `SMTP_FROM_EMAIL`
  - Same sender mailbox, or the approved sender you want to use

## Why the Backend Is Separate

The PHP backend handles:

- admin login and session cookies
- content management
- contact and career submissions
- resume uploads
- email delivery

That cannot be done from a static frontend alone.

## Persistent Data

The backend stores:

- content and admin data
- submissions
- audit logs
- uploaded resumes

Render must keep that on a persistent disk. The backend service in `render.yaml` mounts that disk at:

- `/var/www/html/data`

Do not remove that disk, or your stored data and uploads will be lost.

## Manual Setup If You Do Not Use the Blueprint

### 1. Frontend Service

Create a `Static Site` with:

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Add environment variable:

- `VITE_API_BASE_URL=https://<your-backend-service-name>.onrender.com/api`

Add rewrite rule:

- `/*` -> `/index.html`

### 2. Backend Service

Create a `Web Service` with:

- Runtime: `Docker`
- Dockerfile path: `./php-backend/Dockerfile`
- Docker build context: `./php-backend`
- Health check path: `/api/public/settings.php`

Add a persistent disk:

- Mount path: `/var/www/html/data`

Add backend environment variables from `php-backend/.env.example`, especially:

- `APP_DATA_DIR=/var/www/html/data`
- `SESSION_COOKIE_SAMESITE=None`
- `APP_ALLOWED_ORIGINS=https://<your-frontend-service-name>.onrender.com`
- SMTP variables
- admin default user variables

## Important Notes

- The frontend and backend are separate origins on Render, so `SESSION_COOKIE_SAMESITE=None` is required for admin login to work correctly in production.
- `APP_ALLOWED_ORIGINS` must exactly match your frontend URL, including `https://`.
- This backend currently uses local file-backed storage, not MySQL/PostgreSQL yet.
- If you later move to a custom domain, update both:
  - `VITE_API_BASE_URL`
  - `APP_ALLOWED_ORIGINS`

## Local Development

Local development still works the same as before:

- Frontend: `npm run dev`
- Backend: `php -S localhost:8000 -t php-backend`

The new environment variables only make the backend deployment-aware for Render.
