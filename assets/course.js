
(function(){
  "use strict";
  const A=window.DSA,D=A.DATA;
  const root=document.getElementById("course-detail");
  const code=new URLSearchParams(location.search).get("code");
  const c=A.courseByCode(code);
  if(!c){
    root.innerHTML='<div class="detail-empty"><h1>找不到课程</h1><p>请返回课程表重新选择。</p><a class="button button-primary" href="index.html">返回</a></div>';
    return;
  }
  document.title=`${A.displayName(c)} · CityU DG DS 选课助手`;
  const selections=A.getSelections();
  const selected=!!selections[c.code];
  const sectionRows=(c.sections||[]).map(s=>`<div class="section-box">
    <h3>${A.esc(s.label)}</h3>
    ${(s.meetings||[]).map(m=>`<div class="meeting-row">
      <strong>${A.esc(A.DAY_NAMES[m.day]||m.day)} ${A.esc(m.start)}–${A.esc(m.end)}</strong>
      <span>${A.esc(m.type)} · ${A.esc(m.room||"地点待定")}</span>
      <small>${A.esc(m.weeks||"")}</small>
    </div>`).join("")}
  </div>`).join("");
  const books=(c.textbooks||[]).map(b=>`<div class="book">
    <strong>${A.esc(b.title)}</strong>
    <span>${A.esc(b.authors||"")}</span>
    <small>ISBN ${A.esc(b.isbn||"—")} · ${A.esc(b.note||"")}</small>
  </div>`).join("");
  const rec=c.recommendation;
  root.innerHTML=`
    <a class="back-link" href="index.html">← 返回选课台</a>
    <section class="detail-hero">
      <div>
        <div class="badges">${A.categoryBadge(c)}${A.offeredBadge(c)}${A.recommendationBadge(rec)}</div>
        <h1>${A.esc(A.displayName(c))}</h1>
        <p>${c.credits} CUs${c.instructor?` · ${A.esc(c.instructor)}`:""}</p>
      </div>
      <div class="detail-actions">
        ${c.planningEligible?`<button id="detail-toggle" class="button ${selected?"button-quiet":"button-primary"}">${selected?"从课表移除":"加入课表"}</button>`:""}
        <a class="button button-quiet" href="index.html">查看我的课表</a>
      </div>
    </section>

    <div class="detail-grid">
      <main>
        <section class="detail-section">
          <h2>课程事实</h2>
          <div class="fact-grid">
            <div class="fact"><span>类别</span><strong>${A.esc(A.CAT_NAMES[c.category]||c.category)}</strong></div>
            <div class="fact"><span>学分</span><strong>${c.credits} CUs</strong></div>
            <div class="fact"><span>2026/27 Sem A</span><strong>${c.offeredSemA===true?"在开课清单":c.offeredSemA==="unknown"?"SIS 待确认":"未列入新生开课清单"}</strong></div>
            <div class="fact"><span>先修 / 条件</span><strong>${A.esc(c.prerequisites||"未标注")}</strong></div>
          </div>
          ${c.requirement?`<div class="notice">${A.esc(c.requirement)}</div>`:""}
          ${(c.aliases||[]).length?`<div class="notice warning"><strong>名称版本：</strong>${c.aliases.map(A.esc).join("；")}</div>`:""}
          ${(c.notes||[]).map(x=>`<div class="notice warning">${A.esc(x)}</div>`).join("")}
          ${c.translationNote?`<p class="muted-note">${A.esc(c.translationNote)}</p>`:""}
        </section>

        <section class="detail-section">
          <h2>本学期班次 / 时段</h2>
          ${sectionRows || `<div class="notice source-empty">${c.scheduleUnknown?"已知开课，但附件周课表未列出具体时段；请在 SIS 查班号与时间。":"现有资料没有可用于本学期排课的时段。"}</div>`}
        </section>

        <section class="detail-section">
          <h2>选课建议</h2>
          ${rec?`<div class="recommendation ${A.esc(rec.level)}">
              <strong>${A.esc(rec.verdict)}</strong>
              <p>${A.esc(rec.summary)}</p>
              ${(rec.tags||[]).length?`<div class="tag-list">${rec.tags.map(t=>`<span>${A.esc(t)}</span>`).join("")}</div>`:""}
              ${rec.basis?`<small>${A.esc(rec.basis)}</small>`:""}
            </div>`:
            `<div class="notice source-empty">现有资料只支持培养方案信息，暂无足够依据给出课程方向评价。</div>`}
        </section>

        <section class="detail-section">
          <h2>教材</h2>
          ${books || '<div class="notice source-empty">附件 TPG Textbook List 未提供该课程教材条目，或该课程不在本学期教材表中。</div>'}
        </section>
      </main>

      <aside>
        <section class="detail-section sticky">
          <h2>资料来源</h2>
          <ul class="source-list">${(c.sources||[]).map(s=>`<li>${A.esc(s)}</li>`).join("")}</ul>
          <p class="muted-note">课程时段、教师、教室和开放状态可能调整。最终以 SIS、ARRO、课程教学大纲和任课教师最新通知为准。</p>
          <div class="link-stack">
            <a href="${A.esc(D.links.sis)}" target="_blank" rel="noreferrer">打开 SIS ↗</a>
            <a href="${A.esc(D.links.programme)}" target="_blank" rel="noreferrer">培养方案 ↗</a>
            <a href="${A.esc(D.links.syllabus)}" target="_blank" rel="noreferrer">课程目录 / Syllabus ↗</a>
          </div>
        </section>
      </aside>
    </div>`;
  const btn=document.getElementById("detail-toggle");
  if(btn)btn.addEventListener("click",()=>{
    A.toggleCourse(c.code); A.showToast(A.getSelections()[c.code]?"已加入课表":"已移除");
    setTimeout(()=>location.reload(),250);
  });
})();
