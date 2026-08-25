export type MusicTaxonomyOption = {
  id: string;
  labels: {
    "zh-CN": string;
    en: string;
  };
};

export const musicGenreOptions: readonly MusicTaxonomyOption[] = [
  { id: "ambient", labels: { "zh-CN": "氛围", en: "Ambient" } },
  { id: "acoustic", labels: { "zh-CN": "原声", en: "Acoustic" } },
  { id: "piano", labels: { "zh-CN": "钢琴", en: "Piano" } },
  { id: "orchestral", labels: { "zh-CN": "管弦乐", en: "Orchestral" } },
  { id: "cinematic", labels: { "zh-CN": "电影感", en: "Cinematic" } },
  { id: "classical", labels: { "zh-CN": "古典", en: "Classical" } },
  { id: "neoclassical", labels: { "zh-CN": "新古典", en: "Neoclassical" } },
  { id: "electronic", labels: { "zh-CN": "电子", en: "Electronic" } },
  { id: "light-electronic", labels: { "zh-CN": "轻电子", en: "Light Electronic" } },
  { id: "synthwave", labels: { "zh-CN": "合成器浪潮", en: "Synthwave" } },
  { id: "chillout", labels: { "zh-CN": "驰放", en: "Chillout" } },
  { id: "lofi", labels: { "zh-CN": "低保真", en: "Lo-fi" } },
  { id: "house", labels: { "zh-CN": "浩室", en: "House" } },
  { id: "techno", labels: { "zh-CN": "科技舞曲", en: "Techno" } },
  { id: "trance", labels: { "zh-CN": "迷幻舞曲", en: "Trance" } },
  { id: "drum-and-bass", labels: { "zh-CN": "鼓打贝斯", en: "Drum and Bass" } },
  { id: "dubstep", labels: { "zh-CN": "回响贝斯", en: "Dubstep" } },
  { id: "hiphop", labels: { "zh-CN": "嘻哈", en: "Hip-hop" } },
  { id: "jazz", labels: { "zh-CN": "爵士", en: "Jazz" } },
  { id: "blues", labels: { "zh-CN": "布鲁斯", en: "Blues" } },
  { id: "soul", labels: { "zh-CN": "灵魂乐", en: "Soul" } },
  { id: "funk", labels: { "zh-CN": "放克", en: "Funk" } },
  { id: "rnb", labels: { "zh-CN": "节奏布鲁斯", en: "R&B" } },
  { id: "rock", labels: { "zh-CN": "摇滚", en: "Rock" } },
  { id: "pop", labels: { "zh-CN": "流行", en: "Pop" } },
  { id: "folk", labels: { "zh-CN": "民谣", en: "Folk" } },
  { id: "country", labels: { "zh-CN": "乡村", en: "Country" } },
  { id: "minimal", labels: { "zh-CN": "极简", en: "Minimal" } },
  { id: "experimental", labels: { "zh-CN": "实验", en: "Experimental" } },
  { id: "world", labels: { "zh-CN": "世界音乐", en: "World" } },
  { id: "chinese-traditional", labels: { "zh-CN": "中国传统", en: "Chinese Traditional" } },
  { id: "japanese-traditional", labels: { "zh-CN": "日本传统", en: "Japanese Traditional" } },
  { id: "latin", labels: { "zh-CN": "拉丁", en: "Latin" } },
  { id: "reggae", labels: { "zh-CN": "雷鬼", en: "Reggae" } },
  { id: "corporate", labels: { "zh-CN": "商务企业", en: "Corporate" } },
  { id: "children", labels: { "zh-CN": "儿童", en: "Children" } },
  { id: "meditation", labels: { "zh-CN": "冥想", en: "Meditation" } },
  { id: "nature", labels: { "zh-CN": "自然声音", en: "Nature" } },
  { id: "game", labels: { "zh-CN": "游戏配乐", en: "Game" } },
  { id: "trailer", labels: { "zh-CN": "预告片", en: "Trailer" } },
];

