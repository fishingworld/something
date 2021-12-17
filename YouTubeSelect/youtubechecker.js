/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：https://github.com/fishingworld/something/tree/main/YouTubeSelect
*/

const BASE_URL = 'https://www.youtube.com/premium'

  ; (async () => {
    //测试当前状态
    let { status, region } = await testGoogle()
    let newStatus = status
    let reg = region
    if (newStatus < 1) {
      console.log("连接超时了，再测一次")
      await timeout(1000).catch(() => { })
      let { status, region } = await testGoogle()
      newStatus = status
      reg = region
    }
    if (newStatus === 2) {
      console.log("当前节点仍可用 退出检测")
    } else {

      let youtubeGroup = $persistentStore.read("YOUTUBEGROUP")
      let proxy = await httpAPI("/v1/policy_groups");
      let groupName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(youtubeGroup) + "")).policy;

      let allGroup = [];
      for (var key in proxy) {
        allGroup.push(key)
      }
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

      /* 测试当选策略组节点状态并记录数据 */

      var selectName = []
      let select = proxy["" + groupName + ""];
      for (let i = 0; i < select.length; ++i) {
        selectName.push(select[i].name);
      }
      //去除历史数据
      for (let i = 0; i < selectName.length; ++i) {
        if (isOK.includes(selectName[i]) == true) {
          del(isOK, selectName[i])
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

      //设定节点
      if (selectOK.length > 0) {
        $surge.setSelectGroupPolicy(groupName, selectOK[0]);
      } else {
        $surge.setSelectGroupPolicy(groupName, selectName[0]);
      }

      // 创建持久化数据

      $persistentStore.write(isOK.toString(), "YOUTUBEISOK");
      $persistentStore.write(JSON.stringify(regData), "YOUTUBEREG")

      //打印测试结果
      console.log("支持的:" + isOK.sort())
    }

    $done()

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
