# INFRA-2 — Wildcard DNS for Option 1 trials

## Required records

Point your registrar / DNS provider to the Traefik host:

| Type | Name | Value |
|------|------|-------|
| A | `*.trial.trialvo.com` | `<TRAEFIK_HOST_IP>` |
| A | `trial.trialvo.com` | `<TRAEFIK_HOST_IP>` (optional apex for docs) |

Optional: AAAA for IPv6.

## Env on control plane

```
TRIAL_DOMAIN_BASE=trial.trialvo.com
DOCKER_PROVISION=1
TRIALS_ROOT=/var/trials
PUBLIC_API_URL=https://shop-api.trialvo.com
LETSENCRYPT_EMAIL=ops@trialvo.com
```

## Verify

```bash
dig +short test.trial.trialvo.com
# → TRAEFIK_HOST_IP

curl -I https://test.trial.trialvo.com
```

## Local / staging without public DNS

Use `/etc/hosts` (or Windows `C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 lifestyle-abc123.trial.trialvo.com
127.0.0.1 admin-lifestyle-abc123.trial.trialvo.com
127.0.0.1 api-lifestyle-abc123.trial.trialvo.com
```

And run Traefik with HTTP only for local (disable ACME) if needed.
