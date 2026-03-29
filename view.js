let {pages, view, firstDayOfWeek, globalTaskFilter, dailyNoteFolder, dailyNoteFormat, startPosition, css, options, dailyPlanFolder, dailyPlanTemplate} = input;

// Error Handling
if (!pages && pages!="") { dv.span('> [!ERROR] Missing pages parameter\n> \n> Please set the pages parameter like\n> \n> `pages: ""`'); return false };
if (!options.includes("style")) { dv.span('> [!ERROR] Missing style parameter\n> \n> Please set a style inside options parameter like\n> \n> `options: "style1"`'); return false };
if (!view) { dv.span('> [!ERROR] Missing view parameter\n> \n> Please set a default view inside view parameter like\n> \n> `view: "month"`'); return false };
if (firstDayOfWeek) { 
	if (firstDayOfWeek.match(/[|\\0123456]/g) == null) { 
		dv.span('> [!ERROR] Wrong value inside firstDayOfWeek parameter\n> \n> Please choose a number between 0 and 6');
		return false
	};
} else {
	dv.span('> [!ERROR] Missing firstDayOfWeek parameter\n> \n> Please set the first day of the week inside firstDayOfWeek parameter like\n> \n> `firstDayOfWeek: "1"`'); 
	return false 
};
if (startPosition) { if (!startPosition.match(/\d{4}\-\d{1,2}/gm)) { dv.span('> [!ERROR] Wrong startPosition format\n> \n> Please set a startPosition with the following format\n> \n> Month: `YYYY-MM` | Week: `YYYY-ww`'); return false }};
if (dailyNoteFormat) { if (dailyNoteFormat.match(/[|\\YMDWwd.,-: \[\]]/g).length != dailyNoteFormat.length) { dv.span('> [!ERROR] The `dailyNoteFormat` contains invalid characters'); return false }};

// Get, Set, Eval Pages
if (pages=="") { var tasks = dv.pages().file.tasks } else { if (pages.startsWith("dv.pages")) { var tasks = eval(pages) } else { var tasks = dv.pages(pages).file.tasks } };

// Variables
var done, doneWithoutCompletionDate, due, recurrence, overdue, start, scheduled, process, cancelled, dailyNote, dailyNoteRegEx;
if (!dailyNoteFormat) { dailyNoteFormat = "YYYY-MM-DD" };
var dailyNoteRegEx = momentToRegex(dailyNoteFormat)
var tToday = moment().format("YYYY-MM-DD");
var tMonth = moment().format("M");
var tDay = moment().format("d");
var tYear = moment().format("YYYY");
var tid = (new Date()).getTime();
if (startPosition) { var selectedMonth = moment(startPosition, "YYYY-MM").date(1); var selectedWeek = moment(startPosition, "YYYY-ww").startOf("week") } else { var selectedMonth = moment(startPosition).date(1); var selectedWeek = moment(startPosition).startOf("week") };
var selectedDate = eval("selected"+capitalize(view));
var arrowLeftIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
var arrowRightIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
var filterIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>';
var monthIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>';
var weekIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M17 14h-6"></path><path d="M13 18H7"></path><path d="M7 14h.01"></path><path d="M17 18h.01"></path></svg>';
var listIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
var calendarClockIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"></path><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h5"></path><path d="M17.5 17.5 16 16.25V14"></path><path d="M22 16a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"></path></svg>';
var calendarCheckIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"></path></svg>';
var calendarHeartIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h7"></path><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"></path></svg>';
var cellTemplate = "<div class='cell {{class}}' data-weekday='{{weekday}}' data-date='{{date}}'><div class='cellName' data-path='{{dailyNote}}' style='cursor:pointer;'>{{cellName}}</div><div class='cellContent'>{{cellContent}}</div></div>";
var taskTemplate = "<div class='tc-link' data-path='{{taskPath}}' style='cursor:pointer;'><div class='task {{class}}' style='{{style}}'><div class='inner'><div class='note'>{{note}}</div><div class='icon'>{{icon}}</div><div class='description' data-relative='{{relative}}'>{{taskContent}}</div></div></div></div>";

// 每日计划相关变量
if (!dailyPlanFolder) { dailyPlanFolder = "songzhiyong/02工作计划" };
if (!dailyPlanTemplate) { dailyPlanTemplate = "puplic/00文档模板/每日工作计划模板.md" };
var dailyPlanIcon = "📋";
const rootNode = dv.el("div", "", {cls: "tasksCalendar "+options, attr: {id: "tasksCalendar"+tid, view: view, style: 'position:relative;-webkit-user-select:none!important'}});
if (css) { var style = document.createElement("style"); style.innerHTML = css; rootNode.append(style) };

// 加载每日计划CSS
var dailyPlanStyle = document.createElement("style");
dailyPlanStyle.textContent = `
.tasksCalendar .daily-plan-link {
    margin-top: 4px;
    padding: 2px 6px;
    background: var(--background-modifier-hover);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    border: 1px solid var(--background-modifier-border);
    font-size: 11px;
    font-weight: 500;
    gap: 2px;
    white-space: nowrap;
}
.tasksCalendar .daily-plan-link:hover {
    background: var(--background-modifier-active);
    border-color: var(--interactive-accent);
    transform: translateY(-1px) scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.tasksCalendar .cell.today .daily-plan-link {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent-hover);
}
.tasksCalendar .cell.today .daily-plan-link:hover {
    background: var(--interactive-accent-hover);
    border-color: var(--interactive-accent-hover);
}
.tasksCalendar .cell.has-plan .daily-plan-link {
    background: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
    border-color: rgba(46, 204, 113, 0.3);
}
.tasksCalendar .cell.no-plan .daily-plan-link {
    background: rgba(241, 196, 15, 0.1);
    color: #f1c40f;
    border-color: rgba(241, 196, 15, 0.3);
}
.tasksCalendar.mini .daily-plan-link span:not(:first-child) {
    display: none;
}
.tasksCalendar.mini .daily-plan-link {
    padding: 2px;
}
@media (max-width: 768px) {
    .tasksCalendar .daily-plan-link {
        padding: 2px 4px;
        font-size: 10px;
    }
}
`;
rootNode.append(dailyPlanStyle);
var taskDoneIcon = "✅";
var taskDueIcon = "📅";
var taskScheduledIcon = "⏳";
var taskRecurrenceIcon = "🔁";
var taskOverdueIcon = "⚠️";
var taskProcessIcon = "⏺️";
var taskCancelledIcon = "🚫";
var taskStartIcon = "🛫";
var taskDailyNoteIcon = "📄";

