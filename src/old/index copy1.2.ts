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
    // ! ## Scroll down to bottom ** ** ** ** ** **
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
    const oldTime = Math.round(new Date().getTime());
    while (oldTime + 10 * 1000 > new Date().getTime()) {} // Wait for 10 seconds

    //  End  -----------------------------

    // ! ## all nodes ** ** ** ** ** ** ** ** ** ** ** **
    const divs = document.querySelectorAll("#root");
    console.log("divs : ", divs); // You'll see each individual div element

    console.log("");
    console.log("");
    console.log("");
    console.log("");
    const result = [];
    for (const curr of divs) {
      console.log("curr : ", curr);
      console.log("divs[curr] : ", curr.innerText);
      const i = { innerTextText: curr.innerText, outerText: curr.outerText };
      result.push(i);
    }
    console.log("filterList : ", result);
    // Iterate over the NodeList

    // -----------------------------

    //  ! @@ -------------------
    //  ! @@ -------------------

    // ! Save json file
    // fs.writeFile("result.json", JSON.stringify("scrapingMenuData"), (err) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   console.log("Data saved to menu.json");
    // });
    //  @@ -------------------
    //  @@ -------------------
    //  @@ -------------------
  });
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
