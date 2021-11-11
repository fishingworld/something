# Disney+策略組控制器

使用者反馈：Telegram  https://t.me/okmytg

脚本修改自： @Helge_0x00

效果展示：

![APc3kCsf2YDw7K1](https://i.loli.net/2021/10/07/APc3kCsf2YDw7K1.jpg)

![OP4NofYgsv5piSI](https://i.loli.net/2021/10/07/OP4NofYgsv5piSI.jpg)

⭐优化版（使用新版请删除旧版本）

https://raw.githubusercontent.com/fishingworld/something/main/DisneySelect/DisneyPlusController.sgmodule

1:优化版实用至上 大幅提高了使用效率 你可以更快速的控制你的策略组

2:首次执行或切换至新的子策略时会花费较长时间 这是在建立索引

3:策略组应当为完全的子策略组嵌套且模式应当为select 你不应放置任何单独节点 否则将失去效果 你可以隐藏你的子策略组

4:你可以调整cron代码以控制节点刷新的频率 但不宜过于频繁

5:参数部分与老版本相同

你可以配置捷径自动化实现打开Disney自动检测 

配置自动化后可以根据需要减少cron执行频率甚至你可以删除cron脚本

DisneyShortcut相对于DisneyChecker仅增加一项通知弹窗，如果你不想看到通知 捷径执行的脚本名称应当为DisneyChecker

![m4E7twi](https://i.imgur.com/m4E7twi.png)

![c6wUWif](https://i.imgur.com/c6wUWif.png)

![fEqMzsP](https://i.imgur.com/fEqMzsP.jpg)

❄老版本说明：（老版本可能仍有bug，但已经不再维护）
 
 1:panel脚本依赖cron脚本传送数据，你应当手动运行一次cron脚本以获取节点列表
 
 2:点击panel时切换至下一个可解锁节点，节点列表为空时仅执行状态检测
 
 3:panel脚本允许自动更新，自动更新将刷新策略组信息，并可以自动选择更优选项
 
 4: cron脚本用于遍历Disney策略组，以获取节点列表，你可以通过配置cron表达式以修改执行频率
 
 5:可用的自定义参数：
 
 icon1 color1:全解锁时的图标及颜色

 icon2 color2:即将上线的图标及颜色
 
 icon3 color3:无可用节点的图标及颜色
 
 disneyGroup：迪士尼策略组名称
 
 https://raw.githubusercontent.com/fishingworld/something/main/DisneySelect/DisneyPlusSelect.sgmodule