// Initialze
getMeta(tasks);
setButtons();
setStatisticPopUp();
setWeekViewContext();
eval("get"+capitalize(view))(tasks, selectedDate);

// 初始化每日计划功能（延迟执行以确保DOM已渲染）
setTimeout(() => {
    initDailyPlanFeatures();
}, 100);

// Modal utilities
function getDefaultNewFileBaseDir() {
  try {
    const location = app.vault.getConfig && app.vault.getConfig("newFileLocation");
    const folder = app.vault.getConfig && app.vault.getConfig("newFileFolderPath");
    if (location === "current") {
      const af = app.workspace.getActiveFile && app.workspace.getActiveFile();
      return (af && af.parent && af.parent.path) ? af.parent.path : "";
    } else if (location === "folder") {
      return folder || "";
    } else {
      return ""; // root
    }
  } catch (e) {
    return "";
  }
}

async function openFileInModalByPath(path) {
  try {
    const file = app.vault.getAbstractFileByPath(path);
    if (!file) {
      new Notice(`未找到文件: ${path}`);
      return;
    }
    const leaf = app.workspace.getLeaf("window");
    await leaf.openFile(file, { active: true });
    applyPopoutWindowMinimalChrome(leaf);
    centerPopoutWindow(leaf);
  } catch (err) {
    new Notice(`打开失败: ${err.message}`);
    console.error(err);
  }
}

async function createNewNoteAndOpen(basename) {
  try {
    const baseDir = getDefaultNewFileBaseDir();
    const fullPath = (baseDir ? baseDir + "/" : "") + `${basename}.md`;
    let file = app.vault.getAbstractFileByPath(fullPath);
    if (!file) {
      file = await app.vault.create(fullPath, "");
    }
    const leaf = app.workspace.getLeaf("window");
    await leaf.openFile(file, { active: true });
    applyPopoutWindowMinimalChrome(leaf);
    centerPopoutWindow(leaf);
  } catch (err) {
    new Notice(`创建/打开失败: ${err.message}`);
    console.error(err);
  }
}

function getDailyNotesSettings() {
  try {
    const core = app.internalPlugins?.getPluginById?.("daily-notes");
    const opts = core?.instance?.options || {};
    const folder = opts.folder || "";
    const format = opts.format || "YYYY-MM-DD";
    const template = opts.template || "";
    return { folder, format, template };
  } catch (e) {
    return { folder: "", format: "YYYY-MM-DD", template: "" };
  }
}

async function createDailyNoteAndOpen(dateStr) {
  try {
    const { folder, format, template } = getDailyNotesSettings();
    const filename = moment(dateStr, ["YYYY-MM-DD", dailyNoteFormat || "YYYY-MM-DD"], true).isValid()
      ? moment(dateStr).format(format)
      : moment().format(format);
    const fullPath = (folder ? folder + "/" : "") + filename + ".md";
    let file = app.vault.getAbstractFileByPath(fullPath);
    if (!file) {
      let initial = "";
      if (template) {
        const tfile = app.vault.getAbstractFileByPath(template);
        if (tfile) {
          initial = await app.vault.read(tfile);
        }
      }
      file = await app.vault.create(fullPath, initial);
    }
    const leaf = app.workspace.getLeaf("window");
    await leaf.openFile(file, { active: true });
    applyPopoutWindowMinimalChrome(leaf);
    centerPopoutWindow(leaf);
  } catch (err) {
    new Notice(`创建/打开日记失败: ${err.message}`);
    console.error(err);
  }
}

function applyPopoutWindowMinimalChrome(leaf) {
  try {
    const doc = leaf?.containerEl?.ownerDocument;
    if (!doc) return;
    if (doc.head.querySelector('style[data-tasks-calendar-popout-style]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-tasks-calendar-popout-style','');
    style.textContent = `
      /* Hide title bar and tab headers inside the popout window */
      .view-header,
      .workspace-tab-header-container,
      .workspace-tab-header { display: none !important; }
    `;
    doc.head.appendChild(style);
  } catch (e) {
    console.error('Popout chrome style injection failed', e);
  }
}

function centerPopoutWindow(leaf) {
  try {
    const doc = leaf?.containerEl?.ownerDocument;
    const win = doc?.defaultView;
    if (!win) return;
    // Defer to ensure window metrics are available
    setTimeout(() => {
      try {
        const width = win.outerWidth || win.innerWidth || 800;
        const height = win.outerHeight || win.innerHeight || 600;
        const screenW = win.screen?.availWidth || win.screen?.width || 1440;
        const screenH = win.screen?.availHeight || win.screen?.height || 900;
        const left = Math.max(0, Math.round((screenW - width) / 2));
        const top = Math.max(0, Math.round((screenH - height) / 2));
        if (typeof win.moveTo === 'function') {
          win.moveTo(left, top);
        }
      } catch (e) {
        console.error('Center popout failed', e);
      }
    }, 10);
  } catch (e) {
    console.error('Center popout setup failed', e);
  }
}

function showMarkdownModal({ file, initial }) {
  // Basic modal overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.4)";
  overlay.style.zIndex = "1000";

  const modal = document.createElement("div");
  modal.style.position = "absolute";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.width = "min(900px, 90vw)";
  modal.style.height = "min(600px, 80vh)";
  modal.style.background = "var(--background-secondary)";
  modal.style.color = "var(--text-normal)";
  modal.style.border = "1px solid var(--background-modifier-border)";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "10px 12px";
  header.style.borderBottom = "1px solid var(--background-modifier-border)";
  const title = document.createElement("div");
  title.textContent = file?.path || "新笔记";
  title.style.fontWeight = "600";
  title.style.fontSize = "14px";
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  const btnEdit = document.createElement("button");
  btnEdit.textContent = "编辑";
  const btnPreview = document.createElement("button");
  btnPreview.textContent = "预览";
  const btnSave = document.createElement("button");
  btnSave.textContent = "保存";
  const btnClose = document.createElement("button");
  btnClose.textContent = "关闭";
  [btnEdit, btnPreview, btnSave, btnClose].forEach(b=>{ b.className = "mod-cta"; b.style.padding = "6px 10px"; });
  actions.append(btnEdit, btnPreview, btnSave, btnClose);
  header.append(title, actions);

  const body = document.createElement("div");
  body.style.display = "flex";
  body.style.flex = "1";
  body.style.gap = "8px";
  body.style.padding = "10px";
  const editor = document.createElement("textarea");
  editor.style.flex = "1";
  editor.style.width = "50%";
  editor.style.height = "100%";
  editor.style.resize = "none";
  editor.style.background = "var(--background-primary)";
  editor.style.color = "var(--text-normal)";
  editor.style.border = "1px solid var(--background-modifier-border)";
  editor.style.borderRadius = "6px";
  editor.value = initial || "";
  const preview = document.createElement("div");
  preview.style.flex = "1";
  preview.style.width = "50%";
  preview.style.height = "100%";
  preview.style.overflow = "auto";
  preview.style.border = "1px solid var(--background-modifier-border)";
  preview.style.borderRadius = "6px";
  preview.style.padding = "10px";
  preview.style.background = "var(--background-primary)";
  body.append(editor, preview);

  modal.append(header, body);
  overlay.append(modal);
  document.body.appendChild(overlay);

  function renderPreview(md) {
    preview.innerHTML = "";
    // Try Obsidian MarkdownRenderer if available
    try {
      if (window.MarkdownRenderer) {
        window.MarkdownRenderer.render(app, md, preview, file?.path || "");
      } else if (app && app.plugins && app.plugins.plugins && app.plugins.plugins.dataview && app.plugins.plugins.dataview.api && app.plugins.plugins.dataview.api.markdown && app.plugins.plugins.dataview.api.markdown.render) {
        app.plugins.plugins.dataview.api.markdown.render(md, preview, file?.path || "");
      } else {
        // Fallback: simple text
        const pre = document.createElement("pre");
        pre.textContent = md;
        preview.appendChild(pre);
      }
    } catch (e) {
      const pre = document.createElement("pre");
      pre.textContent = md;
      preview.appendChild(pre);
    }
  }

  btnEdit.addEventListener("click", () => {
    editor.style.display = "block";
    preview.style.display = "block";
    renderPreview(editor.value);
  });
  btnPreview.addEventListener("click", () => {
    renderPreview(editor.value);
  });
  btnSave.addEventListener("click", async () => {
    try {
      if (file) {
        await app.vault.modify(file, editor.value);
        new Notice("已保存");
      }
    } catch (e) {
      new Notice(`保存失败: ${e.message}`);
      console.error(e);
    }
  });
  btnClose.addEventListener("click", () => {
    overlay.remove();
  });
}

function setTaskEvents() {
  rootNode.querySelectorAll("div.task").forEach(taskDiv => {
    taskDiv.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const linkEl = taskDiv.closest(".tc-link");
      const path = linkEl && linkEl.getAttribute("data-path");
      if (!path) return;
      await openFileInModalByPath(path);
    }, true);
  });
}

