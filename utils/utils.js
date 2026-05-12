const { initInstance, getEnv } = require('./qlApi.js')
const axios = require('axios')

const host = 'https://ikuuu.org'
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

/** 获取 Cookie 数组 */
async function getCookieList() {
  let instance = null
  try {
    instance = await initInstance()
  } catch (e) { }
  let cookieEnv = process.env.IKUUU_COOKIE || []
  try {
    if (instance) {
      cookieEnv = await getEnv(instance, 'IKUUU_COOKIE')
    }
  } catch { }
  const cookieList = extractArr(cookieEnv)
  if (!cookieList.length) {
    console.log('未获取到 Cookie, 程序终止')
    process.exit(1)
  }
  console.log(`✅ 成功读取 ${cookieList.length} 条 Cookie`)
  return cookieList
}

function SlowerDecodeBase64(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split("").map(function (c) {
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

module.exports = { getTraffic, getCookieList }
