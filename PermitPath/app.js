const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const store = {
  get(key, fallback){try{return JSON.parse(localStorage.getItem('permitpath_'+key)) ?? fallback}catch{return fallback}},
  set(key,value){localStorage.setItem('permitpath_'+key,JSON.stringify(value))}
};
const initialRequirements = [
  {id:1,title:'Choose your business structure',detail:'Sole proprietorship, partnership, or corporation',category:'Planning',done:true},
  {id:2,title:'Register your business name',detail:'DTI for sole proprietors; SEC for corporations and partnerships',category:'Registration',done:true},
  {id:3,title:'Secure barangay clearance',detail:'Check the requirements with the barangay where the business operates',category:'Local permits',done:true},
  {id:4,title:'Apply for Mayor’s / Business Permit',detail:'File with your city or municipal Business Permits and Licensing Office',category:'Local permits',done:true},
  {id:5,title:'Register with the Bureau of Internal Revenue',detail:'Confirm the applicable BIR registration process and forms',category:'Tax',done:true},
  {id:6,title:'Set up books of accounts',detail:'Confirm the books and registration method applicable to your business',category:'Tax',done:true},
  {id:7,title:'Review employer registrations',detail:'If hiring, check applicable SSS, PhilHealth, and Pag-IBIG employer obligations',category:'People',done:true},
  {id:8,title:'Check fire safety requirements',detail:'Confirm Fire Safety Inspection Certificate requirements with the BFP',category:'Safety',done:true},
  {id:9,title:'Confirm zoning and locational clearance',detail:'Requirements depend on premises, activity, and local zoning rules',category:'Local permits',done:false},
  {id:10,title:'Check sanitary permit requirements',detail:'Ask the city/municipal health office if your activity requires one',category:'Safety',done:false},
  {id:11,title:'Review signage and occupancy requirements',detail:'Check applicable local rules for your premises and signboard',category:'Local permits',done:false},
  {id:12,title:'Create a renewal calendar',detail:'Record the expiry dates and renewal windows of issued permits',category:'Planning',done:false}
];
let requirements = store.get('requirements',initialRequirements);
let applications = store.get('applications',[
  {id:101,name:'Business Name Registration',agency:'Department of Trade and Industry',type:'Registration',status:'Completed',progress:100,updated:'Nov 02, 2026'},
  {id:102,name:'Barangay Clearance',agency:'Barangay Hall',type:'Local permit',status:'In progress',progress:70,updated:'Nov 05, 2026'},
  {id:103,name:'Mayor’s / Business Permit',agency:'City BPLO',type:'Local permit',status:'In progress',progress:35,updated:'Nov 06, 2026'}
]);
let documents = store.get('documents',[
  {id:1,name:'DTI_Certificate.pdf',category:'registration',size:'284 KB',date:'Nov 02, 2026',kind:'PDF'},
  {id:2,name:'Valid_ID_Jamie.jpg',category:'registration',size:'1.2 MB',date:'Nov 01, 2026',kind:'JPG'},
  {id:3,name:'Lease_Agreement.pdf',category:'permits',size:'640 KB',date:'Oct 29, 2026',kind:'PDF'},
  {id:4,name:'BIR_Form_1901.pdf',category:'tax',size:'192 KB',date:'Oct 28, 2026',kind:'PDF'},
  {id:5,name:'Barangay_Application.pdf',category:'permits',size:'310 KB',date:'Oct 25, 2026',kind:'PDF'},
  {id:6,name:'Business_Plan.docx',category:'other',size:'86 KB',date:'Oct 20, 2026',kind:'DOC'}
]);
let reminders = store.get('reminders',[
  {id:1,title:'Business permit renewal check',date:'2027-01-15',detail:'Confirm the renewal schedule with your city BPLO',category:'Local permit'},
  {id:2,title:'BIR registration review',date:'2027-02-10',detail:'Review current filing and registration obligations',category:'Tax'}
]);
let currentAppFilter='all',currentDocFilter='all';

