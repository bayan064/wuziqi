// pages/game/game.js
// 引入 A 和 B 同学的模块
import { drawBoard, getBoardPosition } from '../../utils/board.js';
const ruleConfig = require('../../utils/rule.js')
// 引入 C 自己负责的模块
const skillConfig = require('../../utils/skill.js')
const aiConfig = require('../../utils/ai.js')

Page({
  data: {
    board: [],         // 15x15二维数组 0=空 1=黑(玩家) 2=白(电脑)
    currentPlayer: 1,  // 当前回合 (1黑，2白)
    isGameOver: false, // 游戏是否结束
    skills: [],        // 当前局生成的三个技能：{ id: '1', name: '技能名', cooldown: 0 }
    canvasSize: 600,    // canvas实际像素尺寸（供A同学使用）
    gameMode: 'ai'  // 【新增】'ai' 或 'double'
  },

  // 【修改这一块】在 pages/game/game.js 中
  onLoad(options) {
    // 接收首页传来的模式参数
    const mode = options.mode || 'ai'  // 默认人机模式
    this.setData({ gameMode: mode })
    this.initGame()
  },

  onReady() {
    // Canvas节点准备好后，初始化并交由A同学的画板模块绘制
    this.initCanvas();
  },

  // === 步骤一：游戏初始化 ===
  initGame() {
    // 1. 获取一个空的 15x15 棋盘 (调用外部模块)
    const newBoard = ruleConfig.resetGame ? ruleConfig.resetGame() : this._createEmptyBoard();
    
    // 2. 获取技能并分页 (每页3个)
    const newSkills = skillConfig.getRandomSkills ? skillConfig.getRandomSkills(3) : [];
    const skillPages = [];
    for (let i = 0; i < newSkills.length; i += 3) {
      skillPages.push(newSkills.slice(i, i + 3));
    }

    this.setData({
      board: newBoard,
      currentPlayer: 1, // 永远是玩家(黑)先手
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
    for (let r = 0; r < 15; r++) { board.push(new Array(15).fill(0)); }
    return board;
  },

  // === 步骤二：Canvas 初始化与重新绘制 ===
  initCanvas() {
    // 微信小程序特有的 Canvas 2D 获取方式
    const query = wx.createSelectorQuery();
    query.select('#boardCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;
        const canvas = res[0].node;
        this._ctx = canvas.getContext('2d');

        // 处理高分屏适配
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        this._ctx.scale(dpr, dpr);
        
        // 记录尺寸，供点击时换算坐标使用
        this.setData({ canvasSize: res[0].width });

        this.drawBoard();
      });
  },

  drawBoard() {
    // 呼叫 A 同学的绘制模块
    if (this._ctx) {
       drawBoard(this._ctx, this.data.board, this.data.canvasSize);
    }
  },

  // === 步骤三：处理点击落子 ===
  handleBoardClick(e) {
    if (this.data.isGameOver || this.data.currentPlayer !== 1) return; // 没结束且必须是玩家回合
    
    // 获取落子坐标 (触控点坐标可能需要A同学的方法换算)
    const x = e.changedTouches[0].x;
    const y = e.changedTouches[0].y;
    
    // 调用A同学提供的转换函数，把像素(x,y)转为棋盘上的行列(row, col)
    let pos = getBoardPosition(x, y, this.data.canvasSize);
    
    if (pos.row !== -1 && pos.col !== -1) {
       this.processMove(pos.row, pos.col);
    }
  },

  // === 步骤四：对战主逻辑 ===
  processMove(row, col) {
    let board = this.data.board;
    // 判断该位置是否已有棋子
    if (board[row][col] !== 0) return;

    // 落子
    board[row][col] = this.data.currentPlayer;
    this.setData({ board });
    this.drawBoard();

    // 判断胜负 (调用B同学的方法)
    if (ruleConfig.checkWin && ruleConfig.checkWin(board, row, col)) {
        this.handleWin(this.data.currentPlayer);
        return;
    }

    // 更新技能冷却时间（针对玩家）
    if (this.data.currentPlayer === 1) {
        this.updateSkillCooldowns();
    }

    // 切换玩家 (调用B同学的方法)
    let nextPlayer = ruleConfig.switchPlayer ? ruleConfig.switchPlayer(this.data.currentPlayer) : (this.data.currentPlayer === 1 ? 2 : 1);
    this.setData({ currentPlayer: nextPlayer });

    // 如果轮到AI，则调用AI落子逻辑
    if (nextPlayer === 2) {
       setTimeout(() => {
           this.processAITurn();
       }, 500); // 假装思考 0.5 秒
    }
  },

  processAITurn() {
    // 调用 C 自己的 AI 模块
    if(aiConfig.getAIMove) {
        let aiMove = aiConfig.getAIMove(this.data.board);
        if(aiMove) {
            this.processMove(aiMove.row, aiMove.col);
        }
    }
  },

  // === 步骤五：处理技能点击 ===
  handleSkillClick(e) {
    if (this.data.isGameOver || this.data.currentPlayer !== 1) return;
    
    let index = e.currentTarget.dataset.index;
    let skill = this.data.skills[index];

    // 如果冷却中，不可用
    if(skill.cooldown > 0) {
        wx.showToast({ title: '技能冷却中', icon: 'none' });
        return;
    }

    // 调用技能逻辑
    if(skillConfig.useSkill) {
        let result = skillConfig.useSkill(skill.id, this.data.board, this.data.currentPlayer);
        if(result.success) {
            // 技能施放成功，进入冷却
            let newSkills = [...this.data.skills];
            newSkills[index].cooldown = skill.maxCooldown; // 设置冷却初始值
            
            this.setData({ 
                board: result.newBoard, // 技能改变了棋盘
                skills: newSkills 
            });
            this.drawBoard();

            // 附带胜负判断(某些破坏技能可能直接赢了)
            // 如果没赢，将回合让给AI
            let nextPlayer = ruleConfig.switchPlayer ? ruleConfig.switchPlayer(this.data.currentPlayer) : 2;
            this.setData({ currentPlayer: nextPlayer });
            setTimeout(() => { this.processAITurn(); }, 500);

            wx.showToast({ title: `使用了 ${skill.name}`, icon: 'none' });
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

  // === 工具方法：处理胜利和重新开始 ===
  handleWin(winner) {
    this.setData({ isGameOver: true });
    wx.showModal({
      title: '游戏结束',
      content: winner === 1 ? '黑棋 (玩家) 赢了！' : '白棋 (电脑) 赢了！',
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
})