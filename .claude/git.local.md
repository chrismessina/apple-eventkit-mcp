---
enabled: true
# Commit Message Conventions
scopes:
  - rem
  - cal
  - tools
  - utils
  - val
  - prompts
  - server
  - docs
  - deps
  - ci
types:
  - feat
  - fix
  - docs
  - refactor
  - test
  - chore
  - perf
  - style
# Branch Naming Conventions
branch_prefixes:
  feature: feature/*
  fix: fix/*
  hotfix: hotfix/*
  refactor: refactor/*
  docs: docs/*
# .gitignore Generation Defaults
gitignore:
  os: [macos, linux, windows]
  languages: [node, typescript]
  tools: [vscode, git]
---

# Project-Specific Git Settings

This file configures Git conventions for the mcp-server-apple-events project. The YAML frontmatter above defines valid scopes, types, and branch naming conventions.

## Scopes

- **rem**: Reminders functionality (handlers, repositories)
- **cal**: Calendar/Events functionality (handlers, repositories)
- **tools**: Tool definitions, schemas, and routing
- **utils**: Utility functions (CLI executor, validation, error handling)
- **val**: Input validation and Zod schemas
- **prompts**: Prompt templates and abstractions
- **server**: MCP server setup and configuration
- **docs**: Documentation and READMEs
- **deps**: Dependency updates
- **ci**: CI/CD and build configuration

## Usage

- **Commits**: Use `/commit` and select from the defined scopes
- **Branching**: Create branches with defined prefixes (feature/, fix/, hotfix/, refactor/, docs/)
- **Messages**: Follow conventional commits format (type(scope): description)

## Key Patterns

- Keep commit messages lowercase and under 50 characters
- One logical unit of work per commit
- All tests and linting must pass before merging
- Use merge commits when merging PRs to main
