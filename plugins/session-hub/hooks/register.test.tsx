import { expect, test } from 'claude-code/testing'

import type { AgentRow } from '../types'
import { findSession, newSessionName, parseRepos, resolveRepo, workersOf } from './register'

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

function engine(on: any, agents: AgentRow[], runs: string[][], sent: any[]) {
  on('session.id', () => ({ value: 'hub-id' }))
  on('process.run', (_: unknown, e: any) => {
    runs.push([...e.argv])
    const [cmd, sub] = e.argv
    const stdout =
      cmd === 'tmux-project'
        ? REPOS.map(r => `  ${r.name}\t${r.path}`).join('\n')
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

const DISPATCH = 'mcp__session-hub__hub_dispatch'

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

test('the pane lists background sessions with state and repository, on every surface', async ($, on) => {
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
  // hub_sessions stores what it read, which is what the pane draws.
  await $.tool.call({ tool: 'mcp__session-hub__hub_sessions' } as any)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /ccwatch · working/ }))?.text).toMatch(/^ccwatch · working · /)
    expect((await ui.find({ type: 'Text', text: /hub/ }))).toBe(undefined)
    await ui.unmount()
  }
})
