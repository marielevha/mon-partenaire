import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
};

const rateLimitWindowMs = 30_000;
const lastRequestByIp = new Map<string, number>();

const dataDirectory = path.join(process.cwd(), ".data");
const dataFilePath = path.join(dataDirectory, "contact-messages.json");

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isValidPayload(payload: unknown): payload is ContactPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const data = payload as ContactPayload;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const name = data.name?.trim();
  const email = data.email?.trim();
  const subject = data.subject?.trim();
  const message = data.message?.trim();

  if (!name || name.length < 2 || name.length > 80) {
    return false;
  }

  if (!email || email.length > 254 || !emailRegex.test(email)) {
    return false;
  }

  if (!subject || subject.length < 2 || subject.length > 120) {
    return false;
  }

  if (!message || message.length < 10 || message.length > 2000) {
    return false;
  }

  if (data.consent !== true) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const now = Date.now();
  const lastRequest = lastRequestByIp.get(clientIp);

  if (lastRequest && now - lastRequest < rateLimitWindowMs) {
    return NextResponse.json({ ok: false, error: "RATE_LIMIT" }, { status: 429 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  lastRequestByIp.set(clientIp, now);

  const message = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  };

  try {
    await fs.mkdir(dataDirectory, { recursive: true });

    let existingMessages: Array<typeof message> = [];
    try {
      const fileContents = await fs.readFile(dataFilePath, "utf-8");
      const parsed = JSON.parse(fileContents);
      existingMessages = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    existingMessages.push(message);
    await fs.writeFile(
      dataFilePath,
      JSON.stringify(existingMessages, null, 2),
      "utf-8"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
