const {
  sendMsg,
  sendPersonMsg
} = require('./tcp');
const myFs = require('./fs');
const myPKList = {
  '11': '@每日一学 a',
  '22': '@每日一学 霸王枪',
  '33': '@每日一学 破魂枪',
  '44': '@每日一学 诸神枪'
}

module.exports = (name) => {
  const regs = require('./regs');
  const handle = require('./handle')(name);
  return {
    // 入口函数
    init(content, fromGroup, fromUser) {

      const message = content.replace(/\n/g, '<br>');
      // 判断是否治疗
      if (handle.isName(message, regs.name, this.wx.teamPerson) && message.includes('当前组队成员')) {
        const hps = message.match(/(?<=\[爱心\]).*?(?=\/)/g)
        const minHp = Math.min(...hps)
        if (minHp < this.wx.zyt.minHp) {
          this.wx.zyt.isHeal = true
        }
      }

      // 获取队伍列表
      if (handle.isName(message, regs.name) && message.includes('当前组队成员')) {

        this.wx.zyt.goods.forEach(i => {
          i.status = false
        })
        const goodsNames = this.wx.zyt.goods.map(i => i.name)
        const newTeamPerson = handle.getTeamPerson(message, regs.teamPerson);
        const names = this.wx.teamPerson.map(i => i.name)

        const teamPerson = newTeamPerson.reduce((arr, item) => {
          const index = names.indexOf(item.name)
          if (~index) {
            arr.push(this.wx.teamPerson[index])
          } else {
            arr.push(item)
          }
          return arr
        }, [])
        this.wx.teamPerson.map(j => j.hp)
        this.wx.teamPerson = teamPerson


        this.wx.teamPerson.forEach(i => {
          if (i.name === this.config.name) {
            i.wxid = this.config.wxid;
          }
          const _index = goodsNames.indexOf(i.name)
          if (~_index) {
            this.wx.zyt.goods[_index].status = true
          } else {
            this.wx.zyt.goods.push({
              name: i.name,
              status: true,
              info: []
            })
          }
        })
        this.wx.zyt.goods = this.wx.zyt.goods.filter(i => i.status)
        // 信息存储
        this.config.teamPerson = JSON.parse(JSON.stringify(this.wx.teamPerson))
        myFs.writeFileJSON(this.wxid, this.config, '队伍成员')
        return sendMsg(fromGroup, '队伍成员: ' + this.wx.teamPerson.map(i => i.name).join(','))
      }

      // 镇妖塔#指令
      if (message.includes('镇妖塔#指令')) {
        sendMsg(fromGroup, JSON.stringify(this.wx.personBind))
      }
      // 镇妖塔
      if (handle.isName(message, regs.name, this.wx.teamPerson) && message.includes('镇妖塔每日1次')) {
        this.wx.zyt.isOpen = true
        this.wx.zyt.yzNames = []
        this.wx.zyt.isStop = false
        this.wx.zyt.goods.length && this.wx.zyt.goods.forEach(i => {
          i.info = []
        })
        // setTimeout(() => {
        //   sendMsg(fromGroup, '队伍')
        // }, 500)
        return
      }
      // 判断是否进入镇妖塔模式
      if (this.wx.zyt.isOpen) {
        if (handle.isName(message, regs.name, this.wx.teamPerson) ||
          handle.isName(message, regs.pkName, this.wx.teamPerson) ||
          handle.isName(message, regs.bossOver, this.wx.teamPerson)) {
          this.handleRobotBind(message, fromGroup);
        }
      }
    },
    initPalyer(content, fromGroup, fromUser, data) {
      // 玩家发的指令
      const message = content.replace(/\n/g, '<br>');
      this.handlePalyerBind(message, fromGroup, fromUser, data)
    },
    handleSetPKBossPerson(arr) {
      const names = this.wx.zyt.pkBossList.map(i => i.name)
      const newBoss = arr.map(i => ({
        name: i,
        hp: 0
      })).filter(i => i.name && !names.includes(i.name))
      this.wx.zyt.pkBossList = [...this.wx.zyt.pkBossList.filter(i => arr.includes(i.name)), ...newBoss]
    },
    // 玩家发的指令
    handlePalyerBind(message, fromGroup, fromUser, data) {
      // 关闭镇妖塔模式
      if (message.includes('所有人已退出本层暗殿') || message.includes('队长阵亡')) {
        let msg = '关闭成功'
        this.wx.zyt.isOpen = false;
        this.wx.zyt.layer = 9
        this.clearAutoPKInterval()
        this.closeRunAwayTask()
        sendMsg(fromGroup, msg)
        if (fromGroup === '39335379557@chatroom') {
          setTimeout(() => {
            sendMsg(fromGroup, '副本#100')
          }, 2000)
        }
        return
      }
      if (message.includes('查看#数据#') && fromGroup === fromUser) {
        const info = message.split('#').slice(2)
        return sendMsg(fromGroup, JSON.stringify(this.wx[info[0]]))
      }
      // 设置类
      if (message.includes('设置#血量#')) {
        const info = message.split('#').slice(2)
        if (info[0] && !isNaN(info[0])) {
          // 信息存储
          this.wx.zyt.minHp = Number(info[0])
          // 信息存储
          this.config.minHp = Number(info[0])
          myFs.writeFileJSON(this.wxid, this.config, '设置#血量')
        } else {
          sendMsg(fromGroup, '设置血量失败')
        }

      }
      if (message.includes('设置#队伍名称#')) {
        const info = message.split('#').slice(2)
        if (info[0]) {
          // 信息存储
          this.wx.zyt.dw = info[0]
          // 信息存储
          this.config.dw = info[0]
          myFs.writeFileJSON(this.wxid, this.config, '设置#队伍名称')
        } else {
          sendMsg(fromGroup, '设置队伍名称失败')
        }

      }
      if (message.includes('设置#玩家#')) {

        const info = message.split('#').slice(2)
        if (info[0]) {
          // 信息存储
          this.wx.zyt.smrList = info
          // 信息存储
          this.config.smrList = info
          myFs.writeFileJSON(this.wxid, this.config, '设置#玩家')
        } else {
          sendMsg(fromGroup, '设置玩家失败')
        }
      }
      if (message.includes('设置#快捷配置技能#')) {
        const info = message.split('#').slice(2)
        // 信息存储
        this.config.skillList = info.map(i => i.replace(/\//g, '#'))
        myFs.writeFileJSON(this.wxid, this.config, '队伍成员')
      }

      if (message.includes('设置#队友#')) {
        // 设置#队友#1 - 5（发送队伍的位置）#层数（数字）#技能1#技能2#技能3#技能4#妙手（有就配置）
        const info = message.split('#')

        const index = info[2]
        const layer = info[3]

        const name = this.wx.teamPerson[index - 1].name

        if (info[8]) {
          const str = `${name}#设置技能#群体治疗#${info[8]}`
          this.config.skillList.push(str)
        }
        const str = `${name}#设置技能#基础#${info.slice(4, 8).join('#')}#${layer}`
        // 信息存储
        this.config.skillList.push(str)
        myFs.writeFileJSON(this.wxid, this.config, '队伍成员')
      }
      // 设置队伍人员wxid
      if (message.includes('设置#wx')) {
        const nameArr = message.split('#').slice(2)
        const wxidMatch = (data.signature || '').match(/(?<=CDATA\[).*?(?=\])/) ||
          (data.signature || '').match(/(?<=<atuserlist>).*?(?=<\/atuserlist>)/)
        if (nameArr && nameArr.length && wxidMatch) {
          const index = this.wx.teamPerson.findIndex(i => i.name === nameArr[0])
          if (~index) {
            this.wx.teamPerson[index].wxid = wxidMatch[0];
            this.config.teamPerson[index].wxid = wxidMatch[0];
            myFs.writeFileJSON(this.wxid, this.config, '快捷配置BOSS')
          }
        }
      }

      if (message.includes('设置#name#')) {
        const info = message.split('#').slice(2)
        if (info && info.length) {
          this.name = info[0]
          handle.name = info[0]
          // 信息存储
          this.config.name = info[0]
          myFs.writeFileJSON(this.wxid, this.config, '设置#name')
        }
      }
      if (message.includes('设置#快捷配置BOSS#')) {
        const info = message.split('#').slice(2)
        const names = this.config.pkBossList.map(i => i.name)
        const newBoss = info[0].split('/').map(i => ({
          name: i,
          hp: 0
        })).filter(i => i.name && !names.includes(i.name))
        this.config.pkBossList = [...this.config.pkBossList.filter(i => info[0].split('/').includes(i.name)), ...newBoss]
        // 信息存储
        myFs.writeFileJSON(this.wxid, this.config, '快捷配置BOSS')
        sendMsg(fromGroup, '攻击BOSS人员: ' + JSON.stringify(this.config.pkBossList.map(i => i.name)))
      }
      if (message.includes('设置#高层#')) {
        const info = message.split('#').slice(2)
        const names = this.config.moreLayer.pkBossList.map(i => i.name)
        if (info[1] && !isNaN(info[1])) {
          this.config.moreLayer.layer = Number(info[1])
        }
        const newBoss = info[0].split('/').map(i => ({
          name: i,
          hp: 0
        })).filter(i => i.name && !names.includes(i.name))
        this.config.moreLayer.pkBossList = [...this.config.moreLayer.pkBossList.filter(i => info[0].split('/').includes(i.name)), ...newBoss]
        this.wx.zyt.moreLayer = this.config.moreLayer
        // 信息存储
        myFs.writeFileJSON(this.wxid, this.config, '快捷配置高层BOSS')
        sendMsg(fromGroup, '高层攻击BOSS人员: ' + JSON.stringify(this.config.moreLayer.pkBossList.map(i => i.name)) + '，层数：' + this.config.moreLayer.layer)
      }
      if (message.includes('设置#镇妖塔名称#')) {
        const info = message.split('#').slice(2)
        if (info && info.length) {
          // 信息存储
          this.config.zyt = info[0]
          myFs.writeFileJSON(this.wxid, this.config, '镇妖塔名称')
        } else {
          sendMsg(fromGroup, "指令错误")
        }
      }
      if (message.includes('设置#逃跑名称#')) {
        const info = message.split('#').slice(2)
        if (info && info.length) {
          this.wx.zyt.runAway.name = info[0]
          // 信息存储
          this.config.runAwayName = info[0]
          myFs.writeFileJSON(this.wxid, this.config, '逃跑名称')
        } else {
          sendMsg(fromGroup, "指令错误")
        }
      }
      if (message.includes('设置#方向1#') && !message.includes('格式为')) {
        let msg = ''
        try {
          const str = message.split('#').slice(2)[0]
          const arr = str.split(',')
          arr.forEach((i, index) => {
            const names = i.split('/')
            this.wx.direction[index].showName = names[0]
            this.wx.direction[index].person = names[1] || '1'
          });
          const list = this.wx.direction.map(i => `${i.name}->${i.showName}/${i.person}`)
          // 信息存储
          this.config.direction = JSON.parse(JSON.stringify(this.wx.direction))
          myFs.writeFileJSON(this.wxid, this.config, '方向')
          msg = '更新方向1成功' + JSON.stringify(list)
        } catch (error) {
          msg = "更新方向失败, 格式: 设置#方向#向前,向后,向左,向右"
        }
        sendMsg(fromGroup, msg)
      }
      if (message.includes('设置#方向2#') && !message.includes('格式为')) {
        let msg = ''
        try {
          this.wx['direction-fz'] = [{ name: '向前', showName: '前', person: '1' }, { name: '向后', showName: '后', person: '1' }, { name: '向左', showName: '左', person: '1' }, { name: '向右', showName: '右', person: '1' }]
          const str = message.split('#').slice(2)[0]
          const arr = str.split(',')
          arr.forEach((i, index) => {
            const names = i.split('/')
            this.wx['direction-fz'][index].showName = names[0]
            this.wx['direction-fz'][index].person = names[1] || '1'
          });
          const list = this.wx['direction-fz'].map(i => `${i.name}->${i.showName}/${i.person}`)
          // 信息存储
          this.config['direction-fz'] = JSON.parse(JSON.stringify(this.wx['direction-fz']))
          myFs.writeFileJSON(this.wxid, this.config, '方向')
          msg = '更新方向2成功' + JSON.stringify(list)
        } catch (error) {
          msg = "更新方向失败, 格式: 设置#方向#向前,向后,向左,向右"
        }
        sendMsg(fromGroup, msg)
      }
      if (message.includes('设置#18层#')) {
        const arr = message.split('#').slice(2).filter(Boolean)
        if (arr.length) {
          this.wx.zyt.layer18 = arr
          // 信息存储
          this.config.layer18 = JSON.parse(JSON.stringify(this.wx.zyt.layer18))
          myFs.writeFileJSON(this.wxid, this.config, '18层')
        }
      }
      if (message.includes('设置#19层#')) {
        const arr = message.split('#').slice(2).filter(Boolean)
        if (arr.length) {
          this.wx.zyt.layer19 = arr
          // 信息存储
          this.config.layer19 = JSON.parse(JSON.stringify(this.wx.zyt.layer19))
          myFs.writeFileJSON(this.wxid, this.config, '19层')
        }
      }
      if (message.includes('设置#20层#')) {
        const arr = message.split('#').slice(2).filter(Boolean)
        if (arr.length) {
          this.wx.zyt.layer20 = arr
          // 信息存储
          this.config.layer20 = JSON.parse(JSON.stringify(this.wx.zyt.layer20))
          myFs.writeFileJSON(this.wxid, this.config, '20层')
        }
      }
      // 快捷配置
      if (message === '快捷配置') {
        this.handleOptionTeam()
        return
      }

      // 镇妖塔#资源
      if (message.includes('查看#资源')) {
        const goods = this.wx.zyt.goods.map(i => {
          const info = i.info.map(i => `${i.goodsName}: ${i.num}`).join('\n')
          return `<${i.name}>\n${info || '无资源'}`
        }).join('\n')
        sendMsg(fromGroup, goods)
      }
      // 查看方向
      if (message.includes('查看#方向1')) {
        const list = this.wx.direction.map(i => `${i.name}->${i.showName}`)
        const msg = JSON.stringify(list)
        return sendMsg(fromGroup, msg)
      }

      if (message.includes('查看#方向2')) {
        const list = this.wx['direction-fz'].map(i => `${i.name}->${i.showName}`)
        const msg = JSON.stringify(list)
        return sendMsg(fromGroup, msg)
      }

      if (message.includes('开启#回血')) {
        this.wx.zyt.recoverInfo.isOpen = true
        return sendMsg(fromGroup, '开启成功')
      }
      if (message.includes('关闭#回血')) {
        this.wx.zyt.recoverInfo.isOpen = false
        return sendMsg(fromGroup, '关闭成功')
      }

      if (message.includes('开启#秒杀') && this.wx.zyt.isOpen) {
        this.wx.zyt.ms = true
        this.clearAutoPKInterval()
        this.openZyt(fromGroup, 10000)
        return sendMsg(fromGroup, '开启秒杀成功')
      }
      if (message.includes('关闭#秒杀') && this.wx.zyt.isOpen) {
        this.wx.zyt.ms = false
        this.clearAutoPKInterval()
        this.openZyt(fromGroup)
        return sendMsg(fromGroup, '关闭秒杀成功')
      }

      // 镇妖塔#确认自动打塔
      if (message.includes('镇妖塔#开始')) {
        this.clearAutoPKInterval()
        // 初始化配置
        this.initTaskOption(fromGroup)
        this.handleOptionTeam(fromGroup)
        setTimeout(() => {
          sendMsg(fromGroup, this.wx.direction[0].showName)
          this.wx.zyt.location = ''
          this.wx.zyt.lastLocation = this.wx.direction[0].showName
        }, 2000)
        // 
        // 自动化队列
        this.openZyt(fromGroup)
      }
      // 暗殿开始
      if (message.includes('暗殿#开始#')) {
        this.wx.zyt.isOpen = true
        this.wx.zyt.yzNames = []
        this.wx.zyt.isStop = false
        const arr = message.split('#').slice(2).filter(Boolean);
        if (arr.length) {
          this.clearAutoPKInterval()
          // 初始化配置
          this.initTaskOption(fromGroup)
          this.handleOptionTeam(fromGroup)
          this.handleSetPKBossPerson(arr);
          setTimeout(() => {
            this.wx.zyt.isBoss = true
            this.isZYTBoss = false
            this.wx.zyt.location = '向前'
            this.wx.zyt.lastLocation = this.wx.direction[0].showName
          }, 2000)
          // 
          // 自动化队列
          this.openZyt(fromGroup);
        }
      }
      // 遗迹开始
      if (message.includes('遗迹#开始')) {
        this.wx.yj.forEach((item, index) => {
          if (item.yjTimer) {
            clearInterval(this.wx.yj[index].yjTimer)
            this.wx.yj[index].yjTimer = null
          }
        });
        this.wx.zyt.isOpen = true
        this.wx.zyt.yzNames = []
        this.wx.zyt.isStop = false
        const arr = message.split('#').slice(2).filter(Boolean);
        if (arr.length) {
          const yj = [];
          const names = []
          arr.reduce((ar, val) => {
            const info = val.split('/')
            ar.push(info[0])
            yj.push({
              name: info[0],
              location: info[1] || '左',
              run: info[2] || '逃',
              isJy: false,
              yjTimer: null,
            })
            return ar
          }, names)
          this.wx.yj = yj
          this.clearAutoPKInterval()
          // 初始化配置
          this.initTaskOption(fromGroup)
          this.handleOptionTeam(fromGroup)
          this.handleSetPKBossPerson(names);
          setTimeout(() => {
            this.wx.zyt.isBoss = true
            this.isZYTBoss = false
            this.wx.zyt.location = '向前'
            this.wx.zyt.lastLocation = this.wx.direction[0].showName
          }, 2000)
          // 
          // 自动化队列
          this.openZyt(fromGroup);
        }
      }
      if (message.includes('遗迹#打精英')) {
        const arr = message.split('#').slice(2).filter(Boolean);
        arr.forEach(i => {
          const index = (this.wx.yj || []).findIndex(j => i === j.name)
          if (~index) {
            this.wx.yj[index].isJy = true
          }
        })
      }
      // 镇妖塔#重置攻击
      if (message.includes('镇妖塔#重置攻击')) {
        this.wx.zyt.pking = {}
      }
      // 镇妖塔#基础技能
      if (message.includes('镇妖塔#基础技能')) {
        const list = this.wx.zyt.pkList.map(i => i.cdName + ': ' + i.cdDate)
        sendMsg(fromGroup, JSON.stringify(list))
      }
      // 设置用户技能
      if (message.includes('#设置技能#')) {
        this.handleSetSkill(message)
      }
      // 设置攻打boss人选
      if (message.includes('攻击BOSS人员#')) {
        const arr = message.split('#');
        if (arr.length < 2 || !arr[1]) {
          return
        }
        this.handleSetPKBossPerson(arr.slice(1))

      }
      // 设置禁用人员
      if (message.includes('禁用人员#')) {
        const arr = message.split('#');
        this.wx.zyt.disableNames = arr.slice(1).filter(Boolean)
      }
      // 镇妖塔#暂停
      if (message.includes('镇妖塔#暂停')) {
        this.wx.zyt.isStop = true
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
      }
      // 镇妖塔#继续
      if (message.includes('镇妖塔#继续')) {
        this.wx.zyt.isStop = false
      }
      // 开启逃跑
      if (message.includes('镇妖塔#开启逃跑')) {
        this.closeRunAwayTask()
        this.openRunAwayTask(fromGroup)
      }
      // 关闭逃跑
      if (message.includes('镇妖塔#关闭逃跑')) {
        this.closeRunAwayTask()
      }
    },

    openZyt(fromGroup, time = 2000) {
      let refreshPKNum = 0
      this.wx.zyt.autoPKTimer = setInterval(() => {
        refreshPKNum++
        if (refreshPKNum > 30 && !this.wx.zyt.pking.cdName) {
          refreshPKNum = 0;
          this.handleRefreshList()
        }
        const date = Date.now()
        if (this.wx.zyt.isStop || this.wx.zyt.recovering) {
          if (this.wx.yj.length === 0 || !this.wx.zyt.isHeal) {
            return
          }
        }
        if (this.wx.zyt.pking.cdName || this.wx.zyt.healing.cdName) return
        // console.log(this.wx.zyt.location)
        if (this.wx.zyt.isHeal) {
          let list = this.wx.zyt.healList
          if (!list.length) {
            this.wx.zyt.isStop = true
            return sendMsg(fromGroup, '无治疗技能，停止pk')
          }
          const recoverInfo = this.wx.zyt.recoverInfo
          if (recoverInfo.isOpen) {
            if (recoverInfo.time < date) {
              this.wx.zyt.recoverInfo.num = 0
              if (fromGroup === '39335379557@chatroom') {
                sendMsg(fromGroup, '回血')
              }
              this.wx.zyt.recovering = true
              if (this.stopTimer) {
                clearTimeout(this.stopTimer)
                this.stopTimer = null
              }
              this.stopTimer = setTimeout(() => {
                const len = this.wx.teamPerson ? this.wx.teamPerson.length : 99
                if (this.wx.zyt.recoverInfo.num !== len) {
                  const time = Number(this.wx.zyt.recoverInfo.time || '') || new Date().getTime()
                  this.wx.zyt.recoverInfo.time = time + 10 * 60 * 1000 + ''
                } else {
                  this.wx.zyt.isHeal = false
                }
                this.wx.zyt.recovering = false

              }, 20000)
              return sendMsg(fromGroup, '回')
            }
          }
          const item = list[0]
          if (!item.cdTime || item.cdTime < date) {
            // 清除上次多余定时器
            if (this.wx.zyt.healingTimer) {
              clearTimeout(this.wx.zyt.healingTimer)
              this.wx.zyt.healingTimer = null
            }

            this.wx.zyt.healing = Object.assign({}, item);
            const index = this.wx.zyt.healList.map(i => i.cdName).indexOf(item.cdName);
            this.wx.zyt.healList.splice(index, 1)
            setTimeout(() => {
              sendMsg(fromGroup, item.cdName);
            }, 3000)
            this.wx.zyt.healingTimer = this.handleMoreTask('healList', 'healing')
          }
        } else if (this.wx.zyt.location) {
          if (this.wx.zyt.ms && this.wx.zyt.layer >= 21 && !this.wx.zyt.isBoss) {
            if (fromGroup === '39335379557@chatroom') {
              sendMsg(fromGroup, myPKList['22'])
            } else if (this.wx.zyt.gwInfo.mg && this.wx.zyt.layer <= 25) {
              sendMsg(fromGroup, '秒杀咯')
            }
            return
          }
          // 逃跑过程中 不打
          if (this.wx.zyt.runing || !this.wx.zyt.location) return
          // 超过20层 非Boss不打
          if (this.wx.zyt.layer >= 21 && !this.wx.zyt.isBoss) return
          // 过滤出不在验证的人
          let list = this.wx.zyt.pkList.filter(i => !this.wx.zyt.yzNames.includes(i.name) && i.layer >= this.wx.zyt.layer && !this.wx.zyt.disableNames.includes(i.name))
          // 打boss 过滤出打boss的人
          if (this.wx.zyt.smrList && this.wx.zyt.isSMR && this.wx.zyt.smrList.length) {
            list = list.filter(i => this.wx.zyt.smrList.includes(i.name))
          } else if (this.wx.zyt.isBoss) {
            const pkBossNames = this.wx.zyt.pkBossList.map(i => i.name)
            list = list.filter(i => pkBossNames.includes(i.name))
          }
          // 判断攻击列表
          if (list.length > 0) {
            let item = {}
            const pkL = list.filter(i => i.cdTime < date)
            if (this.isZYTBoss && pkL.length) {
              this.wx.teamPerson.map(i => i.hp)
              const pkBossHps = this.wx.zyt.pkBossList.sort((a, b) => a.hp - b.hp)
              const bHps = pkBossHps.map(i => i.hp)
              const maxHp = Math.max(...bHps)
              const s = this.wx.zyt.bossInfo || 0
              for (let i = 0; i < pkBossHps.length; i++) {
                const skill = pkL.filter(j => pkBossHps[i].name === j.name)
                if (!skill.length) {
                  continue
                }
                const pkPerson = this.wx.teamPerson.find(j => pkBossHps[i].name === j.name)
                const newHp = Number(pkBossHps[i].hp) || ((maxHp || (s - 4000)) + 2000)
                if (newHp + 800 < Number(pkPerson.hp)) {
                  const hps = this.wx.teamPerson.map(j => j.hp)
                  const min = Math.min(...hps)
                  if (newHp / 2 + 800 < Number(min)) {
                    const index = list.findIndex(j => j.name === skill[0].name && j.cdName === skill[0].cdName)
                    if (~index) {
                      list.splice(index, 1)
                      list.push(skill[0])
                      item = skill[0]
                      break;
                    }
                  }
                }
              }
            }
            // 额外的处理
            if (this.isZYTBoss && !item.cdName && pkL.length) {
              this.wx.zyt.isHeal = true
              return
            }
            if (!item.cdName) {
              item = list[0]
            }
            if (!item.cdTime || item.cdTime < date) {
              // 清除上次多余定时器
              if (this.wx.zyt.pkingTimer) {
                clearTimeout(this.wx.zyt.pkingTimer)
                this.wx.zyt.pkingTimer = null
              }

              this.wx.zyt.pking = Object.assign({}, item);
              const index = this.wx.zyt.pkList.map(i => i.cdName).indexOf(item.cdName);
              this.wx.zyt.pkList.splice(index, 1)
              this.wx.zyt.pkingTimer = this.handleMoreTask('pkList', 'pking')
              // 是否本人攻击
              this.wx.zyt.pkover = false
              setTimeout(() => {
                if (item.name === '诛天k少') {
                  sendMsg(fromGroup, myPKList[item.cdName])
                } else {
                  sendMsg(fromGroup, item.cdName);
                }
              }, 3000)
            }
          } else {
            this.wx.zyt.isStop = true
            return sendMsg(fromGroup, '暂无攻击人员, 停止攻击')
          }
        } else {
          // console.log(this.name, 123, 'error')
        }
      }, time)
    },

    handleOptionTeam(fromGroup) {
      const {
        skillList,
        pkBossList
      } = this.config
      skillList.forEach(i => {
        this.handleSetSkill(i, fromGroup)
      })
      this.wx.zyt.pkBossList = pkBossList

      sendMsg(fromGroup, '配置ok')
    },

    // 游戏机器人发的指令
    handleRobotBind(message, fromGroup) {
      const gameName1 = handle.getGameName(message, regs.name)
      const gameName2 = handle.getGameName(message, regs.pkName)
      const nn = gameName2 || gameName1
      const yjIndex = (this.wx.yj || []).findIndex(i => nn === i.name)


      if (message.includes('验证码')) {
        const arr = (message.match(regs.name) || []).filter(Boolean);
        if (!arr || !arr.length) return
        if (!this.wx.zyt.yzNames.includes(arr[0])) {
          this.wx.zyt.yzNames.push(arr[0])

          const str = message.replace(/<br>/g, '<\/>').replace(/[^a-z]/g, '')
          const yzm = str.slice(str.length - 5)
          if (yzm) {
            const index = this.wx.teamPerson.findIndex(i => i.name === arr[0])
            if (~index) {
              const wxid = this.wx.teamPerson[index].wxid || fromGroup
              sendMsg(wxid, `${this.wx.teamPerson[index].name} 验证码: ${yzm}`)
            }
          }
        }
      }
      // 遗迹
      if (~yjIndex) {
        if (message.includes('你已阵亡, 请发【复活】') || message.includes('已退出遗迹')) {
          if (this.wx.yj[yjIndex].yjTimer) {
            clearInterval(this.wx.yj[yjIndex].yjTimer)
            this.wx.yj[yjIndex].yjTimer = null;
          }
          this.wx.yj = this.wx.yj.filter(i => nn !== i.name)
          this.wx.zyt.disableNames = this.wx.zyt.disableNames.filter(i => nn !== i)
          if (this.wx.yj.length) {
            this.handleSetPKBossPerson(this.wx.yj.map(i => i.name))
          } else {
            this.wx.zyt.isOpen = false;
            this.wx.zyt.layer = 9
            this.wx.yj = [];
            this.clearAutoPKInterval()
            this.closeRunAwayTask()
            sendMsg(fromGroup, '遗迹无人员， 已关闭！')
          }
          return
        }
        if (message.includes('未遭遇怪物, 搜寻怪物指令') || message.includes('九死一生')) {
          if (this.wx.yj[yjIndex].yjTimer) {
            clearInterval(this.wx.yj[yjIndex].yjTimer)
            this.wx.yj[yjIndex].yjTimer = null;
          }
          this.wx.zyt.isStop = true
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.yj[yjIndex].location)
            setTimeout(() => {
              sendMsg(fromGroup, this.wx.yj[yjIndex].location)
            }, 8000)
          }, 4000)
          return
        }
        if (message.includes('你正在遗迹中溜达') || message.includes('已遭遇怪物并被包围')) {
          if (this.wx.yj[yjIndex].yjTimer) {
            clearInterval(this.wx.yj[yjIndex].yjTimer)
            this.wx.yj[yjIndex].yjTimer = null;
          }
          if (message.includes('遗迹精英') && !this.wx.yj[yjIndex].isJy || message.includes('遗迹BOSS')) {
            if (!this.wx.zyt.disableNames.includes(nn)) {
              this.wx.zyt.disableNames.push(nn)
            }
            const time = 60 * 1000 + 3500;
            setTimeout(() => {
              if (this.wx.yj[yjIndex]) {
                sendMsg(fromGroup, this.wx.yj[yjIndex].run)
              }
            }, 2000)

            this.wx.yj[yjIndex].yjTimer = setInterval(() => {
              if (this.wx.yj[yjIndex]) {
                sendMsg(fromGroup, this.wx.yj[yjIndex].run)
              }
            }, time)
          } else {
            this.wx.zyt.disableNames = this.wx.zyt.disableNames.filter(i => nn !== i)
          }
          this.wx.zyt.isStop = false
          return
        }
        if (message.includes('逃跑失败')) {
          const reg = /(?<=血量: ).*?(?=\/)/
          const arr = message.match(reg)
          if (arr && arr[0] < this.wx.zyt.minHp) {
            this.wx.zyt.isHeal = true
          }
        }
        if (message.includes('遗迹守卫') && message.includes('剩余生命')) {
          this.taskNum = 0
          const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
          const reg = /(?<=剩余生命\[ ).*?(?= \])/g
          const regCD = /(?<=技能恢复时间：).*?(?=<br>)/g
          const arr = message.match(reg) || [];
          let date = this.wx.zyt.pking.cdDate
          let time = this.wx.zyt.pking.cdTime
          if (!message.includes('重置本次CD')) {
            const dates = message.match(regCD)
            if (!dates || !dates.length) return
            date = nowDate + ' ' + dates[0]
            time = new Date(date).getTime()
          }
          if (arr && arr[arr.length - 1] < this.wx.zyt.minHp) {
            this.wx.zyt.isHeal = true
          }
          this.handleSetPKList(date, time)
          return
        }
      }

      // 关闭镇妖塔模式
      if (message.includes('队伍已退出镇妖塔')) {
        let msg = '镇妖塔模式关闭成功'
        this.wx.zyt.isOpen = false;
        this.wx.zyt.layer = 9
        this.clearAutoPKInterval()
        this.closeRunAwayTask()
        sendMsg(fromGroup, msg)
        setTimeout(() => {
          sendMsg(fromGroup, '副本#100')
        }, 2000)
        return
      }

      if (message.includes('验证成功')) {
        const arr = (message.match(regs.name) || []).filter(Boolean);
        if (!arr.length) return
        const index = this.wx.zyt.yzNames.indexOf(arr[0])
        if (~index) {
          this.wx.zyt.yzNames.splice(index, 1)
          return sendMsg(fromGroup, arr[0] + ': 验证成功')
        }
      }
      if (message.includes('陷阱(↑)') ||
        message.includes('沼泽(↑)') ||
        message.includes('洞穴(↑)') ||
        message.includes('毒雾(↑)') ||
        message.includes('熔岩(↑)')) {
        const item = this.wx.direction.find(i => i.name === '向前')
        if (item) {
          this.wx.zyt.lastLocation = item.showName
          this.wx.zyt.isHeal = true
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.zyt.lastLocation)
          }, 2000)
        } else {
          this.wx.zyt.location = '向前'
          this.wx.zyt.lastLocation = ''
        }
      }
      if (message.includes('陷阱(↓)') ||
        message.includes('沼泽(↓)') ||
        message.includes('洞穴(↓)') ||
        message.includes('毒雾(↓)') ||
        message.includes('熔岩(↓)')) {
        const item = this.wx.direction.find(i => i.name === '向后')
        if (item) {
          this.wx.zyt.lastLocation = item.showName
          this.wx.zyt.isHeal = true
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.zyt.lastLocation)
          }, 2000)
        } else {
          this.wx.zyt.location = '向后'
          this.wx.zyt.lastLocation = ''
        }
      }
      if (message.includes('陷阱(←)') ||
        message.includes('沼泽(←)') ||
        message.includes('洞穴(←)') ||
        message.includes('毒雾(←)') ||
        message.includes('熔岩(←)')) {
        const item = this.wx.direction.find(i => i.name === '向左')
        if (item) {
          this.wx.zyt.lastLocation = item.showName
          this.wx.zyt.isHeal = true
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.zyt.lastLocation)
          }, 2000)
        } else {
          this.wx.zyt.location = '向左'
          this.wx.zyt.lastLocation = ''
        }
      }
      if (message.includes('陷阱(→)') ||
        message.includes('沼泽(→)') ||
        message.includes('洞穴(→)') ||
        message.includes('毒雾(→)') ||
        message.includes('熔岩(→)')) {
        const item = this.wx.direction.find(i => i.name === '向右')
        if (item) {
          this.wx.zyt.lastLocation = item.showName
          this.wx.zyt.isHeal = true
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.zyt.lastLocation)
          }, 2000)
        } else {
          this.wx.zyt.location = '向右'
          this.wx.zyt.lastLocation = ''
        }
      }
      if (message.includes('未发现怪物')) {
        setTimeout(() => {
          sendMsg(fromGroup, this.wx.zyt.lastLocation || '向左')
        }, 10000)
      }
      // 治疗
      if (message.includes('回血成功') || message.includes('无需回血')) {
        this.wx.zyt.recoverInfo.num += 1
        if (!message.includes('无需回血')) {
          const hps = message.match(/(?<=\[爱心\]).*?(?=\/)/g)
          const _index = this.wx.teamPerson.findIndex(j => j.name == gameName1)
          if (~_index) {
            this.wx.teamPerson[_index].hp = hps[0]
          }
          const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
          const date = nowDate + ' ' + message.match(/(?<=下次回血时间：).*?(?=<br>)/g)[0]
          const time = new Date(date).getTime()
          this.wx.zyt.recoverInfo.data = date
          this.wx.zyt.recoverInfo.time = time + 3000 + ''
        } else {
          const time = new Date().getTime()
          this.wx.zyt.recoverInfo.time = time + 3 * 60 * 1000 + ''
        }

        return
      }
      if (message.includes('使用【妙手回春】队伍回血')) {
        this.taskNum = 0
        const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
        const date = nowDate + ' ' + message.split('技能恢复时间：')[1]
        const time = new Date(date).getTime()
        this.handleChangeHealList(date, time)
        const hps = message.match(/(?<=\[爱心\]).*?(?=\/)/g)
        // const names = message.replace(/[\uD83D\uDD31]|[\uE031]|[\uDD31]/g, '').match(/(?<= ).*?(?=<br>)/g).filter((i, index) => (index + 1) % 2
        const names = [];
        message.replace(/[\uD83D\uDD31]|[\uE031]|[\uDD31]/g, '').split('<br>').forEach((i) => {
          const str = i + '<br>'
          const arr = str.match(/(?<= ).*?(?=<br>)/g)
          if (!str.includes('@') && arr && (arr[0] || arr[0] === '') && !arr[0].includes('[爱心]')) {
            names.push(arr[0])
          }
        });
        names.forEach((i, index) => {
          const _index = this.wx.teamPerson.findIndex(j => j.name == i)
          if (~_index) {
            this.wx.teamPerson[_index].hp = hps[index]
          } else {
            const _index = this.wx.teamPerson.findIndex(j => j.name == i.slice(0, i.length - 1))
            if (~_index) {
              this.wx.teamPerson[_index].hp = 99999
            }
          }
        })
        this.wx.zyt.isHeal = false
      }
      // 逃跑成功
      if ((message.includes('逃跑成功') && message.includes('追都追不上'))) {
        const item = this.wx.direction.find(i => i.name === this.wx.zyt.location)
        const lastLocation = item ? item.showName : this.wx.zyt.location
        if (lastLocation) {
          this.wx.zyt.lastLocation = lastLocation
        }
        this.wx.zyt.location = ''
        this.wx.zyt.runing = false;
        // 清除定时器
        if (this.wx.zyt.runAway.timer) {
          clearTimeout(this.wx.zyt.runAway.timer)
          this.wx.zyt.runAway.timer = null
        }
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        this.wx.zyt.runAway.timer = this.handleRunInfo(fromGroup)
      }
      // 方向
      if (message.includes('您镇妖塔未满30分钟, 大厅BOSS还未出现')) {
        if (this.wx.zyt.location) {
          if (this.wx.zyt.isBoss) {
            this.wx.zyt.isBoss = false
          }
          let item = ''
          let _lastLocationObj = { name: '' }
          let flag = true
          if (this.wx.zyt.lastLocation) {
            _lastLocationObj = this.wx.direction.find(i => i.showName === this.wx.zyt.lastLocation)
            if (!_lastLocationObj && this.wx['direction-fz'].length) {
              flag = false
              _lastLocationObj = this.wx['direction-fz'].find(i => i.showName === this.wx.zyt.lastLocation)
            }
          }

          if (this.wx['direction-fz'].length && this.wx.zyt.location === _lastLocationObj.name && flag) {
            item = this.wx['direction-fz'].find(i => i.name === this.wx.zyt.location)
          } else {
            item = this.wx.direction.find(i => i.name === this.wx.zyt.location)
          }
          const lastLocation = item ? item.showName : this.wx.zyt.location
          this.wx.zyt.isResetLocation = true
          if (lastLocation) {
            this.wx.zyt.lastLocation = lastLocation
          } else {
            return sendMsg(fromGroup, '设置的方向异常')
          }
          this.wx.zyt.location = ''
          this.handleRunInfo(fromGroup)
          this.handleGoods(message)
        }
      }
      if (message.includes('从黑暗的角落中窜出')) {
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        this.isZYTBoss = false
        this.wx.zyt.pkover = true

        const monsterReg = /(?<=魔攻: ).*?(?=<br>)/i;
        const monsterArr = message.match(monsterReg)
        if (monsterArr && monsterArr.length) {
          this.wx.zyt.gwInfo.mg = Number(isNaN(monsterArr[0]) ? 0 : monsterArr[0])
        } else {
          this.wx.zyt.gwInfo.mg = 0
        }
        if (message.includes('还有怪物未击败')) {
          const monsterReg = /(?<=魔攻: ).*?(?=<br>)/i;
          const monsterArr = message.match(monsterReg)
          if (monsterArr && monsterArr.length) {
            this.wx.zyt.gwInfo.mg = Number(isNaN(monsterArr[0]) ? 0 : monsterArr[0])
          } else {
            this.wx.zyt.gwInfo.mg = 0
          }
          if (!this.wx.zyt.location) {
            this.wx.zyt.location = '向前'
          }
          return
        }
        if (this.wx.zyt.isResetLocation) {
          this.wx.zyt.location = ''
        }
        const reg = /(?<=安全: ).*?(?=<br>)/g
        const arr = message.match(reg);
        if (arr && arr.length) {
          const locationStr = arr[0].slice(0, 2)
          this.wx.sendLocationTimer = 12500
          if (this.wx['direction-fz'].length) {
            this.wx.sendLocationTimer = 2500
          } else {
            const item = this.wx.direction.find(i => i.showName === this.wx.zyt.lastLocation)
            const itemNew = this.wx.direction.find(i => i.name === locationStr)
            if (item && itemNew) {
              if (item.person && itemNew.person && item.person !== itemNew.person) {
                this.wx.sendLocationTimer = 2500
              }
            }
          }

          if (this.wx.zyt.layer >= 21) {
            this.wx.sendLocationTimer = 2500
          }
          this.wx.zyt.location = locationStr
          sendMsg(fromGroup, '方向: ' + this.wx.zyt.location)
        }
      }
      if (message.includes('神秘人')) {
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        this.wx.zyt.isBoss = true
        this.wx.zyt.isSMR = true
        this.isZYTBoss = false
        const location = ['向左', '向右', '向前', '向后']
        const newLoction = location.filter(i => i !== this.wx.zyt.lastLocation)
        const num = Math.floor(Math.random() * 3)
        this.wx.zyt.location = newLoction[num]
      }
      if (message.includes('未发现怪物')) {
        const location = ['向左', '向右', '向前', '向后']
        const newLoction = location.filter(i => i === this.wx.zyt.lastLocation)
        const num = Math.floor(Math.random() * 3)
        setTimeout(() => {
          sendMsg(fromGroup, newLoction[num])
        }, 3000)
      }
      // 判断是否为镇妖塔boss
      if (message.includes('极品怪变异攻击暴增') || message.includes('大量经验')) {
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        // 伤害清零
        this.wx.zyt.damage = 0
        this.wx.zyt.pkBossList.forEach(i => i.hp = 0)
        if (message.includes('极品怪变异攻击暴增')) {
          const hps = this.wx.teamPerson.map(i => i.hp)
          const minHp = Math.min(...hps)
          if (minHp < this.wx.zyt.minHp) {
            this.wx.zyt.isHeal = true
          }
          // this.wx.zyt.isHeal = true;
        }
        this.wx.zyt.isBoss = true
        this.isZYTBoss = false
      }
      if (message.includes('攻击BOSS') && message.includes('到达镇妖塔')) {
        const w = message.match(/(?<=物攻: ).*?(?= \/ 魔攻)/g)
        const m = message.match(/(?<=\/ 魔攻: ).*?(?=<br>)/g)
        if (w && w.length && m && m.length) {
          this.wx.zyt.bossInfo = Number(w[0]) > Number(m[0]) ? Number(w[0]) : Number(m[0])
        } else {
          this.wx.zyt.bossInfo = 0
          sendMsg(fromGroup, 'Boss信息识别异常')
        }
        // 伤害清零
        this.wx.zyt.damage = 0
        this.wx.zyt.pkBossList.forEach(i => i.hp = 0)
        // this.wx.zyt.isHeal = true;
        this.wx.zyt.isBoss = true
        this.isZYTBoss = true
        this.wx.zyt.location = '向左'
        if (fromGroup === '39335379557@chatroom') {
          // sendMsg(fromGroup, '镇妖塔#探索')
        }
        this.wx.zyt.isStop = true
        setTimeout(() => {
          this.wx.zyt.isStop = false
          if (this.wx.zyt.layer > 20) {
            if (this.wx.zyt.moreLayer.pkBossList && this.wx.zyt.moreLayer.pkBossList.length) {
              if (this.wx.zyt.layer >= this.wx.zyt.moreLayer.layer) {
                sendMsg(fromGroup, "天玄换装")
              }
              this.wx.zyt.pkBossList = this.wx.zyt.moreLayer.pkBossList;
            }
          }
        }, 20000)
        // sendMsg(fromGroup, '镇妖塔#探索')
      }
      // 到达镇妖塔
      if (message.includes('已到达本层大厅') || message.includes('请发【镇妖塔】查询当前状态')) {
        this.wx.zyt.isHeal = true;
        if (this.wx.zyt.layer == 18) {
          if (this.wx.zyt.layer18?.length) {
            this.handleSetPKBossPerson(this.wx.zyt.layer18)
          }
        } else if (this.wx.zyt.layer == 19) {
          if (this.wx.zyt.layer19?.length) {
            this.handleSetPKBossPerson(this.wx.zyt.layer19)
          }
        } else if (this.wx.zyt.layer == 20) {
          if (this.wx.zyt.layer20?.length) {
            this.handleSetPKBossPerson(this.wx.zyt.layer20)
          }
        }
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        this.wx.zyt.location = ''
        return sendMsg(fromGroup, this.config.zyt)
      }

      if (message.includes('冷却中') && message.includes('恢复')) {
        this.taskNum = 0
        const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
        const date = nowDate + ' ' + message.split('恢复：')[1]
        const time = new Date(date).getTime()
        // sendMsg(fromGroup, '技能恢复时间: ' + date)
        const gameName = handle.getGameName(message, regs.name)
        if (Object.keys(this.wx.zyt.pking).length) {
          if (this.wx.zyt.pking.name !== gameName) {
            return
          }
          this.handleSetPKList(date, time)
        } else if (Object.keys(this.wx.zyt.healing).length) {
          if (this.wx.zyt.healing.name !== gameName) {
            return
          }
          this.handleChangeHealList(date, time)
        }
      }

      if (message.includes('剩余生命') || message.includes('触发秒杀')) {
        this.taskNum = 0
        const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
        const reg = /(?<=剩余生命\[ ).*?(?= \])/g
        const regCD = /(?<=技能恢复时间：).*?(?=<br>)/g
        const arr = message.match(reg) || [];
        let date = this.wx.zyt.pking.cdDate
        let time = this.wx.zyt.pking.cdTime
        if (!message.includes('重置本次CD')) {
          const dates = message.match(regCD)
          if (!dates || !dates.length) return
          date = nowDate + ' ' + dates[0]
          time = new Date(date).getTime()
        }

        // sendMsg(fromGroup, date ? '技能恢复时间: ' + date : '技能重置')
        if (!arr) {
          if (!message.includes('秒杀')) {
            return
          }
        }
        if (message.includes('秒杀') || (arr && arr[0] <= 0)) {
          this.wx.zyt.isSMR = false
          if (this.wx.zyt.isBoss) {
            this.wx.zyt.isBoss = false
          }
          let item = ''
          let _lastLocationObj = { name: '' }
          let flag = true
          if (this.wx.zyt.lastLocation) {
            _lastLocationObj = this.wx.direction.find(i => i.showName === this.wx.zyt.lastLocation)
            if (!_lastLocationObj && this.wx['direction-fz'].length) {
              flag = false
              _lastLocationObj = this.wx['direction-fz'].find(i => i.showName === this.wx.zyt.lastLocation)
            }
          }

          if (this.wx['direction-fz'].length && this.wx.zyt.location === _lastLocationObj.name && flag) {
            item = this.wx['direction-fz'].find(i => i.name === this.wx.zyt.location)
          } else {
            item = this.wx.direction.find(i => i.name === this.wx.zyt.location)
          }
          const lastLocation = item ? item.showName : this.wx.zyt.location
          this.wx.zyt.isResetLocation = true
          if (lastLocation) {
            this.wx.zyt.lastLocation = lastLocation
          } else {
            return sendMsg(fromGroup, '设置的方向异常')
          }
          this.wx.zyt.location = ''
          this.handleRunInfo(fromGroup)
          this.handleGoods(message)
        }
        if (message.includes('溅射伤害')) {
          const regName = /(?<=--- ).*?(?=\[爱心\])/g
          const regSh = /(?<=造成\[).*?(?=点\]伤害<br>)/g
          const regHP = /(?<=\[爱心\]).*?(?=<br>)/g
          const str = message + '<br>'
          const hps = str.match(regHP)
          const names = str.match(regName)
          let minHp = arr[1]
          if (this.wx.teamPerson.length === 1) {
            this.wx.teamPerson[0].hp = arr[1]
            const sh = str.match(regSh)
            const damage = Number(sh ? sh[0] : this.wx.zyt.minHp) + 2000
            if (Number(minHp) < damage) {
              this.wx.zyt.isHeal = true
            }
            this.handleSetPKList(date, time)
            return
          }

          if (hps) {
            const minHps = Math.min(...hps)
            minHp = minHps < arr[1] ? minHps : arr[1]
          }
          if (this.isZYTBoss) {
            if (!names) return
            names.forEach((i, index) => {
              const _index = this.wx.teamPerson.findIndex(j => i === j.name)

              if (_index !== -1) {
                this.wx.teamPerson[_index].hp = hps[index]
              }
            })
            const _index = this.wx.teamPerson.findIndex(j => j.name === gameName2)
            if (~_index) {
              this.wx.teamPerson[_index].hp = arr[1]
            }
          }

          const damage = str.match(regSh)[0]
          const pkBossNames = this.wx.zyt.pkBossList.map(i => i.name)
          const _index = pkBossNames.findIndex(i => i === gameName2)

          if (~_index) {
            const _damage = Number(damage < this.wx.zyt.pkBossList[_index].hp ? this.wx.zyt.pkBossList[_index].hp : damage)
            this.wx.zyt.damage = _damage
            this.wx.zyt.pkBossList[_index].hp = _damage
          }
          if (this.isZYTBoss) {
          } else {
            if (this.wx.zyt.damage + 2000 > minHp) {
              this.wx.zyt.isHeal = true
            }
          }
        } else {
          if (arr && arr[1] < this.wx.zyt.minHp) {
            this.wx.zyt.isHeal = true
          }
        }
        this.handleSetPKList(date, time)
        return
      }

      if (message.includes('已击败BOSS, 获得奖励') && message.includes('进入镇妖塔')) {
        this.taskNum = 0
        const reg = /(?<=进入镇妖塔【).*?(?=】<br>)/g
        const arr = message.match(reg)
        this.wx.zyt.pking = {}
        this.wx.zyt.pkList.unshift(this.wx.zyt.pking)
        const {
          pkBossList
        } = this.config
        this.wx.zyt.pkBossList = pkBossList
        sendMsg(fromGroup, this.wx.zyt.dw)
        if (!arr) {
          sendMsg(fromGroup, '获取层数失败')
        } else {
          this.wx.zyt.layer = Number(arr[0])
          if (this.wx.zyt.layer > this.wx.zyt.moreLayer.layer) {
            sendMsg(fromGroup, "攻击换装")
          }
          sendMsg(fromGroup, '层数: ' + arr[0])
        }
        if (this.wx.zyt.isBoss) {
          this.wx.zyt.isBoss = false
        }
        const item = this.wx.direction.find(i => i.name === this.wx.zyt.location)
        this.wx.zyt.lastLocation = item ? item.showName : this.wx.zyt.location
        this.wx.zyt.location = ''
        this.handleRunInfo(fromGroup)
        // 更新掉落物品
        this.handleGoods(message)
        return
      }

    },


    // 清除定时器
    clearAutoPKInterval() {
      if (this.wx.zyt.autoPKTimer) {
        clearInterval(this.wx.zyt.autoPKTimer)
      }
      this.wx.zyt.autoPKTimer = null
    },

    // pk恢复算法
    handleSetPKList(date, time) {
      const obj = Object.assign({}, this.wx.zyt.pking || {})
      obj.cdDate = date
      obj.cdTime = this.wx.zyt.pking.cdTime > time ? time + 24 * 60 * 60 * 1000 : time
      if (!obj.cdName) return
      const _index = this.wx.zyt.pkList.map(i => i.cdName).indexOf(obj.cdName);
      if (_index !== -1) {
        this.wx.zyt.pkList.splice(_index, 1)
      }
      if (!date && !time) {
        this.wx.zyt.pkList.unshift(obj)
      } else {
        const arr = this.wx.zyt.pkList || []
        let index = -1
        for (let i = 0; i < arr.length; i++) {
          if (!arr[i].cdTime) continue;
          if (obj.cdTime < arr[i].cdTime) {
            index = i
            break;
          }
        }
        index = index === -1 ? arr.length : index
        this.wx.zyt.pkList.splice(index, 0, obj)
        this.wx.zyt.pkList = this.wx.zyt.pkList.filter(i => i.cdName)
      }
      this.wx.zyt.pking = {}
    },
    // 治疗恢复算法
    handleChangeHealList(date, time) {
      const healItem = Object.assign({}, this.wx.zyt.healing)
      healItem.cdDate = date
      healItem.cdTime = this.wx.zyt.healing.cdTime > time ? time + 24 * 60 * 60 * 1000 : time
      // 不是释放中的技能
      if (!healItem.cdName) return
      const arr = this.wx.zyt.healList || []
      const _index = this.wx.zyt.healList.map(i => i.cdName).indexOf(healItem.cdName);
      if (_index !== -1) {
        this.wx.zyt.healList.splice(_index, 1)
      }
      let index = -1
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i].cdTime) continue;
        if (healItem.cdTime < arr[i].cdTime) {
          index = i
          break;
        }
      }
      index = index === -1 ? arr.length : index
      this.wx.zyt.healList.splice(index, 0, healItem)
      this.wx.zyt.healing = {}
    },
    // 开启逃跑算法
    openRunAwayTask(fromGroup) {
      this.runTimer = setInterval(() => {
        const date = Date.now()
        const item = this.wx.zyt.runAway;
        if (this.wx.zyt.location && !this.wx.zyt.pking.cdName && !this.wx.zyt.isBoss && this.wx.zyt.pkover && item.cdTime < date) {
          // 秒杀期间不逃跑
          if (this.wx.zyt.ms && this.wx.zyt.gwInfo.mg && this.wx.zyt.layer >= 21 && this.wx.zyt.layer <= 25) {
            return
          }
          this.wx.zyt.runing = true
          item.cdTime = date + 60 * 1000 + 3500
          sendMsg(fromGroup, item.name)
          setTimeout(() => {
            this.wx.zyt.runing = false
          }, 10000)
        }
      }, 500)
    },
    // 关闭逃跑
    closeRunAwayTask() {
      if (this.runTimer) {
        clearInterval(this.runTimer)
        this.runTimer = null
      }
      this.wx.zyt.runing = false
    },

    // 设置技能
    handleSetSkill(message, fromGroup) {
      const arr = message.split('#');
      const index = this.wx.teamPerson.map(i => i.name).indexOf(arr[0])
      if (index === -1) {
        return sendMsg(fromGroup, '用户不存在，请核对名称')
      }
      if (arr[2] === '基础') {
        const jnList = arr.slice(3)
        let layer = 99
        if (jnList.length === 5) {
          layer = Number(jnList.pop())
        }
        this.wx.teamPerson[index].jnCD = jnList.map(i => ({
          name: arr[0],
          cdName: i,
          cdDate: '',
          cdTime: '',
          layer,
        }))
        // sendMsg(fromGroup, arr[0] + '#设置基础技能完成#' + this.wx.teamPerson[index].jnCD.map(i => i.cdName).join(', '))
      }

      if (arr[2] === '回血') {
        this.wx.teamPerson[index].hxCD = {
          name: arr[0],
          cdName: arr[3],
          cdDate: '',
          cdTime: '',
        }
      }
      if (arr[2] === '群体治疗') {
        this.wx.teamPerson[index].healCD = {
          name: arr[0],
          cdName: arr[3],
          cdDate: '',
          cdTime: '',
        }
      }
    },

    // 掉落物品
    handleGoods(message) {
      const regName = /(?<=<br>\[).*?(?=\] 获得)/g
      const regGoods = /(?<= 获得 ).*?(?=<br)/g
      const names = message.replace(/<br>\[刀\]/g, '').match(regName)
      const goods = message.match(regGoods)
      goods && goods.forEach((i, index) => {
        let obj = null
        if (i.includes(' ') && i.includes('x')) {
          const str = i.split(' ')[1]
          const arr = str.split('x')
          obj = {
            goodsName: arr[0],
            num: Number(arr[1])
          }
        } else if (i.includes('x')) {
          const arr = i.split('x')
          obj = {
            goodsName: arr[0],
            num: Number(arr[1])
          }
        } else if (i.includes(' ')) {
          const arr = i.split(' ')
          obj = {
            goodsName: arr[1],
            num: 1
          }
        }
        if (obj) {
          const _index = this.wx.zyt.goods.map(i => i.name).indexOf(names[index])
          if (_index !== -1) {
            const info = this.wx.zyt.goods[_index].info
            const infoIndex = info.map(i => i.goodsName).indexOf(obj.goodsName)
            if (~infoIndex) {
              info[infoIndex].num += obj.num
            } else {
              info.push(obj)
            }
            this.wx.zyt.goods[_index].info = info
          }
        }
      })
    },
    // 方向
    handleRunInfo(fromGroup) {
      return setTimeout(() => {
        if (this.moreRun) {
          clearTimeout(this.moreRun)
          this.moreRun = null
        }
        if (!this.wx.zyt.location && this.wx.zyt.lastLocation) {
          sendMsg(fromGroup, this.wx.zyt.lastLocation)
          // 15秒之后还没有获取到
          this.moreRun = setTimeout(() => {
            if (!this.wx.zyt.location) {
              this.handleRunInfo(fromGroup)
            }
          }, 15000)
        } else {
          sendMsg(fromGroup, '方向异常')
          this.wx.zyt.location = ''
          const random = Math.random()
          let location = ''
          if (random <= 0.25) {
            location = '向前'
          } else if (0.25 < random && random <= 0.5) {
            location = '向后'
          } else if (0.5 < random && random <= 0.75) {
            location = '向左'
          } else {
            location = '向右'
          }
          const item = this.wx.direction.find(i => i.name === location)
          this.wx.zyt.lastLocation = item.showName
          setTimeout(() => {
            sendMsg(fromGroup, this.wx.zyt.lastLocation)
          }, 2000)
          // 15秒之后还没有获取到
          this.moreRun = setTimeout(() => {
            if (!this.wx.zyt.location) {
              this.handleRunInfo(fromGroup)
            }
          }, 15000)
        }

      }, this.wx.sendLocationTimer || 11000)
    },
    // 镇妖塔初始化数据
    initTaskOption(fromGroup) {
      // 数据清空
      this.wx.zyt.pkList = [];
      this.wx.zyt.healList = [];
      this.wx.zyt.location = ''
      this.wx.zyt.ms = false
      // 
      const pkList = this.wx.teamPerson.filter(i => i.jnCD.length)
      const healList = this.wx.teamPerson.filter(i => i.healCD.cdName)
      // const hxCD = this.wx.teamPerson.filter(i => i.hxCD.cdName)
      if (pkList.length === 0) {
        return sendMsg(fromGroup, '请设置技能开始攻击')
      }
      pkList.forEach(i => {
        this.wx.zyt.pkList = [...this.wx.zyt.pkList, ...i.jnCD]
      })
      healList.forEach(i => {
        this.wx.zyt.healList = [...this.wx.zyt.healList, i.healCD]
      })
    },

    //
    handleRefreshList() {
      const pkList = this.wx.teamPerson.filter(i => i.jnCD.length)
      const cdNames = this.wx.zyt.pkList.map(i => i.cdName)
      let list = []
      pkList.forEach(i => {
        list = [...list, ...i.jnCD]
      })
      list.forEach(i => {
        if (!cdNames.includes(i.cdName)) {
          this.wx.zyt.pkList.unshift(i)
        }
      })
      try {
        const healList = this.wx.teamPerson.filter(i => i.healCD.cdName)
        const healCDName = this.wx.zyt.healList.map(i => i.cdName)
        healList.forEach(i => {
          if (!healCDName.includes(i.healCD.cdName)) {
            this.wx.zyt.healList.unshift(i.healCD)
          }
        })
      } catch (error) {
        console.log(error)
      }


    },

    // 意外情况的攻击/治疗队列
    handleMoreTask(listName, itemName) {
      return setTimeout(() => {
        if (this.wx.zyt[itemName].cdName) {
          this.taskNum++
        } else {
          this.taskNum = 0
          return
        }
        // sendMsg(fromGroup, '攻击无效 加回队列')
        if (this.taskNum > 1) {
          this.taskNum = 0
          const index = this.wx.zyt[listName].map(i => i.cdName).indexOf(this.wx.zyt[itemName].cdName);
          if (~index) {
            this.wx.zyt[listName].splice(index, 1)
          }
          this.wx.zyt[listName].splice(1, 0, Object.assign({}, this.wx.zyt[itemName]))
        } else {
          this.wx.zyt[listName].unshift(Object.assign({}, this.wx.zyt[itemName]))
        }
        this.wx.zyt[itemName] = {}
      }, 15000)
    }
  }
}