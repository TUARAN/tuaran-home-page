export const UPSTREAM_REPOSITORY = "chinese-poetry/chinese-poetry";

export const UPSTREAM_SOURCES = [
  { source_key: "tang-poetry", label: "全唐诗", directory: "全唐诗", pattern: /^poet[.]tang[.][0-9]+[.]json$/, dynasty: "唐代", genre: "诗" },
  { source_key: "song-poetry", label: "全宋诗", directory: "全唐诗", pattern: /^poet[.]song[.][0-9]+[.]json$/, dynasty: "宋代", genre: "诗" },
  { source_key: "song-ci", label: "全宋词", directory: "宋词", pattern: /^ci[.]song[.][0-9]+[.]json$/, dynasty: "宋代", genre: "词" },
  { source_key: "yuan-qu", label: "元曲", directory: "元曲", pattern: /^yuanqu[.]json$/, dynasty: "元代", genre: "曲" },
  { source_key: "shijing", label: "诗经", directory: "诗经", pattern: /^shijing[.]json$/, dynasty: "先秦", genre: "诗" },
  { source_key: "chuci", label: "楚辞", directory: "楚辞", pattern: /^chuci[.]json$/, dynasty: "先秦", genre: "诗" },
  { source_key: "cao-cao", label: "曹操诗集", directory: "曹操诗集", pattern: /^caocao[.]json$/, dynasty: "汉代", genre: "诗" },
  { source_key: "nalan", label: "纳兰性德词集", directory: "纳兰性德", pattern: /^纳兰性德诗集[.]json$/, dynasty: "清代", genre: "词" },
  { source_key: "huajianji", label: "花间集", directory: "五代诗词/huajianji", pattern: /^huajianji-.*[.]json$/, dynasty: "五代", genre: "词" },
  { source_key: "nantang-ci", label: "南唐二主词", directory: "五代诗词/nantang", pattern: /^poetrys[.]json$/, dynasty: "五代", genre: "词" },
];
