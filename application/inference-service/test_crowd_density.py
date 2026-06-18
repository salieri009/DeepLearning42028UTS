"""Unit tests for PRD §8 crowd density classification (FR-2)."""

from main import _crowd_density


def test_zero_persons_is_low():
    assert _crowd_density(0, "SAFE") == "LOW"


def test_prd_low_band():
    assert _crowd_density(1, "SAFE") == "LOW"
    assert _crowd_density(2, "SAFE") == "LOW"


def test_prd_medium_band():
    assert _crowd_density(3, "SAFE") == "MEDIUM"
    assert _crowd_density(5, "SAFE") == "MEDIUM"


def test_prd_high_band():
    assert _crowd_density(6, "SAFE") == "HIGH"
    assert _crowd_density(10, "SAFE") == "HIGH"


def test_warning_elevates_low_to_medium():
    assert _crowd_density(2, "WARNING") == "MEDIUM"


def test_danger_elevates_to_high():
    assert _crowd_density(1, "DANGER") == "HIGH"
    assert _crowd_density(3, "DANGER") == "HIGH"
