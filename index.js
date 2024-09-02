const axios = require('axios');
const { initTCP, sendMsg, sendPersonMsg, getImgUrl } = require('./tcp');
const regs = require('./regs');
const handle = require('./handle')('123');
const Person = require('./Person');
const myFs = require('./fs');
const baseURL = 'http://127.0.0.1:19088/api/'
const searchFunc = require('./search');
const bindFunc = require('./my-bind');
const shopFunc = require('./shop');
const myFromGroup = '39335379557@chatroom'

shopFunc.handleSyncInfo()
// const myFromGroup = '39089973509@chatroom'
const init = () => {
  // getWxPerson()
  sendTCP(() => initTCP(watchInfo))
  getPerson()
}
const xi = {
  isOpen: false,
  no: '',
  num: 0,
  jd: '',
  zb: [],
  aaa: false,
  index: 0,
  sjIndex: 0
}

const path = require('path')
const obj = {
  '616b6931112fdaffcfe72a993daa3623': '向左',  // 1
  'efa2b0110842da98492cecd487d39502': '向左', // 2
  'a21d830a593534b89473ff37da034b49': '向左', // 3
  '80e33c53a80681f89ecf2ac800bef942': '向左',

  'd274a10adc59786f7b95fe1e7db3022e': '向右', // 1
  'e562618bdba967e54dcf0ff5c8ef15b1': '向右', // 2
  'b940c0f4a0a9d013db0161ae08190835': '向右', // 3
  '2f483d30497f72e3a9c6d651331e0fe6': '向右',

  'bab13583d771c44832f863b294ff3dd3': '向前', // 1
  'fed299872db78a18bdf4fe143cf438ae': '向前', // 2
  '8b3d081ffe5dbf61c1c819b27cdab579': '向前', // 3
  '9da06f0211292de0ced30ee2418ddf36': '向前',

  'bc6340874f45e122e6647333bb2eadda': '向后', // 1
  '76d48f0a944ebb90d3a3ca813c9fffc9': '向后', // 2
  '40b2959e3d730e97930e0c8f54136edc': '向后', // 3
  'f5fcfdf39762fe182327e9f86a060737': '向后', // 4
  'a0cab1669fa03a1379b4af5eeddd504d': '向后'
}
const wx = {
  persons: [],
  fileList: [],
}
const emojiToUnicode = (text) => {
  return text.replace(/[\uD800-\uDFFF]/g, function (match) {
    return `\\u${match.charCodeAt(0).toString(16)}`;
  });
}

// tcp链接
const sendTCP = (callback = () => { }) => {
  const data = {
    ip: '127.0.0.1',
    port: 19099,
    enableHttp: 0,
  }
  axios({
    url: `${baseURL}?type=9`,
    method: 'post',
    data
  }).then((res) => {
    const data = res.data
    if (data.result === 'OK') {
      callback()
    }
  })
}

// tcp链接
const getWxPerson = (callback = () => { }) => {
  axios({
    url: `${baseURL}?type=46`,
    method: 'post',
  }).then((res) => {
    const data = res.data
    if (data.result === 'OK') {
      callback()
    }
  })
}
// 获取人员
const getPerson = () => {
  wx.persons = []
  wx.fileList = []
  myFs.mkDir().then(async (res) => {
    if (res instanceof Array) {
      for (let i = 0; i < res.length; i++) {
        const item = await myFs.getFileJson(res[i])
        wx.fileList.push(item)
        if (item.isAuth) {
          const person = Person(item.wxid, item.name, item.fromGroup, item)
          const func = require('./func')(person.name);
          wx.persons.push(Object.assign(person, func))
        }
      }
    }
  })
}

const pkPerson = {
  timer: null,
  isOpen: false,
  name: '',
  pk: {},
  jn: [],
  pkName: ''
}

let timer = null

