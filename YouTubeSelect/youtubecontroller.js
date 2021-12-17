/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：https://github.com/fishingworld/something/upload/main/YouTubeSelect
*/

const BASE_URL = 'https://www.youtube.com/premium'

  ; (async () => {

    let params = getParams($argument)
    let youtubeGroup = params.YouTubeGroup
    //将策略组名称创建为持久化数据
    $persistentStore.write(youtubeGroup, "YOUTUBEGROUP");

    let proxy = await httpAPI("/v1/policy_groups");
    let groupName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(youtubeGroup) + "")).policy;
    var proxyName = [];//youtube节点组名称
    let arr = proxy["" + youtubeGroup + ""];
    for (let i = 0; i < arr.length; ++i) {
      proxyName.push(arr[i].name);
    }
    let allGroup = [];
    for (var key in proxy) {
      allGroup.push(key)
    }

    /* 手动切换策略 */
    let index;
    for (let i = 0; i < proxyName.length; ++i) {
      if (groupName == proxyName[i]) {
        index = i
      }
    };
    if ($trigger == "button") {
      index += 1;
      if (index > arr.length - 1) {
        index = 0;
      }
      $surge.setSelectGroupPolicy(youtubeGroup, proxyName[index]);
    };

    groupName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(youtubeGroup) + "")).policy;

    /* 判断节点列表是否为空 */
    var regData
    if ($persistentStore.read("YOUTUBEREG") == null) {
      regData = {}
    } else {
      regData = JSON.parse($persistentStore.read("YOUTUBEREG"))
    }

    let dataname;
    var isOK = []
    var selectOK = []

    if ($persistentStore.read("YOUTUBEISOK") == null) {
    } else {
      //读取持久化数据
      isOK = $persistentStore.read("YOUTUBEISOK").split(",");
      //清除空值
      del(isOK, "")
    }

    var selectName = []
    let select = proxy["" + groupName + ""];
    for (let i = 0; i < select.length; ++i) {
      selectName.push(select[i].name);
    }

    for (let i = 0; i < selectName.length; ++i) {
      if (isOK.includes(selectName[i]) == true) {
        selectOK.push(selectName[i])
      }
    }

    // 为空时执行检测
    if (selectOK.length == 0) {
      //遍历检测当选策略
      console.log("当前检测：" + groupName)
      let newStatus;
      let reg;
      for (let i = 0; i < selectName.length; ++i) {
        //切换节点
        $surge.setSelectGroupPolicy(groupName, selectName[i]);
        //等待
        await timeout(1000).catch(() => { })
        //执行测试
        let { status, region } = await testGoogle()
        newStatus = status
        reg = region
        /* 检测超时 再测一次 */
        if (newStatus < 1) {
          console.log(selectName[i] + ": 连接超时了，再测一次")
          await timeout(1000).catch(() => { })
          let { status, region } = await testGoogle()
          newStatus = status
          reg = region
        }
        console.log("检测结果：" + selectName[i] + " | " + statusName(newStatus))

        //填充数据
        dataname = selectName[i]
        regData[dataname] = reg
        if (newStatus === 2) {
          if (isOK.includes(selectName[i]) == false) {
            isOK.push(selectName[i])
            selectOK.push(selectName[i])
          }
        }

        //找到全解锁节点 退出检测
        if (newStatus === 2) {
          console.log("找到可用节点 退出检测")
          break;
        }
      }

      // 更新持久化数据
      $persistentStore.write(isOK.toString(), "YOUTUBEISOK");
      $persistentStore.write(JSON.stringify(regData), "YOUTUBEREG")
    }

    //设定节点
    if (selectOK.length > 0) {
      $surge.setSelectGroupPolicy(groupName, selectOK[0]);
    } else {
      $surge.setSelectGroupPolicy(groupName, selectName[0]);
    }

    /* 刷新信息 */
    //获取根节点名
    let rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(youtubeGroup) + "")).policy;
    while (allGroup.includes(rootName) == true) {
      rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(rootName) + "")).policy;
    }

    /**
       * 面板显示
       */

    let title = "YouTube ➟ " + rootName;

    let panel = {
      title: `${title}`,
    }
    
    if (isOK.includes(rootName) == true) {
      panel['content'] = `YouTube节点正常  地区：${regData[rootName]}`
      panel['icon'] = params.icon1
      panel['icon-color'] = params.color1
    } else {
      panel['content'] = `节点异常 你可能无法使用会员权益`
      panel['icon'] = params.icon2
      panel['icon-color'] = params.color2
    }

    $done(panel)


  })()

async function testGoogle() {
  try {
    const region = await Promise.race([test(), timeout(3000)])
    return { status: 2, region }
  } catch (error) {
    if (error === 'Not Available') {
      return { status: 1 }
    }
    console.log(error)
    return { status: 0 }
  }
}

function test() {
  return new Promise((resolve, reject) => {
    let option = {
      url: BASE_URL,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
        'Accept-Language': 'en',
      },
    }
    $httpClient.get(option, function (error, response, data) {
      if (error != null || response.status !== 200) {
        reject('Error')
        return
      }

      if (data.indexOf('Premium is not available in your country') !== -1) {
        reject('Not Available')
        return
      }

      let region = ''
      let re = new RegExp('"countryCode":"(.*?)"', 'gm')
      let result = re.exec(data)
      if (result != null && result.length === 2) {
        region = result[1]
      } else if (data.indexOf('www.google.cn') !== -1) {
        region = 'CN'
      } else {
        region = 'US'
      }
      resolve(region.toUpperCase())
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

function statusName(status) {
  return status == 2 ? "支持的"
    : status == 1 ? "被封禁"
      : status == 0 ? "检测超时"
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
