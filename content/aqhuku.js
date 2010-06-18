ah = {
  _prefDialog: null,

  onLoad: function() {
    this.init();
  },

  init: function() {
    let menu = document.getElementById("contentAreaContextMenu");
    if (menu) {
      menu.addEventListener("popupshowing", this.setContextMenu, false);
    }

    let appcontent = document.getElementById("appcontent");
    if (appcontent) {
      appcontent.addEventListener('DOMContentLoaded', this.onDOMContentLoaded, false);
    }

    ahNavi.applyPrefs();
    ahNavi.createLastMenuItems();
    let extension = Application.extensions.get(ahConst.DOMAIN);
    extension.prefs.events.addListener('change', this.onPrefChange);
  },

  setContextMenu: function() {
    let isValidPrefs =
      ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '') &&
      ahUtils.getPrefValue(ahConst.prefs.USER_ID, '');

    let menuItem;
    if ((menuItem = document.getElementById('aqhuku-menuitem-content-separator0'))) {
      menuItem.hidden = !isValidPrefs;
    }
    if ((menuItem = document.getElementById('aqhuku-menuitem-content-add-link'))) {
      menuItem.hidden = !isValidPrefs;
    }
  },

  onDOMContentLoaded: function(event) {
    let serverUrl = ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '');
    let targetDocument = event.target.defaultView.document;

    if (ahUtils.startsWith(targetDocument.location.href, serverUrl)) {
      ahNavi.init(targetDocument);
    }
  },

  showPreferences: function(event) {
    if (('button' in event && event.button != 0)) {
      return;
    }
    if (event.ctrlKye || event.shiftKey ||
        event.sltKey || event.metaKey) {
      return;
    }

    try {
      if (this._prefDialog) {
        if (!this._prefDialog.closed) {
          this._prefDialog.focus();
        }
      }
    } catch(e) {
      this._prefDialog = null;
    }

    const OPTIONS_URL = 'chrome://aqhuku/content/options.xul';
    const FEATURES = 'chrome,titlebar,tolbar,centerscreen,resizable';

    this._prefDialog = openDialog(OPTIONS_URL, FEATURES);
  },

  addLink: function() {
    let serverUrl = ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '');
    let userId = ahUtils.getPrefValue(ahConst.prefs.USER_ID, '');

    if (!ahUtils.endsWith(serverUrl, '/')) {
      serverUrl += '/';
    }
    let xhr = new XMLHttpRequest();
    let uri = Application.activeWindow.activeTab.uri;
    let postData = {
      containerId: userId + '/link',
      type: '/atypes/ariel/link',

      title: Application.activeWindow.activeTab.document.title,
      uri: uri.prePath + uri.path
    };
    xhr.open('POST', serverUrl + ahUtils.makeUUID() + '/edit');
    xhr.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded");
    xhr.send(ahUtils.makePostData(postData));
  },

  onPrefChange: function(event) {
    switch(event.data) {
    case ahConst.prefs.AQUA_NAVI:
      ahNavi.applyPrefs();
      break;
    }
  }
};

window.addEventListener('load', function() {
  ah.onLoad();
}, false);
