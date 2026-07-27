import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const serverDirectory = resolve(root, "dist", "server");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }

      // Vinext copies public assets into both the static client output and the
      // Worker directory. Sites serves these files from dist/client, so keeping
      // the duplicate media in dist/server only bloats the Worker upload.
      for (const asset of [
        "reevu-intro.mp4",
        "reevu-intro-mobile.mp4",
        "og.png",
        "reevu-logo.png",
        "reevu-logo-fixed.png",
      ]) {
        await rm(resolve(serverDirectory, asset), { force: true });
      }
    },
  };
}
