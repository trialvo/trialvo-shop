#!/usr/bin/env python3
"""Simulate CI deploy pipeline locally + optional remote smoke (no docker rebuild)."""
import io
import os
import subprocess
import sys
import tarfile
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[2]
OLD_HOST = "155.248.253.24"
OLD_USER = "opc"
OLD_KEY = Path(r"D:\qik earn\ssh-key-2026-03-19.key")
OLD_DIR = "/home/opc/trialvo-shop"

EXCLUDE_DIRS = {"node_modules", "dist", ".git", ".next", "target"}


def should_skip(path: Path) -> bool:
    return any(p in EXCLUDE_DIRS for p in path.parts)


def package_shop(out: Path) -> int:
    print("==> Package shop bundle (python tar)")
    count = 0
    with tarfile.open(out, "w:gz") as tar:
        for rel in [
            "trialvo-backend",
            "trialvo-frontend",
            "docker-compose.prod.yml",
            "docker-compose.shared-demo-remote.yml",
            "init-db-pay.sh",
        ]:
            base = ROOT / "trialvo-shop" / rel
            if base.is_file():
                tar.add(base, arcname=rel)
                count += 1
            elif base.is_dir():
                for f in base.rglob("*"):
                    if f.is_file() and not should_skip(f.relative_to(base)):
                        tar.add(f, arcname=f"{rel}/{f.relative_to(base).as_posix()}")
                        count += 1
        nginx = ROOT / "trialvo-shop/nginx"
        if nginx.is_dir():
            for f in nginx.rglob("*"):
                if f.is_file():
                    tar.add(f, arcname=f"nginx/{f.relative_to(nginx).as_posix()}")
                    count += 1
        script = ROOT / "scripts/ci/remote-deploy-shop.sh"
        lib = ROOT / "scripts/ci/lib.sh"
        tar.add(lib, arcname="scripts/ci/lib.sh")
        tar.add(script, arcname="scripts/ci/remote-deploy-shop.sh")
        count += 2
    print(f"   {count} files -> {out} ({out.stat().st_size // 1024} KB)")
    return count


def test_detect():
    print("==> Detect deploy targets (git)")
    before = subprocess.check_output(
        ["git", "rev-parse", "HEAD~5"], cwd=ROOT, text=True
    ).strip()
    after = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    # Windows may not have bash — use python grep
    changed = subprocess.check_output(
        ["git", "diff", "--name-only", before, after], cwd=ROOT, text=True
    )
    flags = {"shop": False, "demos": False, "pay": False}
    for line in changed.splitlines():
        if line.startswith("trialvo-shop/"):
            flags["shop"] = True
        if line.startswith("products/") or "shared-demo" in line or line.startswith("infra/"):
            flags["demos"] = True
        if line.startswith("trialvo-pay/"):
            flags["pay"] = True
        if line.startswith(".github/") or line.startswith("scripts/ci/"):
            flags["shop"] = True
            flags["demos"] = True
    print(f"   changed sample: {changed.splitlines()[:8]}")
    print(f"   flags: {flags}")
    return flags


def remote_smoke(bundle: Path, do_extract: bool = True):
    print("==> OLD VPS smoke (SSH)")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        OLD_HOST,
        username=OLD_USER,
        key_filename=str(OLD_KEY),
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
    )
    sftp = client.open_sftp()
    remote = f"{OLD_DIR}/shop-deploy-test.tgz"
    with sftp.file(remote, "wb") as f:
        f.write(bundle.read_bytes())
    sftp.close()

    cmd = f"""
set -e
cd {OLD_DIR}
curl -sf http://127.0.0.1:8088/health
echo
if [[ "{do_extract}" == "True" ]]; then
  cp shop-deploy-test.tgz shop-deploy.tgz
  tar -xzf shop-deploy.tgz
  chmod +x scripts/ci/*.sh 2>/dev/null || true
  test -f scripts/ci/lib.sh && echo LIB_OK
  test -f scripts/ci/remote-deploy-shop.sh && echo REMOTE_SCRIPT_OK
  test -f docker-compose.prod.yml && echo COMPOSE_OK
  export DEPLOY_FRONTEND=0 DEPLOY_BACKEND=0
  bash scripts/ci/remote-deploy-shop.sh
fi
echo SMOKE_OK
"""
    _, o, e = client.exec_command(cmd, timeout=120)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    code = o.channel.recv_exit_status()
    client.close()
    print(out)
    if err.strip():
        print("STDERR:", err[:500])
    return code == 0


def main():
    flags = test_detect()
    bundle_path = ROOT / ".ci-staging-shop-test.tgz"
    n = package_shop(bundle_path)
    if n < 5:
        print("FAIL: bundle too small")
        sys.exit(1)
    ok = remote_smoke(bundle_path)
    bundle_path.unlink(missing_ok=True)
    if not ok:
        sys.exit(1)
    print("\n[OK] Local CI simulation passed (bundle + OLD VPS remote script)")
    print("   Next: push to `deploy` branch for GitHub Actions")


if __name__ == "__main__":
    main()
