import "server-only";

import { existsSync, readFileSync } from "fs";
import path from "path";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type LoggingConfig = {
  enabled: boolean;
  level: LogLevel;
  serviceName: string;
  environment: string;
  requestIdHeader: string;
  redactPaths: string[];
  transports: {
    console: {
      enabled: boolean;
    };
    file: {
      enabled: boolean;
      path: string;
      maxSizeMB: number;
      maxFiles: number;
    };
  };
};

type UnknownRecord = Record<string, unknown>;

const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: true,
  level: "info",
  serviceName: "mon-partenaire",
  environment: process.env.NODE_ENV || "development",
  requestIdHeader: "x-request-id",
  redactPaths: [
    "headers.authorization",
    "headers.cookie",
    "user.email",
    "payload.password",
    "payload.currentPassword",
    "payload.newPassword",
    "payload.confirmPassword",
  ],
  transports: {
    console: {
      enabled: true,
    },
    file: {
      enabled: false,
      path: "./logs/app.log",
      maxSizeMB: 20,
      maxFiles: 10,
    },
  },
};

let cachedConfig: LoggingConfig | null = null;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeLogLevel(value: unknown, fallback: LogLevel): LogLevel {
  if (typeof value !== "string") {
    return fallback;
  }
  const level = value.trim().toLowerCase();
  if (
    level === "trace" ||
    level === "debug" ||
    level === "info" ||
    level === "warn" ||
    level === "error" ||
    level === "fatal"
  ) {
    return level;
  }
  return fallback;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const content = trimmed.slice(1, -1).trim();
    if (!content) return [];
    return content.split(",").map((item) => parseScalar(item));
  }

  return trimmed;
}

type YamlLine = {
  indent: number;
  content: string;
};

function preprocessYaml(raw: string): YamlLine[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const output: YamlLine[] = [];

  for (const line of lines) {
    const withoutComment = line.replace(/\s+#.*$/, "");
    if (!withoutComment.trim()) continue;
    const indent = withoutComment.match(/^ */)?.[0]?.length ?? 0;
    output.push({
      indent,
      content: withoutComment.trim(),
    });
  }

  return output;
}

function splitYamlKeyValue(content: string): { key: string; value: string | null } {
  const separatorIndex = content.indexOf(":");
  if (separatorIndex < 0) {
    return { key: content.trim(), value: null };
  }

  const key = content.slice(0, separatorIndex).trim();
  const rawValue = content.slice(separatorIndex + 1);
  const value = rawValue.trim();
  return { key, value: value.length > 0 ? value : null };
}

function parseYamlBlock(lines: YamlLine[], startIndex: number, indent: number): [unknown, number] {
  let index = startIndex;
  let collection: unknown = null;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) break;

    if (line.content.startsWith("- ")) {
      if (collection === null) collection = [];
      if (!Array.isArray(collection)) {
        throw new Error(`Invalid YAML structure around line ${index + 1}.`);
      }

      const itemContent = line.content.slice(2).trim();
      if (!itemContent) {
        const [nested, nextIndex] = parseYamlBlock(lines, index + 1, indent + 2);
        collection.push(nested);
        index = nextIndex;
        continue;
      }

      const keyValue = splitYamlKeyValue(itemContent);
      if (keyValue.value !== null && keyValue.key && itemContent.includes(":")) {
        collection.push({ [keyValue.key]: parseScalar(keyValue.value) });
      } else {
        collection.push(parseScalar(itemContent));
      }

      index += 1;
      continue;
    }

    if (collection === null) collection = {};
    if (!isRecord(collection)) {
      throw new Error(`Invalid YAML structure around line ${index + 1}.`);
    }

    const { key, value } = splitYamlKeyValue(line.content);
    if (!key) {
      index += 1;
      continue;
    }

    if (value === null) {
      const [nested, nextIndex] = parseYamlBlock(lines, index + 1, indent + 2);
      collection[key] = nested;
      index = nextIndex;
      continue;
    }

    collection[key] = parseScalar(value);
    index += 1;
  }

  if (collection === null) {
    return [{}, index];
  }
  return [collection, index];
}

function parseSimpleYaml(raw: string): unknown {
  const lines = preprocessYaml(raw);
  if (lines.length === 0) return {};
  const [result] = parseYamlBlock(lines, 0, lines[0].indent);
  return result;
}

