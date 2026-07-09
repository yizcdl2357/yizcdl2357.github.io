const THEMES = [
  { id: "growth", name: "成长", description: "个人成长、努力、坚持与改变。" },
  { id: "education", name: "教育", description: "学习方法、校园生活、阅读与思考。" },
  { id: "technology", name: "科技", description: "人工智能、网络生活、科技影响。" },
  { id: "environment", name: "环保", description: "低碳生活、生态保护、人与自然。" },
  { id: "culture", name: "文化", description: "传统文化、跨文化交流、节日习俗。" },
  { id: "society", name: "社会", description: "志愿服务、公共责任、人际关系。" }
];

const TAGS = [
  { id: "opening", name: "开头" },
  { id: "ending", name: "结尾" },
  { id: "argument", name: "议论" },
  { id: "example", name: "举例" },
  { id: "advanced", name: "高级表达" },
  { id: "transition", name: "过渡句" }
];

const SAMPLE_PARAGRAPHS = [
  {
    id: "sample-1",
    title: "坚持带来改变",
    content: "Small efforts, when repeated day after day, can lead to remarkable changes. What truly matters is not how fast we move, but whether we keep moving in the right direction.",
    authorId: "system",
    authorName: "系统示例",
    theme: "成长",
    tags: ["opening", "advanced"],
    createdAt: "2026-07-08T08:00:00.000Z",
    updatedAt: "2026-07-08T08:00:00.000Z"
  },
  {
    id: "sample-2",
    title: "科技是一把双刃剑",
    content: "Technology has made information more accessible than ever before. However, it also requires us to think independently, use digital tools wisely, and protect our attention from endless distractions.",
    authorId: "system",
    authorName: "系统示例",
    theme: "科技",
    tags: ["argument", "transition"],
    createdAt: "2026-07-08T08:05:00.000Z",
    updatedAt: "2026-07-08T08:05:00.000Z"
  },
  {
    id: "sample-3",
    title: "环保行动从日常开始",
    content: "Protecting the environment is not only a slogan, but also a habit. By saving water, reducing waste and choosing public transport, each of us can make a visible difference.",
    authorId: "system",
    authorName: "系统示例",
    theme: "环保",
    tags: ["example", "ending"],
    createdAt: "2026-07-08T08:10:00.000Z",
    updatedAt: "2026-07-08T08:10:00.000Z"
  }
];
