import { execSync } from "child_process";
import { readdirSync, existsSync, promises } from "fs";
import { join } from "path";
import { parseArguments } from "./utils/parseArguments";
import { COLORS } from "./constants/colors";

// Parse the command-line arguments
const args = process.argv.slice(2);
const argsObj = parseArguments(args);

// Retrieve the suite name and engine type from parsed arguments
const suiteName = argsObj._ ? argsObj._[0] : args[0];
const engineArg = argsObj.e;

// Function to execute the main.ts file within a directory
const executeMainTs = (directoryPath: string, engine: string = "bun") => {
  const mainTsPath = join(directoryPath, "main.ts");

  // Check if main.ts exists in the directory
  if (existsSync(mainTsPath)) {
    console.log(
      `Executing ${COLORS.fg.blue}${suiteName}${COLORS.reset} using ${COLORS.fg.yellow}${engine}${COLORS.reset}`
    );
    // Execute the main.ts file
    if (engine === "node")
      execSync(`npx tsx ${mainTsPath}`, { stdio: "inherit" });
    if (engine === "bun")
      execSync(`bun run ${mainTsPath}`, { stdio: "inherit" });
  } else {
    console.error(`main.ts not found in ${directoryPath}`);
  }
};

// Function to find and run main.ts files for the specified suite
const runSuites = async (suite: string) => {
  const rootPackageJson = JSON.parse(
    await promises.readFile("./package.json", { encoding: "utf8" })
  );
  const workspaces = rootPackageJson.workspaces;
  const [basePath] = workspaces[0].split("/*");

  const baseDir = join(basePath, "bench", "suites");
  const suiteDir = join(baseDir, suite);

  // Check if the specified suite directory exists
  if (existsSync(suiteDir) && readdirSync(baseDir).includes(suite)) {
    executeMainTs(suiteDir, engineArg);
  } else {
    console.error(`Suite not found: ${suite}`);
  }
};

// Check if a suite name was provided
if (!suiteName) {
  console.error("Please provide a suite name as an argument.");
  process.exit(1);
}

// Run the suites
runSuites(suiteName);
