# Option 1 shared demo â€” professional subdomains

Public demos on NEW VPS (`217.216.108.119`) use **`*-demo.trialvo.com`** instead of raw IP:port URLs.

## DNS (one-time, Cloudflare)

One-level names so Free-plan Universal SSL (`*.trialvo.com`) covers them. All A records â†’ `217.216.108.119`, Proxied.

`lifestyle-demo` Â· `fashion-demo` Â· `techshop-demo` Â· `combo-demo`
`lifestyle-admin-demo` Â· `fashion-admin-demo` Â· `techshop-admin-demo` Â· `combo-admin-demo`
`lifestyle-api-demo` Â· `fashion-api-demo` Â· `techshop-api-demo` Â· `combo-api-demo`

## Subdomain map

| Product | Shop (browse trial) | Admin | API |
|---------|---------------------|-------|-----|
| Lifestyle | https://lifestyle-demo.trialvo.com | https://lifestyle-admin-demo.trialvo.com | https://lifestyle-api-demo.trialvo.com |
| Fashion | https://fashion-demo.trialvo.com | https://fashion-admin-demo.trialvo.com | https://fashion-api-demo.trialvo.com |
| Tech shop | https://techshop-demo.trialvo.com | https://techshop-admin-demo.trialvo.com | https://techshop-api-demo.trialvo.com |
| Combo basket | https://combo-demo.trialvo.com | https://combo-admin-demo.trialvo.com | https://combo-api-demo.trialvo.com |

## Server setup

Shop `/admin` redirects to the matching admin host (e.g. https://lifestyle-demo.trialvo.com/admin â†’ https://lifestyle-admin-demo.trialvo.com/).

Deploy:

```powershell
cd "d:\our product"
# Safe first step (does not change live Browse/Trial IP links)
python .agent/scripts/deploy-demo-subdomains.py --nginx-only

# After Cloudflare DNS is live:
python .agent/scripts/deploy-demo-subdomains.py --cutover
```

## Verify (after DNS propagates)

```bash
curl -sI https://lifestyle-demo.trialvo.com | head -3
curl -sf https://lifestyle-api-demo.trialvo.com/api/health
curl -sf https://shop-api.trialvo.com/api/health   # CP unchanged
curl -sf https://pay.trialvo.com/health            # Pay unchanged
```

Local nginx test (before DNS):

```bash
curl -sI -H 'Host: lifestyle-demo.trialvo.com' -H 'X-Forwarded-Proto: https' http://127.0.0.1/
```
