const $ = (id) => document.getElementById(id);
let status = null;
let pinned = true;
let busy = false;
let pollTimer;

function speak(text) { $('speech').textContent = text; }
function line(who, value) {
  const item = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = who + '：';
  item.append(strong, document.createTextNode(value));
  $('conversation').replaceChildren(item);
}
async function refresh() {
  try {
    status = await window.pet.status();
    if (!status.connected) throw new Error('桥接器离线');
    $('indicator').className = 'indicator ' + (status.mode === 'mock' ? 'mock' : 'live');
    $('connection').textContent = status.mode === 'mock' ? '鹿鹿在身边 · 演示模式' : status.authorized ? '鹿鹿已连上 WorkBuddy' : '鹿鹿还没连上 WorkBuddy';
    $('hint').textContent = status.mode === 'mock'
      ? '现在是本地彩排，鹿鹿不会把消息发给 WorkBuddy。'
      : status.authorized ? '你点击发送后，鹿鹿会把这句话交给本地助理。' : '打开桥接台完成授权，鹿鹿才能帮你传话。';
  } catch {
    status = null;
    $('indicator').className = 'indicator';
    $('connection').textContent = '鹿鹿在这儿 · 离线演示';
    $('hint').textContent = '鹿鹿可以先陪你聊聊。运行桥接器后刷新连接，再请它帮你传话。';
  }
}

async function poll(id, attempts = 0) {
  try {
    const job = await window.pet.job(id);
    if (job.status === 'failed') throw new Error(job.error || '任务失败');
    if (job.status === 'completed') {
      const text = job.reply || '任务已完成，请在 WorkBuddy 查看详情。';
      speak(String(text)); line('鹿鹿', String(text)); busy = false; $('send').disabled = false; return;
    }
  } catch (error) {
    speak('这次没传到，我再陪你试试'); line('提示', error.message); busy = false; $('send').disabled = false; return;
  }
  if (attempts >= 59) {
    speak('助理还在忙，可以去 WorkBuddy 看看'); busy = false; $('send').disabled = false; return;
  }
  pollTimer = setTimeout(() => poll(id, attempts + 1), 2000);
}

$('pet').addEventListener('click', () => {
  const messages = ['鹿鹿在，慢慢来 ✦', '摸摸收到！', '先喝口水，再继续？', '今天也一起加油呀'];
  speak(messages[Math.floor(Math.random() * messages.length)]);
  $('pet').classList.remove('pat'); void $('pet').offsetWidth; $('pet').classList.add('pat');
});
$('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = $('message').value.trim();
  if (!text || busy) return;
  if (!status || status.mode === 'mock') {
    const answer = '鹿鹿听见啦：' + text.slice(0, 22) + (text.length > 22 ? '…' : '') + '。现在是本地演示，连上 WorkBuddy 才能请助理处理。';
    line('鹿鹿', answer); speak(answer); $('message').value = ''; return;
  }
  if (!status.authorized) {
    speak('先帮鹿鹿连上 WorkBuddy 吧'); await refresh(); return;
  }
  busy = true; $('send').disabled = true; clearTimeout(pollTimer);
  line('你', text); speak('鹿鹿收到，去问问助理…');
  try {
    const id = await window.pet.send(text);
    $('message').value = '';
    poll(id);
  } catch (error) {
    speak('这次没传出去，再试试？'); line('提示', error.message); busy = false; $('send').disabled = false;
  }
});
$('refresh').addEventListener('click', refresh);
$('bridge').addEventListener('click', () => window.pet.openBridge());
$('close').addEventListener('click', () => window.pet.close());
$('pin').addEventListener('click', async () => {
  pinned = await window.pet.pin(!pinned);
  $('pin').classList.toggle('unpinned', !pinned);
  $('pin').setAttribute('aria-label', pinned ? '取消置顶' : '置顶');
});
refresh();
