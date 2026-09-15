'use strict';

/**
 * bridge.cjs — 消息路由核心
 *
 * 手机5G上行(text_message) → 归一化 → [串行队列] → ACP prompt(真实WorkBuddy)
 *   → 活动订阅(进度回执) / 文本增量收集 / end_turn
 *   → 回复组装 → maap.sendReply（WS send 帧）→ 回 5G
 */

const fs = require('fs');
const path = require('path');

const TASK_TIMEOUT_MS = 120000;
const MAX_QUEUE_DEFAULT = 500;
const IDLE_RECONNECT_MS_DEFAULT = 60000;
const PROGRESS_MAP_MAX = 200;    // progressMap 上限（长期运行多用户场景，200 足够展示最后 N 个会话的进度）
const INBOX_KEEP_LINES = 500;    // 收件箱只保留最近 N 条，防止无限增长
const INBOX_TRIM_EVERY = 50;     // 每追加 N 条检查一次是否需要裁剪

class Bridge {
  /**
   * @param {object} deps { maap, acp, logger, options }
   */
  constructor(deps) {
    this.maap = deps.maap;
    this.acp = deps.acp;
    this.makeAcp = deps.makeAcp || null;
    // 共享会话工厂（5G 消息复用「当前 UI 对话」上下文）：每次取用都重新校验绑定会话，切换对话自动改绑
    this.makeSharedAcp = deps.makeSharedAcp || null;
    this._sharedClient = null;
    this.clients = new Map();
    this.seen = new Map();
    this.log = deps.logger || console;
    this.opts = deps.options || {};
    this.queue = [];
    this.active = null;
    this.progressMap = new Map();       // replyTarget -> { text, ts }
    this.processed = 0;
    this.failed = 0;
    this.maxQueue = (typeof this.opts.maxQueue === 'number' && this.opts.maxQueue > 0)
      ? this.opts.maxQueue
      : (parseInt(process.env.BRIDGE_MAX_QUEUE || String(MAX_QUEUE_DEFAULT), 10) || MAX_QUEUE_DEFAULT);
    this.idleReconnectMs = (typeof this.opts.idleReconnectMs === 'number' && this.opts.idleReconnectMs > 0)
      ? this.opts.idleReconnectMs
      : IDLE_RECONNECT_MS_DEFAULT;
    this.progressMax = PROGRESS_MAP_MAX;
    this._idleReconnectTimer = null;
    // 收件箱：把每条 5G 入站消息（含原文与 AI 回复）追加成 JSONL，
    // 供 UI 侧 agent 播报（ACP 注入不会进 UI 对话流，这是唯一让用户"看得到"的通道）
    this.inboxPath = deps.inboxPath || process.env.BRIDGE_INBOX
      || path.join(__dirname, '..', 'var', 'inbox', 'inbox.jsonl');
    this._inboxAppends = 0;
  }

  /**
   * 追加一条播报记录。任何异常都吞掉——记录失败绝不能影响消息处理主流程。
   * @param {object} entry { event:'done'|'failed', msgId, sender, text, reply?, error?, elapsedMs }
   */
  _recordInbox(entry) {
    try {
      const dir = path.dirname(this.inboxPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.inboxPath, JSON.stringify(entry) + '\n');
      if (++this._inboxAppends % INBOX_TRIM_EVERY === 0) this._trimInbox();
    } catch (e) { /* 播报记录失败不能影响消息处理 */ }
    this._refreshInboxBadge();
  }

