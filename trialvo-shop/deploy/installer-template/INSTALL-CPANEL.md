# Install on cPanel / Node (no Docker)

Use this only if your Trialvo ZIP is a **cPanel / Node** pack (`license.env` + `license_public.pem`, no `docker-compose.yml`). For a Docker VPS pack, use [INSTALL.md](./INSTALL.md) instead.

Trialvo does not log into your hosting account.

---

## What you need

- cPanel (Passenger / CloudLinux Node) **or** a VPS where you already run Node yourself
- Your domain’s DNS **A record** pointing at that host
- The product API build (`my-shop-api` or the API folder named in the product README)
- Built admin (Vite) and shop (Next) pointing at your public API origin

---

## Steps

1. Unzip the installer pack. You will have `license.env`, `license_public.pem`, and a short README (plus `passenger-startup.example.js` on paid packs).
2. Deploy the **product API** as the Node application in cPanel (or `systemd` / PM2 on a VPS).
3. Place `license.env` **next to the API** and load it at boot (`dotenv`, Passenger environment, or the example startup snippet).
4. Copy `license_public.pem` to the API’s `config/license_public.pem` if your build expects it there.
5. Set `TRIAL_DOMAIN` in `license.env` to the **exact** public hostname customers will use.
6. Copy admin email/password from the Trialvo status email into the API’s own env (or first-seed fields your product README describes).
7. Build admin and shop; set their API origin to this API’s public URL.
8. Restart the Node app. It registers with Trialvo directly (`LICENSE_ENFORCE=1` on paid packs). No Docker or Go sidecar is required.

Do **not** share `license.env` or copy it onto another domain — that can freeze the license.

---

## After install

Open the shop and admin URLs. On an own-domain trial, the status page becomes **Active** after the API phones home. If it stays pending, confirm outbound HTTPS to `CONTROL_PLANE_URL` in `license.env`, and that `TRIAL_DOMAIN` matches the live hostname.

---

## Troubleshooting

- App will not start: confirm `license.env` is loaded before `require('./index.js')`.
- Trial not Active: from the host, the control-plane URL must be reachable; installer links are single-use.
- Full Docker-style checklist (firewall, DNS, first-run `.env`): see [INSTALL.md](./INSTALL.md) — those ideas still apply even when you are not using Compose.
