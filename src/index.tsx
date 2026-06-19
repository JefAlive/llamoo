#!/usr/bin/env node

import chalk from "chalk";
chalk.level = 3;

import { render } from "ink";
import { App } from "./App";

const { waitUntilExit } = render(<App />, {
  alternateScreen: true,
  exitOnCtrlC: true,
});

await waitUntilExit();
process.exit(0);
