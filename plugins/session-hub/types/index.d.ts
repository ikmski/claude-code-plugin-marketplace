// One row of `claude agents --json`, the fields this mod reads.
export type AgentRow = {
  sessionId: string
  id?: string | null
  name: string
  cwd: string
  kind: string
  status: string
  state?: string | null
  startedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'session-hub': {
      sessions: Shaped<AgentRow[]>
      error: Shaped<string>
    }
  }
}
