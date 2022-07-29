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
    const { tab, url } = await this.getTabUrl();
    const cookiesArr = await chrome.cookies.getAll({
      url: url + ''
    });
    this.setCookiesHtml(cookiesArr);

    chrome.storage.local.set({
      originCookies: cookiesArr,
      originUrl: url + ''
    });

    // 获取 fang-roleInfo
    chrome.tabs.sendMessage(tab.id, { msg: 'getFangInfo' });

    alert('获取成功, 打开开发环境同步!');
  }
  async getTabUrl() {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    let url = new URL(tab.url);
    return { tab, url };
  }

  async syncCookies() {
    const { tab, url } = await this.getTabUrl();
    this.currentUrl = url;

    if (
      String(this.originUrl) &&
      this.currentUrl + '' === this.originUrl + ''
    ) {
      alert('还未切换环境，打开本地开发环境!');
      return;
    }

    // 同步 fang-roleInfo
    chrome.tabs.sendMessage(tab.id, { msg: 'setFangInfo' });

    const pending = this.originCookies.map((cookie) => {
      return this.syncCookie(cookie);
    });
    await Promise.all(pending);
    alert('同步成功, 刷新页面!');
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
            path: cookie.path,
            secure: cookie.secure,
            sameSite: cookie.sameSite,
            expirationDate: 24 * 30 * 60 * 60 * 1000 + Date.now()
          });
        }, 0);

        chrome.cookies.set({
          url: this.currentUrl + '',
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          expirationDate: 24 * 30 * 60 * 60 * 1000 + Date.now()
        });
      }
    );
  }

  setCookiesHtml(cookiesArr) {
    cookiesDiv.innerHTML =
      `<thread>
        <tr>
          <th>name</th>
          <th>value</th>
          <th>path</th>
        </tr>
      </thread>
      <tbody>
      ` +
      cookiesArr
        .map(
          (cookie) =>
            `<tr>
            <td>${cookie.name}</td>
            <td>${cookie.value}</td>
            <td>${cookie.path}</td>
            </tr>`
        )
        .join('') +
      `</tbody>`;
  }
}

const c = new Cookie();
c.init();
