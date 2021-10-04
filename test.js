let params = getParams($argument)

;(async () => {

console.log((await httpAPI("/v1/traffic")))





  $done({
      title:"测试",
      content:"111",
      icon: params.icon,
		"icon-color":params.color
    });

})()


function httpAPI(path = "", method = "GET", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
			console.log(result)
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
