const { initInstance, getEnv } = require('utils/qlApi.js')
const axios = require('axios')

const host = 'https://ikuuu.org'
const loginURL = host + '/auth/login'
const infoURL = host + '/user'
const todayTrafficReg = /今日已用\n.*\s(\d+\.?\d*)([M|G|K]?B)/
const restTrafficReg = /剩余流量[\s\S]*<span class="counter">(\d+\.?\d*)<\/span> ([M|G|K]?B)/

function extractArr(envStr) {
  if (typeof envStr === 'string') {
    envStr = envStr.trim()
  }

  if (Array.isArray(envStr)) {
    return envStr
  } else if (envStr.includes('\n')) {
    return envStr.split('\n').map(v => v.trim()).filter(Boolean)
  }
  return [envStr]
}

/** 获取邮箱和密码数组 */
async function getEmailAndPwdList() {
  let instance = null
  try {
    instance = await initInstance()
  } catch (e) { }

  let emailEnv = process.env.IKUUU_EMAIL || []
  let pwdEnv = process.env.IKUUU_PWD || []

  try {
    if (instance) {
      emailEnv = await getEnv(instance, 'IKUUU_EMAIL')
      pwdEnv = await getEnv(instance, 'IKUUU_PWD')
    }
  } catch { }

  const emailList = extractArr(emailEnv)
  const pwdList = extractArr(pwdEnv)

  const emailLen = emailList.length
  const pwdLen = pwdList.length

  if (!emailLen || !pwdLen) {
    console.log('未获取到邮箱和密码, 程序终止')
    process.exit(1)
  }

  if (emailLen !== pwdLen) {
    console.log('邮箱和密码数量不一致, 程序终止')
    process.exit(1)
  }

  console.log(`✅ 成功读取 ${emailLen} 对邮箱和密码`)

  return [emailList, pwdList]
}

/** 登录获取 cookie */
async function getCookie(email, pwd) {
  const formData = new FormData()
  formData.append('email', email)
  formData.append('passwd', pwd)
  let msg = ''
  try {
    const res = await axios(loginURL, {
      method: 'POST',
      data: formData
    })
    if (res.data.ret === 0) {
      msg = `❌ 登录失败：${res.data.msg}`
      console.log(msg)
      return msg
    }
    console.log(`✅ 登录成功：${email}`)
    return res.headers['set-cookie'].join('; ')
  } catch (e) {
    msg = `❌ 登录失败：${e.message}`
    console.log(msg)
    return msg
  }
}
function SlowerDecodeBase64(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
}
// modern browsers use TextDecoder faster
function FasterDecodeBase64(base64) {
    const text = atob(base64);
    const length = text.length;
    const bytes = new Uint8Array(length);
    let i = 0;
    for (i = 0; i < length; i++) {
        bytes[i] = text.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    // default is utf-8
    return decoder.decode(bytes);
}
function decodeBase64(str) {
    try {
        return FasterDecodeBase64(str);
    } catch (e) {
        return SlowerDecodeBase64(str);
    }
}

/** 获取流量 */
async function getTraffic(cookie) {
  try {
    const { data } = await axios(infoURL, {
      method: 'GET',
      headers: {
        Cookie: cookie
      },
      withCredentials: true
    })
    const originBodyMatch = data.match(/var originBody = "([^"]+)"/);
    let decodeData = ''
    if (originBodyMatch && originBodyMatch[1]) {
        const originBody = originBodyMatch[1];
        // 解码 Base64
        decodeData = decodeBase64(originBody);
    } else {
        console.log("未找到原始HTML");
        return;
    }
    const trafficRes = decodeData.match(todayTrafficReg)
    const restRes = decodeData.match(restTrafficReg)
    if (!trafficRes || !restRes) {
      return ['查询流量失败，请检查正则和用户页面 HTML 结构']
    }

    const [, today, todayUnit] = trafficRes
    const [, rest, restUnit] = restRes

    return [
      `今日已用：${today} ${todayUnit}`,
      `剩余流量：${rest} ${restUnit}`
    ]
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

module.exports = { getCookie, getTraffic, getEmailAndPwdList }
