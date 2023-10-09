import { PrismaClient } from "@prisma/client";
import { log, LogLevel, PlaywrightCrawler, sleep } from "crawlee";
import Parser from "rss-parser";

log.setLevel(LogLevel.DEBUG);

const prisma = new PrismaClient();

const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: {
      headless: true,
    },
  },

  // Stop crawling after several pages
  // maxRequestsPerCrawl: 10,

  async requestHandler({ request, page, log }) {
    log.info(`Processing ${request.url}...`);

    // Wait for redirecting
    await page.waitForLoadState("networkidle");

    await prisma.scrapingRecord.create({
      data: {
        url: page.url(),
        html: await page.content(),
      },
    });
  },

  failedRequestHandler({ request, log }) {
    log.info(`Request ${request.url} failed too many times.`);
  },
});

async function main() {
  const parser = new Parser();

  // Query ScrapingRecords containing news.google.com URLs
  const records = await prisma.scrapingRecord.findMany({
    where: {
      url: { contains: "news.google.com" },
    },
  });

  // Parse HTML into RSS for each record
  const rssFeeds = await Promise.all(
    records.map(async (record) => {
      // const rss = parseHtmlToRss(record.html);
      const rss = await parser.parseString(record.html);

      rss.items.map((e) => {
        console.log(e.link, e.title);
      });

      // console.log(JSON.stringify(rss));
      // console.log(JSON.stringify(rss.items[0]));
      return rss;
    })
  );

  // Extract entry URLs from each RSS feed
  const startUrls: string[] = [];
  rssFeeds.forEach((rss) => {
    rss.items.forEach((entry) => {
      if (entry.link) {
        startUrls.push(entry.link);
      } else {
        log.warning("Rss entry's link not found. Skip this entry.");
      }
    });
  });

  // Run crawler to scrape entry pages
  // const crawler = new PlaywrightCrawler({
  //   // request handler saves page data to database
  //   async requestHandler({ page }) {
  //     const data = // scrape page
  //       await prisma.scrapingRecord.create({
  //         data: {
  //           url: page.url(),
  //           html: await page.content(),
  //           ...data,
  //         },
  //       });
  //   },
  // });

  // await crawler.addRequests(startUrls);
  await crawler.addRequests([
    "https://www.dailyfx.com/forex/technical/article/special_report/2022/02/21/US-Dollar-Forecast-Thai-Baht-Aims-for-Best-Month-Since-2019.-SGD-IDR-PHP-Idle.html",
  ]);
  await crawler.run();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
