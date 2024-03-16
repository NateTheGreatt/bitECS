import { COLORS } from './constants/colors';
import rootPackageJson from '../package.json';
import { readdir } from 'node:fs/promises';

async function buildPackages() {
	try {
		const workspaces = rootPackageJson.workspaces;

		for (const workspace of workspaces) {
			const [basePath] = workspace.split('/*');
			const directories = await readdir(basePath, { withFileTypes: true });

			for (const dirent of directories) {
				if (dirent.isDirectory()) {
					const dirName = dirent.name;
					const packageJsonPath = `${basePath}/${dirName}/package.json`;

					const jsonFile = Bun.file(packageJsonPath);
					const packageJson = await jsonFile.json();

					// Check if the 'build' script exists
					if (packageJson.scripts && packageJson.scripts.build) {
						console.log(
							`${COLORS.fg.green}Building package in ${dirName}...${COLORS.reset}`
						);
						try {
							Bun.spawn(['bun', 'run', 'build'], {
								cwd: `${basePath}/${dirName}`,
							});
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
		console.error(`${COLORS.fg.red}Failed to build packages: ${error}${COLORS.reset}`);
	}
}

buildPackages();
