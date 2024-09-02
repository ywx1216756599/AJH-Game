const fs = require('fs')

const mkDir = (fileName) => {
  return new Promise((reslove, reject) => {
    fs.readdir(`${fileName}`, (err, data) => {
      if (err) {
        fs.mkdir(`${fileName}`, err => {
          if (err) {
            reslove('文件夹创建失败')
          }
          reslove('文件夹创建成功')
        })
      } else {
        reslove(data)
      }
    })
  })
}

const getFileJson = (fileName) => {
  return new Promise((reslove, reject) => {
    fs.readFile(`${fileName}`, 'utf-8', (err, data) => {
      if (err) {
        reslove(null)
      } else {
        reslove(data ? JSON.parse(data) : {})
      }
    })
  })
}
const writeFileJSON = (fileName, data) => {
  try {
    const newData = deepClone(data)
    const jsonInfo = JSON.stringify(newData, null, 2)
    return new Promise((reslove, reject) => {
      fs.writeFile(`${fileName}`, jsonInfo, err => {
        if (err) {
          reslove('error')
        }
        reslove('success')
      })
    })
  } catch (error) {
    return new Promise((reslove, reject) => {
      reslove('error')
    })
  }
}
const isObject = (value) => {
  const valueType = typeof value
  return (valueType !== null && typeof value === 'object')
}
const deepClone = (originValue) => {
  // 如果不是对象类型则直接将当前值返回
  if (!(isObject(originValue))) return originValue
  let newObject = {}
  if (originValue instanceof Array) {
    newObject = []
  }

  for (const key in originValue) {
    newObject[key] = deepClone(originValue[key])
  }
  return newObject
}

const handleAddLogs = (message, time, status = '1') => {
  const _logs = Object.assign({}, logInfo)
  _logs.message = message
  _logs.time = time
  _logs.status = status
  return Object.assign({}, _logs)
}
const personInfo = {
  wxid: '',
  points: 0,
  logs: []
}

const goodsInfo = {
  name: '',
  price: 0,
  num: 0,
  status: '', //1=材料 2=道具 3=装备
  logs: []
}

const logInfo = {
  message: '',
  time: '',
  status: '' // 1-增加 2-消费
}


const person = []

let goods = []

const instantGoods = []

const taskList = []

let isOpenTask = false


let fn = null
const handleSyncInfo = async () => {
  const fileName = './shop-person'
  mkDir(fileName).then(async (res) => {
    if (res instanceof Array) {
      for (let i = 0; i < res.length; i++) {
        const item = await getFileJson(`${fileName}/${res[i]}`)
        person.push(item)
      }
    }
  })
  const _goods = await getFileJson(`./shop-goods/goods.json`)
  goods = _goods
}
const init = (message, msg, _fn) => {
  fn = _fn;
  initAdd(message, msg)
  initGoodsBind(message, msg)
  handleShop(message, msg)
}
const initAdd = (message, msg) => {
  handleAddPesronPoints(message, msg)
  handleAddGoods(message, msg)
}
const handleAddPesronPoints = (message, msg) => {
  const { fromGroup, fromUser, isSendMsg, isSendByPhone, type, time } = msg
  if (fromGroup === fromUser && !fromUser.includes('chatroom') && isSendMsg && isSendByPhone && type === 1) {
    if (message.includes('加积分+')) {
      const arr = message.split('+');
      if (arr.length !== 2) {
        return
      }
      if (isNaN(arr[1])) {
        return
      }
      const index = person.findIndex(i => i.wxid === fromUser)
      if (~index) {
        person[index].points += Number(arr[1])
        person[index].logs.push(handleAddLogs(message, time))

        taskList.push({ task: person[index], status: 'person', fromUser })
      } else {
        const _person = Object.assign({}, personInfo, { logs: [] })
        _person.points = Number(arr[1])
        _person.wxid = fromUser

        _person.logs.push(handleAddLogs(message, time))
        person.push(_person)

        taskList.push({ task: _person, status: 'person', fromUser })

      }
      if (!isOpenTask) {
        isOpenTask = true
        handleOpenTask()
      }
    }
  }
}
const handleAddGoods = (message, msg) => {
  const { fromGroup, fromUser, isSendMsg, isSendByPhone, type, time } = msg
  if (fromGroup === fromUser && !fromUser.includes('chatroom') && isSendMsg && isSendByPhone && type === 1) {
    if (message.includes('加商品+')) {
      const arr = message.split('+');
      if (arr.length !== 5) {
        return
      }
      if (isNaN(arr[2]) || isNaN(arr[3])) {
        return
      }
      const index = goods.findIndex(i => i.name === arr[1])
      if (~index) {
        goods[index].price = Number(arr[2])
        goods[index].num += Number(arr[3])
        goods[index].status = arr[4]
        goods[index].logs.push(handleAddLogs(message, time))
      } else {
        const _goods = Object.assign({}, goodsInfo, { logs: [] })
        _goods.name = arr[1]
        _goods.price = Number(arr[2])
        _goods.num += Number(arr[3])
        _goods.status = arr[4]
        _goods.logs.push(handleAddLogs(message, time))

        goods.push(_goods)
      }
      taskList.push({ task: goods, status: 'goods', fromUser })
      if (!isOpenTask) {
        isOpenTask = true
        handleOpenTask()
      }
    }
  }
}

