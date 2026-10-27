import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

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

// Matched by cwd, not by name: two orgs can hold repositories of one name.
// Running sessions first, newest first (left idle for about an hour a
// session's process stops; only `--all` lists it, and resuming keeps its context).
export function workersOf(rows: AgentRow[], path: string): AgentRow[] {
  return rows
    .filter(r => r.kind === 'background' && r.cwd === path)
    .sort((a, b) => Number(isStopped(a)) - Number(isStopped(b)) || b.startedAt - a.startedAt)
}

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

export type DispatchArgs = { task: string; repo?: string; session?: string; label?: string; open?: boolean }

// Without `session` a new session is started in `repo`; with it the task goes
// to that session (resumed when stopped). With `open` the session is then put
// in a tmux window, as hub_open does.
export async function dispatch($: EngineInterface, args: DispatchArgs): Promise<string> {
  const rows = await listRows($)
  const hub = await hubName($, rows)
  const text = hub
    ? `${args.task}\n\n終わったら SendMessage で ${hub} へ結果を返してください。`
    : args.task
  const warn = hub ? '' : '\n(このセッションの名前が取れないため、依頼文に返信先を付けていません)'

  if (args.session) {
    const worker = findSession(rows, args.session)
    if (!worker) {
      const names = rows.filter(r => r.kind === 'background').map(r => r.name)
      return `No session named "${args.session}". Sessions: ${names.join(', ') || '(none)'}`
    }
    if (isStopped(worker)) {
      const ran = await $.process.run(['claude', '--resume', worker.sessionId, '--bg', text], {
        cwd: worker.cwd,
      })
      await refresh($)
      if (ran.exitCode !== 0) return `Could not resume ${worker.name}: ${ran.stderr.trim()}`
      return `Resumed ${worker.name} (${worker.cwd}).${warn}${await openAfter($, args, worker.cwd, worker.sessionId)}`
    }
    const sent = await $.session.send({ to: { sessionId: worker.sessionId }, text })
    if (!sent.isDelivered) return `Not delivered to ${worker.name}: ${sent.reason}`
    await refresh($)
    return `Sent to ${worker.name} (${worker.cwd}).${warn}${await openAfter($, args, worker.cwd, worker.sessionId)}`
  }

  if (!args.repo) return 'Name a repository to start a session in, or a session to send to.'
  const repo = resolveRepo(await listRepos($), args.repo)
  if (typeof repo === 'string') return repo
  const name = newSessionName(repo, rows, args.label)
  const ran = await $.process.run(['claude', '--bg', '--name', name, text], { cwd: repo.path })
  await refresh($)
  if (ran.exitCode !== 0) return `Could not start a session in ${repo.path}: ${ran.stderr.trim()}`
  if (!args.open) return `Started ${name} in ${repo.path}. Follow up with session "${name}".${warn}`
  // `claude --bg` prints no session id, so the new session is found by its name.
  const started = workersOf(await listRows($), repo.path).find(r => r.name === name)
  const opened = started
    ? await openAfter($, args, repo.path, started.sessionId)
    : `\n(${name} がまだ一覧に無いため tmux には出していません)`
  return `Started ${name} in ${repo.path}. Follow up with session "${name}".${warn}${opened}`
}

async function openAfter($: EngineInterface, args: DispatchArgs, path: string, sessionId: string): Promise<string> {
  return args.open ? `\n${await openDetached($, path, ['-i', sessionId])}` : ''
}

// The repository, and the -i argument for tmux-claude-attach when a session is named.
async function target(
  $: EngineInterface,
  query: string,
  sessionName?: string,
): Promise<{ repo: Repo; attachArgs: string[] } | string> {
  const repo = resolveRepo(await listRepos($), query)
  if (typeof repo === 'string') return repo
  if (!sessionName) return { repo, attachArgs: [] }
  const worker = workersOf(await listRows($), repo.path).find(r => r.name === sessionName)
  if (!worker) return `No session named "${sessionName}" in ${repo.path}.`
  return { repo, attachArgs: ['-i', worker.sessionId] }
}

