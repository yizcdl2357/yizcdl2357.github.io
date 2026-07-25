class BrowserOcrAdapter {
  recognizeText() {
    return {
      ok: false,
      text: "",
      message: "OCR is handled in the browser in the current static frontend."
    };
  }
}

module.exports = { BrowserOcrAdapter };
