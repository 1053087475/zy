const axios = require('axios')
const { getTraffic, getCookieList } = require('./utils')
const notify = require('./sendNotify')

const host = 'https://ikuuu.org'
const checkinURL = host + '/user/checkin'

/** 签到 */
async function checkin(cookie) {
  try {
    const res = await axios(checkinURL, {
      method: 'POST',
      headers: {
        Cookie: cookie
      },
      withCredentials: true
    })
    return res.data.msg
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

async function run() {
  const messages = []

  const cookieList = await getCookieList()
  for (let i = 0; i < cookieList.length; i++) {
    let msg = `账号 ${i + 1}`
    const checkinRes = await checkin(cookieList[i])
    msg += `\n${checkinRes}`
    const arr = await getTraffic(cookieList[i])
    msg += `\n${arr.join('\n')}`
    messages.push(msg)
  }

  await notify.sendNotify(`iKuuu VPN 签到通知`, messages.join('\n\n========================\n\n'))
}

run()
