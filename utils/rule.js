// utils/rule.js
// ⚠️ 这是一个临时占位文件（Stub），为了让C同学（你）的代码在没有B同学代码的情况下也能独立运行！
// 当B同学完成他的工作后，直接用他的代码全覆盖替换这个文件即可，你的 game.js 不需要改动一行代码。

/**
 * 判断胜负 (临时简易版：永远返回不胜利，为了让你能跑通技能流程)
 */
const checkWin = (board, lastX, lastY) => {
  // TODO: 这里应该是B同学去写的8个方向(横、竖、左斜、右斜)连五判定
  // 为了不阻塞你开发 C 的部分，我们暂时返回 false
  return false; 
}

/**
 * 切换轮到的玩家 (临时简易版)
 */
const switchPlayer = (currentPlayer) => {
  return currentPlayer === 1 ? 2 : 1;
}

/**
 * 获取空棋盘数据 (临时简易版)
 */
const resetGame = () => {
  let board = [];
  for (let r = 0; r < 15; r++) { 
     board.push(new Array(15).fill(0)); 
  }
  return board;
}

module.exports = {
  checkWin,
  switchPlayer,
  resetGame
}