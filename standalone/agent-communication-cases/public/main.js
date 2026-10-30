const cases = [
  {name:'ChatGPT dots',group:'head',type:'official',time:'02:28',src:'/media/chatgpt-dots.mp4',source:'https://openai.com/index/introducing-dots/',overview:'OpenAI 发布片展示用户在 ChatGPT 中给 dot 发消息、用语音继续交代，以及 dot 在处理过程中返回进度。',user:'在 App 或网页版发消息、语音通话；获开放资格后可用手机短信联系 dot。',agent:'在对话中报告进度、追问决定；短信测试中可回短信。'},
  {name:'Instinct：短信与电话入口',group:'head',type:'official',note:'创始人发布',time:'00:21',src:'/media/instinct-phone.mp4',source:'https://x.com/noahrshinn/status/2092691344456351744',overview:'创始人发布的短片展示手机短信对话：用户像联系熟人一样给 Instinct 交代事情，助手在同一条消息线程里回复。视频说明了通信入口。',user:'发短信交代事情；也可以直接打电话。',agent:'通过原来的消息对话回复、追问或报告结果。'},
  {name:'Google Duplex',group:'head',type:'official',time:'01:25',src:'/media/google-duplex.mp4',source:'https://blog.google/products-and-platforms/products/assistant/io18/',overview:'Google Assistant 的演示从用户提出预约需求开始，展示助手拨通商家电话并完成预约对话。这段视频对应 Duplex 的代拨场景。',user:'向助手说出餐馆、时间和人数。',agent:'Duplex 在电话里替用户交谈并完成预约，再通知结果。'},
  {name:'Meta Muse',group:'head',type:'official',time:'01:23',src:'/media/muse-launch.mp4',source:'https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/',overview:'Meta 发布片展示用户从聊天窗口交代行程、购物等事务，Muse 在虚拟电脑上继续处理，并在需要授权时回到对话中确认。',user:'从 Muse App 或 WhatsApp 聊天窗口交代任务。',agent:'在原对话中回复与追问；外部动作按权限设置确认。'},
  {name:'Grok Bot',group:'other',displayOrder:2,type:'official',time:'01:46',src:'/media/grok-bot.mp4',source:'https://x.ai/news/introducing-grok-bot',overview:'xAI 发布片用消息对话串起任务：用户交代工作，Bot 使用连接的应用继续操作，再回报进度或请求批准。',user:'在手机或电脑 App 发消息；手机端支持语音聊天。',agent:'在对话中报告进度、请求批准。'},
  {name:'Cal.ai',group:'other',type:'official',time:'00:25',src:'/media/cal-ai.mp4',source:'https://cal.com/ai',overview:'宣传短片展示先设置预约触发条件、再选择电话的语气，随后由 Cal.ai 按事件发起电话与跟进。',user:'商家在 Cal.com 设置电话工作流。',agent:'按预约事件外呼，结果回到预约流程。'},
  {name:'Poke Human',group:'other',type:'official',time:'00:34',src:'/media/poke-human.mp4',source:'https://x.com/interaction/status/2070186007299772700',overview:'发布短片在消息界面展示用户交代任务、Poke 追问和确认。涉及电话或线下处理的部分可转给真人工作人员。',user:'在 Apple Messages、WhatsApp 或 Telegram 发消息。',agent:'在消息里回复；需要电话办事时由真人处理。'},
  {name:'Lindy Phone',group:'other',type:'official',time:'00:39',src:'/media/lindy-phone.mp4',source:'https://www.lindy.ai/product/phone',overview:'官网片段用手机通话界面展示 Lindy 接听、等待和联系他人的过程，并把来电或任务结果带回消息。',user:'发短信、语音留言或邮件，也可在 Slack 交代任务。',agent:'替用户拨打或接听电话，再通过短信、Slack 等渠道回报结果。'},
  {name:'Televox AI',group:'other',type:'official',time:'02:04',src:'/media/televox-ai.mp4',source:'https://televox.ai/demo/videos',overview:'产品视频展示商家后台中的来电接待、WhatsApp 对话和预约记录；顾客打电话或发消息后，AI 继续答复并把确认信息写回服务流程。',user:'顾客拨打商家电话，或在 WhatsApp 发消息。',agent:'接电话、答疑与订位；随后可发短信确认。'},
  {name:'Instinct 中文上手测评（节选）',group:'instinct',type:'review',chinese:true,creator:'哈佛姐夢遊矽谷 AliceInSiliconWonderland',date:'2026-10-13',platform:'YouTube',views:14185,time:'07:08',src:'/media/instinct-review.mp4',source:'https://www.youtube.com/watch?v=BedyZxJmLU8',overview:'中文创作者边操作手机边介绍 Instinct：从短信交代任务、等待回复，到预约等实际场景，再谈它擅长和仍需人工确认的地方。站内视频为原片节选。',user:'主要通过手机消息向 Instinct 下达任务。',agent:'助手在同一消息线程补问并给出办理结果。'},
  {name:'Manus 电话实操',group:'muse',type:'review',chinese:true,creator:'阿石OMP',date:'2026-10-10',platform:'YouTube',views:5047,time:'04:46',src:'/media/phone-api-review.mp4',source:'https://www.youtube.com/watch?v=pMEY1AAElMY',overview:'中文实操视频演示 Manus Cue 设置电话号码后，如何让智能体尝试拨号并回传结果。',user:'在 Manus Cue 中配置电话与任务。',agent:'按任务设置尝试拨号并回传结果。'}
];

