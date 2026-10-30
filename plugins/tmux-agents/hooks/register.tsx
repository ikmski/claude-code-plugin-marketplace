import { atom, read, update } from 'claude-code'
import type { CommandSpec, EngineInterface, Register, ToolSpec } from 'claude-code'

import type { AgentRow } from '../types'

const PANE = 'tmux-agents'
// Fits <org>/<repo> and " ● <label>  <state> <age>" (a session is named by
// its label alone) without taking the dock's default share from the transcript.
const PANE_COLUMNS = 32
// Every poll starts a `claude agents` process, so keep it slow.
const POLL_MS = 15_000
// A /clear empties every plugin's $.state once its session.end hooks have run,
// so the list is read again after it rather than from the hook.
const CLEAR_REFRESH_MS = 1_000

const sessions = atom({ plugin: 'tmux-agents', key: 'sessions' } as const, [], {
  shape: 'sessions-1',
})
const error = atom({ plugin: 'tmux-agents', key: 'error' } as const, '', {
  shape: 'error-1',
})

type Repo = { name: string; path: string }

// tmux-project -l prints "<mark> <name>\t<path>", <mark> "*" for a live tmux
// session; reusing it keeps the repository roots in one place
// (~/.config/tmux-project/roots).
export function parseRepos(stdout: string): Repo[] {
  return stdout
    .split('\n')
    .filter(line => line.includes('\t'))
    .map(line => {
      const [name = '', path = ''] = line.split('\t')
      return { name: name.replace(/^[* ] /, '').trim(), path: path.trim() }
    })
}

// Exact name, then exact path, then a unique substring of the path.
export function resolveRepo(repos: Repo[], query: string): Repo | string {
  const q = query.trim()
  const exact = repos.filter(r => r.name === q || r.path === q)
  const partial = exact.length > 0 ? exact : repos.filter(r => r.path.includes(q))
  const [only] = partial
  if (only && partial.length === 1) return only
  if (partial.length === 0) return `No repository matches "${q}".`
  return `"${q}" matches several repositories: ${partial.map(r => r.path).join(', ')}`
}

// A session in a worktree Claude Code made (`<repo>/.claude/worktrees/<name>`)
// is shown under its repository.
export function repoRoot(cwd: string): string {
  return cwd.replace(/\/\.claude\/worktrees\/[^/]+$/, '')
}

// A running session of the name before a stopped one, the newest first (left
// idle for about an hour a session's process stops; only `--all` lists it,
// and resuming keeps its context).
export function findSession(rows: AgentRow[], name: string): AgentRow | undefined {
  return rows
    .filter(r => r.kind === 'background' && r.name === name)
    .sort((a, b) => Number(isStopped(a)) - Number(isStopped(b)) || b.startedAt - a.startedAt)[0]
}

export function isStopped(row: AgentRow): boolean {
  return row.state === 'stopped'
}

function isWorking(row: AgentRow): boolean {
  return label(row) === 'working'
}

export type PaneGroup = { path: string; rows: AgentRow[] }

// The pane's rows by repository: working sessions first, stopped ones last,
// newer before older; groups holding a working session first, then by the
// newest session.
export function paneGroups(rows: AgentRow[]): PaneGroup[] {
  const rank = (r: AgentRow) => (isWorking(r) ? 0 : isStopped(r) ? 2 : 1)
  const byPath = new Map<string, AgentRow[]>()
  for (const r of rows) byPath.set(repoRoot(r.cwd), [...(byPath.get(repoRoot(r.cwd)) ?? []), r])
  const groups = [...byPath].map(([path, rs]) => ({
    path,
    rows: rs.sort((a, b) => rank(a) - rank(b) || b.startedAt - a.startedAt),
  }))
  const newest = (g: PaneGroup) => Math.max(...g.rows.map(r => r.startedAt))
  return groups.sort(
    (a, b) => Number(!a.rows.some(isWorking)) - Number(!b.rows.some(isWorking)) || newest(b) - newest(a),
  )
}

async function listRows($: EngineInterface): Promise<AgentRow[]> {
  const ran = await $.process.run(['claude', 'agents', '--json', '--all'])
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || `claude agents exited ${ran.exitCode}`)
  return JSON.parse(ran.stdout) as AgentRow[]
}

async function listRepos($: EngineInterface): Promise<Repo[]> {
  const ran = await $.process.run(['tmux-project', '-l'])
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || 'tmux-project -l failed')
  return parseRepos(ran.stdout)
}

