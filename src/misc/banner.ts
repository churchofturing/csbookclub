import { promises as fs } from 'fs';

let fileList: string[] = [];

// Loads all the banner files.
export async function loadFiles(dirPath: string): Promise<number> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  fileList = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  return entries.length;
}

// Selects a random file from the loaded list.
export function getRandomFile(): string {
  if (fileList.length === 0) {
    throw new Error('File list is empty. Ensure loadFiles() is called first.');
  }

  const randomIndex = Math.floor(Math.random() * fileList.length);
  return fileList[randomIndex];
}
