import { spawn } from "node:child_process";

const env = { ...process.env, NODE_ENV: "development" };

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: "inherit",
    });

    child.on("error", reject);

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Process terminated by ${signal}.`));
      } else {
        resolve(code ?? 1);
      }
    });
  });
}

const buildExitCode = await run(process.execPath, ["./build.mjs"]);

if (buildExitCode !== 0) {
  process.exit(buildExitCode);
}

const startExitCode = await run(process.execPath, [
  "--enable-source-maps",
  "./dist/index.mjs",
]);

process.exit(startExitCode);