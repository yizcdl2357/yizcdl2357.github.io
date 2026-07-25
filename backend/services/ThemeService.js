class ThemeService {
  constructor(themePolicy) {
    this.themePolicy = themePolicy;
  }

  detectTheme(content) {
    if (this.themePolicy) return this.themePolicy.detect(content);
    const text = content.trim().toLowerCase();
    const rules = [
      ["成长", ["grow", "growth", "effort", "challenge", "change", "progress", "坚持", "成长", "努力"]],
      ["教育", ["school", "student", "teacher", "learn", "education", "read", "学习", "教育", "阅读"]],
      ["科技", ["technology", "internet", "digital", "ai", "artificial intelligence", "科技", "网络", "人工智能"]],
      ["环保", ["environment", "green", "pollution", "recycle", "nature", "环保", "环境", "污染"]],
      ["文化", ["culture", "tradition", "festival", "history", "文化", "传统", "节日"]],
      ["社会", ["society", "volunteer", "community", "responsibility", "社会", "志愿", "责任"]],
      ["希望", ["hope", "winter", "spring", "future", "希望", "春天", "未来"]]
    ];

    let best = { theme: "", score: 0 };
    for (const [theme, keywords] of rules) {
      const score = keywords.reduce((total, keyword) => text.includes(keyword.toLowerCase()) ? total + 1 : total, 0);
      if (score > best.score) best = { theme, score };
    }

    return best.score > 0 ? best.theme : "";
  }
}

module.exports = { ThemeService };
