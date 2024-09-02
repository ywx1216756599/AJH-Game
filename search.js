// 机器人查询
const axios = require('axios');

const db = {
  // 画地
  t_152097: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=152097",
  // 曲韵
  t_150739: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=150739",
  // 明灯
  // 诛天
  t_152448: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=152448",
  // 星辰
  t_152058: 'http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=152058',
  // 陌上
  t_138338: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=138338",
  // 君临
  t_8311: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=8311",
  // 彩虹
  t_151077: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=151077",
  // 苍穹
  t_145831: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=145831",
  // 青龙
  t_152210: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=152210",
  // 山海
  t_148726: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=148726",
  // 东宫
  // 逐鹿
  t_144804: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=144804",
  // 乌鸦
  t_142293: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=142293",
  // 沐词
  t_89747: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=89747",
  // 微梦
  t_150463: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=150463",
  // 独角兽
  t_150595: "http://www.shanliulian.com/app/index.php?m=wingappaijianghu&a=web_gamelist_playernow&u=150595"
}

const dbNames = {
  // 画地
  t_152097: '画地',
  // 曲韵
  t_150739: '曲韵',
  // 诛天
  t_152448: '诛天',
  // 星辰
  t_152058: '星辰',
  // 陌上
  t_138338: '陌上',
  // 君临
  t_8311: '君临',
  // 彩虹
  t_151077: '彩虹',
  // 苍穹
  t_145831: '苍穹',
  // 青龙
  t_152210: '青龙',
  // 山海
  t_148726: '山海',
  // 东宫
  // 逐鹿
  t_144804: '逐鹿',
  // 乌鸦
  t_142293: '乌鸦',
  // 沐词
  t_89747: '沐词',
  // 微梦
  t_150463: '微梦',
  // 独角兽
  t_150595: '独角兽',
}

const statusList = {
  '0': '空闲',
  '1': '修炼',
  '2': '双修',
  '3': '副本',
  '4': '镇妖塔',
  '8': '暗殿',
  '9': '遗迹',
}

const searchDbName = () => {
  const dbName = []
  for (let key in dbNames) {
    const str = `${dbNames[key]}: ${key.replace(/t_/, '')}`
    dbName.push(str)
  }
  return dbName.join('\n')
}


const serachPerson = (content) => {
  return new Promise(resolve => {
    const data = new FormData()
    data.append('op', 'getp')
    data.append('stype', '1')
    data.append('g', '0')
    const arr = content.split('#')
    if (arr.length !== 3) {
      resolve('请输入正确的查询条件')
    }
    const ids = arr[2].split('/').map(i => `t_${i}`)
    for (let key in ids) {
      if (isNaN(ids[key].replace(/t_/, ''))) {
        resolve('请输入正确的查询条件')
      }
      if (!dbNames[ids[key]]) {
        resolve('请输入正确的区服')
      }
    };
    // console.log('start')
    const infoList = Object.keys(db).filter(i => ids.includes(i)).map(i =>
      axios({
        url: db[i],
        method: 'post',
        hearders: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        data,
        maxContentLength: Infinity,
      })
    )
    try {
      Promise.all(infoList).then(results => {
        const info = results.filter(i => i.data.data).map(i => i.data.data.info).flat()
        const search = arr[1]
        let message = []
        if (search === '空闲') {
          message = info.filter(i => i.status === '0')
        } else if (search === '修炼') {
          message = info.filter(i => i.status === '1')
        } else if (search === '双修') {
          message = info.filter(i => i.status === '2')
        } else if (search === '副本') {
          message = info.filter(i => i.status === '3')
        } else if (search === '镇妖塔') {
          message = info.filter(i => i.status === '4')
        } else if (search === '暗殿') {
          message = info.filter(i => i.status === '8')
        } else if (search === '遗迹') {
          message = info.filter(i => i.status === '9')
        } else if (isNaN(search)) {
          message = info.filter(i => i.nickname.includes(search))
        } else {
          message = info.filter(i => i.play_id === search)
          if (!message.length) {
            message = info.filter(i => i.nickname === search)
          }
        }
        if (message.length) {
          resolve(message
            .map(i =>
              '游戏名：' + i.nickname +
              '\nid: #' + i.play_id +
              '\n服务器：' + i.user_id + '（' + dbNames['t_' + i.user_id] + '）' +
              '\n等级：' + i.lv +
              '\n生命：' + i.hp +
              '\n钻石：' + i.jewels +
              '\n非宝库元宝：' + i.coin +
              '\n宝库元宝：' + i.coin_save +
              '\n总元宝：' + i.coin_all +
              '\n状态：' + (statusList[i.status] || i.status) +
              '\n层数：' + i.fuben_type +
              '\n时间：' + new Date(i.status_time * 1000).toLocaleString())
            .join('\n\n'))
        } else {
          resolve('暂无人员')
        }
      })
    } catch (error) {
      console.log('fail')
      resolve('查询失败')
    }
  })
}

module.exports = {
  // 群聊
  chatroom: '53712418849@chatroom',
  searchDbName,
  serachPerson
}