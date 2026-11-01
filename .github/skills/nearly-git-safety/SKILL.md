---
name: nearly-git-safety
description: Preserve NEARLY Studio's uncommitted changes and use branches, patches, and worktrees safely.
---

# NEARLY Git and Worktree Safety

Use this skill before edits, branch operations, patch transfer, commit preparation, or deployment planning.

## Required safeguards

- Identify the repository root, active worktree, branch, and `git status --short --branch` before making changes.
- Preserve staged, unstaged, and untracked user work. Inspect actual diffs before transfer; never assume a patch contains untracked files.
- Do not reset, clean, restore, stash, switch, overwrite, merge, push, or deploy unless the user explicitly authorizes the specific action.
- Never use `git reset --hard`, `git clean`, or forced checkout to resolve ordinary conflicts. Do not delete active worktrees or branches without explicit authorization.
- Prefer a new feature worktree and selective file transfer over merging unrelated or stale branches. Check patch applicability before applying and verify resulting files/diffs afterward.
- Verify backup contents and integrity before relying on them. Keep backups outside the repository and do not claim a backup is complete if it omits untracked files.
- Do not amend commits unless explicitly requested. Do not include secrets in patches, logs, or commits.

## Completion

After authorized work, report the exact branch/worktree, changed files, validation results, and remaining uncommitted changes. Never imply that a change was pushed or deployed unless verified.
