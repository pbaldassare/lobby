const fs = require("fs");
const path = require("path");
const root = String.raw`C:\Users\Utente\Desktop\Projects\lobby`;
const transcript = String.raw`C:\Users\Utente\.cursor\projects\c-Users-Utente-Desktop-Projects-lobby\agent-transcripts\cb2e1c61-5891-4245-a1e2-792ad53f5678\cb2e1c61-5891-4245-a1e2-792ad53f5678.jsonl`;
const lines = fs.readFileSync(transcript, "utf8").split(/\r?\n/).filter(Boolean);
console.log("lines", lines.length);
let writeCount = 0;
const written = [];
for (const line of lines) {
  let obj;
  try { obj = JSON.parse(line); } catch (e) { continue; }
  const content = obj?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const part of content) {
    if (part?.type === "tool_use" && part?.name === "Write") {
      writeCount++;
      const p = part.input?.path;
      const contents = part.input?.contents;
      console.log("WRITE", typeof contents, contents?.length, p);
      if (typeof p === "string" && typeof contents === "string" && p.toLowerCase().includes("supabase")) {
        const abs = path.normalize(p);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, contents, "utf8");
        written.push(abs + " (" + contents.length + ")");
      }
    }
    // also recover deploy_edge_function payloads
    if (part?.type === "tool_use" && part?.name === "CallMcpTool" && part?.input?.toolName === "deploy_edge_function") {
      const name = part.input?.arguments?.name;
      const files = part.input?.arguments?.files;
      if (name && Array.isArray(files)) {
        for (const f of files) {
          const abs = path.join(root, "supabase", "functions", name, f.name || "index.ts");
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, f.content, "utf8");
          written.push(abs + " (" + f.content.length + ") from deploy");
        }
      }
    }
    // recover apply_migration queries as versioned SQL if missing local Write
    if (part?.type === "tool_use" && part?.name === "CallMcpTool" && part?.input?.toolName === "apply_migration") {
      const name = part.input?.arguments?.name;
      const query = part.input?.arguments?.query;
      console.log("MIG", name, typeof query, query?.length);
    }
  }
}
console.log("writeCount", writeCount);
console.log("written:");
written.forEach((w) => console.log(w));
