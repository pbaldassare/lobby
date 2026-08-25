const fs = require("fs");
const path = require("path");
const transcript = String.raw`C:\Users\Utente\.cursor\projects\c-Users-Utente-Desktop-Projects-lobby\agent-transcripts\cb2e1c61-5891-4245-a1e2-792ad53f5678\cb2e1c61-5891-4245-a1e2-792ad53f5678.jsonl`;
const lines = fs.readFileSync(transcript, "utf8").split(/\r?\n/).filter(Boolean);
for (const line of lines) {
  let obj; try { obj = JSON.parse(line); } catch { continue; }
  const content = obj?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const part of content) {
    if (part?.type === "tool_use" && part?.name === "Write") {
      const p = part.input?.path;
      const contents = part.input?.contents;
      if (typeof p === "string" && typeof contents === "string" && /functions\\(issue-seal|compute-matches|send-signal)\\index\.ts$/i.test(p.replace(/\//g,"\\"))) {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, contents, "utf8");
        console.log("restored write", p, contents.length);
      }
    }
  }
}
