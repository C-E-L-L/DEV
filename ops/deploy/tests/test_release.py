import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("make_release", Path(__file__).parents[1] / "make_release.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.source = {"services": {name: {"build": {"context": "/ci/source/" + name}}
                                    for name in (*builder.SERVICES, "mysql")}}
        self.source["services"]["backend"]["volumes"] = [
            {"type": "bind", "source": "./data", "target": "/data"}]
        self.images = {name: "ghcr.io/c-e-l-l/dev-" + name + "@sha256:" + "a" * 64
                       for name in builder.SERVICES}

    def build(self):
        return builder.make_bundle(copy.deepcopy(self.source), self.images, "C-E-L-L/DEV", "b" * 40, 2, 1, {})

    def test_no_ci_paths_builds_or_new_db_volume_in_production(self):
        manifest, data = self.build()
        compose = json.loads(data)
        self.assertNotIn(b"/ci/source", data)
        self.assertTrue(all("build" not in s for s in compose["services"].values()))
        self.assertEqual(compose["services"]["backend"]["volumes"][0]["source"], "${CELL_SERVER_ROOT}/data")
        self.assertEqual(compose["volumes"]["mysql-data"], {"external": True, "name": "dev_mysql-data"})
        self.assertEqual(compose["services"]["mysql"]["image"], "mysql:8.0.46")
        self.assertEqual(manifest["images"], self.images)

    def test_partial_image_build_cannot_be_released(self):
        del self.images["backend"]
        with self.assertRaises(ValueError):
            self.build()

    def test_mutable_tag_or_other_registry_is_rejected(self):
        for image in ("ghcr.io/c-e-l-l/dev-backend:latest", "ghcr.io/other/backend@sha256:" + "a" * 64):
            self.images["backend"] = image
            with self.assertRaises(ValueError):
                self.build()

    def test_new_host_mount_requires_explicit_deployment_review(self):
        self.source["services"]["backend"]["volumes"][0]["source"] = "/var/run/docker.sock"
        with self.assertRaises(ValueError):
            self.build()

    def test_compose_tampering_changes_checksum(self):
        import hashlib
        manifest, data = self.build()
        self.assertEqual(hashlib.sha256(data).hexdigest(), manifest["compose_sha256"])
        self.assertNotEqual(hashlib.sha256(data + b" ").hexdigest(), manifest["compose_sha256"])


if __name__ == "__main__":
    unittest.main()
