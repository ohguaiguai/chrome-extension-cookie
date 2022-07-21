const getCookiesBtn = document.getElementById('getAllCookies');
const syncCookiesBtn = document.getElementById('syncCookies');
const removeCookiesBtn = document.getElementById('removeCookies');
const cookiesDiv = document.getElementById('cookies');

class Cookie {
  constructor() {
    this.originCookies = '';
    this.originUrl = '';
    this.currentUrl = '';
  }
  async init() {
    this.getCookiesFromStore();
    this.removeCookiesBtnBind();
  }

  syncCookiesBtnShowAndBind() {
    getCookiesBtn.style.display = 'none';
    syncCookiesBtn.style.display = 'show';
    syncCookiesBtn.addEventListener('click', () => {
      this.syncCookies();
    });
  }

  getCookiesBtnShowAndBind() {
    syncCookiesBtn.style.display = 'none';
    getCookiesBtn.style.display = 'show';
    getCookiesBtn.addEventListener('click', () => {
      this.getCookiesAndStore();
    });
  }

  removeCookiesBtnBind() {
    removeCookiesBtn.addEventListener('click', () => {
      this.removeCookiesFromStore();
    });
  }

  removeCookiesFromStore() {
    chrome.storage.local.clear(() => {
      alert('清除成功, 重新打开插件!');
    });
  }

  // 获取 store 中存的 cookies
  getCookiesFromStore() {
    chrome.storage.local.get(['originCookies'], (data) => {
      if (data.originCookies) {
        this.originCookies = data.originCookies;
        this.setCookiesHtml(this.originCookies);
        this.syncCookiesBtnShowAndBind();
      } else {
        this.getCookiesBtnShowAndBind();
      }
    });
    chrome.storage.local.get(['originUrl'], (data) => {
      if (data.originUrl) {
        this.originUrl = data.originUrl;
      }
    });
  }

  // 获取测试环境 cookies
  async getCookiesAndStore() {
    const url = await this.getTabUrl();
    const cookiesArr = await chrome.cookies.getAll({
      url: url + ''
    });
    this.setCookiesHtml(cookiesArr);
    chrome.storage.local.set({
      originCookies: cookiesArr,
      originUrl: url + ''
    });
    alert('获取成功, 打开开发环境同步!');
  }
  async getTabUrl() {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    let url = new URL(tab.url);
    return url;
  }

  async syncCookies() {
    this.currentUrl = await this.getTabUrl();

    if (
      String(this.originUrl) &&
      this.currentUrl + '' === this.originUrl + ''
    ) {
      alert('打开本地开发环境同步!');
      return;
    }

    const pending = this.originCookies.map((cookie) => {
      return this.syncCookie(cookie);
    });
    await Promise.all(pending);
    alert('同步成功, 刷新页面!(无需手动粘贴 identityId)');
  }

  async syncCookie(cookie) {
    return chrome.cookies.remove(
      {
        url: this.originUrl + '',
        name: cookie.name
      },
      () => {
        // 保证先设置本地路径下的 cookie, 再设置测试路径下的 cookie
        setTimeout(() => {
          chrome.cookies.set({
            url: this.originUrl + '',
            name: cookie.name,
            value: cookie.value,
            secure: cookie.secure,
            sameSite: cookie.sameSite,
            expirationDate: 24 * 30 * 60 * 60 * 1000 + Date.now()
          });
        }, 0);

        chrome.cookies.set(
          {
            url: this.currentUrl + '',
            name: cookie.name,
            value: cookie.value,
            expirationDate: 24 * 30 * 60 * 60 * 1000 + Date.now()
          },
          () => {
            if (cookie.name === 'Recent-Identity-Id') {
              chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                  chrome.tabs.sendMessage(tabs[0].id, { value: cookie.value });
                }
              );
            }
          }
        );
      }
    );
  }

  setCookiesHtml(cookiesArr) {
    cookiesDiv.innerHTML =
      `<div class='title'>已经获取到的 cookies :</div>` +
      cookiesArr
        .map(
          (cookie) =>
            `<div><span class='name'>${cookie.name}</span><span class='value'>${cookie.value}</span></div>`
        )
        .join('');
  }
}

const c = new Cookie();
c.init();
