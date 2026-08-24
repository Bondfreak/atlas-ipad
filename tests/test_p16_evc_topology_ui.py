from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class P16EvcTopologyUiTests(unittest.TestCase):
    def test_client_uses_server_topology_endpoint_fail_closed(self) -> None:
        text = (ROOT / "shaka-core-client.js").read_text(encoding="utf-8")
        self.assertIn("/api/v1/cog/topologies/", text)
        self.assertIn("loadCanonicalTopology", text)
        self.assertIn("edge?.status!=='verified'", text)
        self.assertIn("edge?.status!=='candidate'", text)
        self.assertIn("physicalCableRoutingVerified!==false", text)

    def test_controls_menu_opens_evc_topology(self) -> None:
        text = (ROOT / "p16-evc-topology.js").read_text(encoding="utf-8")
        self.assertIn("EPA-0006", text)
        self.assertIn("EVC · COG TOPOLOGY", text)
        self.assertIn("SYS-EVC", text)
        self.assertIn("NAV-COG-EVC-v0.1", text)
        self.assertIn("loadCanonicalTopology(SYSTEM_ID)", text)

    def test_verified_and_deferred_relations_are_visually_separate(self) -> None:
        text = (ROOT / "p16-evc-topology.js").read_text(encoding="utf-8")
        self.assertIn("VERIFIED · CANONICAL", text)
        self.assertIn("DEFERRED · IKKE VERIFICERET", text)
        self.assertIn("evcEdge verified", text)
        self.assertIn("evcEdge candidate", text)
        self.assertIn("fysisk kabelrouting er ikke verificeret", text)

    def test_service_worker_injects_p16_and_bumps_cache(self) -> None:
        sw = (ROOT / "sw.js").read_text(encoding="utf-8")
        version = (ROOT / "m07-version.js").read_text(encoding="utf-8")
        self.assertIn("atlas-ipad-alpha-v0.3.35", sw)
        self.assertIn("p16-evc-topology.js", sw)
        self.assertIn("v0.3.35", version)


if __name__ == "__main__":
    unittest.main()
