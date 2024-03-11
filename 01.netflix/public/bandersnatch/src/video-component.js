class VideoComponent {
  constructor() {
    this.modal = null;
  }

  initializePlayer() {
    const player = videojs("vid");
    const ModalDialog = videojs.getComponent("ModalDialog");
    const modal = new ModalDialog(player, {
      temporary: false,
      closeable: true,
    });

    player.addChild(modal);
    player.on("play", () => modal.close());

    this.modal = modal;
  }

  configureModel(selected) {
    const modal = this.modal;
    modal.on("modalopen", this.getModalTemplate(selected, modal));
    modal.open();
  }

  getModalTemplate(options, modal) {
    return (_) => {
      const [opt1, opt2] = options;
      const htmlTemplate = `
        <div class="overlay" styles="display:flex;width: 100vw">
          <div class="btn btn-dark" onclick="window.nextChunk('${opt1}')">
            ${opt1}
          </div>
          <div class="btn btn-dark" onclick="window.nextChunk('${opt2}')">
            ${opt2}
          </div>
        </div>
      `;

      /**@type {HTMLElement}*/
      const element = modal.contentEl();
      element.innerHTML = htmlTemplate;
    };
  }
}