function saveAll(){store.set('requirements',requirements);store.set('applications',applications);store.set('documents',documents);store.set('reminders',reminders)}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2400)}
function completedCount(){return requirements.filter(r=>r.done).length}
function percent(){return Math.round(completedCount()/Math.max(requirements.length,1)*100)}
function updateStats(){
  $('#statApplications').textContent=String(applications.filter(a=>a.status!=='Completed').length).padStart(2,'0');
  $('#statComplete').innerHTML=`${String(completedCount()).padStart(2,'0')}<span class="stat-denom">/${requirements.length}</span>`;
  $('#statDocuments').textContent=String(documents.length).padStart(2,'0');
  const now=new Date();const upcoming=reminders.filter(r=>(new Date(r.date+'T00:00:00')-now)/(86400000)<=60 && (new Date(r.date+'T00:00:00')-now)>=0).length;
  $('#statRenewals').textContent=String(upcoming).padStart(2,'0');
  $('#overviewProgress').style.width=percent()+'%';$('#journeyPercent').innerHTML=percent()+'<span>%</span>';$('#journeyBar').style.width=percent()+'%';
  $('#checklistPercent').textContent=percent()+'%';$('#checklistSummary').textContent=`${completedCount()} of ${requirements.length} requirements completed`;
  $('#applicationNavCount').textContent=applications.filter(a=>a.status!=='Completed').length;
  $('#allCount').textContent=requirements.length;
}
function renderNextSteps(){
  const todo=requirements.filter(r=>!r.done).slice(0,3);
  $('#nextStepsList').innerHTML=todo.length?todo.map((r,i)=>`<div class="next-step"><span class="step-icon">${['⌖','▤','✓'][i]}</span><span class="step-copy"><strong>${esc(r.title)}</strong><small>${esc(r.category)} · A suggested next step</small></span><span class="step-arrow">›</span></div>`).join(''):'<div class="empty-state">All checklist items are complete. Nice work!</div>';
}
function renderChecklist(filter='all'){
  const list=requirements.filter(r=>filter==='all'||(filter==='done'?r.done:!r.done));
  $('#checklistItems').innerHTML=list.map(r=>`<div class="check-item ${r.done?'completed':''}"><input class="check-toggle" type="checkbox" data-check="${r.id}" ${r.done?'checked':''} aria-label="Mark ${esc(r.title)} complete"><div class="check-text"><strong>${esc(r.title)}</strong><small>${esc(r.detail)}</small></div><span class="category-tag">${esc(r.category)}</span></div>`).join('')||'<div class="empty-state">Nothing in this view yet.</div>';
  $$('.check-toggle').forEach(el=>el.addEventListener('change',()=>{const r=requirements.find(x=>x.id==el.dataset.check);r.done=el.checked;saveAll();renderAll();toast(r.done?'Requirement marked complete':'Requirement moved back to to do')}));
}
function renderApplications(){
  const list=applications.filter(a=>currentAppFilter==='all'||(currentAppFilter==='active'?a.status!=='Completed':a.status==='Completed'));
  $('#applicationGrid').innerHTML=list.map(a=>`<article class="application-card"><div class="app-card-top"><span class="app-type-icon">${a.type==='Registration'?'▤':'⌖'}</span><span class="app-status ${a.status==='Completed'?'complete':''}">${esc(a.status)}</span></div><h3>${esc(a.name)}</h3><p>${esc(a.agency)} · ${esc(a.type)}</p><div class="app-progress-label"><span>Application progress</span><strong>${a.progress}%</strong></div><div class="app-progress"><span style="width:${a.progress}%"></span></div><div class="app-card-foot"><span>Updated ${esc(a.updated)}</span><button data-advance="${a.id}">${a.status==='Completed'?'View details':'Update progress →'}</button></div></article>`).join('')||'<div class="empty-state">No applications in this view.</div>';
  $$('[data-advance]').forEach(b=>b.addEventListener('click',()=>{const a=applications.find(x=>x.id==b.dataset.advance);if(a.status==='Completed'){toast('This application is marked complete.');return}openModal('Update application',`<div class="field"><label>Application</label><input value="${esc(a.name)}" disabled></div><div class="field"><label>Progress (${a.progress}%)</label><input name="progress" type="range" min="0" max="100" step="5" value="${a.progress}" oninput="this.nextElementSibling.textContent=this.value+'%'"><small>${a.progress}%</small></div><div class="field"><label>Status</label><select name="status"><option ${a.status==='In progress'?'selected':''}>In progress</option><option ${a.status==='For review'?'selected':''}>For review</option><option ${a.status==='Completed'?'selected':''}>Completed</option></select></div>`,data=>{a.progress=Number(data.get('progress'));a.status=data.get('status');a.updated=new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});saveAll();renderAll();toast('Application updated')})}));
}
function renderDocuments(){
  const q=($('#documentSearch').value||'').toLowerCase();
  const list=documents.filter(d=>(currentDocFilter==='all'||d.category===currentDocFilter)&&d.name.toLowerCase().includes(q));
  $('#documentGrid').innerHTML=list.map(d=>`<article class="document-card"><span class="file-icon">${d.kind==='PDF'?'▤':d.kind==='JPG'?'▧':'▧'}</span><div class="document-copy"><strong title="${esc(d.name)}">${esc(d.name)}</strong><small>${esc(d.size)} · ${esc(d.date)}</small></div><button class="document-menu" data-delete-doc="${d.id}" aria-label="Delete ${esc(d.name)}">•••</button></article>`).join('')||'<div class="empty-state">No documents found. Upload a file to start your vault.</div>';
  $$('[data-delete-doc]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Remove this document from your PermitPath list?')){documents=documents.filter(d=>d.id!=b.dataset.deleteDoc);saveAll();renderAll();toast('Document removed from your list')}}));
}
function renderReminders(){
  const sorted=[...reminders].sort((a,b)=>a.date.localeCompare(b.date));
  $('#reminderList').innerHTML=sorted.map(r=>{const d=new Date(r.date+'T00:00:00');const days=Math.ceil((d-new Date())/86400000);return `<div class="reminder-row"><div class="date-tile"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-US',{month:'short'})}</small></div><div class="reminder-copy"><strong>${esc(r.title)}</strong><small>${esc(r.category)} · ${esc(r.detail)}</small></div><span class="days-left">${days<0?'Past due':days===0?'Today':days+' days'}</span><button class="document-menu" data-delete-reminder="${r.id}" aria-label="Delete reminder">×</button></div>`}).join('')||'<div class="empty-state">No reminders yet. Add an important date to get started.</div>';
  $$('[data-delete-reminder]').forEach(b=>b.addEventListener('click',()=>{reminders=reminders.filter(r=>r.id!=b.dataset.deleteReminder);saveAll();renderAll();toast('Reminder removed')}));
}
function renderActivity(){
  const items=[...applications].sort((a,b)=>b.id-a.id).slice(0,3);
  $('#activityList').innerHTML=items.map(a=>`<div class="activity-row"><span class="activity-mark">${a.status==='Completed'?'✓':'↗'}</span><div class="activity-copy"><strong>${esc(a.name)} ${a.status==='Completed'?'completed':'updated'}</strong><small>${esc(a.agency)} · ${esc(a.status)}</small></div><span class="activity-time">${esc(a.updated)}</span></div>`).join('');
}
function renderAll(){updateStats();renderNextSteps();renderChecklist();renderApplications();renderDocuments();renderReminders();renderActivity()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function showView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===name+'View'));
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  const label={overview:'Overview',checklist:'Requirements',applications:'Applications',documents:'Documents',reminders:'Renewals & reminders'}[name]||'Overview';
  $('#pageCrumb').textContent=label;window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$$('[data-view-target]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewTarget)));
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderChecklist(b.dataset.filter)}));
$$('[data-app-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-app-filter]').forEach(x=>x.classList.toggle('selected',x===b));currentAppFilter=b.dataset.appFilter;renderApplications()}));
$$('[data-doc-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-doc-filter]').forEach(x=>x.classList.toggle('selected',x===b));currentDocFilter=b.dataset.docFilter;renderDocuments()}));
$('#documentSearch').addEventListener('input',renderDocuments);
$('#topReminderBtn').addEventListener('click',()=>showView('reminders'));
$('#assistantFab').addEventListener('click',toggleAssistant);$('#closeAssistant').addEventListener('click',toggleAssistant);
$$('[data-open-assistant]').forEach(b=>b.addEventListener('click',toggleAssistant));
function toggleAssistant(){const p=$('#assistantPanel');p.classList.toggle('open');p.setAttribute('aria-hidden',String(!p.classList.contains('open')))}
function openModal(title,fields,onSave){
  $('#modalTitle').textContent=title;$('#modalFields').innerHTML=fields;$('#modalBackdrop').classList.add('open');
  const form=$('#modalForm');form.onsubmit=e=>{e.preventDefault();onSave(new FormData(form));closeModal()};
}
function closeModal(){$('#modalBackdrop').classList.remove('open');$('#modalForm').onsubmit=null}
$('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal()});
$('#addRequirementBtn').addEventListener('click',()=>openModal('Add a requirement',`<div class="field"><label>Requirement name</label><input name="title" required placeholder="e.g. Environmental compliance certificate"></div><div class="field"><label>What needs to be done?</label><textarea name="detail" rows="3" placeholder="Add a note or office to contact"></textarea></div><div class="field"><label>Category</label><select name="category"><option>Registration</option><option>Local permits</option><option>Tax</option><option>Safety</option><option>People</option><option>Planning</option><option>Other</option></select></div>`,d=>{requirements.push({id:Date.now(),title:d.get('title'),detail:d.get('detail')||'Confirm exact requirements with the issuing office',category:d.get('category'),done:false});saveAll();renderAll();toast('Requirement added')}));
$('#newApplicationBtn').addEventListener('click',()=>openModal('Create an application',`<div class="field"><label>Application name</label><input name="name" required placeholder="e.g. Sanitary Permit"></div><div class="field"><label>Issuing office / agency</label><input name="agency" required placeholder="e.g. City Health Office"></div><div class="field"><label>Application type</label><select name="type"><option>Local permit</option><option>Registration</option><option>Tax</option><option>Other</option></select></div>`,d=>{applications.push({id:Date.now(),name:d.get('name'),agency:d.get('agency'),type:d.get('type'),status:'In progress',progress:0,updated:new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})});saveAll();renderAll();toast('Application created')}));
$('#addReminderBtn').addEventListener('click',()=>openModal('Add a reminder',`<div class="field"><label>Reminder title</label><input name="title" required placeholder="e.g. Business permit renewal"></div><div class="field"><label>Due date</label><input name="date" type="date" required></div><div class="field"><label>Notes</label><input name="detail" placeholder="Office to contact or documents to prepare"></div><div class="field"><label>Category</label><select name="category"><option>Local permit</option><option>Tax</option><option>Registration</option><option>Other</option></select></div>`,d=>{reminders.push({id:Date.now(),title:d.get('title'),date:d.get('date'),detail:d.get('detail')||'Confirm deadline with the issuing office',category:d.get('category')});saveAll();renderAll();toast('Reminder added')}));
$('#fileUpload').addEventListener('change',e=>{const fs=[...e.target.files];fs.forEach(f=>{const ext=f.name.split('.').pop().toUpperCase();const category=/bir|tax|190[0-9]/i.test(f.name)?'tax':/permit|barangay|fire|sanitary/i.test(f.name)?'permits':/dti|sec|certificate|id/i.test(f.name)?'registration':'other';documents.unshift({id:Date.now()+Math.random(),name:f.name,category,size:f.size>1048576?(f.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(f.size/1024))+' KB',date:new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}),kind:ext})});saveAll();renderAll();toast(`${fs.length} file${fs.length>1?'s':''} added to your list`);e.target.value=''});
$$('.suggested-prompts button').forEach(b=>b.addEventListener('click',()=>{ $('#chatInput').value=b.textContent;$('#chatForm').requestSubmit()}));
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput'),q=input.value.trim();if(!q)return;addBubble(q,'user');input.value='';setTimeout(()=>addBubble(answerQuestion(q),'bot'),250)});
function addBubble(text,who){const el=document.createElement('div');el.className='chat-bubble '+who;el.textContent=text;$('#chatMessages').append(el);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
function answerQuestion(q){
  const s=q.toLowerCase();
  if(s.includes('barangay'))return 'A barangay clearance is a local certification that may be required as part of a business permit application. The exact documents, fees, and steps are set locally. Contact the barangay where your business premises are located and ask for its current business clearance checklist.';
  if(s.includes('dti')||s.includes('sec')||s.includes('structure'))return 'In general, DTI business name registration is for sole proprietors. Corporations and partnerships register with the SEC. Your best route depends on ownership, liability, and planned structure. Start with the official DTI BNRS (bnrs.dti.gov.ph) or SEC (sec.gov.ph), and consider professional advice before choosing.';
  if(s.includes('bir')||s.includes('tax'))return 'BIR registration covers your tax registration and related obligations. The process and forms can vary by taxpayer type and current rules. Review the official BIR website (bir.gov.ph) and ask the Revenue District Office serving your business about current steps, books of accounts, invoices, and filing obligations.';
  if(s.includes('permit')||s.includes('lgu')||s.includes('mayor'))return 'A Mayor’s or Business Permit is handled by your city or municipality. Common items can include barangay clearance, proof of business address, and other clearances, but the exact list varies by LGU, business activity, and premises. Ask your local Business Permits and Licensing Office for its current checklist.';
  if(s.includes('fire')||s.includes('bfp'))return 'The Bureau of Fire Protection handles fire safety inspections and related certifications. Whether your business needs a Fire Safety Inspection Certificate, and what documents or inspection steps apply, depends on the premises and activity. Confirm directly with the local BFP office.';
  if(s.includes('hello')||s.includes('hi '))return 'Hello! Tell me which permit, registration step, or government office you are trying to understand. I can explain common terms and help you prepare questions to verify with the agency.';
  return 'I can help explain common Philippine business compliance terms, but this demo guide is not connected to a live AI service or government database. Requirements can change and vary by LGU. Tell me your business type and the specific step you are researching, then verify the exact checklist with the issuing agency. Useful starting point: business.gov.ph.';
}
renderAll();
