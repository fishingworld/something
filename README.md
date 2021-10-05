# something
个人用Surge Panel脚本

由于panel脚本需要根据个人情况进行自定义，因此不再提供模组，请将需要的部分截取建立为本地模组并修改使用

使用效果：

#!name=Panels

#!desc=信息面板

[Panel]

SurgePro_FlushDNS = script-name=SurgePro_FlushDNS,update-interval=1

TrafficStatistics = script-name=TrafficStatistics,update-interval=1

NET_info = script-name=NET_info,update-interval=1

Sub_info = script-name=Sub_info,update-interval = 43200

NetflixSelect = script-name=NetflixSelect, update-interval=3600

groupPanelMaster= script-name=groupPanelMaster,update-interval=5



[Script]
#测试脚本

test = type=generic,timeout=10,script-path=test.js,argument=icon=arrow.clockwise.circle&color=#ef5b9c,debug=true

#附带清理DNS缓存

SurgePro_FlushDNS = type=generic,timeout=10,script-path=SurgePro_FlushDNS.js,argument=icon=crown.fill&color=#f6c970

#流量统计

TrafficStatistics = type=generic,timeout=10,script-path=TrafficStatistics.js,argument=icon=arrow.up.arrow.down.circle&color=#5d84f8

#網路詳情

NET_info = type=generic,timeout=10,script-path=NET_info.js,argument=icon=externaldrive.connected.to.line.below&color=#9a7ff7

#流量信息
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js,script-update-interval=0,argument=url=(URL encode后的机场节点链接)&reset_day=1&title=AmyInfo
Sub_info = type=generic,timeout=10,script-path=sub_info_panel.js,script-update-interval=0,argument=url=此处填写你的订阅&title=ExFlux&icon=opticaldisc&color=#5AC8FA

#NF解锁检测

nf_check = type=generic,script-path=nf_check.js, timeout=30,argument=icon1=checkmark.circle&color1=#55ba94&icon2=checkmark.circle.trianglebadge.exclamationmark&color2=#9a9ced&icon3=hand.raised.circle&color3=#ea5532&icon4=xmark.shield&color4=#AF52DE&title=Netflix Checker

#策略组面板

groupPanelMaster = type=generic,timeout=10,script-path=groupPanel.js,argument=icon=network&color=#86abee&group=Master

#netflix切换

NetflixSelect = type=generic, script-path=nf_autoselect.js, argument=icon1=checkmark.circle&color1=#55ba94&icon2=checkmark.circle.trianglebadge.exclamationmark&color2=#9a9ced&icon3=hand.raised.circle&color3=#ea5532&netflixGroup=Netflix

NetflixChecker = type=cron,cronexp=5 4 * * *,wake-system=1,timeout=3600,script-path=nf_autocheck.js,script-update-interval=0,control-api=1
