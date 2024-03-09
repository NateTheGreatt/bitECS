import { readFile, readdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Define some color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m",
  },
};

async function buildPackages() {
  try {
    const rootPackageJson = JSON.parse(
      await readFile("./package.json", { encoding: "utf8" })
    );
    const workspaces = rootPackageJson.workspaces;

    for (const workspace of workspaces) {
      const [basePath] = workspace.split("/*");
      const directories = await readdir(basePath, { withFileTypes: true });
      for (const dirent of directories) {
        if (dirent.isDirectory()) {
          const dirName = dirent.name;
          const packageJsonPath = `${basePath}/${dirName}/package.json`;
          const packageJson = JSON.parse(
            await readFile(packageJsonPath, { encoding: "utf8" })
          );

          // Check if the 'build' script exists
          if (packageJson.scripts && packageJson.scripts.build) {
            console.log(
              `${colors.fg.green}Building package in ${dirName}...${colors.reset}`
            );
            try {
              const { stdout, stderr } = await execAsync(
                `cd ${basePath}/${dirName} && bun run build`
              );
              if (stdout) {
                console.log(`${colors.fg.blue}${stdout}${colors.reset}`);
              }
              //   if (stderr)
              //     console.error(`${colors.fg.red}${stderr}${colors.reset}`);
            } catch (error) {
              console.error(
                `${colors.fg.red}Error in ${dirName}: ${error}${colors.reset}`
              );
            }
          } else {
            console.log(
              `${colors.fg.yellow}Skipping ${dirName}, no build script found.${colors.reset}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `${colors.fg.red}Failed to build packages: ${error}${colors.reset}`
    );
  }
}

buildPackages();
