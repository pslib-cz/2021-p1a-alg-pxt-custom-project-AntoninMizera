import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const pxtJsonURL = new URL("../pxt.json", import.meta.url);
const srcDir = fileURLToPath(new URL("../src", import.meta.url));
const root = fileURLToPath(new URL("../", import.meta.url));

const extDataJSON = await readFile(pxtJsonURL, {
    encoding: "utf-8"
});

const extData = JSON.parse(extDataJSON);

extData.files = [];
extData.testFiles = [];

async function walk(dir = srcDir) {
    const dirents = await readdir(dir, {
        withFileTypes: true
    });

    for (const dirent of dirents) {
        const childPath = join(dir, dirent.name);
        if (dirent.isDirectory()) {
            await walk(childPath);
        } else if (dirent.isFile()) {
            extData.files.push(relative(root, childPath).replace(/\\/g, "/"));
        }
    }
}

await walk();

await writeFile(pxtJsonURL, JSON.stringify(extData, null, 4));