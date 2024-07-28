/*
|-----------------------------------------
| setting up App
| @author: Toufiquer Rahman<toufiquer.0@gmail.com>
| @copyright: Toufiquer, July, 2024
|-----------------------------------------
*/

const puppeteer = require("puppeteer");
const fs = require("fs");

const run = async () => {
  // ! Open page
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

  //  @@ -------------------
  //  @@ -------------------
  //  @@ -------------------

  //  ! @@ -------------------
  //  ! @@ -------------------
  // ! ## Start evaluate
  const primeMenuData = await page.evaluate(async () => {
    // ! ## Scroll down to bottom
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
    smoothScrollToBottom();
    // -----------------------------

    // ! ## all nodes
    const divs = document.querySelectorAll("section[data-qa='item-category']");

    console.log("divs : ", divs); // You'll see each individual div element
    // Iterate over the NodeList

    // -----------------------------

    const div = document.querySelectorAll("section[data-qa='item-category']");
    console.log("div : ", div);
    const getNodeElements = (arrOfNodeElement) => {
      let filterElementNodes = [];
      for (const child of arrOfNodeElement) {
        if (child.nodeType !== 8) {
          const logAllData = (a = 1) => {
            if (child.innerText) {
              console.log(`${a} child : `, child);
              console.log(`${a} child innerText : `, child.innerText);
              console.log(`${a} newChild : `, newChild);
              console.log(`${a} filterChild : `, filterChild);
              console.log("");
              console.log("");
            }
          };
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
              [5, 15, 14, 13].forEach((curr) => {
                if (filterElementNodes.length === curr) {
                  console.log("");
                  console.log("");

                  // console.log("filterChild[c] : ", filterChild[c]);
                  console.log("");
                  console.log("");
                  // console.log("child[c] : ", child[c]);
                }
              });
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

          [5, 15, 14, 13].forEach((curr) => {
            if (filterElementNodes.length === curr) {
              logAllData(curr);
            }
          });
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

    let filteredData = e.map((firstItem) =>
      firstItem.children?.map((curr) => {
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
      })
    );

    console.log("");
    console.log("");
    console.log("");
    console.log("e ", e);
    return filteredData;
  });
  //  ! @@ -------------------
  //  ! @@ -------------------

  // ! Save json file
  fs.writeFile("result.json", JSON.stringify("scrapingMenuData"), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });
  //  @@ -------------------
  //  @@ -------------------
  //  @@ -------------------

  await page.waitForTimeout(1000);
  await page.waitForTimeout(10000000);
  // ! Close the browser
  await browser.close();
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("complete");
};
run();