  /**
   * 把「未播报条数」写进绑定 UI 会话工作区的 memory/MEMORY.md，
   * 该文件每轮都会被注入进 agent 上下文 → 播报不再依赖 agent「记得去查」。
   * 任何异常都吞掉：播报栏刷新失败绝不能影响消息处理主流程。
   */
  _refreshInboxBadge() {
    // 测试 / CI 环境可关掉（BRIDGE_INBOX_BADGE=0）：
    // 避免测试用的假收件箱把「未读数」写进用户真实的记忆文件
    if (process.env.BRIDGE_INBOX_BADGE === '0') return;
    try {
      if (!this._badgeMod) this._badgeMod = require('./inbox-badge.cjs');
      const r = this._badgeMod.refreshBadge({ logger: this.log, inboxPath: this.inboxPath });
      if (r.ok && !r.unchanged) this.log.info(`[bridge] 📬 播报栏已刷新 unread=${r.unread}`);
      else if (!r.ok && r.reason !== 'no-ui-binding') this.log.warn(`[bridge] 播报栏刷新跳过: ${r.reason}`);
    } catch (e) { /* ignore */ }
  }

  /** 收件箱裁剪：只保留最后 INBOX_KEEP_LINES 行 */
  _trimInbox() {
    try {
      const lines = fs.readFileSync(this.inboxPath, 'utf8').split('\n').filter(Boolean);
      if (lines.length <= INBOX_KEEP_LINES) return;
      fs.writeFileSync(this.inboxPath, lines.slice(-INBOX_KEEP_LINES).join('\n') + '\n');
    } catch (e) { /* ignore */ }
  }

  /** progressMap 增容：超过上限时删除最旧条目（Map 按插入顺序迭代） */
  _touchProgress(target, value) {
    if (this.progressMap.has(target)) this.progressMap.delete(target);   // 先删再插：插入顺序 = 最近活跃
    this.progressMap.set(target, value);
    if (this.progressMap.size > this.progressMax) {
      const delCount = this.progressMap.size - this.progressMax;
      const it = this.progressMap.keys();
      for (let i = 0; i < delCount; i++) { const k = it.next().value; if (k === undefined) break; this.progressMap.delete(k); }
    }
  }

  status() {
    return {
      queueLength: this.queue.length,
      active: this.active ? { target: this.active.replyTarget, text: this.active.text.slice(0, 40), startedAt: this.active.startedAt } : null,
      processed: this.processed,
      failed: this.failed,
      sessions: [...this.clients.entries()].map(([target, client]) => ({
        target: target.slice(0, 8),
        ready: !!client.connectionId,
        session: client.activeSessionId ? client.activeSessionId.slice(0, 8) : null,
      })),
      // 共享会话（复用当前 UI 对话）状态；null = 未启用共享模式
      shared: this._sharedClient
        ? {
            session: this._sharedClient.activeSessionId ? this._sharedClient.activeSessionId.slice(0, 8) : null,
            ready: !!this._sharedClient.connectionId,
            cwd: this._sharedClient.cwd || '',
          }
        : null,
      progress: [...this.progressMap.entries()].slice(-5),
    };
  }

  /** 入队（由 maap.onMessage 调用） */
  enqueue(msg) {
    const task = {
      id: msg.id,
      replyTarget: msg.replyTarget,
      text: msg.text,
      type: msg.type,
      createdAt: Date.now(),
    };
    const dedupeKey = `${task.replyTarget}:${task.id}`;
    if (this.seen.has(dedupeKey)) return false;
    if (this.queue.length >= this.maxQueue) {
      this.log.warn(`[bridge] 🛑 队列满 MAX_QUEUE=${this.maxQueue}，丢弃新消息 #${task.id}`);
      this._safeSend(task.replyTarget, `[系统繁忙] 队列已满，请稍后重试`).catch(() => {});
      return false;
    }
    this.seen.set(dedupeKey, Date.now());
    if (this.seen.size > 2000) this.seen.delete(this.seen.keys().next().value);
    if (this._idleReconnectTimer) { clearTimeout(this._idleReconnectTimer); this._idleReconnectTimer = null; }
    this.log.info(`[bridge] 📥 入队 #${task.id} textLength=${task.text.length}`);
    this.queue.push(task);
    this._pump();
    return true;
  }

  _pump() {
    if (this.active) return;                 // 串行
    const task = this.queue.shift();
    if (!task) return;
    this.active = task;
    this._handle(task).finally(() => {
      this.active = null;
      this._pump();                          // 处理下一条
    });
  }

