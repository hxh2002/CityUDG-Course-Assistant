
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
  const PROFILE_KEY="cityudg-ds-comment-profile-v1";
  function getProfile(){
    try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||"{}");}catch(_){return {};}
  }
  function saveProfile(p){localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}
  function avatarFor(user,size=42){
    if(user){
      const gh=String(user).trim();
      if(/^[a-zA-Z0-9_-]{1,39}$/.test(gh)){
        return `<img class="cm-avatar" src="https://github.com/${encodeURIComponent(gh)}.png?s=${size}" alt="@${A.esc(gh)}" onerror="this.removeAttribute('src');this.classList.add('cm-avatar-txt');this.textContent=(${JSON.stringify(gh.charAt(0).toUpperCase())});" referrerpolicy="no-referrer">`;
      }
      const ch=String(user).trim().charAt(0).toUpperCase()||"?";
      return `<span class="cm-avatar cm-avatar-txt">${A.esc(ch)}</span>`;
    }
    return `<span class="cm-avatar cm-avatar-txt">?</span>`;
  }
  function nameFor(entry){
    if(entry.github){
      const gh=String(entry.github).trim();
      const display=entry.name?`${A.esc(entry.name)} <a class="cm-gh-link" href="https://github.com/${encodeURIComponent(gh)}" target="_blank" rel="noreferrer">@${A.esc(gh)}</a>`:
        `<a class="cm-gh-link" href="https://github.com/${encodeURIComponent(gh)}" target="_blank" rel="noreferrer">@${A.esc(gh)}</a>`;
      return display;
    }
    return `<span>${A.esc(entry.name||"匿名")}</span>`;
  }
  function starRow(n){
    const v=Number(n)||0;
    let s="";
    for(let i=1;i<=5;i++) s+=`<span class="star ${i<=v?"on":""}">★</span>`;
    return `<span class="stars">${s}</span>`;
  }
  function commentTemplate(list){
    if(!list.length){
      return `<div class="notice source-empty">还没有评论或评分，成为第一个吧。</div>`;
    }
    return list.map(e=>{
      const cs=A.commentStats(c.code);
      return `<article class="cm-item" data-id="${A.esc(e.id)}">
        ${avatarFor(e.github)}
        <div class="cm-body">
          <div class="cm-head">
            <div class="cm-who">${nameFor(e)} ${e.rating?starRow(e.rating):""}</div>
            <small class="cm-time">${new Date(e.ts).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"})}</small>
          </div>
          ${e.content?`<p class="cm-text">${A.esc(e.content)}</p>`:""}
          <button class="cm-del" data-id="${A.esc(e.id)}" title="删除该评论">删除</button>
        </div>
      </article>`;
    }).join("");
  }
  function ratingTemplate(){
    const cs=A.commentStats(c.code);
    const avg=(Math.round(cs.avg*10)/10).toFixed(1);
    return `<div class="cm-overview">
      <div class="cm-avg">
        <h3>社区评分</h3>
        <div class="cm-avg-num"><strong>${cs.ratingCount?avg:"—"}</strong><small>/ 5.0</small></div>
        ${cs.ratingCount?`<div class="cm-avg-stars">${starRow(Math.round(cs.avg))}</div>`:""}
        <p class="cm-meta">${cs.count} 条评论 · ${cs.ratingCount} 个打分</p>
      </div>
      <div class="cm-form-box">
        <h3>写评论</h3>
        <div class="cm-form-row">
          <label class="cm-field">昵称<input id="cm-name" type="text" placeholder="必填，不超过 20 字" maxlength="20"></label>
          <label class="cm-field">GitHub 用户名（可选）<input id="cm-gh" type="text" placeholder="例：octocat；用于显示头像和链接" maxlength="39"></label>
        </div>
        <div class="cm-form-row">
          <label class="cm-field">打分
            <select id="cm-rating">
              <option value="0">不打分</option>
              <option value="1">1 · 困难</option>
              <option value="2">2 · 一般</option>
              <option value="3">3 · 中等</option>
              <option value="4">4 · 友好</option>
              <option value="5">5 · 强烈推荐</option>
            </select>
          </label>
        </div>
        <label class="cm-field cm-textarea">评论内容<textarea id="cm-content" rows="3" placeholder="教师、教材、作业量、主观感受…… 超过 500 字将截断。" maxlength="500"></textarea></label>
        <div class="cm-form-actions">
          <label class="cm-remember"><input id="cm-remember" type="checkbox" checked>记住昵称与 GitHub 用户名</label>
          <button id="cm-submit" class="button button-primary">发布</button>
        </div>
        <p class="muted-note" style="margin:6px 0 0">提示：当前评论保存在浏览器 localStorage，不同设备/浏览器不会共享。</p>
      </div>
    </div>`;
  }
  function renderComments(){
    const section=document.getElementById("comments-section");
    if(!section)return;
    const list=A.commentsFor(c.code);
    section.innerHTML=ratingTemplate()+`<div id="comment-list" class="cm-list">${commentTemplate(list)}</div>`;
    const profile=getProfile();
    const n=document.getElementById("cm-name"); if(n)n.value=profile.name||"";
    const g=document.getElementById("cm-gh"); if(g)g.value=profile.github||"";
    const r=document.getElementById("cm-remember"); if(r)r.checked=profile.remember!==false;
    document.querySelectorAll(".cm-del").forEach(b=>b.addEventListener("click",()=>{
      if(confirm("删除该评论？")){
        A.deleteComment(c.code,b.dataset.id); A.showToast("已删除"); renderComments();
      }
    }));
    const submit=document.getElementById("cm-submit");
    if(submit)submit.addEventListener("click",()=>{
      const name=String((document.getElementById("cm-name")?.value||"")).trim();
      const github=String((document.getElementById("cm-gh")?.value||"")).trim().replace(/^@/,"");
      const rating=Number(document.getElementById("cm-rating")?.value||0);
      const content=String((document.getElementById("cm-content")?.value||"")).trim();
      if(!name){A.showToast("请填写昵称");return;}
      if(!rating && !content){A.showToast("至少打分或写点内容");return;}
      const remember=!!document.getElementById("cm-remember")?.checked;
      saveProfile(remember?{name,github,remember}:{remember:false});
      A.addComment(c.code,{name,github:github||"",rating,content});
      A.showToast("已发布"); renderComments();
    });
  }
  root.innerHTML=`
    <a class="back-link" href="index.html">← 返回选课台</a>
    <section class="detail-hero">
      <div>
        <div class="badges">${A.categoryBadge(c)}${A.offeredBadge(c)}</div>
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

        <section id="comments-section" class="detail-section">
          <h2>评论与打分</h2>
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
  renderComments();
})();
