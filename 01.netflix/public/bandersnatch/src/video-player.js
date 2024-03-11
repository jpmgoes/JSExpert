class ManifestJSONSelectType {
  constructor() {
    /**@type {string}*/
    this.url;

    /**@type {number}*/
    this.at;

    /**@type {string[]}*/
    this.options;

    /**@type {string}*/
    this.defaultOption;
  }
}

class ManifestJSONType {
  constructor() {
    /**@type {string}*/
    this.hostTag;

    /**@type {string}*/
    this.localHost;

    /**@type {string}*/
    this.fileResolutionTag;

    /**@type {string}*/
    this.productionHost;

    /**@type {string}*/
    this.codec;

    /**@type {ManifestJSONSelectType}*/
    this.intro;

    /**@type {ManifestJSONSelectType}*/
    this.guitarra;

    /**@type {ManifestJSONSelectType}*/
    this.violao;

    /**@type {{url: string}}*/
    this.encerramento;
  }
}

class VideoMediaPlayer {
  constructor({ manifestJSON, network, videoComponent }) {
    /**@type {HTMLVideoElement}*/
    this.videoElement = null;

    /**@type {VideoComponent}*/
    this.videoComponent = videoComponent;

    this.sourceBuffer = null;

    /**@type {ManifestJSONType}*/
    this.manifestJSON = manifestJSON;

    /**@type {ManifestJSONSelectType}*/
    this.selected = null;
    /**@type {ManifestJSONSelectType}*/
    this.activeItem = {};

    /**@type {string[]}*/
    this.selections = [];

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
      setInterval(this.waitForQuestion.bind(this), 200);
    };
  }

  waitForQuestion() {
    const currentTime = parseInt(this.videoElement.currentTime);
    const option = this.selected.at === currentTime;
    if (!option) return;

    // evitar que o modal apareca quando já tiver sido selecionado
    if (this.activeItem.url === this.selected.url) return;
    this.videoComponent.configureModel(this.selected.options);
    this.activeItem = this.selected;
  }

  /**@param data {string}*/
  async nextChunck(data) {
    const key = data.toLowerCase();
    /**@type {ManifestJSONSelectType}*/
    const selected = this.manifestJSON[key];
    this.selected = {
      ...selected,
      at: parseInt(this.videoElement.currentTime + selected.at),
    };

    this.manageLag(selected);

    // deixar o restante do video rodar, quanto o novo é baixado
    this.videoElement.play();
    await this.fileDownload(selected.url);
  }

  /**@param selected {ManifestJSONSelectType}*/
  manageLag(selected) {
    const selectedWasAlreadySelected = this.selections.includes(selected.url);
    if (selectedWasAlreadySelected) selected.at += 10;
    this.selections.push(selected.url);
  }

  async currentFileResolution() {
    const LOWEST_RESOLUTION = 144;

    const url = this.network.parseManifestURL({
      url: this.manifestJSON.encerramento.url,
      fileResolution: LOWEST_RESOLUTION,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag,
    });

    return this.network.getProperResolution(url);
  }

  async fileDownload(url) {
    const fileResolution = await this.currentFileResolution();
    const finalURL = this.network.parseManifestURL({
      url,
      fileResolution: fileResolution,
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
    this.videoDuration += Number(videoDuration);
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
