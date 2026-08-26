# CityU(DG) DS Course Assistant · 2026/27 Semester A

香港城市大学（东莞）2026级数据科学理学硕士（DS TPG）静态选课 / 排课辅助工具。

## 功能

- 搜索、按课程类型 / 上课日筛选
- Semester A 开课与全部培养方案课程库切换
- 加入 / 删除课程，`localStorage` 自动保存
- 周一至周六可视化课表
- 已知时段冲突检测
- 核心 / 选修 / University Requirement / 总学分统计
- 对照第一学期 `1 门思政 + 3 门必修 + 2 门选修`（16 或 17 CUs）做规则检查
- 课程详情页：班次、教师、先修、教材、评论与打分
- 培养方案页：45 CUs 结构、Year 1 / Year 2 规划、GRII 门槛、成绩与考勤规则、联系方式

## 数据口径

资料基于用户提供的：

1. 26级 Data Science 入学班会（2026-08-24）
2. 2026/27 Semester A / DS TPG 学期总览、课程目录、完整周课表、教材对应
3. 研究生学术管理讲座材料
4. MSc Data Science 官方培养方案网页截图 / CIR
5. 会议整理与录音摘要

动态信息优先级：**SIS / 最新正式通知 > CIR / ARRO / Course Catalogue > 班会口头提醒**。

特别注意：

- CIR 中 `IP5901` 与附件周课表中同名课程 `IPS902` 代码不一致，本站不会自动视为同一课程。
- `DSC8011` 本学期开课，但附件完整周课表未列出时段，故不参与自动冲突检测。
- Week 1 因 Opening Convocation Ceremony 有周三课程临时调整至周六。
- 中文名中，Sem A 课程使用附件课程映射；其他培养方案课程若无官方中文名，采用便于阅读的整理译名，英文名与课号优先。

## 本地使用

直接打开 `index.html` 即可。数据使用 `assets/data.js` 内嵌，不依赖 fetch，因此 `file://` 方式也能工作。

## GitHub Pages

最简单方式：

1. 新建 GitHub repository。
2. 把本目录全部文件上传到仓库根目录。
3. 在 **Settings → Pages** 中选择 **GitHub Actions**；本项目已附 `.github/workflows/pages.yml`。
4. push 到 `main` 后自动部署。

## 参考项目

交互功能与信息架构参考：
- `https://char1es-emp.github.io/CityUDS-courses-2627/index.html`
- `https://github.com/Char1es-EMP/CityUDS-courses-2627`

本项目代码为针对香港城市大学（东莞）DS 培养方案独立实现，没有直接复制参考项目代码或课程评价数据。

## 免责声明

这是非官方辅助工具。课程名、班号、教师、教室、时段、开放状态与学术规定可能更新，**最终以 SIS、ARRO、Course Catalogue、课程教学大纲及任课教师最新通知为准**。
