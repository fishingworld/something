/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：
 1:本
 2:本脚本与姊妹脚本disney_checker相互依赖，你必须手动运行一次cron脚本以获取节点列表
 3:为了节省效能，请尽量精简策略组
 4:点击panel时切换至下一个可解锁节点
 5:panel脚本允许自动更新，自动更新将刷新策略组信息，并可以自动选择更优选项
 6:可用的自定义参数：
 icon1 color1:全解锁时的图标及颜色
 icon2 color2:即将上线的图标及颜色
 icon3 color3:无可用节点的图标及颜色
 disneyGroup：迪士尼策略组名称
*/

const AUTHORIZATION = 'Bearer ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'

// 即将登陆
const STATUS_COMING = 2
// 支持解锁
const STATUS_AVAILABLE = 1
// 不支持解锁
const STATUS_NOT_AVAILABLE = 0
// 检测超时
const STATUS_TIMEOUT = -1
// 检测异常
const STATUS_ERROR = -2

;(async () => {
let params = getParams($argument)
let disneyGroup = params.disneyGroup
//将策略组名称创建为持久化数据
$persistentStore.write(disneyGroup,"DISNEYGROUP");

let proxy = await httpAPI("/v1/policy_groups");
let groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
let first = groupName;
var proxyName= [];//Disney节点组名称
let arr = proxy[""+disneyGroup+""];
for (let i = 0; i < arr.length; ++i) {
proxyName.push(arr[i].name);
}
let allGroup = [];
for (var key in proxy){
   allGroup.push(key)
    }

var unlocked = [];
/* 读取持久化数据 */
unlocked = $persistentStore.read("unlockedDisney").split(",");

//打印数据结果
console.log("可解锁: " + unlocked.sort())

/**
   * 过滤选择列表
   */

var select=[];
//清除空值
if(unlocked.toString().length==0){
	unlocked.splice(unlocked.indexOf(unlocked[0]), 1)
	}
//删除策略组外节点并更新持久化数据
if(unlocked.length>0){
	for (let i = 0; i < unlocked.length; ++i) {
	if(proxyName.includes(unlocked[i])==true){
		select.push(unlocked[i])
		}
	}
	
	$persistentStore.write(select.sort().toString(),"unlockedDisney");
}

console.log("选择列表:"+select.sort())

/* 手动切换 */

if($trigger == "button"){

//当前节点
groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
console.log("当前节点:"+groupName)

let index;
if(select.includes(groupName)==true){
	index = select.indexOf(groupName)+1;
}else{
index = 0
}

if(index>=select.length){
	index=0
}
console.log("目标节点:"+ select[index])
if(select.length>0){
$surge.setSelectGroupPolicy(disneyGroup, select[index]);
}
await timeout(1000).catch(() => {})
}

/**
   * 自动刷新
   */

/* 检查选择列表 */
console.log(select.length)
if(select.length==0){
	$notification.post("节点列表获取失败", "请手动运行一次DisneyChecker脚本", "")
}
//测试当前选择

//当前节点
groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
console.log("当前节点:"+groupName)

let { region, status } = await testDisneyPlus()
let newStatus=status
let reg = region
console.log("节点状态:"+status)
/* 检测超时 再测一次 */
if(status <0) {
	console.log(groupName+": 连接超时了，再测一次")
	await timeout(1000).catch(() => {})
	let { region, status } = await testDisneyPlus()
	newStatus=status
	reg = region
	console.log("当前节点:"+groupName)
	console.log("节点状态:"+newStatus)
}

status = newStatus
region = reg 


/* 当前节点不可解锁时，执行自动切换，若列表为空，仅执行测试 */
if(status!= 1){
	if(select.length>0){
	//遍历选择列表，找到第一个更优节点
		for (let i = 0; i < select.length; ++i) {
		console.log("在找新节点了，稍等一下")
		$surge.setSelectGroupPolicy(disneyGroup, select[i]);
		await timeout(1000).catch(() => {})
		groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
		console.log("当前节点:"+groupName)
		let { region, status } = await testDisneyPlus()
		console.log("节点状态:"+status)
		if(status==1){
			newStatus=status
			reg = region
			break;
			}
		}
	}else {
	groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
	console.log("当前节点:"+groupName)
	let { region, status } = await testDisneyPlus()
	console.log("节点状态:"+status)
	newStatus = status
	reg = region
	}
}

	status= newStatus
	region =reg
	
	
//获取根节点名
let rootName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
while(allGroup.includes(rootName)==true){
	rootName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(rootName)+"")).policy;
}

