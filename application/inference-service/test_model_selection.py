"""Model key resolution for FR-15 settings → inference."""

from main import MODEL_PATH_BY_KEY, _resolve_model_key


def test_resolve_default_model():
    assert _resolve_model_key(None) == "yolov8-precise"
    assert _resolve_model_key("") == "yolov8-precise"


def test_resolve_nano_model():
    assert _resolve_model_key("yolov8-nano") == "yolov8-nano"


def test_unknown_model_falls_back_to_precise():
    assert _resolve_model_key("unknown") == "yolov8-precise"


def test_model_paths_configured():
    assert "yolov8-precise" in MODEL_PATH_BY_KEY
    assert "yolov8-nano" in MODEL_PATH_BY_KEY