const selectedReviews = [
  {name:'Meta Muse 代打电话实测',group:'muse',creator:'国际视角看AI（转载）',date:'2026-10-02',platform:'B站',views:30,time:'17:50',parts:['/media/muse-phone-review-00.mp4','/media/muse-phone-review-01.mp4','/media/muse-phone-review-02.mp4'],poster:'/media/muse-phone-review.jpg',source:'https://www.bilibili.com/video/BV1iWa16KENL',overview:'视频实测 Muse 给书店打电话询问库存和营业时间，包含拨号前确认、通话录音和事后记录。',user:'在 Muse 对话中交代给书店打电话的任务。',agent:'向用户确认拨号，并在任务结束后展示通话记录。'},
  {name:'Meta Muse 中文实测：订餐、购物与 WhatsApp',group:'muse',chinese:true,creator:'沙丘路的毛圈狮子',date:'2026-09-11',platform:'B站',views:15555,time:'22:13',parts:['/media/muse-whatsapp-review-00.mp4','/media/muse-whatsapp-review-01.mp4','/media/muse-whatsapp-review-02.mp4'],poster:'/media/muse-whatsapp-review.jpg',source:'https://www.bilibili.com/video/BV11oY56KETA/',overview:'中文创作者实测 Muse 的日程建议、OpenTable 订餐、购物流程和 WhatsApp 消息入口，也查看账号信息与日历授权。',user:'在 Muse 界面或 WhatsApp 对话中交代任务。',agent:'在对话中反馈任务进展，并尝试完成预订和购物流程。'},
  {name:'Muse 代打电话：中文解读与实测（节选）',group:'muse',type:'review',chinese:true,creator:'MaxAI笔记',date:'2026-10-08',platform:'B站',views:47,time:'03:03',src:'/media/muse-phone-five-features.mp4',poster:'/media/muse-phone-five-features.jpg',source:'https://www.bilibili.com/video/BV1UfHU6kEut/',overview:'站内节选原片的电话章节（约 06:30—09:31）：中文解读海外博主使用 Muse 替用户打电话的过程，也讨论电话功能测试中的人工代拨争议。',user:'在 Muse 对话中交代联系店家的电话任务。',agent:'在对话中回应电话任务的处理情况。'},
  {name:'AI 助理代接与代拨电话实测',group:'other',chinese:true,creator:'AiSpea',date:'2026-10-28',platform:'B站',views:29,time:'00:54',src:'/media/ai-phone-assistant-review.mp4',poster:'/media/ai-phone-assistant-review.jpg',source:'https://www.bilibili.com/video/BV1o9xL6rEyZ',overview:'创作者展示自制 AI 助理的代接电话与代拨号办事场景，并说明它可连接其他工具执行任务。',user:'向 AI 助理交代电话任务，或让它处理来电。',agent:'代接来电，或按任务拨打电话。'},
  {name:'Hermes 主动打电话并发通话回顾',group:'other',chinese:true,creator:'pingHyg',date:'2026-10-20',platform:'B站',views:28,time:'00:36',src:'/media/hermes-call-review.mp4',poster:'/media/hermes-call-review.jpg',source:'https://www.bilibili.com/video/BV1LkJo6zENZ',overview:'短片演示 Hermes 社区插件通过聊天软件主动给用户打语音电话，调整日程后发送通话回顾。',user:'在聊天软件中交代或确认日程调整。',agent:'主动语音来电，挂断后通过消息发送回顾。'},
  {name:'三款个人助理两周实测：Instinct、Muse、Grok Bot',group:'instinct',chinese:true,creator:'小火火fifi',date:'2026-10-28',platform:'B站',views:1396,time:'22:34',parts:['/media/three-agents-review-00.mp4','/media/three-agents-review-01.mp4','/media/three-agents-review-02.mp4','/media/three-agents-review-03.mp4','/media/three-agents-review-04.mp4'],poster:'/media/three-agents-review.jpg',source:'https://www.bilibili.com/video/BV1JuxL6kEP6',overview:'中文博主两周比较 Instinct、Muse 和 Grok Bot，检查订餐、退款等任务是否办成，以及后续消息反馈和记忆表现。',user:'在个人助理对话中交代任务。',agent:'通过对话反馈办理过程、结果与需要核对的信息。'},
  {name:'Instinct 与 Grok Bot、ChatGPT、Hermes 对比',group:'instinct',creator:'Peter Yang',date:'2026-09-02',platform:'YouTube',views:54304,time:'24:21',parts:['/media/peter-yang-instinct-review-00.mp4','/media/peter-yang-instinct-review-01.mp4','/media/peter-yang-instinct-review-02.mp4','/media/peter-yang-instinct-review-03.mp4'],poster:'/media/peter-yang-review.png',source:'https://www.youtube.com/watch?v=6Yeo6M8-W_8',overview:'把四种智能体放在一起比较，重点看消息入口、持续工作方式和账号授权风险。',user:'比较通过消息交代任务的入口。',agent:'对照各产品如何继续执行和回报结果。'},
  {name:'Instinct 上手设置与隐私选项',group:'instinct',creator:'Eliot Prince',date:'2026-10-05',platform:'YouTube',views:47313,time:'20:42',parts:['/media/eliot-prince-instinct-review-00.mp4','/media/eliot-prince-instinct-review-01.mp4','/media/eliot-prince-instinct-review-02.mp4'],poster:'/media/eliot-prince-instinct-review.jpg',source:'https://www.youtube.com/watch?v=lsc3hhHSy98',overview:'从 WhatsApp／iMessage 接入开始，实拍设置过程、连接工具和预约任务，并查看可用的隐私选项。',user:'通过 WhatsApp 或 iMessage 联系 Instinct。',agent:'在消息里继续处理并反馈任务进度。'},
  {name:'Instinct 真实使用：iMessage 账单任务',group:'instinct',creator:'Dr. Josh C. Simmons',date:'2026-09-11',platform:'YouTube',views:9570,time:'12:20',parts:['/media/josh-simmons-instinct-review-00.mp4','/media/josh-simmons-instinct-review-01.mp4'],poster:'/media/josh-simmons-instinct-review.jpg',source:'https://www.youtube.com/watch?v=jh2IDLaP7_Y',overview:'创作者通过 iMessage 交代账单等任务，展示消息对话中的任务处理过程。',user:'通过 iMessage 交代账单任务。',agent:'在消息对话中回复并跟进任务。'},
  {name:'Instinct 短信入口与任务实测',group:'instinct',creator:'全球AI科技不费眼（转载）',date:'2026-09-23',platform:'B站',views:2092,time:'26:12',parts:['/media/instinct-sms-test-00.mp4','/media/instinct-sms-test-01.mp4','/media/instinct-sms-test-02.mp4','/media/instinct-sms-test-03.mp4','/media/instinct-sms-test-04.mp4','/media/instinct-sms-test-05.mp4'],poster:'/media/instinct-sms-test.jpg',source:'https://www.bilibili.com/video/BV1TShC6mELE/',overview:'原作者从手机短信进入 Instinct，交代订理发、餐厅预约和落地签任务，查看助手如何追问、处理并在消息线程中反馈。B 站版本附中文内容提炼。',user:'用手机短信或 iMessage 向 Instinct 交代任务。',agent:'在消息线程里确认信息并回报结果；预约商家时还会使用邮件。'}
];

