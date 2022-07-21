// document.addEventListener('DOMContentLoaded', function () {
//   console.log('1111hahahahah');
// });
// 修改 content-scripts 之后要 reload 插件才会生效
console.log('qingque-cookies 插件已准备好了。');
chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log('111收到消息: ', request, sender);
  sessionStorage.setItem('identityId', request.value); // popup 里不能操作 sessionStorage
});
