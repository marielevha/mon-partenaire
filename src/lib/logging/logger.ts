import "server-only";

import { Writable } from "stream";
import { getLoggingConfig, type LogLevel } from "@/src/lib/logging/config";
import { RotatingFileStream } from "@/src/lib/logging/rotating-file-stream";

type LogBindings = Record<string, unknown>;

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  message: string;
  requestId?: string;
  [key: string]: unknown;
};

const LOG_PRIORITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeForLog(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForLog(entry, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      output[key] = normalizeForLog(nestedValue, seen);
    }
    return output;
  }

  return String(value);
}

function applyRedactionAtPath(
  target: unknown,
  pathParts: string[],
  redactedValue = "[REDACTED]"
) {
  if (!target || pathParts.length === 0) {
    return;
  }

  if (Array.isArray(target)) {
    for (const item of target) {
      applyRedactionAtPath(item, pathParts, redactedValue);
    }
    return;
  }

  if (!isRecord(target)) {
    return;
  }

  const [current, ...rest] = pathParts;
  if (!current) return;

  if (current === "*") {
    for (const key of Object.keys(target)) {
      if (rest.length === 0) {
        target[key] = redactedValue;
      } else {
        applyRedactionAtPath(target[key], rest, redactedValue);
      }
    }
    return;
  }

  if (!(current in target)) {
    return;
  }

  if (rest.length === 0) {
    target[current] = redactedValue;
    return;
  }

  applyRedactionAtPath(target[current], rest, redactedValue);
}

function redactObject(target: unknown, paths: string[]) {
  if (!isRecord(target)) {
    return target;
  }

  for (const pathValue of paths) {
    const pathParts = pathValue
      .split(".")
      .map((part) => part.trim())
      .filter(Boolean);
    if (pathParts.length === 0) continue;
    applyRedactionAtPath(target, pathParts);
  }

  return target;
}

class LogSink {
  private readonly config = getLoggingConfig();
  private readonly fileStream: Writable | null;

  constructor() {
    if (this.config.transports.file.enabled) {
      this.fileStream = new RotatingFileStream({
        filePath: this.config.transports.file.path,
        maxSizeBytes: this.config.transports.file.maxSizeMB * 1024 * 1024,
        maxFiles: this.config.transports.file.maxFiles,
      });
    } else {
      this.fileStream = null;
    }
  }

  write(line: string) {
    if (this.config.transports.console.enabled) {
      process.stdout.write(`${line}\n`);
    }
    if (this.fileStream) {
      this.fileStream.write(`${line}\n`);
    }
  }
}

const sink = new LogSink();

class AppLogger {
  private readonly config = getLoggingConfig();
  private readonly bindings: LogBindings;

  constructor(bindings: LogBindings = {}) {
    this.bindings = bindings;
  }

  child(bindings: LogBindings) {
    return new AppLogger({ ...this.bindings, ...bindings });
  }

  private shouldLog(level: LogLevel) {
    if (!this.config.enabled) {
      return false;
    }
    return LOG_PRIORITY[level] >= LOG_PRIORITY[this.config.level];
  }

  private emit(level: LogLevel, message: string, payload?: LogBindings) {
    if (!this.shouldLog(level)) {
      return;
    }

    const baseEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      environment: this.config.environment,
      message,
      ...this.bindings,
      ...(payload ?? {}),
    };

    const normalized = normalizeForLog(baseEntry);
    const redacted = redactObject(normalized, this.config.redactPaths);
    sink.write(JSON.stringify(redacted));
  }

  trace(message: string, payload?: LogBindings) {
    this.emit("trace", message, payload);
  }

  debug(message: string, payload?: LogBindings) {
    this.emit("debug", message, payload);
  }

  info(message: string, payload?: LogBindings) {
    this.emit("info", message, payload);
  }

  warn(message: string, payload?: LogBindings) {
    this.emit("warn", message, payload);
  }

  error(message: string, payload?: LogBindings) {
    this.emit("error", message, payload);
  }

  fatal(message: string, payload?: LogBindings) {
    this.emit("fatal", message, payload);
  }
}

export const logger = new AppLogger();

export function createLogger(bindings?: LogBindings) {
  return logger.child(bindings ?? {});
}