const extendedVideos = [
  {name:'Dot 电话入口：中文上手介绍',group:'more',type:'review',chinese:true,creator:'Jamie杰米J',date:'2026-10-02',platform:'B站',views:1114,time:'04:16',src:'/media/dot-phone-bili.mp4',poster:'/media/dot-phone-bili.jpg',source:'https://www.bilibili.com/video/BV1BxaS6nE2R/',overview:'中文短片围绕 ChatGPT dot 的电话入口，介绍用户如何通过语音与个人智能体沟通。',user:'在 ChatGPT 中找到 dot，使用电话入口发起语音沟通。',agent:'在通话中语音回应用户。'},
  {name:'Dot 短信与语音入口：中文解读',group:'more',type:'review',chinese:true,creator:'红茶豆子',date:'2026-09-30',platform:'B站',views:3104,time:'04:40',src:'/media/dot-overview-bili.mp4',poster:'/media/dot-overview-bili.jpg',source:'https://www.bilibili.com/video/BV11oa961E8b/',overview:'按官方发布资料介绍 dot 的跨端联系入口：ChatGPT、短信和语音，并穿插发布短片中的消息交代与进度回报。',user:'在 ChatGPT 发消息；发布资料还介绍短信与语音入口。',agent:'在对话中回应任务进展；发送消息前会要求用户确认。'},
  {name:'超级小爱通过微信发消息、打视频电话',group:'more',type:'review',chinese:true,creator:'易举不易',date:'2026-07-03',platform:'抖音精选',time:'02:39',src:'/media/xiaoai-wechat-review.mp4',poster:'/media/xiaoai-wechat-review.jpg',source:'https://jingxuan.douyin.com/m/video/7658236329129588617',overview:'中文创作者用小米手机介绍超级小爱与微信智能体的联动，重点是语音指令发微信消息、发起微信视频电话，以及操作确认。',user:'对超级小爱说出要联系的人和消息内容。',agent:'调用微信智能体发出消息或发起视频通话，关键操作需要语音确认。'},
  {name:'个人 AI 助理争夺战：短信与社交入口',group:'more',type:'review',chinese:true,creator:'硅谷101',date:'2026-10-23',platform:'B站',views:45271,time:'33:29',parts:['/media/agent-interview-00.mp4','/media/agent-interview-01.mp4','/media/agent-interview-02.mp4','/media/agent-interview-03.mp4','/media/agent-interview-04.mp4','/media/agent-interview-05.mp4','/media/agent-interview-06.mp4'],poster:'/media/agent-interview.jpg',source:'https://www.bilibili.com/video/BV1T4nH6oEFC/',overview:'硅谷101采访个人智能体从业者，比较 Instinct 的短信入口、Muse 的社交消息入口与 Grok Bot 的持续任务对话，并讨论 iMessage 基础设施。视频为行业访谈。',user:'通过短信、社交消息或应用对话向不同智能体交代任务。',agent:'通过原有消息渠道反馈任务进展；访谈着重解释各产品为何选择这些入口。'}
];

