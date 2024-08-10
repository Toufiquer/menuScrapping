/*
|-----------------------------------------
| setting up MenuScrapping v2
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
  let menuData = [];
  let scrapingMenuData = [];

  const isPriceIncrease = await rl.question("Are you increasing price (y/n)\t");

  if (isPriceIncrease === "y") {
    const increasePercentage = await rl.question("Enter percentage of increase (0.1)\t");

    Object.keys(existingMenu).map((menuKey, index) => {
      if (existingMenu[menuKey].lst) {
        existingMenu[menuKey].lst.map((item) => {
          const increasedPrice = Number(item.price) * Number(increasePercentage);
          item.price = (Number(item.price) + increasedPrice).toFixed(2);
        });
      }
    });

    const updatedMenuData = JSON.stringify(existingMenu, null, 2);

    fs.writeFile("menu.json", updatedMenuData, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Data saved to menu.json");
    });

    // loop existing menu
  }

  const isPriceDecrease = await rl.question("Are you decreasing price (y/n)\t");

  if (isPriceDecrease === "y") {
    const decreasePercentage = await rl.question("Enter percentage of decrease (0.1)\t");

    Object.keys(existingMenu).map((menuKey, index) => {
      if (existingMenu[menuKey].lst) {
        existingMenu[menuKey].lst.map((item) => {
          const increasedPrice = Number(item.price) * Number(decreasePercentage);
          item.price = (Number(item.price) - increasedPrice).toFixed(2);
        });
      }
    });

    const updatedMenuData = JSON.stringify(existingMenu, null, 2);

    fs.writeFile("menu.json", updatedMenuData, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Data saved to menu.json");
    });
  } else {
    // const kitchen = await rl.question("Enter kitchen name\t");
    // const alias = await rl.question("Enter kitchen alias\t");
    // const url = await rl.question("Enter url\t");

    const kitchen = "kitchen";
    const alias = "alias";
    const address = "9 Scrogg Road Newcastle upon Tyne, NE6 4AR";
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
    console.log("Please wait... it takes about 5-6 minutes");
    // ! Start Scrapping from the web

    // ! 1. take a snapshot of the web
    const primeMenuData = await page.evaluate(async () => {
      const smoothScrollToBottom = async () => {
        let scrollPosition = 0;
        let documentHeight = document.body.scrollHeight;
        while (documentHeight > scrollPosition) {
          const targetPosition = Math.min(documentHeight, scrollPosition + 1000);

          await new Promise((resolve) => {
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
            setTimeout(resolve, 100);
          });

          scrollPosition = targetPosition;
          documentHeight = document.body.scrollHeight;
        }
      };
      await smoothScrollToBottom();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const div = document.querySelectorAll("section[data-qa='item-category']");
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
              tagName: filterChild?.tagName,
              textContent: filterChild.textContent,
              selfNode: filterChild,
              classList: filterChild.classList,
            };
            filterElementNodes.push({ ...newChild });
          }
        }
        filterElementNodes = filterElementNodes.map((curr) => {
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
        return filterElementNodes
          .filter((curr) => curr.innerText !== "")
          .filter((curr) => curr.innerText !== undefined);
      };
      const getDataByTagName = (data, tagName = "") => {
        let arrData = Array.isArray(data) ? data : [data];
        if (tagName === "") {
          return arrData;
        }
        const result = [];
        arrData.forEach((curr) => {
          if (curr?.tagName.toLowerCase() === tagName.toLowerCase()) {
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
            return (
              index ===
              self.findIndex(
                (t) =>
                  t?.tagName === item?.tagName &&
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
      let filteredData = e.map((curr) => {
        const childrenSection = curr?.children?.[1].children?.[0].children?.[0].children?.map(
          (item) =>
            item.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.innerText
        );
        const result = {
          title: curr?.children?.[0]?.innerText?.includes("\n")
            ? curr?.children?.[0]?.children?.[0]?.innerText
            : curr?.children?.[0]?.innerText,
          innerSection: childrenSection.filter((i) => i !== undefined),
          data: [],
        };
        return result;
      });
      return filteredData;
    });
    scrapingMenuData.push(...primeMenuData);

    // ! After loading the website fill in the location and then scraping the menu from the web
    const getAllElement = await page.$$("div[data-qa='flex']");
    let elementIndex = 0;

    // ! Fill the address
    for (const element of getAllElement) {
      //obtain text
      const t = await (await element.getProperty("textContent")).jsonValue();
      const isExistOnScrapingMenuData = (checkingTitle: string) => {
        return scrapingMenuData.find((mainItem) =>
          mainItem.innerSection.find((item: string) => item.toLocaleLowerCase() === checkingTitle.toLocaleLowerCase())
        );
      };
      if (isExistOnScrapingMenuData(t)) {
        elementIndex += 1;
        // ! Start fill the address for first time --------------------------
        if (elementIndex === 1) {
          await element.click();
          await page.waitForTimeout(200);
          try {
            const getInputElements = await page.$$(
              "input[data-qa='location-panel-search-input-address-element-error']"
            );
            for (const input of getInputElements) {
              await input.click();
            }
            await page.locator("input[data-qa='location-panel-search-input-address-element-error']").fill(address);
            await page.waitForTimeout(2000);

            console.log("\nLocation filled successfully");
            const getAllClickedArea = await page.$$("div[data-qa='text']");
            for (const addressText of getAllClickedArea) {
              await addressText.click();
            }
            await page.waitForTimeout(200);
            console.log("\nLocation clicked successfully");
          } catch (error) {
            console.error("Error filling input:", error);
          }
        }
        await page.waitForTimeout(10);
      }

      await page.waitForTimeout(5);
    }

    // ! Start scrapping details
    elementIndex = 0;
    for (const element of getAllElement) {
      //obtain text
      const t = await (await element.getProperty("textContent")).jsonValue();
      const isExistOnInnerSection = (checkingTitle: string) => {
        return scrapingMenuData.find((mainItem) =>
          mainItem.innerSection.find((item: string) => item.toLowerCase() === checkingTitle.toLowerCase())
        );
      };
      const isExistOnData = (checkingTitle: string) => {
        let result = true;
        scrapingMenuData.forEach((mainItem) => {
          mainItem.data.forEach((item) => {
            if (item.item.toLowerCase() === checkingTitle.toLowerCase()) {
              result = false;
            }
          });
        });
        return result;
      };
      if (isExistOnInnerSection(t) && isExistOnData(t)) {
        elementIndex += 1;
        // ! Open modal
        await element.click();
        await page.waitForTimeout(200);

        const scrappingItemData = await page.evaluate(async () => {
          // ! Start scrapping item data --------------------------------------------------------
          const div = document.querySelectorAll("div[data-qa='modal']");
          const divItemChoices = document.querySelectorAll("div[data-qa='item-choices']");

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
                  tagName: filterChild?.tagName,
                  textContent: filterChild.textContent,
                  // selfNode: filterChild,
                  classList: filterChild.classList,
                };
                filterElementNodes.push({ ...newChild });
              }
            }
            //   clear child nodes by self invoked
            filterElementNodes = filterElementNodes.map((curr) => {
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
            return filterElementNodes
              .filter((curr) => curr.innerText !== "")
              .filter((curr) => curr.innerText !== undefined);
          };

          const getDataByTagName = (data, tagName = "") => {
            let arrData = Array.isArray(data) ? data : [data];
            if (tagName === "") {
              return arrData;
            }
            const result = [];
            arrData.forEach((curr) => {
              if (curr?.tagName.toLowerCase() === tagName.toLowerCase()) {
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
                      t?.tagName === item?.tagName &&
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
          const getInnerText = (obj = { innerText: "", children: [] }, nthChild = 0) => {
            if (obj.innerText?.includes("\n")) {
              if (obj.children?.length > 0) {
                return getInnerText(obj.children[nthChild]);
              } else {
                return obj.innerText;
              }
            }
            return obj.innerText;
          };
          const nodeElementFromDiv = getNodeElements(div);
          let optionElementFromDiv = getNodeElements(divItemChoices);

          const getAllOptions = (curr) => {
            // return options
            return curr?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children?.map((innerCurr) => {
              const name = getInnerText(innerCurr);

              const price =
                innerCurr?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]
                  ?.children[0]?.children[1]?.innerText;
              const result: { name: string; price?: string } = { name };
              if (price) {
                result.price = price.split("+")[1].split("£")[1];
              }
              return result;
            });
          };

          // return option
          optionElementFromDiv = optionElementFromDiv[0]?.children[0]?.children[0]?.children?.map((curr) => {
            let i = {};
            const optionName = getInnerText(curr?.children[0]?.children[0]?.children[0]);
            const optionFor = getInnerText(curr?.children[0]?.children[0]?.children[1]);
            let requiredText = curr.innerText;
            const isRequired = requiredText.toLowerCase().includes("required");
            let options = getAllOptions(curr);
            options = options.filter((curr) => curr.name);
            if (optionName) {
              i.name = optionName;
            }
            if (optionFor) {
              i.optionFor = optionFor;
            }
            if (isRequired) {
              i.required = isRequired;
            }
            if (options.length > 0) {
              i.options = options;
            }
            return i;
          });
          let filteredData = nodeElementFromDiv.map((curr) => {
            const item = getInnerText(curr, 0);
            const info = getInnerText(curr?.children[0]?.children[1]);
            const price = getInnerText(getDataByTagName(curr, "h4")[0])?.split("£")[1];
            let result = {};
            result.item = item;
            if (price) {
              result.price = price;
            }
            if (info && !info.includes("£")) {
              result.info = info;
            }
            if (optionElementFromDiv) {
              result.option = optionElementFromDiv;
            }
            return result;
          });
          return filteredData;
          // return [...new Set(filteredData.map((curr) => curr.item))];
        });
        await page.waitForTimeout(30);

        if (scrappingItemData?.length > 0) {
          scrapingMenuData = scrapingMenuData.map((mainItem) => {
            const i = { ...mainItem };

            const isExistInInnerSection = mainItem.innerSection.find((item) => item.toLowerCase() === t.toLowerCase());
            if (isExistInInnerSection) {
              const isAlreadyExist = mainItem.data.find((item) => {
                return item.item?.toLowerCase() === scrappingItemData[0].item?.toLowerCase();
              });
              if (!isAlreadyExist) {
                i.data.push(...scrappingItemData);
              }
            }
            return i;
          });
        }

        await page.waitForTimeout(10);
        let clickedCount = 0;
        // ! Close modal [if the modal has no image]
        const closeButton = await page.$$("span[data-qa='modal-header-action-close']");
        const closeButtonIcon = await page.$$("span[data-qa='icon-button']");
        if (closeButton.length > 0) {
          for (let closeBtn of closeButton) {
            await closeBtn.click();
            await page.waitForTimeout(100);
          }
          clickedCount += 1;
        } else if (closeButtonIcon.length > 0) {
          // ! Close modal [if the modal has image]
          for (let closeBtn of closeButtonIcon) {
            await page.waitForTimeout(100);

            if (clickedCount === 0) {
              await closeBtn.click();
            }
            clickedCount += 1;
            await page.waitForTimeout(100);
          }
        }
        await page.waitForTimeout(10);
      }

      await page.waitForTimeout(5);
    }
    await page.waitForTimeout(10);
    // ! convert as required
    const transformMenuData = (scrappingMenuData) => {
      const menu = {};
      let srl = 1;

      for (const section of scrappingMenuData) {
        const sectionKey = section.title.toLowerCase().replace(" ", "_");
        menu[sectionKey] = {
          srl,
          lst: [],
        };

        for (const itemData of section.data) {
          const item = {
            item: itemData.item,
            price: itemData.price,
            info: itemData.info || "",
            id: uuidv4(),
            option: [],
          };

          if (itemData.option) {
            for (const optionGroup of itemData.option) {
              const optionGroupData = {
                name: optionGroup.name,
                optionFor: optionGroup.optionFor || optionGroup.name, // Default to name if no 'optionFor'
                required: optionGroup.required || false,
                options: [],
              };

              for (const option of optionGroup.options) {
                optionGroupData.options.push({
                  name: option.name,
                  price: option.price || "",
                });
              }

              item.option.push(optionGroupData);
            }
          }

          menu[sectionKey].lst.push(item);
        }

        srl += 1;
      }

      return menu;
    };

    // ! Save the data to the menu.json
    const plainObject = transformMenuData(scrapingMenuData);

    plainObject["n"] = kitchen.split(" ").join("_");
    plainObject["a"] = alias;

    const json = JSON.stringify(plainObject, null, 2);

    fs.writeFile("menu.json", json, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Data saved to menu.json");
    });
    fs.writeFile("scrapingMenuData-final.json", JSON.stringify(scrapingMenuData), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Data saved to scrapingMenuData-final.json");
    });

    await browser.close();
  }

  rl.close();
};
run();
