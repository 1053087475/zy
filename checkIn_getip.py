# -*- coding: UTF-8 -*-
# Version: v1.0
# Created by lstcml on 2022/05/28

import os
import re
import sys
import requests
import datetime

# 更新检测
def checkUpdate():
    print("当前运行的脚本版本：" + str(version))
    try:
        r1 = requests.get("https://gitee.com/lstcml/qinglongscripts/raw/master/getip.py").text
        r2 = re.findall(re.compile("version = \d.\d"), r1)[0].split("=")[1].strip()
        if float(r2) > version:
            print("发现新版本：" + r2)
            print("正在自动更新脚本...")
            os.system("ql raw https://gitee.com/lstcml/qinglongscripts/raw/master/getip.py &")
    except:
        pass


# 获取公网地址
def getPublicIP():
    try:
        url = 'https://2022.ip138.com1/'
        _headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36'}
        response = requests.get(url, headers=_headers, data={})
        response.encoding = response.apparent_encoding 
        r1 = re.compile(r'<title>(.*?)</title>').findall(response.text)[0]
        r2 = re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b').findall(r1)[0]
        if re.match(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",r):
            return r2
    except:
        try:
            url = 'https://ip.tool.chinaz.com/'
            _headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36'}
            response = requests.get(url, headers=_headers, data={})
            response.encoding = response.apparent_encoding
            r = re.compile(r'<dd class="fz24">(.*?)</dd>').findall(response.text)[0]
            
            if re.match(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",r):
                return r
        except:
            return ''

# 推送
def load_send():
    global send
    cur_path = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(cur_path)
    sendNotifPath = cur_path + "/sendNotify.py"
    if not os.path.exists(sendNotifPath):
        res = requests.get("https://gitee.com/lstcml/qinglongscripts/raw/master/sendNotify.py")
        with open(sendNotifPath, "wb") as f:
            f.write(res.content)
    try:
        from sendNotify import send
        return True
    except:
        print("加载通知服务失败！")
        return False

if __name__ == '__main__':
    version = 1.0
    checkUpdate()
    ip = getPublicIP()
    if ip != '':
        content = '当前设备公网IP地址：%s' % ip
        if load_send():
            send(datetime.datetime.now().strftime("%Y.%m.%d") + " 设备公网IP地址", content)
    else:
        content = '获取设备公网IP地址失败！'
    #print(content)