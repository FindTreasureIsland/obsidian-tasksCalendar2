// 每日计划助手函数
// 用于 tasksCalendar 插件集成每日计划功能

class DailyPlanHelper {
    constructor(dv) {
        this.dv = dv;
        this.dailyPlanFolder = "songzhiyong/02工作计划";
        this.dailyPlanTemplate = "puplic/00文档模板/每日工作计划模板.md";
        this.dateFormat = "YYYY-MM-DD";
    }

    // 获取每日计划文档路径
    getDailyPlanPath(date) {
        const dateStr = date.format(this.dateFormat);
        return `${this.dailyPlanFolder}/${dateStr}-工作计划.md`;
    }

    // 检查每日计划文档是否存在
    async checkDailyPlanExists(date) {
        const path = this.getDailyPlanPath(date);
        const file = app.vault.getAbstractFileByPath(path);
        return file !== null;
    }

    // 创建每日计划文档
    async createDailyPlan(date) {
        try {
            const path = this.getDailyPlanPath(date);
            const templateFile = app.vault.getAbstractFileByPath(this.dailyPlanTemplate);

            if (!templateFile) {
                new Notice(`模板文件不存在: ${this.dailyPlanTemplate}`);
                return null;
            }

            // 读取模板内容
            let content = await app.vault.read(templateFile);

            // 替换模板变量
            const dateStr = date.format(this.dateFormat);
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
template: ${this.dailyPlanTemplate}
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
    async openDailyPlan(date) {
        const path = this.getDailyPlanPath(date);
        const file = app.vault.getAbstractFileByPath(path);

        if (!file) {
            // 如果文档不存在，先创建
            const createdFile = await this.createDailyPlan(date);
            if (createdFile) {
                await this.openFileInLeaf(createdFile);
            }
        } else {
            await this.openFileInLeaf(file);
        }
    }

    // 在 Obsidian 中打开文件
    async openFileInLeaf(file) {
        try {
            const leaf = app.workspace.getLeaf(false);
            await leaf.openFile(file);
            app.workspace.setActiveLeaf(leaf, { focus: true });
        } catch (error) {
            new Notice(`打开文件失败: ${error.message}`);
            console.error(error);
        }
    }

    // 获取今日计划文档
    getTodayPlan() {
        const today = window.moment();
        const path = this.getDailyPlanPath(today);
        const file = app.vault.getAbstractFileByPath(path);
        return file;
    }

    // 获取最近几天的计划文档
    getRecentPlans(days = 7) {
        const plans = [];
        for (let i = 0; i < days; i++) {
            const date = window.moment().subtract(i, 'days');
            const path = this.getDailyPlanPath(date);
            const file = app.vault.getAbstractFileByPath(path);
            if (file) {
                plans.push({
                    date: date.format(this.dateFormat),
                    file: file,
                    path: path
                });
            }
        }
        return plans;
    }

    // 生成每日计划统计信息
    async getDailyPlanStats() {
        const today = window.moment();
        const todayPlan = this.getTodayPlan();
        const recentPlans = this.getRecentPlans(30);

        return {
            todayExists: todayPlan !== null,
            todayPath: this.getDailyPlanPath(today),
            recentCount: recentPlans.length,
            lastPlan: recentPlans.length > 0 ? recentPlans[0] : null
        };
    }

    // 在日历单元格中显示每日计划链接
    renderDailyPlanLink(date, cellElement) {
        const dateStr = date.format(this.dateFormat);
        const path = this.getDailyPlanPath(date);
        const file = app.vault.getAbstractFileByPath(path);

        // 创建链接元素
        const linkDiv = document.createElement('div');
        linkDiv.className = 'daily-plan-link';
        linkDiv.style.cssText = `
            margin-top: 4px;
            padding: 2px 4px;
            background: var(--background-modifier-hover);
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        const icon = document.createElement('span');
        icon.textContent = file ? '📋' : '📄';
        icon.style.fontSize = '10px';

        const text = document.createElement('span');
        text.textContent = file ? '查看计划' : '创建计划';

        linkDiv.appendChild(icon);
        linkDiv.appendChild(text);

        // 添加点击事件
        linkDiv.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.openDailyPlan(date);
        });

        // 添加到单元格
        if (cellElement) {
            cellElement.appendChild(linkDiv);
        }

        return linkDiv;
    }
}

// 导出函数供 tasksCalendar 使用
function initDailyPlanHelper(dv) {
    return new DailyPlanHelper(dv);
}

// 如果直接运行，初始化并显示今日计划状态
if (typeof dv !== 'undefined') {
    const helper = initDailyPlanHelper(dv);

    // 显示今日计划状态
    const stats = helper.getDailyPlanStats();

    if (stats.todayExists) {
        dv.paragraph(`✅ **今日计划已创建**: [[${stats.todayPath}]]`);
    } else {
        dv.paragraph(`📝 **今日计划未创建**: 点击下方按钮创建`);
        dv.button("创建今日计划", async () => {
            await helper.createDailyPlan(window.moment());
        });
    }

    // 显示最近计划
    const recentPlans = helper.getRecentPlans(5);
    if (recentPlans.length > 0) {
        dv.header(3, "最近计划");
        dv.list(recentPlans.map(p => `[[${p.path}]] - ${p.date}`));
    }
}

// 导出供其他脚本使用
if (typeof module !== 'undefined') {
    module.exports = { initDailyPlanHelper, DailyPlanHelper };
}