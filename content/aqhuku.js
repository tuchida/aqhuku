ah = {
  _prefDialog: null,
  _shortcutDialog: null,
  _aquaDoc: null,

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
      appcontent.addEventListener('DOMContentLoaded', ahUtils.bind(this.onDOMContentLoaded, this), false);
    }
    ahNavi.applyPrefs();
    ahNavi.createLastMenuItems();
    let extension = Application.extensions.get(ahConst.DOMAIN);
    extension.prefs.events.addListener('change', this.onPrefChange);

    this.applyShortcuts();
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
      this._aquaDoc = targetDocument;
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
    if (!this._aquaDoc) {
      return;
    }

    let serverUrl = ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '');
    let userId = ahUtils.getPrefValue(ahConst.prefs.USER_ID, '');

    if (!ahUtils.endsWith(serverUrl, '/')) {
      serverUrl += '/';
    }
    let uri = Application.activeWindow.activeTab.uri;
    let postData = {
      containerId: userId + '/link',
      type: '/atypes/ariel/link',

      title: Application.activeWindow.activeTab.document.title,
      uri: uri.prePath + uri.path
    };

    ahUtils.documentEval(this._aquaDoc, [
      'var xhr = new XMLHttpRequest();',
      'xhr.open("POST", "' + serverUrl + ahUtils.makeUUID() + '/edit");',
      'xhr.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded");',
      'xhr.send("' + ahUtils.makePostData(postData) + '");'
    ].join('\n'));
  },

  onPrefChange: function(event) {
    switch(event.data) {
    case ahConst.prefs.AQUA_NAVI:
      ahNavi.applyPrefs();
      break;
    case ahConst.prefs.SHORTCUTS:
      ah.applyShortcuts();
      break;
    }
  },

  applyShortcuts: function() {
    const KEYSET_ID = 'aqhuku-custom-keyset';

    let keyset = document.getElementById(KEYSET_ID);
    if (keyset) {
      keyset.parentNode.removeChild(keyset);
    }

    let shortcuts = ahUtils.parseJSON(ahUtils.getPrefValue(ahConst.prefs.SHORTCUTS, ''));
    if (shortcuts) {
      keyset = document.createElementNS(ahConst.XULNS, 'keyset');
      keyset.setAttribute('id', KEYSET_ID);
      document.documentElement.appendChild(keyset);

      shortcuts.forEach(function(scItem) {
        let key = document.createElementNS(ahConst.XULNS, 'key');
        key.setAttribute('modifiers', scItem.shortcut.modifiers);
        key.setAttribute('key', scItem.shortcut.key.replace(/^VK_/, ''));
        key.setAttribute('oncommand', 'void(0)');
        key.addEventListener('command', function(event) {
          ahNavi.openUri(scItem.href, scItem.openType == 'replace');
        }, false);
        keyset.appendChild(key);
      });
    }
  },

  showCustomizeShortcuts: function(event) {
    if (('button' in event && event.button != 0)) {
      return;
    }

    try {
      if (this._shortcutDialog) {
        if (!this._shortcutDialog.closed) {
          this._shortcutDialog.focus();
        }
      }
    } catch(e) {
      this._shortcutDialog = null;
    }

    const OPTIONS_URL = 'chrome://aqhuku/content/customizeShortcuts.xul';
    const FEATURES = 'chrome,titlebar,tolbar,centerscreen,resizable';

    this._prefDialog = openDialog(OPTIONS_URL, FEATURES);
  }
};

window.addEventListener('load', function() {
  ah.onLoad();
}, false);
