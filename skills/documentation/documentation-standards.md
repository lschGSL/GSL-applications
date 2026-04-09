# Skill: Documentation Standards

## CHANGELOG.md
Use Keep a Changelog format:
- `Added` for new features
- `Changed` for changes in existing functionality
- `Fixed` for bug fixes
- `Removed` for removed features

Always date entries: `## [1.2.0] — 2026-04-09`

## TODO.md
- 🔴 Priority = do now / blocking
- 🟡 Next = planned for this sprint
- 🟢 Later = backlog
- ✅ Done = completed (with date)

## Commit Messages
Format: `type: short description`
Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`
Examples:
- `feat: add PDF export`
- `fix: SSO redirect loop on expired session`
- `docs: update CLAUDE.md with new env vars`

## Code Comments
- Comment *why*, not *what*
- Use `// TODO:` for planned work
- Use `// HACK:` for temporary workarounds (with explanation)