export const musicMoodOptions: readonly MusicTaxonomyOption[] = [
  { id: "calm", labels: { "zh-CN": "平静", en: "Calm" } },
  { id: "focused", labels: { "zh-CN": "专注", en: "Focused" } },
  { id: "relaxing", labels: { "zh-CN": "放松", en: "Relaxing" } },
  { id: "peaceful", labels: { "zh-CN": "安宁", en: "Peaceful" } },
  { id: "warm", labels: { "zh-CN": "温暖", en: "Warm" } },
  { id: "hopeful", labels: { "zh-CN": "希望", en: "Hopeful" } },
  { id: "uplifting", labels: { "zh-CN": "振奋", en: "Uplifting" } },
  { id: "joyful", labels: { "zh-CN": "愉快", en: "Joyful" } },
  { id: "playful", labels: { "zh-CN": "俏皮", en: "Playful" } },
  { id: "romantic", labels: { "zh-CN": "浪漫", en: "Romantic" } },
  { id: "dreamy", labels: { "zh-CN": "梦幻", en: "Dreamy" } },
  { id: "nostalgic", labels: { "zh-CN": "怀旧", en: "Nostalgic" } },
  { id: "melancholic", labels: { "zh-CN": "忧郁", en: "Melancholic" } },
  { id: "sad", labels: { "zh-CN": "悲伤", en: "Sad" } },
  { id: "lonely", labels: { "zh-CN": "孤独", en: "Lonely" } },
  { id: "mysterious", labels: { "zh-CN": "神秘", en: "Mysterious" } },
  { id: "suspenseful", labels: { "zh-CN": "悬疑", en: "Suspenseful" } },
  { id: "dark", labels: { "zh-CN": "暗黑", en: "Dark" } },
  { id: "eerie", labels: { "zh-CN": "诡异", en: "Eerie" } },
  { id: "epic", labels: { "zh-CN": "史诗", en: "Epic" } },
  { id: "heroic", labels: { "zh-CN": "英雄感", en: "Heroic" } },
  { id: "dramatic", labels: { "zh-CN": "戏剧性", en: "Dramatic" } },
  { id: "emotional", labels: { "zh-CN": "感性", en: "Emotional" } },
  { id: "inspiring", labels: { "zh-CN": "鼓舞", en: "Inspiring" } },
  { id: "energetic", labels: { "zh-CN": "活力", en: "Energetic" } },
  { id: "powerful", labels: { "zh-CN": "力量感", en: "Powerful" } },
  { id: "tense", labels: { "zh-CN": "紧张", en: "Tense" } },
  { id: "aggressive", labels: { "zh-CN": "激烈", en: "Aggressive" } },
  { id: "futuristic", labels: { "zh-CN": "未来感", en: "Futuristic" } },
  { id: "elegant", labels: { "zh-CN": "优雅", en: "Elegant" } },
  { id: "intimate", labels: { "zh-CN": "亲密", en: "Intimate" } },
  { id: "whimsical", labels: { "zh-CN": "奇趣", en: "Whimsical" } },
  { id: "meditative", labels: { "zh-CN": "冥想感", en: "Meditative" } },
  { id: "bittersweet", labels: { "zh-CN": "苦乐参半", en: "Bittersweet" } },
];