function readConfigFile(filePath: string): unknown {
  if (!existsSync(filePath)) {
    return {};
  }

  const raw = readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(raw);
  }

  if (ext === ".yaml" || ext === ".yml") {
    return parseSimpleYaml(raw);
  }

  throw new Error(`Unsupported logging config extension: ${ext}`);
}

function getStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const result = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return result.length > 0 ? result : fallback;
}

function normalizeConfig(rawInput: unknown): LoggingConfig {
  const input = isRecord(rawInput)
    ? isRecord(rawInput.logging)
      ? rawInput.logging
      : rawInput
    : {};

  const transports = isRecord(input.transports) ? input.transports : {};
  const consoleTransport = isRecord(transports.console) ? transports.console : {};
  const fileTransport = isRecord(transports.file) ? transports.file : {};

  const envRedactPaths =
    typeof process.env.LOG_REDACT_PATHS === "string"
      ? process.env.LOG_REDACT_PATHS.split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : null;

  return {
    enabled: normalizeBoolean(
      process.env.LOG_ENABLED ?? input.enabled,
      DEFAULT_LOGGING_CONFIG.enabled
    ),
    level: normalizeLogLevel(
      process.env.LOG_LEVEL ?? input.level,
      DEFAULT_LOGGING_CONFIG.level
    ),
    serviceName:
      (typeof process.env.LOG_SERVICE_NAME === "string" &&
      process.env.LOG_SERVICE_NAME.trim()
        ? process.env.LOG_SERVICE_NAME.trim()
        : typeof input.serviceName === "string" && input.serviceName.trim()
          ? input.serviceName.trim()
          : DEFAULT_LOGGING_CONFIG.serviceName),
    environment:
      (typeof process.env.LOG_ENVIRONMENT === "string" &&
      process.env.LOG_ENVIRONMENT.trim()
        ? process.env.LOG_ENVIRONMENT.trim()
        : typeof input.environment === "string" && input.environment.trim()
          ? input.environment.trim()
          : DEFAULT_LOGGING_CONFIG.environment),
    requestIdHeader:
      (typeof process.env.LOG_REQUEST_ID_HEADER === "string" &&
      process.env.LOG_REQUEST_ID_HEADER.trim()
        ? process.env.LOG_REQUEST_ID_HEADER.trim().toLowerCase()
        : typeof input.requestIdHeader === "string" && input.requestIdHeader.trim()
          ? input.requestIdHeader.trim().toLowerCase()
          : DEFAULT_LOGGING_CONFIG.requestIdHeader),
    redactPaths:
      envRedactPaths && envRedactPaths.length > 0
        ? envRedactPaths
        : getStringArray(input.redactPaths, DEFAULT_LOGGING_CONFIG.redactPaths),
    transports: {
      console: {
        enabled: normalizeBoolean(
          process.env.LOG_CONSOLE_ENABLED ?? consoleTransport.enabled,
          DEFAULT_LOGGING_CONFIG.transports.console.enabled
        ),
      },
      file: {
        enabled: normalizeBoolean(
          process.env.LOG_FILE_ENABLED ?? fileTransport.enabled,
          DEFAULT_LOGGING_CONFIG.transports.file.enabled
        ),
        path:
          (typeof process.env.LOG_FILE_PATH === "string" &&
          process.env.LOG_FILE_PATH.trim()
            ? process.env.LOG_FILE_PATH.trim()
            : typeof fileTransport.path === "string" && fileTransport.path.trim()
              ? fileTransport.path.trim()
              : DEFAULT_LOGGING_CONFIG.transports.file.path),
        maxSizeMB: normalizePositiveInteger(
          process.env.LOG_FILE_MAX_SIZE_MB ?? fileTransport.maxSizeMB,
          DEFAULT_LOGGING_CONFIG.transports.file.maxSizeMB
        ),
        maxFiles: normalizePositiveInteger(
          process.env.LOG_FILE_MAX_FILES ?? fileTransport.maxFiles,
          DEFAULT_LOGGING_CONFIG.transports.file.maxFiles
        ),
      },
    },
  };
}

export function getLoggingConfig(): LoggingConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath =
    process.env.LOG_CONFIG_PATH?.trim() || path.join(process.cwd(), "config", "logging.yaml");

  try {
    const parsed = readConfigFile(configPath);
    cachedConfig = normalizeConfig(parsed);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    console.error(
      `[logging] Failed to load logging config at ${configPath}. Falling back to defaults. Reason: ${reason}`
    );
    cachedConfig = normalizeConfig({});
  }

  return cachedConfig;
}
