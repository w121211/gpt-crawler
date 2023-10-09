import { Dataset, PlaywrightCrawler } from "crawlee";

// Create an instance of the PlaywrightCrawler class - a crawler
// that automatically loads the URLs in headless Chrome / Playwright.
const crawler = new PlaywrightCrawler({
  launchContext: {
    // Here you can set options that are passed to the playwright .launch() function.
    launchOptions: {
      headless: true,
    },
  },

  // Start the crawler right away and ensure there will always be 5 concurrent requests ran at any time
  minConcurrency: 5,
  // Ensure the crawler doesn't exceed 15 concurrent requests ran at any time
  maxConcurrency: 15,

  // Stop crawling after several pages
  // maxRequestsPerCrawl: 10,

  // This function will be called for each URL to crawl.
  // Here you can write the Playwright scripts you are familiar with,
  // with the exception that browsers and pages are automatically managed by Crawlee.
  // The function accepts a single parameter, which is an object with a lot of properties,
  // the most important being:
  // - request: an instance of the Request class with information such as URL and HTTP method
  // - page: Playwright's Page object (see https://playwright.dev/docs/api/class-page)
  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Processing ${request.url}...`);

    // A function to be evaluated by Playwright within the browser context.
    // const data = await page.$$eval(".athing", ($posts) => {
    //   const scrapedData: { title: string; rank: string; href: string }[] = [];
    // We're getting the title, rank and URL of each post on Hacker News.
    //   $posts.forEach(($post) => {
    //     scrapedData.push({
    //       title: $post.querySelector(".title a").innerText,
    //       rank: $post.querySelector(".rank").innerText,
    //       href: $post.querySelector(".title a").href,
    //     });
    //   });
    //   return scrapedData;
    // });

    // Store the results to the default dataset.
    // await Dataset.pushData(data);

    // Store the results to the dataset. In local configuration,
    // the data will be stored as JSON files in ./storage/datasets/default
    await Dataset.pushData({
      url: request.url,
      html: await page.content(),
    });

    // Find a link to the next page and enqueue it if it exists.
    const infos = await enqueueLinks({
      //   selector: ".morelink",
      globs: ["https://www.dailyfx.com/**"],
    });

    if (infos.processedRequests.length === 0)
      log.info(`${request.url} is the last page!`);
  },

  // This function is called if the page processing failed more than maxRequestRetries+1 times.
  failedRequestHandler({ request, log }) {
    log.info(`Request ${request.url} failed too many times.`);
  },
});

await crawler.addRequests(["https://www.dailyfx.com/"]);

// Run the crawler and wait for it to finish.
await crawler.run();

console.log("Crawler finished.");
