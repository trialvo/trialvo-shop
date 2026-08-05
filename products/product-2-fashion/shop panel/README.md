This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Setup (Local + Production)

This project uses Next.js env loading rules plus Docker build/runtime envs.

### Local development

1. Create `.env.local` in project root.
2. Put local values there (example below).
3. Run `npm run dev`.

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_local_google_client_id
GOOGLE_CLIENT_ID=your_local_google_client_id
GOOGLE_CLIENT_SECRET=your_local_google_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CALLBACK_PATH=/api/auth/google/callback
GOOGLE_CALLBACK_PATH=/api/auth/google/callback
```

### Production deploy (Cloud Run)

Use two layers:

1. Build-time (for `NEXT_PUBLIC_*` values used in client bundles): pass Docker build args.
2. Runtime (for secrets): set Cloud Run environment variables.

Build args supported by `Dockerfile`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CALLBACK_PATH`

Runtime env vars (Cloud Run):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (if needed by server/runtime logic)
- `GOOGLE_CALLBACK_PATH`
- `CLOUDFLARE_ZONE_ID` (for cache purge command)
- `CLOUDFLARE_API_TOKEN` (for cache purge command)

Local Docker runtime from `.env`:

```bash
docker run --env-file .env -p 8080:8080 your-image:tag
```

Example docker build:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id \
  --build-arg GOOGLE_CALLBACK_PATH=/api/auth/google/callback \
  -t your-image:tag .
```

Important:

- `NEXT_PUBLIC_*` values are compiled into the frontend at build time.
- Secret values should not be baked into the image; inject them in Cloud Run runtime env settings.

### Cloudflare cache purge after deploy

To force-clear Cloudflare edge cache right after each deploy:

```bash
npm run purge:cloudflare
```

You can add this command as the final step of your CI/CD pipeline.

### Google OAuth Note (Popup Flow)

This project uses Google OAuth `ux_mode: popup`.

- `GOOGLE_CALLBACK_PATH` is the app API endpoint path (`/api/auth/google/callback`) used by our Next.js backend route.
- Google token exchange redirect URI for popup flow must be the site origin (for example `https://graduatefashionbd.com`), not the callback API path.

In Google Cloud Console (`OAuth 2.0 Client IDs`):

- `Authorized JavaScript origins`: add your origins (e.g. `https://graduatefashionbd.com`).
- `Authorized redirect URIs`: also include your origins used by popup token exchange (e.g. `https://graduatefashionbd.com`, `http://localhost:3000`).
