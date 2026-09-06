from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
SERVER_ORIGIN = "https://shaka-server.onrender.com"
VERSION = "v0.3.37"
CACHE = "atlas-ipad-alpha-v0.3.37"


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


class S4F1AnswerUiTests(unittest.TestCase):
    def setUp(self):
        self.origin = read("server-origin.js")
        self.client = read("shaka-core-client.js")
        self.ui = read("s4-f1-answer.js")
        self.kai = read("m08-kai-info.js")
        self.worker = read("sw.js")
        self.version = read("m07-version.js")
        self.docs = read("S4_F1_ANSWER_UI.md")

    def test_server_origin_default_and_local_override_docs(self):
        self.assertIn(SERVER_ORIGIN, self.origin)
        self.assertIn("ATLAS_SERVER_ORIGIN", self.origin)
        self.assertIn("resolveServerOrigin", self.origin)
        self.assertIn("http://127.0.0.1:8000", self.docs)
        self.assertIn("?server=", self.docs)

    def test_client_posts_f1_answer_only_via_server(self):
        self.assertIn("/api/v1/f1/answer", self.client)
        self.assertIn("postF1Answer", self.client)
        self.assertIn("method:'POST'", self.client)
        self.assertIn(SERVER_ORIGIN, self.client)
        self.assertNotIn("shaka-core-app.onrender.com", self.client)
        self.assertNotIn("neon", self.client.lower())
        self.assertNotIn("postgres", self.client.lower())

    def test_ui_danish_labels_and_text_rendering(self):
        for label in ("Konklusion", "Basis", "Epistemisk status", "Kilder", "Sp\u00f8rg F1"):
            self.assertIn(label, self.ui)
        self.assertIn("element.textContent=value", self.ui)
        self.assertNotIn("innerHTML=payload", self.ui)
        self.assertNotIn("insertAdjacentHTML", self.ui)
        self.assertNotIn("\u00c3", self.ui)

    def test_kai_explain_kept_with_graceful_degrade(self):
        self.assertIn("/api/v1/kai/explain", self.kai)
        self.assertIn("Atlas-navigation og Core-visualisering virker fortsat uden KAI", self.kai)
        self.assertIn("F1/evidens", self.kai)
        self.assertIn(SERVER_ORIGIN, self.kai)

    def test_worker_injects_config_client_and_f1_ui(self):
        self.assertIn('"./server-origin.js"', self.worker)
        self.assertIn('"./s4-f1-answer.js"', self.worker)
        self.assertIn("const SERVER_ORIGIN_CFG", self.worker)
        self.assertIn("const S4_F1", self.worker)
        self.assertIn("if(!body.includes('server-origin.js'))scripts.push(SERVER_ORIGIN_CFG)", self.worker)
        self.assertIn("if(!body.includes('s4-f1-answer.js'))scripts.push(S4_F1)", self.worker)
        self.assertLess(
            self.worker.index("scripts.push(SERVER_ORIGIN_CFG)"),
            self.worker.index("scripts.push(CORE_CLIENT)"),
        )
        self.assertLess(
            self.worker.index("scripts.push(M08_KAI)"),
            self.worker.index("scripts.push(S4_F1)"),
        )
        self.assertIn(f'const CACHE = "{CACHE}"', self.worker)
        self.assertIn(f"const VERSION='{VERSION}'", self.version)

    def test_mock_fetch_roundtrip_with_node(self):
        script = ROOT / "tests" / "f1_answer_mock_fetch.mjs"
        result = subprocess.run(
            ["node", str(script)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("f1_answer_mock_fetch: ok", result.stdout)


if __name__ == "__main__":
    unittest.main()