export type OpenArgs = { repo: string; session?: string; label?: string }

// For the model: the user's screen stays where it is. Without a session the
// window starts a new Claude session.
export async function hubOpen($: EngineInterface, args: OpenArgs): Promise<string> {
  const found = await target($, args.repo, args.session)
  if (typeof found === 'string') return found
  const attachArgs = args.session ? found.attachArgs : ['-n', ...(args.label ? [args.label] : [])]
  return openDetached($, found.repo.path, attachArgs)
}

async function openDetached($: EngineInterface, path: string, attachArgs: string[]): Promise<string> {
  const project = await $.process.run(['tmux-project', '-d', path])
  if (project.exitCode !== 0) return `tmux-project failed: ${project.stderr.trim()}`
  const session = project.stdout.trim()
  if (!session) return `tmux-project -d printed no session name for ${path}.`
  const attach = await $.process.run(['tmux-claude-attach', '-d', '-t', session, ...attachArgs])
  if (attach.exitCode !== 0) return `tmux-claude-attach failed: ${attach.stderr.trim()}`
  await refresh($)
  return `${session} の window ${attach.stdout.trim()} に出した。入るには prefix S 等で切り替える。`
}

// For /open: switches this client to the session.
async function open($: EngineInterface, query: string, sessionName?: string): Promise<string> {
  const found = await target($, query, sessionName)
  if (typeof found === 'string') return found
  return switchTo($, found.repo.path, found.attachArgs)
}

