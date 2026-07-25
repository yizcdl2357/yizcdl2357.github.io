const { DomainError } = require("../shared/DomainError");

class ThemeName {
  constructor(value) {
    this.value = String(value || "").trim();
    if (!this.value) throw new DomainError("请选择作文主题", "THEME_REQUIRED");
    Object.freeze(this);
  }
}

class TagSet {
  constructor(values = []) {
    this.values = Object.freeze([...new Set(values || [])]);
    Object.freeze(this);
  }
}

class ThemeDetectionPolicy {
  constructor(rules) {
    this.rules = rules || [
      ["成长", ["grow", "growth", "effort", "challenge", "change", "progress", "坚持", "成长", "努力"]],
      ["教育", ["school", "student", "teacher", "learn", "education", "read", "学习", "教育", "阅读"]],
      ["科技", ["technology", "internet", "digital", "ai", "artificial intelligence", "科技", "网络", "人工智能"]],
      ["环保", ["environment", "green", "pollution", "recycle", "nature", "环保", "环境", "污染"]],
      ["文化", ["culture", "tradition", "festival", "history", "文化", "传统", "节日"]],
      ["社会", ["society", "volunteer", "community", "responsibility", "社会", "志愿", "责任"]],
      ["希望", ["hope", "winter", "spring", "future", "希望", "春天", "未来"]]
    ];
  }

  detect(content) {
    const text = String(content || "").trim().toLowerCase();
    let best = { theme: "", score: 0 };
    for (const [theme, keywords] of this.rules) {
      const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
      if (score > best.score) best = { theme, score };
    }
    return best.score ? best.theme : "";
  }
}

module.exports = { ThemeName, TagSet, ThemeDetectionPolicy };
