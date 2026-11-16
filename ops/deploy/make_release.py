"""Create the public deployment assets. Never read production .env or runtime data."""
import hashlib
import json
import os
import re
from pathlib import Path

SERVICES = ("backend", "frontend", "ai-server", "colorizer")


def make_bundle(source, images, repository, sha, run_number, run_attempt, migrations):
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Expected a full source commit SHA")
    prefix = "ghcr.io/" + repository.lower() + "-"
    if set(images) != set(SERVICES):
        raise ValueError("All four application images must finish before publishing")
    for service, image in images.items():
        if not re.fullmatch(re.escape(prefix + service) + r"@sha256:[0-9a-f]{64}", image):
            raise ValueError("Unexpected image reference: " + service)
    if set(source["services"]) != {*SERVICES, "mysql"}:
        raise ValueError("Review deployment code before adding/removing services")
    for name, service in source["services"].items():
        service.pop("build", None)
        if name != "mysql":
            service["image"] = images[name]
            service["pull_policy"] = "never"  # pull explicitly, before touching running containers
        else:
            service["image"] = "mysql:8.0.46"  # automatic app releases never upgrade the DB
        for volume in service.get("volumes", []):
            if volume["type"] == "bind":
                path = volume["source"].replace("\\", "/").removeprefix("./")
                if path not in ("data", "ssl", "ai-server/weights", "acme-webroot"):
                    raise ValueError("Review new production bind mount: " + path)
                if path == "acme-webroot" and (name != "frontend" or not volume.get("read_only")):
                    raise ValueError("ACME webroot must be read-only in the frontend")
                volume["source"] = "${CELL_SERVER_ROOT}/" + path
    source["volumes"] = {
        "mysql-data": {"name": "dev_mysql-data", "external": True},
        "colorizer-data": {"name": "dev_colorizer-data", "external": True},
    }
    source["name"] = "dev"
    compose = (json.dumps(source, ensure_ascii=False, indent=2) + "\n").encode()
    manifest = {
        "schema": 1, "repository": repository, "sha": sha,
        "run_number": int(run_number), "run_attempt": int(run_attempt),
        "images": images,
        "compose_sha256": hashlib.sha256(compose).hexdigest(),
        "migrations": migrations,
    }
    return manifest, compose


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    images = {}
    for path in Path("image-metadata").glob("*.json"):
        images.update(json.loads(path.read_text()))
    migrations = {p.name: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
                  for p in sorted((root / "backend/sql").glob("*.sql"))}
    manifest, compose = make_bundle(
        json.loads(Path("compose.source.json").read_text()), images,
        os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_SHA"],
        os.environ["GITHUB_RUN_NUMBER"], os.environ["GITHUB_RUN_ATTEMPT"], migrations)
    out = Path("release-assets")
    out.mkdir(exist_ok=True)
    (out / "compose.json").write_bytes(compose)
    (out / "deploy.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
