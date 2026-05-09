// ===== DATA =====
const KEYS = {bds:'bds_v1',auctions:'auctions_v1',notes:'notes_v1'};
let bdsData=[], auctionData=[], noteData=[];
let bdsFilter='', aFilter='', currentPage='dashboard';

function loadData(){
  try{bdsData=JSON.parse(localStorage.getItem(KEYS.bds)||'null')||sampleBDS();}catch(e){bdsData=sampleBDS();}
  try{auctionData=JSON.parse(localStorage.getItem(KEYS.auctions)||'null')||sampleAuctions();}catch(e){auctionData=sampleAuctions();}
  try{noteData=JSON.parse(localStorage.getItem(KEYS.notes)||'null')||[];}catch(e){noteData=[];}
}
function saveData(){
  try{localStorage.setItem(KEYS.bds,JSON.stringify(bdsData));}catch(e){}
  try{localStorage.setItem(KEYS.auctions,JSON.stringify(auctionData));}catch(e){}
  try{localStorage.setItem(KEYS.notes,JSON.stringify(noteData));}catch(e){}
}

function sampleBDS(){
  return [
    {id:1,name:'Đất nền lô A3, KDC Tây Hồ, Bình Dương',type:'Đất nền',status:'da-ban',buy:1800,sell:2350,area:120,date:'2024-03-01',note:'Chốt nhanh trong 2 tháng'},
    {id:2,name:'Nhà phố 3 tầng, Q.Bình Thạnh, TP.HCM',type:'Nhà phố',status:'dang-ban',buy:8500,sell:9800,area:60,date:'2024-11-20',note:'Đang tìm khách, liên hệ anh Hùng'},
    {id:3,name:'Đất ruộng 500m², Củ Chi, TP.HCM',type:'Đất ruộng',status:'theo-doi',buy:0,sell:600,area:500,date:'',note:'Chờ quy hoạch'},
  ];
}
function sampleAuctions(){
  const d=new Date(); d.setDate(d.getDate()+5);
  const d2=new Date(); d2.setDate(d2.getDate()+18);
  return [
    {id:1,name:'Đất lô 12, KCN Mỹ Phước 4, Bình Dương',date:d.toISOString().split('T')[0],time:'08:30',start:1200,target:1500,place:'TT Đấu giá tỉnh Bình Dương',note:'Cần đặt cọc 120 triệu'},
    {id:2,name:'Căn hộ 2PN, Dự án Sunrise City, Q.7',date:d2.toISOString().split('T')[0],time:'14:00',start:3500,target:4000,place:'VP Công ty Đất Vàng, Q.1',note:'Cần CCCD + sổ tiết kiệm'},
  ];
}

// ===== FORMAT =====
function fmt(v){
  if(!v||v===0)return'—';
  const n=Number(v);
  if(n>=1000)return(n/1000).toFixed(2).replace(/\.?0+$/,'')+'&nbsp;tỷ';
  return n.toLocaleString('vi-VN')+'&nbsp;tr';
}
function fmtRaw(v){if(!v||v===0)return'—';return Number(v).toLocaleString('vi-VN')+' triệu';}
const STATUS={
  'theo-doi':{label:'Theo dõi',cls:'gray',icon:'👁'},
  'da-mua':{label:'Đã mua',cls:'blue',icon:'🏠'},
  'dang-ban':{label:'Đang bán',cls:'gold',icon:'📣'},
  'da-ban':{label:'Đã bán',cls:'green',icon:'✅'}
};

// ===== NAVIGATION =====
function switchPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.getElementById('nav-'+p).classList.add('active');
  currentPage=p;
  // hide fab on calc
  document.getElementById('fab-btn').style.display=p==='calc'?'none':'flex';
}

// ===== MODALS =====
function openModal(t){document.getElementById('modal-'+t).classList.add('open');}
function closeModal(t){document.getElementById('modal-'+t).classList.remove('open');}
function openAdd(){openModal('add-type');}
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');});
});

// ===== FILTERS =====
function setFilter(el,v){
  document.querySelectorAll('#bds-filters .filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active'); bdsFilter=v; renderBDS();
}
let aFilterVal='';
function setAFilter(el,v){
  document.querySelectorAll('[data-af]').forEach(c=>c.classList.remove('active'));
  el.classList.add('active'); aFilterVal=v; renderAuctions();
}

