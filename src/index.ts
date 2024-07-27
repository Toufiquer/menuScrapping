/*
|-----------------------------------------
| setting up App
| @author: Toufiquer Rahman<toufiquer.0@gmail.com>
| @copyright: Toufiquer, July, 2024
|-----------------------------------------
*/

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const existingMenu = require("../menu.json");
const fs = require("fs");

const rl = readline.createInterface({ input, output });

const run = async () => {
  const result = "";
  fs.writeFile("result.json", JSON.stringify(result), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });
};

run();
console.log("");
console.log("");
console.log("");
console.log("");
console.log("");
console.log("");
console.log("work done ");
