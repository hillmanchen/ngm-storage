
'use strict';

/**
 * 本地存储，存储器类型为 WebSQL
 * @type {Storage.WebSQL}
 */
ModuleMgr.create("Storage.WebSQL", function(_aoSuper, _aoMgr) {
  var TABLE_NAME = "bigtable";
  var TABLE_VERSION = "1.0";
  var TABLE_DESC =  'Storage for 9game';
  var KEY_NAME = "key";
  var VALUE_NAME = "val";

  var TOTAL_SIZE = 5 * 1024 * 1024;
  var EXPAND_SIZE = 5 * 1024 * 1024; // 每次扩容5M
  var CREATE_TABLE = 'CREATE TABLE IF NOT EXISTS ' + TABLE_NAME + ' ('+KEY_NAME+' UNIQUE, '+VALUE_NAME+')';// , unique('+KEY_NAME+', ' + VALUE_NAME+ ')
  var INSERT = 'INSERT OR REPLACE INTO ' +TABLE_NAME+ ' ('+KEY_NAME+', '+VALUE_NAME+') VALUES (?, ?)';
  var SELECT = 'SELECT DISTINCT('+VALUE_NAME+') FROM ' + TABLE_NAME + ' WHERE ' + KEY_NAME + "=?";
  var DELETE = 'DELETE FROM ' +TABLE_NAME+ ' WHERE ' +KEY_NAME+ '=?';
  var CLEAR = 'DELETE FROM ' + TABLE_NAME;

  var isSupported = typeof(window.useWebSQL) != 'undefined' ? window.useWebSQL : !!window.openDatabase;

  // @override
  this.isSupported = function() {
    return isSupported;
  };

  // @override
  this.getType = function() {
    return "webSQL";
  };

  // @override
  this.init_ = function(_aoCfg) {
    _aoSuper.init_.apply(this, arguments);

    this.db = window.openDatabase('Storage.WebSQL', TABLE_VERSION, TABLE_DESC, TOTAL_SIZE);
    this.db.transaction(function (trans) {
      trans.executeSql(CREATE_TABLE);
    });
  };

  /**
   * WebSQL 保存过程的实现
   * @param _asKey
   * @param _asVal
   */
  this.onSaveData = function(_asKey, _asVal) {
    var _oSelf = this;
//    console.info("WebSQL:onSaveData", _asKey, "before expand");
    // 自动解决容量问题
    this.autoExpand(_asKey, _asVal, {
      onsuccess : function() {
        this.db.transaction(function(trans) {
          console.info("WebSQL:onSaveData", _asKey);
          trans.executeSql(INSERT, [_asKey, _asVal]);

          _aoSuper.onSaveData.call(_oSelf, _asKey, _asVal);
        });
      },
      onerror : function() {
        // WebSQL废了.. 之后的存储会丢给localStorage
        isSupported = false;

        // 删除掉
        this.onDeleteData(_asKey);
      }
    }, EXPAND_SIZE);
  };

  /**
   * WebSQL 读取过程的实现
   * @param _asKey
   * @param _afCallback
   */
  this.onLoadData = function(_asKey, _afCallback) {
    var _oSelf = this;
    var t = +new Date();
    console.error("webSQL.onLoadData",_asKey);
    this.db.readTransaction(function(trans) {
      console.error("webSQL.readTransaction",_asKey, +new Date() -  t);
      trans.executeSql(SELECT, [_asKey], function (transInner, results) {
        console.error("webSQL.executeSql",_asKey, +new Date() -  t);
        var len = results.rows.length;
        if (len) {
          var val = results.rows.item(0)[VALUE_NAME];
          val && _afCallback && _afCallback(val);
          _aoSuper.onLoadData.call(_oSelf, _asKey);
        }
      });
    });
  };

  /**
   * WebSQL 删除过程的实现
   * @param _asKey
   */
  this.onDeleteData = function(_asKey) {
    _aoSuper.onDeleteData.apply(this, arguments);
    this.db.transaction(function(trans) {
      trans.executeSql(DELETE, [_asKey]);
    });
  };

  /**
   * WebSQL 清理过期数据的实现
   * @param _asKey
   */
  this.onDataExpired = function(_asKey) {
    _aoSuper.onDataExpired.apply(this, arguments);
    this.db.transaction(function(trans) {
      trans.executeSql(DELETE, [_asKey]);
    });
  };

  /**
   * WebSQL 清空
   */
  this.onClearUp = function() {
    _aoSuper.onClearUp.call(this);
    this.db.transaction(function(trans) {
      trans.executeSql(CLEAR, []);
    });
  };
}, "Storage.Base");