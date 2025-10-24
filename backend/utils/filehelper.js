// utils/fileHelper.js
import fs from "fs/promises";
import path from "path";

export async function appendToJSONFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    let existing = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      existing = JSON.parse(fileContent || "[]");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    existing.push(data);
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");
  } catch (err) {
    console.error("❌ File write error:", err.message);
    throw new Error("File write error: " + err.message);
  }
}
