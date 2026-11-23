# BFFC PR review bot

GitHub Actions assign **exactly two reviewers** on every PR and ping them in Slack. Copied from [Code-4-Community/branch](https://github.com/Code-4-Community/branch/tree/main/.github/workflows) and adapted for this team.

## Assignment rules

When a PR is opened (or marked ready for review, reopened, or unlabelled `no-review`):

1. **Lead reviewer** — `mehanana` or `saumyapalk23`, round-robin. If the author is one of those two, the **other** lead is assigned.
2. **Developer reviewer** — next person on the fixed `roster` (round-robin). If that person is the author, skip to the next.
3. The author is never assigned as their own reviewer.

Opt out by adding the `no-review` label.

## Slack (`SLACK_BOT_TOKEN`)

- On assignment: channel message mentioning both reviewers, with a link to the PR.
- Reminder: if a requested reviewer has not submitted a review **36 hours** later, ping them again (cron every 6 hours).
- On each review (approval, comments, or changes requested): ping the PR author.
- Ready to merge: ping the PR author once **both** assigned reviewers have approved.

## One-time setup

1. Repo secret **`SLACK_BOT_TOKEN`** — Slack bot token that can post to the team channel and DM users.
2. Create an orphan **`bot-state`** branch (not `main`) with `config.json`, `state.json`, and `prs/`:

```bash
git fetch origin
git checkout --orphan bot-state
git rm -rf .
mkdir -p prs
cp .github/pr-bot/config.example.json config.json   # if this file is still on the previous branch, copy it in
# fill in slack_channel_id, github_to_slack, and roster
echo '{ "lead_cursor": 0, "roster_cursor": 0 }' > state.json
touch prs/.gitkeep
git add config.json state.json prs/.gitkeep
git commit -m "bot: initialize PR review state"
git push -u origin bot-state
```

3. Protect `bot-state` if you want, but allow `github-actions[bot]` to push (the workflows commit cursor + per-PR files there).

`config.json` fields:

| Field | Meaning |
| --- | --- |
| `leads` | GitHub logins for Mehana and Saumya |
| `roster` | Developer GitHub logins for round-robin (Reviewer 2) |
| `github_to_slack` | GitHub login → Slack user ID (`U…`) for every lead and developer |
| `slack_channel_id` | Channel the bot posts assignment / reminder messages to |

Do not put Slack IDs in this example file on `main` / feature branches — only on `bot-state`.
