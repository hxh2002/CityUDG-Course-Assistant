
(function () {
  "use strict";
  const A=window.DSA, D=A.DATA;
  const DAYS=["M","T","W","R","F","S"];
  let viewMode="semester"; // semester | all
  let category="all";
  let day="all";
  let search="";
  let selections=A.getSelections();
  const S=window.SUPABASE;
  let ratingMap={};
  function buildRatingMap(list){
    const byCode={};
    list.forEach(x=>{ (byCode[x.course_code]=byCode[x.course_code]||[]).push(x); });
    const map={};
    Object.keys(byCode).forEach(code=>{ map[code]=S.statsFromList(byCode[code]); });
    return map;
  }

  const $=s=>document.querySelector(s);
  const list=$("#course-list");
  const selectedList=$("#selected-list");

  function isPlannerVisible(c){
    if(viewMode==="semester") return c.planningEligible && (c.offeredSemA===true || c.offeredSemA==="unknown");
    return true;
  }
  function hasDay(c,d){
    if(d==="all")return true;
    if(d==="pending")return !c.sections?.length;
    return (c.sections||[]).some(s=>(s.meetings||[]).some(m=>m.day===d));
  }
  function filteredCourses(){
    const q=search.toLowerCase().trim();
    return D.courses.filter(c=>{
      if(!isPlannerVisible(c))return false;
      if(category!=="all" && c.category!==category)return false;
      if(!hasDay(c,day))return false;
      const hay=`${c.zh} ${c.en} ${c.code}`.toLowerCase();
      return !q || hay.includes(q);
    }).sort((a,b)=>{
      const order={core:0,elective:1,ur:2,grii:3};
      if((order[a.category]??9)!==(order[b.category]??9))return (order[a.category]??9)-(order[b.category]??9);
      if(a.offeredSemA!==b.offeredSemA)return a.offeredSemA===true?-1:1;
      return (a.electiveRank||99)-(b.electiveRank||99) || a.code.localeCompare(b.code);
    });
  }
  function renderList(){
    const items=filteredCourses();
    list.innerHTML=items.length?items.map(c=>{
      const selected=!!selections[c.code];
      const canAdd=!!c.planningEligible;
      const sections=c.sections||[];
      const multi=sections.length>1;
      const curId=selections[c.code]?.sectionId || A.defaultSection(c);
      const sched=A.scheduleText(c,{sectionId:curId});
      const cs=ratingMap[c.code] || {count:0,ratingCount:0,avg:0};
      const ratingLine=cs.ratingCount?`<span class="rating-line" title="平均打分 / 评论数">★ ${(Math.round(cs.avg*10)/10).toFixed(1)} <small>(${cs.ratingCount})</small></span>`:"";
      const sectionPicker=multi?`<label class="section-picker card-section-picker">选择班级
        <select data-code="${A.esc(c.code)}" data-role="card-section">
          ${sections.map(s=>`<option value="${A.esc(s.id)}" ${s.id===curId?"selected":""}>${A.esc(s.label)}</option>`).join("")}
        </select>
      </label>`:"";
      return `<article class="course-card ${selected?"is-selected":""}" data-code="${A.esc(c.code)}">
        <div class="card-top">
          <div class="badges">${A.categoryBadge(c)}${A.offeredBadge(c)}</div>
          <span class="credits">${c.credits} CU${Number(c.credits)!==1?"s":""}</span>
        </div>
        <a class="course-name" href="course.html?c=${encodeURIComponent(c.code)}">${A.esc(A.displayName(c))}</a>
        <p class="course-schedule" data-role="schedule">${A.esc(sched)}</p>
        ${c.instructor?`<p class="course-instructor">${A.esc(c.instructor)}</p>`:""}
        ${ratingLine?`<p class="course-rating">${ratingLine}</p>`:""}
        ${sectionPicker}
        <div class="card-actions">
          <a class="text-link" href="course.html?c=${encodeURIComponent(c.code)}">详情 / 评论</a>
          ${canAdd?`<button class="button ${selected?"button-quiet":"button-primary"} add-btn" data-code="${A.esc(c.code)}">${selected?"移除":"加入课表"}</button>`:
          `<button class="button button-disabled" disabled>仅课程库</button>`}
        </div>
      </article>`;
    }).join(""):'<div class="empty-state">没有符合条件的课程</div>';
    list.querySelectorAll("[data-role='card-section']").forEach(sel=>sel.addEventListener("change",()=>{
      const code=sel.dataset.code;
      if(selections[code]){
        A.setCourse(code, sel.value); selections=A.getSelections(); renderAll();
      } else {
        const card=sel.closest(".course-card");
        const sch=card?.querySelector("[data-role='schedule']");
        if(sch) sch.textContent=A.scheduleText(A.courseByCode(code),{sectionId:sel.value});
      }
    }));
    list.querySelectorAll(".add-btn").forEach(btn=>btn.addEventListener("click",()=>{
      const code=btn.dataset.code;
      if(selections[code]){
        A.removeCourse(code);
      } else {
        const card=btn.closest(".course-card");
        const selEl=card?.querySelector("[data-role='card-section']");
        A.setCourse(code, selEl?.value || undefined);
      }
      selections=A.getSelections(); renderAll();
    }));
  }
  function renderSelected(){
    const entries=Object.keys(selections).map(code=>A.courseByCode(code)).filter(Boolean);
    selectedList.innerHTML=entries.length?entries.map(c=>{
      const sel=selections[c.code]||{};
      const options=(c.sections||[]).map(s=>`<option value="${A.esc(s.id)}" ${s.id===sel.sectionId?"selected":""}>${A.esc(s.label)}</option>`).join("");
      return `<article class="selected-card">
        <div class="selected-title">
          <div>${A.categoryBadge(c)} <strong>${A.esc(A.displayName(c))}</strong></div>
          <button class="icon-btn remove-btn" data-code="${A.esc(c.code)}" title="移除">×</button>
        </div>
        <p>${c.credits} CUs · ${A.esc(A.scheduleText(c,sel))}</p>
        ${options?`<label class="section-picker">班次
          <select data-code="${A.esc(c.code)}">${options}</select>
        </label>`:`<div class="pending-line">无可切换班次 / 时段待确认</div>`}
      </article>`;
    }).join(""):'<div class="empty-state">还没有加入课程。</div>';
    selectedList.querySelectorAll(".remove-btn").forEach(b=>b.addEventListener("click",()=>{
      A.removeCourse(b.dataset.code); selections=A.getSelections(); renderAll();
    }));
    selectedList.querySelectorAll("select").forEach(s=>s.addEventListener("change",()=>{
      A.setCourse(s.dataset.code,s.value); selections=A.getSelections(); renderAll();
    }));
  }
  function renderStats(){
    const s=A.selectionStats(selections), target=D.requirements.semATarget;
    $("#core-credit").textContent=s.core;
    $("#elec-credit").textContent=s.elective;
    $("#ur-credit").textContent=s.counts.ur;
    $("#total-credit").textContent=s.total;
    const selectedCountEl=$("#selected-count");
    if(selectedCountEl)selectedCountEl.textContent=s.counts.total;
    const tabCountEl=$("#selected-tab-count");
    if(tabCountEl)tabCountEl.textContent=s.counts.total;
    const pct=Math.min(100,Math.round(s.total/target.total*100));
    $("#credit-progress").style.width=pct+"%";
    $("#credit-progress").setAttribute("aria-valuenow",String(pct));
  }
  function renderRules(){
    const checks=A.ruleChecks(selections);
    $("#rule-checks").innerHTML=checks.map(x=>`<div class="check ${x.level}">
      <span class="check-icon">${x.level==="ok"?"✓":x.level==="danger"?"!":"•"}</span>
      <div><strong>${A.esc(x.title)}</strong><p>${A.esc(x.text)}</p></div>
    </div>`).join("");
    const conf=A.conflicts(selections);
    const status=$("#conflict-status");
    status.textContent=conf.length?`${conf.length} 处冲突`:"暂无已知冲突";
    status.className="conflict-status "+(conf.length?"has-conflict":"is-clear");
  }
  function timeToY(t){
    const start=8*60+30,end=21*60+20;
    return ((A.minutes(t)-start)/(end-start))*100;
  }
  function renderTimetable(){
    const cols=$("#day-columns");
    cols.innerHTML=DAYS.map(day=>`<div class="day-col" data-day="${day}"></div>`).join("");
    document.querySelectorAll(".day-col").forEach(col=>{
      for(let h=9;h<=21;h++){
        const line=document.createElement("span"); line.className="grid-line";
        line.style.top=timeToY(`${String(h).padStart(2,"0")}:00`)+"%";
        col.appendChild(line);
      }
    });
    const palette=["green","blue","amber","purple","olive","rose","teal","indigo"];
    const order=["DSC5001","DSC5002","DSC5003"];
    const codes=Object.keys(selections).sort((a,b)=>(order.indexOf(a)>-1?order.indexOf(a):99)-(order.indexOf(b)>-1?order.indexOf(b):99) || a.localeCompare(b));
    codes.forEach((code,i)=>{
      const sel=selections[code];
      const c=A.courseByCode(code); const sec=A.selectedSection(c,sel);
      if(!c || !sec)return;
      const color=palette[i%palette.length];
      (sec.meetings||[]).forEach(m=>{
        const col=document.querySelector(`.day-col[data-day="${m.day}"]`); if(!col)return;
        const top=timeToY(m.start), bottom=timeToY(m.end);
        const block=document.createElement("a");
        block.href=`course.html?c=${encodeURIComponent(code)}`;
        block.className=`meeting ${color}`;
        block.style.top=top+"%";
        block.style.height=Math.max(3,bottom-top)+"%";
        const instructorLine=c.instructor?`<span class="meet-instructor">${A.esc(c.instructor)}</span>`:"";
        block.innerHTML=`<strong>${A.esc(c.zh)}</strong><span>${A.esc(code)} · ${A.esc(m.start)}–${A.esc(m.end)}</span><span>${A.esc(m.type||"Lecture")} · ${A.esc(m.room||"地点待定")}</span>${instructorLine}<small>${A.esc(m.weeks||"")}</small>`;
        col.appendChild(block);
      });
    });
    const pending=codes.map(A.courseByCode).filter(c=>c && !(A.selectedSection(c,selections[c.code])?.meetings||[]).length);
    $("#unscheduled").innerHTML=pending.length?`<strong>未排定 / SIS 待确认：</strong> ${pending.map(c=>`<a href="course.html?c=${encodeURIComponent(c.code)}">${A.esc(A.displayName(c))}</a>`).join(" · ")}`:"";
  }
  function renderRegistration(){
    const state=A.registrationState(new Date());
    const box=$("#registration-state");
    if(state.kind==="active"){
      box.innerHTML=`<span class="live-dot"></span><strong>${A.esc(state.period.label)}进行中</strong><span>至 ${A.esc(A.formatCNDate(state.period.end))}（GMT+8）</span>`;
    } else if(state.kind==="next"){
      box.innerHTML=`<strong>下一阶段：${A.esc(state.period.label)}</strong><span>${A.esc(A.formatCNDate(state.period.start))} 开始（GMT+8）</span>`;
    } else {
      box.innerHTML=`<strong>本轮注册时间线已结束</strong>`;
    }
  }
  function renderAll(){
    renderList(); renderSelected(); renderStats(); renderRules(); renderTimetable();
  }

  // controls
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{
    viewMode=b.dataset.view; document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x===b)); renderList();
  }));
  document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{
    category=b.dataset.category; document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x===b)); renderList();
  }));
  document.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>{
    day=b.dataset.day; document.querySelectorAll("[data-day]").forEach(x=>x.classList.toggle("active",x===b)); renderList();
  }));
  $("#course-search").addEventListener("input",e=>{search=e.target.value;renderList();});
  document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>{
    const p=b.dataset.panel;
    document.querySelectorAll("[data-panel]").forEach(x=>x.classList.toggle("active",x===b));
    $("#browse-panel").hidden=p!=="browse"; $("#selected-panel").hidden=p!=="selected";
  }));
  $("#clear-selection").addEventListener("click",()=>{
    if(confirm("清空当前选课规划？")){ A.saveSelections({}); selections={}; renderAll(); }
  });
  $("#copy-plan").addEventListener("click",async()=>{
    const lines=Object.keys(selections).map(code=>{
      const c=A.courseByCode(code); return `${A.displayName(c)} · ${c.credits} CUs · ${A.scheduleText(c,selections[code])}`;
    });
    const stats=A.selectionStats(selections);
    const text=`香港城市大学（东莞）DS 2026/27 Sem A 选课规划\n${lines.join("\n")}\n总计：${stats.total} CUs`;
    try{await navigator.clipboard.writeText(text);A.showToast("选课清单已复制");}
    catch(_){prompt("复制以下内容：",text);}
  });
  $("#export-pdf").addEventListener("click",exportPDF);

  async function exportPDF(){
    const src=document.querySelector(".timetable");
    if(!src){ A.showToast("暂无课表可导出"); return; }
    const btn=$("#export-pdf");
    if(btn){ btn.disabled=true; btn.textContent="生成中…"; }

    const stats=A.selectionStats(selections);
    const conf=A.conflicts(selections);
    const now=new Date();
    const p2=n=>String(n).padStart(2,"0");
    const stamp=`${now.getFullYear()}-${p2(now.getMonth()+1)}-${p2(now.getDate())} ${p2(now.getHours())}:${p2(now.getMinutes())}`;

    const root=document.createElement("div");
    root.id="pdf-export-root";
    root.style.cssText="position:absolute;left:-9999px;top:0;width:1000px;background:#ffffff;padding:28px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:#1a1f28;";
    root.innerHTML=`
      <style>
        #pdf-export-root .timetable{min-width:0;width:100%;grid-template-columns:64px repeat(6,1fr)}
        #pdf-export-root .meeting strong{font-size:12px}
        #pdf-export-root .meeting span,#pdf-export-root .meeting small{font-size:9.5px;margin-top:3px}
        #pdf-export-root .day-heading strong{font-size:12.5px}
        #pdf-export-root .day-heading span{font-size:9.5px}
        #pdf-export-root .time-axis span{font-size:10px}
      </style>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #9e1230;padding-bottom:14px;margin-bottom:16px;">
        <div>
          <div style="font-size:13px;color:#6b7280;letter-spacing:.12em;font-weight:600;">香港城市大学（东莞） · 数据科学硕士 · MS DATA SCIENCE</div>
          <h1 style="margin:7px 0 0;font-size:28px;font-weight:800;letter-spacing:.01em;">2026/27 Semester A 我的课表</h1>
        </div>
        <div style="text-align:right;font-size:12px;color:#6b7280;line-height:1.8;white-space:nowrap;">
          <div>核心 <b style="color:#1a1f28;">${stats.core}</b> CUs · 选修 <b style="color:#1a1f28;">${stats.elective}</b> CUs · 思政 <b style="color:#1a1f28;">${stats.counts.ur}</b> 门 · 总计 <b style="color:#1a1f28;">${stats.total}</b> CUs</div>
          <div>${conf.length?`<span style="color:#9e1230;font-weight:700;">${conf.length} 处时间冲突</span>`:'<span style="color:#17674b;font-weight:700;">暂无已知冲突</span>'}</div>
        </div>
      </div>
      <div id="pdf-timetable-slot" style="border:1px solid #cbd2d9;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(20,30,50,.06);"></div>
      <div style="margin-top:14px;font-size:11px;color:#8a919b;line-height:1.6;display:flex;justify-content:space-between;align-items:center;">
        <span>非官方辅助工具 · 最终以 SIS / ARRO / 任课教师通知为准 · 国庆周部分课程停课，以 SIS 班次日期为准。</span>
        <span style="flex:none;margin-left:24px;">导出时间：${stamp}（GMT+8）</span>
      </div>`;

    const slot=root.querySelector("#pdf-timetable-slot");
    slot.appendChild(src.cloneNode(true));
    document.body.appendChild(root);

    try{
      A.showToast("正在生成 PDF…");
      const canvas=await html2canvas(root,{scale:3,backgroundColor:"#ffffff",useCORS:true,logging:false});
      const imgData=canvas.toDataURL("image/png");
      const { jsPDF }=window.jspdf;
      const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
      const pageW=pdf.internal.pageSize.getWidth();
      const pageH=pdf.internal.pageSize.getHeight();
      const margin=10;
      const ratio=Math.min((pageW-margin*2)/canvas.width,(pageH-margin*2)/canvas.height);
      const imgW=canvas.width*ratio;
      const imgH=canvas.height*ratio;
      pdf.addImage(imgData,"PNG",(pageW-imgW)/2,(pageH-imgH)/2,imgW,imgH);
      pdf.save("CityUDG-DS-SemA-Timetable.pdf");
      A.showToast("PDF 已导出");
    }catch(err){
      A.showToast("导出失败："+(err.message||"未知错误"));
    }finally{
      document.body.removeChild(root);
      if(btn){ btn.disabled=false; btn.textContent="导出 PDF"; }
    }
  }

  async function init(){
    try{
      ratingMap=buildRatingMap(await S.listAllComments());
    }catch(_){ ratingMap={}; }
    renderRegistration();
    renderAll();
  }

  init();
})();
