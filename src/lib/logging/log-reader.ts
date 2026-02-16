import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { getLoggingConfig, type LogLevel } from "@/src/lib/logging/config";

export type LogRecord = {
  timestamp: string;
  level: LogLevel | string;
  service?: string;
  environment?: string;
  message: string;
  scope?: string;
  action?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
};

export type ReadLogsOptions = {
  maxRecords?: number;
};

const DEFAULT_MAX_RECORDS = 12000;

function safeJsonParse(line: string): LogRecord | null {
  try {
    const parsed = JSON.parse(line) as LogRecord;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.message !== "string" || typeof parsed.timestamp !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readFileLines(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function resolveLogFiles() {
  const config = getLoggingConfig();
  const basePath = path.isAbsolute(config.transports.file.path)
    ? config.transports.file.path
    : path.join(process.cwd(), config.transports.file.path);

  const filePaths: string[] = [basePath];

  for (let index = 1; index <= config.transports.file.maxFiles; index += 1) {
    filePaths.push(`${basePath}.${index}`);
  }

  return filePaths;
}

export async function readApplicationLogs(options?: ReadLogsOptions) {
  const maxRecords = options?.maxRecords ?? DEFAULT_MAX_RECORDS;
  const files = resolveLogFiles();
  const records: LogRecord[] = [];

  for (const filePath of files) {
    const lines = await readFileLines(filePath);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const parsed = safeJsonParse(line);
      if (!parsed) continue;
      records.push(parsed);
      if (records.length >= maxRecords) {
        return records;
      }
    }
  }

  return records;
}

