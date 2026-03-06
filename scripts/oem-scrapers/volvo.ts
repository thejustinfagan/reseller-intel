import { OEM_BRAND_CONFIGS } from "./brand-configs.ts";
import { runBrandScraper } from "./scraper.ts";
import { parseScraperArgs } from "./utils.ts";

async function main(): Promise<void> {
  const args = parseScraperArgs();
  const summary = await runBrandScraper(OEM_BRAND_CONFIGS.volvo, args);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[oem-scraper:volvo] fatal: ${message}`);
  process.exit(1);
});
