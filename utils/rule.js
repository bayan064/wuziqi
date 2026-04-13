// utils/rule.js - 五子棋游戏逻辑模块

function checkWin(board, lastX, lastY) {
  const player = board[lastX][lastY];
  if (player === 0) return false;

  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  for (let [dx, dy] of directions) {
    let count = 1;
    
    for (let step = 1; step <= 4; step++) {
      const x = lastX + dx * step;
      const y = lastY + dy * step;
      if (x < 0 || x >= 15 || y < 0 || y >= 15) break;
      if (board[x][y] === player) count++;
      else break;
    }
    
    for (let step = 1; step <= 4; step++) {
      const x = lastX - dx * step;
      const y = lastY - dy * step;
      if (x < 0 || x >= 15 || y < 0 || y >= 15) break;
      if (board[x][y] === player) count++;
      else break;
    }
    
    if (count >= 5) return true;
  }
  
  return false;
}

function switchPlayer(currentPlayer) {
  return currentPlayer === 1 ? 2 : 1;
}

function resetGame() {
  return Array(15).fill().map(() => Array(15).fill(0));
}

module.exports = {
  checkWin: checkWin,
  switchPlayer: switchPlayer,
  resetGame: resetGame
};
