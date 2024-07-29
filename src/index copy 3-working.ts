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
  // const kitchen = await rl.question("Enter kitchen name\t");
  // const alias = await rl.question("Enter kitchen alias\t");
  // const url = await rl.question("Enter url\t");

  const kitchen = "kitchen";
  const alias = "alias";
  const url = "https://www.just-eat.co.uk/restaurants-spice-fossway-tandoori-walker/menu";

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1790,
    height: 1200,
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });
  await page.goto(`${url}`);
  // const sections = await page.$$("[data-qa='item-category']");
  // console.log("section : ", JSON.stringify(sections));
  let menuData = [];
  let scrapingMenuData = [];
  let modalCount = 0;

  console.log("Please wait... it takes about 5-6 minutes");
  // !  evaluate data for section header and set inside menuData
  const primeMenuData = await page.evaluate(async () => {
    async function smoothScrollToBottom() {
      let scrollPosition = 0;
      let documentHeight = document.body.scrollHeight;

      while (documentHeight > scrollPosition) {
        // Calculate the target position for the next scroll
        const targetPosition = Math.min(documentHeight, scrollPosition + 1000); // Adjust the 100 value for scrolling speed

        // Smoothly scroll to the target position
        await new Promise((resolve) => {
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
          setTimeout(resolve, 100);
        });

        // Update scroll position
        scrollPosition = targetPosition;
        documentHeight = document.body.scrollHeight;
      }
    }

    await smoothScrollToBottom();

    // Wait for a short period to allow content to load after scrolling
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const divs = document.querySelectorAll("section[data-qa='item-category']");
    const result = [];
    for (const curr of divs) {
      const i = { innerTextText: curr.innerText, outerText: curr.outerText };
      result.push(i);
    }

    return result;
  });
  scrapingMenuData.push(primeMenuData);
  await page.waitForTimeout(100);

  console.log("scrapingMenuData : ", JSON.stringify(scrapingMenuData));

  // const sectionHeaders = await page.$$("section.c-menuItems-category");
  // console.log("sectionHeaders : ", sectionHeaders);
  await page.waitForTimeout(100);
  // await page.waitForTimeout(100000000);
  let index = 0;

  await browser.close();

  fs.writeFile("scrapingMenuData.json", JSON.stringify(scrapingMenuData), (err) => {
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
