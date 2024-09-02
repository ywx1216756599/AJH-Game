const fs = require('fs')

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
    console.log('error')
  }
}
const init = async (message, fromGroup, fromUser, { fn, atFn }) => {
  const bindList = await getFileJson('./my-bind.json')
  const gropn = await getFileJson('./my-gronp.json')
  const groupList = gropn.list
  if (message === '添加群' && fromGroup === fromUser) {
    if (groupList.includes(fromGroup)) {
      return fn(fromGroup, '请勿重复添加')
    }
    groupList.push(fromGroup)
    writeFileJSON('./my-gronp.json', { list: groupList }).then(() => {
      fn(fromGroup, '添加成功')
    })
  }
  if (groupList.includes(fromGroup)) {
    if (message.includes('删除指令+') && fromGroup === fromUser) {
      const arr = message.split('+');
      if (arr.length !== 2) {
        return fn(fromGroup, '请输入正确的指令格式;删除指令+指令')
      }
      const key = arr[1];
      if (bindList[key]) {
        delete bindList[key]
        writeFileJSON('./my-bind.json', bindList).then(() => {
          return fn(fromGroup, '删除成功')
        })
      } else {
        return fn(fromGroup, '删除指令不存在')
      }
    }
    if (message.includes('禁用指令+') && fromGroup === fromUser) {
      const arr = message.split('+');
      if (arr.length !== 2) {
        return fn(fromGroup, '请输入正确的指令格式;禁用指令+指令')
      }
      const key = arr[1];
      if (bindList[key]) {
        bindList[key].status = false
        writeFileJSON('./my-bind.json', bindList).then(() => {
          return fn(fromGroup, '禁用成功')
        })
      } else {
        return fn(fromGroup, '禁用指令不存在')
      }
    }
    const keys = Object.keys(bindList);
    const sendListkeys = keys.filter(i => {
      const item = bindList[i]
      if (item.type && item.type === '2' && message.includes(i)) {
        return true
      } else if (message === i) {
        return true
      }
      return false
    })
    sendListkeys.forEach(i => {
      const item = bindList[i]
      if (item && item.status) {
        const value = item.value
        if (value instanceof Array) {
          moreSetTimeout({ fromUser, item, fromGroup }, { fn, atFn })
        } else {
          if (item.type && item.type === '3' && fromGroup !== fromUser) {
            atFn(fromGroup, fromUser, value)
          } else {
            fn(fromGroup, value)
          }
        }
      }
    })
    if ((message.includes('新增指令') || message.includes('新增模糊指令') || message.includes('新增艾特指令')) && fromGroup === fromUser) {
      let type = '1';
      if (message.includes('新增模糊指令')) {
        type = '2'
      }
      if (message.includes('新增艾特指令')) {
        type = '3'
      }
      const arr = message.split('+');
      if (arr.length !== 3) {
        return fn(fromGroup, '请输入正确的指令格式;添加指令+指令+内容/内容/内容')
      }
      const key = arr[1];
      const valueList = arr[2].split('/')
      const value = valueList.length === 1 ? arr[2] : valueList
      bindList[key] = {
        status: true,
        type,
        value
      }
      writeFileJSON('./my-bind.json', bindList).then(() => {
        return fn(fromGroup, '添加成功')
      })
    }
    if (message === '查看指令') {
      fn(fromGroup, Object.keys(bindList)
        .map(i => {
          return `指令: ${i};  内容: ${bindList[i].value instanceof Array ? bindList[i].value.join(',') : bindList[i].value}`
        })
        .join('\n'))
    }

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
const moreSetTimeout = ({ fromUser, item, fromGroup }, { fn, atFn }, index = 0, time = 2000) => {
  if (index < item.value.length) {
    setTimeout(() => {
      if (item.type && item.type === '3' && fromGroup !== fromUser) {
        atFn(fromGroup, fromUser, item.value[index])
      } else {
        fn(fromGroup, item.value[index])
      }
      index++
      moreSetTimeout({ fromUser, item, fromGroup }, { fn, atFn }, index)
    }, time)
  }
}

module.exports = {
  init
}