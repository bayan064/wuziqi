/**
 * 技能五子棋 - 棋盘绘制与坐标模块 (A 模块 - 正式版)
 */

/**
 * 绘制正式棋盘和棋子
 */
const drawBoard = (ctx, board, canvasSize) => {
  if (!ctx || !board) return;
  const cellSize = canvasSize / 15;
  const margin = cellSize / 2;

  // 1. 绘制背景（正式版加入原木色）
  ctx.fillStyle = '#E3C16F'; // 优质木材色
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // 2. 绘制网格线
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i < 15; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(margin, margin + i * cellSize);
    ctx.lineTo(canvasSize - margin, margin + i * cellSize);
    ctx.stroke();
    // 竖线
    ctx.beginPath();
    ctx.moveTo(margin + i * cellSize, margin);
    ctx.lineTo(margin + i * cellSize, canvasSize - margin);
    ctx.stroke();
  }

  // 3. 绘制星位（五子棋特有的5个黑点，让棋盘变专业）
  const stars = [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]];
  ctx.fillStyle = '#333333';
  stars.forEach(([r, c]) => {
    ctx.beginPath();
    ctx.arc(margin + c * cellSize, margin + r * cellSize, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  // 4. 绘制棋子
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== 0) {
        ctx.beginPath();
        // 核心：将数组坐标 (r, c) 准确映射回画布像素
        ctx.arc(margin + c * cellSize, margin + r * cellSize, cellSize * 0.42, 0, 2 * Math.PI);
        
        if (board[r][c] === 1) { // 黑子
          ctx.fillStyle = '#000000';
          ctx.fill();
        } else if (board[r][c] === 2) { // 白子
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
}

/**
 * 将像素坐标精准转换为数组下标
 */
const getBoardPosition = (x, y, canvasSize) => {
  const cellSize = canvasSize / 15;
  const margin = cellSize / 2;

  // 使用 Math.round 实现精准落子吸附
  const col = Math.round((x - margin) / cellSize);
  const row = Math.round((y - margin) / cellSize);

  if (row >= 0 && row < 15 && col >= 0 && col < 15) {
    return { row, col };
  }
  return null; // 点到棋盘外返回 null，方便 C 同学判断
}

// 统一使用 ES6 导出，方便 C 同学 import
export {
  drawBoard,
  getBoardPosition
}