class VideoMediaPlayer {
  constructor({ manifestJSON, network }) {
    /**@type {HTMLVideoElement}*/
    this.videoElement = null;
    this.sourceBuffer = null;
    this.manifestJSON = manifestJSON;
    this.selected = null;

    /**@type {Network}*/
    this.network = network;
    this.videoDuration = 0;
  }

  initializeCodec() {
    this.videoElement = document.getElementById("vid");
    const mediaSourceSupported = Boolean(window.MediaSource);
    if (!mediaSourceSupported) {
      alert("Seu browser ou sistema nao tem suporte a MSE");
      return;
    }

    const codecSupported = window.MediaSource.isTypeSupported(
      this.manifestJSON.codec,
    );
    if (!codecSupported) {
      alert(`Seu browser não suporta o codec: ${this.manifestJSON.codec}`);
      return;
    }

    const mediaSource = new MediaSource();

    // Vai ser um objeto atualizado sob demanda, vai atualizando src pro HTML sob demanda, sem ficar mexendo ou substituindo essa variável toda vez
    this.videoElement.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener(
      "sourceopen",
      this.sourceOpenWrapper(mediaSource),
    );
  }

  /**@param {MediaSource} mediaSource */
  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      this.selected = this.manifestJSON.intro;
      const selected = this.selected;
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
    };
  }

  async fileDownload(url) {
    const finalURL = this.network.parseManifestURL({
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag,
    });
    this.setVideoPlayerDuration(finalURL);
    const data = await this.network.fetchFile(finalURL);
    return this.processBufferSegments(data);
  }

  setVideoPlayerDuration(finalURL) {
    const bars = finalURL.split("/");
    const lastPosition = bars.length - 1;
    const [name, videoDuration] = bars[lastPosition].split("-");
    this.videoDuration += videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer;
    sourceBuffer.appendBuffer(allSegments);
    return new Promise((resolve, reject) => {
      const updateEnd = (_) => {
        sourceBuffer.removeEventListener("updateend", updateEnd);
        sourceBuffer.timestampOffset = this.videoDuration;
        resolve();
      };

      sourceBuffer.addEventListener("updateend", updateEnd);
      sourceBuffer.addEventListener("error", reject);
    });
  }
}
