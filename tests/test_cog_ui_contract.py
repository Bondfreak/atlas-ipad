from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CogUiContractTests(unittest.TestCase):
    def test_browser_client_uses_server_cog_endpoints(self) -> None:
        text = (ROOT / "shaka-core-client.js").read_text(encoding="utf-8")
        self.assertIn("/api/v1/cog/graphs/", text)
        self.assertIn("/api/v1/cog/objects/", text)
        self.assertIn("loadCanonicalGraph", text)
        self.assertIn("loadCanonicalObject", text)

    def test_browser_client_fails_closed_on_non_verified_relation(self) -> None:
        text = (ROOT / "shaka-core-client.js").read_text(encoding="utf-8")
        self.assertIn("edge?.status!=='verified'", text)
        self.assertIn("Canonical response contains non-verified relation", text)

    def test_live_panel_is_canonical_first(self) -> None:
        text = (ROOT / "core-live-integration.js").read_text(encoding="utf-8")
        self.assertIn("NAV-COG-D4-BB-COOLING-v0.1", text)
        self.assertIn("NAVIGATOR COG · LIVE READ-ONLY", text)
        self.assertIn("Canonical verified relations", text)
        self.assertIn("loadCanonicalObject(INSTANCE_ID)", text)
        self.assertIn("loadCanonicalGraph(CANONICAL_GRAPH_ID)", text)


if __name__ == "__main__":
    unittest.main()
