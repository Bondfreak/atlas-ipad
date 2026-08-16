from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CORE_ORIGIN = "https://shaka-core-app.onrender.com"
SERVER_ORIGIN = "https://shaka-server.onrender.com"


class M07DeterministicFlowTests(unittest.TestCase):
    def setUp(self):
        self.flow = (ROOT / "m07-deterministic-flow.js").read_text(encoding="utf-8")
        self.worker = (ROOT / "sw.js").read_text(encoding="utf-8")

    def test_flow_uses_existing_server_mediated_client_only(self):
        self.assertIn("window.ShakaCore.loadAssetInstance", self.flow)
        self.assertIn("window.ShakaCore.resolveAssetInstance", self.flow)
        self.assertNotIn(CORE_ORIGIN, self.flow)
        self.assertNotIn("neon", self.flow.lower())
        self.assertNotIn("postgres", self.flow.lower())

    def test_flow_membership_comes_from_returned_flow_edges(self):
        self.assertIn("(graph.edges||[]).filter", self.flow)
        self.assertIn("edge?.type===FLOW_RELATION", self.flow)
        self.assertIn("edge.from===rootId||edge.to===rootId", self.flow)
        self.assertNotIn("AI-D4-BB-SeaWaterFilter", self.flow)
        self.assertNotIn("AI-D4-BB-CAC", self.flow)

    def test_generic_asset_neighbors_are_contextually_resolved(self):
        self.assertIn("resolveAssetInstance(rootId,id)", self.flow)
        self.assertIn("if(id?.startsWith('ASSET-'))return 'asset'", self.flow)
        self.assertNotIn("PORT", self.flow)
        self.assertNotIn("STARBOARD", self.flow)

    def test_relation_direction_is_preserved_and_ambiguity_fails_closed(self):
        self.assertIn("incoming=edges.filter(edge=>edge.to===rootId)", self.flow)
        self.assertIn("outgoing=edges.filter(edge=>edge.from===rootId)", self.flow)
        self.assertIn("incoming.length!==1||outgoing.length!==1", self.flow)
        self.assertIn("appendArrow(incoming[0].type)", self.flow)
        self.assertIn("appendArrow(outgoing[0].type)", self.flow)
        self.assertIn("Ikke understøttet", self.flow)

    def test_acceptance_hook_is_explicit_inert_and_local_only(self):
        self.assertIn("new URLSearchParams(window.location.search).get('m07Acceptance')", self.flow)
        self.assertIn("if(ACCEPTANCE_MODE!=='missing-flow')return graph", self.flow)
        self.assertIn("acceptanceGraph(result.graph||{},rootId)", self.flow)
        self.assertIn("edge.from===rootId", self.flow)
        self.assertIn("Ikke understøttet · acceptance test", self.flow)
        self.assertNotIn("baseUrl:", self.flow)
        self.assertNotIn("fetch(", self.flow)

    def test_dynamic_authoritative_values_use_text_content(self):
        for expression in (
            "title.textContent=node.id",
            "meta.textContent=",
            "detailEl.textContent=",
            "message.textContent=",
        ):
            self.assertIn(expression, self.flow)

    def test_service_worker_loads_m07_without_direct_core_fallback(self):
        self.assertIn('"./m07-deterministic-flow.js"', self.worker)
        self.assertIn('"./m07-version.js"', self.worker)
        self.assertIn(SERVER_ORIGIN, self.worker)
        self.assertNotIn(CORE_ORIGIN, self.worker)


if __name__ == "__main__":
    unittest.main()
