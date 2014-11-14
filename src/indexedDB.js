
'use strict';

/**
 * 本地存储，存储器类型为 IndexedDB
 * @type {Storage.IndexedDB}
 */
ModuleMgr.create("Storage.IndexedDB", function(_aoSuper, _aoMgr) {
  var TABLE_NAME = "bigtable";
  var TABLE_VERSION = 1;
  var TABLE_DESC =  'Storage for 9game';
  var STORE_NAME = "items";
  var KEY_NAME = "key";
  var VALUE_NAME = "val";

  var READ_WRITE = 'readwrite';
  var READ_ONLY = 'readonly';

  var TOTAL_SIZE = 5 * 1024 * 1024;
  var EXPAND_SIZE = 5 * 1024 * 1024; // 每次扩容5M
  window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  var isSupported = typeof(window.useIndexDB) != 'undefined' ? window.useIndexDB : !!window.indexedDB;

  // @override
  this.isSupported = function() {
    return isSupported;
  };

  // @override
  this.getType = function() {
    return "indexDB";
  };

  // @override
  this.init_ = function(_aoCfg) {
    _aoSuper.init_.apply(this, arguments);

    var _oSelf = this;
    var request = window.indexedDB.open(TABLE_NAME, TABLE_VERSION);
    request.onerror = function(event) {
      // 解决历史版本 > 最新版本的问题
      if (request.error.name == "VersionError"  && !_oSelf.isRetry) {
        window.indexedDB.deleteDatabase(TABLE_NAME);
        // 重试一次
        _oSelf.init_(_aoCfg);
        _oSelf.isRetry = true;
      }
      else {
        // 不能用indexedDB，也是废了
        isSupported = false;
      }
    };
    request.onsuccess = function(event) {
      _oSelf.db = request.result;

      var transaction = _oSelf.db.transaction(STORE_NAME, READ_WRITE); //.objectStore(STORE_NAME)
      transaction.oncomplete = function(event) {
        console.log("Transaction ok. All done!");
      };
      transaction.onerror = function(event) {
        console.dir(event);
        // 不能用indexedDB，废了废了
        isSupported = false;
      };
    };
    request.onupgradeneeded = function (event) {
      console.info("onupgradeneeded");
      // CREATE OR ALTER
      event.currentTarget.result.createObjectStore(STORE_NAME, {autoIncrement: false });
//      objectStore.createIndex(KEY_NAME, KEY_NAME, { unique: true });
    };
  };

  /**
   * 简化indexedDB的读写过程
   * @param _afCallback
   * @param _asType
   * @private
   */
  this._getObjectStore = function(_afCallback, _asType) {
    var _oSelf = this;
    // TODO use promise
    this.ctrl.waitFor_(function() {
      return !!_oSelf.db;
    }, function(){
      var transaction = _oSelf.db.transaction(STORE_NAME, _asType);
      _afCallback && _afCallback.call(_oSelf, transaction.objectStore(STORE_NAME));
    });
  };

  /**
   * IndexedDB存储不能用了，顺便把数据删掉
   * @param _asKey
   * @private
   */
  this._canNotSave = function(_asKey){
    // 不能用indexedDB，废了废了
    isSupported = false;
    // 删除
    this.onDeleteData(_asKey);
  };

  /**
   * IndexedDB 保存过程的实现
   * @param _asKey
   * @param _asVal
   */
  this.onSaveData = function(_asKey, _asVal) {
    var _oSelf = this;
    // 自动解决容量问题
    this.autoExpand(_asKey, _asVal, {
      onsuccess : function() {
        this._getObjectStore(function(transaction){
          var request = transaction.put({"key" : _asKey, "val": _asVal }, _asKey);
          request.onsuccess  = function() {
            console.info(_oSelf.getType(), "onSaveData -succ" );
            _aoSuper.onSaveData.call(_oSelf, _asKey, _asVal);
          };
          request.onerror = function (e) {
            console.error("onSaveData", e);
            // 不能用了
            _oSelf._canNotSave(_asKey);
          }
        }, READ_WRITE);
      },
      onerror : function() {
        // 不能用了
        _oSelf._canNotSave(_asKey);
      }
    }, EXPAND_SIZE);
  };

  /**
   * IndexedDB 读取过程的实现
   * @param _asKey
   * @param _afCallback
   */
  this.onLoadData = function(_asKey, _afCallback) {
    var _oSelf = this;
    var t = +new Date();
    console.error("indexedDB.onLoadData",_asKey);
    this._getObjectStore(function(transaction){
      console.error("indexedDB.onLoadData.transaction",_asKey,+new Date() - t);
      var request = transaction.get(_asKey);
      request.onsuccess = function(event) {
        console.error("indexedDB.onLoadData.transaction - succ",_asKey,+new Date() - t);
        var _oRecord = event.target.result;
        if (_oRecord) {
          _afCallback && _afCallback(_oRecord[VALUE_NAME]);
          _aoSuper.onLoadData.call(_oSelf, _asKey);
        }
      };
      request.onerror = function (e) {
        console.error("onLoadData", e);
        // 不能用了
        _oSelf._canNotSave(_asKey);
      }
    }, READ_ONLY);
  };

  /**
   * IndexedDB 删除过程的实现
   * @param _asKey
   */
  this.onDeleteData = function(_asKey) {
    _aoSuper.onDeleteData.apply(this, arguments);
    var _oSelf = this;
    this._getObjectStore(function(transaction){
      var request = transaction.delete(_asKey);
      request.onerror = function (e) {
        console.error("onDeleteData", e);
        // 不能用indexedDB，废了废了
        isSupported = false;
      }
    }, READ_WRITE);
  };

  /**
   * IndexedDB 清理过期数据的实现
   * @param _asKey
   */
  this.onDataExpired = function(_asKey) {
    _aoSuper.onDataExpired.apply(this, arguments);
    var _oSelf = this;
    this._getObjectStore(function(transaction){
      var request = transaction.delete(_asKey);
      request.onerror = function (e) {
        console.error("onDataExpired", e);
        // 不能用indexedDB，废了废了
        isSupported = false;
      }
    }, READ_WRITE);
  };

  /**
   * IndexedDB 清空
   */
  this.onClearUp = function() {
    _aoSuper.onClearUp.call(this);
    var _oSelf = this;
    this._getObjectStore(function(transaction){
      var request = transaction.clear();
      request.onerror = function (e) {
        // 不能用indexedDB，废了废了
        isSupported = false;
      }
    }, READ_WRITE);
  }
}, "Storage.Base");