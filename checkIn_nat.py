#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
natpierce.cn 青龙面板自动签到脚本
运行环境：青龙面板 Python3
依赖：requests 库（青龙面板默认已安装）
"""
import requests
import time
import os

# 配置项（青龙面板中通过环境变量 NATPIERCE_COOKIE 配置，无需修改此处）
COOKIE = os.getenv("NATPIERCE_COOKIE")  # 从青龙环境变量读取Cookie
BASE_URL = "https://www.natpierce.cn/"
# 签到接口（若后续网站接口变更，需抓包更新此地址）
SIGN_URL = f"{BASE_URL}user/checkin"

def natpierce_sign():
    """执行签到逻辑"""
    if not COOKIE:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 错误：未配置 NATPIERCE_COOKIE 环境变量！")
        return False

    # 请求头（模拟浏览器请求，避免被拦截）
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": COOKIE,
        "Referer": BASE_URL,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest"
    }

    try:
        # 发送签到请求（多数网站签到为POST/GET，此处先按POST，若失败可改为GET）
        response = requests.post(
            SIGN_URL,
            headers=headers,
            timeout=15  # 超时时间15秒
        )
        
        # 打印响应信息（方便调试）
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 签到响应状态码：{response.status_code}")
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 签到响应内容：{response.text}")

        # 解析签到结果（根据网站实际返回的JSON调整判断逻辑）
        result = response.json()
        if result.get("code") == 200 or "成功" in result.get("msg", ""):
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 签到成功！{result.get('msg', '无返回信息')}")
            return True
        else:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 签到失败：{result.get('msg', '未知原因')}")
            return False

    except requests.exceptions.Timeout:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 错误：签到请求超时！")
        return False
    except requests.exceptions.ConnectionError:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 错误：网络连接失败！")
        return False
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 签到异常：{str(e)}")
        return False

if __name__ == "__main__":
    # 执行签到
    natpierce_sign()