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
    // 初始化历史记录快照和被移除棋子记录，以及效果池
    this.boardHistory = [];
    this.removedPieces = [];
    this.playerEffects = {
      1: { silence: 0, protect: 0 },
      2: { silence: 0, protect: 0 }
    };

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
    // ----- [B同学技能拦截]：如果当前处于“选择棋子”的状态（比如飞沙走石） -----
    if (this.data.pendingSkill) {
      if (board[row][col] === 0) {
        wx.showToast({ title: '不能选空地，请点击对手棋子', icon: 'none' });
        return;
      }
      if (board[row][col] === this.data.currentPlayer) {
        wx.showToast({ title: '不能拿自己的棋子', icon: 'none' });
        return;
      }
      
      this.executeSkill(this.data.pendingSkill.index, this.data.pendingSkill.skill, { target: { row, col } });
      this.setData({ pendingSkill: null });
      return; 
    }
    // -------------------------------------------------------------
    // 判断该位置是否已有棋子
    if (board[row][col] !== 0) return;

    // 果是玩家(黑)落子，在真正改变棋盘前记录当前快照（用于时光倒流）
    if (this.data.currentPlayer === 1) {
        if (!this.boardHistory) this.boardHistory = [];
        this.boardHistory.push(JSON.parse(JSON.stringify(board)));
    }

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

    // 更新特效倒计时（减少自身身上挂着的所有buff/debuff的时间）
    if(this.playerEffects[this.data.currentPlayer]) {
        for(let eff in this.playerEffects[this.data.currentPlayer]) {
            if(this.playerEffects[this.data.currentPlayer][eff] > 0) {
                this.playerEffects[this.data.currentPlayer][eff]--;
            }
        }
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
    
    // 如果已经处于选中技能状态，再次点击取消
    if (this.data.pendingSkill) {
        this.setData({ pendingSkill: null });
        wx.showToast({ title: '已取消技能目标选择', icon: 'none' });
        return;
    }

    let pObj = this.getSkillInfoFromEvent(e);
    if(!pObj) return;
    let { index, skill } = pObj;

    // 如果冷却中，不可用
    if(skill.cooldown > 0) {
        wx.showToast({ title: '技能冷却中', icon: 'none' });
        return;
    }

    // 【检查沉默状态】
    if (this.playerEffects[this.data.currentPlayer].silence > 0) {
        wx.showToast({ title: '受到静如止水效果，技能被封印！', icon: 'none' });
        return;
    }

    // 尝试执行（如果没有target看看是否要求target）
    this.executeSkill(index, skill, null);
  },

  getSkillInfoFromEvent(e) {
    let index = e.currentTarget.dataset.index;
    // index是摊平后的index，在pages里找
    let globalIndex = 0;
    let targetSkill = null;
    for(let page of this.data.skillPages) {
        for(let s of page) {
            if(globalIndex === index) { targetSkill = s; break; }
            globalIndex++;
        }
        if(targetSkill) break;
    }
    return targetSkill ? { index, skill: targetSkill } : null;
  },

  executeSkill(index, skill, extraTargetInfo) {
    if(!skillConfig.useSkill) return;

    let extraContext = { history: this.boardHistory, removedPieces: this.removedPieces, playerEffects: this.playerEffects };
    if (extraTargetInfo) { extraContext = Object.assign(extraContext, extraTargetInfo); }

    let result = skillConfig.useSkill(skill.id, this.data.board, this.data.currentPlayer, extraContext);
    
    if (result.requiresTarget) {
        wx.showToast({ title: '请在棋盘上点击目标棋子', icon: 'none' });
        this.setData({ pendingSkill: { index, skill } });
        return;
    }

    if(result.success) {
        // 如果返回了清理后的历史记录（如时光倒流），则同步回去
        if (result.newHistory) {
            this.boardHistory = result.newHistory;
        }
        // 如果有移出的棋子
        if (result.removedPiece) {
            if(!this.removedPieces) this.removedPieces = [];
            this.removedPieces.push(result.removedPiece);
        }
        // 如果使用了复活（移出队列减少）
        if (result.newRemovedPieces) {
            this.removedPieces = result.newRemovedPieces;
        }
        // 如果附加了特效Buff/Debuff
        if (result.applyEffect) {
            let eff = result.applyEffect;
            this.playerEffects[eff.target][eff.effect] = eff.duration;
        }

        // 更新冷却，注意这里要更新 skillPages 里的对象
        let newSkillPages = JSON.parse(JSON.stringify(this.data.skillPages));
        let gIndex = 0;
        for(let p = 0; p < newSkillPages.length; p++) {
            for(let s = 0; s < newSkillPages[p].length; s++) {
                if (gIndex === index) {
                    newSkillPages[p][s].cooldown = skill.maxCooldown;
                }
                gIndex++;
            }
        }
        
        this.setData({ 
            board: result.newBoard, // 技能改变了棋盘
            skillPages: newSkillPages 
        });
        this.drawBoard();

        // 附带胜负判断(某些破坏技能可能直接赢了)
        // 如果没赢，且此技能不需要将回合连续留给自己（比如时光倒流/或者待确定的技能），将回合让给AI
        if (!result.skipTurn) {
            let nextPlayer = ruleConfig.switchPlayer ? ruleConfig.switchPlayer(this.data.currentPlayer) : 2;
            this.setData({ currentPlayer: nextPlayer });
            setTimeout(() => { this.processAITurn(); }, 500);
        }

        wx.showToast({ title: `使用了 ${skill.name}`, icon: 'success' });
    } else if (result.msg) {
        wx.showToast({ title: result.msg, icon: 'none' });
    }
  },

  updateSkillCooldowns() {
    let newSkillPages = JSON.parse(JSON.stringify(this.data.skillPages));
    for(let p = 0; p < newSkillPages.length; p++) {
        for(let s = 0; s < newSkillPages[p].length; s++) {
            if(newSkillPages[p][s].cooldown > 0) newSkillPages[p][s].cooldown--;
        }
    }
    this.setData({ skillPages: newSkillPages });
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