// ===== STATS =====
function renderStats(){
  const sold=bdsData.filter(p=>p.status==='da-ban');
  const totalP=sold.reduce((s,p)=>s+(Number(p.sell||0)-Number(p.buy||0)),0);
  const active=bdsData.filter(p=>p.status==='da-mua'||p.status==='dang-ban').length;
  const now=new Date();
  const upcoming=auctionData.filter(a=>new Date(a.date)>=now).length;
  document.getElementById('stats-row').innerHTML=`
    <div class="stat-card gold"><div class="stat-label">Tổng BĐS</div><div class="stat-value gold">${bdsData.length}</div><div class="stat-sub">${sold.length} đã bán</div></div>
    <div class="stat-card blue"><div class="stat-label">Đang hoạt động</div><div class="stat-value blue">${active}</div><div class="stat-sub">đang mua/bán</div></div>
    <div class="stat-card red"><div class="stat-label">Đấu giá tới</div><div class="stat-value" style="color:var(--red)">${upcoming}</div><div class="stat-sub">buổi sắp diễn ra</div></div>
    <div class="stat-card green"><div class="stat-label">Lợi nhuận chốt</div><div class="stat-value green" style="font-size:16px">${totalP>0?'+':''}${Number(Math.round(totalP)).toLocaleString('vi-VN')}<span style="font-size:11px;margin-left:2px">tr</span></div><div class="stat-sub">${sold.length} giao dịch</div></div>
  `;
}

// ===== DASHBOARD =====
function renderDashboard(){
  // Chart
  const sold=bdsData.filter(p=>p.status==='da-ban'&&p.buy&&p.sell);
  if(sold.length===0){
    document.getElementById('profit-chart-wrap').style.display='none';
  } else {
    document.getElementById('profit-chart-wrap').style.display='block';
    const maxP=Math.max(...sold.map(p=>Math.abs(p.sell-p.buy)));
    document.getElementById('profit-chart').innerHTML=sold.map(p=>{
      const pr=p.sell-p.buy; const pct=maxP>0?Math.round((Math.abs(pr)/maxP)*100):10;
      const name=p.name.length>12?p.name.substring(0,12)+'…':p.name;
      return `<div class="bar-item">
        <div class="bar-val" style="color:${pr>=0?'var(--green)':'var(--red)'}">${pr>=0?'+':''}${Math.round(pr)}</div>
        <div class="bar-fill ${pr>=0?'profit':'loss'}" style="height:${Math.max(pct,4)}%"></div>
        <div class="bar-label">${name}</div>
      </div>`;
    }).join('');
  }

  // Auctions
  const now=new Date();
  const upA=auctionData.filter(a=>new Date(a.date)>=now).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,2);
  document.getElementById('dash-auctions').innerHTML=upA.length
    ?upA.map(a=>renderAuctionCard(a,true)).join('')
    :`<div class="empty-state" style="padding:20px"><div class="empty-icon">🔨</div><div class="empty-text">Không có đấu giá sắp tới</div></div>`;

  // BDS
  const recent=[...bdsData].reverse().slice(0,4);
  document.getElementById('dash-bds').innerHTML=recent.length
    ?recent.map(p=>renderBDSCard(p,true)).join('')
    :`<div class="empty-state"><div class="empty-icon">🏠</div><div class="empty-text">Chưa có BĐS nào</div><div class="empty-sub">Nhấn + để thêm BĐS đầu tiên</div></div>`;
}

// ===== BDS =====
function renderBDS(){
  const q=(document.getElementById('search-bds').value||'').toLowerCase();
  let list=bdsFilter?bdsData.filter(p=>p.status===bdsFilter):bdsData;
  if(q)list=list.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.type||'').toLowerCase().includes(q));
  document.getElementById('bds-count').textContent=list.length+' BĐS';
  document.getElementById('bds-list').innerHTML=list.length
    ?[...list].reverse().map(p=>renderBDSCard(p)).join('')
    :`<div class="empty-state"><div class="empty-icon">🏠</div><div class="empty-text">Không tìm thấy BĐS nào</div></div>`;
}

