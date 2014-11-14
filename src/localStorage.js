
'use strict';

/**
 * 本地存储，存储器类型为 LocalStorage
 * @type {Storage.LocalStorage}
 */
ModuleMgr.create("Storage.LocalStorage", function(_aoSuper, _aoMgr) {
  var TOTAL_SIZE = 5 * 1024 * 1024;
  var isSupported = typeof(window.useLocalStorage) != 'undefined' ? window.useLocalStorage : !!window.localStorage;

  // @override
  this.isSupported = function() {
    return isSupported;
  };

  // @override
  this.getType = function() {
    return "localStorage";
  };

  /**
   * 带保护机制的存储，如果爆容量，就自动清理最旧的
   * @param _asKey
   * @param _asVal
   * @param _anRetry
   * @private
   */
  this._save = function(_asKey, _asVal, _anRetry) {
    if (typeof(_anRetry)=="number") {
      this._save.retry = _anRetry;
    }

    if(this._save.retry >= 0) {
      this._save.retry--;
      try {
        localStorage.setItem(_asKey, _asVal);
      }
      catch(e) {
        console.error(e);
      }
      finally {
        console.info("save:" + _asKey, !!localStorage.getItem(_asKey), "left retry:" + this._save.retry);
        var isSucc = !!localStorage.getItem(_asKey);
        if (!isSucc) {
          var keys = this.ctrl.getLastIndex(1);
          this.onDeleteData(keys[0]);
          this._save(_asKey, _asVal);
        }
      }
    }
    else {
      var isSucc = !!localStorage.getItem(_asKey);
      // 最终没存成功，删除掉
      !isSucc && this.onDeleteData(_asKey);
    }
  };

  /**
   * LocalStorage 保存过程的实现
   * @param _asKey
   * @param _asVal
   */
  this.onSaveData = function(_asKey, _asVal) {
    // 一条已经超过上限的，不予存放
    if (_asKey.length + _asVal.length > TOTAL_SIZE) {
      this.onDeleteData(_asKey);
      return;
    }

    // 存储。最多可重试10次，重试一次，删一条最旧的
    this._save(_asKey, _asVal, 10);
    _aoSuper.onSaveData.apply(this, arguments);
  };

  /**
   * LocalStorage 读取过程的实现
   * @param _asKey
   * @param _afCallback
   */
  this.onLoadData = function(_asKey, _afCallback) {
    _aoSuper.onLoadData.apply(this, arguments);
    var _sVal = localStorage.getItem(_asKey);
    _afCallback && _afCallback(_sVal);
  };

  /**
   * LocalStorage 删除过程的实现
   * @param _asKey
   */
  this.onDeleteData = function(_asKey) {
    _aoSuper.onDeleteData.apply(this, arguments);
    localStorage.removeItem(_asKey);
  };

  /**
   * LocalStorage 清理过期数据的实现
   * @param _asKey
   */
  this.onDataExpired = function(_asKey) {
    _aoSuper.onDataExpired.apply(this, arguments);
    localStorage.removeItem(_asKey);
  };

  /**
   * LocalStorage 清空
   */
  this.onClearUp = function() {
    _aoSuper.onClearUp.call(this);
    localStorage.clear();
  };
}, "Storage.Base");