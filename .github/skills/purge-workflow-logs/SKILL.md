---
name: purge-workflow-logs
description: >
  Delete all transient workflow artefacts under .ai_workflow/ — specifically
  the logs/, backlog/, summaries/, and analysis/ directories and everything
  inside them. Use this skill when asked to clean up, remove, or purge workflow
  logs, backlogs, summaries, or analysis reports, or before starting a fresh
  workflow run to avoid stale data from previous runs.
---

## Overview

AI workflow runs accumulate three categories of transient output under
`.ai_workflow/`:

| Directory | Contents |
|-----------|----------|
| `logs/` | Per-run execution transcripts (`workflow.log`, `steps/*.log`, `prompts/**/*.md`) |
| `backlog/` | Pending step-definition files carried forward across runs |
| `summaries/` | Executive summary reports per run (`workflow_summary.md`) |
| `analysis/` | Analysis reports produced by `ai_workflow_log_analyzer` (`workflow_*/step_*/{report.json,report.md}`) |

All four are ephemeral — they are gitignored and exist only to support
post-run analysis skills (`validate-logs`, `fix-log-issues`, `audit-and-fix`).
Once those skills have been run (or the logs are no longer needed), the
directories can be safely removed.

> **Important:** Run `audit-and-fix` (or at minimum `validate-logs`) before
> purging if the logs have not yet been reviewed. Purging is irreversible.

## Prerequisites

- None. The skill is safe to invoke even if one or more of the target
  directories do not exist — absent directories are silently skipped.

## What NOT to delete

The following `.ai_workflow/` subdirectories and files are **permanent**
and must not be touched by this skill:

| Path | Purpose |
|------|---------|
| `.ai_workflow/context/` | Static context files injected into AI prompts |
| `.ai_workflow/metrics/` | Long-lived metrics snapshots |
| `.ai_workflow/ml_models/` | Cached model artefacts |
| `.ai_workflow/archive/` | Historical run archives |
| `.ai_workflow/checkpoints/` | Workflow execution checkpoints |
| `.ai_workflow/commit_history.json` | Commit-level run history |
| `.ai_workflow/plan.md` | Handoff artefact for `fix-log-issues` (if present) |
| `.ai_workflow/.ai_cache/` | AI response cache (avoids redundant API calls) |

## Step-by-step execution

1. **Identify target directories.** Check which of the three directories
   exist:

   ```bash
   ls .ai_workflow/logs    2>/dev/null && echo "logs: present"     || echo "logs: absent"
   ls .ai_workflow/backlog  2>/dev/null && echo "backlog: present"  || echo "backlog: absent"
   ls .ai_workflow/summaries 2>/dev/null && echo "summaries: present" || echo "summaries: absent"
   ls .ai_workflow/analysis  2>/dev/null && echo "analysis: present"  || echo "analysis: absent"
   ```

2. **Delete present directories.** Remove each directory that exists:

   ```bash
   rm -rf .ai_workflow/logs .ai_workflow/backlog .ai_workflow/summaries .ai_workflow/analysis
   ```

3. **Verify removal.** Confirm none of the three directories remain:

   ```bash
   ls .ai_workflow/
   ```

4. **Commit if tracked.** Check whether any of the deleted paths were
   tracked in git:

   ```bash
   git status --short
   ```

   - If `git status` shows staged deletions, commit them:

     ```
     chore: purge workflow logs, backlog, summaries, and analysis

     Removed transient AI workflow artefacts:
       - .ai_workflow/logs/
       - .ai_workflow/backlog/
       - .ai_workflow/summaries/
       - .ai_workflow/analysis/

     Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
     ```

   - If the working tree is clean (all four directories were gitignored),
     no commit is needed. Print a note to the console explaining this.

5. **Print summary:**

   ```
   ✓ purge-workflow-logs complete
     Removed: .ai_workflow/logs/       (N run directories)
     Removed: .ai_workflow/backlog/
     Removed: .ai_workflow/summaries/
     Removed: .ai_workflow/analysis/
     Git commit: <sha> | none needed (directories were gitignored)
   ```

   If a directory was absent before the skill ran, replace `Removed:` with
   `Skipped: (not present)` for that row.

## Idempotency

Running this skill multiple times is always safe. If the target directories
are already absent, the `rm -rf` commands exit 0 with no side effects.

## Related files

- `.ai_workflow/logs/` — primary target
- `.ai_workflow/backlog/` — primary target
- `.ai_workflow/summaries/` — primary target
- `.ai_workflow/analysis/` — primary target
- `.github/skills/validate-logs/SKILL.md` — should be run before purging
- `.github/skills/audit-and-fix/SKILL.md` — runs validate-logs + fix-log-issues then purge can follow
- `.github/SKILLS.md` — skills index for this project
