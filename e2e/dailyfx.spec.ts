import { readFileSync } from "fs";

import { extract } from "@extractus/article-extractor";
import { test, expect } from "@playwright/test";
import { gotScraping } from "got-scraping";
import TurndownService from "turndown";

test("dailyfx ", async () => {
  const url =
    "https://www.dailyfx.com/forex/technical/home/analysis/xau-usd/2020/06/01/Gold-Forecast-XAUUSD-Price-Rally-Set-to-Resume-MK.html";
  const response = await gotScraping({
    url,
  });

  // Pass HTML to article-extractor
  const article = await extract(response.body);

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article?.content ?? "");

  console.log(article);
  console.log(markdown);
});

test("dailyfx article to markdown", async () => {
  console.log("hi");

  const html = readFileSync(
    "e2e/www_dailyfx_com_forex_technical_articlehtml",
    "utf8"
  );

  const article = await extract(html);

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article?.content ?? "");

  console.log(markdown);
});