// Switches the person's tmux client to the tmux session of `path`, then to the
// window tmux-claude-attach picks for `attachArgs`. A background session runs
// outside tmux, where a plain `tmux-project <path>` attaches and fails with
// "not a terminal", so the session is only set up (-d) and tmux-claude-attach
// switches the client.
async function switchTo($: EngineInterface, path: string, attachArgs: string[]): Promise<string> {
  const project = await $.process.run(['tmux-project', '-d', path])
  if (project.exitCode !== 0) return `tmux-project failed: ${project.stderr.trim()}`
  const session = project.stdout.trim()
  if (!session) return `tmux-project -d printed no session name for ${path}.`
  // Outside tmux this is the client tmux finds best, the one last used; the
  // picker popup is shown on it, and it is the one switched.
  const client = (await $.process.run(['tmux', 'display-message', '-p', '#{client_name}'])).stdout.trim()
  const clientArgs = client ? ['-c', client] : []
  const attach = await $.process.run(['tmux-claude-attach', '-t', session, ...attachArgs, ...clientArgs])
  if (attach.exitCode !== 0) return `tmux-claude-attach failed: ${attach.stderr.trim()}`
  await refresh($)
  return `Opened ${session} in tmux.`
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)

    await $.command.register({ name: 'hub', description: 'Open or close the hub sessions pane' })
    await $.command.register({
      name: 'dispatch',
      description: 'Start a new session in a repository with a task: /dispatch [-n <label>] <repo> <task>',
    })
    await $.command.register({
      name: 'send',
      description: 'Send a task to an existing session: /send <session> <task>',
    })
    await $.command.register({ name: 'repos', description: 'List repositories and their sessions' })
    await $.command.register({
      name: 'open',
      description: "Open a repository's tmux session and attach to a Claude session: /open <repo> [session]",
    })

    await $.tool.register({
      name: 'hub_dispatch',
      description:
        'Hand a task to a background Claude Code session of a repository under ~/develop. ' +
        'Without `session`, starts a new session in `repo` with `claude --bg` (a repository can ' +
        'have several). With `session`, sends the task to that existing session, resuming it ' +
        'when stopped. The task is sent with a request to reply to this hub by SendMessage. ' +
        'With `open`, the session is then put in a tmux window as hub_open does. ' +
        'hub_sessions lists the sessions and their names.',
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
          open: {
            type: 'boolean',
            description: "Also put the session in a tmux window, without switching the user's screen",
          },
        },
        required: ['task'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'hub_open',
      description:
        "Set up a repository's tmux session and a window with a Claude session in it, without " +
        "switching the user's screen (`tmux-project -d`, then `tmux-claude-attach -d`). With " +
        '`session`, the window attaches to that background session; without it, the window starts ' +
        'a new Claude session named after `label`. Reports which tmux session and window to enter.',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository name or absolute path' },
          session: {
            type: 'string',
            description: 'Name of a background session of the repository to attach to',
          },
          label: {
            type: 'string',
            description: 'Label for a new Claude session, used when `session` is omitted',
          },
        },
        required: ['repo'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'hub_sessions',
      description: 'List the active Claude Code sessions (`claude agents --json`) with repository paths.',
      isDeferred: false,
    })

    await refresh($)
    $.clock.every(POLL_MS, () => refresh($))
    void openPane($)

    return started
  })

  on('tool.call', { tool: 'mcp__session-hub__hub_dispatch' }, async ($, e: any) => {
    const text = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
    const args = {
      task: String(e.task ?? ''),
      repo: text(e.repo),
      session: text(e.session),
      label: text(e.label),
      open: e.open === true,
    }
    return { result: await dispatch($, args) }
  }).catch(($, e, next) => ({ deny: `session-hub: hub_dispatch failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__hub_open' }, async ($, e: any) => {
    const text = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
    const args = { repo: String(e.repo ?? ''), session: text(e.session), label: text(e.label) }
    return { result: await hubOpen($, args) }
  }).catch(($, e, next) => ({ deny: `session-hub: hub_open failed: ${String(next.error)}` }))

  on('tool.call', { tool: 'mcp__session-hub__hub_sessions' }, async $ => {
    const rows = await listRows($)
    await update($, sessions, () => rows)
    // An array result is read as content blocks, so hand the rows over as text.
    return { result: JSON.stringify(rows.map(r => ({ ...r, repo: short(r.cwd) })), null, 2) }
  }).catch(($, e, next) => ({ deny: `session-hub: hub_sessions failed: ${String(next.error)}` }))

  on('command.run', { command: 'hub' }, async $ => {
    // The pane opened at session start waits undrawn on a narrow terminal;
    // /hub then draws it rather than closing what the person never saw.
    if ((await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)) {
      await $.ui.close({ id: PANE })
      return { text: 'Hub sessions pane closed.' }
    }
    await openPane($)
    return { text: 'Hub sessions pane opened.' }
  })

  on('command.run', { command: 'dispatch' }, async ($, e) => {
    const words = e.args.trim().split(/\s+/)
    const label = words[0] === '-n' ? words.splice(0, 2)[1] : undefined
    const [repo, ...rest] = words
    const task = rest.join(' ')
    if (!repo || !task) return { text: 'Usage: /dispatch [-n <label>] <repo> <task>' }
    return { text: await dispatch($, { repo, task, label }) }
  })

  on('command.run', { command: 'send' }, async ($, e) => {
    const [session, ...rest] = e.args.trim().split(/\s+/)
    const task = rest.join(' ')
    if (!session || !task) return { text: 'Usage: /send <session> <task>' }
    return { text: await dispatch($, { session, task }) }
  })

  on('command.run', { command: 'open' }, async ($, e) => {
    const [repo, session] = e.args.trim().split(/\s+/)
    if (!repo) return { text: 'Usage: /open <repo> [session]' }
    return { text: await open($, repo, session) }
  })

  on('command.run', { command: 'repos' }, async $ => {
    const [repos, rows] = await Promise.all([listRepos($), listRows($)])
    const lines = repos.map(r => {
      const ws = workersOf(rows, r.path).map(w => `${w.name}[${label(w)}]`)
      return ws.length === 0 ? short(r.path) : `${short(r.path)}  ${ws.join(' ')}`
    })
    return { text: lines.join('\n') }
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
