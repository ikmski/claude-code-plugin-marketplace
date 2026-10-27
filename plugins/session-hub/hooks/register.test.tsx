import { expect, test } from 'claude-code/testing'

import type { AgentRow } from '../types'
import { findSession, newSessionName, paneGroups, parseRepos, resolveRepo, workersOf } from './register'

const REPOS = parseRepos(
  [
    '  ccwatch\t/home/u/develop/ikmski/ccwatch',
    '* tmp\t/home/u/develop/guildstudio/tmp',
    '  tmp\t/home/u/develop/ikmski/tmp',
    '',
  ].join('\n'),
)

const row = (over: Partial<AgentRow>): AgentRow => ({
  sessionId: 's',
  name: 'n',
  cwd: '/',
  kind: 'background',
  status: 'idle',
  startedAt: 0,
  ...over,
})

test('parseRepos reads tmux-project -l', () => {
  expect(REPOS).toEqual([
    { name: 'ccwatch', path: '/home/u/develop/ikmski/ccwatch' },
    { name: 'tmp', path: '/home/u/develop/guildstudio/tmp' },
    { name: 'tmp', path: '/home/u/develop/ikmski/tmp' },
  ])
})

test('resolveRepo takes a name, a path or a unique part of a path', () => {
  expect(resolveRepo(REPOS, 'ccwatch')).toEqual(REPOS[0])
  expect(resolveRepo(REPOS, '/home/u/develop/ikmski/tmp')).toEqual(REPOS[2])
  expect(resolveRepo(REPOS, 'guildstudio/tmp')).toEqual(REPOS[1])
  expect(resolveRepo(REPOS, 'tmp')).toMatch(/several/)
  expect(resolveRepo(REPOS, 'nothing')).toMatch(/No repository/)
})

test('newSessionName adds the org only when another directory has the name', () => {
  const ikmskiTmp = REPOS[2]!
  expect(newSessionName(ikmskiTmp, [])).toBe('tmp')
  expect(newSessionName(ikmskiTmp, [row({ name: 'tmp', cwd: '/home/u/develop/guildstudio/tmp' })])).toBe(
    'ikmski-tmp',
  )
})

test('newSessionName gives a further session a label or a number', () => {
  const ccwatch = REPOS[0]!
  const one = [row({ name: 'ccwatch', cwd: ccwatch.path })]
  expect(newSessionName(ccwatch, one)).toBe('ccwatch-2')
  expect(newSessionName(ccwatch, [...one, row({ name: 'ccwatch-2', cwd: ccwatch.path })])).toBe('ccwatch-3')
  expect(newSessionName(ccwatch, one, 'review')).toBe('ccwatch-review')
  expect(newSessionName(ccwatch, [...one, row({ name: 'ccwatch-review', cwd: ccwatch.path })], 'review')).toBe(
    'ccwatch-review-2',
  )
  expect(newSessionName(ccwatch, [], 'review')).toBe('ccwatch-review')
})

test('workersOf lists background sessions of a directory, running and newest first', () => {
  const rows = [
    row({ sessionId: 'i', kind: 'interactive', cwd: '/r' }),
    row({ sessionId: 'stopped', cwd: '/r', state: 'stopped', startedAt: 3 }),
    row({ sessionId: 'old', cwd: '/r', startedAt: 1 }),
    row({ sessionId: 'new', cwd: '/r', startedAt: 2 }),
    row({ sessionId: 'other', cwd: '/x' }),
  ]
  expect(workersOf(rows, '/r').map(r => r.sessionId)).toEqual(['new', 'old', 'stopped'])
})

test('findSession prefers a running session of the name', () => {
  const rows = [
    row({ sessionId: 'stopped', name: 'a', state: 'stopped', startedAt: 2 }),
    row({ sessionId: 'running', name: 'a', state: 'working', startedAt: 1 }),
  ]
  expect(findSession(rows, 'a')?.sessionId).toBe('running')
  expect(findSession(rows, 'b')).toBe(undefined)
})

const AGENTS: AgentRow[] = [
  row({ sessionId: 'hub-id', name: 'hub', cwd: '/home/u/hub', kind: 'interactive' }),
  row({ sessionId: 'w-id', name: 'ccwatch', cwd: '/home/u/develop/ikmski/ccwatch' }),
]