function setDailyNoteEvents() {
  rootNode.querySelectorAll("div.cellName").forEach(cellName => {
    cellName.addEventListener("dblclick", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dataPath = cellName.getAttribute("data-path");
      const base = (dataPath || moment().format("YYYY-MM-DD")).toString();
      const dateStr = base.split("/").pop();

      // 双击打开对应的计划文件
      const planPath = getDailyPlanPath(moment(dateStr, "YYYY-MM-DD"));
      const file = app.vault.getAbstractFileByPath(planPath);

      if (file) {
        // 文件存在，直接在新标签页打开（而不是弹出窗口）
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(file, { active: true });
      } else {
        // 文件不存在，使用配置的模板创建新文件
        await createDailyPlan(moment(dateStr, "YYYY-MM-DD"));
      }
    }, true);
  });
}

function getMeta(tasks) {
	for (i=0;i<tasks.length;i++) {
		var taskText = tasks[i].text;
		var taskFile = getFilename(tasks[i].path);
		var dailyNoteMatch = taskFile.match(eval(dailyNoteRegEx));
		var dailyTaskMatch = taskText.match(/(\d{4}\-\d{2}\-\d{2})/);
		if (dailyNoteMatch) {
			if(!dailyTaskMatch) {
				tasks[i].dailyNote = moment(dailyNoteMatch[1], dailyNoteFormat).format("YYYY-MM-DD")
			};
		};
		var dueMatch = taskText.match(/\📅\W(\d{4}\-\d{2}\-\d{2})/);
		if (dueMatch) {
			tasks[i].due = dueMatch[1];
			tasks[i].text = tasks[i].text.replace(dueMatch[0], "");
		};
		var startMatch = taskText.match(/\🛫\W(\d{4}\-\d{2}\-\d{2})/);
		if (startMatch) {
			tasks[i].start = startMatch[1];
			tasks[i].text = tasks[i].text.replace(startMatch[0], "");
		};
		var scheduledMatch = taskText.match(/\⏳\W(\d{4}\-\d{2}\-\d{2})/);
		if (scheduledMatch) {
			tasks[i].scheduled = scheduledMatch[1];
			tasks[i].text = tasks[i].text.replace(scheduledMatch[0], "");
		};
		var completionMatch = taskText.match(/\✅\W(\d{4}\-\d{2}\-\d{2})/);
		if (completionMatch) {
			tasks[i].completion = completionMatch[1];
			tasks[i].text = tasks[i].text.replace(completionMatch[0], "");
		};
		var repeatMatch = taskText.includes("🔁");
		if (repeatMatch) {
			tasks[i].recurrence = true;
			tasks[i].text = tasks[i].text.substring(0, taskText.indexOf("🔁"))
		};
		var lowMatch = taskText.includes("🔽");
		if (lowMatch) {
			tasks[i].priority = "D";
		};
		var mediumMatch = taskText.includes("🔼");
		if (mediumMatch) {
			tasks[i].priority = "B";
		};
		var highMatch = taskText.includes("⏫");
		if (highMatch) {
			tasks[i].priority = "A";
		};
		if (!lowMatch && !mediumMatch && !highMatch) {
			tasks[i].priority = "C";
		}
		if (globalTaskFilter) {
			tasks[i].text = tasks[i].text.replaceAll(globalTaskFilter,"");
		} else {
			tasks[i].text = tasks[i].text.replaceAll("#task","");
		};
		tasks[i].text = tasks[i].text.replaceAll("[[","");
		tasks[i].text = tasks[i].text.replaceAll("]]","");
		tasks[i].text = tasks[i].text.replace(/\[.*?\]/gm,"");
	};
};

function getFilename(path) {
	var filename = path.match(/^(?:.*\/)?([^\/]+?|)(?=(?:\.[^\/.]*)?$)/)[1];
	return filename;
};

function capitalize(str) {
	return str[0].toUpperCase() + str.slice(1);
};

function getMetaFromNote(task, metaName) {
	var meta = dv.pages('"'+task.link.path+'"')[metaName][0];
	if (meta) { return meta } else { return "" };
}

