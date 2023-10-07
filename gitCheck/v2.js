const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const baseDirs = ["git", "gitCancer"];

async function findGitDirectories(baseDirs) {
    const promises = [];
    const issueRepos = [];
    const okRepos = [];
    const notRepos = [];

    for (const baseDir of baseDirs) {
        const fullBaseDir = path.resolve(baseDir);
        const files = await fs.promises.readdir(fullBaseDir).catch((err) => {
            console.error(`Error reading directory: ${fullBaseDir}`);
            return [];
        });

        for (const file of files) {
            promises.push(
                (async () => {
                    const fullPath = path.join(fullBaseDir, file);

                    if ((await fs.promises.stat(fullPath)).isDirectory()) {
                        console.log(`Checking ${baseDir}/${file}`);
                        const isRepo = await isGitRepository(fullPath);

                        if (isRepo) {
                            const issues = await checkGitRepository(fullPath);

                            if (issues.length === 0) {
                                okRepos.push(fullPath);
                            } else {
                                issueRepos.push({ repoPath: fullPath, issues });
                            }
                        } else {
                            console.log(`Not a Git repository: ${fullPath}`);
                            notRepos.push(fullPath);
                        }
                    }
                })()
            );
        }
    }

    await Promise.allSettled(promises);

    console.log("Non repos:\n" + notRepos.join("\n"));

    console.log("Repositories with issues:");
    issueRepos.forEach(({ repoPath, issues }) => {
        console.log(`Repository: ${repoPath}`);
        issues.forEach((issue) => {
            console.log(`  - ${issue}`);
        });
    });

    console.log("\nOK Repositories:");
    okRepos.forEach((repoPath) => {
        console.log(`Repository: ${repoPath}`);
    });
}

async function isGitRepository(directory) {
    return new Promise((resolve) => {
        exec(
            "git rev-parse --is-inside-work-tree",
            { cwd: directory, shell: false },
            (error, stdout, stderr) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

async function checkGitRepository(repoPath) {
    return new Promise((resolve) => {
        const issues = [];

        // Check if 'origin' remote exists
        exec(
            "git remote show origin",
            { cwd: repoPath, shell: false },
            (error, stdout, stderr) => {
                if (error) {
                    issues.push('Missing "origin" remote');
                }

                // Check for unpushed branches
                exec(
                    'git branch --no-color --format="%(refname:short) %(upstream:short)" --sort=-committerdate',
                    { cwd: repoPath, shell: false },
                    (error, stdout, stderr) => {
                        if (!error) {
                            const branches = stdout.split("\n").filter(Boolean);
                            branches.forEach((branchInfo) => {
                                const [branchName, upstream] =
                                    branchInfo.split(" ");
                                if (upstream === "[]") {
                                    issues.push(
                                        `Unpushed branch: ${branchName}`
                                    );
                                }
                            });
                        }

                        // Check for uncommitted changes
                        exec(
                            "git status --porcelain",
                            { cwd: repoPath, shell: false },
                            (error, stdout, stderr) => {
                                if (!error && stdout.trim() !== "") {
                                    issues.push("Uncommitted changes");
                                }

                                resolve(issues);
                            }
                        );
                    }
                );
            }
        );
    });
}

findGitDirectories(baseDirs);
