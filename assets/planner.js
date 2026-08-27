
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
        block.innerHTML=`<strong>${A.esc(c.zh)}</strong><span>${A.esc(code)} · ${A.esc(m.start)}–${A.esc(m.end)}</span><span>${A.esc(m.type)} · ${A.esc(m.room||"")}</span><small>${A.esc(m.weeks||"")}</small>`;
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

  async function init(){
    try{
      ratingMap=buildRatingMap(await S.listAllComments());
    }catch(_){ ratingMap={}; }
    renderRegistration();
    renderAll();
  }

  init();
})();