function transColor(color, percent) {
	var num = parseInt(color.replace("#",""),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, B = (num >> 8 & 0x00FF) + amt, G = (num & 0x0000FF) + amt;
	return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
};

function momentToRegex(momentFormat) {
	momentFormat = momentFormat.replaceAll(".", "\\.");
	momentFormat = momentFormat.replaceAll(",", "\\,");
	momentFormat = momentFormat.replaceAll("-", "\\-");
	momentFormat = momentFormat.replaceAll(":", "\\:");
	momentFormat = momentFormat.replaceAll(" ", "\\s");
	
	momentFormat = momentFormat.replace("dddd", "\\w{1,}");
	momentFormat = momentFormat.replace("ddd", "\\w{1,3}");
	momentFormat = momentFormat.replace("dd", "\\w{2}");
	momentFormat = momentFormat.replace("d", "\\d{1}");
	
	momentFormat = momentFormat.replace("YYYY", "\\d{4}");
	momentFormat = momentFormat.replace("YY", "\\d{2}");
	
	momentFormat = momentFormat.replace("MMMM", "\\w{1,}");
	momentFormat = momentFormat.replace("MMM", "\\w{3}");
	momentFormat = momentFormat.replace("MM", "\\d{2}");
	
	momentFormat = momentFormat.replace("DDDD", "\\d{3}");
	momentFormat = momentFormat.replace("DDD", "\\d{1,3}");
	momentFormat = momentFormat.replace("DD", "\\d{2}");
	momentFormat = momentFormat.replace("D", "\\d{1,2}");
	
	momentFormat = momentFormat.replace("ww", "\\d{1,2}");
	
	regEx = "/^(" + momentFormat + ")$/";
	console.log(regEx)
	return regEx;
};

function getTasks(date) {
	done = tasks.filter(t=>t.completed && t.checked && t.completion && moment(t.completion.toString()).isSame(date)).sort(t=>t.completion);
	doneWithoutCompletionDate = tasks.filter(t=>t.completed && t.checked && !t.completion && t.due && moment(t.due.toString()).isSame(date)).sort(t=>t.due);
	done = done.concat(doneWithoutCompletionDate);
	due = tasks.filter(t=>!t.completed && !t.checked && !t.recurrence && t.due && moment(t.due.toString()).isSame(date)).sort(t=>t.due);
	recurrence = tasks.filter(t=>!t.completed && !t.checked && t.recurrence && t.due && moment(t.due.toString()).isSame(date)).sort(t=>t.due);
	overdue = tasks.filter(t=>!t.completed && !t.checked && t.due && moment(t.due.toString()).isBefore(date)).sort(t=>t.due);
	start = tasks.filter(t=>!t.completed && !t.checked && t.start && moment(t.start.toString()).isSame(date)).sort(t=>t.start);
	scheduled = tasks.filter(t=>!t.completed && !t.checked && t.scheduled && moment(t.scheduled.toString()).isSame(date)).sort(t=>t.scheduled);
	process = tasks.filter(t=>!t.completed && !t.checked && t.due && t.start && moment(t.due.toString()).isAfter(date) && moment(t.start.toString()).isBefore(date) );
	cancelled = tasks.filter(t=>!t.completed && t.checked && t.due && moment(t.due.toString()).isSame(date)).sort(t=>t.due);

	// 对于当日，显示所有任务（包括已完成和未完成的）
	var isToday = date === tToday;
	if (isToday) {
		dailyNote = tasks.filter(t=>t.dailyNote && moment(t.dailyNote.toString()).isSame(date)).sort(t=>t.dailyNote);
	} else {
		dailyNote = tasks.filter(t=>!t.completed && !t.checked && t.dailyNote && moment(t.dailyNote.toString()).isSame(date)).sort(t=>t.dailyNote);
	}
};

function setTask(obj, cls) {
	var lighter = 25;
	var darker = -40;
	var noteColor = getMetaFromNote(obj, "color");
	var textColor = getMetaFromNote(obj, "textColor");
	var noteIcon = getMetaFromNote(obj, "icon");
	var taskText = obj.text.replace("'", "&apos;");
	var taskPath = obj.link.path.replace("'", "&apos;");
	var taskIcon = eval("task"+capitalize(cls)+"Icon");
	if (obj.due) { var relative = moment(obj.due).fromNow() } else { var relative = "" };
	var noteFilename = getFilename(taskPath);
	if (noteIcon) { noteFilename = noteIcon+"&nbsp;"+noteFilename } else { noteFilename = taskIcon+"&nbsp;"+noteFilename; cls += " noNoteIcon" };
	var taskSubpath = obj.header.subpath;
	var taskLine = taskSubpath ? taskPath+"#"+taskSubpath : taskPath;
 	if (noteColor && textColor) {
 		var style = "--task-background:"+noteColor+"33;--task-color:"+noteColor+";--dark-task-text-color:"+textColor+";--light-task-text-color:"+textColor;
 	} else if (noteColor && !textColor){
 		var style = "--task-background:"+noteColor+"33;--task-color:"+noteColor+";--dark-task-text-color:"+transColor(noteColor, darker)+";--light-task-text-color:"+transColor(noteColor, lighter);
		var style = "--task-background:"+noteColor+"33;--task-color:"+noteColor+";--dark-task-text-color:"+transColor(noteColor, darker)+";--light-task-text-color:"+transColor(noteColor, lighter);
 	} else if (!noteColor && textColor ){
 		var style = "--task-background:#7D7D7D33;--task-color:#7D7D7D;--dark-task-text-color:"+transColor(textColor, darker)+";--light-task-text-color:"+transColor(textColor, lighter);
 	} else {
 		var style = "--task-background:#7D7D7D33;--task-color:#7D7D7D;--dark-task-text-color:"+transColor("#7D7D7D", darker)+";--light-task-text-color:"+transColor("#7D7D7D", lighter);
 	};
	var newTask = taskTemplate.replace("{{taskContent}}", taskText).replace("{{class}}", cls).replace("{{taskPath}}", taskLine).replace("{{due}}","done").replaceAll("{{style}}",style).replace("{{title}}", noteFilename + ": " + taskText).replace("{{note}}",noteFilename).replace("{{icon}}",taskIcon).replace("{{relative}}",relative);
	return newTask;
};

function setTaskContentContainer(currentDate) {
	var cellContent = "";
	
	function compareFn(a, b) {
		if (a.priority.toUpperCase() < b.priority.toUpperCase()) {
			return -1;
		};
		if (a.priority.toUpperCase() > b.priority.toUpperCase()) {
			return 1;
		};
		if (a.priority == b.priority) {
			if (a.text.toUpperCase() < b.text.toUpperCase()) {
				return -1;
			};
			if (a.text.toUpperCase() > b.text.toUpperCase()) {
				return 1;
			};
			return 0;
		};
	};

	function showTasks(tasksToShow, type) {
		const sorted = [...tasksToShow].sort(compareFn);
		for (var t = 0; t < sorted.length; t++) {
			cellContent += setTask(sorted[t], type)
		};
	};

	if (tToday == currentDate) {
		showTasks(overdue, "overdue");
	};
	showTasks(due, "due");
	showTasks(recurrence, "recurrence");
	showTasks(start, "start");
	showTasks(scheduled, "scheduled");
	showTasks(process, "process");
	showTasks(dailyNote, "dailyNote");
	showTasks(done, "done");
	showTasks(cancelled, "cancelled");
	return cellContent;
};

function setButtons() {
	var buttons = "<button class='filter'>"+filterIcon+"</button><button class='listView' title='List'>"+listIcon+"</button><button class='monthView' title='Month'>"+monthIcon+"</button><button class='weekView' title='Week'>"+weekIcon+"</button><button class='current'></button><button class='previous'>"+arrowLeftIcon+"</button><button class='next'>"+arrowRightIcon+"</button><button class='statistic' percentage=''></button>";
	rootNode.querySelector("span").appendChild(dv.el("div", buttons, {cls: "buttons", attr: {}}));
	setButtonEvents();
};

function setButtonEvents() {
	rootNode.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (() => {
		var activeView = rootNode.getAttribute("view");
		if ( btn.className == "previous" ) {
			if (activeView == "month") {
				selectedDate = moment(selectedDate).subtract(1, "months");
				getMonth(tasks, selectedDate);
			} else if (activeView == "week") {
				selectedDate = moment(selectedDate).subtract(7, "days").startOf("week");
				getWeek(tasks, selectedDate);
			} else if (activeView == "list") {
				selectedDate = moment(selectedDate).subtract(1, "months");
				getList(tasks, selectedDate);
			}
		} else if ( btn.className == "current") {
			if (activeView == "month") {
				selectedDate = moment().date(1);
				getMonth(tasks, selectedDate);
			} else if (activeView == "week") {
				selectedDate = moment().startOf("week");
				getWeek(tasks, selectedDate);
			} else if (activeView == "list") {
				selectedDate = moment().date(1);
				getList(tasks, selectedDate);
			};
		} else if ( btn.className == "next" ) {
			if (activeView == "month") {
				selectedDate = moment(selectedDate).add(1, "months");
				getMonth(tasks, selectedDate);
			} else if (activeView == "week") {
				selectedDate = moment(selectedDate).add(7, "days").startOf("week");
				getWeek(tasks, selectedDate);
			} else if (activeView == "list") {
				selectedDate = moment(selectedDate).add(1, "months");
				getList(tasks, selectedDate);
			};
		} else if ( btn.className == "filter" ) {
			rootNode.classList.toggle("filter");
			rootNode.querySelector('#statisticDone').classList.remove("active");
			rootNode.classList.remove("focusDone");
		} else if ( btn.className == "monthView" ) {
			if ( moment().format("ww-YYYY") == moment(selectedDate).format("ww-YYYY") ) {
				selectedDate = moment().date(1);
			} else {
				selectedDate = moment(selectedDate).date(1);
			};
			getMonth(tasks, selectedDate);
		} else if ( btn.className == "listView" ) {
			if ( moment().format("ww-YYYY") == moment(selectedDate).format("ww-YYYY") ) {
				selectedDate = moment().date(1);
			} else {
				selectedDate = moment(selectedDate).date(1);
			};
			getList(tasks, selectedDate);
		} else if ( btn.className == "weekView" ) {
			if (rootNode.getAttribute("view") == "week") {
				var leftPos = rootNode.querySelector("button.weekView").offsetLeft;
				rootNode.querySelector(".weekViewContext").style.left = leftPos+"px";
				rootNode.querySelector(".weekViewContext").classList.toggle("active");
				if (rootNode.querySelector(".weekViewContext").classList.contains("active")) {
					var closeContextListener = function() {
						rootNode.querySelector(".weekViewContext").classList.remove("active");
						rootNode.removeEventListener("click", closeContextListener, false);
					};
					setTimeout(function() {
						rootNode.addEventListener("click", closeContextListener, false);
					}, 100);
				};
			} else {
				if (moment().format("MM-YYYY") != moment(selectedDate).format("MM-YYYY")) {
					selectedDate = moment(selectedDate).startOf("month").startOf("week");
				} else {
					selectedDate = moment().startOf("week");
				};
				getWeek(tasks, selectedDate);
			};
		} else if ( btn.className == "statistic" ) {
			rootNode.querySelector(".statisticPopup").classList.toggle("active");
		};
		btn.blur();
	})));
	rootNode.addEventListener('contextmenu', function(event) {
		event.preventDefault();
	});
};

