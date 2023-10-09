import { readFileSync } from "node:fs";

import { test, expect } from "@playwright/test";
import metascraper from "metascraper";
import metascraperUrl from "metascraper-url";
import metascraperTitle from "metascraper-title";
import metascraperImage from "metascraper-image";
import metascraperDate from "metascraper-date";
import metascraperDescription from "metascraper-description";
import metascraperPublisher from "metascraper-publisher";

test("metascraper", async () => {
  const url =
    "https://www.dailyfx.com/forex/technical/article/special_report/2022/02/21/US-Dollar-Forecast-Thai-Baht-Aims-for-Best-Month-Since-2019.-SGD-IDR-PHP-Idle.html";
  const html = readFileSync(
    "e2e/www_dailyfx_com_forex_technical_article.html",
    "utf8"
  );

  const metadata = await metascraper([
    metascraperDate(),
    metascraperDescription(),
    metascraperImage(),
    metascraperPublisher(),
    metascraperTitle(),
    metascraperUrl(),
  ])({ html, url });

  expect(metadata).toEqual({
    date: "2022-02-21T03:00:00.000Z",
    description:
      "US Dollar volatility in the ASEAN realm is low except for USD/THB. The Thai Baht is aiming for its best month since January 2019 as USD/SGD, USD/IDR and USD/PHP idle.",
    image: "https://a.c-dn.net/b/1PS3JI/headline_100_dollar_bill.JPG",
    publisher: "DailyFX",
    title:
      "US Dollar Forecast: Thai Baht Aims for Best Month Since 2019. SGD, IDR, PHP Idle",
    url: "https://www.dailyfx.com/forex/technical/article/special_report/2022/02/21/US-Dollar-Forecast-Thai-Baht-Aims-for-Best-Month-Since-2019.-SGD-IDR-PHP-Idle.html",
  });
});
