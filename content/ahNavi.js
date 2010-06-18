ahNavi = {
  init: function(targetDocument) {
    let items = this.findMenuItems(targetDocument);
    if (items.length == 0) {
      return;
    }

    ahUtils.setPrefValue(ahConst.prefs.LAST_AQUA_NAVI_JSON, JSON.stringify(items));
    this.createMenuItems(items);
  },

  openUri: function(uri, replace) {
    if (replace) {
      Application.activeWindow.activeTab.load(ahUtils.asUri(uri));
    } else {
      Application.activeWindow.open(ahUtils.asUri(uri)).focus();
    }
  },

  findMenuItems: function(targetDocument) {
    let result = [];
    let gadgets = {};
    let sidebarEl = targetDocument.getElementById('sidebar');
    if (sidebarEl) {
      let links = sidebarEl.getElementsByTagName('a');
      for (let i = 0, link; link = links[i]; i++) {
        if (this.validUrl(link.href)) {
          let title = ahUtils.firstTextNode(link);
          let [gadgetId, gadgetTitle] = this._getGadget(link, gadgets);
          let icon = this._getIconClassName(link);

          let cascadeText = link.getAttribute('onmouseover');
          let cascade;
          if (cascadeText) {
            let dummy = {
              eval: function() {
                eval(cascadeText);
              }
            };
            dummy.eval();
            cascade = dummy.cascade;
          }

          result.push({
            title: title,
            href: link.href,
            gadgetId: gadgetId,
            gadgetTitle: gadgetTitle,
            icon: icon,
            cascade: cascade
          });
        }
      }
    }
    return result;
  },

  createMenuItems: function(items) {
    let naviMenu = document.getElementById('aqhuku-menu-aquanavi');

    naviMenu.disabled = false;
    while (naviMenu.itemCount > 0) {
      naviMenu.removeItemAt(0);
    }
    items.forEach(ahUtils.bind(this._createMenuItem, this, naviMenu.menupopup));
  },

  _createMenuItem: function(parentMenu, item) {
    const COLLECTABLE = ['bookmark', 'documentbookmark', 'link'];
    const COLLECTABLE_ICON = ['ico-bookmark-app', 'ico-bookmark-doc', 'ico-link'];
    let n;

    if ((n = COLLECTABLE.indexOf(item.gadgetId)) >= 0) {
      let collectMenu = document.getElementById('aqhuku-menuitem-aquanavi-' + item.gadgetId);
      if (!collectMenu) {
        let menu = document.createElementNS(ahConst.XULNS, 'menu');
        menu.setAttribute('label', item.gadgetTitle);
        menu.className = COLLECTABLE_ICON[n];
        collectMenu = document.createElementNS(ahConst.XULNS, 'menupopup');
        collectMenu.setAttribute('id', 'aqhuku-menuitem-aquanavi-' + item.gadgetId);
        menu.appendChild(collectMenu);
        parentMenu.appendChild(menu);
      }
      parentMenu = collectMenu;
    }

    if (item.cascade && item.cascade.length > 0) {
      let menu = document.createElementNS(ahConst.XULNS, 'menu');
      menu.setAttribute('label', item.title);
      menu.className = item.icon;
      menu.addEventListener('click', ahUtils.bind(this.onMenuClick, this, item), false);

      let menupopup = document.createElementNS(ahConst.XULNS, 'menupopup');
      menu.appendChild(menupopup);
      parentMenu.appendChild(menu);

      item.cascade.forEach(ahUtils.bind(this._createMenuItem, this, menupopup));
    } else {
      let menuItem = document.createElementNS(ahConst.XULNS, 'menuitem');
      menuItem.setAttribute('label', item.title);
      menuItem.className = item.icon;
      menuItem.addEventListener('command', ahUtils.bind(function(event) {
        this.openUri(item.href, !event.ctrlKey);
        event.stopPropagation();
        return false;
      }, this), false);
      menuItem.addEventListener('click', ahUtils.bind(this.onMenuItemClick, this, item), false);
      parentMenu.appendChild(menuItem);
    }
  },

  onMenuClick: function(item, event) {
    if (event.button == 1 || (event.button == 0 && event.ctrlKey)) {
      this.openUri(item.href, false);
    } else if (event.button == 0) {
      this.openUri(item.href, true);
    } else {
      return true;
    }
    event.stopPropagation();
    let naviMenu = document.getElementById('aqhuku-menu-aquanavi');
    naviMenu.menupopup.hidePopup();
    return false;
  },

  onMenuItemClick: function(item, event) {
    if (event.button == 1) {
      this.openUri(item.href, false);
    } else {
      return true;
    }
    event.stopPropagation();
    let naviMenu = document.getElementById('aqhuku-menu-aquanavi');
    naviMenu.menupopup.hidePopup();
    return false;
  },

  applyPrefs: function() {
    let naviMenu = document.getElementById('aqhuku-menu-aquanavi');
    let isValidPrefs =
      ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '') &&
      ahUtils.getPrefValue(ahConst.prefs.AQUA_NAVI, true);
    naviMenu.hidden = !isValidPrefs;
  },

  validUrl: function(url) {
    if (!url) {
      return false;
    }
    if (/^\s*javascript\s*:/i.test(url)) {
      return false;
    }
    return true;
  },

  _getGadget: function(linkEl, gadgets) {
    let naviBodyEl = null;
    let el = linkEl;
    while ((el = el.parentNode)) {
      if (ahUtils.hasClassName(el, 'navibody')) {
        naviBodyEl = el;
      }
    }
    if (!naviBodyEl) {
      return [null, ''];
    }

    let toolId = naviBodyEl.getAttribute('toolid');
    if (toolId in gadgets) {
      return [toolId, gadgets[toolId]];
    }

    for (let i = 0, el1; el1 = naviBodyEl.childNodes[i]; i++) {
      if (ahUtils.hasClassName(el1, 'gadget-header')) {
        for (let j = 0, el2; el2 = el1.childNodes[j]; j++) {
          if (ahUtils.hasClassName(el2, 'gadget-header-title')) {
            let gadgetTitle = ahUtils.concatTextNode(el2);
            gadgets[toolId] = gadgetTitle;
            return [toolId, gadgetTitle];
          }
        }
        break;
      }
    }
    return [toolId, ''];
  },

  _getIconClassName: function(linkEl) {
    let iconEl = ahUtils.findNode(linkEl, function(el) {
      return ahUtils.hasClassName(el, 'icon');
    });
    return iconEl ? iconEl.className : '';
  },

  createLastMenuItems: function() {
    let jsonStr = ahUtils.getPrefValue(ahConst.prefs.LAST_AQUA_NAVI_JSON, '');
    if (jsonStr) {
      let items = null;
      try {
        items = JSON.parse(jsonStr);
      } catch(e) {
      }
      if (items) {
        this.createMenuItems(items);
      }
    }
  }
};
