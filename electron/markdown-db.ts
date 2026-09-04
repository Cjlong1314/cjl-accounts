import fs from 'node:fs'
import path from 'node:path'
import { MarkdownStore as CoreStore, type LedgerFileBackend, type LedgerFileName } from '../shared/markdownStore'

class NodeLedgerBackend implements LedgerFileBackend {
  constructor(
    readonly dataDir: string,
    private readonly seedDir = dataDir,
  ) {}

  private file(name: LedgerFileName): string {
    return path.join(this.dataDir, `${name}.md`)
  }

  ensureReady(): void {
    fs.mkdirSync(this.dataDir, { recursive: true })
    if (this.seedDir === this.dataDir || !fs.existsSync(this.seedDir)) return
    for (const name of ['categories', 'transactions'] as const) {
      const target = this.file(name)
      if (fs.existsSync(target)) continue
      const seed = path.join(this.seedDir, `${name}.md`)
      if (fs.existsSync(seed)) fs.copyFileSync(seed, target)
    }
  }

  exists(name: LedgerFileName): boolean {
    return fs.existsSync(this.file(name))
  }

  read(name: LedgerFileName): string {
    return fs.readFileSync(this.file(name), 'utf8')
  }

  write(name: LedgerFileName, content: string): void {
    const filePath = this.file(name)
    const tmp = `${filePath}.tmp`
    fs.writeFileSync(tmp, content, 'utf8')
    fs.renameSync(tmp, filePath)
  }
}

export class MarkdownStore extends CoreStore {
  constructor(dir: string, seedDir = dir) {
    super(new NodeLedgerBackend(dir, seedDir))
  }
}