async function refresh($: EngineInterface): Promise<void> {
  let rows: AgentRow[]
  try {
    rows = await listRows($)
  } catch (err) {
    await update($, error, () => String(err))
    return
  }
  await update($, sessions, () => rows)
  await update($, error, () => '')
  try {
    await syncWindows($, rows)
  } catch {
    // Without tmux there is no window to keep up to date.
  }
}

// tmux-claude-attach marks a session's window with the window options
// @claude_job (its job id, which resuming keeps) and @claude_session (its
// sessionId, which resuming changes and claude-tmux-status looks a window up
// by), and names it after the session. A window is matched by its job id, and
// a sessionId or a name changed since is carried over here. A window made
// before @claude_job is matched by its sessionId until tmux-claude-attach
// attaches it again and marks it.
async function syncWindows($: EngineInterface, rows: AgentRow[]): Promise<void> {
  const ran = await $.process.run([
    'tmux',
    'list-windows',
    '-a',
    '-F',
    '#{window_id}\t#{@claude_job}\t#{@claude_session}\t#{window_name}',
  ])
  if (ran.exitCode !== 0) return
  for (const [wid, job, sid, name] of ran.stdout.split('\n').map(line => line.split('\t'))) {
    const row = job ? rows.find(r => r.id === job) : rows.find(r => r.sessionId === sid)
    if (!wid || !row) continue
    if (row.sessionId !== sid) await $.process.run(['tmux', 'set-option', '-w', '-t', wid, '@claude_session', row.sessionId])
    if (row.name !== name) await $.process.run(['tmux', 'rename-window', '-t', wid, row.name])
  }
}

function label(row: AgentRow): string {
  return row.state ?? row.status
}

// The colors claude-tmux-status (ikmski/nix-config) paints a session's tmux
// tab with, from the vim-hybrid palette, so the pane and the tabs agree.
// `idle` is the status of a session whose state is `done`.
const STATE_COLORS: Record<string, string> = {
  working: '#f0c674',
  blocked: '#cc6666',
  done: '#b5bd68',
  idle: '#b5bd68',
}

export type PrepareArgs = { session?: string; repo?: string; label?: string }

// For the model: the user's screen stays where it is. A session is found by
// its name; without one, tmux-claude-attach -n starts a new session in `repo`
// and attaches to it, as its "new session" does, so the naming rule is its
// alone and a session is named alike from either.
export async function prepare($: EngineInterface, args: PrepareArgs): Promise<string> {
  if (args.session) {
    const rows = await listRows($)
    const worker = findSession(rows, args.session)
    if (!worker) return noSession(rows, args.session)
    return prepareWindow($, worker.cwd, ['-i', worker.sessionId])
  }
  if (!args.repo) return 'Name a session to put in tmux, or a repository to start one in.'
  const repo = resolveRepo(await listRepos($), args.repo)
  if (typeof repo === 'string') return repo
  return prepareWindow($, repo.path, ['-n', args.label ?? ''])
}

// Sets up the tmux session of `path`'s repository without switching to it (a
// background session runs outside tmux, where a plain `tmux-project <path>`
// attaches and fails with "not a terminal"), then runs tmux-claude-attach in
// it with `args`. A session in a worktree goes to its repository's tmux
// session, named as tmux-project names one it opens; tmux-claude-attach counts
// the repository's worktree sessions as its own. Answers the tmux session and
// what tmux-claude-attach printed, or why not.
async function attachIn(
  $: EngineInterface,
  path: string,
  args: string[],
): Promise<{ session: string; printed: string } | string> {
  const project = await $.process.run(['tmux-project', '-d', repoRoot(path)])
  if (project.exitCode !== 0) return `tmux-project failed: ${project.stderr.trim()}`
  const session = project.stdout.trim()
  if (!session) return `tmux-project -d printed no session name for ${path}.`
  const attach = await $.process.run(['tmux-claude-attach', '-t', session, ...args])
  if (attach.exitCode !== 0) return `tmux-claude-attach failed: ${attach.stderr.trim()}`
  await refresh($)
  return { session, printed: attach.stdout.trim() }
}

async function prepareWindow($: EngineInterface, path: string, attachArgs: string[]): Promise<string> {
  const done = await attachIn($, path, ['-d', ...attachArgs])
  if (typeof done === 'string') return done
  return `${done.session} の window ${done.printed} に出した。入るには prefix S 等で切り替える。`
}

