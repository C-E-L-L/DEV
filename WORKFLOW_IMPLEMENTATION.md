# CELL coursework workflow implementation

User-authorized scope (2026-11-10): implement the preceding review and the user's concrete diagnostic / smear preparation flow. Work in `juhun`; preserve other worktrees. Goal remains active until verified end to end.

## Requirements and completion evidence

- [x] One professor coursework entry/list, explicit diagnostic vs practice purpose; shared title, deadline, publication and result settings.
- [x] Diagnostic species selection, server-side labeled crop pool filtered by species, class counts/distribution validation and creation; species without data cannot create an empty diagnostic.
- [x] Student coursework places diagnostics first; draft/unpublished resources cannot be listed, fetched or answered by students.
- [x] Practice smear upload supports labels supplied as a file or explicit no-label choice; publish without labeling is allowed when chosen.
- [x] Professor can label in the creation flow, persist a partial draft, reload and continue. Labeling completion never publishes automatically; explicit publish action is separate.
- [x] False-positive / bad-location cells can be excluded with a reason. Excluded cells are absent from student questions, submission denominators, grading, reports/statistics and calibration; server rejects direct answers.
- [x] Data menu lists prepared/labeled smears and supports continuing labeling / creating coursework from retained data.
- [x] Common label-change path updates grading and confusion matrices for UI edits and JSON imports; corrections are idempotent.
- [x] Explicit final submission separate from autosaved answers; unknown response separate from questions/image reports; consistent completion and result-release behavior.
- [x] Professor student roster/account management and student learning views; questions/reports remain accessible.
- [x] Species/class settings support stable identities, historical preservation and visible AI support boundaries.
- [x] Diagnostic vs cumulative calibration views scoped by species/class configuration, sample counts and inference provenance/readiness; do not treat inferred labels as GT.
- [x] Database migration for existing installations, compatibility with existing published tasks, mock workflow parity and relevant automated tests. Browser verification is unavailable (no connected browser).

## Implementation sequence

1. Persistent draft/publication/exclusion state, publication guards, species-aware diagnostics and common label updates.
2. Professor coursework builder/editor, data browser and student ordered unified list; update mock server.
3. Submission/unknown handling, students/settings/calibration follow-through.
4. Migration and regression tests, rendered UI and full requirements audit.

## Inspection baseline

- `juhun` clean at `738a46d` when work started; `main` has unrelated local changes.
- Existing Assignment groups per-smear Tasks. Diagnostic is a Task identified by filename prefix, sourced from a fixed Dog manifest.
- Existing task creation publishes immediately by implication; no draft visibility guard. CellType is a Java enum with six values.
- JSON label import bypasses confusion-matrix backfill. Final submit currently retrieves results; last response locks diagnostic automatically.
- DS inference is a normalization scaffold, not a complete implemented inference pipeline.

## Progress / verification

Implemented in the juhun worktree. See COURSEWORK_WORKFLOW.md for user flows, migration instructions and explicit limitations.

- Backend: 120 tests passed, including 11 workflow integration tests and 2 diagnostic manifest tests.
- Frontend: 24 Node tests passed; Vite production build passed.
- Isolated Vite mock HTTP smoke passed: diagnostic draft/publish, exclusions, student answers and finalization, smear multipart upload, JSON labels, data, class settings, calibration and student roster.
- Dynamic class codes persist as strings; per-task label catalogs preserve existing coursework after settings changes. Species and classes use deactivation rather than destructive deletion.
- Calibration is separated by species and class code configuration; source task IDs and missing-class counts are returned. The DS-MAP algorithm remains the pre-existing scaffold; this work prepares its inputs, not a new inference algorithm.
- Browser layout/click verification unavailable: computer-use inventory contained no browser surfaces. No browser verification claimed.
- MySQL migration prepared but not executed on an operational database; backend persistence tests use isolated H2.
- Real AI detection is an external dependency; the mock HTTP test uses synthetic cells.
- Published coursework retains student history; the new professor detail view hides legacy destructive deletion controls.
- Class/cohort targeting remains the existing common student audience; separate course enrollment was not added.

