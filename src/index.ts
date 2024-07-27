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
    const div = document.querySelectorAll("section[data-qa='item-category']");
    console.log("div : ", div);
    const getNodeElements = (arrOfNodeElement) => {
      let filterElementNodes = [];
      for (const child of arrOfNodeElement) {
        if (child.nodeType !== 8) {
          // This filters out comments (nodeType 8)
          const filterChild = {
            childElementCount: "",
            children: "",
            innerText: "",
            tagName: "",
            textContent: "",
          };
          for (const c in child) {
            if (child[c] !== null) {
              filterChild[c] = child[c];
            }
          }
          const newChild = {
            childElementCount: filterChild.childElementCount,
            children: filterChild.children,
            innerText: filterChild.innerText,
            tagName: filterChild.tagName,
            textContent: filterChild.textContent,
            selfNode: filterChild,
            classList: filterChild.classList,
          };
          filterElementNodes.push({ ...newChild });
        }
      }
      //   clear child nodes by self invoked
      if (filterElementNodes.length > 0) {
        filterElementNodes = filterElementNodes?.map((curr) => {
          if (curr.childElementCount > 0) {
            const filterChildren = getNodeElements(curr.children);
            return {
              ...curr,
              children: filterChildren,
            };
          } else {
            return curr;
          }
        });
      }
      return filterElementNodes.filter((curr) => curr.innerText !== "").filter((curr) => curr.innerText !== undefined);
    };

    const getDataByTagName = (data, tagName = "") => {
      let arrData = Array.isArray(data) ? data : [data];
      if (tagName === "") {
        return arrData;
      }
      const result = [];
      arrData.forEach((curr) => {
        if (curr.tagName.toLowerCase() === tagName.toLowerCase()) {
          result.push(curr);
        } else {
          if (curr?.children?.length > 0) {
            const findInnerData = getDataByTagName([...curr.children], tagName);
            result.push(...findInnerData);
          }
        }
      });
      const filterData = (data) => {
        const filteredData = data.filter((item, index, self) => {
          // Check if item is unique
          return (
            index ===
            self.findIndex(
              (t) =>
                t.tagName === item.tagName &&
                t.children?.length === item.children?.length &&
                t.innerText === item.innerText
            )
          );
        });
        return filteredData;
      };

      const filterResult = filterData(result);
      return filterResult;
    };

    const e = getNodeElements(div);

    const filteredData = e[0].children?.map((curr) => {
      const childrenSection = curr.children?.map((i) => {
        if (i.children.length > 0) {
          const lstTitle = i.children?.map((item) => item?.children[0]?.children[0]?.children[0]?.innerText);
          return lstTitle[0];
        }
      });
      const result = {
        title: curr?.children?.[0]?.children?.[0]?.children?.[0]?.innerText,
        innerSection: childrenSection.filter((i) => i !== undefined),
        data: [],
      };
      return result;
    });

    console.log("");
    console.log("");
    console.log("");
    console.log("e ", e);
    return filteredData;
  });
  scrapingMenuData.push(primeMenuData);
  await page.waitForTimeout(10000);

  console.log("scrapingMenuData : ", JSON.stringify(scrapingMenuData));

  // const sectionHeaders = await page.$$("section.c-menuItems-category");
  // console.log("sectionHeaders : ", sectionHeaders);
  await page.waitForTimeout(100000);
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
