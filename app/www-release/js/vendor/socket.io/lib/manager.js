function Manager(e,t){if(!(this instanceof Manager))return new Manager(e,t);t=t||{},t.path=t.path||"/socket.io",this.nsps={},this.subs=[],this.opts=t,this.reconnection(t.reconnection),this.reconnectionAttempts(t.reconnectionAttempts||Infinity),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.timeout(null==t.timeout?2e4:t.timeout),this.readyState="closed",this.uri=e,this.connected=0,this.attempts=0,this.encoding=!1,this.packetBuffer=[],this.encoder=new parser.Encoder,this.decoder=new parser.Decoder,this.open()}var url=require("./url"),eio=require("engine.io-client"),Socket=require("./socket"),Emitter=require("emitter"),parser=require("socket.io-parser"),on=require("./on"),bind=require("bind"),object=require("object-component"),debug=require("debug")("socket.io-client:manager");module.exports=Manager,Emitter(Manager.prototype),Manager.prototype.reconnection=function(e){return arguments.length?(this._reconnection=!!e,this):this._reconnection},Manager.prototype.reconnectionAttempts=function(e){return arguments.length?(this._reconnectionAttempts=e,this):this._reconnectionAttempts},Manager.prototype.reconnectionDelay=function(e){return arguments.length?(this._reconnectionDelay=e,this):this._reconnectionDelay},Manager.prototype.reconnectionDelayMax=function(e){return arguments.length?(this._reconnectionDelayMax=e,this):this._reconnectionDelayMax},Manager.prototype.timeout=function(e){return arguments.length?(this._timeout=e,this):this._timeout},Manager.prototype.open=Manager.prototype.connect=function(e){debug("readyState %s",this.readyState);if(~this.readyState.indexOf("open"))return this;debug("opening %s",this.uri),this.engine=eio(this.uri,this.opts);var t=this.engine,n=this;this.readyState="opening";var r=on(t,"open",bind(this,"onopen")),i=on(t,"error",function(t){n.cleanup(),n.readyState="closed",n.emit("connect_error",t);if(e){var r=new Error("Connection error");r.data=t,e(r)}});if(!1!==this._timeout){var s=this._timeout;debug("connect attempt will timeout after %d",s);var o=setTimeout(function(){debug("connect attempt timed out after %d",s),r.destroy(),t.close(),t.emit("error","timeout"),n.emit("connect_timeout",s)},s);this.subs.push({destroy:function(){clearTimeout(o)}})}return this.subs.push(r),this.subs.push(i),this},Manager.prototype.onopen=function(){debug("open"),this.cleanup(),this.readyState="open",this.emit("open");var e=this.engine;this.subs.push(on(e,"data",bind(this,"ondata"))),this.subs.push(on(this.decoder,"decoded",bind(this,"ondecoded"))),this.subs.push(on(e,"error",bind(this,"onerror"))),this.subs.push(on(e,"close",bind(this,"onclose")))},Manager.prototype.ondata=function(e){this.decoder.add(e)},Manager.prototype.ondecoded=function(e){this.emit("packet",e)},Manager.prototype.onerror=function(e){debug("error",e),this.emit("error",e)},Manager.prototype.socket=function(e){var t=this.nsps[e];if(!t){t=new Socket(this,e),this.nsps[e]=t;var n=this;t.on("connect",function(){n.connected++})}return t},Manager.prototype.destroy=function(e){--this.connected||this.close()},Manager.prototype.packet=function(e){debug("writing packet %j",e);var t=this;t.encoding?t.packetBuffer.push(e):(t.encoding=!0,this.encoder.encode(e,function(e){for(var n=0;n<e.length;n++)t.engine.write(e[n]);t.encoding=!1,t.processPacketQueue()}))},Manager.prototype.processPacketQueue=function(){if(this.packetBuffer.length>0&&!this.encoding){var e=this.packetBuffer.shift();this.packet(e)}},Manager.prototype.cleanup=function(){var e;while(e=this.subs.shift())e.destroy();this.packetBuffer=[],this.encoding=!1,this.decoder.destroy()},Manager.prototype.close=Manager.prototype.disconnect=function(){this.skipReconnect=!0,this.engine.close()},Manager.prototype.onclose=function(e){debug("close"),this.cleanup(),this.readyState="closed",this.emit("close",e),this.skipReconnect||this.reconnect()},Manager.prototype.reconnect=function(){if(this.reconnecting)return this;var e=this;this.attempts++;if(this.attempts>this._reconnectionAttempts)debug("reconnect failed"),this.emit("reconnect_failed"),this.reconnecting=!1;else{var t=this.attempts*this.reconnectionDelay();t=Math.min(t,this.reconnectionDelayMax()),debug("will wait %dms before reconnect attempt",t),this.reconnecting=!0;var n=setTimeout(function(){debug("attempting reconnect"),e.open(function(t){t?(debug("reconnect attempt error"),e.reconnecting=!1,e.reconnect(),e.emit("reconnect_error",t.data)):(debug("reconnect success"),e.onreconnect())})},t);this.subs.push({destroy:function(){clearTimeout(n)}})}},Manager.prototype.onreconnect=function(){var e=this.attempts;this.attempts=0,this.reconnecting=!1,this.emit("reconnect",e)};