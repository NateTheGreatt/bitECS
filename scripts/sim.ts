import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { COLORS } from './constants/colors';

// Parse the command-line arguments
const args = process.argv.slice(2);

// Retrieve the suite name and engine type from parsed arguments
const suiteName = args[0];
const bunArg = args.includes('--bun');

// Function to execute the main.ts file within a directory
const executeMainTs = (directoryPath: string, engine: string = 'bun') => {
	const mainTsPath = join(directoryPath, 'main.ts');

	// Check if main.ts exists in the directory
	if (existsSync(mainTsPath)) {
		console.log(
			`Executing ${COLORS.fg.blue}${suiteName}${COLORS.reset} using ${COLORS.fg.yellow}${engine}${COLORS.reset}`
		);
		// Execute the main.ts file
		execSync(`npx tsx ${mainTsPath}`, { stdio: 'inherit' });
		// if (engine === 'bun') execSync(`bun run ${mainTsPath}`, { stdio: 'inherit' });
	} else {
		console.error(`main.ts not found in ${directoryPath}`);
	}
};

// Function to find and run main.ts files for the specified suite
const runSuites = async (sim: string) => {
	const rootPath = process.cwd();
	const baseDir = join(rootPath, 'benches', 'sims');
	const simDir = join(baseDir, sim);

	// Check if the specified suite directory exists
	if (existsSync(simDir) && readdirSync(baseDir).includes(sim)) {
		executeMainTs(simDir, bunArg ? 'bun' : 'node');
	} else {
		console.error(`Suite not found: ${sim}`);
	}
};

// Check if a suite name was provided
if (!suiteName) {
	console.error('Please provide a suite name as an argument.');
	process.exit(1);
}

// Run the suites
runSuites(suiteName);