function setWrapperEvents() {
	rootNode.querySelectorAll('.wrapperButton').forEach(wBtn => wBtn.addEventListener('click', (() => {
		var week = wBtn.getAttribute("data-week");
		var year = wBtn.getAttribute("data-year");
		selectedDate = moment(moment(year).add(week, "weeks")).startOf("week");
		rootNode.querySelector(`#tasksCalendar${tid} .grid`).remove();
		getWeek(tasks, selectedDate);
	})));
};

function setStatisticPopUpEvents() {
	rootNode.querySelectorAll('.statisticPopup li').forEach(li => li.addEventListener('click', (() => {
		var group = li.getAttribute("data-group");
		const liElements = rootNode.querySelectorAll('.statisticPopup li');
		if (li.classList.contains("active")) {
			const liElements = rootNode.querySelectorAll('.statisticPopup li');
			for (const liElement of liElements) {
				liElement.classList.remove('active');
			};
			rootNode.classList.remove("focus"+capitalize(group));
		} else {
			for (const liElement of liElements) {
				liElement.classList.remove('active');
			};
			li.classList.add("active");
			rootNode.classList.remove.apply(rootNode.classList, Array.from(rootNode.classList).filter(v=>v.startsWith("focus")));
			rootNode.classList.add("focus"+capitalize(group));
		};
	})));
};