export const musicUseCaseOptions: readonly MusicTaxonomyOption[] = [
  { id: "cafe", labels: { "zh-CN": "咖啡厅", en: "Cafe" } },
  { id: "chinese-restaurant", labels: { "zh-CN": "中餐厅", en: "Chinese Restaurant" } },
  { id: "western-restaurant", labels: { "zh-CN": "西餐厅", en: "Western Restaurant" } },
  { id: "restaurant", labels: { "zh-CN": "餐厅", en: "Restaurant" } },
  { id: "bar", labels: { "zh-CN": "酒吧", en: "Bar" } },
  { id: "lounge", labels: { "zh-CN": "休息室", en: "Lounge" } },
  { id: "hotel", labels: { "zh-CN": "酒店", en: "Hotel" } },
  { id: "shopping-mall", labels: { "zh-CN": "商场", en: "Shopping Mall" } },
  { id: "retail-store", labels: { "zh-CN": "零售店", en: "Retail Store" } },
  { id: "office", labels: { "zh-CN": "办公室", en: "Office" } },
  { id: "meeting", labels: { "zh-CN": "会议", en: "Meeting" } },
  { id: "campus", labels: { "zh-CN": "校园", en: "Campus" } },
  { id: "classroom", labels: { "zh-CN": "教室", en: "Classroom" } },
  { id: "library", labels: { "zh-CN": "图书馆", en: "Library" } },
  { id: "museum", labels: { "zh-CN": "博物馆", en: "Museum" } },
  { id: "gallery", labels: { "zh-CN": "美术馆", en: "Gallery" } },
  { id: "park", labels: { "zh-CN": "公园", en: "Park" } },
  { id: "garden", labels: { "zh-CN": "花园", en: "Garden" } },
  { id: "forest", labels: { "zh-CN": "森林", en: "Forest" } },
  { id: "beach", labels: { "zh-CN": "海滩", en: "Beach" } },
  { id: "mountain", labels: { "zh-CN": "山野", en: "Mountain" } },
  { id: "city", labels: { "zh-CN": "城市", en: "City" } },
  { id: "street", labels: { "zh-CN": "街道", en: "Street" } },
  { id: "home", labels: { "zh-CN": "居家", en: "Home" } },
  { id: "bedroom", labels: { "zh-CN": "卧室", en: "Bedroom" } },
  { id: "kitchen", labels: { "zh-CN": "厨房", en: "Kitchen" } },
  { id: "spa", labels: { "zh-CN": "水疗空间", en: "Spa" } },
  { id: "yoga", labels: { "zh-CN": "瑜伽", en: "Yoga" } },
  { id: "gym", labels: { "zh-CN": "健身房", en: "Gym" } },
  { id: "wedding", labels: { "zh-CN": "婚礼", en: "Wedding" } },
  { id: "festival", labels: { "zh-CN": "节庆活动", en: "Festival" } },
  { id: "travel", labels: { "zh-CN": "旅行", en: "Travel" } },
  { id: "driving", labels: { "zh-CN": "驾车", en: "Driving" } },
  { id: "podcast", labels: { "zh-CN": "播客", en: "Podcast" } },
  { id: "vlog", labels: { "zh-CN": "生活视频", en: "Vlog" } },
  { id: "short-video", labels: { "zh-CN": "短视频", en: "Short Video" } },
  { id: "livestream", labels: { "zh-CN": "直播", en: "Livestream" } },
  { id: "game-stream", labels: { "zh-CN": "游戏直播", en: "Game Stream" } },
];

function normalizeTaxonomyText(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

export function getMusicTaxonomyLabels(
  ids: readonly string[],
  options: readonly MusicTaxonomyOption[],
  locale: "zh-CN" | "en" = "zh-CN",
) {
  const optionById = new Map(options.map((option) => [option.id, option]));
  return ids
    .map((id) => optionById.get(id)?.labels[locale])
    .filter((label): label is string => Boolean(label));
}

export function findMusicTaxonomyIds(
  values: readonly string[],
  options: readonly MusicTaxonomyOption[],
) {
  const optionByText = new Map<string, string>();
  for (const option of options) {
    optionByText.set(normalizeTaxonomyText(option.id), option.id);
    optionByText.set(normalizeTaxonomyText(option.labels["zh-CN"]), option.id);
    optionByText.set(normalizeTaxonomyText(option.labels.en), option.id);
  }

  return [...new Set(
    values
      .map((value) => optionByText.get(normalizeTaxonomyText(value)))
      .filter((id): id is string => Boolean(id)),
  )];
}

export function parseMusicTaxonomyIds(
  value: unknown,
  options: readonly MusicTaxonomyOption[],
) {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(options.map((option) => option.id));
  return [...new Set(
    value.filter((id): id is string => typeof id === "string" && validIds.has(id)),
  )];
}
