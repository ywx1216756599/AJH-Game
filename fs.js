const fs = require('fs')
const md5 = require('md5')
const md5Str = (url) => {
  return new Promise((resolve) => {
    try {
      fs.readFile(url, 'utf-8', function (err, buf) {
        if (buf) {
          resolve(md5(buf))

        } else {
          resolve('')
        }
      })
    } catch (error) {
      resolve('')
    }

  })
}
const delectFile = (wxid) => {
  const fileName = `./person-info/${wxid}.json`
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName)
  }
}

const mkDir = () => {
  return new Promise((reslove, reject) => {
    fs.readdir('./person-info', (err, data) => {
      if (err) {
        fs.mkdir('./person-info', err => {
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

const getFileJson = (wxid) => {
  return new Promise((reslove, reject) => {
    fs.readFile(`./person-info/${wxid}`, 'utf-8', (err, data) => {
      if (err) {
        reslove(null)
      } else {
        reslove(data ? JSON.parse(data) : {})
      }
    })
  })
}
const writeFileJSON = (wxid, data, content) => {
  try {
    const newData = deepClone(data)
    const jsonInfo = JSON.stringify(newData, null, 2)
    return new Promise((reslove, reject) => {
      fs.writeFile(`./person-info/${wxid}.json`, jsonInfo, err => {
        if (err) {
          reslove('文件写入失败')
        }
        reslove('文件写入成功')
      })
    })
  } catch (error) {
    console.log(content)
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


module.exports = {
  mkDir,
  getFileJson,
  writeFileJSON,
  delectFile,
  md5Str
}

