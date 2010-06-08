ahOptions = {

  init: function() {
    this.loadPrefs();
  },

  term: function() {
    return this.savePrefs();
  },

  loadPrefs: function() {
    document.getElementById('server_url').value = ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, '');
    document.getElementById('user_id').value = ahUtils.getPrefValue(ahConst.prefs.USER_ID, '');
    document.getElementById('aqua_navi').checked = ahUtils.getPrefValue(ahConst.prefs.AQUA_NAVI, true);
  },

  savePrefs: function() {
    ahUtils.setPrefValue(ahConst.prefs.SERVER_URL, document.getElementById('server_url').value);
    ahUtils.setPrefValue(ahConst.prefs.USER_ID, document.getElementById('user_id').value);
    ahUtils.setPrefValue(ahConst.prefs.AQUA_NAVI, document.getElementById('aqua_navi').checked);
    return true;
  }
};