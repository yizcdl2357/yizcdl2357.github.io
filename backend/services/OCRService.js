class OCRService {
  constructor(ocrEngine) {
    this.ocrEngine = ocrEngine;
  }

  recognizeText() {
    if (this.ocrEngine) return this.ocrEngine.recognizeText(...arguments);
    return {
      ok: false,
      text: "",
      message: "OCR is handled in the browser in the current static frontend."
    };
  }
}

module.exports = { OCRService };
