"""Evaluate a YOLO checkpoint (e.g. best.pt) and optionally export ONNX for Spring/ONNX Runtime."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.repo_paths import default_data_yaml  # noqa: E402
from src.training import describe_runtime, resolve_training_device  # noqa: E402


def _resolve_data_yaml(path: Path | None) -> Path:
    if path is not None:
        return path.expanduser().resolve()
    env = os.environ.get("CROWDNAV_DATA_YAML")
    if env:
        return Path(env).expanduser().resolve()
    return default_data_yaml().resolve()


def main() -> int:
    p = argparse.ArgumentParser(
        description="Run YOLO val() on weights and optionally export ONNX (with NMS) for crowdnav-api.",
    )
    p.add_argument("--weights", type=Path, required=True, help="Checkpoint path (e.g. weights/best.pt)")
    p.add_argument("--data-yaml", type=Path, default=None, help="Dataset yaml (default: env or repo splits)")
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--device", default=None)
    p.add_argument(
        "--export-onnx",
        action="store_true",
        help="Export ONNX after val (NMS embedded by default; matches Java decoder)",
    )
    p.add_argument(
        "--nms",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Embed NMS in ONNX export (default: true; use --no-nms for raw ONNX)",
    )
    args = p.parse_args()

    data_yaml = _resolve_data_yaml(args.data_yaml)
    if not data_yaml.is_file():
        print(f"[CrowdNav] ERROR: data.yaml not found: {data_yaml}", file=sys.stderr)
        return 2

    weights = args.weights.expanduser().resolve()
    if not weights.is_file():
        print(f"[CrowdNav] ERROR: weights not found: {weights}", file=sys.stderr)
        return 2

    from ultralytics import YOLO  # noqa: E402

    device = resolve_training_device(args.device)
    print(f"[CrowdNav] runtime={describe_runtime()} device={device!r}")
    print(f"[CrowdNav] weights={weights}")
    print(f"[CrowdNav] data_yaml={data_yaml}")

    model = YOLO(str(weights))
    results = model.val(data=str(data_yaml), imgsz=args.imgsz, batch=args.batch, device=device)
    rd = getattr(results, "results_dict", None)
    if isinstance(rd, dict):
        print("[CrowdNav] metrics:")
        for k in sorted(rd.keys()):
            print(f"  {k}: {rd[k]}")

    if args.export_onnx:
        out = model.export(format="onnx", imgsz=args.imgsz, nms=args.nms, simplify=True)
        print(f"[CrowdNav] exported ONNX: {out}")
        if not args.nms:
            print(
                "[CrowdNav] NOTE: Spring OnnxAnalyzeFrameService expects NMS-included ONNX; re-run without --no-nms.",
                file=sys.stderr,
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
