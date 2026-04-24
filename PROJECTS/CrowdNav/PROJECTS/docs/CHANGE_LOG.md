# Documentation Change Log

Date: 2026-04-22
Scope: `PROJECTS/CrowdNav/**/*.md`
Baseline: `origin/master` (`f64d78c` from earlier sync check)

## Summary
- Updated 15 markdown files in scope.
- Added YAML front matter to all scoped markdown docs.
- Added a `Review Request Guide` section to all scoped markdown docs.
- Replaced duplicated project-local README content with a concise scope README linking root canonical README.
- Rewrote `PRD.md` and `TechSpec.md` to align with current code architecture (YOLO + preprocessing/inference/mlops modules).
- Updated SysML architecture doc with metadata and an "Additional Updates Needed" backlog section.

## File-Level Notes
- `README.md` (CrowdNav local): now summary-only and canonical link oriented.
- `PROJECTS/PRD.md`: requirements now tied to implemented module boundaries.
- `PROJECTS/TechSpec.md`: stack corrected to current code reality.
- `PROJECTS/sysml/System_Architecture_Documentation.md`: backlog section added.
- `src/*/README.md` set: standardized command and review guidance.

## Risk and Caveats
- Some project planning assertions remain intentionally high-level in PRD.
- Deployment architecture is still partial in implementation and remains listed as open work.
