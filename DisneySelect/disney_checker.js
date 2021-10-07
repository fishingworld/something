/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：
 1:本脚本修改自 @Helge_0x00 
 2:本脚本用于遍历Disney策略组，以获取节点列表
 3:本脚本与姊妹脚本disney_selecter相互依赖，你必须手动运行一次本脚本以获取节点列表
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
let disneyGroup = $persistentStore.read("DISNEYGROUP")
let proxy = await httpAPI("/v1/policy_groups");
let groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(disneyGroup)+"")).policy;
let first = groupName;
var proxyName= [];//Disney节点组名称
let arr = proxy[""+disneyGroup+""];
for (let i = 0; i < arr.length; ++i) {
proxyName.push(arr[i].name);
}

/**
   * 遍历测试节点组
   */
var unlocked = [];
for (let i = 0; i < proxyName.length; ++i) {
/* 切换节点 */
$surge.setSelectGroupPolicy(disneyGroup, proxyName[i]);
//等待
await timeout(1000).catch(() => {})
//执行测试
let { region, status } = await testDisneyPlus()
let newStatus=status
/* 检测超时 再测一次 */
if(status == -1) {
	console.log(proxyName[i]+": 连接超时了，再测一次")
	await timeout(1000).catch(() => {})
	let { region, status } = await testDisneyPlus()
	newStatus=status
}

/* 填充数据 */
status = newStatus
if(status==1){
	if(unlocked.includes(proxyName[i])==false){
		unlocked.push(proxyName[i])
		console.log("可解锁: "+ proxyName[i]+" | "+status)
		}
	}
}

/* 创建持久化数据 */
$persistentStore.write(unlocked.toString(),"unlockedDisney");
console.log("可解锁"+unlocked.sort())
//设定策略选项为初始值
$surge.setSelectGroupPolicy(disneyGroup, first);

	  $done()


})()

async function testDisneyPlus() {
  try {
    let { region, cnbl } = await Promise.race([testHomePage(), timeout(3000)])

    // 即将登陆
    if (cnbl == 2) {
      return { region, status: STATUS_COMING }
    }

    let { refresh_token } = await Promise.race([getToken(), timeout(1000)])
    let { countryCode, inSupportedLocation } = await Promise.race([getLocationInfo(refresh_token), timeout(1000)])

    region = countryCode ?? region
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

function getToken() {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://global.edge.bamgrid.com/token',
      headers: {
        'Accept-Language': 'en',
        Authorization: AUTHORIZATION,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange&latitude=0&longitude=0&platform=browser&subject_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhMmM3MmZiNS1kOGI1LTQ0ZDItYjJmNi0zMWRkMWFiN2Y1N2QiLCJhdWQiOiJ1cm46YmFtdGVjaDpzZXJ2aWNlOnRva2VuIiwibmJmIjoxNjMzMzU4MzE1LCJpc3MiOiJ1cm46YmFtdGVjaDpzZXJ2aWNlOmRldmljZSIsImV4cCI6MjQ5NzM1ODMxNSwiaWF0IjoxNjMzMzU4MzE1LCJqdGkiOiJkYmNiZjUzYS1lZDEwLTRjOGItYjU2My01ZDJkNTc1ZDFlMDEifQ.xGII2Ud7xHWELrpW_OSnunFGlfJ6EFWQ2PzSYJGsMLY13u5iUR6QKCcBkUaEPMcHaVTTwQypc9hP9q7-52kgHQ&subject_token_type=urn%3Abamtech%3Aparams%3Aoauth%3Atoken-type%3Adevice',
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

      resolve(JSON.parse(data))
    })
  })
}

function getLocationInfo(refreshToken) {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
      headers: {
        'Accept-Language': 'en',
        Authorization: AUTHORIZATION,
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({
        query: 'mutation refreshToken($input: RefreshTokenInput!) { refreshToken(refreshToken: $input) { activeSession { sessionId } } }',
        variables: {
          input: {
            refreshToken,
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

