import "server-only";

import { createWriteStream, existsSync, promises as fs } from "fs";
import path from "path";
import { Writable } from "stream";

type RotatingFileStreamOptions = {
  filePath: string;
  maxSizeBytes: number;
  maxFiles: number;
};

export class RotatingFileStream extends Writable {
  private readonly filePath: string;
  private readonly maxSizeBytes: number;
  private readonly maxFiles: number;
  private initialized = false;
  private currentSize = 0;

  constructor(options: RotatingFileStreamOptions) {
    super();
    this.filePath = options.filePath;
    this.maxSizeBytes = options.maxSizeBytes;
    this.maxFiles = options.maxFiles;
  }

  private async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    if (existsSync(this.filePath)) {
      const stats = await fs.stat(this.filePath);
      this.currentSize = stats.size;
    } else {
      this.currentSize = 0;
    }
    this.initialized = true;
  }

  private async rotateIfNeeded(nextChunkSize: number) {
    if (this.currentSize + nextChunkSize <= this.maxSizeBytes) {
      return;
    }

    const lastRotationPath = `${this.filePath}.${this.maxFiles}`;
    if (existsSync(lastRotationPath)) {
      await fs.unlink(lastRotationPath).catch(() => undefined);
    }

    for (let index = this.maxFiles - 1; index >= 1; index -= 1) {
      const sourcePath = `${this.filePath}.${index}`;
      const targetPath = `${this.filePath}.${index + 1}`;
      if (!existsSync(sourcePath)) {
        continue;
      }
      await fs.rename(sourcePath, targetPath).catch(() => undefined);
    }

    if (existsSync(this.filePath)) {
      await fs.rename(this.filePath, `${this.filePath}.1`).catch(() => undefined);
    }

    this.currentSize = 0;
  }

  _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    const buffer =
      typeof chunk === "string" ? Buffer.from(chunk, encoding || "utf8") : chunk;

    (async () => {
      await this.ensureInitialized();
      await this.rotateIfNeeded(buffer.length);

      await new Promise<void>((resolve, reject) => {
        const stream = createWriteStream(this.filePath, { flags: "a" });
        stream.on("error", reject);
        stream.on("close", () => resolve());
        stream.end(buffer);
      });

      this.currentSize += buffer.length;
    })()
      .then(() => callback())
      .catch((error) =>
        callback(error instanceof Error ? error : new Error("Log stream write failed"))
      );
  }
}