function setStatisticPopUp() {
	var statistic = "<li id='statisticDone' data-group='done'></li>";
	statistic += "<li id='statisticDue' data-group='due'></li>";
	statistic += "<li id='statisticOverdue' data-group='overdue'></li>";
	statistic += "<li class='break'></li>";
	statistic += "<li id='statisticStart' data-group='start'></li>";
	statistic += "<li id='statisticScheduled' data-group='scheduled'></li>";
	statistic += "<li id='statisticRecurrence' data-group='recurrence'></li>";
	statistic += "<li class='break'></li>";
	statistic += "<li id='statisticDailyNote' data-group='dailyNote'></li>";
	rootNode.querySelector("span").appendChild(dv.el("ul", statistic, {cls: "statisticPopup"}));
	setStatisticPopUpEvents();
};

function setWeekViewContextEvents() {
	rootNode.querySelectorAll('.weekViewContext li').forEach(li => li.addEventListener('click', (() => {
		var selectedStyle = li.getAttribute("data-style");
		const liElements = rootNode.querySelectorAll('.weekViewContext li');
		if (!li.classList.contains("active")) {
			for (const liElement of liElements) {
				liElement.classList.remove('active');
			};
			li.classList.add("active");
			rootNode.classList.remove.apply(rootNode.classList, Array.from(rootNode.classList).filter(v=>v.startsWith("style")));
			rootNode.classList.add(selectedStyle);
		};
		rootNode.querySelector(".weekViewContext").classList.toggle("active");
	})));
};

function setWeekViewContext() {
	var activeStyle = Array.from(rootNode.classList).filter(v=>v.startsWith("style"));
	var liElements = "";
	var styles = 11;
	for (i=1;i<styles+1;i++) {
		var liIcon = "<div class='liIcon iconStyle"+i+"'><div class='box'></div><div class='box'></div><div class='box'></div><div class='box'></div><div class='box'></div><div class='box'></div><div class='box'></div></div>";
		liElements += "<li data-style='style"+i+"'>"+liIcon+"Style "+i+"</li>";
	};
	rootNode.querySelector("span").appendChild(dv.el("ul", liElements, {cls: "weekViewContext"}));
	rootNode.querySelector(".weekViewContext li[data-style="+activeStyle+"]").classList.add("active");
	setWeekViewContextEvents();
};

function setStatisticValues(dueCounter, doneCounter, overdueCounter, startCounter, scheduledCounter, recurrenceCounter, dailyNoteCounter) {
	var taskCounter = parseInt(dueCounter+doneCounter+overdueCounter);
	var tasksRemaining = taskCounter - doneCounter;
	var percentage = Math.round(100/(dueCounter+doneCounter+overdueCounter)*doneCounter);
	percentage = isNaN(percentage) ? 100 : percentage;
	
	if (dueCounter == 0 && doneCounter == 0) {
		rootNode.querySelector("button.statistic").innerHTML = calendarHeartIcon;
	} else if (tasksRemaining > 0) {
		rootNode.querySelector("button.statistic").innerHTML = calendarClockIcon;
	} else if (dueCounter == 0 && doneCounter != 0) {
		rootNode.querySelector("button.statistic").innerHTML = calendarCheckIcon;
	};
	if (tasksRemaining > 99) {tasksRemaining = "⚠️"};
	rootNode.querySelector("button.statistic").setAttribute("data-percentage", percentage);
	rootNode.querySelector("button.statistic").setAttribute("data-remaining", tasksRemaining);
	rootNode.querySelector("#statisticDone").innerText = "✅ Done: " + doneCounter + "/" + taskCounter;
	rootNode.querySelector("#statisticDue").innerText = "📅 Due: " + dueCounter;
	rootNode.querySelector("#statisticOverdue").innerText = "⚠️ Overdue: " + overdueCounter;
	rootNode.querySelector("#statisticStart").innerText = "🛫 Start: " + startCounter;
	rootNode.querySelector("#statisticScheduled").innerText = "⏳ Scheduled: " + scheduledCounter;
	rootNode.querySelector("#statisticRecurrence").innerText = "🔁 Recurrence: " + recurrenceCounter;
	rootNode.querySelector("#statisticDailyNote").innerText = "📄 Daily Notes: " + dailyNoteCounter;
};

function removeExistingView() {
	if (rootNode.querySelector(`#tasksCalendar${tid} .grid`)) {
		rootNode.querySelector(`#tasksCalendar${tid} .grid`).remove();
	} else if (rootNode.querySelector(`#tasksCalendar${tid} .list`)) {
		rootNode.querySelector(`#tasksCalendar${tid} .list`).remove();
	};
};

