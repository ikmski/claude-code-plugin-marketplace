import { atom, read, update } from 'claude-code'
import type { CommandSpec, EngineInterface, Register, ToolSpec } from 'claude-code'

import type { AgentRow } from '../types'

const PANE = 'hub-sessions'
// Fits a repository path under ~/develop and " ● <name>  <state> <age>"
// without taking the dock's default share from the transcript.
const PANE_COLUMNS = 40
// Every poll starts a `claude agents` process, so keep it slow.
const POLL_MS = 15_000

const sessions = atom({ plugin: 'session-hub', key: 'sessions' } as const, [], {
  shape: 'sessions-1',
})
const error = atom({ plugin: 'session-hub', key: 'error' } as const, '', {
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

const sanitize = (s: string) => s.replace(/[.:]/g, '_')

// The same rule as tmux-project and tmux-claude-attach: the directory name, or
// <org>-<repo> when another directory's session already has it; a further
// session of the repository adds -<label>, or -2, -3 ... when it has none or
// the name is taken.
export function newSessionName(repo: Repo, rows: AgentRow[], label = ''): string {
  const [dir = '', org = ''] = repo.path.split('/').reverse()
  const clash = rows.some(r => r.name === sanitize(dir) && r.cwd !== repo.path)
  const base = clash ? sanitize(`${org}-${dir}`) : sanitize(dir)
  const stem = label.trim() === '' ? base : `${base}-${sanitize(label.trim())}`
  const taken = new Set(rows.map(r => r.name))
  if (!taken.has(stem)) return stem
  let n = 2
  while (taken.has(`${stem}-${n}`)) n++
  return `${stem}-${n}`
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

// The pane's rows by directory: working sessions first, stopped ones last,
// newer before older; groups holding a working session first, then by the
// newest session.
export function paneGroups(rows: AgentRow[]): PaneGroup[] {
  const rank = (r: AgentRow) => (isWorking(r) ? 0 : isStopped(r) ? 2 : 1)
  const byPath = new Map<string, AgentRow[]>()
  for (const r of rows) byPath.set(r.cwd, [...(byPath.get(r.cwd) ?? []), r])
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
  const before = await read($, sessions)
  for (const row of rows) {
    const old = before.find(o => o.sessionId === row.sessionId)
    const was = old && label(old)
    if (row.kind === 'background' && was !== undefined && was !== label(row)) {
      $.ui.toast(`${row.name}: ${was} → ${label(row)}`)
    }
  }
  await update($, sessions, () => rows)
  await update($, error, () => '')
}

function label(row: AgentRow): string {
  return row.state ?? row.status
}

// The reply address is this session's name as it is listed now. A session
// started from argv has no sender to reply to, so the task has to name one.
async function hubName($: EngineInterface, rows: AgentRow[]): Promise<string | undefined> {
  const me = await $.session.id()
  return rows.find(r => r.sessionId === me)?.name
}

export type DispatchArgs = { task: string; repo?: string; session?: string; label?: string }

// Without `session` a new session is started in `repo`; with it the task goes
// to that session (resumed when stopped).
export async function dispatch($: EngineInterface, args: DispatchArgs): Promise<string> {
  const rows = await listRows($)
  const hub = await hubName($, rows)
  const text = hub
    ? `${args.task}\n\n終わったら SendMessage で ${hub} へ結果を返してください。`
    : args.task
  const warn = hub ? '' : '\n(このセッションの名前が取れないため、依頼文に返信先を付けていません)'

  if (args.session) {
    const worker = findSession(rows, args.session)
    if (!worker) return noSession(rows, args.session)
    if (isStopped(worker)) {
      const ran = await $.process.run(['claude', '--resume', worker.sessionId, '--bg', text], {
        cwd: worker.cwd,
      })
      await refresh($)
      if (ran.exitCode !== 0) return `Could not resume ${worker.name}: ${ran.stderr.trim()}`
      return `Resumed ${worker.name} (${worker.cwd}).${warn}`
    }
    const sent = await $.session.send({ to: { sessionId: worker.sessionId }, text })
    if (!sent.isDelivered) return `Not delivered to ${worker.name}: ${sent.reason}`
    await refresh($)
    return `Sent to ${worker.name} (${worker.cwd}).${warn}`
  }

  if (!args.repo) return 'Name a repository to start a session in, or a session to send to.'
  const repo = resolveRepo(await listRepos($), args.repo)
  if (typeof repo === 'string') return repo
  const name = newSessionName(repo, rows, args.label)
  const ran = await $.process.run(['claude', '--bg', '--name', name, text], { cwd: repo.path })
  await refresh($)
  if (ran.exitCode !== 0) return `Could not start a session in ${repo.path}: ${ran.stderr.trim()}`
  return `Started ${name} in ${repo.path}. Follow up with session "${name}".${warn}`
}

export type PrepareArgs = { session?: string; repo?: string; label?: string }

// For the model: the user's screen stays where it is. A session is found by
// its name, which newSessionName keeps unique; without one, the window starts
// a new Claude session in `repo`.
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
  return prepareWindow($, repo.path, ['-n', ...(args.label ? [args.label] : [])])
}

// Sets up the tmux session of `path` without switching to it (a background
// session runs outside tmux, where a plain `tmux-project <path>` attaches and
// fails with "not a terminal"), then runs tmux-claude-attach in it with `args`.
// Answers the tmux session and what tmux-claude-attach printed, or why not.
async function attachIn(
  $: EngineInterface,
  path: string,
  args: string[],
): Promise<{ session: string; printed: string } | string> {
  const project = await $.process.run(['tmux-project', '-d', path])
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

// For /session-switch: a session by its name, else a repository, where
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

// A row's short id is what `claude stop`, `rm` and `logs` are documented to take.
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

const LOG_LINES = 200

export async function logsOf($: EngineInterface, name: string): Promise<string> {
  const rows = await listRows($)
  const worker = findSession(rows, name)
  if (!worker) return noSession(rows, name)
  const ran = await $.process.run(['claude', 'logs', jobId(worker)])
  if (ran.exitCode !== 0) return `claude logs ${worker.name} failed: ${ran.stderr.trim()}`
  const lines = ran.stdout.trimEnd().split('\n')
  const cut = lines.length > LOG_LINES ? `(last ${LOG_LINES} of ${lines.length} lines)\n` : ''
  return cut + lines.slice(-LOG_LINES).join('\n')
}

function openPane($: EngineInterface) {
  return $.ui.open({ id: PANE, title: 'Hub sessions', columns: PANE_COLUMNS })
}

function age(startedAt: number, now: number): string {
  const min = Math.floor((now - startedAt) / 60_000)
  return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60}m`
}

function short(path: string): string {
  return path.replace(/^\/home\/[^/]+\/develop\//, '')
}

// Only what a person does by hand; the rest is asked of the hub in words,
// which reaches the tools.
const COMMANDS: CommandSpec[] = [
  { name: 'session-hub', description: 'Open or close the hub sessions pane' },
  {
    name: 'session-switch',
    description: "Switch the screen to a session's tmux window, or to a repository's: /session-switch <session|repo>",
  },
  { name: 'session-rm', description: 'Delete a background session and its worktree: /session-rm <session>' },
]

const TOOLS: ToolSpec[] = [
  {
    name: 'session-dispatch',
    description:
      'Hand a task to a background Claude Code session of a repository under ~/develop. ' +
      'Without `session`, starts a new session in `repo` with `claude --bg` (a repository can ' +
      'have several). With `session`, sends the task to that existing session, resuming it ' +
      'when stopped. The task is sent with a request to reply to this hub by SendMessage. ' +
      'session-prepare then puts the session in a tmux window. session-list lists the sessions ' +
      'and their names.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'What the session should do' },
        repo: {
          type: 'string',
          description: 'Repository name or absolute path to start a new session in',
        },
        session: {
          type: 'string',
          description: 'Name of an existing session to send to; omit to start a new one',
        },
        label: {
          type: 'string',
          description: "Short purpose for a new session's name (review → <repo>-review)",
        },
      },
      required: ['task'],
    },
    isDeferred: false,
  },
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
          description: 'Label for a new Claude session, used when `session` is omitted',
        },
      },
    },
    isDeferred: false,
  },
  {
    name: 'session-stop',
    description:
      'Stop a background session (`claude stop`). Its conversation is kept; session-dispatch to it ' +
      'resumes it.',
    inputSchema: {
      type: 'object',
      properties: { session: { type: 'string', description: 'Name of the session to stop' } },
      required: ['session'],
    },
    isDeferred: false,
  },
  {
    name: 'session-logs',
    description:
      "Read a background session's recent terminal output (`claude logs`), to see what it did " +
      'without attaching to it.',
    inputSchema: {
      type: 'object',
      properties: { session: { type: 'string', description: 'Name of the session to read' } },
      required: ['session'],
    },
    isDeferred: false,
  },
  {
    name: 'session-list',
    description: 'List the active Claude Code sessions (`claude agents --json`) with repository paths.',
    isDeferred: false,
  },
]

// One at a time: a name the engine refuses (a built-in's) drops only that
// one, not the tools, the poll and the pane after it.
async function declare($: EngineInterface): Promise<void> {
  for (const command of COMMANDS) {
    try {
      await $.command.register(command)
    } catch (err) {
      $.ui.log(`session-hub: /${command.name} is not available: ${String(err)}`)
    }
  }
  for (const tool of TOOLS) {
    try {
      await $.tool.register(tool)
    } catch (err) {
      $.ui.log(`session-hub: ${tool.name} is not available: ${String(err)}`)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    await declare($)
    await refresh($)
    $.clock.every(POLL_MS, () => refresh($))
    void openPane($)

    return started
  })

  on('tool.call', { tool: 'mcp__session-hub__session-dispatch' }, async ($, e: any) => {
    const text = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
    const args = {
      task: String(e.task ?? ''),
      repo: text(e.repo),
      session: text(e.session),
      label: text(e.label),
    }
    return { result: await dispatch($, args) }
  }).catch(($, e, next) => ({ deny: `session-hub: session-dispatch failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__session-prepare' }, async ($, e: any) => {
    const text = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
    const args = { session: text(e.session), repo: text(e.repo), label: text(e.label) }
    return { result: await prepare($, args) }
  }).catch(($, e, next) => ({ deny: `session-hub: session-prepare failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__session-list' }, async $ => {
    const rows = await listRows($)
    await update($, sessions, () => rows)
    // An array result is read as content blocks, so hand the rows over as text.
    return { result: JSON.stringify(rows.map(r => ({ ...r, repo: short(r.cwd) })), null, 2) }
  }).catch(($, e, next) => ({ deny: `session-hub: session-list failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__session-stop' }, async ($, e: any) => ({
    result: await stopOrRemove($, 'stop', String(e.session ?? '')),
  })).catch(($, e, next) => ({ deny: `session-hub: session-stop failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__session-logs' }, async ($, e: any) => ({
    result: await logsOf($, String(e.session ?? '')),
  })).catch(($, e, next) => ({ deny: `session-hub: session-logs failed: ${String(next.error)}` }))

  on('command.run', { command: 'session-hub' }, async $ => {
    // The pane opened at session start waits undrawn on a narrow terminal;
    // /session-hub then draws it rather than closing what the person never saw.
    if ((await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)) {
      await $.ui.close({ id: PANE })
      return { text: 'Hub sessions pane closed.' }
    }
    await openPane($)
    return { text: 'Hub sessions pane opened.' }
  })

  on('command.run', { command: 'session-switch' }, async ($, e) => {
    const query = e.args.trim()
    if (!query) return { text: 'Usage: /session-switch <session|repo>' }
    return { text: await switchToQuery($, query) }
  })

  on('command.run', { command: 'session-rm' }, async ($, e) => {
    const name = e.args.trim()
    if (!name) return { text: 'Usage: /session-rm <session>' }
    return { text: await stopOrRemove($, 'rm', name) }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const groups = paneGroups((await read($, sessions)).filter(r => r.kind === 'background'))
    const err = await read($, error)
    const now = Date.now()
    const color = (r: AgentRow) => (isWorking(r) ? 'yellow' : r.status === 'idle' ? 'green' : undefined)
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
                <Button key={r.sessionId} plain onPress={() => void jump(r)}>
                  <Text color={color(r)} dimColor={isStopped(r)} wrap="truncate-end">
                    {' '}
                    {mark(r)} {r.name}
                  </Text>
                </Button>
                <Text color={color(r)} dimColor={isStopped(r)}>
                  {label(r)} {age(r.startedAt, now)}
                </Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