const initGoodsBind = (message, msg) => {
  const yb = 150000
  const { fromGroup, fromUser, isSendMsg, isSendByPhone, type, time } = msg
  const item = person.find(i => i.wxid === fromUser)
  if (item && fromGroup === fromUser && !fromUser.includes('chatroom')) {
    if (message === '我的信息') {
      return fn(fromUser, '积分：' + item.points)
    }
    if (message.includes('查商品+') || message.includes('查商品')) {
      const arr = message.split('+');
      let list = []
      let num = 1
      let _goods = []
      if (arr[1] && isNaN(arr[1])) {
        num = Number(arr[2]) || 1
        const name = arr[1]
        _goods = goods.filter(i => i.name.includes(name))
      } else {
        _goods = goods.filter(i => i.name)
        num = Number(arr[1]) || 1
      }
      if ((num - 1) * 8 > _goods.length || num < 1) {
        num = 1
      }
      list = _goods.slice((num - 1) * 8, num * 8)
      if (list.length) {
        const message = `======商品======\n` + list.map((i, index) => {
          const isOnePrice = i.price <= yb
          return `${index + 1}：${i.name}\n价格：${i.price}元宝\n( ${isOnePrice ? '1' : Math.floor(i.price / yb)}积分换取${isOnePrice ? Math.ceil(yb / i.price) : '1'}个${i.name} )\n数量：${i.num}个`
        }).join('\n')
        fn(fromUser, message)
      } else {
        fn(fromUser, '未查到商品')
      }
    }
  }
}


// 任务队列
const handleOpenTask = async () => {
  if (taskList.length) {
    const { task, status, fromUser } = taskList.shift()
    if (status === 'person') {
      await handlePersonTask(task, fromUser)
    }
    if (status === 'goods') {
      await handleGoodsTask(task, fromUser)
    }
    if (status === 'pay') {
      await handlePersonTask(task.person, fromUser)
      await handleGoodsTask(task.goods)
    }
    setTimeout(() => {
      handleOpenTask()
    }, 1000)
  } else {
    isOpenTask = false
  }
}

const handlePersonTask = async (task, fromUser) => {
  const res = await writeFileJSON(`./shop-person/${fromUser}.json`, task)
  if (!res || res === 'error') {
    fn(fromUser, '增加积分失败')
  } else {
    fn(fromUser, '操作成功')
  }
}

const handleGoodsTask = async (task, fromUser) => {
  const res = await writeFileJSON(`./shop-goods/goods.json`, task)
  if (!res || res === 'error') {
    fn(fromUser, '增加商品失败')
  } else {
    fn(fromUser, '操作成功')
  }
}


const handleShop = (message, msg) => {
  const { fromGroup, fromUser, isSendMsg, isSendByPhone, type, time } = msg
  const item = person.find(i => i.wxid === fromUser)
  if (item && fromGroup === fromUser && !fromUser.includes('chatroom')) {
    if (message.includes('收商品+')) {
      const arr = message.split('+');
      if (arr.length !== 3) {
        return
      }
      let num = 0
      let price = 0
      const payGoods = goods.find(i => i.name === arr[1])
      if (!payGoods) {
        return fn(fromUser, '未查询到此商品')
      }
      const yb = 150000
      const isOnePrice = payGoods.price <= yb

      if (isOnePrice) {
        num = Math.ceil(yb / payGoods.price) * Number(arr[2])
        price = Number(arr[2])
      } else {
        num = Number(arr[2])
        price = Math.floor(payGoods.price / yb) * Number(arr[2])
      }
      // 校验库存
      if (payGoods.num < num) {
        return fn(fromUser, `超过库存，当前只有${payGoods.num}个${payGoods.name}！`)
      }
      // 校验积分
      if (item.points < price) {
        return fn(fromUser, `积分不足，需要${price}个积分`)
      }
      const goodsIndex = goods.findIndex(i => i.name === arr[1])
      item.points -= price
      item.logs.push(handleAddLogs(message, time, '2'))

      goods[goodsIndex].num -= num
      goods[goodsIndex].logs.push(handleAddLogs(`${fromUser}:消费：${price}积分，${num}个${payGoods.name}。:${price}+${num}`, time, '2'))

      taskList.push({ task: { person: item, goods }, status: 'pay', fromUser })

      if (!isOpenTask) {
        isOpenTask = true
        handleOpenTask()
      }
    }
  }
}

module.exports = {
  init,
  handleSyncInfo
}