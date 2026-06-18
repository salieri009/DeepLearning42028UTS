"""Contract tests: Java and Python policy must match crowdnav-policy-golden.json."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from crowdnav_policy import crowd_density, proximity_from_height, recommendation, worst_proximity_risk

GOLDEN_PATH = Path(__file__).resolve().parent.parent / "contracts" / "crowdnav-policy-golden.json"


@pytest.fixture(scope="module")
def golden() -> dict:
    with GOLDEN_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_proximity_from_height_contract(golden: dict) -> None:
    for case in golden["proximity_from_height"]:
        assert proximity_from_height(case["height"]) == case["expected"]


def test_crowd_density_contract(golden: dict) -> None:
    for case in golden["crowd_density"]:
        assert crowd_density(case["count"], case["worst"]) == case["expected"]


def test_crowd_density_scaled_contract(golden: dict) -> None:
    for case in golden["crowd_density_scaled"]:
        assert (
            crowd_density(case["count"], case["worst"], case["density_limit"])
            == case["expected"]
        )


def test_recommendation_contract(golden: dict) -> None:
    for case in golden["recommendation"]:
        assert recommendation(case["worst"]) == case["expected"]


def test_mock_fixture_contract(golden: dict) -> None:
    fixture = golden["mock_fixture"]
    min_conf = fixture["min_confidence"]
    risks = []
    count = 0
    for person in [
        {"confidence": 0.92, "height": 0.34},
        {"confidence": 0.88, "height": 0.20},
    ]:
        if person["confidence"] >= min_conf:
            count += 1
            risks.append(proximity_from_height(person["height"]))

    worst = worst_proximity_risk(risks)
    expected = fixture["expected"]
    assert count == expected["persons_count"]
    assert crowd_density(count, worst) == expected["crowd_density"]
    assert worst == expected["max_proximity_risk"]
    assert recommendation(worst) == expected["recommendation"]
