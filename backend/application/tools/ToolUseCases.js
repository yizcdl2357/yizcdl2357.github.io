class ToolUseCases {
  constructor({ themePolicy, ocrEngine }) {
    this.themePolicy = themePolicy;
    this.ocrEngine = ocrEngine;
  }

  detectTheme({ content }) {
    return this.themePolicy.detect(content);
  }

  recognizeText({ image }) {
    return this.ocrEngine.recognizeText(image);
  }
}

module.exports = { ToolUseCases };
