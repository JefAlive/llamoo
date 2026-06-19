#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./App";

const { waitUntilExit } = render(<App />, {
  alternateScreen: true,
  exitOnCtrlC: true,
});

await waitUntilExit();
process.exit(0);
