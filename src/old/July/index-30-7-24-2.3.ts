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
  // const isPriceIncrease = await rl.question("Are you increasing price (y/n)\t");

  // if (isPriceIncrease === "y") {
  //   const increasePercentage = await rl.question("Enter percentage of increase (0.1)\t");

  //   Object.keys(existingMenu).map((menuKey, index) => {
  //     if (existingMenu[menuKey].lst) {
  //       existingMenu[menuKey].lst.map((item) => {
  //         const increasedPrice = Number(item.price) * Number(increasePercentage);
  //         item.price = (Number(item.price) + increasedPrice).toFixed(2);
  //       });
  //     }
  //   });

  //   const updatedMenuData = JSON.stringify(existingMenu, null, 2);

  //   fs.writeFile("menu.json", updatedMenuData, (err) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     console.log("Data saved to menu.json");
  //   });

  //   // loop existing menu
  // }

  // const isPriceDecrease = await rl.question("Are you decreasing price (y/n)\t");

  // if (isPriceDecrease === "y") {
  //   const decreasePercentage = await rl.question("Enter percentage of decrease (0.1)\t");

  //   Object.keys(existingMenu).map((menuKey, index) => {
  //     if (existingMenu[menuKey].lst) {
  //       existingMenu[menuKey].lst.map((item) => {
  //         const increasedPrice = Number(item.price) * Number(decreasePercentage);
  //         item.price = (Number(item.price) - increasedPrice).toFixed(2);
  //       });
  //     }
  //   });

  //   const updatedMenuData = JSON.stringify(existingMenu, null, 2);

  //   fs.writeFile("menu.json", updatedMenuData, (err) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     console.log("Data saved to menu.json");
  //   });
  // } else {
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
  const sections = await page.$$("h2[data-qa='heading']");

  let menuData = [];
  let scrapingMenuData = [];
  let modalCount = 0;

  const sectionHeaders = await page.$$("section.c-menuItems-category");

  let index = 0;

  // // ! close cookies
  // try {
  //   await page.click("button[data-test-id='accept-necessary-cookies-button']");
  // } catch (e) {
  //   console.log(e, "could not found cookies");
  // }

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

    const div = document.querySelectorAll("section[data-qa='item-category']");
    // const div = document.querySelectorAll("div[data-test-id='menu-tab']");
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

    // await page.locator("input").fill("value");

    console.log("e : ", e);
    console.log("");
    console.log("");
    console.log("");

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
  // ! Start Scrapping Inner data ----------------------------------
  // const div = document.querySelectorAll("section[data-qa='item-category']");
  // ! Start Scrapping Inner data ----------------------------------
  //identify element with attribute selector
  const getAllElement = await page.$$("div[data-qa='flex']");
  console.log("getAllElement", JSON.stringify(getAllElement.length));
  let elementIndex = 0;
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
      element.click();
      await page.waitForTimeout(200);
      // ! Start fill teh address for first time --------------------------
      if (elementIndex === 1) {
        try {
          const address = "9 Scrogg Road Newcastle upon Tyne, NE6 4AR";
          const getInputElements = await page.$$("input[data-qa='location-panel-search-input-address-element-error']");
          for (const input of getInputElements) {
            await input.click();
          }
          await page.locator("input[data-qa='location-panel-search-input-address-element-error']").fill(address);
          await page.waitForTimeout(2000);
          const getAllClickedArea = await page.$$("div[data-qa='text']");
          for (const addressText of getAllClickedArea) {
            await addressText.click();
          }
        } catch (error) {
          console.error("Error filling input:", error);
        }
      }
      // ! End fill teh address for first time --------------------------
      // ! Start scrapping item data --------------------------------------------------------
      const scrappingItemData = await page.evaluate(async () => {
        const div = document.querySelectorAll("div[data-qa='modal']");
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

        // await page.locator("input").fill("value");

        // console.log(" modal e : ", e);
        console.log("");
        console.log("");
        console.log("");

        let filteredData = e.map((curr) => {
          const item = curr?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.innerText;
          const price =
            curr?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]
              ?.innerText;
          const info =
            curr?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]
              ?.innerText;
          const result = {
            item: item,
            price: price,
            info: info,
            option: [],
          };
          console.log("curr item  : ", curr);
          console.log("curr result : ", result);
          return result;
        });

        return filteredData;
      });
      console.log("");
      console.log("");
      console.log("");
      console.log("");
      console.log("");
      console.log("");
      console.log("scrapping Item data ", scrappingItemData);

      await page.waitForTimeout(5000);
      // ! End scrapping item data --------------------------------------------------------

      await page.waitForTimeout(10);

      const getFieldElements = await page.$$("div[data-qa='modal']");
      for (const filedElement of getFieldElements) {
        //obtain text
        const filedElementText = await (await filedElement.getProperty("textContent")).jsonValue();
        console.log("");
        console.log("");
        console.log("");
        console.log("filedElementText : ", filedElementText);
      }
      console.log("");
      console.log("");
      console.log("");
      console.log("");
      console.log(elementIndex, "t : ", t);
      console.log("");
      console.log("");
      console.log("item : ", isExistOnScrapingMenuData(t).title);
    }

    await page.waitForTimeout(5);
  }
  // ! End Scrapping Inner data ----------------------------------
  await page.waitForTimeout(10);
  // await page.waitForTimeout(100000000);

  // ! copy from old data --------------------------------
  let timeCount = 1000;
  for (const section of sections) {
    const label = await page.evaluate((el) => el.innerText, section);

    //identify element with attribute selector
    const getAllElement = await page.$$("h2[data-js-test='menu-category-heading']");
    let elementIndex = 0;
    for (const element of getAllElement) {
      elementIndex += 1;

      //obtain text
      const t = await (await element.getProperty("textContent")).jsonValue();
      if (t.trim() === label) {
        const arrOfDiv = await page.$$("div[data-js-test='menu-item']");
        for (const div of arrOfDiv) {
          // ! get title value for checking is it scraping before
          const divText = await (await div.getProperty("innerText")).jsonValue();
          modalCount += 1;
          // ! check data for scraping or not
          const isExist = scrapingMenuData.find(
            (curr) => curr.title === t.trim() && curr.innerSection.includes(divText.split("\n")[0])
          );
          if (isExist) {
            // ! open modal
            await div.click();

            timeCount === 1000 && (await page.waitForTimeout(1000));

            // ! Order Later
            try {
              const buttonOrderLater = await page.evaluate(async () => {
                const items = document.querySelectorAll("button[data-test-id='action-button-component']");
                for (let i of items) {
                  await i.click();
                }
                return items;
              });
              buttonOrderLater && (await page.click("button[data-test-id='action-button-component']"));
            } catch (e) {
              console.log(e, "Order Later");
            }
            let PreScrapingData = []; // scraping data before click first option
            let postScrapingData = []; // scraping data after click first option
            try {
              if (timeCount === 1000) {
                await page.waitForTimeout(1000);
              } else {
                await page.waitForTimeout(10);
              }
              const runAsync = async () => {
                const firstData = async () => {
                  const result = await page.evaluate(() => {
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
                    const singleModal: any = document.querySelectorAll("div[role='dialog']");
                    const mainData = getNodeElements(singleModal);

                    // ! start scrapping and destructure data
                    const getNamePrice = (data) => {
                      const optionsChildren = data?.children[0]?.children[0];
                      // find name
                      const name0 = optionsChildren?.children[0]?.children[0]?.children[0]?.innerText;
                      const name1 = optionsChildren?.children[0]?.children[1]?.children[0]?.innerText;
                      const name2 = optionsChildren?.children[0]?.children[1]?.innerText;
                      // find info
                      const info0 = optionsChildren?.children[0]?.children[1]?.innerText;
                      const info1 = optionsChildren?.children[0]?.children[2]?.innerText;
                      // find price
                      const price0 = optionsChildren?.children[0]?.children[0]?.children[1]?.innerText;
                      const price1 = optionsChildren?.children[0]?.children[1]?.children[1]?.innerText;
                      const price2 = optionsChildren?.children[0]?.children[2]?.innerText;

                      const name = name0 || name1 || name2 || "";
                      const price = price0 || price1 || price2 || "";
                      const info = info0 || info1 || "";
                      return { name, price, info };
                    };

                    const getOptions = (options) => {
                      const allOptions = options.children.map((curr) => getNamePrice(curr));
                      return allOptions;
                    };
                    const getOption = (data) => {
                      const statusArr = data?.textContent
                        ?.toLocaleLowerCase()
                        .split(" ")
                        .filter((i) => i !== "")
                        .filter((i) => i !== "\n")
                        .join(" ")
                        .split("\n")
                        .map((i) => i.trim())
                        .filter((i) => i !== "")
                        .filter((i) => ["0", "1", "2", "required"].includes(i));
                      const status1 = statusArr.find((i) => i === "1");
                      const status2 = statusArr.find((i) => i === "2");
                      const statusRequired = statusArr.find((i) => i === "required");
                      const statusOptional = statusArr.find((i) => i === "optional");
                      const isRequired =
                        statusRequired === "required" &&
                        (status1 === "1" || status2 === "2" || statusOptional === undefined);
                      return {
                        name:
                          data?.children[0]?.children[0]?.children[0]?.children[0]?.innerText ??
                          data?.children[0]?.children[0]?.children[0]?.innerText,
                        optionFor:
                          data?.children[0]?.children[0]?.children[0]?.children[1]?.innerText ??
                          data?.children[0]?.children[0]?.children[0]?.innerText,
                        required: isRequired,
                        options: getOptions(data.children[1]),
                      };
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
                      const filterResult = filterData(result);
                      return filterResult;
                    };
                    const filterData = (data) => {
                      const filteredData = data.filter((item, index, self) => {
                        // Check if item is unique
                        return (
                          index ===
                          self.findIndex(
                            (t) =>
                              t.tagName === item.tagName &&
                              t.children?.length === item.children?.length &&
                              t.innerText === item.innerText &&
                              JSON.stringify(t.children) === JSON.stringify(item.children)
                          )
                        );
                      });
                      return filteredData;
                    };

                    const getItem = (data) => {
                      const infoLst = getDataByTagName(data, "p");
                      const newInfoLst = infoLst
                        .map((info) => info.innerText.trim())
                        .filter((i) => i !== "")
                        .filter((i) => i !== "Make sure you pick all your options for this item. You’re almost there")
                        .filter((i) => i !== "There was a problem saving your changes, sorry. Please try again.")
                        .filter((i) => !["0", "1", "2"].includes(i))
                        .filter((i) => i.search("£") < 0);
                      const optionArr = getDataByTagName(data, "fieldset");
                      const filterOptionArr = filterData(optionArr);
                      const option = filterOptionArr.map((curr) => getOption(curr));
                      const item = {
                        item: data[0]?.children[0]?.children[1]?.innerText,
                        price: data[0]?.children[0]?.children[2]?.innerText,
                        info: newInfoLst,
                        option,
                      };
                      return item;
                    };
                    const item = getItem(mainData);
                    return item;
                  });
                  return result;
                };
                const result = await firstData();
                return result;
              };
              PreScrapingData = await runAsync();

              await page.waitForTimeout(10);
            } catch (e) {
              console.log(e, " => Line No: 318");
            }
            // ! click first option
            try {
              await page.click("label[class='c-itemSelector-section-label']");
              await page.waitForTimeout(5);
            } catch (e) {
              console.log(e, "could not found options for select");
            }

            try {
              if (timeCount === 1000) {
                await page.waitForTimeout(1000);
              } else {
                await page.waitForTimeout(10);
              }
              const runAsync = async () => {
                const firstData = async () => {
                  const result = await page.evaluate(() => {
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
                    const singleModal: any = document.querySelectorAll("div[role='dialog']");
                    const mainData = getNodeElements(singleModal);

                    // ! start scrapping and destructure data
                    const getNamePrice = (data) => {
                      const optionsChildren = data?.children[0]?.children[0];
                      // find name
                      const name0 = optionsChildren?.children[0]?.children[0]?.children[0]?.innerText;
                      const name1 = optionsChildren?.children[0]?.children[1]?.children[0]?.innerText;
                      const name2 = optionsChildren?.children[0]?.children[1]?.innerText;
                      // find info
                      const info0 = optionsChildren?.children[0]?.children[1]?.innerText;
                      const info1 = optionsChildren?.children[0]?.children[2]?.innerText;
                      // find price
                      const price0 = optionsChildren?.children[0]?.children[0]?.children[1]?.innerText;
                      const price1 = optionsChildren?.children[0]?.children[1]?.children[1]?.innerText;
                      const price2 = optionsChildren?.children[0]?.children[2]?.innerText;

                      const name = name0 || name1 || name2 || "";
                      const price = price0 || price1 || price2 || "";
                      const info = info0 || info1 || "";
                      return { name, price, info };
                    };

                    const getOptions = (options) => {
                      const allOptions = options.children.map((curr) => getNamePrice(curr));
                      return allOptions;
                    };
                    const getOption = (data) => {
                      const statusArr = data?.textContent
                        ?.toLocaleLowerCase()
                        .split(" ")
                        .filter((i) => i !== "")
                        .filter((i) => i !== "\n")
                        .join(" ")
                        .split("\n")
                        .map((i) => i.trim())
                        .filter((i) => i !== "")
                        .filter((i) => ["0", "1", "2", "required"].includes(i));
                      const status1 = statusArr.find((i) => i === "1");
                      const status2 = statusArr.find((i) => i === "2");
                      const statusRequired = statusArr.find((i) => i === "required");
                      const statusOptional = statusArr.find((i) => i === "optional");
                      const isRequired =
                        statusRequired === "required" &&
                        (status1 === "1" || status2 === "2" || statusOptional === undefined);
                      return {
                        name:
                          data?.children[0]?.children[0]?.children[0]?.children[0]?.innerText ??
                          data?.children[0]?.children[0]?.children[0]?.innerText,
                        optionFor:
                          data?.children[0]?.children[0]?.children[0]?.children[1]?.innerText ??
                          data?.children[0]?.children[0]?.children[0]?.innerText,
                        required: isRequired,
                        options: getOptions(data.children[1]),
                      };
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
                      const filterResult = filterData(result);
                      return filterResult;
                    };
                    const filterData = (data) => {
                      const filteredData = data.filter((item, index, self) => {
                        // Check if item is unique
                        return (
                          index ===
                          self.findIndex(
                            (t) =>
                              t.tagName === item.tagName &&
                              t.children?.length === item.children?.length &&
                              t.innerText === item.innerText &&
                              JSON.stringify(t.children) === JSON.stringify(item.children)
                          )
                        );
                      });
                      return filteredData;
                    };

                    const getItem = (data) => {
                      const infoLst = getDataByTagName(data, "p");
                      const newInfoLst = infoLst
                        .map((info) => info.innerText.trim())
                        .filter((i) => i !== "")
                        .filter((i) => i !== "Make sure you pick all your options for this item. You’re almost there")
                        .filter((i) => i !== "There was a problem saving your changes, sorry. Please try again.")
                        .filter((i) => !["0", "1", "2"].includes(i))
                        .filter((i) => i.search("£") < 0);
                      const optionArr = getDataByTagName(data, "fieldset");
                      const filterOptionArr = filterData(optionArr);
                      const option = filterOptionArr.map((curr) => getOption(curr));
                      const item = {
                        item: data[0]?.children[0]?.children[1]?.innerText,
                        price: data[0]?.children[0]?.children[2]?.innerText,
                        info: newInfoLst,
                        option,
                      };
                      return item;
                    };
                    const item = getItem(mainData);
                    return item;
                  });
                  return result;
                };
                const result = await firstData();
                return result;
              };
              postScrapingData = await runAsync();

              await page.waitForTimeout(10);
            } catch (e) {
              console.log(e, " => Line No: 318");
            }
            let updateData = { ...postScrapingData };
            const isNeedToUpdate = postScrapingData?.option[0]?.required !== PreScrapingData?.option[0]?.required;

            if (isNeedToUpdate) {
              updateData.option = postScrapingData?.option?.map((curr, idx) => {
                if (idx === 0) {
                  const newItem = { ...curr };
                  newItem.required = PreScrapingData?.option[0]?.required;
                  return newItem;
                } else {
                  return curr;
                }
              });
            } else {
              updateData = { ...postScrapingData };
            }
            const newItem = { ...updateData };
            newItem.id = uuidv4();
            newItem.price = updateData?.price?.split("£").join("").split("from ").join("");
            newItem.info = updateData?.info?.join(" ");

            if (!newItem.info) {
              delete newItem.info;
            }

            if (newItem.info) {
              if (newItem.info === "" || newItem.info.length === 0 || newItem.info.length <= 3) {
                delete newItem.info;
              }
            }

            newItem.option = updateData?.option?.map((curr) => {
              const newOption = { ...curr };
              (curr.info === "Not Found" || curr.info === "") && delete newOption.info;

              (curr.price === "Not Found" || curr.price === "" || curr.price === newItem.price) &&
                delete newOption.price;

              newOption.options = curr.options.map((i) => {
                const newI = { ...i };
                delete newI.info;

                if (!newI.price) {
                  delete newI.price;
                }

                if (newI.price) {
                  if (newI.price === "Unavailable" || newI.price === "Not Found") {
                    delete newI.price;
                  } else {
                    const nPrice = newI.price.split("£").join("").split("+").join("");
                    const convertedPrice = Number(nPrice.split(".").join(""));
                    const convertedItemPrice = Number(newItem.price.split(".").join(""));

                    if (convertedItemPrice === convertedPrice) {
                      delete newI.price;
                    } else if (convertedPrice > convertedItemPrice) {
                      newI.price = (Number(convertedPrice - convertedItemPrice) / 100).toFixed(2);
                    } else {
                      newI.price = i.price.split("+£").join("");
                    }
                  }
                }
                return newI;
              });

              return newOption;
            });

            if (newItem.option) {
              if (newItem.option?.length === 0) {
                delete newItem.option;
              }
              // change optionFor text
              else if (newItem.option?.length > 1) {
                newItem.option = newItem.option.map((curr, idx) => {
                  const i = { ...curr };
                  i.optionFor = `from option ${idx + 1}`;
                  return i;
                });
              }
            }

            // ! save this newItem to menu data
            const remainingItems = scrapingMenuData.map((item) => {
              const menu = { ...item };
              if (item.title === t.trim() && item.innerSection.includes(postScrapingData.item)) {
                menu.data.push(newItem);
              }
              return menu;
            });
            scrapingMenuData.length = 0;
            scrapingMenuData.push(...remainingItems);
            timeCount = 10;
            await page.waitForTimeout(10);
            // ! close modal
            try {
              await page.click("button[data-test-id='close-modal']");
            } catch (e) {
              console.log("error found in ", divText.split("\n")[0], { e });
            }
          }

          await page.waitForTimeout(5);
        }
        await page.waitForTimeout(5);
      }
    }

    const formattedText = (text: string) =>
      text?.split(" ").join("_").split("'").join("").split("-").join("_").toLowerCase();

    const formattedLabel = formattedText(label);
    index += 1;

    const getItemsByCategory = (category) => {
      const categoryData = scrapingMenuData.find((obj) => formattedText(obj?.title) === category);
      if (categoryData) {
        const items = categoryData.data;
        return items;
      } else {
        return `No data found for category "${category}"`;
      }
    };

    let singleSection = {
      [`${formattedLabel}`]: {
        srl: index,
        lst: getItemsByCategory(formattedLabel),
      },
    };
    menuData.push(singleSection);
  }
  // ! copy from old data --------------------------------

  const plainObject = Object.assign({}, ...menuData);

  plainObject["n"] = kitchen.split(" ").join("_");
  plainObject["a"] = alias;

  const json = JSON.stringify(plainObject, null, 2);

  fs.writeFile("menu-v2.json", json, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });
  fs.writeFile("scrapingMenuData-v2.json", JSON.stringify(scrapingMenuData), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to scrapingMenuData-v2.json");
  });

  await browser.close();
  // };

  rl.close();
};
run();
