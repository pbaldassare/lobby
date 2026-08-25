const fs = require("fs");
const path = require("path");
const candidates = [
  String.raw`C:\Users\Utente\.cursor\projects\c-Users-Utente-Desktop-Projects-lobby\agent-transcripts\bd2019d0-52f6-40f2-aadd-1644c32dbb9a\bd2019d0-52f6-40f2-aadd-1644c32dbb9a.jsonl`,
  String.raw`C:\Users\Utente\.cursor\projects\c-Users-Utente-Desktop-Projects-lobby\agent-transcripts\0eb4a343-b45a-4604-a6c0-2ef01c3e9d4a\subagents\bd2019d0-52f6-40f2-aadd-1644c32dbb9a.jsonl`,
];
for (const t of candidates) {
  console.log("===", t, "exists=", fs.existsSync(t));
  if (!fs.existsSync(t)) continue;
  const lines = fs.readFileSync(t, "utf8").split(/\r?\n/).filter(Boolean);
  console.log("lines", lines.length);
  const writes = [];
  for (const line of lines) {
    let obj; try { obj = JSON.parse(line); } catch { continue; }
    const content = obj?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === "tool_use" && part?.name === "Write" && part?.input?.path) {
        writes.push({ path: part.input.path, len: part.input.contents?.length || 0 });
      }
    }
  }
  console.log("writes", writes.length);
  writes.forEach((w) => console.log(w.len, w.path));
}
