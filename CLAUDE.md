# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Please answer in Japanese

## Overview

This is the **Claude Code Plugin Marketplace** repository - a marketplace for distributing custom Claude Code plugins. It contains plugin definitions that can be installed into Claude Code to extend its functionality with custom slash commands and tools.

## Repository Structure

```
.claude-plugin/marketplace.json  # Marketplace metadata and plugin registry
plugins/                         # Directory containing individual plugins
  {plugin-name}/
    .claude-plugin/plugin.json   # Plugin metadata
    commands/                    # Slash command definitions (markdown files)
```

## Plugin Architecture

### Marketplace Definition (`.claude-plugin/marketplace.json`)
- Defines the marketplace name, description, and owner information
- Contains a `plugins` array listing all available plugins with their source paths
- Each plugin entry has: `name`, `source` (relative path), and `description`

### Plugin Definition (`plugins/{name}/.claude-plugin/plugin.json`)
- Metadata for individual plugins including `name`, `description`, `author`, and `keywords`
- Must be located in the plugin's `.claude-plugin/` subdirectory

### Slash Commands (`plugins/{name}/commands/{namespace}/{command}.md`)
- Commands are organized by namespace (e.g., `git/commit.md` creates `/git:commit`)
- Each command file contains:
  - YAML frontmatter with `name` and `description`
  - Command prompt/instructions in the body (can be in Japanese or other languages)
  - Commands can accept arguments via `$1`, `$2`, etc.

## Current Plugins

### git-tools Plugin
Location: `plugins/git-tools/`

Provides Git-related slash commands:

- `/git-tools:git:commit` - Commits changes in the git worktree (reviews changes and creates commit)
- `/git-tools:git:pr` - Creates a GitHub Pull Request from current branch (accepts base branch as `$1`, defaults to repository default branch if not specified)
- `/git-tools:git:review` - Reviews changes before commit (checks for debug code, TODO comments, security issues, code quality, etc.)

## Adding New Plugins

1. Create plugin directory under `plugins/{plugin-name}/`
2. Add plugin metadata in `plugins/{plugin-name}/.claude-plugin/plugin.json`
3. Add slash commands as markdown files in `plugins/{plugin-name}/commands/{namespace}/`
4. Register plugin in `.claude-plugin/marketplace.json`

## Command Naming Convention

Slash commands follow the pattern: `/{plugin-name}:{namespace}:{command}`

Example: `/git-tools:git:commit` where:
- `git-tools` = plugin name
- `git` = namespace (subdirectory under commands/)
- `commit` = command name (filename without .md)
