// For more information, see https://crawlee.dev/
import { launchOptions } from "camoufox-js";
import { PlaywrightCrawler, ProxyConfiguration } from "crawlee";
import { firefox } from "playwright";

import { router } from "./routes.js";

const startUrls = [
  {
    url: "https://www.gradcracker.com/search/computing-technology/web-development-graduate-jobs-in-north-west?order=dateAdded",
    userData: { label: "gradcracker-list-page" },
  },
];

const crawler = new PlaywrightCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  requestHandler: router,
  // Comment this option to scrape the full website.
  maxRequestsPerCrawl: 20,
  // Add delay between requests to slow down the process
  minConcurrency: 1,
  maxConcurrency: 5,
  navigationTimeoutSecs: 60,
  // Add delay between requests (in milliseconds)
//   requestHandlerTimeoutSecs: 50,
  browserPoolOptions: {
    // Disable the default fingerprint spoofing to avoid conflicts with Camoufox.
    useFingerprints: false,
  },
  launchContext: {
    launcher: firefox,
    launchOptions: await launchOptions({
      headless: true,
    //   block_images: true,
      // Pass your own Camoufox parameters here...
      // block_images: true,
      // fonts: ['Times New Roman'],
      // ...
    }),
  },
});

await crawler.run(startUrls);
