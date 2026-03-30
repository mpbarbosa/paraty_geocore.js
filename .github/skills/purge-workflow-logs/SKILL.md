---
name: purge-workflow-logs
description: >
  Delete all transient workflow artefacts under $project_root/.ai_workflow/ — specifically
  the logs/, backlog/, summaries/, and analysis/ directories and everything
  inside them. Use this skill when asked to clean up, remove, or purge workflow
  logs, backlogs, summaries, or analysis reports, or before starting a fresh
  workflow run to avoid stale data from previous runs.
parameters:
  project_root:
    description: >
      Root directory of the project to operate on.
      Defaults to the current GitHub Copilot CLI working directory.
    default: $PWD
---

## Overview

AI workflow runs accumulate three categories of transient output under
`$project_root/.ai_workflow/`:

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

The following `$project_root/.ai_workflow/` subdirectories and files are **permanent**
and must not be touched by this skill:

| Path | Purpose |
|------|---------|
| `$project_root/.ai_workflow/context/` | Static context files injected into AI prompts |
| `$project_root/.ai_workflow/metrics/` | Long-lived metrics snapshots |
| `$project_root/.ai_workflow/ml_models/` | Cached model artefacts |
| `$project_root/.ai_workflow/archive/` | Historical run archives |
| `$project_root/.ai_workflow/checkpoints/` | Workflow execution checkpoints |
| `$project_root/.ai_workflow/commit_history.json` | Commit-level run history |
| `$project_root/.ai_workflow/plan.md` | Handoff artefact for `fix-log-issues` (if present) |
| `$project_root/.ai_workflow/.ai_cache/` | AI response cache (avoids redundant API calls) |

## Step-by-step execution

1. **Identify target directories.** Check which of the three directories
   exist:

   ```bash
   ls "$project_root/.ai_workflow/logs"      2>/dev/null && echo "logs: present"      || echo "logs: absent"
   ls "$project_root/.ai_workflow/backlog"   2>/dev/null && echo "backlog: present"   || echo "backlog: absent"
   ls "$project_root/.ai_workflow/summaries" 2>/dev/null && echo "summaries: present" || echo "summaries: absent"
   ls "$project_root/.ai_workflow/analysis"  2>/dev/null && echo "analysis: present"  || echo "analysis: absent"
   ```

2. **Delete present directories.** Remove each directory that exists:

   ```bash
   rm -rf "$project_root/.ai_workflow/logs" "$project_root/.ai_workflow/backlog" "$project_root/.ai_workflow/summaries" "$project_root/.ai_workflow/analysis"
   ```

3. **Verify removal.** Confirm none of the three directories remain:

   ```bash
   ls "$project_root/.ai_workflow/"
   ```

4. **Commit if tracked.** Check whether any of the deleted paths were
   tracked in git:

   ```bash
   cd "$project_root" && git status --short
   ```

   - If `git status` shows staged deletions, commit them:

     ```
     chore: purge workflow logs, backlog, summaries, and analysis

     Removed transient AI workflow artefacts:
       - $project_root/.ai_workflow/logs/
       - $project_root/.ai_workflow/backlog/
       - $project_root/.ai_workflow/summaries/
       - $project_root/.ai_workflow/analysis/

     Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
     ```

   - If the working tree is clean (all four directories were gitignored),
     no commit is needed. Print a note to the console explaining this.

5. **Print summary:**

   ```
   ✓ purge-workflow-logs complete
     Removed: $project_root/.ai_workflow/logs/       (N run directories)
     Removed: $project_root/.ai_workflow/backlog/
     Removed: $project_root/.ai_workflow/summaries/
     Removed: $project_root/.ai_workflow/analysis/
     Git commit: <sha> | none needed (directories were gitignored)
   ```

   If a directory was absent before the skill ran, replace `Removed:` with
   `Skipped: (not present)` for that row.

## Idempotency

Running this skill multiple times is always safe. If the target directories
are already absent, the `rm -rf` commands exit 0 with no side effects.

## Related files

- `$project_root/.ai_workflow/logs/` — primary target
- `$project_root/.ai_workflow/backlog/` — primary target
- `$project_root/.ai_workflow/summaries/` — primary target
- `$project_root/.ai_workflow/analysis/` — primary target
- `.github/skills/validate-logs/SKILL.md` — should be run before purging
- `.github/skills/audit-and-fix/SKILL.md` — runs validate-logs + fix-log-issues then purge can follow
- `.github/SKILLS.md` — skills index for this project