function engine(on: any, agents: AgentRow[], runs: string[][], sent: any[], onRun?: (argv: string[]) => void) {
  on('session.id', () => ({ value: 'hub-id' }))
  on('process.run', (_: unknown, e: any) => {
    runs.push([...e.argv])
    onRun?.(e.argv)
    const [cmd, sub] = e.argv
    const stdout =
      cmd === 'tmux-project' && sub === '-l'
        ? REPOS.map(r => `  ${r.name}\t${r.path}`).join('\n')
        : cmd === 'tmux-project' && sub === '-d'
          ? 'ccwatch\n'
          : cmd === 'tmux-claude-attach'
            ? 'claude-w\n'
            : cmd === 'tmux' && sub === 'display-message'
              ? '/dev/pts/1\n'
            : cmd === 'claude' && sub === 'agents'
              ? JSON.stringify(agents)
              : ''
    return { value: { exitCode: 0, stdout, stderr: '' } }
  })
  on('session.send', (_: unknown, e: any) => {
    sent.push(e)
    return { isDelivered: true }
  })
}

const DISPATCH = 'mcp__session-hub__session-dispatch'

test('dispatch sends to the session it is named', async ($, on) => {
  const runs: string[][] = []
  const sent: any[] = []
  engine(on, AGENTS, runs, sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'run the tests' } as any)

  expect(ran.result).toMatch(/^Sent to ccwatch/)
  expect(sent.length).toBe(1)
  expect(sent[0].text).toMatch(/run the tests[\s\S]*SendMessage で hub へ/)
  expect(runs.some(a => a.includes('--bg'))).toBe(false)
})

test('dispatch starts a session when none works there', async ($, on) => {
  const runs: string[][] = []
  const sent: any[] = []
  engine(on, [AGENTS[0]!], runs, sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, repo: 'ikmski/tmp', task: 'clean up' } as any)

  expect(ran.result).toMatch(/^Started tmp in \/home\/u\/develop\/ikmski\/tmp/)
  const bg = runs.find(a => a.includes('--bg'))!
  expect(bg.slice(0, 4)).toEqual(['claude', '--bg', '--name', 'tmp'])
  expect(bg[4]).toMatch(/clean up[\s\S]*hub/)
  expect(sent.length).toBe(0)
})

test('dispatch resumes a stopped session it is named', async ($, on) => {
  const runs: string[][] = []
  const sent: any[] = []
  const stopped = row({
    sessionId: 'old-id',
    name: 'ccwatch',
    cwd: '/home/u/develop/ikmski/ccwatch',
    status: null as unknown as string,
    state: 'stopped',
  })
  engine(on, [AGENTS[0]!, stopped], runs, sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'again' } as any)

  expect(ran.result).toMatch(/^Resumed ccwatch/)
  const resume = runs.find(a => a.includes('--resume'))!
  expect(resume.slice(0, 4)).toEqual(['claude', '--resume', 'old-id', '--bg'])
  expect(runs.some(a => a.includes('--name'))).toBe(false)
  expect(sent.length).toBe(0)
})

test('dispatch without a session starts another one beside a running one', async ($, on) => {
  const runs: string[][] = []
  const sent: any[] = []
  engine(on, AGENTS, runs, sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, repo: 'ccwatch', task: 'review', label: 'review' } as any)

  expect(ran.result).toMatch(/^Started ccwatch-review in .*Follow up with session "ccwatch-review"/)
  expect(runs.find(a => a.includes('--bg'))!.slice(0, 4)).toEqual(['claude', '--bg', '--name', 'ccwatch-review'])
  expect(sent.length).toBe(0)
})

test('dispatch to a session nobody has lists the sessions', async ($, on) => {
  engine(on, AGENTS, [], [])

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'nope', task: 'x' } as any)

  expect(ran.result).toBe('No session named "nope". Sessions: ccwatch')
})

test('dispatch from a session without a name sends the task as is and says so', async ($, on) => {
  const sent: any[] = []
  engine(on, [AGENTS[1]!], [], sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'run the tests' } as any)

  expect(sent[0].text).toBe('run the tests')
  expect(ran.result).toMatch(/名前が取れない/)
})

test('dispatch from a hub of another name replies there without a warning', async ($, on) => {
  const sent: any[] = []
  engine(on, [{ ...AGENTS[0]!, name: 'obsidian-work' }, AGENTS[1]!], [], sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'run the tests' } as any)

  expect(sent[0].text).toMatch(/SendMessage で obsidian-work へ/)
  expect(ran.result).toBe('Sent to ccwatch (/home/u/develop/ikmski/ccwatch).')
})

