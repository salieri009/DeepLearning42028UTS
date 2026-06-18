"""Unit tests for PRD §8 crowd density classification (FR-2)."""

from crowdnav_policy import crowd_density


def test_zero_persons_is_low():
    assert crowd_density(0, "SAFE") == "LOW"


def test_prd_low_band():
    assert crowd_density(1, "SAFE") == "LOW"
    assert crowd_density(2, "SAFE") == "LOW"


def test_prd_medium_band():
    assert crowd_density(3, "SAFE") == "MEDIUM"
    assert crowd_density(5, "SAFE") == "MEDIUM"


def test_prd_high_band():
    assert crowd_density(6, "SAFE") == "HIGH"
    assert crowd_density(10, "SAFE") == "HIGH"


def test_warning_elevates_low_to_medium():
    assert crowd_density(2, "WARNING") == "MEDIUM"


def test_danger_elevates_to_high():
    assert crowd_density(1, "DANGER") == "HIGH"
    assert crowd_density(3, "DANGER") == "HIGH"
