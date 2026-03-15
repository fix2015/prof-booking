#!/usr/bin/env python3
"""
Server Agent — supervisor and reviewer for the prof-booking repository.
Implements SERVER_AGENT_PROTOCOL.txt.

Loop interval: 5 seconds
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import anthropic

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).parent.parent.resolve()
TASKS_DIR = REPO_ROOT / ".ai-sync" / "tasks"
LOOP_INTERVAL = 5  # seconds

# Checks to run when verifying a "done" task (and when scanning for issues)
FRONTEND_DIR = REPO_ROOT / "frontend"
BACKEND_DIR = REPO_ROOT / "backend"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd: str, cwd: Path = REPO_ROOT, timeout: int = 120) -> tuple[int, str, str]:
    """Run a shell command, return (returncode, stdout, stderr)."""
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return result.returncode, result.stdout, result.stderr


def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


# ---------------------------------------------------------------------------
# Task file I/O
# ---------------------------------------------------------------------------

def read_tasks() -> dict[str, dict]:
    """Return {task_id: task_dict} for all tasks in TASKS_DIR."""
    tasks = {}
    for path in sorted(TASKS_DIR.glob("task-*.json")):
        try:
            tasks[path.stem] = json.loads(path.read_text())
        except Exception as e:
            log(f"WARN: could not parse {path.name}: {e}")
    return tasks


def write_task(task: dict):
    path = TASKS_DIR / f"{task['id']}.json"
    path.write_text(json.dumps(task, indent=2, ensure_ascii=False))


def next_task_id() -> str:
    existing = sorted(TASKS_DIR.glob("task-*.json"))
    if not existing:
        return "task-001"
    last = existing[-1].stem  # e.g. "task-007"
    num = int(last.split("-")[1]) + 1
    return f"task-{num:03d}"


def create_task(title: str, file: str, notes: str = "") -> dict:
    tid = next_task_id()
    task = {
        "id": tid,
        "title": title,
        "file": file,
        "status": "todo",
        "assigned_to": None,
        "created_by": "server",
        "commit": None,
        "notes": notes,
        "created_at": now_iso(),
    }
    write_task(task)
    log(f"  Created {tid}: {title}")
    return task


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------

def git_pull():
    rc, out, err = run("git pull --rebase --autostash")
    if rc != 0:
        log(f"WARN: git pull failed: {err.strip()}")
    else:
        log("git pull OK")


def git_commit_push(message: str):
    run("git add .ai-sync/tasks")
    rc, out, err = run(f'git commit -m "{message}"')
    if rc != 0:
        # Nothing to commit is fine
        if "nothing to commit" in out + err:
            return
        log(f"WARN: git commit failed: {err.strip()}")
        return
    rc2, out2, err2 = run("git push")
    if rc2 != 0:
        log(f"WARN: git push failed: {err2.strip()}")
    else:
        log(f"Pushed: {message}")


# ---------------------------------------------------------------------------
# Project checks
# ---------------------------------------------------------------------------

def run_frontend_checks() -> list[dict]:
    """Run typecheck + lint in the frontend. Return list of issue dicts."""
    issues = []

    # TypeScript check
    rc, out, err = run("npx tsc --noEmit 2>&1", cwd=FRONTEND_DIR, timeout=120)
    combined = out + err
    if rc != 0:
        issues.append({
            "type": "typescript",
            "output": combined[:4000],
            "file": "frontend/",
        })

    # ESLint
    rc, out, err = run("npx eslint . --max-warnings 0 --format json 2>/dev/null || npx eslint . --max-warnings 0 2>&1", cwd=FRONTEND_DIR, timeout=120)
    combined = out + err
    if rc != 0 and combined.strip():
        issues.append({
            "type": "eslint",
            "output": combined[:4000],
            "file": "frontend/",
        })

    return issues


def run_backend_checks() -> list[dict]:
    """Run pytest + basic import check. Return list of issue dicts."""
    issues = []

    # pytest (unit tests only, no DB needed)
    rc, out, err = run(
        "python3 -m pytest tests/ -x --tb=short -q 2>&1",
        cwd=BACKEND_DIR,
        timeout=180,
    )
    combined = out + err
    if rc != 0:
        issues.append({
            "type": "pytest",
            "output": combined[:4000],
            "file": "backend/tests/",
        })

    # Basic syntax / import check via flake8 if available
    rc_f, out_f, err_f = run(
        "python3 -m flake8 app/ --max-line-length=120 --select=E9,F8,F7,W6 2>&1",
        cwd=BACKEND_DIR,
        timeout=60,
    )
    if rc_f not in (0, 127):  # 127 = not found
        combined_f = out_f + err_f
        if combined_f.strip():
            issues.append({
                "type": "flake8",
                "output": combined_f[:4000],
                "file": "backend/app/",
            })

    return issues


def run_all_checks() -> list[dict]:
    log("Running frontend checks…")
    fe = run_frontend_checks()
    log("Running backend checks…")
    be = run_backend_checks()
    return fe + be


# ---------------------------------------------------------------------------
# Claude AI helpers
# ---------------------------------------------------------------------------

_ai_client = None


def ai_client() -> anthropic.Anthropic:
    global _ai_client
    if _ai_client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _ai_client = anthropic.Anthropic(api_key=api_key)
    return _ai_client


def ai_summarise_issue(issue: dict) -> tuple[str, str]:
    """
    Use Claude to produce (title, file) for a discovered issue.
    Returns a short task title and the most relevant file path.
    """
    prompt = f"""You are a software QA agent reviewing CI output.
Given the following check output, produce:
1. A short task title (max 80 chars) describing the specific problem to fix.
2. The most relevant source file path to fix (relative to repo root).