function renderBDSCard(p,mini=false){
  const pr=p.sell&&p.buy?p.sell-p.buy:null;
  const s=STATUS[p.status]||{label:p.status,cls:'gray',icon:'?'};
  const prStr=pr!==null?(pr>=0?`<span class="price-value profit">+${Math.round(pr).toLocaleString('vi-VN')} tr</span>`:`<span class="price-value loss">${Math.round(pr).toLocaleString('vi-VN')} tr</span>`):`<span class="price-value">—</span>`;
  return `<div class="bds-card">
    <div class="bds-card-top">
      <div class="bds-name">${p.name}</div>
      <div class="bds-type-badge">${p.type}</div>
    </div>
    <div class="bds-prices">
      <div class="price-item"><div class="price-label">Giá mua</div><div class="price-value">${fmt(p.buy)}</div></div>
      <div class="price-item"><div class="price-label">Giá bán</div><div class="price-value">${fmt(p.sell)}</div></div>
      <div class="price-item"><div class="price-label">Lợi nhuận</div>${prStr}</div>
    </div>
    <div class="bds-footer">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="badge ${s.cls}">${s.icon} ${s.label}</span>
        ${p.area?`<span class="bds-area">${p.area}m²</span>`:''}
      </div>
      ${!mini?`<div class="bds-actions">
        <button class="btn-icon" onclick="editBDS(${p.id})" title="Sửa">✏️</button>
        <button class="btn-icon danger" onclick="deleteBDS(${p.id})" title="Xóa">🗑️</button>
      </div>`:''}
    </div>
    ${p.note?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted)">💬 ${p.note}</div>`:''}
  </div>`;
}

function saveBDS(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){alert('Vui lòng nhập tên/địa chỉ BĐS');return;}
  const editId=+document.getElementById('bds-edit-id').value;
  const obj={
    id:editId||Date.now(),name,
    type:document.getElementById('f-type').value,
    status:document.getElementById('f-status').value,
    buy:+document.getElementById('f-buy').value||0,
    sell:+document.getElementById('f-sell').value||0,
    area:+document.getElementById('f-area').value||0,
    date:document.getElementById('f-date').value,
    note:document.getElementById('f-note').value
  };
  const idx=bdsData.findIndex(p=>p.id===editId);
  if(idx>=0)bdsData[idx]=obj; else bdsData.push(obj);
  saveData(); renderAll(); closeModal('bds');
}
function editBDS(id){
  const p=bdsData.find(x=>x.id===id); if(!p)return;
  document.getElementById('bds-edit-id').value=id;
  document.getElementById('modal-bds-title').textContent='✏️ Sửa bất động sản';
  document.getElementById('f-name').value=p.name;
  document.getElementById('f-type').value=p.type;
  document.getElementById('f-status').value=p.status;
  document.getElementById('f-buy').value=p.buy||'';
  document.getElementById('f-sell').value=p.sell||'';
  document.getElementById('f-area').value=p.area||'';
  document.getElementById('f-date').value=p.date||'';
  document.getElementById('f-note').value=p.note||'';
  openModal('bds');
}
function deleteBDS(id){
  if(!confirm('Xóa BĐS này?'))return;
  bdsData=bdsData.filter(p=>p.id!==id);
  saveData(); renderAll();
}

// ===== AUCTIONS =====
function renderAuctions(){
  const now=new Date();
  let list=[...auctionData].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(aFilterVal==='upcoming')list=list.filter(a=>new Date(a.date)>=now);
  else if(aFilterVal==='past')list=list.filter(a=>new Date(a.date)<now);
  document.getElementById('auction-list').innerHTML=list.length
    ?list.map(a=>renderAuctionCard(a)+`<div style="text-align:right;margin-top:-6px;margin-bottom:10px"><button class="btn-icon danger" onclick="deleteAuction(${a.id})">🗑️</button></div>`).join('')
    :`<div class="empty-state"><div class="empty-icon">🔨</div><div class="empty-text">Không có lịch đấu giá</div></div>`;
}
function renderAuctionCard(a,compact=false){
  const d=new Date(a.date); const now=new Date();
  const diff=Math.ceil((d-now)/(86400000));
  let cd,cdCls;
  if(diff>0){cd=`Còn ${diff} ngày`;cdCls=''}
  else if(diff===0){cd='Hôm nay!';cdCls='today'}
  else{cd='Đã qua';cdCls='past'}
  const months=['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  return `<div class="auction-card">
    <div class="auction-date-box"><div class="auction-day">${d.getDate()}</div><div class="auction-month">${months[d.getMonth()]}/${d.getFullYear()}</div></div>
    <div class="auction-info">
      <div class="auction-name">${a.name}</div>
      <div class="auction-meta">
        <span>⏰ ${a.time}</span>
        <span>📍 ${a.place||'—'}</span><br>
        <span>🏁 Khởi điểm: ${fmt(a.start)}</span>
        <span>🎯 Mục tiêu: ${fmt(a.target)}</span>
      </div>
      ${a.note?`<div style="margin-top:6px;font-size:11px;color:var(--text-muted);background:var(--bg-input);padding:6px 8px;border-radius:6px">📋 ${a.note}</div>`:''}
    </div>
    <div class="auction-right"><span class="countdown-pill ${cdCls}">${cd}</span></div>
  </div>`;
}
function saveAuction(){
  const name=document.getElementById('a-name').value.trim();
  if(!name){alert('Vui lòng nhập tên tài sản');return;}
  auctionData.push({id:Date.now(),name,date:document.getElementById('a-date').value,time:document.getElementById('a-time').value,start:+document.getElementById('a-start').value||0,target:+document.getElementById('a-target').value||0,place:document.getElementById('a-place').value,note:document.getElementById('a-note').value});
  saveData(); renderAll(); closeModal('auction');
  ['a-name','a-date','a-start','a-target','a-place','a-note'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('a-time').value='08:00';
}
function deleteAuction(id){if(!confirm('Xóa lịch này?'))return;auctionData=auctionData.filter(a=>a.id!==id);saveData();renderAll();}

// ===== NOTES =====
function renderNotes(){
  document.getElementById('note-list').innerHTML=noteData.length
    ?[...noteData].reverse().map(n=>`
      <div class="note-card">
        <div class="note-header">
          <div class="note-title-text">${n.title}</div>
          <button class="btn-icon danger" onclick="deleteNote(${n.id})">🗑️</button>
        </div>
        ${n.text?`<div class="note-body">${n.text}</div>`:''}
        <div class="note-footer">
          <span class="badge blue">${n.tag}</span>
          ${n.date?`<span class="note-date">📅 ${n.date}</span>`:''}
        </div>
      </div>`).join('')
    :`<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Chưa có ghi chú nào</div><div class="empty-sub">Nhấn + để thêm ghi chú</div></div>`;
}
function saveNote(){
  const title=document.getElementById('n-title').value.trim();
  if(!title){alert('Vui lòng nhập tiêu đề');return;}
  noteData.push({id:Date.now(),title,tag:document.getElementById('n-tag').value,date:document.getElementById('n-date').value,text:document.getElementById('n-text').value});
  saveData(); renderNotes(); closeModal('note');
  ['n-title','n-date','n-text'].forEach(id=>{document.getElementById(id).value='';});
}
function deleteNote(id){noteData=noteData.filter(n=>n.id!==id);saveData();renderNotes();}

// ===== CALC =====
function calcProfit(){
  const buy=+document.getElementById('c-buy').value||0;
  const sell=+document.getElementById('c-sell').value||0;
  if(!buy||!sell){
    document.getElementById('calc-result').innerHTML=`<div class="empty-state" style="padding:20px"><div class="empty-icon">🧮</div><div class="empty-text">Nhập giá mua và giá bán</div><div class="empty-sub">để xem kết quả tính toán</div></div>`;
    return;
  }
  const tax=Math.round(buy*(+document.getElementById('c-tax').value||0)/100);
  const broker=Math.round(sell*(+document.getElementById('c-broker').value||0)/100);
  const repair=+document.getElementById('c-repair').value||0;
  const other=+document.getElementById('c-other').value||0;
  const interest=(+document.getElementById('c-interest').value||0)*(+document.getElementById('c-months').value||0);
  const totalCost=buy+tax+broker+repair+other+interest;
  const profit=Math.round(sell-totalCost);
  const roi=buy>0?((profit/buy)*100).toFixed(1):0;
  const isProfit=profit>=0;
  const barW=Math.min(Math.abs(+roi),100);
  document.getElementById('calc-result').innerHTML=`
    <div class="calc-row"><span class="label">Giá mua</span><span class="val">${fmtRaw(buy)}</span></div>
    <div class="calc-row"><span class="label">Thuế trước bạ</span><span class="val">${fmtRaw(tax)}</span></div>
    <div class="calc-row"><span class="label">Phí môi giới</span><span class="val">${fmtRaw(broker)}</span></div>
    ${repair?`<div class="calc-row"><span class="label">Sửa chữa</span><span class="val">${fmtRaw(repair)}</span></div>`:''}
    ${interest?`<div class="calc-row"><span class="label">Lãi vay ngân hàng</span><span class="val">${fmtRaw(Math.round(interest))}</span></div>`:''}
    ${other?`<div class="calc-row"><span class="label">Chi phí khác</span><span class="val">${fmtRaw(other)}</span></div>`:''}
    <div class="calc-row"><span class="label">Tổng vốn bỏ ra</span><span class="val">${fmtRaw(Math.round(totalCost))}</span></div>
    <div class="calc-row"><span class="label">Giá bán</span><span class="val">${fmtRaw(sell)}</span></div>
    <div class="calc-row total"><span class="label">${isProfit?'💰 Lợi nhuận':'📉 Lỗ'}</span><span class="val ${isProfit?'profit':'loss'}">${isProfit?'+':''}${profit.toLocaleString('vi-VN')} tr</span></div>
    <div class="roi-bar"><div class="roi-fill${isProfit?'':' neg'}" style="width:${barW}%"></div></div>
    <div class="roi-label"><span>ROI: <b style="color:${isProfit?'var(--green)':'var(--red)'}">${roi}%</b></span><span style="color:var(--text-muted)">so với vốn mua</span></div>
  `;
}

// ===== HEADER DATE =====
function setDate(){
  const now=new Date();
  const days=['CN','T2','T3','T4','T5','T6','T7'];
  const months=['01','02','03','04','05','06','07','08','09','10','11','12'];
  document.getElementById('header-date').innerHTML=`${days[now.getDay()]}, ${now.getDate()}/${months[now.getMonth()]}/${now.getFullYear()}`;
}

// ===== RENDER ALL =====
function renderAll(){
  renderStats(); renderDashboard(); renderBDS(); renderAuctions(); renderNotes();
}

// ===== INIT =====
// ===== NOTIFICATIONS =====
function checkNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if(permission === 'granted') checkAndSend();
    });
  } else if (Notification.permission === 'granted') {
    checkAndSend();
  }
  function checkAndSend() {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastNotified = localStorage.getItem('last_notified_date');
    if (lastNotified === todayStr) return;
    const now = new Date();
    now.setHours(0,0,0,0);
    let notifyItems = [];
    auctionData.forEach(a => {
      const d = new Date(a.date);
      d.setHours(0,0,0,0);
      const diffDays = Math.round((d - now) / 86400000);
      if (diffDays === 0) notifyItems.push(`Hôm nay: ${a.name} lúc ${a.time}`);
      else if (diffDays > 0 && diffDays <= 3) notifyItems.push(`Còn ${diffDays} ngày: ${a.name}`);
    });
    if (notifyItems.length > 0) {
      const title = '🔨 Nhắc nhở đấu giá sắp tới!';
      const options = { body: notifyItems.join('\n'), icon: 'icon.svg', vibrate: [200, 100, 200] };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, options);
          localStorage.setItem('last_notified_date', todayStr);
        });
      } else {
        new Notification(title, options);
        localStorage.setItem('last_notified_date', todayStr);
      }
    }
  }
}
loadData(); setDate(); renderAll();
checkNotifications();
// ===== SERVICE WORKER FOR PWA =====
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); }); }
