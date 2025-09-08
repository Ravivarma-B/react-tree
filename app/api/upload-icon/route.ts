import crypto, { randomUUID } from "crypto";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "user-icons");
const metadataFile = path.join(uploadDir, "icons.json");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

type IconMeta = {
  url: string;
  name: string;
  hash: string;
};

// Load & save metadata
function loadMetadata(): Record<string, IconMeta> {
  if (!fs.existsSync(metadataFile)) return {};
  return JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
}

function saveMetadata(data: Record<string, IconMeta>) {
  fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2), "utf-8");
}

// POST: upload icon
export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // ✅ Compute file hash to check duplicates
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  const ext = path.extname(file.name) || ".svg";
  const meta = loadMetadata();

  // ✅ Check if file already exists by hash
  const existing = Object.entries(meta).find(([, info]) => info.hash === hash);

  if (existing) {
    const [uuid, info] = existing;
    return NextResponse.json({
      key: uuid,
      url: info.url,
      name: info.name,
      duplicate: true,
    });
  }

  // ✅ If not duplicate, save new file
  const uuid = randomUUID();
  const fileName = `${uuid}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  meta[uuid] = {
    url: `/user-icons/${fileName}`,
    name: file.name.replace(ext, ""),
    hash,
  };
  saveMetadata(meta);

  return NextResponse.json({
    key: uuid,
    url: meta[uuid].url,
    name: meta[uuid].name,
    duplicate: false,
  });
}

// GET: list all uploaded icons
export async function GET() {
  const meta = loadMetadata();
  return NextResponse.json(meta);
}

// DELETE: remove icon
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key)
    return NextResponse.json({ error: "Key required" }, { status: 400 });

  const meta = loadMetadata();
  if (!meta[key])
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });

  const filePath = path.join(process.cwd(), "public", meta[key].url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  delete meta[key];
  saveMetadata(meta);

  return NextResponse.json({ success: true });
}

// PATCH: rename icon
export async function PATCH(req: NextRequest) {
  const { oldKey, newName } = await req.json();
  if (!oldKey || !newName) {
    return NextResponse.json(
      { error: "oldKey and newName required" },
      { status: 400 }
    );
  }

  const meta = loadMetadata();
  if (!meta[oldKey])
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });

  meta[oldKey].name = newName;
  saveMetadata(meta);

  return NextResponse.json({
    success: true,
    key: oldKey,
    name: newName,
    url: meta[oldKey].url,
  });
}
