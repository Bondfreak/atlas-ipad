from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CORE_ORIGIN = "https://shaka-core-app.onrender.com"
SERVER_ORIGIN = "https://shaka-server.onrender.com"


class M07DeterministicFlowTests(unittest.TestCase):
    def setUp(self):
        self.flow = (ROOT / "m07-deterministic-flow.js").read_text(encoding="utf-8")
        self.worker = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.version = (ROOT / "m07-version.js").read_text(encoding="utf-8")

    def test_flow_uses_canonical_server_mediated_projection_only(self):
        self.assertIn("window.ShakaCore.loadCanonicalFlow", self.flow)
        self.assertIn("SYS-D4-BB-Seawater", self.flow)
        self.assertIn("SYS-D4-BB-Exhaust", self.flow)
        self.assertNotIn(CORE_ORIGIN, self.flow)
        self.assertNotIn("neon", self.flow.lower())
        self.assertNotIn("postgres", self.flow.lower())
        self.assertNotIn("FLOW_TO", self.flow)

    def test_flow_renders_separate_cooling_and_exhaust_panels(self):
        self.assertIn("KØLESYSTEM · COG FLOW", self.flow)
        self.assertIn("UDSTØDNING · COG FLOW", self.flow)
        self.assertIn("FLOWS.map(createFlowPanel)", self.flow)
        self.assertIn("flow.circuitId!==config.id", self.flow)

    def test_flow_membership_and_direction_come_from_projection(self):
        self.assertIn("flow.nodes", self.flow)
        self.assertIn("flow.edges", self.flow)
        self.assertIn("edge.from", self.flow)
        self.assertIn("edge.to", self.flow)
        self.assertIn("appendArrow()", self.flow)
        self.assertNotIn("AI-D4-BB-SeaWaterFilter", self.flow)
        self.assertNotIn("AI-D4-BB-CAC", self.flow)
        self.assertNotIn("AI-D4-BB-Waterlock", self.flow)
        self.assertNotIn("AI-D4-BB-ExhaustOutlet", self.flow)

    def test_ambiguous_cyclic_or_disconnected_flow_fails_closed(self):
        self.assertIn("Canonical flow forgrener", self.flow)
        self.assertIn("Canonical flow indeholder cyklus", self.flow)
        self.assertIn("Canonical flow indeholder frakoblede noder", self.flow)
        self.assertIn("COG flow utilgængelig", self.flow)

    def test_partial_and_complete_status_come_from_projection(self):
        self.assertIn("deferredCandidateCount", self.flow)
        self.assertIn("Canonical · delvis", self.flow)
        self.assertIn("Canonical · komplet", self.flow)
        self.assertIn("downstream candidate-relation", self.flow)
        self.assertIn("Kun verified COG-relations bruges.", self.flow)
        self.assertNotIn("candidate.from", self.flow)
        self.assertNotIn("candidate.to", self.flow)

    def test_service_worker_loads_flow_without_direct_core_fallback(self):
        self.assertIn('"./m07-deterministic-flow.js"', self.worker)
        self.assertIn('"./m07-version.js"', self.worker)
        self.assertIn(SERVER_ORIGIN, self.worker)
        self.assertNotIn(CORE_ORIGIN, self.worker)

    def test_visible_version_and_service_worker_cache_are_synchronized(self):
        self.assertIn("const VERSION='v0.3.33'", self.version)
        self.assertIn('const CACHE = "atlas-ipad-alpha-v0.3.33"', self.worker)


if __name__ == "__main__":
    unittest.main()
