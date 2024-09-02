//引入net模块
const net = require('net');
const axios = require('axios');
const baseURL = 'http://127.0.0.1:19088/api/'

const initTCP = (func) => {
  //创建TCP服务器
  const server = net.createServer(function (socket) {
    socket.on('data', function (data) {
      func(JSON.parse(data))
    });
  });

  //设置监听端口
  server.listen(19099, function () {
    console.log('服务正在监听中。。。')
  });
}
const sendMsg = (wxid, msg, callback = () => { }) => {
  const data = {
    wxid,
    msg
  }
  axios({
    url: `${baseURL}?type=2`,
    method: 'post',
    data
  }).then((res) => {
    const data = res.data
    if (data.result !== 'OK') {
      callback()
    }
  })
}

const sendPersonMsg = (chatRoomId, wxids, msg, callback = () => { }) => {
  const data = {
    chatRoomId,
    wxids,
    msg
  }
  axios({
    url: `${baseURL}?type=3`,
    method: 'post',
    data
  }).then((res) => {
    const data = res.data
    if (data.result !== 'OK') {
      callback()
    }
  })
}

const getImgUrl = (imagePath, callback = () => { }) => {
  const data = {
    imagePath,
    savePath: 'C:\\img'
  }
  axios({
    url: `${baseURL}?type=48`,
    method: 'post',
    data
  }).then((res) => {
    const data = res.data
    if (data.result === 'OK') {
      callback()
    }
  })
}

module.exports = {
  initTCP,
  sendMsg,
  sendPersonMsg,
  getImgUrl
}

