const { getTraffic, getCookieList } = require('./utils')
const notify = require('./sendNotify');

async function run() {
  const cookieList = await getCookieList()
  const messages = []
  for (let i = 0; i < cookieList.length; i++) {
    let msg = `账号 ${i + 1}`
    const arr = await getTraffic(cookieList[i])
    msg += `\n${arr.join('\n')}`
    messages.push(msg)
  }

  await notify.sendNotify(`iKuuu VPN 今日流量统计`, messages.join('\n\n========================\n\n'))
}

run()
