INSERT OR IGNORE INTO crawler_sources
  (source_key, label, directory, file_pattern, dynasty, genre)
VALUES
  ('shijing', '诗经', '诗经', '^shijing[.]json$', '先秦', '诗'),
  ('chuci', '楚辞', '楚辞', '^chuci[.]json$', '先秦', '诗'),
  ('cao-cao', '曹操诗集', '曹操诗集', '^caocao[.]json$', '汉代', '诗'),
  ('nalan', '纳兰性德词集', '纳兰性德', '^纳兰性德诗集[.]json$', '清代', '词'),
  ('huajianji', '花间集', '五代诗词/huajianji', '^huajianji-.*[.]json$', '五代', '词'),
  ('nantang-ci', '南唐二主词', '五代诗词/nantang', '^poetrys[.]json$', '五代', '词');
