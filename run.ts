const scrapingMenuData = require("./scrapingMenuData.json");

const fs = require("fs");

const result = scrapingMenuData.map((curr) =>
  curr.map((innerCurr) => ({ ...innerCurr, newItem: "the new one", isInclude: innerCurr?.title?.includes("\n") }))
);
fs.writeFile("result.json", JSON.stringify(result), (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Data saved to menu.json");
});
