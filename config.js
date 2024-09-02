const config = (name) => ({
  isAuth: true,
  name, // 用户名
  fromGroup: '',  // 群组
  wxid: '',
  runAwayName: '逃', // 逃跑快捷键
  zyt: '镇', // 镇妖塔快捷键
  dw: '队',
  minHp: 12000, // 最低血量
  // 方向
  direction: [{ name: '向前', showName: '前', person: '1' }, { name: '向后', showName: '后', person: '1' }, { name: '向左', showName: '左', person: '1' }, { name: '向右', showName: '右', person: '1' }],
  'direction-fz': [],
  // 技能快捷配置
  skillList: [],
  // 默认pkboss人员
  pkBossList: [],
  // 队伍信息 
  teamPerson: [],
  // 高层默认攻击人员配置
  layer18: [],
  layer19: [],
  layer20: [],
  moreLayer: {
    layer: 25,
    pkBossList: []
  },
  smrList: []
})

module.exports = config