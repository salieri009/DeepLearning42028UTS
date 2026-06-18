"""
Canonical CrowdNav domain policy (FR-2 / FR-3 / PRD §8).

Single source of truth for proximity, crowd density, and recommendation heuristics.
Consumed by main.py; mirrored in Java CrowdNavPolicy for mock/contract tests.
"""

from __future__ import annotations

SAFE_MAX = 0.25
WARN_MAX = 0.45


def proximity_from_height(norm_height: float) -> str:
    h = max(0.0, min(1.0, norm_height))
    if h < SAFE_MAX:
        return "SAFE"
    if h < WARN_MAX:
        return "WARNING"
    return "DANGER"


def worst_proximity_risk(states: list[str]) -> str:
    if "DANGER" in states:
        return "DANGER"
    if "WARNING" in states:
        return "WARNING"
    return "SAFE"


def crowd_density(person_count: int, worst: str, density_limit: int = 64) -> str:
    """PRD §8 bands scaled by density_limit (default 64 → low≤2, med≤5). FR-2 risk elevation."""
    limit = max(1, min(500, density_limit))
    low_max = max(1, limit // 32)
    med_max = max(low_max + 1, (limit * 5) // 64)

    if person_count == 0:
        return "LOW"
    if person_count <= low_max:
        base = "LOW"
    elif person_count <= med_max:
        base = "MEDIUM"
    else:
        base = "HIGH"
    if worst == "DANGER":
        return "HIGH"
    if worst == "WARNING" and base == "LOW":
        return "MEDIUM"
    return base


def recommendation(worst: str) -> str:
    return {"SAFE": "PROCEED", "WARNING": "CAUTION", "DANGER": "STOP"}.get(worst, "PROCEED")
