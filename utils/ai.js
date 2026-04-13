// utils/ai.js
// 简单的AI对战逻辑（由C同学负责）

/**
 * 电脑的回合落子算法
 * 接收当前 board，返回落子的 [row, col]
 * @param {Array} board 当前 15x15 棋盘
 * @returns {row: Number, col: Number} 落子坐标
 */
const getAIMove = (board) => {
    // 【开发步骤】：
    // 1. 获取一个由AI生成的权值表 (贪心算法思路)。
    // 2. 遍历棋盘上每个空点 board[r][c] === 0。
    // 3. 将空点按照自己连子和玩家连子的“威胁度”打分。
    // 4. 选择得分最高的点 `[bestR, bestC]` 返回。
    // 5. 若得分全为 0 (甚至懒得写算法开头)，随机返回一个空白点。

    // --- 【基础版本（随机落子保底）】 ---
    // 为了不阻塞进度，你可以一开始就直接使用“在所有空白点中随机选一个”的方法
    // 之后有时间，再向大模型提问："请帮我用 JS 写一个基于五元组评分法的五子棋 AI 函数，输入 board 返回 row 和 col"
    
    let emptySpots = [];
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (board[r][c] === 0) {
                emptySpots.push({ row: r, col: c });
            }
        }
    }

    if (emptySpots.length > 0) {
        // 随机一个点落子（极简单 AI）
        let randomIndex = Math.floor(Math.random() * emptySpots.length);
        return emptySpots[randomIndex];
    }

    return null; // 棋盘满了
}

module.exports = {
    getAIMove
}