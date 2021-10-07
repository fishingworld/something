#DisneyPlus策略组自动切换

效果展示：

![5qy8OTMP9lZx4JW](https://i.loli.net/2021/10/07/5qy8OTMP9lZx4JW.jpg)

![OP4NofYgsv5piSI](https://i.loli.net/2021/10/07/OP4NofYgsv5piSI.jpg)

脚本已经具备成熟的功能，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg

脚本说明：

 1:脚本修改自 @Helge_0x00
 
 2:panel脚本依赖cron脚本传送数据，你应当手动运行一次cron脚本以获取节点列表
 
 3:点击panel时切换至下一个可解锁节点，节点列表为空时仅执行状态检测
 
 4:panel脚本允许自动更新，自动更新将刷新策略组信息，并可以自动选择更优选项
 
 5: cron脚本用于遍历Disney策略组，以获取节点列表，你可以通过配置cron表达式以修改执行频率
 
 6:可用的自定义参数：
 
 icon1 color1:全解锁时的图标及颜色

 icon2 color2:即将上线的图标及颜色
 
 icon3 color3:无可用节点的图标及颜色
 
 disneyGroup：迪士尼策略组名称
 
 https://raw.githubusercontent.com/fishingworld/something/main/DisneySelect/DisneyPlusSelect.sgmodule
