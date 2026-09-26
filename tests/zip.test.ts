import { describe, expect, it } from "vitest";
import { crc32, zipFiles } from "@/lib/zip";

/** Read a STORE-only ZIP back through its central directory (what unzip tools do). */
function readZip(buf: Buffer): Array<{ name: string; data: Buffer; crc: number }> {
  const eocd = buf.length - 22;
  expect(buf.readUInt32LE(eocd)).toBe(0x06054b50);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(p)).toBe(0x02014b50);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    expect(buf.readUInt32LE(local)).toBe(0x04034b50);
    const lName = buf.readUInt16LE(local + 26);
    const data = buf.subarray(local + 30 + lName, local + 30 + lName + size);
    out.push({ name, data, crc });
    p += 46 + nameLen;
  }
  return out;
}

describe("zip writer", () => {
  it("writes a valid archive with CRCs, unique names and UTF-8", () => {
    expect(crc32(Buffer.from("hello"))).toBe(0x3610a686);
    const zip = zipFiles([
      { name: "room1-v1.jpg", data: Buffer.from("aaa") },
      { name: "room1-v1.jpg", data: Buffer.from("bbbb") },
      { name: "résumé/notes.md", data: Buffer.from("# hi") },
    ]);
    const files = readZip(zip);
    expect(files.map((f) => f.name)).toEqual(["room1-v1.jpg", "room1-v1-2.jpg", "résumé-notes.md"]);
    expect(files.map((f) => f.data.toString())).toEqual(["aaa", "bbbb", "# hi"]);
    for (const f of files) expect(f.crc).toBe(crc32(f.data));
  });
});
