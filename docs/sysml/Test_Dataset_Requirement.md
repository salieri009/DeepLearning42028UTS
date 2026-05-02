---
last_updated: 2026-04-22
related_code:
  - train/src/data/
related_diagram:
  - ../architecture/System_Architecture_Documentation.md
---

# Human Object Detection Test Dataset Requirement

## Requirement
- Secure **20 test dataset samples** for human object detection.

## Purpose
- Validate baseline model performance on human-object detection under consistent evaluation conditions.

## Minimum annotation fields
Each sample must include:
- image (file path or ID)
- bbox coordinates: x_min, y_min, x_max, y_max
- class (must indicate human/person)

## Split policy
- Test-only dataset.
- No training/validation use is allowed for these 20 samples.

## Quality checklist
- Image is readable and not corrupted.
- Human object is visible and label matches image.
- Bounding box tightly encloses target.
- Coordinates are valid (x_min < x_max, y_min < y_max) and inside image bounds.
- Class label schema is consistent (person or approved equivalent).

## Done criteria
- 20/20 samples collected.
- All samples contain required fields.
- Quality checklist passed for every sample.
- Dataset is versioned and ready for test execution.

## Sample tracking checklist (20)
- [ ] Sample 01
- [ ] Sample 02
- [ ] Sample 03
- [ ] Sample 04
- [ ] Sample 05
- [ ] Sample 06
- [ ] Sample 07
- [ ] Sample 08
- [ ] Sample 09
- [ ] Sample 10
- [ ] Sample 11
- [ ] Sample 12
- [ ] Sample 13
- [ ] Sample 14
- [ ] Sample 15
- [ ] Sample 16
- [ ] Sample 17
- [ ] Sample 18
- [ ] Sample 19
- [ ] Sample 20

## Review request guide
- Include sample inventory source and version.
- Include annotation schema check result.
- Include who verified image-label consistency.
- Include any sample replacement reason for traceability.
