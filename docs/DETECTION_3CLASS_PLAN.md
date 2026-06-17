---
last_updated: 2026-06-17
status: draft
related:
  - PROJECTS/CrowdNav/data/processed/splits/data.yaml
  - train/src/data/jrdb_to_yolo.py
  - train/src/data/split_by_sequence.py
  - train/scripts/train_yolo.py
  - application/inference-service/main.py
  - docs/API_SPEC.md
  - docs/BACKEND_ERD.md
---

# Three-Object Detection Plan (person + wheelchair + luggage)

## 1. Goal & Rationale

Extend detection from the current **single class** (`person`, `nc: 1`) to **three accessibility-relevant
classes**: `person`, `wheelchair`, `luggage`. These are the obstacle types most relevant to a wheelchair
user navigating a transport hub: other pedestrians, other wheeled mobility devices, and ground luggage
that blocks a path. This realizes **FR-13 / NFR-3b** in [`REQUIREMENTS.md`](REQUIREMENTS.md).

**Current state** (`PROJECTS/CrowdNav/data/processed/splits/data.yaml`):
```yaml
nc: 1
names: [person]
```
Inference filters to `classes=[0]` in `application/inference-service/main.py`.

## 2. Class Definitions

| id | name | Definition / annotation guideline |
|----|------|-----------------------------------|
| 0 | `person` | Any standing/walking/seated pedestrian **not** in a wheelchair. Keep JRDB convention. |
| 1 | `wheelchair` | A wheelchair, with or without an occupant. Box bounds the chair (and wheels). If occupant is clearly visible above the chair, label the chair as `wheelchair` and the upper body may additionally be `person` only if separable; default = single `wheelchair` box. |
| 2 | `luggage` | Suitcases, rolling bags, backpacks, and handbags placed on/near the ground that act as obstacles. Merge of several COCO bag classes (see §3). |

Document edge cases in a short annotation README beside the dataset (occlusion, group luggage, person pushing a wheelchair).

## 3. Data Strategy (the hard part)

No single dataset covers all three classes, so the unified set is **assembled** from sources, each
remapped to the ids in §2.

| Class | Source | Acquisition & remap |
|-------|--------|---------------------|
| `person` (0) | **JRDB** (existing, ~411k boxes) | Already YOLO-format via `train/src/data/jrdb_to_yolo.py`. Keep class id 0. |
| `luggage` (2) | **COCO 2017** `suitcase`(33), `backpack`(27), `handbag`(31)* | Filter COCO annotations to these categories, **merge → single id 2**, convert COCO bbox→YOLO normalized via a new `coco_to_yolo.py` mirroring the `to_yolo()` / `write_yolo_files()` pattern in `train/src/data/`. |
| `wheelchair` (1) | Not in COCO. Primary: **Roboflow Universe** wheelchair datasets and/or **Open Images V7** `Wheelchair` class. Supplement: **pseudo-label** with a generic detector then **manual review**. | Convert each source to YOLO, remap its wheelchair class → id 1. Prefer real labels; use pseudo-labels (pattern: `train/src/data/pseudo_label_yolov8.py`) only to bootstrap, always human-verified. |

\* Confirm exact COCO category ids at implementation time (COCO ids are sparse). The merge intent is "anything a traveller carries/rolls."

### 3.1 Merge into one dataset
- Build per-source YOLO label dirs, then **concatenate** into a unified tree, remapping class ids.
- Re-run the existing splitter `train/src/data/split_by_sequence.py` (or a class-aware variant) to keep
  **train/val/test = 8:1:1** without sequence leakage.
- Emit a new `data.yaml`:
```yaml
path: .
train: train/images
val: val/images
test: test/images
nc: 3
names: [person, wheelchair, luggage]
```

### 3.2 Class balance
JRDB person boxes vastly outnumber wheelchair/luggage. Mitigate with: per-class image sampling caps,
copy-paste / mosaic augmentation for rare classes, and **report per-class instance counts** in the
dataset card. Track balance because it directly drives the per-class mAP gate (§6).

## 4. Pipeline Changes (file-level)

