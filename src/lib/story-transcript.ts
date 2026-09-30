import { readFile } from "node:fs/promises";
import path from "node:path";

// Server-only filesystem code, imported exclusively by the detail route.
// Paths are relative to src/content/stories; HTML is never executed.
export async function readStoryTranscript(transcriptPath?: string) {
  if (!transcriptPath) return null;
  const root = path.resolve(process.cwd(), "src/content/stories");
  const file = path.resolve(root, transcriptPath);
  const relative = path.relative(root, file);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !/\.(md|txt)$/i.test(file)
  ) {
    throw new Error(
      "Story transcripts must be .md or .txt files inside src/content/stories",
    );
  }
  try {
    return (await readFile(file, "utf8")).trim() || null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
