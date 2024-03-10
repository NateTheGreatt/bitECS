import { readFile, readdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { COLORS } from "./constants/colors";

const execAsync = promisify(exec);

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
              `${COLORS.fg.green}Building package in ${dirName}...${COLORS.reset}`
            );
            try {
              const { stdout, stderr } = await execAsync(
                `cd ${basePath}/${dirName} && bun run build`
              );
              if (stdout) {
                console.log(`${COLORS.fg.blue}${stdout}${COLORS.reset}`);
              }
              //   if (stderr)
              //     console.error(`${colors.fg.red}${stderr}${colors.reset}`);
            } catch (error) {
              console.error(
                `${COLORS.fg.red}Error in ${dirName}: ${error}${COLORS.reset}`
              );
            }
          } else {
            console.log(
              `${COLORS.fg.yellow}Skipping ${dirName}, no build script found.${COLORS.reset}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `${COLORS.fg.red}Failed to build packages: ${error}${COLORS.reset}`
    );
  }
}

buildPackages();
