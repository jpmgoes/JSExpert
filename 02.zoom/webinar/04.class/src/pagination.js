const { setTimeout } = require("node:timers/promises");
const Request = require("./request");

const DEFAULT_OPTIONS = {
  maxRetries: 4,
  retryTimeout: 1000,
  maxRequestTimeout: 1000,
  threshold: 200,
};

/**@description controlar o fluxo das requests*/
class Pagination {
  constructor(options = DEFAULT_OPTIONS) {
    this.request = new Request();
    this.maxRetries = options.maxRetries;
    this.retryTimeout = options.retryTimeout;
    this.maxRequestTimeout = options.maxRequestTimeout;
    this.threshold = options.threshold;
  }

  async handleRequest({ url, page, retries = 1 }) {
    try {
      const finalURL = `${url}?tid=${page}`;

      const result = await this.request.makeRequest({
        url: finalURL,
        method: "get",
        timeout: this.maxRequestTimeout,
      });

      return result;
    } catch (e) {
      if (retries === this.maxRetries) {
        console.error(`[${retries}] max retries reached`);
        throw e;
      }

      console.error(`[${retries}] an error: [${e.message}] has happened!`);
      console.log(`Trying again in ${this.retryTimeout}ms`);

      await Pagination.sleep(this.retryTimeout);

      return this.handleRequest({ url, page, retries: (retries += 1) });
    }
  }

  static async sleep(ms) {
    return setTimeout(ms);
  }

  async *getPaginated({ url, page }) {
    const result = await this.handleRequest({ url, page });
    const lastId = result[result.length - 1]?.tid ?? 0;

    if (lastId === 0) return;
    yield result;
    await Pagination.sleep(this.threshold);
    yield* this.getPaginated({ url, page: lastId });
  }
}

module.exports = Pagination;
