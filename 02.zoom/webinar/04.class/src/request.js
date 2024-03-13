const https = require("node:https");

class Request {
  errorTimeout(reject, urlRequest) {
    return () => {
      reject(new Error(`timeout at [${urlRequest}]`));
    };
  }

  raceTimeoutDelay(url, timeout) {
    return new Promise((_res, rej) => {
      setTimeout(this.errorTimeout(rej, url), timeout);
    });
  }

  async get(url) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          const buffer = [];
          res
            .on("data", (data) => buffer.push(data))
            .on("end", () => {
              resolve(JSON.parse(buffer.join("")));
            });
        })
        .on("error", reject);
    });
  }

  async makeRequest({ url, method, timeout }) {
    return Promise.race([
      this[method](url),
      this.raceTimeoutDelay(url, timeout),
    ]);
  }
}

module.exports = Request;
