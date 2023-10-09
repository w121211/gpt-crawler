import { PrismaClient, Prisma } from "@prisma/client";
import { Dataset, CheerioCrawler, log, LogLevel } from "crawlee";

// --------
// Helpers
// --------

interface GoogleNewsQuery {
  keyword?: string;
  site?: string;
  before?: string;
  after?: string;
  when?: string;
}

export function generateGoogleNewsRssUrl(query: GoogleNewsQuery = {}): string {
  let url = "https://news.google.com/rss/search?q=";

  const q: string[] = [];

  Object.entries(query).forEach(([k, v]) => {
    if (k === "keyword") {
      q.push(v);
    } else {
      q.push(`${k}:${v}`);
    }
  });
  url += encodeURIComponent(q.join(" "));

  // Append rest of the base parameters
  url += "&ceid=US:en&hl=en-US&gl=US";

  return url;
}

function generateUrls(
  keywords: string[],
  sites: string[],
  startDate: Date,
  endDate: Date,
  splitByDaysOf = 7
) {
  const urls: string[] = [];

  for (const keyword of keywords) {
    for (const site of sites) {
      for (
        let day = startDate;
        day <= endDate;
        day.setDate(day.getDate() + splitByDaysOf)
      ) {
        const after = day.toISOString().split("T")[0];
        const before = new Date(
          day.getTime() + 1000 * 60 * 60 * 24 * splitByDaysOf
        )
          .toISOString()
          .split("T")[0];

        const url = generateGoogleNewsRssUrl({ keyword, site, after, before });
        urls.push(url);
      }
    }
  }

  return urls;
}

// --------
// Main
// --------

log.setLevel(LogLevel.DEBUG);

const prisma = new PrismaClient();

const crawler = new CheerioCrawler({
  // The crawler downloads and processes the web pages in parallel, with a concurrency
  // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
  // Here we define some hard limits for the concurrency.
  // minConcurrency: 10,
  // maxConcurrency: 50,

  // On error, retry each page at most once.
  maxRequestRetries: 1,

  // Increase the timeout for processing of each page.
  requestHandlerTimeoutSecs: 30,

  // Limit to 10 requests per one crawl
  maxRequestsPerCrawl: 1,

  async requestHandler({ request, $ }) {
    log.debug(`Processing ${request.url}...`);

    const record = prisma.scrapingRecord.findFirst({
      where: { urlFrom: request.url },
    });

    if (record !== null) {
      log.debug(`Already scraped ${request.url}, skip.`);
    }

    await prisma.scrapingRecord.create({
      data: {
        urlFrom: request.url,
        // urlFinal: request.loadedUrl,
        content: $.html(),
      },
    });
  },

  // This function is called if the page processing failed more than maxRequestRetries + 1 times.
  failedRequestHandler({ request }) {
    log.debug(`Request ${request.url} failed twice.`);
  },
});

async function scrape(startUrl: string) {
  // Check if start URL contains before/after params.
  // If yes, check if already scraped
  if (startUrl.includes("before") || startUrl.includes("after")) {
    const exists = await prisma.scrapingRecord.findFirst({
      where: {
        urlFrom: startUrl,
      },
    });

    if (exists) {
      console.log("URL already scraped, skipping");
      return;
    }
  } else {
    // If no before/after, check scraped in last 24 hours
    const scrapedInLast24Hours = await prisma.scrapingRecord.findFirst({
      where: {
        urlFrom: startUrl,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (scrapedInLast24Hours) {
      throw new Error("URL already scraped in last 24 hours");
    }
  }

  await crawler.run([startUrl]);

  log.debug("Crawler finished.");
}

async function scrapeDaily() {
  const startUrls: string[] = [""];

  for (const url of startUrls) {
    await scrape(url);
  }
}

async function scrapeByQuery() {
  const keywords: string[] = ["usd jpy", "boj", "japan yen"];
  const sites = ["reuters.com", "bloomberg.com"];
  const startDate = new Date(Date.UTC(2022, 0, 1));
  const endDate = new Date(Date.UTC(2022, 1, 1));

  const urls = generateUrls(keywords, sites, startDate, endDate);

  for (const url of urls) {
    await scrape(url);
    break;
  }
}

// scrapeDaily()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });

scrapeByQuery()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

// const keywords: string[] = ["jpy usd", "boj", "yen dollar"];
// const sites = ["reuters.com", "bloomberg.com"];
// const startDate = new Date(Date.UTC(2022, 0, 1));
// const endDate = new Date(Date.UTC(2022, 1, 1));

// // console.log(startDate);

// const urls = generateUrls(keywords, sites, startDate, endDate);
// console.log(urls.join("\n"));
