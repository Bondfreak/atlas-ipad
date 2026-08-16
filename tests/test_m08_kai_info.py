from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SERVER_ORIGIN = "https://shaka-server.onrender.com"
CORE_ORIGIN = "https://shaka-core-app.onrender.com"


class M08KaiInfoTests(unittest.TestCase):
    def setUp(self):
        self.kai = (ROOT / "m08-kai-info.js").read_text(encoding="utf-8")
        self.worker = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.version = (ROOT / "m07-version.js").read_text(encoding="utf-8")

    def test_kai_calls_only_server_bounded_endpoint(self):
        self.assertIn(SERVER_ORIGIN, self.kai)
        self.assertIn("/api/v1/kai/explain", self.kai)
        self.assertIn("method:'POST'", self.kai)
        self.assertIn("intent:'explain_selected_context'", self.kai)
        self.assertNotIn(CORE_ORIGIN, self.kai)
        self.assertNotIn("neon", self.kai.lower())
        self.assertNotIn("postgres", self.kai.lower())

    def test_no_model_provider_secret_is_present_in_atlas(self):
        for forbidden in (
            "OPENAI_API_KEY",
            "api.openai.com",
            "Authorization: Bearer",
            "sk-",
        ):
            self.assertNotIn(forbidden, self.kai)

    def test_dynamic_kai_output_is_text_rendered(self):
        self.assertIn("element.textContent=value", self.kai)
        self.assertNotIn("innerHTML=payload", self.kai)
        self.assertNotIn("insertAdjacentHTML", self.kai)

    def test_kai_unavailable_does_not_claim_navigation_is_broken(self):
        self.assertIn("Atlas-navigation og Core-visualisering virker fortsat uden KAI", self.kai)
        self.assertIn("Ingen forklaring vises uden et gyldigt grounded Server-svar", self.kai)

    def test_portrait_layout_moves_kai_out_of_hidden_info_body(self):
        self.assertIn("const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo')", self.kai)
        self.assertIn("getComputedStyle(infoBody).display==='none'", self.kai)
        self.assertIn("assemblyInfo.insertBefore(panel,infoBody)", self.kai)
        self.assertIn("window.addEventListener('orientationchange'", self.kai)

    def test_worker_caches_and_injects_m08_script(self):
        self.assertIn('"./m08-kai-info.js"', self.worker)
        self.assertIn("const M08_KAI", self.worker)
        self.assertIn("if(!body.includes('m08-kai-info.js'))scripts.push(M08_KAI)", self.worker)
        self.assertNotIn(CORE_ORIGIN, self.worker)

    def test_v030_version_and_cache_are_synchronized(self):
        self.assertIn("const VERSION='v0.3.30'", self.version)
        self.assertIn('const CACHE = "atlas-ipad-alpha-v0.3.30"', self.worker)


if __name__ == "__main__":
    unittest.main()
