
'use strict';

/**
 * 本地存储
 * @type {Storage.Mgr}
 */
ModuleMgr.create("Storage.API", function(_aoSuper, _aoMgr) {

  // CONST
  var CFG_KEY = "stOraGE-_-CFG";
  var NOT_EXIST = 0;
  var VALID = 1;
  var EXPIRED = 2;
  var SAVING = 3;
  var SAVED = 4;

  // member var
  var _oCfg = {};

  // 存储工具，优先队列
  this.storage = [
    _aoMgr.use("Storage.WebSQL", {ctrl:this}),
    _aoMgr.use("Storage.IndexedDB", {ctrl:this}),
    _aoMgr.use("Storage.LocalStorage", {ctrl:this})
  ];

  /**
   * 基础信息读取（为了减少复杂度，基础信息始终写到localStorage中）
   * @param _aoCfg
   * @private
   */
  this.init_ = function(_aoCfg) {
    var _sCfgTxt = localStorage.getItem(CFG_KEY);
    if (!_sCfgTxt) {
      /*
        {
          expires : 10*60*1000,
          index : [1212,2121,2222],
          info : {
            1212 : {
              time : // 写入时间
              type : //写入存储类型
              st : // 状态
            }
          }
        }
       */
      _oCfg = {
        expires : 10*60*1000,
        index : [],
        info : {}
      }
    }
    else {
      _oCfg = JSON.parse(_sCfgTxt);
    }
  };

  /**
   * 取代理存储器
   * @private
   */
  this.getHandler_ = function(_asType) {
    for (var i = 0 ; i < this.storage.length; i++) {
      if (this.storage[i].getType() == _asType) {
        return this.storage[i];
      }
    }
  };

  /**
   * 检查item状态
   * @param _asKey
   * @param _afCallback
   * @private
   */
  this.check_ = function(_asKey, _afCallback) {
//    debugger;
    var _oSelf = this;
    // 1.不存在
    if (!_oCfg.info[_asKey]) {
      _afCallback && _afCallback.call(_oSelf, {flag : NOT_EXIST, key : _asKey, val : null});
    }
    // 2.存在但过期
    else if (+new Date() - _oCfg.info[_asKey].time > _oCfg.expires) {
      _afCallback && _afCallback.call(_oSelf, {
        flag: EXPIRED,
        key : _asKey,
        val : null,
        handler : this.getHandler_(_oCfg.info[_asKey].type)
      });
    }
    // 3.存在但未写完成
    else if(_oCfg.info[_asKey].st == SAVING) {
      _afCallback && _afCallback.call(_oSelf, {
        flag: SAVING,
        key : _asKey,
        val : null,
        handler : this.getHandler_(_oCfg.info[_asKey].type)
      });
    }
    // 4.存在且在有效内
    else {
      _afCallback && _afCallback.call(_oSelf, {
        flag: VALID,
        key : _asKey,
        val : JSON.stringify(localStorage.getItem(_asKey)),
        handler : this.getHandler_(_oCfg.info[_asKey].type)
      });
    }
  };

  /**
   * 没有promise的替代
   * @param _afWaiting
   * @param _afCall
   */
  this.waitFor_ = function(_afWaiting, _afCall) {
    var _oSelf = this;
    if (_afWaiting()) {
      _afCall();
    }
    else {
      setTimeout(function(){
        if(_afWaiting()) {
          _afCall();
        }
        else {
          _oSelf.waitFor_.apply(_oSelf, [_afWaiting,_afCall]);
        }
      });
    }
  };

  /**
   * 取key所在的索引
   * @param _asKey
   * @returns {number}
   * @private
   */
  this.findIdx_ = function (_asKey) {
    for (var i = 0 ; i < _oCfg.index.length; i++) {
      if (_oCfg.index[i] == _asKey) {
        return i;
      }
    }
    return -1;
  };

  /**
   * 删除idx
   * @param _asKey
   * @private
   */
  this.deleteIdx_ = function(_asKey) {
    if (_oCfg.info[_asKey]) {
      _oCfg.index.splice(this.findIdx_(_asKey), 1);
    }
  };

  /**
   * 检查是否存在，且有效。因为存储可以被用户清理，所以不建议使用
   * @param _asKey
   * @returns {boolean}
   */
  this.valid = function(_asKey) {
    console.warn("valid:" + _asKey, _oCfg.info[_asKey], _oCfg.info[_asKey] && (+new Date() - _oCfg.info[_asKey].time), _oCfg.expires);
    if (_oCfg.info[_asKey] && +new Date() - _oCfg.info[_asKey].time <= _oCfg.expires) {
      return true;
    }
    return false;
  };

  /**
   * 取最后的若干条
   * @param _asLength
   * @returns {*}
   */
  this.getLastIndex = function(_asLength) {
    if (_oCfg.index.length && _asLength) {
      return _oCfg.index.slice(_oCfg.index.length - _asLength);
    }
    return []
  };

  /**
   * 返回info信息
   * @param _asKey[optional]
   * @returns {{}}
   * @private
   */
  this.getInfo = function(_asKey) {
    if (_asKey) {
      return _oCfg.info[_asKey];
    }
    return _oCfg.info;
  };

  /**
   * 删除item信息
   * @param _asKey
   */
  this.deleteInfo = function(_asKey) {
    // 删idx
    this.deleteIdx_(_asKey);
    delete _oCfg.info[_asKey];

    // 写入磁盘(本地存储)
    localStorage.setItem(CFG_KEY, JSON.stringify(_oCfg));
  };

  /**
   * 更新item信息
   * @param _asKey
   * @param _asType
   * @param _asStatus[optional]
   */
  this.updateInfo = function(_asKey, _asType, _asStatus) {
//    console.error("updateInfo", _asKey, _asType, _asStatus);
    if (!_asStatus) {
      throw "status not found in [Storage.updateInfo]"
    }
    // 存储代理发生变化
    if (_oCfg.info[_asKey] && _oCfg.info[_asKey].type != _asType) {
      console.error("存储代理发生变化：" + _oCfg.info[_asKey].type + ">" + _asType );
      // 从旧的存储器里面去掉
      this.getHandler_(_oCfg.info[_asKey].type).onDeleteData(_asKey);
    }


    // 删idx
    this.deleteIdx_(_asKey);
    // 前插idx（更新热度）
    _oCfg.index.unshift(_asKey);

    // 更新info
    _oCfg.info[_asKey] = {
      time : +new Date(),
      type : _asType,
      st : _asStatus
    };

    // 写入磁盘(本地存储)
    localStorage.setItem(CFG_KEY, JSON.stringify(_oCfg));
  };

  /**
   * 写入高优先级数据
   * @param _asKey
   * @param _avVal
   */
  this.setPriorityItem = function(_asKey, _avVal) {
    var type = "localStorage";
    this.updateInfo(_asKey, type, SAVING);
    this.getHandler_(type).onSaveData(_asKey, JSON.stringify(_avVal));
  };

  /**
   * 写入
   * @param _asKey
   * @param _avVal
   */
  this.setItem = function(_asKey, _avVal) {
    for (var i = 0 ; i < this.storage.length; i ++) {
      if (this.storage[i].isSupported()) {
        console.info("setItem", _asKey);
        this.updateInfo(_asKey, this.storage[i].getType(), SAVING);
        this.storage[i].onSaveData(_asKey, JSON.stringify(_avVal));
        break;
      }
    }
  };

  /**
   * 异步方式读取
   * @param _asKey
   * @param _afCallback
   */
  this.getItem = function(_asKey, _afCallback) {
//    debugger;
    this.check_(_asKey, function(ret){
      if (ret.flag == VALID) {
        var _oSelf = this;
        console.log('getItem:saved', _asKey);
        ret.handler.onLoadData(_asKey, function(_avResult) {
          _afCallback && _afCallback.call(_oSelf, JSON.parse(_avResult));
        });
      }
      else if (ret.flag == SAVING) {
        console.log('getItem:saving', _asKey);
        this.waitFor_(function(){
          return _oCfg.info[_asKey].st == SAVED;
        }, function(){
          ret.handler.onLoadData(_asKey, function(_avResult) {
            _afCallback && _afCallback.call(_oSelf, JSON.parse(_avResult));
          });
        });
      }
      else if (ret.flag == EXPIRED) {
        console.log('expired', _asKey);
        ret.handler.onDataExpired(_asKey);
        _afCallback && _afCallback.call(this, null);
      }
      else {
        _afCallback && _afCallback.call(this, null);
      }
    });
  };

  /**
   * 删除存储内容
   * @param _asKey
   */
  this.deleteItem = function(_asKey) {
    this.check_(_asKey, function(ret) {
      if (ret.flag == VALID || ret.flag == EXPIRED) {
        console.log('delete', ret.flag, _asKey);
        ret.handler.onDeleteData(_asKey);
      }
    });
  };

  /**
   * 全部清理
   */
  this.clear = function() {
    _oCfg = {
      expires : 10*60*1000,
      index : [],
      info : {}
    };

    for (var i = 0 ; i < this.storage.length; i ++) {
      this.storage[i].onClearUp();
    }
  };

  /**
   * 获取string对象的hashCode
   * @param _asString
   * @returns {number}
   */
  this.hashCode = function (_asString) {
    var seed = 131;  // 31 131 1313 13131 131313 etc..  BKDRHash
    var hash = 0;
    for (var i = 0; i< _asString.length; i++) {
      // 为何在这里取余？ 因为文字太长，Number也溢出了 FFFFFFFF
      hash = ((hash * seed) + _asString.charCodeAt(i)) % 0xFFFFFFFF; // 取余，全都是正数;  int,无符号
    }
    return hash ;
  };
});

window.$storage = ModuleMgr.use("Storage.API", {});