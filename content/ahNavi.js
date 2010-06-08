ahNavi = {
  init: function(targetDocument) {
    let items = this.findMenuItems(targetDocument);
    if (items.length == 0) {
      return;
    }
    let naviMenu = document.getElementById('aqhuku-menu-aquanavi');

    naviMenu.disabled = false;
    while (naviMenu.itemCount > 0) {
      naviMenu.removeItemAt(0);
    }
    items.forEach(ahUtils.bind(this.createMenuItem, this, naviMenu.menupopup));
  },

  onMenuItemClick: function(uri, event) {
    Application.activeWindow.open(ahUtils.asUri(uri)).focus();
    event.stopPropagation();
    return false;
  },

  findMenuItems: function(targetDocument) {
    let result = [];
    let gadgets = {};
    let sidebarEl = targetDocument.getElementById('sidebar');
    if (sidebarEl) {
      let links = sidebarEl.getElementsByTagName('a');
      for (let i = 0, link; link = links[i]; i++) {
        if (this.validUrl(link.href)) {
          let title = ahUtils.concatTextNode(link);
          let [gadgetId, gadgetTitle] = this._getGadget(link, gadgets);

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
            cascade: cascade
          });
        }
      }
    }
    return result;
  },

  createMenuItem: function(parentMenu, item) {
    const COLLECTABLE = ['bookmark', 'documentbookmark', 'link'];

    if (COLLECTABLE.indexOf(item.gadgetId) >= 0) {
      let collectMenu = document.getElementById('aqhuku-menuitem-aquanavi-' + item.gadgetId);
      if (!collectMenu) {
        let menu = document.createElementNS(ahConst.XULNS, 'menu');
        menu.setAttribute('label', item.gadgetTitle);
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
      let menupopup = document.createElementNS(ahConst.XULNS, 'menupopup');
      menu.appendChild(menupopup);
      parentMenu.appendChild(menu);
      parentMenu = menupopup;
    }

    let menuItem = document.createElementNS(ahConst.XULNS, 'menuitem');
    menuItem.setAttribute('label', item.title);
    menuItem.addEventListener("command", ahUtils.bind(this.onMenuItemClick, this, item.href), false);
    parentMenu.appendChild(menuItem);

    if (item.cascade && item.cascade.length > 0) {
      item.cascade.forEach(ahUtils.bind(this.createMenuItem, this, parentMenu));
    }
  },

  applyPrefs: function() {
    let naviMenu = document.getElementById('menu_AquaNavi');
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
  }
};
