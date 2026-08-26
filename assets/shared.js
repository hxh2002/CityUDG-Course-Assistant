
(function () {
  "use strict";
  const DATA = window.DS_ASSISTANT_DATA;
  const STORAGE_KEY = "cityudg-ds-planner-v1";
  const DAY_NAMES = {M:"周一",T:"周二",W:"周三",R:"周四",F:"周五",S:"周六",U:"周日"};
  const CAT_NAMES = {core:"核心",elective:"选修",ur:"思政 / UR",grii:"研究·实习·创新",public:"公共课"};
  const CAT_CREDIT_KEYS = {core:"core",elective:"elective",ur:"ur",grii:"grii",public:"public"};

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }
  function displayName(c) {
    return `${c.zh}（${c.code} ${c.en}）`;
  }
  function courseByCode(code) {
    return DATA.courses.find(c => c.code === code);
  }
  function getSelections() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (_) { return {}; }
  }
  function saveSelections(v) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent("ds-selection-change"));
  }
  function defaultSection(c) {
    return c.sections && c.sections.length ? c.sections[0].id : null;
  }
  function selectedSection(c, sel) {
    if (!c || !c.sections || !c.sections.length) return null;
    return c.sections.find(s => s.id === sel?.sectionId) || c.sections[0];
  }
  function setCourse(code, sectionId) {
    const c = courseByCode(code);
    if (!c || !c.planningEligible) return;
    const selections = getSelections();
    selections[code] = {sectionId: sectionId || defaultSection(c)};
    saveSelections(selections);
  }
  function removeCourse(code) {
    const selections = getSelections();
    delete selections[code];
    saveSelections(selections);
  }
  function toggleCourse(code) {
    const selections = getSelections();
    if (selections[code]) removeCourse(code); else setCourse(code);
  }
  function minutes(t) {
    if (!t) return null;
    const [h,m] = t.split(":").map(Number);
    return h*60+m;
  }
  function weeksOverlap(a,b) {
    // Conservative: if week strings are not machine-readable, assume overlap.
    if (!a || !b) return true;
    const parse = s => {
      const out = new Set();
      const ranges = String(s).match(/\d+(?:\s*[–-]\s*\d+)?/g) || [];
      ranges.forEach(r => {
        const parts = r.split(/[–-]/).map(x => parseInt(x.trim(),10));
        if (parts.length===1) out.add(parts[0]);
        else for (let i=parts[0]; i<=parts[1]; i++) out.add(i);
      });
      return out;
    };
    const A=parse(a), B=parse(b);
    if (!A.size || !B.size) return true;
    for (const x of A) if (B.has(x)) return true;
    return false;
  }
  function conflicts(selections) {
    const meetings = [];
    Object.entries(selections).forEach(([code,sel]) => {
      const c=courseByCode(code); const s=selectedSection(c,sel);
      (s?.meetings || []).forEach(m => meetings.push({...m,code,course:c}));
    });
    const out=[];
    for(let i=0;i<meetings.length;i++){
      for(let j=i+1;j<meetings.length;j++){
        const a=meetings[i],b=meetings[j];
        if(a.code===b.code || a.day!==b.day) continue;
        if(!weeksOverlap(a.weeks,b.weeks)) continue;
        const overlap=Math.max(minutes(a.start),minutes(b.start)) < Math.min(minutes(a.end),minutes(b.end));
        if(overlap) out.push([a,b]);
      }
    }
    return out;
  }
  function selectionStats(selections) {
    const s={core:0,elective:0,ur:0,grii:0,public:0,total:0,counts:{core:0,elective:0,ur:0,grii:0,public:0,total:0}};
    Object.keys(selections).forEach(code=>{
      const c=courseByCode(code); if(!c)return;
      const cat=c.category||"other";
      s[cat]=(s[cat]||0)+Number(c.credits||0);
      if(cat!=="public") s.total+=Number(c.credits||0);
      s.counts[cat]=(s.counts[cat]||0)+1; s.counts.total++;
    });
    return s;
  }
  function ruleChecks(selections) {
    const checks=[];
    const stats=selectionStats(selections);
    const required=["DSC5001","DSC5002","DSC5003"];
    const missing=required.filter(c=>!selections[c]);
    checks.push({
      ok:missing.length===0,
      level:missing.length?"warn":"ok",
      title:"三门 Semester A 核心课",
      text:missing.length ? `尚未加入：${missing.map(code=>displayName(courseByCode(code))).join("、")}` : "三门本学期核心课均已加入。"
    });
    const semElectives=Object.keys(selections).filter(code=>courseByCode(code)?.category==="elective" && courseByCode(code)?.offeredSemA===true);
    checks.push({
      ok:semElectives.length===2,
      level:semElectives.length===2?"ok":(semElectives.length>2?"warn":"info"),
      title:"本学期选修课",
      text:`当前 ${semElectives.length} 门；班会建议选择 2 门（6 CUs）。`
    });
    const urCodes=Object.keys(selections).filter(code=>courseByCode(code)?.category==="ur");
    const hasIP5901=urCodes.includes("IP5901");
    const hasIP5902=urCodes.includes("IP5902");
    const hasIP5903=urCodes.includes("IP5903");

    // 本学期思政：建议 1 门
    const semUrCodes=urCodes.filter(code=>courseByCode(code)?.offeredSemA===true);
    let semUrText;
    if(semUrCodes.length===0){
      semUrText="尚未选择本学期思政课：IP5901（2 CUs）或 IP5902/IP5903 二选一（1 CU）。";
    } else if(semUrCodes.length===1){
      const c=courseByCode(semUrCodes[0]);
      semUrText=`已选 ${c.zh}（${c.code}，${c.credits} CU${c.credits>1?"s":""}）。`;
    } else {
      semUrText=`已选 ${semUrCodes.length} 门思政；Semester A 建议只选 1 门。`;
    }
    checks.push({
      ok:semUrCodes.length===1,
      level:semUrCodes.length===1?"ok":(semUrCodes.length>1?"warn":"info"),
      title:"本学期思政课（1 门）",
      text:semUrText
    });

    // 整个项目 UR 完整性
    const hasBothOne=hasIP5902 && hasIP5903;
    const urDone=hasIP5901 && (hasIP5902||hasIP5903);
    const urMissing=[];
    if(!hasIP5901)urMissing.push("IP5901（2 CUs 必修）");
    if(!hasIP5902 && !hasIP5903)urMissing.push("IP5902/IP5903 二选一（1 CU）");
    checks.push({
      ok:urDone && !hasBothOne,
      level:hasBothOne?"danger":(urDone?"ok":"info"),
      title:"整个项目 University Requirement",
      text:hasBothOne ? "IP5902 与 IP5903 为二选一，不能同时计入 UR。" :
        (urDone ? "UR 3 CUs 已规划完整：IP5901（2 CUs）+ IP5902/IP5903 二选一（1 CU）。" :
        `整个项目尚需 3 CUs UR，目前缺：${urMissing.join("、")}。`)
    });

    const totalOk=stats.total===16 || stats.total===17;
    checks.push({
      ok:totalOk,
      level:totalOk?"ok":(stats.total>17?"danger":"info"),
      title:"Semester A 总学分",
      text:`当前 ${stats.total} CUs；思政选 IP5902/IP5903 为 16 CUs，选 IP5901 为 17 CUs。`
    });
    const publicCodes=Object.keys(selections).filter(code=>courseByCode(code)?.category==="public");
    checks.push({
      ok:true,
      level:"info",
      title:"公共课（英语 / 体育）",
      text:publicCodes.length
        ? `已规划 ${stats.public} CU 公共课（不计入 DS 学分，自由选修）。`
        : "英语（EN1002P）与体育（PE5911/PE6911）不计入 DS 学分，完全自由选修。"
    });
    const conf=conflicts(selections);
    checks.push({
      ok:conf.length===0, level:conf.length?"danger":"ok",
      title:"时间冲突",
      text:conf.length ? `检测到 ${conf.length} 处重叠，请调整并行班或课程。` : "当前已知课表时段无冲突；时段未公布的课程不参与自动判断。"
    });
    return checks;
  }
  const COMMENT_KEY = "cityudg-ds-comments-v1";
  function getComments() {
    try {
      const v = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (_) { return {}; }
  }
  function saveComments(v) {
    localStorage.setItem(COMMENT_KEY, JSON.stringify(v));
  }
  function commentsFor(code) {
    const all = getComments();
    return Array.isArray(all[code]) ? all[code] : [];
  }
  function addComment(code, entry) {
    const all = getComments();
    if (!Array.isArray(all[code])) all[code] = [];
    all[code].unshift({id: String(Date.now()) + Math.random().toString(36).slice(2,6), ts: Date.now(), ...entry});
    saveComments(all);
    return all[code];
  }
  function deleteComment(code, id) {
    const all = getComments();
    if (Array.isArray(all[code])) all[code] = all[code].filter(c => c.id !== id);
    saveComments(all);
    return all[code] || [];
  }
  function commentStats(code) {
    const list = commentsFor(code);
    const ratings = list.map(c => Number(c.rating)).filter(n => n > 0);
    const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length) : 0;
    return { count: list.length, avg, ratingCount: ratings.length };
  }
  function offeredBadge(c) {
    if(c.offeredSemA===true) return '<span class="badge offered">Sem A</span>';
    if(c.offeredSemA==="unknown") return '<span class="badge pending">SIS 待确认</span>';
    return '<span class="badge muted">非本学期开课清单</span>';
  }
  function categoryBadge(c) {
    return `<span class="badge cat-${esc(c.category)}">${esc(CAT_NAMES[c.category]||c.category)}</span>`;
  }
  function scheduleText(c, sel) {
    const s=selectedSection(c,sel);
    if(!s) return c.scheduleUnknown ? "时段待 SIS 确认" : "暂无本学期时段";
    return (s.meetings||[]).map(m=>`${DAY_NAMES[m.day]||m.day} ${m.start}–${m.end}`).join(" / ");
  }
  function showToast(msg) {
    const el=document.getElementById("toast"); if(!el)return;
    el.textContent=msg; el.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.remove("show"),1800);
  }
  function registrationState(now=new Date()) {
    const periods=DATA.registration.map(x=>({...x,startDate:new Date(x.start),endDate:new Date(x.end)}));
    const active=periods.find(x=>now>=x.startDate && now<=x.endDate);
    if(active) return {kind:"active",period:active};
    const next=periods.find(x=>now<x.startDate);
    if(next) return {kind:"next",period:next};
    return {kind:"done",period:periods[periods.length-1]};
  }
  function formatCNDate(iso) {
    const d=new Date(iso);
    return new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(d);
  }
  window.DSA={
    DATA,DAY_NAMES,CAT_NAMES,esc,displayName,courseByCode,getSelections,saveSelections,
    defaultSection,selectedSection,setCourse,removeCourse,toggleCourse,minutes,conflicts,
    selectionStats,ruleChecks,offeredBadge,categoryBadge,scheduleText,
    showToast,registrationState,formatCNDate,
    COMMENT_KEY,getComments,saveComments,commentsFor,addComment,deleteComment,commentStats
  };
})();
