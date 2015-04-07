!function(a,b){"use strict";b["true"]=a;var c=function(a,b){var d={},e={},f={_fCreate:function(a,b,e){var f=e&&d[e],g=d[a]=function(){arguments.length&&this.init_&&this.init_.apply(this,arguments)};return f?b.call(g.prototype=new f,f.prototype,c):b.call(g.prototype={},{},c),g},_fUse:function(a,b){return e[a]||(e[a]=new d[a](b)),e[a]}};return{create:f._fCreate,use:f._fUse}}(window);window.ModuleMgr=c,"undefined"!=typeof module&&module.exports&&(module.exports=c),c.create("Storage.Base",function(a,b){var c=5242880;this.getType=function(){return"base"},this.isSupported=function(){return!1},this.autoExpand=function(a,b,d,e){var f=e||c,g=(a+"").length+(b+"").length,h=d||{};this.queryQuota(function(a,b){a>=g?h.onsuccess&&h.onsuccess.call(this):this.requestQuota(function(a){a>g?(console.info("Base","扩容成功",g,a),h.onsuccess&&h.onsuccess.call(this)):h.onerror&&h.onerror.call(this)},f)})},this.requestQuota=function(a,b){var d=b||c,e=this;navigator.webkitTemporaryStorage?navigator.webkitTemporaryStorage.requestQuota(d,function(b){a.call(e,b)},function(b){a.call(e,0)}):window.webkitStorageInfo?window.webkitStorageInfo.requestQuota(webkitStorageInfo.TEMPORARY,d,function(b){a.call(e,b)},function(b){a.call(e,0)}):a.call(e,0)},this.queryQuota=function(a){var b=this;clearTimeout(b._mnTimerId),b._mnTimerId=setTimeout(function(){console.info("queryQuota timeout "),a.call(b,1/0,0),b._mnTimerId=-1},500);+new Date;navigator.webkitTemporaryStorage?navigator.webkitTemporaryStorage.queryUsageAndQuota(function(c,d){clearTimeout(b._mnTimerId),-1!=b._mnTimerId&&a.call(b,d,c)},function(c){-1!=b._mnTimerId&&a.call(b,1/0,0)}):window.webkitStorageInfo?window.webkitStorageInfo.queryUsageAndQuota(webkitStorageInfo.TEMPORARY,function(c,d){clearTimeout(b._mnTimerId),-1!=b._mnTimerId&&a.call(b,d,c)},function(c){-1!=b._mnTimerId&&a.call(b,1/0,0)}):a.call(b,-1,0)},this.onSaveData=function(a,b){console.info(this.getType(),"onSaveData",a),this.ctrl.updateInfo(a,this.getType(),4)},this.onLoadData=function(a,b){console.info(this.getType(),"onLoadData",a),this.ctrl.updateInfo(a,this.getType(),4)},this.onDeleteData=function(a){console.warn(this.getType(),"onDeleteData",a),this.ctrl.deleteInfo(a)},this.onDataExpired=function(a){console.warn(this.getType(),"onDataExpired",a),this.ctrl.deleteInfo(a)},this.onClearUp=function(){console.warn(this.getType(),"clearUp")},this.init_=function(b){a.init_&&a.init_.call(this,b),this.ctrl=b.ctrl}}),c.create("Storage.LocalStorage",function(a,b){var c=5242880,d="undefined"!=typeof window.useLocalStorage?window.useLocalStorage:!!window.localStorage;this.isSupported=function(){return d},this.getType=function(){return"localStorage"},this._save=function(a,b,c){if("number"==typeof c&&(this._save.retry=c),this._save.retry>=0){this._save.retry--;try{localStorage.setItem(a,b)}catch(d){console.error(d)}finally{console.info("save:"+a,!!localStorage.getItem(a),"left retry:"+this._save.retry);var e=!!localStorage.getItem(a);if(!e){var f=this.ctrl.getLastIndex(1);this.onDeleteData(f[0]),this._save(a,b)}}}else{var e=!!localStorage.getItem(a);!e&&this.onDeleteData(a)}},this.onSaveData=function(b,d){return b.length+d.length>c?void this.onDeleteData(b):(this._save(b,d,10),void a.onSaveData.apply(this,arguments))},this.onLoadData=function(b,c){a.onLoadData.apply(this,arguments);var d=localStorage.getItem(b);c&&c(d)},this.onDeleteData=function(b){a.onDeleteData.apply(this,arguments),localStorage.removeItem(b)},this.onDataExpired=function(b){a.onDataExpired.apply(this,arguments),localStorage.removeItem(b)},this.onClearUp=function(){a.onClearUp.call(this),localStorage.clear()}},"Storage.Base"),c.create("Storage.WebSQL",function(a,b){var c="bigtable",d="1.0",e="Storage for 9game",f="key",g="val",h=5242880,i=5242880,j="CREATE TABLE IF NOT EXISTS "+c+" ("+f+" UNIQUE, "+g+")",k="INSERT OR REPLACE INTO "+c+" ("+f+", "+g+") VALUES (?, ?)",l="SELECT DISTINCT("+g+") FROM "+c+" WHERE "+f+"=?",m="DELETE FROM "+c+" WHERE "+f+"=?",n="DELETE FROM "+c,o="undefined"!=typeof window.useWebSQL?window.useWebSQL:!!window.openDatabase;this.isSupported=function(){return o},this.getType=function(){return"webSQL"},this.init_=function(b){a.init_.apply(this,arguments),this.db=window.openDatabase("Storage.WebSQL",d,e,h),this.db.transaction(function(a){a.executeSql(j)})},this.onSaveData=function(b,c){var d=this;this.autoExpand(b,c,{onsuccess:function(){this.db.transaction(function(e){console.info("WebSQL:onSaveData",b),e.executeSql(k,[b,c]),a.onSaveData.call(d,b,c)})},onerror:function(){o=!1,this.onDeleteData(b)}},i)},this.onLoadData=function(b,c){var d=this,e=+new Date;console.error("webSQL.onLoadData",b),this.db.readTransaction(function(f){console.error("webSQL.readTransaction",b,+new Date-e),f.executeSql(l,[b],function(f,h){console.error("webSQL.executeSql",b,+new Date-e);var i=h.rows.length;if(i){var j=h.rows.item(0)[g];j&&c&&c(j),a.onLoadData.call(d,b)}})})},this.onDeleteData=function(b){a.onDeleteData.apply(this,arguments),this.db.transaction(function(a){a.executeSql(m,[b])})},this.onDataExpired=function(b){a.onDataExpired.apply(this,arguments),this.db.transaction(function(a){a.executeSql(m,[b])})},this.onClearUp=function(){a.onClearUp.call(this),this.db.transaction(function(a){a.executeSql(n,[])})}},"Storage.Base"),c.create("Storage.IndexedDB",function(a,b){var c="bigtable",d=1,e="items",f="val",g="readwrite",h="readonly",i=5242880;window.indexedDB=window.indexedDB||window.webkitIndexedDB||window.msIndexedDB,window.IDBTransaction=window.IDBTransaction||window.webkitIDBTransaction||window.msIDBTransaction,window.IDBKeyRange=window.IDBKeyRange||window.webkitIDBKeyRange||window.msIDBKeyRange;var j="undefined"!=typeof window.useIndexDB?window.useIndexDB:!!window.indexedDB;this.isSupported=function(){return j},this.getType=function(){return"indexDB"},this.init_=function(b){a.init_.apply(this,arguments);var f=this,h=window.indexedDB.open(c,d);h.onerror=function(a){"VersionError"!=h.error.name||f.isRetry?j=!1:(window.indexedDB.deleteDatabase(c),f.init_(b),f.isRetry=!0)},h.onsuccess=function(a){f.db=h.result;var b=f.db.transaction(e,g);b.oncomplete=function(a){console.log("Transaction ok. All done!")},b.onerror=function(a){console.dir(a),j=!1}},h.onupgradeneeded=function(a){console.info("onupgradeneeded"),a.currentTarget.result.createObjectStore(e,{autoIncrement:!1})}},this._getObjectStore=function(a,b){var c=this;this.ctrl.waitFor_(function(){return!!c.db},function(){var d=c.db.transaction(e,b);a&&a.call(c,d.objectStore(e))})},this._canNotSave=function(a){j=!1,this.onDeleteData(a)},this.onSaveData=function(b,c){var d=this;this.autoExpand(b,c,{onsuccess:function(){this._getObjectStore(function(e){var f=e.put({key:b,val:c},b);f.onsuccess=function(){console.info(d.getType(),"onSaveData -succ"),a.onSaveData.call(d,b,c)},f.onerror=function(a){console.error("onSaveData",a),d._canNotSave(b)}},g)},onerror:function(){d._canNotSave(b)}},i)},this.onLoadData=function(b,c){var d=this,e=+new Date;console.error("indexedDB.onLoadData",b),this._getObjectStore(function(g){console.error("indexedDB.onLoadData.transaction",b,+new Date-e);var h=g.get(b);h.onsuccess=function(g){console.error("indexedDB.onLoadData.transaction - succ",b,+new Date-e);var h=g.target.result;h&&(c&&c(h[f]),a.onLoadData.call(d,b))},h.onerror=function(a){console.error("onLoadData",a),d._canNotSave(b)}},h)},this.onDeleteData=function(b){a.onDeleteData.apply(this,arguments);this._getObjectStore(function(a){var c=a["delete"](b);c.onerror=function(a){console.error("onDeleteData",a),j=!1}},g)},this.onDataExpired=function(b){a.onDataExpired.apply(this,arguments);this._getObjectStore(function(a){var c=a["delete"](b);c.onerror=function(a){console.error("onDataExpired",a),j=!1}},g)},this.onClearUp=function(){a.onClearUp.call(this);this._getObjectStore(function(a){var b=a.clear();b.onerror=function(a){j=!1}},g)}},"Storage.Base"),c.create("Storage.API",function(a,b){var c="stOraGE-_-CFG",d=0,e=1,f=2,g=3,h=4,i={};this.storage=[b.use("Storage.WebSQL",{ctrl:this}),b.use("Storage.IndexedDB",{ctrl:this}),b.use("Storage.LocalStorage",{ctrl:this})],this.init_=function(a){var b=localStorage.getItem(c);i=b?JSON.parse(b):{expires:6e5,index:[],info:{}}},this.getHandler_=function(a){for(var b=0;b<this.storage.length;b++)if(this.storage[b].getType()==a)return this.storage[b]},this.check_=function(a,b){var c=this;i.info[a]?+new Date-i.info[a].time>i.expires?b&&b.call(c,{flag:f,key:a,val:null,handler:this.getHandler_(i.info[a].type)}):i.info[a].st==g?b&&b.call(c,{flag:g,key:a,val:null,handler:this.getHandler_(i.info[a].type)}):b&&b.call(c,{flag:e,key:a,val:JSON.stringify(localStorage.getItem(a)),handler:this.getHandler_(i.info[a].type)}):b&&b.call(c,{flag:d,key:a,val:null})},this.waitFor_=function(a,b){var c=this;a()?b():setTimeout(function(){a()?b():c.waitFor_.apply(c,[a,b])})},this.findIdx_=function(a){for(var b=0;b<i.index.length;b++)if(i.index[b]==a)return b;return-1},this.deleteIdx_=function(a){i.info[a]&&i.index.splice(this.findIdx_(a),1)},this.valid=function(a){return console.warn("valid:"+a,i.info[a],i.info[a]&&+new Date-i.info[a].time,i.expires),i.info[a]&&+new Date-i.info[a].time<=i.expires?!0:!1},this.getLastIndex=function(a){return i.index.length&&a?i.index.slice(i.index.length-a):[]},this.getInfo=function(a){return a?i.info[a]:i.info},this.deleteInfo=function(a){this.deleteIdx_(a),delete i.info[a],localStorage.setItem(c,JSON.stringify(i))},this.updateInfo=function(a,b,d){if(!d)throw"status not found in [Storage.updateInfo]";i.info[a]&&i.info[a].type!=b&&(console.error("存储代理发生变化："+i.info[a].type+">"+b),this.getHandler_(i.info[a].type).onDeleteData(a)),this.deleteIdx_(a),i.index.unshift(a),i.info[a]={time:+new Date,type:b,st:d},localStorage.setItem(c,JSON.stringify(i))},this.setPriorityItem=function(a,b){var c="localStorage";this.updateInfo(a,c,g),this.getHandler_(c).onSaveData(a,JSON.stringify(b))},this.setItem=function(a,b){for(var c=0;c<this.storage.length;c++)if(this.storage[c].isSupported()){console.info("setItem",a),this.updateInfo(a,this.storage[c].getType(),g),this.storage[c].onSaveData(a,JSON.stringify(b));break}},this.getItem=function(a,b){this.check_(a,function(c){if(c.flag==e){var d=this;console.log("getItem:saved",a),c.handler.onLoadData(a,function(a){b&&b.call(d,JSON.parse(a))})}else c.flag==g?(console.log("getItem:saving",a),this.waitFor_(function(){return i.info[a].st==h},function(){c.handler.onLoadData(a,function(a){b&&b.call(d,JSON.parse(a))})})):c.flag==f?(console.log("expired",a),c.handler.onDataExpired(a),b&&b.call(this,null)):b&&b.call(this,null)})},this.deleteItem=function(a){this.check_(a,function(b){(b.flag==e||b.flag==f)&&(console.log("delete",b.flag,a),b.handler.onDeleteData(a))})},this.clear=function(){i={expires:6e5,index:[],info:{}};for(var a=0;a<this.storage.length;a++)this.storage[a].onClearUp()},this.hashCode=function(a){for(var b=131,c=0,d=0;d<a.length;d++)c=(c*b+a.charCodeAt(d))%4294967295;return c}}),window.$storage=c.use("Storage.API",{})}({},function(){return this}());