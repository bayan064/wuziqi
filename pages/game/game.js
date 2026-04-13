// pages/game/game.js

import { drawBoard, getBoardPosition } from '../../utils/board.js';
const ruleConfig = require('../../utils/rule.js')
const skillConfig = require('../../utils/skill.js')
const aiConfig = require('../../utils/ai.js')

Page({
  data: {
    board: [],
    currentPlayer: 1,
    isGameOver: false,
    skills: [],
    canvasSize: 600,
    gameMode: 'ai',

    // ✅ 新增：控制动画同步
    ready: false
  },

  onLoad(options) {
    const mode = options.mode || 'ai'
    this.setData({ gameMode: mode })
    this.initGame()
  },

  onReady() {
    this.initCanvas();
  },

  // === 游戏初始化 ===
  initGame() {
    const newBoard = ruleConfig.resetGame 
      ? ruleConfig.resetGame() 
      : this._createEmptyBoard();
    
    const newSkills = skillConfig.getRandomSkills 
      ? skillConfig.getRandomSkills(3) 
      : [];

    const skillPages = [];
    for (let i = 0; i < newSkills.length; i += 3) {
      skillPages.push(newSkills.slice(i, i + 3));
    }

    this.setData({
      board: newBoard,
      currentPlayer: 1,
      isGameOver: false,
      skills: newSkills,
      skillPages: skillPages
    });

    if (this._ctx) {
      this.drawBoard();
    }
  },

  _createEmptyBoard() {
    let board = [];
    for (let r = 0; r < 15; r++) {
      board.push(new Array(15).fill(0));
    }
    return board;
  },

  // === Canvas 初始化（关键修改点）===
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#boardCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;

        const canvas = res[0].node;
        this._ctx = canvas.getContext('2d');

        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        this._ctx.scale(dpr, dpr);

        this.setData({ canvasSize: res[0].width });

        // ✅ 先画棋盘（但此时页面是隐藏的）
        this.drawBoard();

        // ✅ 关键：延迟一帧再显示整个页面（保证同步）
        setTimeout(() => {
          this.setData({
            ready: true
          });
        }, 50);
      });
  },

  drawBoard() {
    if (this._ctx) {
      drawBoard(this._ctx, this.data.board, this.data.canvasSize);
    }
  },

  // === 点击落子 ===
  handleBoardClick(e) {
    if (this.data.isGameOver || this.data.currentPlayer !== 1) return;
    
    const x = e.changedTouches[0].x;
    const y = e.changedTouches[0].y;
    
    let pos = getBoardPosition(x, y, this.data.canvasSize);
    
    if (pos.row !== -1 && pos.col !== -1) {
       this.processMove(pos.row, pos.col);
    }
  },

  // === 对战逻辑 ===
  processMove(row, col) {
    let board = this.data.board;

    if (board[row][col] !== 0) return;

    board[row][col] = this.data.currentPlayer;
    this.setData({ board });
    this.drawBoard();

    if (ruleConfig.checkWin && ruleConfig.checkWin(board, row, col)) {
        this.handleWin(this.data.currentPlayer);
        return;
    }

    if (this.data.currentPlayer === 1) {
        this.updateSkillCooldowns();
    }

    let nextPlayer = ruleConfig.switchPlayer 
      ? ruleConfig.switchPlayer(this.data.currentPlayer) 
      : (this.data.currentPlayer === 1 ? 2 : 1);

    this.setData({ currentPlayer: nextPlayer });

    if (nextPlayer === 2) {
       setTimeout(() => {
           this.processAITurn();
       }, 500);
    }
  },

  processAITurn() {
    if(aiConfig.getAIMove) {
        let aiMove = aiConfig.getAIMove(this.data.board);
        if(aiMove) {
            this.processMove(aiMove.row, aiMove.col);
        }
    }
  },

  // === 技能 ===
  handleSkillClick(e) {
    if (this.data.isGameOver || this.data.currentPlayer !== 1) return;
    
    let index = e.currentTarget.dataset.index;
    let skill = this.data.skills[index];

    if(skill.cooldown > 0) {
        wx.showToast({ title: '技能冷却中', icon: 'none' });
        return;
    }

    if(skillConfig.useSkill) {
        let result = skillConfig.useSkill(
          skill.id, 
          this.data.board, 
          this.data.currentPlayer
        );

        if(result.success) {
            let newSkills = [...this.data.skills];
            newSkills[index].cooldown = skill.maxCooldown;
            
            this.setData({ 
                board: result.newBoard,
                skills: newSkills 
            });

            this.drawBoard();

            let nextPlayer = ruleConfig.switchPlayer 
              ? ruleConfig.switchPlayer(this.data.currentPlayer) 
              : 2;

            this.setData({ currentPlayer: nextPlayer });

            setTimeout(() => { this.processAITurn(); }, 500);

            wx.showToast({ 
              title: `使用了 ${skill.name}`, 
              icon: 'none' 
            });
        }
    }
  },

  updateSkillCooldowns() {
    let newSkills = this.data.skills.map(s => {
        if(s.cooldown > 0) s.cooldown--;
        return s;
    });
    this.setData({ skills: newSkills });
  },

  // === 结束 / 重开 ===
  handleWin(winner) {
    this.setData({ isGameOver: true });
    wx.showModal({
      title: '游戏结束',
      content: winner === 1 
        ? '黑棋 (玩家) 赢了！' 
        : '白棋 (电脑) 赢了！',
      confirmText: '重新开始',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          this.initGame();
        }
      }
    });
  },

  handleRestart() {
    this.initGame();
  }
});