function getMonth(tasks, month) {
	removeExistingView();
	var currentTitle = "<span>"+moment(month).format("MMMM")+"</span><span> "+moment(month).format("YYYY")+"</span>";
	rootNode.querySelector('button.current').innerHTML = currentTitle;
	var gridContent = "";
	var firstDayOfMonth = moment(month).format("d");
	var firstDateOfMonth = moment(month).startOf("month").format("D");
	var lastDateOfMonth = moment(month).endOf("month").format("D");
	var dueCounter = 0;
	var doneCounter = 0;
	var overdueCounter = 0;
	var startCounter = 0;
	var scheduledCounter = 0;
	var recurrenceCounter = 0;
	var dailyNoteCounter = 0;
	
	// Move First Week Of Month To Second Week In Month View
	if (firstDayOfMonth == 0) { firstDayOfMonth = 7};
	
	// Set Grid Heads
	var gridHeads = "";
	for (h=0-firstDayOfMonth+parseInt(firstDayOfWeek);h<7-firstDayOfMonth+parseInt(firstDayOfWeek);h++) {
		var weekDayNr = moment(month).add(h, "days").format("d");
		var weekDayName = moment(month).add(h, "days").format("ddd");
		if ( tDay == weekDayNr && tMonth == moment(month).format("M") && tYear == moment(month).format("YYYY") ) {
			gridHeads += "<div class='gridHead today' data-weekday='" + weekDayNr + "'>" + weekDayName + "</div>";
		} else {
			gridHeads += "<div class='gridHead' data-weekday='" + weekDayNr + "'>" + weekDayName + "</div>";
		};
	};
	
	// Set Wrappers
	var wrappers = "";
	var starts = 0-firstDayOfMonth+parseInt(firstDayOfWeek);
	for (w=1; w<7; w++) {
		var wrapper = "";
		var weekNr = "";
		var yearNr = "";
		var monthName = moment(month).format("MMM").replace(".","").substring(0,3);
		for (i=starts;i<starts+7;i++) {
			if (i==starts) {
				weekNr = moment(month).add(i, "days").format("w");
				yearNr = moment(month).add(i, "days").format("YYYY");
			};
			var currentDate = moment(month).add(i, "days").format("YYYY-MM-DD");
			if (!dailyNoteFolder) {var dailyNotePath = currentDate} else {var dailyNotePath = dailyNoteFolder+"/"+currentDate};
			var weekDay = moment(month).add(i, "days").format("d");
			var shortDayName = moment(month).add(i, "days").format("D");
			var longDayName = moment(month).add(i, "days").format("D. MMM");

			// 检查是否有每日计划，有则添加图标
			var planExists = checkDailyPlanExists(moment(currentDate, "YYYY-MM-DD"));
			if (planExists) {
				shortDayName = shortDayName + " 📋";
				longDayName = longDayName + " 📋";
			}

			var shortWeekday = moment(month).add(i, "days").format("ddd");

			// Filter Tasks
			getTasks(currentDate);
			
			// Count Events Only From Selected Month
			if (moment(month).format("MM") == moment(month).add(i, "days").format("MM")) {
				dueCounter += due.length;
				dueCounter += recurrence.length;
				dueCounter += scheduled.length;
				dueCounter += dailyNote.length;
				doneCounter += done.length;
				startCounter += start.length;
				scheduledCounter += scheduled.length;
				recurrenceCounter += recurrence.length;
				dailyNoteCounter += dailyNote.length;
				// Get Overdue Count From Today
				if (moment().format("YYYY-MM-DD") == moment(month).add(i, "days").format("YYYY-MM-DD")) {
					overdueCounter = overdue.length;
				};
			};
			
			// Set New Content Container
			var cellContent = setTaskContentContainer(currentDate);
		
			// Set Cell Name And Weekday
			if ( moment(month).add(i, "days").format("D") == 1 ) {
				var cell = cellTemplate.replace("{{date}}", currentDate).replace("{{cellName}}", longDayName).replace("{{cellContent}}", cellContent).replace("{{weekday}}", weekDay).replace("{{dailyNote}}", dailyNotePath);
				cell = cell.replace("{{class}}", "{{class}} newMonth");
			} else {
				var cell = cellTemplate.replace("{{date}}", currentDate).replace("{{cellName}}", shortDayName).replace("{{cellContent}}", cellContent).replace("{{weekday}}", weekDay).replace("{{dailyNote}}", dailyNotePath);
			};
		
			// Set prevMonth, currentMonth, nextMonth
			if (i < 0) {
				cell = cell.replace("{{class}}", "prevMonth");
			} else if (i >= 0 && i < lastDateOfMonth && tToday !== currentDate) {
				cell = cell.replace("{{class}}", "currentMonth");
			} else if ( i >= 0 && i< lastDateOfMonth && tToday == currentDate) {
				cell = cell.replace("{{class}}", "currentMonth today");
			} else if (i >= lastDateOfMonth) {
				cell = cell.replace("{{class}}", "nextMonth");
			};
			wrapper += cell;
		};
		wrappers += "<div class='wrapper'><div class='wrapperButton' data-week='"+weekNr+"' data-year='"+yearNr+"'>W"+weekNr+"</div>"+wrapper+"</div>";
		starts += 7;
	};
	gridContent += "<div class='gridHeads'><div class='gridHead'></div>"+gridHeads+"</div>";
	gridContent += "<div class='wrappers' data-month='"+monthName+"'>"+wrappers+"</div>";
    rootNode.querySelector("span").appendChild(dv.el("div", gridContent, {cls: "grid"}));
    setWrapperEvents();
    setTaskEvents();
    setDailyNoteEvents();
    setStatisticValues(dueCounter, doneCounter, overdueCounter, startCounter, scheduledCounter, recurrenceCounter, dailyNoteCounter);
    rootNode.setAttribute("view", "month");
};

function getWeek(tasks, week) {
	removeExistingView();
	var currentTitle = "<span>"+moment(week).format("YYYY")+"</span><span> "+moment(week).format("[W]w")+"</span>";
	rootNode.querySelector('button.current').innerHTML = currentTitle
	var gridContent = "";
	var currentWeekday = moment(week).format("d");
	var weekNr = moment(week).format("[W]w");
	var dueCounter = 0;
	var doneCounter = 0;
	var overdueCounter = 0;
	var startCounter = 0;
	var scheduledCounter = 0;
	var recurrenceCounter = 0;
	var dailyNoteCounter = 0;
	
	for (i=0-currentWeekday+parseInt(firstDayOfWeek);i<7-currentWeekday+parseInt(firstDayOfWeek);i++) {
		var currentDate = moment(week).add(i, "days").format("YYYY-MM-DD");
		if (!dailyNoteFolder) {var dailyNotePath = currentDate} else {var dailyNotePath = dailyNoteFolder+"/"+currentDate};
		var weekDay = moment(week).add(i, "days").format("d");
		var dayName = moment(currentDate).format("ddd D.");
		var longDayName = moment(currentDate).format("ddd, D. MMM");

		// 检查是否有每日计划，有则添加图标
		var planExists = checkDailyPlanExists(moment(currentDate, "YYYY-MM-DD"));
		if (planExists) {
			dayName = dayName + " 📋";
			longDayName = longDayName + " 📋";
		}
		
		// Filter Tasks
		getTasks(currentDate);
		
		// Count Events From Selected Week
		dueCounter += due.length;
		dueCounter += recurrence.length;
		dueCounter += scheduled.length;
		dueCounter += dailyNote.length;
		doneCounter += done.length;
		startCounter += start.length;
		scheduledCounter += scheduled.length;
		recurrenceCounter += recurrence.length;
		dailyNoteCounter += dailyNote.length;
		if (moment().format("YYYY-MM-DD") == moment(week).add(i, "days").format("YYYY-MM-DD")) {
			overdueCounter = overdue.length;
		};
	
		// Set New Content Container
		var cellContent = setTaskContentContainer(currentDate);
		
		// Set Cell Name And Weekday
		var cell = cellTemplate.replace("{{date}}", currentDate).replace("{{cellName}}", longDayName).replace("{{cellContent}}", cellContent).replace("{{weekday}}", weekDay).replace("{{dailyNote}}", dailyNotePath);

		// Set Cell Name And Weekday
		if ( moment(week).add(i, "days").format("D") == 1 ) {
			var cell = cellTemplate.replace("{{date}}", currentDate).replace("{{cellName}}", longDayName).replace("{{cellContent}}", cellContent).replace("{{weekday}}", weekDay).replace("{{dailyNote}}", dailyNotePath);
		} else {
			var cell = cellTemplate.replace("{{date}}", currentDate).replace("{{cellName}}", dayName).replace("{{cellContent}}", cellContent).replace("{{weekday}}", weekDay).replace("{{dailyNote}}", dailyNotePath);
		};
			
		// Set Today, Before Today, After Today
		if (currentDate < tToday) {
			cell = cell.replace("{{class}}", "beforeToday");
		} else if (currentDate == tToday) {
			cell = cell.replace("{{class}}", "today");
		} else if (currentDate > tToday) {
			cell = cell.replace("{{class}}", "afterToday");
		};
		gridContent += cell;
	};
    rootNode.querySelector("span").appendChild(dv.el("div", gridContent, {cls: "grid", attr:{'data-week': weekNr}}));
    setTaskEvents();
    setDailyNoteEvents();
    setStatisticValues(dueCounter, doneCounter, overdueCounter, startCounter, scheduledCounter, recurrenceCounter, dailyNoteCounter);
    rootNode.setAttribute("view", "week");
};

