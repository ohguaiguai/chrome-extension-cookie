// document.addEventListener('DOMContentLoaded', function () {
//   console.log('1111hahahahah');
// });
// 修改 content-scripts 之后要 reload 插件才会生效
console.log('ideat-cookies 插件已准备好了。');
chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log('111收到消息: ', request, sender);
  if (request.msg === 'getFangInfo') {
    const fang_info = localStorage.getItem('fang-roleInfo');
    console.log('fang_info: ', fang_info);
    chrome.storage.local.set({ fangInfo: JSON.parse(fang_info) });
  } else if (request.msg === 'setFangInfo') {
    chrome.storage.local.get(['fangInfo'], (data) => {
      console.log('fang_info: ', data);
      localStorage.setItem('fang-roleInfo', JSON.stringify(data.fangInfo));
    });
  }
});