  async _handle(task) {
    const started = Date.now();
    if (this._idleReconnectTimer) { clearTimeout(this._idleReconnectTimer); this._idleReconnectTimer = null; }
    let taskFailed = false;
    this.log.info(`[bridge] 🔄 处理 #${task.id} → ACP`);
    const acp = this._clientFor(task.replyTarget);
    try {
      await acp.ensureSession();

      this.progressMap.set(task.replyTarget, { text: 'AI 处理中…', ts: Date.now() });
      this._touchProgress(task.replyTarget, this.progressMap.get(task.replyTarget));
      if (!this.opts.noProgressReceipt) {
        this._safeSend(task.replyTarget, `[已收到] 你的消息已送达 AI，正在处理…`).catch(() => {});
      }

      let replyText = '';
      const result = await acp.prompt(task.text, {
        timeoutMs: this.opts.taskTimeoutMs || TASK_TIMEOUT_MS,
        allowNewRetry: false,
        onText: (delta) => { replyText += delta; },
        onActivity: (type) => {
          const now = Date.now();
          if (type === 'tool_call') {
            this._maybeProgress(task, now, '🔧 AI 正在调用工具…');
          } else if (type === 'agent_thought_chunk') {
            this._maybeProgress(task, now, '💭 AI 思考中…');
          }
        },
      });

      if (result.timedOut) {
        const error = new Error('ACP 处理超时；为避免重复执行，本次不自动重试');
        error.isTimeout = true;
        throw error;
      }

      let out = replyText.trim();
      // 中文回复清洗：去掉 AI 复述指令/英文引导杂质，只保留中文正文
      // （如 "The user just said..." 前缀；开关 CLEAN_CHINESE_REPLY=0 关闭）
      if (out && process.env.CLEAN_CHINESE_REPLY !== '0') {
        out = Bridge.cleanChineseReply(out);
      }
      if (!out) {
        out = result.stopReason === 'end_turn'
          ? '[AI 已完成处理] 回复将通过 5G 通道下发。'
          : `[AI 处理中/超时] stopReason=${result.stopReason || 'unknown'}。请稍后重试或换一个问题。`;
      }
    this.log.info(`[bridge] ✍️ 回复组装(${out.length}字)`);

      await this._safeSend(task.replyTarget, out);
      this.processed++;
      this.progressMap.delete(task.replyTarget);
      this.log.info(`[bridge] ✅ 完成 #${task.id} 耗时 ${Date.now() - started}ms`);
      this._recordInbox({
        event: 'done',
        ts: Date.now(),
        iso: new Date().toISOString(),
        msgId: task.id,
        sender: task.replyTarget,
        text: task.text,
        reply: out,
        elapsedMs: Date.now() - started,
        session: this._sharedClient && this._sharedClient.activeSessionId
          ? this._sharedClient.activeSessionId.slice(0, 8) : null,
      });
    } catch (e) {
      this.failed++;
      taskFailed = true;
      this.progressMap.delete(task.replyTarget);
      this.log.error(`[bridge] ❌ 处理失败 #${task.id}:`, e.message);
      const notice = e.isTimeout
        ? '[处理超时] 尚未获得完整结果；为避免重复执行，本次没有自动重试'
        : '[处理失败] WorkBuddy 暂时未能完成任务，请稍后重试';
      this._safeSend(task.replyTarget, notice).catch(() => {});
      this._recordInbox({
        event: 'failed',
        ts: Date.now(),
        iso: new Date().toISOString(),
        msgId: task.id,
        sender: task.replyTarget,
        text: task.text,
        error: e.message,
        elapsedMs: Date.now() - started,
      });
    } finally {
      if (taskFailed) {
        acp.forceReconnect();
      }
    }
  }

