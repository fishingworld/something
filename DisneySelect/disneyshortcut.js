/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：https://github.com/fishingworld/something/blob/main/DisneySelect/README.md
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

  ; (async () => {

    let disneyGroup = $persistentStore.read("DISNEYGROUP")
    let proxy = await httpAPI("/v1/policy_groups");
    let groupName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(disneyGroup) + "")).policy;

    let allGroup = [];
    for (var key in proxy) {
      allGroup.push(key)
    }

    //测试当前状态
    let { region, status } = await testDisneyPlus()
    let newStatus = status
    let reg = region
    if (newStatus < 0) {
      console.log("连接超时了，再测一次")
      await timeout(1000).catch(() => { })
      let { region, status } = await testDisneyPlus()
      newStatus = status
      reg = region
    }
    if (newStatus === 1) {
      console.log("当前节点仍可用 退出检测")
    } else {

      var regData
      if ($persistentStore.read("DISNETYREG") == null) {
        regData = {}
      } else {
        regData = JSON.parse($persistentStore.read("DISNETYREG"))
      }
      var statusData
      if ($persistentStore.read("DISNETYSTATUS") == null) {
        statusData = {}
      } else {
        statusData = JSON.parse($persistentStore.read("DISNETYSTATUS"))
      }


      let dataname;
      var unlocked = []
      var selectFU = []

      if ($persistentStore.read("DISNEYUNLOCKED") == null) {
      } else {
        //读取持久化数据
        unlocked = $persistentStore.read("DISNEYUNLOCKED").split(",");
        //清除空值
        del(unlocked, "")
      }

      /* 测试当选策略组节点状态并记录数据 */

      var selectName = []
      let select = proxy["" + groupName + ""];
      for (let i = 0; i < select.length; ++i) {
        selectName.push(select[i].name);
      }
      //去除历史数据
      for (let i = 0; i < selectName.length; ++i) {
        if (unlocked.includes(selectName[i]) == true) {
          del(unlocked, selectName[i])
        }
      }

      //遍历检测当选策略
      console.log("当前检测：" + groupName)
      for (let i = 0; i < selectName.length; ++i) {
        //切换节点
        $surge.setSelectGroupPolicy(groupName, selectName[i]);
        //等待
        await timeout(1000).catch(() => { })
        //执行测试
        let { region, status } = await testDisneyPlus()
        newStatus = status
        reg = region
        /* 检测超时 再测一次 */
        if (newStatus < 0) {
          console.log(selectName[i] + ": 连接超时了，再测一次")
          await timeout(1000).catch(() => { })
          let { region, status } = await testDisneyPlus()
          newStatus = status
          reg = region
        }
        console.log("检测结果：" + selectName[i] + " | " + statusName(newStatus))

        //填充数据
        dataname = selectName[i]
        regData[dataname] = reg
        statusData[dataname] = newStatus
        if (newStatus === 1) {
          if (unlocked.includes(selectName[i]) == false) {
            unlocked.push(selectName[i])
            selectFU.push(selectName[i])
          }
        }

        //找到全解锁节点 退出检测
        if (newStatus === 1) {
          console.log("找到可用节点 退出检测")
          break;
        }
      }

      //设定节点
      if (selectFU.length > 0) {
        $surge.setSelectGroupPolicy(groupName, selectFU[0]);
      } else {
        $surge.setSelectGroupPolicy(groupName, selectName[0]);
      }

      // 创建持久化数据

      $persistentStore.write(unlocked.toString(), "DISNEYUNLOCKED");
      $persistentStore.write(JSON.stringify(regData), "DISNETYREG")
      $persistentStore.write(JSON.stringify(statusData), "DISNETYSTATUS")


      //打印测试结果
      console.log("可解锁:" + unlocked.sort())
    }

    //获取根节点名
    let rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(disneyGroup) + "")).policy;
    while (allGroup.includes(rootName) == true) {
      rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(rootName) + "")).policy;
    }

    let info
    if (newStatus === 1) {
      info = `已选定节点： ${rootName} | ${statusName(newStatus)} | ${reg}`
    } else if (statusData[rootName] == 2) {
      info = `该地区即将上线 敬请期待哦～`
    } else {
      info = "该策略组暂无可供支援的节点"
    }

    $notification.post("Disney檢測", info, "")


    $done()

  })()

async function testDisneyPlus() {
  try {
    let { region, cnbl } = await Promise.race([testHomePage(), timeout(3000)])

    let { countryCode, inSupportedLocation, accessToken } = await Promise.race([getLocationInfo(), timeout(3000)])

    region = countryCode ?? region
    // 即将登陆
    if (inSupportedLocation === false || inSupportedLocation === 'false') {
      return { region, status: STATUS_COMING }
    }

    let support = await Promise.race([testPublicGraphqlAPI(accessToken), timeout(3000)])
    if (!support) {
      return { status: STATUS_NOT_AVAILABLE }
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

function testPublicGraphqlAPI(accessToken) {
  return new Promise((resolve, reject) => {
    let opts = {
      url: 'https://disney.api.edge.bamgrid.com/v1/public/graphql',
      headers: {
        'Accept-Language': 'en',
        Authorization: accessToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
      },
      body: JSON.stringify({
        query:
          'query($preferredLanguages: [String!]!, $version: String) {globalization(version: $version) { uiLanguage(preferredLanguages: $preferredLanguages) }}',
        variables: { version: '1.5.0', preferredLanguages: ['en'] },
      }),
    }

    $httpClient.post(opts, function (error, response, data) {
      if (error) {
        reject('Error')
        return
      }
      resolve(response.status === 200)
    })
  })
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
              manufacturer: 'apple',
              model: null,
              operatingSystem: 'macintosh',
              operatingSystemVersion: '10.15.7',
              osDeviceIds: [],
            },
            deviceFamily: 'browser',
            deviceLanguage: 'en',
            deviceProfile: 'macosx',
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
        token: { accessToken },
        session: {
          inSupportedLocation,
          location: { countryCode },
        },
      } = JSON.parse(data)?.extensions?.sdk
      resolve({ inSupportedLocation, countryCode, accessToken })
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

function statusName(status) {
  return status == 2 ? "即将登陆"
    : status == 1 ? "已解锁"
      : status == 0 ? "不解锁"
        : status == -1 ? "检测超时"
          : "检测异常";
}

function del(arr, num) {
  var l = arr.length;
  for (var i = 0; i < l; i++) {
    if (arr[0] !== num) {
      arr.push(arr[0]);
    }
    arr.shift(arr[0]);
  }
  return arr;
}
