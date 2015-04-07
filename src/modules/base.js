
'use strict';

/**
 * 本地存储，存储器基类
 * @type {Storage.Base}
 */
ModuleMgr.create("Storage.Base", function(_aoSuper, _aoMgr) {
  var DEFAULT_EXPAND_SIZE = 5 * 1024 * 1024; // 每次扩容5M

//  var mRemaining = 0; // 记录剩余容量
//  var mUsed = 0; // 记录已用容量
//  var mCnt = 0; // 记录查询容量接口的调用次数,

  /**
   * 存储类型（方式）
   * @returns {string}
   */
  this.getType = function() {
    return "base";
  };

  /**
   * 是否支持本存储方式
   * @returns {boolean}
   */
  this.isSupported = function() {
    return false;
  };

  /**
   * 如果需要扩展，自动申请容量
   * @param _asKey
   * @param _asVal
   * @param _aoCallbacks
   */
  this.autoExpand = function(_asKey, _asVal, _aoCallbacks, _anSize) {
    var _nSize = _anSize || DEFAULT_EXPAND_SIZE;
    var _nTotalSize = (_asKey + "").length + (_asVal + "").length;
    var _oCallbacks = _aoCallbacks || {};
    this.queryQuota(function(_anRemaining, _anUsed) {
//      console.info("Base", "queryQuota", _anRemaining, _anUsed);
//      _anRemaining = 1;// 测试满了的状况
      // 正常写
      if (_nTotalSize <= _anRemaining) {
//        console.info("Base", _nTotalSize, _anRemaining);
        _oCallbacks.onsuccess && _oCallbacks.onsuccess.call(this);
      }
      else {
        // 容量满了，扩容
        this.requestQuota(function(_anGrantedBytes){
//          console.info("Base", "requestQuota", _anGrantedBytes, _anUsed);
//          _anGrantedBytes = 1;// 测试扩容失败后的状况
          // 扩容成功
          if (_nTotalSize < _anGrantedBytes) {
            console.info("Base", "扩容成功", _nTotalSize, _anGrantedBytes);
            _oCallbacks.onsuccess && _oCallbacks.onsuccess.call(this);
          }
          else {
            _oCallbacks.onerror && _oCallbacks.onerror.call(this);
          }
        }, _nSize)
      }
    });
  };

  /**
   * 向存储器申请更多的容量
   * @param _afCallback
   * @param _anSize
   */
  this.requestQuota = function(_afCallback, _anSize) {
    var _nSize = _anSize || DEFAULT_EXPAND_SIZE;
    var _oSelf = this;
    if (navigator.webkitTemporaryStorage) {
      navigator.webkitTemporaryStorage.requestQuota(_nSize, function(_anGrantedBytes){
        _afCallback.call(_oSelf, _anGrantedBytes);
      }, function(e) {
        _afCallback.call(_oSelf, 0);
      });
    }
    else if (window.webkitStorageInfo){
      window.webkitStorageInfo.requestQuota(webkitStorageInfo.TEMPORARY, _nSize, function(_anGrantedBytes) {
        _afCallback.call(_oSelf, _anGrantedBytes);
      }, function(e) {
        _afCallback.call(_oSelf, 0);
      });
    }
    // 不支持扩容
    else {
      _afCallback.call(_oSelf, 0);
    }
  };

  /**
   * 查询当前可用的容量
   * @param _afCallback
   */
  this.queryQuota = function(_afCallback) {
    var _oSelf = this;
    clearTimeout(_oSelf._mnTimerId);
    _oSelf._mnTimerId = setTimeout(function(){
      console.info("queryQuota timeout ");
      // 查询超时，当做无限使用
      _afCallback.call(_oSelf, Infinity, 0);
      _oSelf._mnTimerId = -1;
    }, 500);// web 200-300ms，mobile less than 10ms

    var t = +new Date();
    if (!!navigator.webkitTemporaryStorage) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota(function(used, remaining){
        clearTimeout(_oSelf._mnTimerId);
        if (_oSelf._mnTimerId != -1) {
          _afCallback.call(_oSelf, remaining, used);
        }
      }, function(e) {
        if (_oSelf._mnTimerId != -1) {
          _afCallback.call(_oSelf, Infinity, 0);
        }
      });
    }
    else if (!!window.webkitStorageInfo){
      window.webkitStorageInfo.queryUsageAndQuota(webkitStorageInfo.TEMPORARY, function(used, remaining) {
        clearTimeout(_oSelf._mnTimerId);
        if (_oSelf._mnTimerId != -1) {
          _afCallback.call(_oSelf, remaining, used);
        }
      }, function(e) {
        if (_oSelf._mnTimerId != -1) {
          _afCallback.call(_oSelf, Infinity, 0);
        }
      });
    }
    // 不支持扩容
    else {
      _afCallback.call(_oSelf, -1, 0);
    }
  };

  /**
   * 由管理器调用保存过程的代理方法，存基本的index及info，实体数据由子类实现存储
   * @param _asKey
   * @param _asVal
   */
  this.onSaveData = function(_asKey, _asVal) {
    console.info(this.getType(), "onSaveData", _asKey);
    // 为保证准确性要存完才更新
    this.ctrl.updateInfo(_asKey, this.getType(), 4);//saved
  };

  /**
   * 由管理器调用读取过程的代理方法，更新index及info，由子类实现读存储的过程
   * @param _asKey
   * @param _afCallback
   */
  this.onLoadData = function(_asKey, _afCallback) {
    console.info(this.getType(), "onLoadData", _asKey);
    // 写index info，更新热度
    this.ctrl.updateInfo(_asKey, this.getType(), 4);
  };

  /**
   * 由管理器调用删除过程的代理方法，由子类实现删除过程
   * @param _asKey
   */
  this.onDeleteData = function(_asKey) {
    console.warn(this.getType(), "onDeleteData", _asKey);
    // 删除index、info
    this.ctrl.deleteInfo(_asKey);
  };

  /**
   * 由管理器调用清理过期数据的代理方法，由子类实现清理过程
   * @param _asKey
   */
  this.onDataExpired = function(_asKey) {
    console.warn(this.getType(), "onDataExpired", _asKey);
    // 删除过期的index、info
    this.ctrl.deleteInfo(_asKey);
  };

  /**
   * 由管理器调用清空数据的代理方法，由子类实现清空过程
   */
  this.onClearUp = function() {
    console.warn(this.getType(), "clearUp");
  }

  /**
   * 初始化，同时绑定管理器ctrl作为成员变量
   * @param _aoCfg
   * @private
   */
  this.init_ = function(_aoCfg) {
    _aoSuper.init_ && _aoSuper.init_.call(this, _aoCfg);

    this.ctrl = _aoCfg.ctrl;
  }
});