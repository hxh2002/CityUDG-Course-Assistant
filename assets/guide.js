
(function(){
  "use strict";
  const A=window.DSA,D=A.DATA;
  const req=D.requirements;
  document.getElementById("guide-content").innerHTML=`
    <section class="guide-hero">
      <div><span class="eyebrow">PROGRAMME GUIDE</span><h1>DS 培养方案与选课规则</h1>
      <p>把培养方案、Semester A 安排、学术管理规则和办事渠道放在同一处。所有动态事项以 SIS / ARRO 最新通知为准。</p></div>
      <div class="big-stat"><strong>${req.graduation}</strong><span>毕业总学分 CUs</span></div>
    </section>

    <section class="guide-section">
      <h2>一、项目与毕业结构</h2>
      <div class="stat-grid">
        <div><strong>${req.normalYears}</strong><span>正常学制（年）</span></div>
        <div><strong>${req.maxYears}</strong><span>最长修读（年）</span></div>
        <div><strong>${req.universityRequirement}</strong><span>University Requirement</span></div>
        <div><strong>${req.core}</strong><span>Core Courses</span></div>
        <div><strong>${req.elective}</strong><span>Elective Courses</span></div>
        <div><strong>${req.grii}</strong><span>GRII 最低要求</span></div>
      </div>
      <div class="notice"><strong>Year 1 目标：</strong>${req.year1Target} CUs = 思政/UR 3 + 核心 12 + 选修 18。Year 2 余下 ${req.year2Target} CUs。</div>
      <div class="notice warning"><strong>GRII 门槛：</strong>至少获得 ${req.griiMajorPrerequisite} 个 major credits，并达到 Year 2 standing。</div>
    </section>

    <section class="guide-section">
      <h2>二、Semester A 第一学期要求</h2>
      <div class="semester-formula">
        <div><strong>1</strong><span>一门思政课</span></div><b>+</b>
        <div><strong>3</strong><span>三门核心课</span></div><b>+</b>
        <div><strong>2</strong><span>两门选修课</span></div><b>=</b>
        <div class="total"><strong>16/17</strong><span>CUs</span></div>
      </div>
      <p>三门核心课为统计机器学习 I（DSC5001 Statistical Machine Learning I）、探索性数据分析与可视化（DSC5002 Exploratory Data Analysis and Visualization）、数据存储与检索（DSC5003 Storing and Retrieving Data），合计 9 CUs；两门选修课从本学期开设的 DS 选修中选择，合计 6 CUs。</p>
      <p>本学期选 1 门思政课：若选自然辩证法概论（IP5902 Dialectics of Nature）或马克思主义与社会科学方法论（IP5903 Marxism and Methodology of Social Sciences）（各 1 CU），本学期合计 16 CUs；若选新时代中国特色社会主义理论与实践（IP5901 Theory and Practice of Socialism with Chinese Characteristics in the New Era）（2 CUs），本学期合计 17 CUs。</p>
      <div class="notice warning">整个硕士阶段仍需最终完成 3 CUs University Requirement = IP5901（2 CUs 必修）+ IP5902/IP5903 二选一（1 CU）。本学期只修其中 1 门思政，后续学期仍需补齐其余部分。</div>
    </section>

    <section class="guide-section">
      <h2>三、课程注册时间线（GMT+8）</h2>
      <div class="timeline">${D.registration.map(x=>`<div class="timeline-item"><strong>${A.esc(x.label)}</strong><span>${A.esc(A.formatCNDate(x.start))} → ${A.esc(A.formatCNDate(x.end))}</span><p>${A.esc(x.note)}</p></div>`).join("")}</div>
      <p>操作路径：登录 SIS → Homepage → Manage Classes → 搜索课程 → 选课 / 加退选。</p>
      <div class="link-row"><a class="button button-primary" href="${D.links.sis}" target="_blank" rel="noreferrer">打开 SIS ↗</a><a class="button button-quiet" href="${D.links.programme}" target="_blank" rel="noreferrer">查看培养方案 ↗</a></div>
    </section>

    <section class="guide-section">
      <h2>四、研二典型路径</h2>
      <div class="table-wrap"><table><thead><tr><th>方案</th><th>组合</th><th>学分</th><th>说明</th></tr></thead><tbody>
        ${D.year2Plans.map(r=>`<tr>${r.map(x=>`<td>${A.esc(x)}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
    </section>

    <section class="guide-section">
      <h2>五、成绩、学分负荷与重修</h2>
      <div class="rule-grid">
        <div><strong>CGPA</strong><p>${A.esc(D.academicRules.cgpa)}</p></div>
        <div><strong>考试红线</strong><p>${A.esc(D.academicRules.exam)}</p></div>
        <div><strong>学分负荷</strong><p>${A.esc(req.semesterLoad)}</p></div>
        <div><strong>重修</strong><p>${A.esc(D.academicRules.repeat)}</p></div>
      </div>
    </section>

    <section class="guide-section">
      <h2>六、考勤、学术诚信与学业预警</h2>
      <div class="rule-grid">
        <div><strong>考勤</strong><p>${A.esc(D.academicRules.attendance)}</p></div>
        <div><strong>学术诚信</strong><p>${A.esc(D.academicRules.integrity)}</p></div>
        <div><strong>学业预警</strong><p>${A.esc(D.academicRules.warning)}</p></div>
      </div>
    </section>

    <section class="guide-section">
      <h2>七、课表数据的特别说明</h2>
      <ul class="guide-list">${D.publicTimetableNotes.map(x=>`<li>${A.esc(x)}</li>`).join("")}</ul>
    </section>

    <section class="guide-section">
      <h2>八、联系方式</h2>
      <div class="contact-grid">${D.contacts.map(x=>`<div><strong>${A.esc(x.topic)}</strong><span>${A.esc(x.who)}</span><p>${A.esc(x.contact)}</p></div>`).join("")}</div>
    </section>

    <section class="guide-section">
      <h2>九、资料口径</h2>
      <ul class="guide-list">${D.sources.map(x=>`<li>${A.esc(x)}</li>`).join("")}</ul>
      <div class="notice"><strong>优先级：</strong>SIS / 最新正式通知 ＞ CIR / ARRO / Course Catalogue ＞ 班会口头提醒。对资料中的代码或课程名冲突，本助手只提示，不擅自合并。</div>
    </section>`;
})();