/**
   * 面板显示
   */



let title = "Disney+ ➟ " + rootName;

let panel = {
  title: `${title}`,
}
  
  if (status==1) {
    panel['content'] = `支援Disney+，区域：${region}`
    panel['icon'] = params.icon1
	 panel['icon-color'] = params.color1
  } else if (status==2) {
      panel['content'] = `即将登陆，敬请期待，区域：${region}`
      panel['icon'] = params.icon2
	   panel['icon-color'] = params.color2
    }else {
 		$surge.setSelectGroupPolicy(disneyGroup, first);
  		panel['content'] = `您的节点不支持Disney+呢～`
  		panel['icon'] = params.icon3
	 	panel['icon-color'] = params.color3
		return
	}

console.log(panel)

    $done(panel)


})()

async function testDisneyPlus() {
  try {
    let { region, cnbl } = await Promise.race([testHomePage(), timeout(3000)])

    // 即将登陆
    if (cnbl == 2) {
      return { region, status: STATUS_COMING }
    }

	 let { countryCode, inSupportedLocation } = await Promise.race([getLocationInfo(), timeout(1000)])


    region = countryCode?? region
    // 即将登陆
    if (inSupportedLocation === false || inSupportedLocation === 'false') {
      return { region, status: STATUS_COMING }
    }

    // 支持解锁
    return { region, status: STATUS_AVAILABLE }
  } catch (error) {
    console.log(error)

    // 不支持解锁
    if (error === 'Not Available') {
      return { status: STATUS_NOT_AVAILABLE }
    }

    // 检测超时
    if (error === 'Timeout') {
      return { status: STATUS_TIMEOUT }
    }

    return { status: STATUS_ERROR }
  }
}



function getLocationInfo() {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
      headers: {
        'Accept-Language': 'en',
        Authorization: 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({
        query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
        variables: {
          input: {
            applicationRuntime: 'chrome',
            attributes: {
              browserName: 'chrome',
              browserVersion: '94.0.4606',
              manufacturer: 'microsoft',
              model: null,
              operatingSystem: 'windows',
              operatingSystemVersion: '10.0',
              osDeviceIds: [],
            },
            deviceFamily: 'browser',
            deviceLanguage: 'en',
            deviceProfile: 'windows',
          },
        },
      }),
    }

    $httpClient.post(opts, function (error, response, data) {
      if (error) {
        reject('Error')
        return
      }

      if (response.status !== 200) {
        reject('Not Available')
        return
      }

      let {
        inSupportedLocation,
        location: { countryCode },
      } = JSON.parse(data)?.extensions?.sdk?.session
      resolve({ inSupportedLocation, countryCode })
    })
  })
}

function testHomePage() {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://www.disneyplus.com/',
      headers: {
        'Accept-Language': 'en',
        'User-Agent': UA,
      },
    }

    $httpClient.get(opts, function (error, response, data) {
      if (error) {
        reject('Error')
        return
      }
      if (response.status !== 200 || data.indexOf('unavailable') !== -1) {
        reject('Not Available')
        return
      }

      let match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/)
      if (!match) {
        resolve({ region: '', cnbl: '' })
        return
      }

      let region = match[1]
      let cnbl = match[2]
      resolve({ region, cnbl })
    })
  })
}

function timeout(delay = 5000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('Timeout')
    }, delay)
  })
}


function replaceRegionPlaceholder(content, region) {
  let result = content

  if (result.indexOf('#REGION_CODE#') !== -1) {
    result = result.replaceAll('#REGION_CODE#', region.toUpperCase())
  }
  if (result.indexOf('#REGION_FLAG#') !== -1) {
    result = result.replaceAll('#REGION_FLAG#', getCountryFlagEmoji(region.toUpperCase()))
  }

  if (result.indexOf('#REGION_NAME#') !== -1) {
    result = result.replaceAll('#REGION_NAME#', RESION_NAMES?.[region.toUpperCase()]?.chinese ?? '')
  }

  if (result.indexOf('#REGION_NAME_EN#') !== -1) {
    result = result.replaceAll('#REGION_NAME_EN#', RESION_NAMES?.[region.toUpperCase()]?.english ?? '')
  }

  return result
}

function httpAPI(path = "", method = "GET", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
            resolve(result);
        });
    });
};

function getParams(param) {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}