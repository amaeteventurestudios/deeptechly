export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

const sensitiveKey = /(?:authorization|cookie|password|secret|token|api[_-]?key|session|credential|email)/i;
const sensitiveStringPatterns = [
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:sk|pk)[-_](?:live|test|lf)?[-_A-Za-z0-9]{8,}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
];

export function redactSensitive<T>(value: T, options: { maxDepth?: number; maxStringLength?: number } = {}): T {
  const seen = new WeakSet<object>();
  return visit(value, 0) as T;

  function visit(input: unknown, depth: number): unknown {
    if (depth > (options.maxDepth ?? 8)) return "[TRUNCATED]";
    if (typeof input === "string") {
      let redacted = input;
      for (const pattern of sensitiveStringPatterns) redacted = redacted.replace(pattern, "[REDACTED]");
      const limit = options.maxStringLength ?? 20_000;
      return redacted.length > limit ? `${redacted.slice(0, limit)}…[TRUNCATED]` : redacted;
    }
    if (input === null || typeof input !== "object") return input;
    if (seen.has(input)) return "[CIRCULAR]";
    seen.add(input);
    if (Array.isArray(input)) return input.slice(0, 200).map((item) => visit(item, depth + 1));
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).slice(0, 200).map(([key, item]) => [
        key,
        sensitiveKey.test(key) ? "[REDACTED]" : visit(item, depth + 1)
      ])
    );
  }
}
