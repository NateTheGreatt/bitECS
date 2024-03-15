import { execSync } from "child_process";
import { readdirSync, existsSync, promises } from "fs";
import { join } from "path";
import { COLORS } from "./constants/colors";

// Parse the command-line arguments
const args = process.argv.slice(2);

// Retrieve the suite name and engine type from parsed arguments
const suiteName = args[0];

// Function to execute the main.ts file within a directory
const runDev = (directoryPath: string, engine: string = "bun") => {
  process.chdir(directoryPath);
  execSync(`bun run dev`, { stdio: "inherit" });
};

// Function to find and run main.ts files for the specified suite
const runSuites = async (app: string) => {
  const rootPath = process.cwd();
  const baseDir = join(rootPath, "benches", "apps");
  const appDir = join(baseDir, app);

  // Check if the specified suite directory exists
  if (existsSync(appDir) && readdirSync(baseDir).includes(app)) {
    runDev(appDir);
  } else {
    console.error(`Suite not found: ${app}`);
  }
};

// Check if a suite name was provided
if (!suiteName) {
  console.error("Please provide a suite name as an argument.");
  process.exit(1);
}

// Run the suites
runSuites(suiteName);