function safe(value) { return String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function viewLabel(views) { return views >= 10000 ? `${(views / 10000).toFixed(1)} 万播放` : `${views.toLocaleString('zh-CN')} 播放`; }
function cardMarkup(item,index,total) {
  const parts=item.parts || (item.src ? [item.src] : []);
  const playable=parts.length>0;
  const poster=item.poster || (playable ? parts[0].replace(/\.mp4$/,'.jpg') : '');
  const metaText=item.creator ? `${item.platform} · ${item.creator} · ${item.date}${Number.isFinite(item.views) ? ` · ${viewLabel(item.views)}` : ''}` : '';
  const media=playable
    ? `<img class="card-poster" src="${safe(poster)}" alt="" loading="lazy"><button class="video-open" type="button" data-video-index="${catalog.indexOf(item)}" aria-label="播放 ${safe(item.name)}"><span aria-hidden="true">▶</span><span>播放</span></button><span class="duration">${safe(item.time)}</span>`
    : `<div class="media-pending" ${poster ? `style="--pending-poster:url('${safe(poster)}')"` : ''} role="img" aria-label="${safe(item.name)}，视频待接入"><span class="pending-platform">${safe(item.platform)}</span><span class="pending-play" aria-hidden="true">▶</span><span class="pending-status">视频待接入</span></div>`;
  return `<article class="case-card${playable ? '' : ' is-pending'}">
    <div class="card-top"><span class="card-index">${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span><span class="origin-badge ${item.type || 'review'}">${item.type==='official' ? '官方' : '测评介绍'}</span></div>
    <div class="media-frame${playable ? ' has-video' : ''}">${media}</div>
    <div class="card-body"><h3 title="${safe(item.name)}">${safe(item.name)}</h3>${item.note ? `<p class="badge-note">${safe(item.note)}</p>` : ''}
      ${item.creator ? `<p class="card-meta" title="${safe(metaText)}">${safe(metaText)}</p>` : ''}
      <p class="overview-label">视频概览</p><p class="card-overview" title="${safe(item.overview)}">${safe(item.overview)}</p>
      ${item.user && item.agent ? `<dl class="card-details"><div><dt>用户怎么联系 AI</dt><dd title="${safe(item.user)}">${safe(item.user)}</dd></div><div><dt>AI 怎么联系用户</dt><dd title="${safe(item.agent)}">${safe(item.agent)}</dd></div></dl>` : ''}
      ${!playable ? `<a class="pending-source" href="${safe(item.source)}" target="_blank" rel="noopener noreferrer">查看原视频 ↗</a>` : ''}
    </div></article>`;
}
const catalog=[...cases,...selectedReviews,...extendedVideos];
for (const group of ['head','other','instinct','muse','more']) {
  const items=catalog.filter(item=>item.group===group).sort((a,b)=>{
    if (a.type==='official' || b.type==='official') {
      if (a.type!=='official') return 1;
      if (b.type!=='official') return -1;
      return (a.displayOrder || 0)-(b.displayOrder || 0);
    }
    return Number(Boolean(b.chinese))-Number(Boolean(a.chinese)) || (b.views ?? -1)-(a.views ?? -1);
  });
  document.getElementById(`${group}-grid`).innerHTML=items.map((item,index)=>cardMarkup(item,index,items.length)).join('');
}

const playerDialog=document.getElementById('video-dialog');
const playerVideo=document.getElementById('dialog-video');
const playerParts=document.getElementById('dialog-parts');
let activeParts=[];
let currentPart=0;
let previousFocus=null;

function showPart(index,autoplay) {
  currentPart=index;
  playerVideo.src=activeParts[index];
  playerVideo.load();
  playerParts.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  if (autoplay) playerVideo.play().catch(() => {});
}

document.querySelectorAll('.video-open').forEach(button=>button.addEventListener('click',()=>{
  const item=catalog[Number(button.dataset.videoIndex)];
  activeParts=item.parts || [item.src];
  previousFocus=button;
  document.getElementById('dialog-title').textContent=item.name;
  const badge=document.getElementById('dialog-badge');
  badge.className=`origin-badge ${item.type || 'review'}`;
  badge.textContent=item.type==='official' ? '官方' : '测评介绍';
  document.getElementById('dialog-meta').textContent=item.creator ? `${item.platform} · ${item.creator} · ${item.date}` : (item.note || '品牌发布');
  document.getElementById('dialog-overview').textContent=item.overview;
  document.getElementById('dialog-user').textContent=item.user;
  document.getElementById('dialog-agent').textContent=item.agent;
  playerVideo.poster=item.poster || activeParts[0].replace(/\.mp4$/,'.jpg');
  playerParts.innerHTML=activeParts.length>1 ? activeParts.map((_,i)=>`<button type="button" data-part="${i}" aria-pressed="${i===0}">${i+1}/${activeParts.length}</button>`).join('')+'<span>自动连播</span>' : '';
  playerDialog.showModal();
  showPart(0,true);
}));

playerParts.addEventListener('click',event=>{
  const button=event.target.closest('button[data-part]');
  if(button) showPart(Number(button.dataset.part),true);
});
playerVideo.addEventListener('ended',()=>{
  if(currentPart+1<activeParts.length) showPart(currentPart+1,true);
});
document.getElementById('dialog-close').addEventListener('click',()=>playerDialog.close());
playerDialog.addEventListener('click',event=>{
  if(event.target===playerDialog) playerDialog.close();
});
playerDialog.addEventListener('close',()=>{
  playerVideo.pause();
  playerVideo.removeAttribute('src');
  playerVideo.load();
  activeParts=[];
  previousFocus?.focus();
});

document.getElementById('source-list').innerHTML = cases.filter(item=>item.source).map(item=>`
  <li><span>${safe(item.name)}</span><a href="${safe(item.source)}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a></li>`).join('')
  + [...selectedReviews,...extendedVideos].map(item=>`
  <li><span>${safe(item.name)} · ${safe(item.creator)}</span><a href="${safe(item.source)}" target="_blank" rel="noopener noreferrer">查看视频 ↗</a></li>`).join('');

const siteStats=document.getElementById('site-stats');
if(siteStats){
  fetch('/api/visit',{method:'POST',credentials:'same-origin',cache:'no-store'})
    .then(response=>{
      if(!response.ok) throw new Error('访问统计不可用');
      return response.json();
    })
    .then(({pv,uv})=>{
      if(!Number.isSafeInteger(pv)||!Number.isSafeInteger(uv)) throw new Error('访问统计无效');
      siteStats.textContent=`PV ${pv.toLocaleString('zh-CN')} · UV ${uv.toLocaleString('zh-CN')}`;
    })
    .catch(()=>{siteStats.textContent='访问统计暂不可用';});
}