Check type: {issue['type']}
Raw output:
{issue['output']}

Respond with exactly two lines:
TITLE: <title>
FILE: <file_path>
"""
    try:
        msg = ai_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        title = "Fix issue"
        file_ = issue.get("file", "")
        for line in text.splitlines():
            if line.startswith("TITLE:"):
                title = line[6:].strip()
            elif line.startswith("FILE:"):
                file_ = line[5:].strip()
        return title, file_
    except Exception as e:
        log(f"WARN: AI summarise failed: {e}")
        return f"Fix {issue['type']} error", issue.get("file", "")


def ai_verify_fix(task: dict, check_output: str) -> tuple[bool, str]:
    """
    Ask Claude whether the check output indicates the task's problem is resolved.
    Returns (is_fixed: bool, explanation: str).
    """
    prompt = f"""You are a CI reviewer.
Task that was fixed:
  Title: {task['title']}
  File:  {task['file']}
  Notes: {task.get('notes', '')}

Current check output (empty means all checks passed):
{check_output or '(all checks passed)'}

Is the original problem described in the task resolved?
Respond with exactly:
FIXED: yes  OR  FIXED: no
REASON: <one sentence>
"""
    try:
        msg = ai_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        fixed = False
        reason = "unknown"
        for line in text.splitlines():
            if line.startswith("FIXED:"):
                fixed = "yes" in line.lower()
            elif line.startswith("REASON:"):
                reason = line[7:].strip()
        return fixed, reason
    except Exception as e:
        log(f"WARN: AI verify failed: {e}")
        # Fall back: if no errors in output, assume fixed
        return check_output.strip() == "", str(e)


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def issue_already_tracked(issues_raw: list[dict], existing_tasks: dict) -> list[dict]:
    """Filter out issues that already have an open task."""
    open_tasks = [
        t for t in existing_tasks.values()
        if t.get("status") not in ("closed",)
    ]
    open_titles = {t["title"].lower() for t in open_tasks}
    open_files  = {t.get("file", "").lower() for t in open_tasks}

    new_issues = []
    for issue in issues_raw:
        # Quick heuristic: skip if same check type + file already open
        key = f"{issue['type']}:{issue.get('file', '')}".lower()
        already = any(
            issue["type"] in t.get("title", "").lower() or
            t.get("file", "").lower() == issue.get("file", "").lower()
            for t in open_tasks
        )
        if not already:
            new_issues.append(issue)
    return new_issues


# ---------------------------------------------------------------------------
# Main server loop
# ---------------------------------------------------------------------------

def review_done_tasks(tasks: dict) -> bool:
    """
    For each task with status=done, run checks and set closed or failed.
    Returns True if any task was updated.
    """
    updated = False
    done_tasks = [t for t in tasks.values() if t.get("status") == "done"]
    if not done_tasks:
        return False

    log(f"Reviewing {len(done_tasks)} done task(s)…")

    # Collect check output once (expensive to run multiple times)
    raw_issues = run_all_checks()
    check_output = "\n\n".join(
        f"[{i['type']}]\n{i['output']}" for i in raw_issues
    )

    for task in done_tasks:
        log(f"  Checking {task['id']}: {task['title']}")
        fixed, reason = ai_verify_fix(task, check_output)
        if fixed:
            task["status"] = "closed"
            task["notes"] = (task.get("notes") or "") + f"\n[server closed {now_iso()}] {reason}"
            log(f"    → CLOSED ({reason})")
        else:
            task["status"] = "failed"
            task["notes"] = (task.get("notes") or "") + f"\n[server failed {now_iso()}] {reason}"
            log(f"    → FAILED ({reason})")
        write_task(task)
        updated = True

    return updated


def scan_for_new_issues(tasks: dict) -> bool:
    """
    Run checks, discover new issues, create task files.
    Returns True if new tasks were created.
    """
    log("Scanning for new issues…")
    raw_issues = run_all_checks()

    if not raw_issues:
        log("  No issues found.")
        return False

    new_issues = issue_already_tracked(raw_issues, tasks)
    if not new_issues:
        log(f"  {len(raw_issues)} issue(s) found but all already tracked.")
        return False

    log(f"  {len(new_issues)} new issue(s) found — creating tasks…")
    for issue in new_issues:
        title, file_ = ai_summarise_issue(issue)
        create_task(title, file_, notes=issue["output"][:500])

    return True


def server_loop():
    log("=" * 60)
    log("Server Agent started")
    log(f"Repo: {REPO_ROOT}")
    log(f"Tasks: {TASKS_DIR}")
    log("=" * 60)

    TASKS_DIR.mkdir(parents=True, exist_ok=True)

    iteration = 0
    while True:
        iteration += 1
        log(f"\n--- Iteration {iteration} [{now_iso()}] ---")

        # 1. Pull latest
        git_pull()

        # 2. Read all tasks
        tasks = read_tasks()
        log(f"Tasks loaded: {len(tasks)} ({sum(1 for t in tasks.values() if t['status']=='todo')} todo, "
            f"{sum(1 for t in tasks.values() if t['status']=='done')} done)")

        commit_needed = False

        # 3. Review "done" tasks
        if review_done_tasks(tasks):
            commit_needed = True

        # 4. Commit reviewed tasks
        if commit_needed:
            git_commit_push("server review update")

        # 5 & 6. Scan for new issues
        # Re-read tasks after any updates
        tasks = read_tasks()
        if scan_for_new_issues(tasks):
            # 7. Commit new tasks
            git_commit_push("new tasks detected")

        log(f"Sleeping {LOOP_INTERVAL}s…")
        time.sleep(LOOP_INTERVAL)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    try:
        server_loop()
    except KeyboardInterrupt:
        log("Server Agent stopped.")
