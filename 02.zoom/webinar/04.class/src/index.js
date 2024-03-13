const Request = require("./request");

const request = new Request();

async function scheduler() {
  console.log("staring in...", new Date().toISOString());
  const requests = [
    { url: "https://www.mercadobitcoin.net/api/BTC/ticker" },
    { url: "https://www.mercadobitcoin.net/api/BTC/orderbook" },
  ]
    .map((data) => {
      return {
        ...data,
        timeout: 2000,
        method: "get",
      };
    })
    .map((params) => request.makeRequest(params));

  const results = await Promise.allSettled(requests);
  const succeded = [];
  const failded = [];
  for (const { status, value, reason } of results) {
    if (status === "rejected") {
      failded.push(reason);
      continue;
    }

    succeded.push(value);
  }

  console.log(failded, succeded);
}

const PERIOD = 2000;
setInterval(scheduler, PERIOD);
