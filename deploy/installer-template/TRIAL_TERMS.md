# Trialvo Trial Terms (Option 2 — Client Hosted)

This package deploys a **time-limited trial** of the licensed product.

## License Agent

A License Agent (or embedded client) contacts Trialvo Control Plane to:

- renew a cryptographic **lease** that unlocks admin/API panels
- receive remote commands: freeze, unfreeze, backup, restore, destroy

When the trial expires or an admin issues **freeze**, protected panels return `403 TRIAL_LOCKED`.

## What you may do

- Evaluate the product on your own domain/hosting during the approved trial window
- Keep application data you create (subject to backup/export features)

## What you may not do

- Remove, patch, or bypass the License Agent / lease gate
- Redistribute trial images, registry credentials, or installer secrets
- Continue using the trial software after expiry without a paid license

## Registry access

Pull credentials in `agent.env` / `setup.sh` are **scoped and time-limited**. At trial end they are revoked.

Violations may result in immediate freeze/destroy and legal action under your Trial License Agreement with Trialvo.
