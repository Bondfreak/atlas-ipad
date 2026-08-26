from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def test_p17_client_is_fail_closed() -> None:
    client = read("shaka-core-client.js")
    assert "/api/v1/cog/diagnostics/" in client
    assert "loadCanonicalDiagnostic" in client
    assert "diagnostic_bounded_partial" in client
    assert "verified_diagnostic_anchors_with_explicit_candidate_investigation" in client
    assert "rootCauseDetermined!==false" in client
    assert "candidateRelationsPromoted!==false" in client
    assert "physicalCableRoutingVerified!==false" in client


def test_p17_ui_preserves_verified_candidate_boundary() -> None:
    ui = read("p17-evc-diagnostic.js")
    assert "EVC · DIAGNOSTIK" in ui
    assert "VERIFIED · CHECK FØRST" in ui
    assert "DEFERRED · UNDERSØG SENERE" in ui
    assert "Bounded · ingen root cause" in ui
    assert "Wake/power" in ui
    assert "Candidates må ikke læses som verificerede fejlveje" in ui


def test_p17_utf8_text_is_not_committed_as_mojibake() -> None:
    sources = read("p17-evc-diagnostic.js") + read("shaka-core-client.js")
    assert "Åbn diagnostik" in sources
    assert "FØRST" in sources
    assert "Ã" not in sources
    assert "â†" not in sources


def test_p17_service_worker_cache_and_load_order() -> None:
    sw = read("sw.js")
    version = read("m07-version.js")
    assert 'atlas-ipad-alpha-v0.3.36' in sw
    assert 'p17-evc-diagnostic.js' in sw
    assert "v0.3.36" in version
    assert sw.index("scripts.push(P17_EVC_DIAG)") < sw.index("scripts.push(M07_VERSION)")
