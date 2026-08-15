from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CORE_ORIGIN = "https://shaka-core-app.onrender.com"
SERVER_ORIGIN = "https://shaka-server.onrender.com"


class M06RoutingTests(unittest.TestCase):
    def test_shared_client_targets_server(self):
        client = (ROOT / "shaka-core-client.js").read_text(encoding="utf-8")
        self.assertIn(SERVER_ORIGIN, client)
        self.assertNotIn(CORE_ORIGIN, client)
        for route in (
            "/api/v1/asset-instances/",
            "/graph?depth=",
            "/resolve-asset/",
            "/api/v1/objects/",
        ):
            self.assertIn(route, client)

    def test_service_worker_has_no_direct_core_origin(self):
        worker = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn(SERVER_ORIGIN, worker)
        self.assertNotIn(CORE_ORIGIN, worker)
        self.assertIn('const SERVER_ORIGIN =', worker)

    def test_normal_ui_integration_has_no_direct_core_host(self):
        integration = (ROOT / "core-live-integration.js").read_text(encoding="utf-8")
        self.assertNotIn(CORE_ORIGIN, integration)
        self.assertIn("window.ShakaCore.loadAssetInstance", integration)
        self.assertIn("window.ShakaCore.resolveAssetInstance", integration)
        self.assertIn("window.ShakaCore.loadObjectDetail", integration)

    def test_dynamic_values_remain_text_rendered(self):
        integration = (ROOT / "core-live-integration.js").read_text(encoding="utf-8")
        self.assertIn("el.textContent=value", integration)
        self.assertIn("nodeTitleEl.textContent", integration)
        self.assertIn("nodeMetaEl.textContent", integration)


if __name__ == "__main__":
    unittest.main()
