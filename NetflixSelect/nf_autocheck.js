/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：
 1:本脚本修改自 @Helge_0x00 
 2:本脚本用于遍历Netflix策略组，以获取节点列表
 3:本脚本与姊妹脚本nf_autoselect相互依赖，你应当优先执行一次panel脚本，且必须手动运行一次本脚本以获取节点列表
 4:你可以通过配置cron表达式以修改执行频率
*/

const FILM_ID = 81215567
const AREA_TEST_FILM_ID = 80018499


;(async () => {
let netflixGroup = $persistentStore.read("NFGroupName")
let proxy = await httpAPI("/v1/policy_groups");
let groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
let first = groupName;
var proxyName= [];//netflix节点组名称
let arr = proxy[""+netflixGroup+""];
for (let i = 0; i < arr.length; ++i) {
proxyName.push(arr[i].name);
}


/**
   * 遍历测试节点组
   */

var fullUnlock=[];
var onlyOriginal=[];

for (let i = 0; i < proxyName.length; ++i) {
//切换节点
$surge.setSelectGroupPolicy(netflixGroup, proxyName[i]);
//等待
await timeout(1000).catch(() => {})
//执行测试

let { status, regionCode, policyName } = await testPolicy(proxyName[i]);

//填充数据
if(status===2){
	if(fullUnlock.includes(proxyName[i])==false){
	fullUnlock.push(proxyName[i])
	console.log("全解锁: "+proxyName[i]+" | "+status)
		}
	}else if(status===1){
		if(onlyOriginal.includes(proxyName[i])==false){
		onlyOriginal.push(proxyName[i])
		console.log("仅自制: "+proxyName[i]+" | "+status)
		}
	}
  }

//去除杂项
for (let i = 0; i < fullUnlock.length; ++i){
	if(onlyOriginal.includes(fullUnlock[i])==true){
	fullUnlock.splice(fullUnlock.indexOf(fullUnlock[i]), 1)
	}
}

for (let i = 0; i < onlyOriginal.length; ++i){
	if(fullUnlock.includes(onlyOriginal[i])==true){
	onlyOriginal.splice(onlyOriginal.indexOf(onlyOriginal[i]), 1)
	}
}

// 创建持久化数据
$persistentStore.write(fullUnlock.toString(),"fullUnlockNetflix");
$persistentStore.write(onlyOriginal.toString(),"onlyOriginalNetflix")

//打印测试结果
console.log("全解锁:"+fullUnlock.sort())
console.log("仅自制:"+onlyOriginal.sort())

//设定策略选项为初始值
$surge.setSelectGroupPolicy(netflixGroup, first);

    $done()

})();





function httpAPI(path = "", method = "GET", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
            resolve(result);
        });
    });
};

async function testPolicy(policyName) {
  try {
    const regionCode = await Promise.race([testFilm(FILM_ID), timeout(3000)])
    return { status: 2, regionCode, policyName }
  } catch (error) {
    if (error === 'Not Found') {
      return { status: 1, policyName }
    }
    if (error === 'Not Available') {
      return { status: 0, policyName }
    }
    console.log(error)
    return { status: -1, policyName }
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

