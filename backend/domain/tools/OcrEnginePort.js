class OcrEnginePort {
  recognizeText() {
    throw new Error("OcrEnginePort.recognizeText must be implemented");
  }
}

module.exports = { OcrEnginePort };
