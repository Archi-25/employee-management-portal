# Git workflow — saving your changes to GitHub

A reference for the everyday loop. Written for this repo specifically.

**Repo:** https://github.com/Archi-25/employee-management-portal
**Branch:** `main` (tracks `origin/main`)

---

## The three commands

Every time you change something, it is the same three:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Change files, run those three, refresh GitHub, your work is there.

---

## Why three steps and not one

Each command moves your work one stage further:

| Command | What it does | Think of it as |
| --- | --- | --- |
| `git add .` | Picks which changes go in this save | Putting items in a box |
| `git commit -m "..."` | Saves them permanently, **on your computer** | Sealing and labelling the box |
| `git push` | Uploads to GitHub | Posting the box |

The split matters because a commit is a **checkpoint you can return to**. If you
break something tomorrow, you can rewind to any commit. That is only useful if
each one is a meaningful unit of work — which is why you get to choose what goes
in.

> **`git push` is the step that actually puts it on GitHub.** Commit alone saves
> locally only. Forgetting to push is the most common mistake — your work is
> safe, but it is not backed up and nobody else can see it.

---

## Before you commit, look at what you are committing

```bash
git status
```

Shows which files changed. Run it before `git add .` — it is how you catch that
you modified something you did not mean to.

```bash
git diff
```

Shows the actual line-by-line changes. Press `q` to exit.

```bash
git log --oneline -5
```

Your last five commits, one line each.

---

## Commit message prefixes

This repo's history uses these. Worth continuing so the log stays readable:

| Prefix | Use it for |
| --- | --- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only |
| `test:` | Tests only |
| `refactor:` | Restructuring without changing behaviour |
| `style:` | Formatting, no logic change |
| `chore:` | Config, dependencies, tidying |

Write what changed and why, not what you typed. `fix: leave form rejected valid
same-day requests` is useful in six months. `fix: bug` is not.

---

## A worked example

You fix a bug in the leave page:

```bash
git status                                    # see what changed
git diff                                      # check the actual changes
git add .
git commit -m "fix: leave form rejected valid same-day requests"
git push
```

---

## Situations you will hit

### You committed but forgot a file

Add it to the previous commit rather than making a messy second one:

```bash
git add the-forgotten-file.ts
git commit --amend --no-edit
```

Only do this if you have **not** pushed yet.

### You typed a bad commit message

Same fix, before pushing:

```bash
git commit --amend -m "the better message"
```

### You want to commit only some files

Name them instead of using `.`:

```bash
git add src/app/features/leave/leave-page.ts
git commit -m "fix: correct working-day count"
```

### You are working on two computers

Pull before you start each session:

```bash
git pull
```

This fetches what the other computer pushed. Skipping it causes the
`rejected — non-fast-forward` error, which means GitHub has commits you do not.
`git pull` fixes it.

### You want to undo changes you have not committed yet

Throw away edits to one file:

```bash
git restore src/app/features/leave/leave-page.ts
```

Throw away **all** uncommitted edits (careful — this cannot be undone):

```bash
git restore .
```

### You want to see if anything is unpushed

```bash
git log origin/main..main --oneline
```

Nothing listed means everything is on GitHub.

---

## Before running the app or committing big changes

Worth running, since this project has them set up:

```bash
npm test          # 160 tests
npm run lint      # code style and common mistakes
npm run format    # auto-format everything
```

A commit that passes tests is a checkpoint worth returning to. One that does not
is a trap for later.

---

## One caution

`git add .` adds **everything** that changed.

This repo's `.gitignore` already blocks the dangerous ones — `node_modules`,
`dist`, `.angular/cache`, `coverage`, `.DS_Store` — so you are well protected.

But if you ever add a file containing a password or API key, `git add .` will
happily commit it, and removing something from GitHub's history afterwards is
genuinely hard. Run `git status` first and glance at the list.

---

## Rebuilding the documentation

The two guides in this folder are generated from HTML sources:

```bash
npm run viva      # docs/viva-guide.html   -> docs/VIVA-GUIDE.pdf
npm run simple    # docs/simple-guide.html -> docs/SIMPLE-GUIDE.pdf
```

Edit the `.html` file, run the command, then commit both the HTML and the PDF.