const PREPARE = 'mcp__session-hub__session-prepare'
const detached = (runs: string[][]) => runs.filter(a => a[0] === 'tmux-claude-attach' || (a[0] === 'tmux-project' && a[1] !== '-l'))

test('session-prepare sets up the tmux session and a window for the session without switching', async ($, on) => {
  const runs: string[][] = []
  engine(on, AGENTS, runs, [])

  const ran: any = await $.tool.call({ tool: PREPARE, repo: 'ccwatch', session: 'ccwatch' } as any)

  expect(detached(runs)).toEqual([
    ['tmux-project', '-d', '/home/u/develop/ikmski/ccwatch'],
    ['tmux-claude-attach', '-d', '-t', 'ccwatch', '-i', 'w-id'],
  ])
  expect(ran.result).toMatch(/^ccwatch の window claude-w に出した/)
})

test('session-prepare without a session opens a new Claude session, with its label', async ($, on) => {
  const runs: string[][] = []
  engine(on, AGENTS, runs, [])

  await $.tool.call({ tool: PREPARE, repo: 'ccwatch' } as any)
  await $.tool.call({ tool: PREPARE, repo: 'ccwatch', label: 'review' } as any)

  const attaches = runs.filter(a => a[0] === 'tmux-claude-attach')
  expect(attaches).toEqual([
    ['tmux-claude-attach', '-d', '-t', 'ccwatch', '-n'],
    ['tmux-claude-attach', '-d', '-t', 'ccwatch', '-n', 'review'],
  ])
})

test('session-prepare to a session the repository does not have opens nothing', async ($, on) => {
  const runs: string[][] = []
  engine(on, AGENTS, runs, [])

  const ran: any = await $.tool.call({ tool: PREPARE, repo: 'ikmski/tmp', session: 'ccwatch' } as any)

  expect(ran.result).toBe('No session named "ccwatch" in /home/u/develop/ikmski/tmp.')
  expect(detached(runs)).toEqual([])
})

test('dispatch with prepare sends, then prepares the session as session-prepare does', async ($, on) => {
  const runs: string[][] = []
  const sent: any[] = []
  engine(on, AGENTS, runs, sent)

  const ran: any = await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'run the tests', prepare: true } as any)

  expect(sent.length).toBe(1)
  expect(detached(runs)).toEqual([
    ['tmux-project', '-d', '/home/u/develop/ikmski/ccwatch'],
    ['tmux-claude-attach', '-d', '-t', 'ccwatch', '-i', 'w-id'],
  ])
  expect(ran.result).toMatch(/^Sent to ccwatch[\s\S]*\nccwatch の window claude-w に出した/)
})

test('dispatch with prepare prepares a session it started, found by its name', async ($, on) => {
  const runs: string[][] = []
  const agents = [AGENTS[0]!]
  // The new session is listed once `claude --bg` has started it.
  engine(on, agents, runs, [], argv => {
    if (argv.includes('--bg')) agents.push(row({ sessionId: 'new-id', name: 'tmp', cwd: '/home/u/develop/ikmski/tmp' }))
  })

  const ran: any = await $.tool.call({ tool: DISPATCH, repo: 'ikmski/tmp', task: 'clean up', prepare: true } as any)

  expect(ran.result).toMatch(/^Started tmp[\s\S]*に出した/)
  expect(runs.find(a => a[0] === 'tmux-claude-attach')).toEqual(['tmux-claude-attach', '-d', '-t', 'ccwatch', '-i', 'new-id'])
})

test('dispatch without prepare leaves tmux alone', async ($, on) => {
  const runs: string[][] = []
  engine(on, AGENTS, runs, [])

  await $.tool.call({ tool: DISPATCH, session: 'ccwatch', task: 'run the tests' } as any)

  expect(detached(runs)).toEqual([])
})

