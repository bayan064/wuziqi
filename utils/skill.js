// utils/skill.js
// 技能系统核心逻辑（由C同学负责）

/**
 * 获取随机的三项技能
 * 供 game.js 在开局时调用
 */
const getRandomSkills = (count) => {
    // 基础技能库，包含ID，名称，描述，冷却回合
    const allSkills = [
        { id: 1, name: '飞沙走石', maxCooldown: 5, cooldown: 0 },
        { id: 2, name: '定身术', maxCooldown: 4, cooldown: 0 },
        { id: 3, name: '时空回溯', maxCooldown: 3, cooldown: 0 },
        { id: 4, name: '天降神兵', maxCooldown: 5, cooldown: 0 },
        { id: 5, name: '借力打力', maxCooldown: 4, cooldown: 0 },
        { id: 6, name: '同归于尽', maxCooldown: 6, cooldown: 0 },
        { id: 7, name: '金蝉脱壳', maxCooldown: 3, cooldown: 0 },
        { id: 8, name: '双倍快乐', maxCooldown: 5, cooldown: 0 },
        { id: 9, name: '迷雾重重', maxCooldown: 3, cooldown: 0 },
        { id: 10, name: '复制粘贴', maxCooldown: 4, cooldown: 0 }
    ];

    // TODO: 实现随机挑选 count 个不重复的技能
    
    // 【开发步骤】：
    // 1. 打乱 allSkills 数组。
    // 2. 取前 count 个元素。
    // 3. 将其返回给页面供 UI 渲染。

    return [{ id: 1, name: '飞沙走石', maxCooldown: 5, cooldown: 0 }, { id: 2, name: '定身术', maxCooldown: 4, cooldown: 0 }, { id: 3, name: '时空回溯', maxCooldown: 3, cooldown: 0 }];
}

/**
 * 触发某个技能效果
 * @param {Number} skillId 要释放的技能ID
 * @param {Array} board 当前15x15棋盘数据
 * @param {Number} player 释放技能的玩家(默认1，代表黑棋)
 * @returns {Object} { success: boolean, newBoard: Array }
 */
const useSkill = (skillId, board, player) => {
    
    // 深拷贝棋盘，避免污染引用
    let newBoard = JSON.parse(JSON.stringify(board));
    let success = false;

    // TODO: 完善十个核心技能的逻辑实现
    // 【开发步骤】：
    // 1. 使用 switch(skillId) 来区分技能逻辑。
    // 2. 比如 '飞沙走石'（移除最近落子）：遍历 board，找到最新落的 3 颗连续棋子置为 0。
    // 3. 比如 '同归于尽'：计算棋盘中心点 [7, 7] 附近的 3x3 区域，全部置为 0。
    // 4. 判断成功后返回 true，以及修改后的 newBoard 给主页面渲染。
    
    switch (skillId) {
        case 1:
            // 示例：清除最近落的3颗棋子 (难度较高，需要保存历史落子记录 history)
            // 可以简化为：随机移除对手的3颗棋子
            success = true;
            break;
            
        case 6: // 同归于尽
            for (let r = 6; r <= 8; r++) {
                for (let c = 6; c <= 8; c++) {
                    newBoard[r][c] = 0;
                }
            }
            success = true;
            break;
            
        // ... (其它技能用相似的方式实现，遇到困难可以让大模型单独生成某一个特定技能的核心代码)
            
        default:
            console.log("未实现的技能，ID:", skillId);
            break;
    }

    return { success, newBoard };
}

module.exports = {
    getRandomSkills,
    useSkill
}