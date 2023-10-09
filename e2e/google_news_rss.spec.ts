import { extract } from "@extractus/article-extractor";
import { test, expect } from "@playwright/test";
import { PlaywrightCrawler } from "crawlee";
import { gotScraping } from "got-scraping";
import Parser from "rss-parser";
import TurndownService from "turndown";

import { generateGoogleNewsRssUrl } from "../src/google_news_rss";

test("fetch and parse google news rss feed", async () => {
  // Google news headlines
  const url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

  const response = await gotScraping({
    url,
  });
  const parser = new Parser();
  const feed = await parser.parseString(response.body);

  console.log(feed);
  expect(feed.items.length).toBeGreaterThan(0);
});

test("fetch a url from google news rss feed", async ({ page }) => {
  const url =
    "https://www.denver7.com/news/local-news/west-nile-virus-found-in-arapahoe-county-mosquitoes-bringing-number-of-affected-colorado-counties-up-to-5";

  // Go to URL and wait until page is loaded
  // await page.goto(url, { waitUntil: "load" });
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Fetch the HTML of the page
  const contentHTML = await page.content();

  // Pass HTML to article-extractor
  const article = await extract(contentHTML);

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article?.content ?? "");

  console.log(article);
  console.log(markdown);
});

// test.describe("generateNewsRssUrl", () => {
//   test("should generate the correct url", () => {
//     const query = "SpaceX OR Boeing";
//     const timeRange = {
//       before: "2020-06-02",
//       after: "2020-06-01",
//     };
//     const expectedUrl =
//       "https://news.google.com/rss/search?q=SpaceX%20OR%20Boeing+before%3A2020-06-02+after%3A2020-06-01&ceid=US:en&hl=en-US&gl=US";
//     expect(generateGoogleNewsRssUrl(query, timeRange)).toEqual(expectedUrl);
//   });

//   test("should generate the correct url when no time range is provided", () => {
//     const query = "SpaceX OR Boeing";
//     const expectedUrl =
//       "https://news.google.com/rss/search?q=SpaceX%20OR%20Boeing&ceid=US:en&hl=en-US&gl=US";
//     expect(generateGoogleNewsRssUrl(query)).toEqual(expectedUrl);
//   });
// });

test("get page's final url and html from google rss url with redirect", async () => {
  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, enqueueLinks, log }) {
      log.info(`Processing ${request.url}...`);
      // console.log(await page.content());
      // console.log(page.url);
      await page.waitForLoadState("networkidle");
      expect(page.url()).toEqual(
        "https://www.dailyfx.com/forex/technical/article/special_report/2022/02/21/US-Dollar-Forecast-Thai-Baht-Aims-for-Best-Month-Since-2019.-SGD-IDR-PHP-Idle.html"
      );
    },
  });

  await crawler.run([
    "https://news.google.com/rss/articles/CBMinAFodHRwczovL3d3dy5kYWlseWZ4LmNvbS9mb3JleC90ZWNobmljYWwvYXJ0aWNsZS9zcGVjaWFsX3JlcG9ydC8yMDIyLzAyLzIxL1VTLURvbGxhci1Gb3JlY2FzdC1UaGFpLUJhaHQtQWltcy1mb3ItQmVzdC1Nb250aC1TaW5jZS0yMDE5Li1TR0QtSURSLVBIUC1JZGxlLmh0bWzSAaABaHR0cHM6Ly93d3cuZGFpbHlmeC5jb20vZm9yZXgvdGVjaG5pY2FsL2FydGljbGUvc3BlY2lhbF9yZXBvcnQvMjAyMi8wMi8yMS9VUy1Eb2xsYXItRm9yZWNhc3QtVGhhaS1CYWh0LUFpbXMtZm9yLUJlc3QtTW9udGgtU2luY2UtMjAxOS4tU0dELUlEUi1QSFAtSWRsZS5odG1sL2FtcA?oc=5",
  ]);
});
