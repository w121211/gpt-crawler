// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration } from "crawlee";
import { router } from "./routes.js";

// const startUrls = ["https://crawlee.dev"];
const startUrls = [""];

const crawler = new PlaywrightCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  requestHandler: router,

  // headless: false,
});

await crawler.run(startUrls);
