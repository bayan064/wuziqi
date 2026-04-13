// utils/board.js
// ⚠️ 这是一个临时占位文件（Stub），为了让C同学（你）的代码在没有A同学代码的情况下也能独立运行！
// 当A同学完成他的工作后，直接用他的代码全覆盖替换这个文件即可，你的 game.js 不需要改动一行代码。

/**
 * 绘制棋盘和棋子 (临时简易版)
 */
const drawBoard = (ctx, board, canvasSize) => {
  if (!ctx || !board) return;
  const cellSize = canvasSize / 15;
  
  // 清空画板
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  
  // 1. 画最基础的网格线
  ctx.strokeStyle = '#8b4513'; // 使用更深的棕色，贴合卡通风格
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 15; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(cellSize / 2, cellSize / 2 + i * cellSize);
    ctx.lineTo(canvasSize - cellSize / 2, cellSize / 2 + i * cellSize);
    ctx.stroke();
    // 竖线
    ctx.beginPath();
    ctx.moveTo(cellSize / 2 + i * cellSize, cellSize / 2);
    ctx.lineTo(cellSize / 2 + i * cellSize, canvasSize - cellSize / 2);
    ctx.stroke();
  }

  // 2. 画棋子
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== 0) {
        ctx.beginPath();
        ctx.arc(cellSize / 2 + c * cellSize, cellSize / 2 + r * cellSize, cellSize * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = board[r][c] === 1 ? 'black' : 'white';
        ctx.fill();
        if (board[r][c] === 2) {
          ctx.strokeStyle = '#555'; // 白棋加个深灰色边显示清楚点
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }
}

/**
 * 将点击的像素坐标转换为棋盘行列坐标 (临时简易版)
 */
const getBoardPosition = (x, y, canvasSize) => {
  const cellSize = canvasSize / 15;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  
  // 边界保护
  if (row >= 0 && row < 15 && col >= 0 && col < 15) {
    return { row, col };
  }
  return { row: -1, col: -1 };
}

module.exports = {
  drawBoard,
  getBoardPosition
}