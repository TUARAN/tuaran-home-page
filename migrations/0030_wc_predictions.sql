-- 世界杯竞猜（猜胜平负，免费竞猜、猜中得燃币）
-- pick: 'home' 主胜 / 'draw' 平 / 'away' 客胜
-- 结算：比赛结束（FT/AET/PEN…）后由采集流程比对结果，猜中通过 point_ledger 发燃币。
-- 幂等：发币靠 points.award 的 (user_id, reason='wc_predict', ref='wc_predict:<fixture_id>')。
CREATE TABLE IF NOT EXISTS wc_predictions (
  user_id    TEXT    NOT NULL,
  fixture_id INTEGER NOT NULL,
  pick       TEXT    NOT NULL,                 -- home / draw / away
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  settled    INTEGER NOT NULL DEFAULT 0,       -- 0 未结算 / 1 已结算
  correct    INTEGER,                          -- 结算后：1 猜中 / 0 未中
  awarded    INTEGER NOT NULL DEFAULT 0,       -- 实际发放的燃币数
  PRIMARY KEY (user_id, fixture_id)
);

CREATE INDEX IF NOT EXISTS idx_wc_pred_fixture ON wc_predictions (fixture_id);
CREATE INDEX IF NOT EXISTS idx_wc_pred_user ON wc_predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_wc_pred_settle ON wc_predictions (settled);
