ahCustomizeShortcuts = {
  _treeItems: null,

  init: function() {
    let items = ahUtils.parseJSON(ahUtils.getPrefValue(ahConst.prefs.LAST_AQUA_NAVI_JSON, ''));
    if (items) {
      this.createNaviTree(items);
    }

    let shortcuts = ahUtils.parseJSON(ahUtils.getPrefValue(ahConst.prefs.SHORTCUTS, ''));
    if (shortcuts) {
      shortcuts.forEach(this.addShortcut, this);
    }

    this.initKeyMenu();
  },

  term: function() {
    let list = document.getElementById('shortcuts');
    let listItems = list.getElementsByTagName('listitem');
    let shortcuts = [];
    for (let i = 0, listItem; listItem = listItems[i]; i++) {
      shortcuts.push(listItem.value);
    }
    ahUtils.setPrefValue(ahConst.prefs.SHORTCUTS, '[' + shortcuts.join(',') + ']');
  },

  createNaviTree: function(items) {
    let naviTree = document.getElementById('aquanavi_tree');
    this._treeItems = [];
    this._expandItems(items, 0, -1);
    naviTree.view = new ahCustomizeShortcuts.AquaNaviTreeView(this._treeItems);
  },

  _expandItems: function(items, level, parentIndex) {
    for (let i = 0; i < items.length; i++) {
      this._expandItem(items[i], level, parentIndex, i < items.length - 1, i);
    }
  },

  _expandItem: function(item, level, parentIndex, hasNext, index) {
    this._treeItems.push({
      title: item.title,
      href: item.href,
      level: level,
      parentIndex: parentIndex,
      hasNext: hasNext
    });
    if (item.cascade) {
      this._expandItems(item.cascade, level + 1, index);
    }
  },

  getSelectedItem: function() {
    let naviTree = document.getElementById('aquanavi_tree');
    return this._treeItems[naviTree.currentIndex];
  },

  initKeyMenu: function() {
    let menu = document.getElementById('shortcut_keycode');
    for (let attribute in Components.interfaces.nsIDOMKeyEvent) {
      let m;
      if ((m = attribute.match (/^DOM_(VK_(.+))$/))) {
        var code = m[1];
        var name = m[2];
        if (code in ahConst.keyNames) {
          name = ahConst.keyNames[code];
        }
        menu.appendItem(name, code);
      }
    }
    this.clearKey();
  },

  clearKey: function() {
    document.getElementById('shortcut_keycode').value = 'VK_A';
    document.getElementById('shortcut_modifiers_alt').checked = false;
    document.getElementById('shortcut_modifiers_ctrl').checked = false;
    document.getElementById('shortcut_modifiers_meta').checked = false;
    document.getElementById('shortcut_modifiers_shift').checked = false;
    document.getElementById('shortcut_open_type').value = 'replace';
  },

  addShortcut: function(scItem) {
    let list = document.getElementById('shortcuts');
    let listitem = list.appendItem(scItem.title, JSON.stringify(scItem));
    let cell = document.createElementNS(ahConst.XULNS, 'listcell');
    let s = '';
    if (scItem.shortcut.modifiers.indexOf('alt') >= 0) {
      s += 'Alt + ';
    }
    if (scItem.shortcut.modifiers.indexOf('control') >= 0) {
      s += 'Ctrl + ';
    }
    if (scItem.shortcut.modifiers.indexOf('meta') >= 0) {
      s += 'Meta + ';
    }
    if (scItem.shortcut.modifiers.indexOf('shift') >= 0) {
      s += 'Shift + ';
    }
    s += scItem.shortcut.key.replace(/^VK_/, '');
    cell.setAttribute('label', s);
    listitem.appendChild(cell);
  },

  onSaveShortcutKeyDown: function(event) {
    let keycode = '';
    for (let attribute in Components.interfaces.nsIDOMKeyEvent) {
      let m;
      if ((m = attribute.match (/^DOM_(VK_.+)$/))) {
        if (event.keyCode == Components.interfaces.nsIDOMKeyEvent[attribute]) {
          keycode = m[1];
        }
      }
    }

    if (keycode != '') {
      document.getElementById('shortcut_keycode').value = keycode;
      document.getElementById('shortcut_modifiers_alt').checked = event.altKey;
      document.getElementById('shortcut_modifiers_ctrl').checked = event.ctrlKey;
      document.getElementById('shortcut_modifiers_meta').checked = event.metaKey;
      document.getElementById('shortcut_modifiers_shift').checked = event.shiftKey;
    }

    event.preventDefault ();
    event.stopPropagation ();
  },

  onAddShortcut: function(event) {
    let item = this.getSelectedItem();
    if (item) {
      let modifiers = [];
      if (document.getElementById('shortcut_modifiers_alt').checked) {
        modifiers.push('alt');
      }
      if (document.getElementById('shortcut_modifiers_ctrl').checked) {
        modifiers.push('control');
      }
      if (document.getElementById('shortcut_modifiers_meta').checked) {
        modifiers.push('meta');
      }
      if (document.getElementById('shortcut_modifiers_shift').checked) {
        modifiers.push('shift');
      }
      let scItem = {
        title: item.title,
        href: item.href,
        shortcut: {
          modifiers: modifiers.join(' '),
          key: document.getElementById('shortcut_keycode').value
        },
        openType: document.getElementById('shortcut_open_type').value
      };

      this.addShortcut(scItem);
      this.clearKey();
    }
  },

  onRemoveShortcut: function(event) {
    let list = document.getElementById('shortcuts');
    if (list.selectedIndex >= 0) {
      list.removeItemAt(list.selectedIndex);
    }
  }
};


ahCustomizeShortcuts.AquaNaviTreeView = function(treeItems) {
  this._treeItems = treeItems;
};

ahCustomizeShortcuts.AquaNaviTreeView.prototype = {

  /**
   * nsITreeBoxObject
   */
  _treeBoxObject: null,

  ////////////////////////////////////////////////////////////////
  // implements nsITreeView

  get rowCount() {
    return this._treeItems.length;
  },

  selection: null,
  getRowProperties: function(index, properties) {},
  getCellProperties: function(row, col, properties) {},
  getColumnProperties: function(col, properties) {},
  isContainer: function(index) { return false; },
  isContainerOpen: function(index) { return false; },
  isContainerEmpty: function(index) { return false; },
  isSeparator: function(index) {
    return this._treeItems[index] == null;
  },
  isSorted: function() { return false; },
  canDrop: function(targetIndex, orientation) { return false; },
  drop: function(targetIndex, orientation) {},
  getParentIndex: function(row) {
    return this._treeItems[row].parentIndex;
  },
  hasNextSibling: function(row, afterIndex) {
    return this._treeItems[row].hasNext;
  },
  getLevel: function(row) {
    return this._treeItems[row].level;
  },
  getImageSrc: function(row, col) {},
  getProgressMode: function(row, col) {},
  getCellValue: function(row, col) {},
  getCellText: function(row, col) {
    switch (col.index) {
    case 0:
      return this._treeItems[row].title;
    case 1:
      return this._treeItems[row].href;
    }
    return '';
  },
  setTree: function(tree) {
    this._treeBoxObject = tree;
  },
  toggleOpenState: function(index) {},
  cycleHeader: function(col) {},
  selectionChanged: function() {},
  cycleCell: function(row, col) {},
  isEditable: function(row, col) { return false; },
  isSelectable: function(row, col) {},
  setCellValue: function(row, col, value) {},
  setCellText: function(row, col, value) {},
  performAction: function(action) {},
  performActionOnRow: function(action, row) {},
  performActionOnCell: function(action, row, col) {}
};
