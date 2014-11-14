
'use strict';

/**
 * 类/模块控制权
 */
var ModuleMgr = (function(global, undefined) {
  var _oModules = {};
  var _oInstance = {};
  var _oMgr = {
    _fCreate : function(_asModuleName, _afHandel, _asSuper) {
      var _oSuperClass = _asSuper && _oModules[_asSuper];
      var _oClass = _oModules[_asModuleName] = function() {
        arguments.length && this.init_ && this.init_.apply(this, arguments);
      }

      if (_oSuperClass) {
        _afHandel.call(_oClass.prototype = new _oSuperClass() , _oSuperClass.prototype, ModuleMgr);
      }
      else {
        _afHandel.call(_oClass.prototype = {} , {}, ModuleMgr);
      }

      return _oClass;
    },

    _fUse : function(_asModuleName, _aoCfg) {
      if (!_oInstance[_asModuleName]) {
        _oInstance[_asModuleName] = new _oModules[_asModuleName](_aoCfg);
      }

      return _oInstance[_asModuleName];
    }
  };

  return {
    create : _oMgr._fCreate,
    use : _oMgr._fUse
  }
})(window);
window.ModuleMgr = ModuleMgr;

if(typeof(module) != "undefined" && module.exports){
  module.exports = ModuleMgr;
}