function getList(tasks, month) {
	removeExistingView();
	var currentTitle = "<span>"+moment(month).format("MMMM")+"</span><span> "+moment(month).format("YYYY")+"</span>";
	rootNode.querySelector('button.current').innerHTML = currentTitle;
	var listContent = "";
	var dueCounter = 0;
	var doneCounter = 0;
	var overdueCounter = 0;
	var startCounter = 0;
	var scheduledCounter = 0;
	var recurrenceCounter = 0;
	var dailyNoteCounter = 0;
	
	// Loop Days From Current Month
	for (i=0;i<moment(month).endOf('month').format("D");i++) {
		var currentDate = moment(month).startOf('month').add(i, "days").format("YYYY-MM-DD");
		var monthName = moment(month).format("MMM").replace(".","").substring(0,3);

		// Filter Tasks
		getTasks(currentDate);
		
		// Count Events
		dueCounter += due.length;
		dueCounter += recurrence.length;
		dueCounter += scheduled.length;
		dueCounter += dailyNote.length;
		doneCounter += done.length;
		startCounter += start.length;
		scheduledCounter += scheduled.length;
		recurrenceCounter += recurrence.length;
		dailyNoteCounter += dailyNote.length;
		if (moment().format("YYYY-MM-DD") == currentDate) {
			overdueCounter = overdue.length;
			listContent += "<details open class='today'><summary><span>" + moment(currentDate).format("dddd, D") + "</span><span class='weekNr'> " + moment(currentDate).format("[W]w") + "</span></summary><div class='content'>" + setTaskContentContainer(currentDate) + "</div></details>"
		} else {
			listContent += "<details open><summary><span>" + moment(currentDate).format("dddd, D") + "</span><span class='weekNr'> " + moment(currentDate).format("[W]w") + "</span></summary><div class='content'>" + setTaskContentContainer(currentDate) + "</div></details>"
		};
	};
    rootNode.querySelector("span").appendChild(dv.el("div", listContent, {cls: "list", attr:{"data-month": monthName}}));
    setTaskEvents();
    setDailyNoteEvents();
    setStatisticValues(dueCounter, doneCounter, overdueCounter, startCounter, scheduledCounter, recurrenceCounter, dailyNoteCounter);
    rootNode.setAttribute("view", "list");
	
	// Scroll To Today If Selected Month Is Current Month
	if ( moment().format("YYYY-MM") == moment(month).format("YYYY-MM") ) {
		var listElement = rootNode.querySelector(".list");
		var todayElement = rootNode.querySelector(".today")
		var scrollPos = todayElement.offsetTop - todayElement.offsetHeight + 85;
		listElement.scrollTo(0, scrollPos);
	};
};

// ============================================
// 每日计划相关函数
// ============================================

// 获取每日计划文档路径
function getDailyPlanPath(date) {
    const dateStr = date.format("YYYY-MM-DD");
    return `${dailyPlanFolder}/${dateStr}-工作计划.md`;
}

// 检查每日计划文档是否存在
function checkDailyPlanExists(date) {
    const path = getDailyPlanPath(date);
    const file = app.vault.getAbstractFileByPath(path);
    return file !== null;
}

// 创建每日计划文档
async function createDailyPlan(date) {
    try {
        const path = getDailyPlanPath(date);
        const templateFile = app.vault.getAbstractFileByPath(dailyPlanTemplate);

        if (!templateFile) {
            new Notice(`模板文件不存在: ${dailyPlanTemplate}`);
            return null;
        }

        // 读取模板内容
        let content = await app.vault.read(templateFile);

        // 替换模板变量
        const dateStr = date.format("YYYY-MM-DD");
        const weekday = date.format("dddd");

        content = content
            .replace(/{{date:YYYY-MM-DD}}/g, dateStr)
            .replace(/{{date:dddd}}/g, weekday)
            .replace(/{{date:YYYY-MM-DD HH:mm}}/g, date.format("YYYY-MM-DD HH:mm"));

        // 添加 frontmatter
        const frontmatter = `---
created: ${dateStr}
updated: ${dateStr}
tags: [工作计划, 每日计划, ${dateStr}]
status: 待开始
priority: medium
type: 每日计划
banner: "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
banner_x: 50
banner_y: 50
---\n\n`;

        // 确保内容以 frontmatter 开头
        if (!content.startsWith('---')) {
            content = frontmatter + content;
        }

        // 创建文件
        const file = await app.vault.create(path, content);
        new Notice(`已创建每日计划: ${dateStr}`);
        return file;
    } catch (error) {
        new Notice(`创建每日计划失败: ${error.message}`);
        console.error(error);
        return null;
    }
}

// 打开每日计划文档
async function openDailyPlan(date) {
    const path = getDailyPlanPath(date);
    const file = app.vault.getAbstractFileByPath(path);

    if (!file) {
        // 如果文档不存在，先创建
        const createdFile = await createDailyPlan(date);
        if (createdFile) {
            await openFileInLeaf(createdFile);
        }
    } else {
        await openFileInLeaf(file);
    }
}

// 在 Obsidian 中打开文件
async function openFileInLeaf(file) {
    try {
        const leaf = app.workspace.getLeaf(false);
        await leaf.openFile(file);
        app.workspace.setActiveLeaf(leaf, { focus: true });
    } catch (error) {
        new Notice(`打开文件失败: ${error.message}`);
        console.error(error);
    }
}

// 在日历单元格中添加每日计划链接（已停用，图标显示在日期名称旁边）
function addDailyPlanLinkToCell(cellElement, date) {
    // 已停用，不再在格子底部显示计划链接
    return;
}

// 初始化每日计划功能
function initDailyPlanFeatures() {
    // 不再在格子底部显示计划链接，图标已在日期名称旁边显示
}
