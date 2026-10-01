import { readdir } from "node:fs/promises";
import path from "node:path";

const FILENAME_PATTERN = /^jugador-(\d+)\.(png|jpe?g|webp)$/i;

export async function getPlayerPhotos(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "jugadores");

  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const match = file.match(FILENAME_PATTERN);
      return match ? { n: Number(match[1]), file } : null;
    })
    .filter((entry): entry is { n: number; file: string } => entry !== null)
    .sort((a, b) => a.n - b.n)
    .map((entry) => `/jugadores/${entry.file}`);
}
