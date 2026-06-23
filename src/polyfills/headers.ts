type HeaderInit = HeadersPolyfill | Record<string, string> | Iterable<[string, string]> | undefined

function normalizeName(name: string): string {
  return String(name).toLowerCase()
}

function normalizeValue(value: unknown): string {
  return String(value)
}

export default class HeadersPolyfill {
  private map: Record<string, string> = {}

  constructor(init?: HeaderInit) {
    if (!init) return

    if (init instanceof HeadersPolyfill || typeof (init as any).forEach === 'function') {
      ;(init as any).forEach((value: string, name: string) => {
        this.append(name, value)
      })
      return
    }

    if (typeof (init as any)[Symbol.iterator] === 'function') {
      for (const [name, value] of init as Iterable<[string, string]>) {
        this.append(name, value)
      }
      return
    }

    Object.keys(init).forEach((name) => {
      this.append(name, (init as Record<string, string>)[name])
    })
  }

  append(name: string, value: unknown) {
    const key = normalizeName(name)
    const normalizedValue = normalizeValue(value)
    this.map[key] = this.map[key] ? `${this.map[key]}, ${normalizedValue}` : normalizedValue
  }

  delete(name: string) {
    delete this.map[normalizeName(name)]
  }

  get(name: string): string | null {
    return this.map[normalizeName(name)] ?? null
  }

  has(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.map, normalizeName(name))
  }

  set(name: string, value: unknown) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  forEach(callback: (value: string, name: string, parent: HeadersPolyfill) => void, thisArg?: unknown) {
    for (const [name, value] of this.entries()) {
      callback.call(thisArg, value, name, this)
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const name of Object.keys(this.map)) {
      yield [name, this.map[name]]
    }
  }

  *keys(): IterableIterator<string> {
    for (const [name] of this.entries()) {
      yield name
    }
  }

  *values(): IterableIterator<string> {
    for (const [, value] of this.entries()) {
      yield value
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }
}
