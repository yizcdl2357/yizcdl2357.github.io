const ThemeService = (() => {
  const themeRules = [
    {
      theme: "成长",
      keywords: ["grow", "growth", "effort", "challenge", "change", "improve", "progress", "confidence", "坚持", "成长", "努力", "挑战", "改变"]
    },
    {
      theme: "教育",
      keywords: ["school", "student", "teacher", "learn", "learning", "education", "read", "reading", "knowledge", "校园", "学习", "教育", "阅读", "老师"]
    },
    {
      theme: "科技",
      keywords: ["technology", "internet", "digital", "ai", "artificial intelligence", "robot", "online", "科技", "网络", "人工智能", "数字"]
    },
    {
      theme: "环保",
      keywords: ["environment", "protect", "green", "waste", "pollution", "recycle", "nature", "planet", "环保", "环境", "低碳", "污染", "自然"]
    },
    {
      theme: "文化",
      keywords: ["culture", "tradition", "festival", "custom", "history", "heritage", "文化", "传统", "节日", "历史"]
    },
    {
      theme: "社会",
      keywords: ["society", "volunteer", "community", "responsibility", "public", "help", "relationship", "社会", "志愿", "责任", "公共", "帮助"]
    },
    {
      theme: "诚信",
      keywords: ["honest", "honesty", "trust", "promise", "truth", "诚信", "诚实", "信任", "承诺"]
    },
    {
      theme: "健康",
      keywords: ["health", "healthy", "exercise", "sport", "sleep", "body", "健康", "运动", "睡眠", "身体"]
    },
    {
      theme: "希望",
      keywords: ["hope", "optimism", "optimistic", "winter", "spring", "behind", "difficulty", "darkness", "future", "希望", "乐观", "困境", "春天", "未来"]
    }
  ];

  function detectTheme(content) {
    const text = content.trim().toLowerCase();
    if (text.length < 5) return { ok: false, theme: "", message: "内容过短，暂不推荐主题" };

    const scores = themeRules.map((rule) => {
      const score = rule.keywords.reduce((total, keyword) => {
        return text.includes(keyword.toLowerCase()) ? total + 1 : total;
      }, 0);
      return { theme: rule.theme, score };
    });

    const best = scores.sort((a, b) => b.score - a.score)[0];
    if (!best || best.score === 0) {
      return { ok: false, theme: "", message: "暂未识别出明确主题" };
    }

    return { ok: true, theme: best.theme, message: `已推荐主题：${best.theme}` };
  }

  return { detectTheme };
})();