| File | Change |
|------|--------|
| new `data.yaml` (processed splits) | `nc: 3`, names per §3.1. Do **not** edit the existing `nc:1` yaml in place — write a new `splits_3class/` to keep the person-only baseline reproducible. |
| new `train/src/data/coco_to_yolo.py` | COCO→YOLO conversion + class remap for `luggage`. Reuse `io_utils`/`converter` helpers. |
| new `train/src/data/merge_datasets.py` | Concatenate per-source YOLO trees, remap ids, dedupe. |
| `train/scripts/train_yolo.py` | **No code change** — point `--data` at the new `data.yaml`. |
| `application/inference-service/main.py` | `classes=[0]` → `classes=[0,1,2]`; map YOLO class id → name; set `proximity_risk` for person+wheelchair; exclude `luggage` from `_crowd_density` count (treat as static obstacle, still returned). |
| `application/frontend/src/features/video/VideoFeed.tsx` | Render class name on the label chip; keep risk colors from tokens (per [`DESIGN_RULES.md`](DESIGN_RULES.md) §4–5). Add a class legend. |
| `application/frontend/src/types.ts` | `class` type → `"person" \| "wheelchair" \| "luggage"`. |
| DTO `PersonDetection.java` | `class` field already a free string — no schema break; document enum in [`API_SPEC.md`](API_SPEC.md) §7. |
| `docs/BACKEND_ERD.md` `detection.class_label` | enum gains `wheelchair`, `luggage`. |

## 5. Training Plan

- **Init:** transfer-learn from the current person-only `best.pt` (warm start) rather than COCO `yolov8m.pt`,
  so person performance is preserved while the head learns the 2 new classes.
- **Freeze schedule:** optionally freeze backbone for the first few epochs to stabilize the new head,
  then unfreeze and fine-tune end-to-end.
- **Defaults** (reuse `train/scripts/train_yolo.py`): `yolov8m`, 100 epochs, early-stop patience 20,
  batch 16, workers 4, auto CUDA/CPU device, `imgsz` default. Suited to `ml.g4dn.xlarge` (T4, 16 GB) /
  local RTX 3050.
- **Command:**
```bash
cd train
python scripts/train_yolo.py --model-cfg /path/to/person_best.pt \
  --data <repo>/data/processed/splits_3class/data.yaml \
  --epochs 100 --batch 16 --workers 4
```
- **Track** with ClearML (existing integration); log per-class mAP each epoch.

## 6. Acceptance Criteria (per-class mAP@0.5, val split)

| Class | Target mAP@0.5 | Notes |
|-------|----------------|-------|
| person | ≥ 0.40 | Must not regress vs. baseline 0.4475. |
| wheelchair | ≥ 0.35 | Rare class; balance-dependent. |
| luggage | ≥ 0.35 | Merged bag class. |

Plus end-to-end: the Docker demo shows three distinct labeled, color-coded box types live, and the
stats panel/recommendation behave correctly with non-person obstacles present.

## 7. Downstream Impact Checklist

- [ ] API `class` enum documented (`person|wheelchair|luggage`) — [`API_SPEC.md`](API_SPEC.md) §7.
- [ ] Inference `classes=[0,1,2]` + class-name mapping + density rule for luggage.
- [ ] Frontend label chip shows class; legend added; risk colors via tokens.
- [ ] `types.ts` `class` union updated.
- [ ] ERD `detection.class_label` enum extended.
- [ ] New `data.yaml` (`nc:3`); baseline `nc:1` yaml left intact for reproducibility.
- [ ] Per-class instance counts + mAP reported in `docs/reports/`.

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Severe class imbalance → poor wheelchair/luggage recall | Sampling caps, augmentation, targeted data collection. |
| Domain gap (COCO/Roboflow vs. JRDB POV/low-vantage) | Prefer low-angle sources; augment scale/perspective; validate on POV frames. |
| Pseudo-label noise | Human-review every pseudo-labeled wheelchair image before training. |
| Person regression after retrain | Warm-start from person `best.pt`; gate on person mAP ≥ baseline. |
| Annotation inconsistency (person-in-wheelchair) | Written annotation guideline + spot audits. |