const PANE = {
  plugin: 'session-hub',
  component: 'Pane',
  requestId: 'hub-sessions',
  props: {
    title: 'Hub sessions',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

test('the pane lists background sessions under their repository, on every surface', async ($, on) => {
  on('session.id', () => ({ value: 'hub-id' }))
  on('process.run', () => ({
    value: {
      exitCode: 0,
      stdout: JSON.stringify([
        AGENTS[0],
        row({ sessionId: 'w', name: 'ccwatch', cwd: '/home/u/develop/ikmski/ccwatch', state: 'working' }),
      ]),
      stderr: '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }))
  // session-list stores what it read, which is what the pane draws.
  await $.tool.call({ tool: 'mcp__session-hub__session-list' } as any)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: 'ikmski/ccwatch' }))?.text).toBe('ikmski/ccwatch')
    expect((await ui.find({ type: 'Text', text: /● ccwatch/ }))?.text).toBe(' ● ccwatch')
    expect((await ui.find({ type: 'Text', text: /^working / }))).not.toBe(undefined)
    expect((await ui.find({ type: 'Text', text: /hub/ }))).toBe(undefined)
    await ui.unmount()
  }
})

test('pressing a session in the pane switches to its tmux window', async ($, on) => {
  const runs: string[][] = []
  engine(on, AGENTS, runs, [])
  const toasts: string[] = []
  on('ui.toast', (_: unknown, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  await $.tool.call({ tool: 'mcp__session-hub__session-list' } as any)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'w-id' })
  await ui.unmount()

  expect(runs.filter(a => a[0] === 'tmux-project' || a[0] === 'tmux-claude-attach')).toEqual([
    ['tmux-project', '-d', '/home/u/develop/ikmski/ccwatch'],
    ['tmux-claude-attach', '-t', 'ccwatch', '-i', 'w-id', '-c', '/dev/pts/1'],
  ])
  expect(toasts).toEqual(['Opened ccwatch in tmux.'])
})

test('/session-hub opens the pane narrow, and closes it when it is open', async ($, on) => {
  const opened: any[] = []
  const closed: any[] = []
  let isOpen = false
  on('ui.panes', () => ({
    value: isOpen ? [{ id: 'hub-sessions', title: 'Hub sessions', isShown: true, isFocused: false, isPlaced: true }] : [],
  }))
  on('ui.open', (_: unknown, e: any) => {
    opened.push(e)
    isOpen = true
    return { value: { isPlaced: true } }
  })
  on('ui.close', (_: unknown, e: any) => {
    closed.push(e)
    isOpen = false
    return { value: undefined }
  })

  expect((await $.command.run({ command: 'session-hub' } as any)).text).toBe('Hub sessions pane opened.')
  expect(opened).toEqual([{ id: 'hub-sessions', title: 'Hub sessions', columns: 40 }])
  expect((await $.command.run({ command: 'session-hub' } as any)).text).toBe('Hub sessions pane closed.')
  expect(closed.map(e => e.id)).toEqual(['hub-sessions'])
  expect((await $.command.run({ command: 'session-hub' } as any)).text).toBe('Hub sessions pane opened.')
})

test('/session-hub draws the pane that waits undrawn instead of closing it', async ($, on) => {
  const opened: any[] = []
  on('ui.panes', () => ({
    value: [{ id: 'hub-sessions', title: 'Hub sessions', isShown: true, isFocused: false, isPlaced: false }],
  }))
  on('ui.open', (_: unknown, e: any) => {
    opened.push(e)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => {
    throw new Error('closed')
  })

  expect((await $.command.run({ command: 'session-hub' } as any)).text).toBe('Hub sessions pane opened.')
  expect(opened.length).toBe(1)
})

test('paneGroups groups by directory, working first and stopped last', () => {
  const groups = paneGroups([
    row({ sessionId: 'a-old', cwd: '/a', state: 'done', startedAt: 1 }),
    row({ sessionId: 'b', cwd: '/b', state: 'done', startedAt: 9 }),
    row({ sessionId: 'a-stop', cwd: '/a', state: 'stopped', startedAt: 8 }),
    row({ sessionId: 'a-new', cwd: '/a', state: 'done', startedAt: 5 }),
    row({ sessionId: 'c', cwd: '/c', state: 'working', startedAt: 2 }),
  ])
  expect(groups.map(g => [g.path, g.rows.map(r => r.sessionId)])).toEqual([
    ['/c', ['c']],
    ['/b', ['b']],
    ['/a', ['a-new', 'a-old', 'a-stop']],
  ])
})

const BG_HUB = row({ sessionId: 'hub-id', id: 'hub', name: 'hub', cwd: '/home/u/hub' })
const WORKER = row({ sessionId: 'w-id', id: 'w', name: 'ccwatch', cwd: '/home/u/develop/ikmski/ccwatch', state: 'working' })

function claudeOnly(on: any, runs: string[][], answer: (argv: string[]) => { exitCode: number; stdout?: string; stderr?: string }) {
  on('session.id', () => ({ value: 'hub-id' }))
  on('process.run', (_: unknown, e: any) => {
    runs.push([...e.argv])
    const out = e.argv[1] === 'agents' ? { exitCode: 0, stdout: JSON.stringify([BG_HUB, WORKER]) } : answer(e.argv)
    return { value: { stdout: '', stderr: '', ...out } }
  })
}

test('/session-stop and session-stop stop the named session by its id', async ($, on) => {
  const runs: string[][] = []
  claudeOnly(on, runs, () => ({ exitCode: 0 }))

  expect((await $.command.run({ command: 'session-stop', args: 'ccwatch' } as any)).text).toBe('Stopped ccwatch.')
  const ran: any = await $.tool.call({ tool: 'mcp__session-hub__session-stop', session: 'ccwatch' } as any)
  expect(ran.result).toBe('Stopped ccwatch.')
  expect(runs.filter(a => a[1] === 'stop')).toEqual([
    ['claude', 'stop', 'w'],
    ['claude', 'stop', 'w'],
  ])
})

test('/session-stop to a session nobody has lists the sessions', async ($, on) => {
  const runs: string[][] = []
  claudeOnly(on, runs, () => ({ exitCode: 0 }))

  const text = (await $.command.run({ command: 'session-stop', args: 'nope' } as any)).text
  expect(text).toBe('No session named "nope". Sessions: hub, ccwatch')
  expect(runs.some(a => a[1] === 'stop')).toBe(false)
})

test('/session-rm passes on a refusal word for word and adds no flag that overrides it', async ($, on) => {
  const runs: string[][] = []
  claudeOnly(on, runs, () => ({ exitCode: 1, stderr: 'has unpushed commits: pass --discard-unpushed abc@wt\n' }))

  const text = (await $.command.run({ command: 'session-rm', args: 'ccwatch' } as any)).text
  expect(text).toBe('claude rm ccwatch failed: has unpushed commits: pass --discard-unpushed abc@wt')
  expect(runs.filter(a => a[1] === 'rm')).toEqual([['claude', 'rm', 'w']])
})

test('/session-logs and session-logs return the tail of the output', async ($, on) => {
  const runs: string[][] = []
  const lines = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`)
  claudeOnly(on, runs, () => ({ exitCode: 0, stdout: lines.join('\n') + '\n' }))

  const text = (await $.command.run({ command: 'session-logs', args: 'ccwatch' } as any)).text
  expect(text.split('\n')[0]).toBe('(last 200 of 250 lines)')
  expect(text.split('\n')[1]).toBe('line 51')
  expect(text.endsWith('line 250')).toBe(true)
  const ran: any = await $.tool.call({ tool: 'mcp__session-hub__session-logs', session: 'ccwatch' } as any)
  expect(ran.result).toBe(text)
  expect(runs.filter(a => a[1] === 'logs')).toEqual([
    ['claude', 'logs', 'w'],
    ['claude', 'logs', 'w'],
  ])
})

test('the pane leaves out the hub when it is a background session', async ($, on) => {
  claudeOnly(on, [], () => ({ exitCode: 0 }))
  await $.tool.call({ tool: 'mcp__session-hub__session-list' } as any)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /● ccwatch/ }))?.text).toBe(' ● ccwatch')
  expect(await ui.find({ type: 'Text', text: /hub/ })).toBe(undefined)
  await ui.unmount()
})

test('a command the engine refuses at session start leaves the rest registered', async ($, on) => {
  const commands: string[] = []
  const tools: string[] = []
  const logs: string[] = []
  const opened: any[] = []
  claudeOnly(on, [], () => ({ exitCode: 0 }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('command.register', (_: unknown, e: any) => {
    if (e.name === 'session-stop') throw new Error(`"/${e.name}" refused: it is a built-in`)
    commands.push(e.name)
    return { value: { command: e.name } }
  })
  on('tool.register', (_: unknown, e: any) => {
    tools.push(e.name)
    return { value: { tool: `mcp__session-hub__${e.name}` } }
  })
  on('ui.log', (_: unknown, e: any) => {
    logs.push(e.text)
    return { value: undefined }
  })
  on('ui.open', (_: unknown, e: any) => {
    opened.push(e)
    return { value: { isPlaced: true } }
  })

  await $.session.start({ cwd: '/home/u/hub', surface: null, isInteractive: false } as any)

  expect(commands).toContain('session-rm')
  expect(commands).not.toContain('session-stop')
  expect(tools).toEqual(['session-dispatch', 'session-prepare', 'session-stop', 'session-logs', 'session-list'])
  expect(logs.some(l => l.includes('/session-stop'))).toBe(true)
  expect(opened.map(e => e.id)).toEqual(['hub-sessions'])
})