  _maybeProgress(task, now, text) {
    if (!this.opts.progressReceipt) return;
    const last = this.progressMap.get(task.replyTarget);
    const lastTs = (last && last.ts) ? last.ts : 0;
    if (now - lastTs > 1500) {
      const v = { text, ts: now };
      this._touchProgress(task.replyTarget, v);
      this._safeSend(task.replyTarget, text).catch(() => {});
    }
  }

  async _safeSend(target, text) {
    if (!this.opts.allowedSenders || !this.opts.allowedSenders.includes(target)) throw new Error('目标不在白名单');
    if (this.opts.dry) return { status: 'dry_run', to: target, delivered: false };
    return this.maap.sendReply(target, text);
  }

  async send(target, text) {
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw new Error('消息必须为 1–4000 字符');
    return this._safeSend(String(target), text);
  }

  /**
   * 预热共享会话客户端：仅登记，不发起连接。
   * 作用：bridge_status 在首条消息到达前就能显示当前绑定的 UI 会话。
   */
  primeShared() {
    if (!this.makeSharedAcp) return null;
    try {
      const c = this.makeSharedAcp();
      if (c) this._sharedClient = c;
      return c;
    } catch (e) {
      this.log.warn('[bridge] 预热共享会话失败: ' + e.message);
      return null;
    }
  }

  _clientFor(target) {
    // 共享会话模式：所有发送者共用「当前 UI 会话」客户端（消息因此进入当前对话上下文）。
    // 每次取用都重解析绑定，UI 切了对话也能自动跟随。
    if (this.makeSharedAcp) {
      try {
        const shared = this.makeSharedAcp();
        if (shared) { this._sharedClient = shared; return shared; }
        this.log.warn('[bridge] 未找到可绑定的 UI 会话 → 回退按发送者隔离会话');
      } catch (e) {
        this.log.warn('[bridge] 共享 UI 会话不可用(' + e.message + ') → 回退按发送者隔离会话');
      }
    }
    if (!this.makeAcp) return this.acp;
    let client = this.clients.get(target);
    if (!client) {
      client = this.makeAcp(target);
      this.clients.set(target, client);
    }
    return client;
  }

  disconnect() {
    if (this.acp) this.acp.disconnect();
    if (this._sharedClient) this._sharedClient.disconnect();
    for (const client of this.clients.values()) client.disconnect();
  }

  /**
   * 中文回复清洗：剥离 AI 回复开头的英文引导/指令复述杂质，只保留中文正文。
   * 触发场景：ACP 回传文本混入 "The user just said ... Respond in Chinese." 类前缀。
   * 规则：按句子边界分句，取第一个"中文占优"的句子为正文起点；
   *       纯英文/纯代码/无明显中文句 → 原样返回（不误伤技术场景）。
   */
  static cleanChineseReply(s) {
    if (!s) return s;
    const text = String(s).trim();
    if (!text) return text;
    const zhCount = (t) => (t.match(/[\u4e00-\u9fff]/g) || []).length;
    if (zhCount(text) === 0) return text;   // 无中文 → 原样
    // 首字符即中文 → 直接返回（已是正文，省去分句开销）
    if (/^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(text)) return text;
    // 分句边界：ASCII 句读后(后面是空白或直接跟中文=粘连也要断) 或 换行
    const bounds = [0];
    for (let i = 1; i < text.length - 1; i++) {
      const c = text[i];
      if (/[.!?:;]/.test(c)) {
        const nxt = text[i + 1] || ' ';
        if (/\s/.test(nxt) || /[\u4e00-\u9fff]/.test(nxt)) bounds.push(i + 1);
      }
      if (c === '\n') bounds.push(i + 1);
    }
    bounds.push(text.length);
    const uniq = [...new Set(bounds)].sort((a, b) => a - b);
    for (let b = 0; b < uniq.length - 1; b++) {
      const seg = text.slice(uniq[b], uniq[b + 1]);
      const zh = zhCount(seg);
      if (zh >= 2 && zh / seg.length > 0.3) {
        const cut = text.slice(uniq[b]).trim();
        return cut || text;
      }
    }
    return text;
  }
}

module.exports = Bridge;
