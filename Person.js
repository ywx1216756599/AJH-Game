

const Person = (wxid, name, fromGroup, configOption = {}) => {
  // 默认config配置
  const configDefault = require('./config')(name);
  const config = Object.assign({}, configDefault, configOption, { fromGroup })
  config.wxid = wxid;
  const person = {
    fromGroup: config.fromGroup,
    name,
    wxid,

    config,
    isZYTBoss: false,
    taskNum: 0,
    runTimer: null,
    moreRun: null,
    teamWxids: [wxid],
    stopTimer: null,

    wx: {
      yj: [],
      gameName: name,
      group: [],

      todoList: [],
      doList: [],
      doing: {},

      teamPerson: config.teamPerson,
      direction: config.direction,
      'direction-fz': config['direction-fz'],
      personBind: [
        '镇妖塔#重置攻击', '镇妖塔#基础技能', '攻击BOSS人员#用户名#用户名', '镇妖塔#暂停', '镇妖塔#继续', '镇妖塔#开启逃跑', '镇妖塔#关闭逃跑', '镇妖塔#资源'
      ],

      sendLocationTimer: 11000,

      wkIndex: 4,
      zyt: {
        moreLayer: config.moreLayer || {
          layer: 25,
          pkBossList: []
        },
        isResetLocation: true,
        recoverInfo: {
          num: 0,
          isOpen: false,
          time: '',
          date: '',
        },
        yjTimer: null,
        recovering: false,
        bossInfo: 0,

        pkover: false,

        isStop: false,  // 是否中止镇妖塔
        isOpen: true, // 是否开启镇妖塔
        pkBossList: [], // 打boss人员
        minHp: config.minHp,
        dw: config.dw,

        location: '', // 方位
        lastLocation: '', // 上一次方位

        autoPKTimer: null, // 自动pk定时器

        isBoss: false, // 是否Boss
        isHeal: false, // 是否需要治疗
        isSMR: false,
        smrList: config.smrList || [],

        yzNames: [],
        disableNames: [],

        runAway: {
          name: config.runAwayName,
          cdTime: '',
          timer: null,
        },
        runing: false,
        runOption: [
          { layer: 10, hps: ['34000', '35000'] },
          { layer: 15, hps: ['90000'] },
        ],

        hps: [],

        pkList: [],
        pking: {},
        pkingTimer: null,

        healList: [],
        healing: {},
        healingTimer: null,

        damage: 0, // 伤害
        layer: 9, // 层数 默认9层

        goods: handleGoods(config.teamPerson), // 资源

        layer18: config.layer18,
        layer19: config.layer19,
        layer20: config.layer20,

        ms: false,

        _time: 2000,
        gwInfo: {
          mg: 0
        }
      }
    }
  }
  return person
}

const handleGoods = (teamPerson) => {
  const arr = []
  teamPerson.forEach(i => {
    arr.push({
      name: i.name,
      status: true,
      info: []
    })
  })
  return arr
}

module.exports = Person
