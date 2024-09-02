const handle = (name) => ({
  name,
  handleReg(msg, reg) {
    return (msg.match(reg) || []).filter(Boolean);
  },
  isName(msg, reg, names = []) {
    const list = this.handleReg(msg, reg);
    if (names.length) {
      return names.map(i => i.name).includes(list[0])
    }
    return list[0] === this.name
  },
  getTeamPerson(msg, reg) {
    const a = '\ue335'
    const arr = []
    const list = this.handleReg(msg, reg);
    const hps = msg.match(/(?<=\[爱心\]).*?(?=\/)/g)
    list.forEach((i, index) => {
      let name = i.split(' ').slice(1).join(' ').replace(/\ue335|\ud83c\udf1f/g, '你在喊你星哥?').replace(/\ud83c\udf53|\ue347/g,'我是你七哥').replace(/\ud83d\udc33|\ue054/g,'你喊鲸鱼姐干啥');
      const length = name.length - 1
      this.emojiToUnicode(name)
      if (name[length] == '\uD83D\uDD31' || name[length] == '\uE031' || name[length] == '\uDD31') {
        name = name.replace(/[\uD83D\uDD31]|[\uE031]|[\uDD31]/g, '')
      }
      const person = {
        name,
        hp: hps[index],
        fy: '3000',
        gj: '',
        jnCD: [],
        hxCD: {},
        healCD: {},
        wxid: ''
      }
      arr.push(person)
    });
    return arr
  },
  getGameName(msg, reg) {
    const list = this.handleReg(msg, reg);
    if (list.length) {
      return list[0]
    }
  },
  isGroupName(name, persons) {
    if (name) {
      const index = persons.findIndex(i => {
        const groupName = (i?.wx?.teamPerson || []).map(j => j.name)
        return name === i.name || groupName.includes(name)
      })
      if (~index) {
        return persons[index]
      } else {
        return null
      }
    }
    return null

  },
  emojiToUnicode(text) {
    return text.replace(/[\uD800-\uDFFF]/g, function (match) {
      return `\\u${match.charCodeAt(0).toString(16)}`;
    });
  },
})

module.exports = handle