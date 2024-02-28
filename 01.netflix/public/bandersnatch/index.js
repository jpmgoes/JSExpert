const MANIFEST_URL = "manifest.json";
const localHost = ["127.0.0.1", "localhost"];

async function main() {
  const isLocal = Boolean(localHost.includes(window.location.hostname));
  const manifestJSON = await (await fetch(MANIFEST_URL)).json();
  const host = isLocal ? manifestJSON.localHost : manifestJSON.productionHost;
  const videoComponent = new VideoComponent();
  const network = new Network({ host });
  const videoPlayer = new VideoMediaPlayer({ manifestJSON, network });

  videoPlayer.initializeCodec();
  videoComponent.initializePlayer();
}

window.onload = main;
