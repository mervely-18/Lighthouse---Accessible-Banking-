export interface BrailleOutputAdapter {
  isConnected(): boolean
  connect(): Promise<boolean>
  disconnect(): void
  send(text: string): void
  getLastMessage(): string | null
}

class SimulatedBrailleAdapter implements BrailleOutputAdapter {
  private connected = false
  private lastMessage: string | null = null

  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<boolean> {
    this.connected = true
    return true
  }

  disconnect(): void {
    this.connected = false
  }

  send(text: string): void {
    if (!this.connected) return
    this.lastMessage = text
  }

  getLastMessage(): string | null {
    return this.lastMessage
  }
}

export const brailleAdapter: BrailleOutputAdapter = new SimulatedBrailleAdapter()