// For /tmux-agents-switch: a session by its name, else a repository, where
// tmux-claude-attach picks (one session: it; several: a picker).
async function switchToQuery($: EngineInterface, query: string): Promise<string> {
  const worker = findSession(await listRows($), query)
  if (worker) return switchTo($, worker.cwd, ['-i', worker.sessionId])
  const repo = resolveRepo(await listRepos($), query)
  if (typeof repo === 'string') return repo
  return switchTo($, repo.path, [])
}

// Switches the person's tmux client to the window tmux-claude-attach picks
// for `attachArgs` in the tmux session of `path`.
async function switchTo($: EngineInterface, path: string, attachArgs: string[]): Promise<string> {
  // Outside tmux this is the client tmux finds best, the one last used; the
  // picker popup is shown on it, and it is the one switched.
  const client = (await $.process.run(['tmux', 'display-message', '-p', '#{client_name}'])).stdout.trim()
  const done = await attachIn($, path, [...attachArgs, ...(client ? ['-c', client] : [])])
  if (typeof done === 'string') return done
  return `Opened ${done.session} in tmux.`
}

// A row's short id is what `claude stop` and `rm` are documented to take.
const jobId = (row: AgentRow) => row.id ?? row.sessionId

function noSession(rows: AgentRow[], name: string): string {
  const names = rows.filter(r => r.kind === 'background').map(r => r.name)
  return `No session named "${name}". Sessions: ${names.join(', ') || '(none)'}`
}

// `rm` runs as given: its refusal over unpushed commits or a worktree it could
// not remove comes back word for word, and the flags that override it are left
// to the person at a shell.
export async function stopOrRemove($: EngineInterface, verb: 'stop' | 'rm', name: string): Promise<string> {
  const rows = await listRows($)
  const worker = findSession(rows, name)
  if (!worker) return noSession(rows, name)
  const ran = await $.process.run(['claude', verb, jobId(worker)])
  await refresh($)
  const said = (ran.stdout + ran.stderr).trim()
  if (ran.exitCode !== 0) return `claude ${verb} ${worker.name} failed: ${said}`
  return said || `${verb === 'stop' ? 'Stopped' : 'Removed'} ${worker.name}.`
}

// The list is polled only while the pane is open, whether or not anyone looks
// at it, and closing it stops the poll. A reload of the module drops the timer
// while the pane stays open, so session.start polls again for an open pane.
let poll: { cancel: () => void } | undefined

async function isPaneOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(p => p.id === PANE)
}

async function openPane($: EngineInterface): Promise<void> {
  await refresh($)
  await $.ui.open({ id: PANE, title: 'Agents', columns: PANE_COLUMNS })
  startPolling($)
}

function startPolling($: EngineInterface): void {
  poll ??= $.clock.every(POLL_MS, () => refresh($))
}

function stopPolling(): void {
  poll?.cancel()
  poll = undefined
}

