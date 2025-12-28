#!/usr/bin/env node
const required = 20;
const current = Number(process.versions.node.split(".")[0]);
if (current < required) {
  console.error(`Node ${required}+ required (found ${process.version}).`);
  process.exit(1);
}
console.log(`Node ${process.version} OK (requires ${required}+).`);
