/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：https://github.com/fishingworld/something/blob/main/NetflixSelect/README.md
*/

const FILM_ID = 81215567
const AREA_TEST_FILM_ID = 80018499


  ; (async () => {

    let netflixGroup = $persistentStore.read("NFGroupName")
    let proxy = await httpAPI("/v1/policy_groups");
    let groupName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(netflixGroup) + "")).policy;

    let allGroup = [];
    for (var key in proxy) {
      allGroup.push(key)
    }

    //测试当前状态
    let { status, regionCode } = await testPolicy();
    let newStatus = status
    let reg = regionCode
    if (status < 0) {
      console.log("连接超时了，再测一次")
      await timeout(1000).catch(() => { })
      let { status, regionCode } = await testPolicy();
      newStatus = status
      reg = regionCode
    }
    if (newStatus === 2) {
      console.log("当前节点仍可用 退出检测")
    } else {

      var data
      if ($persistentStore.read("NFREGIONCODE") == null) {
        data = {}
      } else {
        data = JSON.parse($persistentStore.read("NFREGIONCODE"))
      }

      let dataname;
      var fullUnlock = [];
      var onlyOriginal = [];
      var selectFU = []
      var selectOG = []


      if ($persistentStore.read("FULLUNLOCK") == null || $persistentStore.read("ONLYORIGINAL") == null) {
      } else {
        //读取持久化数据
        fullUnlock = $persistentStore.read("FULLUNLOCK").split(",");
        onlyOriginal = $persistentStore.read("ONLYORIGINAL").split(",");
        //清除空值
        del(fullUnlock, "")
        del(onlyOriginal, "")
      }

      /* 测试当选策略组节点状态并记录数据 */

      var selectName = []
      let select = proxy["" + groupName + ""];
      for (let i = 0; i < select.length; ++i) {
        selectName.push(select[i].name);
      }
      //去除历史数据
      for (let i = 0; i < selectName.length; ++i) {
        if (fullUnlock.includes(selectName[i]) == true) {
          del(fullUnlock, selectName[i])
        } else if (onlyOriginal.includes(selectName[i]) == true) {
          del(onlyOriginal, selectName[i])
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

        let { status, regionCode } = await testPolicy();
        newStatus = status
        reg = regionCode
        /* 检测超时 再测一次 */
        if (newStatus < 0) {
          console.log(selectName[i] + ": 连接超时了，再测一次")
          await timeout(1000).catch(() => { })
          let { status, regionCode } = await testPolicy();
          newStatus = status
          reg = regionCode
        }
        console.log("检测结果：" + selectName[i] + " | " + statusName(newStatus))
        //填充数据
        dataname = selectName[i]
        data[dataname] = reg
        if (newStatus === 2) {
          if (fullUnlock.includes(selectName[i]) == false) {
            fullUnlock.push(selectName[i])
            selectFU.push(selectName[i])
          }
        } else if (newStatus === 1) {
          if (onlyOriginal.includes(selectName[i]) == false) {
            onlyOriginal.push(selectName[i])
            selectOG.push(selectName[i])
          }
        }
        //找到全解锁节点 退出检测
        if (newStatus == 2) {
          console.log("找到可用节点 退出检测")
          break;
        }
      }

      /* 择优选择节点 */
      //设定选择列表
      var selectList = []

      console.log(selectFU.length + " | " + selectOG.length)

      if (selectFU.length > 0) {
        selectList = selectFU
      } else if (selectFU.length == 0 && selectOG.length > 0) {
        selectList = selectOG
      }

      console.log("选择列表:" + selectList.sort())
      //切换节点
      if (selectList.length > 0) $surge.setSelectGroupPolicy(groupName, selectList[0]);




      // 创建持久化数据

      $persistentStore.write(fullUnlock.toString(), "FULLUNLOCK");
      $persistentStore.write(onlyOriginal.toString(), "ONLYORIGINAL")
      $persistentStore.write(JSON.stringify(data), "NFREGIONCODE")

      //打印测试结果
      console.log("全解锁:" + fullUnlock.sort())
      console.log("仅自制:" + onlyOriginal.sort())
    }

    //获取根节点名
    let rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(netflixGroup) + "")).policy;
    while (allGroup.includes(rootName) == true) {
      rootName = (await httpAPI("/v1/policy_groups/select?group_name=" + encodeURIComponent(rootName) + "")).policy;
    }


    let info
    if (newStatus === 2) {
      info = `已选定节点： ${rootName} | ${statusName(newStatus)} | ${reg}`
    } else if (newStatus === 1) {
      info = `已选定节点： ${rootName} | ${statusName(newStatus)}`
    } else {
      info = "该策略组暂无可供支援的节点"
    }

    $notification.post("Netflix檢測", info, "")

    $done()

  })();





function httpAPI(path = "", method = "GET", body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, (result) => {
      resolve(result);
    });
  });
};

async function testPolicy() {
  try {
    const regionCode = await Promise.race([testFilm(FILM_ID), timeout(3000)])
    return { status: 2, regionCode }
  } catch (error) {
    if (error === 'Not Found') {

      return { status: 1 }
    }
    if (error === 'Not Available') {
      return { status: 0 }
    }
    console.log(error)
    return { status: -1 }
  }
}

/**
 * 测试是否解锁
 */
function testFilm(filmId) {
  return new Promise((resolve, reject) => {
    let option = {
      url: `https://www.netflix.com/title/${filmId}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      },
    }
    $httpClient.get(option, function (error, response, data) {
      if (error != null) {
        reject(error)
        return
      }

      if (response.status === 403) {
        reject('Not Available')
        return
      }

      if (response.status === 404) {
        reject('Not Found')
        return
      }

      if (response.status === 200) {
        let url = response.headers['x-originating-url']
        let region = url.split('/')[3]
        region = region.split('-')[0]
        if (region == 'title') {
          region = 'us'
        }
        resolve(region.toUpperCase())
        return
      }

      reject('Error')
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

function statusName(status) {
  return status == 2 ? "全解锁"
    : status == 1 ? "仅自制"
      : status == 0 ? "不解锁"
        : status == -1 ? "检测超时"
          : "检测失败";
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