function age(startedAt: number, now: number): string {
  const min = Math.floor((now - startedAt) / 60_000)
  return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60}m`
}

function short(path: string): string {
  return path.replace(/^\/home\/[^/]+\/develop\//, '')
}

// Only what a person does by hand; the rest the model does with the tools.
const COMMANDS: CommandSpec[] = [
  { name: 'tmux-agents', description: 'Open or close the agents pane' },
  {
    name: 'tmux-agents-switch',
    description: "Switch the screen to a session's tmux window, or to a repository's: /tmux-agents-switch <session|repo>",
  },
  { name: 'tmux-agents-rm', description: 'Delete a background session and its worktree: /tmux-agents-rm <session>' },
]

const TOOLS: ToolSpec[] = [
  {
    name: 'session-prepare',
    description:
      "Put a Claude session in a tmux window of its repository's tmux session, without " +
      "switching the user's screen (`tmux-project -d`, then `tmux-claude-attach -d`). With " +
      '`session`, the window attaches to that background session; without it, the window starts ' +
      'a new Claude session in `repo`, named after `label`. Reports which tmux session and ' +
      'window to enter.',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'string', description: 'Name of a background session to attach to' },
        repo: {
          type: 'string',
          description: 'Repository name or absolute path to start a new session in, when `session` is omitted',
        },
        label: {
          type: 'string',
          description:
            "A new session's name when `session` is omitted: one or two words for what it is for " +
            '(review, aws-s3), without the repository; -2, -3 ... is added when the name is taken.',
        },
      },
    },
    isDeferred: true,
  },
  {
    name: 'session-stop',
    description:
      'Stop a background session (`claude stop`). Its conversation is kept; attaching to it ' +
      '(session-prepare) resumes it.',
    inputSchema: {
      type: 'object',
      properties: { session: { type: 'string', description: 'Name of the session to stop' } },
      required: ['session'],
    },
    isDeferred: true,
  },
  {
    name: 'session-list',
    description: 'List the active Claude Code sessions (`claude agents --json`) with repository paths.',
    isDeferred: true,
  },
]

// One at a time: a name the engine refuses (a built-in's) drops only that
// one, not the rest.
async function declare($: EngineInterface): Promise<void> {
  for (const command of COMMANDS) {
    try {
      await $.command.register(command)
    } catch (err) {
      $.ui.log(`tmux-agents: /${command.name} is not available: ${String(err)}`)
    }
  }
  for (const tool of TOOLS) {
    try {
      await $.tool.register(tool)
    } catch (err) {
      $.ui.log(`tmux-agents: ${tool.name} is not available: ${String(err)}`)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    // Every session gets the commands and the deferred tools, and nothing
    // runs until the pane is opened or a tool is called.
    await declare($)
    if (await isPaneOpen($)) {
      await refresh($)
      startPolling($)
    }

    return started
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear' && (await isPaneOpen($))) $.clock.after(CLEAR_REFRESH_MS, () => void refresh($))
    return next(e)
  })

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) stopPolling()
    return next(e)
  })

  on('tool.call', { tool: 'mcp__tmux-agents__session-prepare' }, async ($, e: any) => {
    const text = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
    const args = { session: text(e.session), repo: text(e.repo), label: text(e.label) }
    return { result: await prepare($, args) }
  }).catch(($, e, next) => ({ deny: `tmux-agents: session-prepare failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__tmux-agents__session-list' }, async $ => {
    const rows = await listRows($)
    await update($, sessions, () => rows)
    // An array result is read as content blocks, so hand the rows over as text.
    return { result: JSON.stringify(rows.map(r => ({ ...r, repo: short(repoRoot(r.cwd)) })), null, 2) }
  }).catch(($, e, next) => ({ deny: `tmux-agents: session-list failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__tmux-agents__session-stop' }, async ($, e: any) => ({
    result: await stopOrRemove($, 'stop', String(e.session ?? '')),
  })).catch(($, e, next) => ({ deny: `tmux-agents: session-stop failed: ${String(next.error)}` }))

  on('command.run', { command: 'tmux-agents' }, async $ => {
    if (await isPaneOpen($)) {
      await $.ui.close({ id: PANE })
      stopPolling()
      return { text: 'Agents pane closed.' }
    }
    await openPane($)
    return { text: 'Agents pane opened.' }
  })

  on('command.run', { command: 'tmux-agents-switch' }, async ($, e) => {
    const query = e.args.trim()
    if (!query) return { text: 'Usage: /tmux-agents-switch <session|repo>' }
    return { text: await switchToQuery($, query) }
  })

  on('command.run', { command: 'tmux-agents-rm' }, async ($, e) => {
    const name = e.args.trim()
    if (!name) return { text: 'Usage: /tmux-agents-rm <session>' }
    return { text: await stopOrRemove($, 'rm', name) }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const groups = paneGroups((await read($, sessions)).filter(r => r.kind === 'background'))
    const err = await read($, error)
    const now = Date.now()
    const color = (r: AgentRow) => STATE_COLORS[label(r)]
    const mark = (r: AgentRow) => (isWorking(r) ? '●' : isStopped(r) ? '◌' : '○')
    const jump = async (r: AgentRow) => $.ui.toast(await switchTo($, r.cwd, ['-i', r.sessionId]))

    return (
      <Box flexDirection="column">
        {err !== '' && <Text color="red">{err}</Text>}
        {groups.length === 0 && <Text dimColor>No background sessions.</Text>}
        {groups.map(g => (
          <Box key={g.path} flexDirection="column">
            <Text bold>{short(g.path)}</Text>
            {g.rows.map(r => (
              <Box key={r.sessionId} justifyContent="space-between">
                {/* A Button's label does not truncate: a long name wraps within its column, and the state keeps its place. */}
                <Box flexShrink={1}>
                  <Button key={r.sessionId} plain onPress={() => void jump(r)}>
                    <Text color={color(r)} dimColor={isStopped(r)}>
                      {` ${mark(r)} ${r.name}`}
                    </Text>
                  </Button>
                </Box>
                <Box flexShrink={0}>
                  <Text color={color(r)} dimColor={isStopped(r)}>
                    {` ${label(r)} ${age(r.startedAt, now)}`}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
