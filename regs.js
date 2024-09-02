const regs = {
    name: /(?<=@).*?(?=<br>)/g,
    pkName: /(?<=「).*?(?=」)/g,
    bossOver: /(?<=\[).*?(?=\] )/g,
    teamPerson: /(?<=\.).*?(?=<br>)/g,
}

module.exports = regs