const watchInfo = (msg) => {
  const { content, fromGroup, fromUser, signature } = msg
  // console.log(msg)

  if (content === '开始查询') {
    console.log(fromUser, fromGroup)
  }

  const message = (content || '').replace(/\n/g, '<br>').replace(/\ue335|\ud83c\udf1f/g, '你在喊你星哥?').replace(/\ud83c\udf53|\ue347/g, '我是你七哥').replace(/\ud83d\udc33|\ue054/g, '你喊鲸鱼姐干啥')
  const wxidMatch = (signature || '').replace(/ /g, '').replace(/\n/g, '<br>').match(/(?<=CDATA\[).*?(?=\])/) || (signature || '').replace(/ /g, '').replace(/\n/g, '<br>').match(/(?<=<atuserlist>).*?(?=<\/atuserlist>)/)
  bindFunc.init(message, fromGroup, fromUser, { fn: sendMsg, atFn: sendPersonMsg })
  shopFunc.init(message, msg, sendMsg)

  if (fromGroup == '19344658793@chatroom') {
    if (message === '查wxid') {
      return sendMsg(fromGroup, `wxid：${fromUser}`)
    }
  }
  if (fromGroup === searchFunc.chatroom) {
    if (content === '指令') {
      const msg = `--------指令大全--------
    1. 查服务器
    2. 查询#id/玩家名称/关键字#服务器id/服务器id`
      return sendMsg(fromGroup, msg)
    }
    if (content === '查服务器') {
      const message = searchFunc.searchDbName()
      return sendMsg(fromGroup, message)
    }
    if (content.includes('查询#')) {
      searchFunc.serachPerson(content).then(message => {
        return sendMsg(fromGroup, message)
      })
    }
  }
  if (fromGroup === '39338072111@chatroom') {
    if (message.includes('存米#')) {
      const num = message.replace(/存米#/, '')
      if (isNaN(num)) {
        return sendMsg(fromGroup, '请输入数字')
      } else {
        return sendMsg(fromGroup, `出售#xx#${num}`)
      }
    }
  }
  if (fromGroup === myFromGroup) {
    if (['wxid_bfeieiisfbhv12', 'wxid_lh0hv4xul90a22', 'wxid_23hqz8hn2i0d29'].includes(fromUser)) {
      if (message.includes('发送#')) {
        const msg = content.replace(/发送#/g, '')
        sendMsg(fromGroup, msg)
      }
    }
    if (message.includes('定时发送+')) {
      let num = 0
      const arr = message.split('+')
      const str = arr[1]
      const _num = arr[2]
      const time = (arr[3] || 10) * 1000
      sendMsg(fromGroup, str)
      timer = setInterval(() => {
        if (_num < num) {
          clearInterval(timer)
          timer = null
        }
        sendMsg(fromGroup, str)
        num += 1
      }, time)
    }
    if (message === '逃') {
      return sendMsg(fromGroup, '逃跑')
    }
    if (message === '镇') {
      return sendMsg(fromGroup, '镇妖塔')
    }
    if (message.includes('提交/取消')) {
      return sendMsg(fromGroup, '取消')
    }
    if (message.includes('等死')) {
      return sendMsg(fromGroup, '提交#2')
    }
    if (message.includes('假装路过') || message.includes('我没丢')) {
      return sendMsg(fromGroup, '提交#4')
    }
    if (message.includes('提交/取消')) {
      return sendMsg(fromGroup, '取消')
    }
  }
  if (fromGroup === '20248663472@chatroom') {
    if (message === '关闭pk') {
      pkPerson.isOpen = false
      clearInterval(pkPerson)
      pkPerson.timer = null;
      pkPerson.pk = {}
    }
    if (message.includes('+pk+')) {
      pkPerson.isOpen = true
      const arr = message.split('+')
      pkPerson.name = arr[0]
      pkPerson.pkName = arr[2]
      pkPerson.jn = arr.slice(3).splice(',').map(i => ({
        name: i,
        time: 0
      }))
      setInterval(() => {
        if (pkPerson.pk.name) {
          pkPerson.jn.unshift(pkPerson.pk)
          pkPerson.pk = {}
        } else {
          const time = Date.now()
          const item = pkPerson.jn[0]
          if (item.time < time) {
            pkPerson.pk = pkPerson.jn.shift()
          }
        }
      }, 10000)
    }

    if (pkPerson.isOpen && message.includes(`@${pkPerson.name}`) && message.includes('技能恢复时间')) {
      const nowDate = new Date().toLocaleDateString().replace(/\//g, '-')
      const date = nowDate + ' ' + message.split('技能恢复时间：')[1]
      const time = 0 + new Date(date)
      pkPerson.pk.time = time
      pkPerson.jn.push(pkPerson.pk)
      pkPerson.pk = {}
    }
  }
  if (fromGroup === '39335379557@chatroom') {
    const message = content.replace(/\n/g, '<br>') + '<br>'
    if (message.includes('经验8') || message.includes('经验7')) {
      xi.isOpen = false
      xi.index = 0
      xi.sjIndex = 0
      xi.aaa = false
    }
    if (message.includes('春开始#')) {
      xi.isOpen = true
      const arr = message.split('#')
      xi.no = arr[1] ? arr[1].replace(/<br>/g, '') : ''
      xi.num = arr[2] ? arr[2].replace(/<br>/g, '') : 3
      setTimeout(() => {
        sendMsg(fromGroup, `购买#${xi.no} ${xi.num}`)
      }, 2000)
    }
    if (message.includes('春结束')) {
      xi.isOpen = false
    }

    if (xi.isOpen) {
      if (message.includes('@诛天k少')) {
        if (message.includes('购买成功')) {
          const reg1 = /(?<=快捷指令: ).*?(?=<br>)/g
          const arr = message.match(reg1)
          if (!arr.length) {
            return
          }
          xi.jd = arr[0]
          xi.zb = xi.jd.replace(/鉴定#/g, '').split('#')
          setTimeout(() => {
            sendMsg(fromGroup, xi.jd)
          }, 4500)
        }
        if (message.includes('升级成功')) {
          xi.sjIndex += 1
          if (xi.sjIndex === xi.zb.length) {
            xi.sjIndex = 0
            xi.aaa = true
            sendMsg(fromGroup, xi.jd)
          } else {
            setTimeout(() => {
              sendMsg(fromGroup, `升级#${xi.zb[xi.sjIndex]}`)
            }, 7500)
          }


        }
        if (message.includes('升级失败')) {
          setTimeout(() => {
            sendMsg(fromGroup, `升级#${xi.zb[xi.sjIndex]}`)
          }, 7500)
        }
        if (message.includes('鉴定成功')) {
          if (xi.aaa) {
            xi.index++
            if (xi.index < 6) {
              setTimeout(() => {
                if (xi.isOpen) {
                  sendMsg(fromGroup, xi.jd)
                }
              }, 7500)

            } else {
              xi.index = 0
              xi.aaa = false
              setTimeout(() => {
                if (xi.isOpen) {
                  sendMsg(fromGroup, '回收#装备#确认')
                  setTimeout(() => {
                    sendMsg(fromGroup, `购买#${xi.no} ${xi.num}`)
                  }, 4500)
                }
              }, 7000)
            }
          } else {
            sendMsg(fromGroup, `升级#${xi.zb[xi.sjIndex]}`)
          }
        }
      }
    }
  }
  if (message.includes('验证码') && message.includes('@诛天k少') && fromGroup === myFromGroup) {
    const reg = /[a-z]/g
    const arr = message.replace(/<br>/g, '<\/>').match(reg)
    const msg = '@每日一学 ' + arr.join('').slice(arr.length - 5)
    sendMsg(fromGroup, msg)
  }

  if (message.includes('删除授权') && fromGroup === fromUser) {
    if (!wxidMatch) {
      // return sendMsg(fromGroup, '错误：请@到实际人员')
      return
    }
    const index = wx.persons.findIndex(i => i.wxid === wxidMatch[0])
    if (~index) {
      wx.persons.splice(index, 1)
    }
    return myFs.delectFile(wxidMatch[0])
  }

  if (message.includes('取消授权') && fromGroup === fromUser) {
    if (!wxidMatch) {
      // return sendMsg(fromGroup, '错误：请@到实际人员')
      return
    }
    const wxid = wxidMatch[0]
    const index = wx.persons.findIndex(i => i.wxid === wxid)
    if (~index) {
      const data = wx.persons[index].config
      data.isAuth = false
      myFs.writeFileJSON(wxid, data, '用户1')
      wx.persons.splice(index, 1)
    }
    return
    // return myFs.delectFile(wxidMatch[0])
  }

  if (message.includes('授权') && fromGroup === fromUser) {
    const nameMatch = message.match(/(?<=@).*?(?= )/)
    if (!wxidMatch || !nameMatch) {
      return
    }
    const wxid = wxidMatch[0]
    if (!nameMatch) {
      // return sendMsg(fromGroup, '请艾特到人')
    }
    const index = wx.fileList.findIndex(i => i.wxid === wxid)
    if (~index) {
      const config = wx.fileList[index]
      config.isAuth = true
      config.fromGroup = fromGroup
      myFs.writeFileJSON(wxid, config, '用户11').then((res) => {
        const person = Person(wxid, config.name, fromGroup, config)
        const func = require('./func')(person.name);


        wx.persons.push(Object.assign(person, func))

        sendMsg(fromGroup, `用户'${person.name}'更新成功`)
      })


    } else {
      const func = require('./func')(nameMatch[0]);
      const person = Person(wxid, nameMatch[0], fromGroup, {})
      wx.fileList.push(person.config)
      myFs.writeFileJSON(wxid, person.config, '用户2').then(res => {
        wx.persons.push(Object.assign(person, func))
      })
      sendMsg(fromGroup, `新用户'${nameMatch[0]}'创建成功`)
    }
    return
  }
  // 监听授权人员发送消息
  const wxids = wx.persons.map(i => i.fromGroup)
  const wxidIndex = wxids.indexOf(fromGroup)

  if (~wxidIndex) {
    if (msg.thumbPath) {
      setTimeout(() => {
        const url = path.resolve("C:\\Users\\Administrator\\Documents\\WeChat Files")
        // const url = path.resolve("C:\\Users\\liping\\Documents\\WeChat Files")
        const imgUrl = url + '\\' + msg.thumbPath
        const file = (msg.thumbPath + '').split('\\')
        const fileName = file[file.length - 1].replace(/.dat/g, '') + '.jpg'
        getImgUrl(imgUrl, () => {
          try {
            const imgaa = path.resolve("C:\\img\\") + "\\" + fileName
            setTimeout(() => {
              getImgMD5(imgaa, fromGroup, wxidIndex)
            }, 1500)

          } catch (error) {
            console.log('error: ' + imgaa)
          }

        })
      }, 1000)
    }
    wx.persons[wxidIndex].initPalyer(message, fromGroup, fromUser, msg)
    // @授权玩家或者授权队伍玩家
    const gameName1 = handle.getGameName(message, regs.name)
    const gameName2 = handle.getGameName(message, regs.pkName)
    const gameName3 = handle.getGameName(message, regs.bossOver)
    const gameName = gameName2 || gameName3 || gameName1
    const person = handle.isGroupName(gameName, wx.persons.filter(i => i.fromGroup === fromGroup))
    if (person) {
      person.init(message, fromGroup, fromUser)
    }
  }

}
const getImgMD5 = (imgaa, fromGroup, wxidIndex, flag = 1) => {
  myFs.md5Str(imgaa).then(res => {
    if (!res) {
      if (flag > 4) {
        if (!wx.persons[wxidIndex].wx.zyt.location) {
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
          wx.persons[wxidIndex].wx.zyt.location = location
        }
        return
      }
      let num = flag + 1
      setTimeout(() => {
        getImgMD5(imgaa, fromGroup, wxidIndex, num)
      }, 1500)
    }
    if (obj[res]) {
      // if (!wx.persons[wxidIndex].wx.zyt.location) {
      if (wx.persons[wxidIndex].wx['direction-fz'].length) {
        wx.persons[wxidIndex].wx.sendLocationTimer = 2500
      } else {
        const item = wx.persons[wxidIndex].wx.direction.find(i => i.showName === wx.persons[wxidIndex].wx.zyt.lastLocation)
        const itemNew = wx.persons[wxidIndex].wx.direction.find(i => i.name === obj[res])
        if (item && itemNew) {
          if (item.person && itemNew.person && item.person !== itemNew.person) {
            wx.persons[wxidIndex].wx.sendLocationTimer = 2500
          }
        }
      }
      sendMsg(fromGroup, '方向: ' + obj[res])
      wx.persons[wxidIndex].wx.zyt.isResetLocation = false
      wx.persons[wxidIndex].wx.zyt.location = obj[res]
    }
    // }
  })
}
init(); 