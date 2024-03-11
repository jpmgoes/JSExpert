class Network {
  constructor({ host }) {
    this.host = host;
  }

  parseManifestURL({ url, fileResolution, fileResolutionTag, hostTag }) {
    return url
      .replace(fileResolutionTag, fileResolution)
      .replace(hostTag, this.host);
  }

  async fetchFile(url) {
    const response = await fetch(url);
    return response.arrayBuffer();
  }

  async getProperResolution(url) {
    const startTime = Date.now();
    const response = await fetch(url);
    await response.arrayBuffer();
    const endTime = Date.now();
    const duration = endTime - startTime;

    const resolutionsMapper = [
      { limit: 900, resolution: 720 },
      { limit: 3000, resolution: 360 },
    ];

    const resolutionObj = resolutionsMapper.find((r) => {
      return r.limit >= duration;
    });

    if (!resolutionObj) return 144;
    return resolutionObj.resolution;
  }
}
