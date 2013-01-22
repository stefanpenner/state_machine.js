if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
      throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0) {
      return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  }
}

function StateMachine(options){
  this.state = options.state;
  this.states = options.states || {};
  this._subscriptions = {};

  var beforeTransitions = (options.beforeTransitions ||[]);
  var afterTransitions  = (options.afterTransitions ||[]);
  var rule;

  for(var i = 0, length = beforeTransitions.length; length > i; i++){
    rule = beforeTransitions[i];
    this.beforeTransition.call(this, rule.from, rule.to, rule.fn);
  }

  for(var i = 0, length = afterTransitions.length; length > i; i++){
    rule = afterTransitions[i];
    this.afterTransition.call(this, rule.from, rule.to, rule.fn);
  }
}

StateMachine.SPLAT = SPLAT =  '*';

StateMachine.prototype = {
  transitionTo: function(nextState){
    var state = this.states[nextState],
    previousState = this.state;

    if (!state) {
      throw new Error('Unknown State:' + nextState);
    }

    this.willTransition(previousState, nextState);
    this.state = nextState;
    this.didTransition(previousState, nextState);
  },

  beforeTransition: function(from, to, fn, fnContext) {
    this._fuzzyTransition('willTransition', from, to, fn, fnContext);
  },

  afterTransition: function(from, to, fn, fnContext) {
    this._fuzzyTransition('didTransition', from, to, fn, fnContext);
  },

  _fuzzyTransition: function(event, from, to, fn, fnContext) {
    var context = fnContext || this,
    from = from || SPLAT,
    to   = to   || SPLAT,

    fromSplatOffset = from.indexOf(SPLAT),
    toSplatOffset   = to.indexOf(SPLAT);

    if (fromSplatOffset >= 0){ from = from.substr(fromSplatOffset, 0); }
    if (toSplatOffset   >= 0){   to = to.substr(toSplatOffset, 0);     }

    this.on(event, function(currentFrom, currentTo)  {
      if (fromSplatOffset >= 0){ currentFrom = currentFrom.substr(fromSplatOffset, 0); }
      if (toSplatOffset   >= 0){   currentTo = currentTo.substr(toSplatOffset, 0);     }

      if(currentTo === to && currentFrom === from){
        fn.call(context, from, to);
      }
    });
  },

  willTransition: function(from, to) {
    this._notify('willTransition', from, to);
  },

  didTransition: function(from, to) {
    this._notify('didTransition', from, to);
  },

  _notify: function(name, from, to) {
    var subscriptions = (this._subscriptions[name] || []);

    for( var i = 0, length = subscriptions.length; i < length; i++){
      subscriptions[i].call(this, from, to);
    }
  },

  on: function(event, fn) {
    this._subscriptions[event] = this._subscriptions[event] || [];
    this._subscriptions[event].push(fn);
  },

  off: function(event, fn) {
    var idx = this._subscriptions[event].indexOf(fn);

    if (fn){
      if (idx) {
        this._subscriptions[event].splice(idx, 1);
      }
    }else {
      this._subscriptions[event] = null;
    }
  },

  send: function(eventName) {
    var event = this.states[this.state][eventName];

    if (event) {
      return event.call(this);
    }else{
      this.unhandledEvent(eventName);
    }
  },

  unhandledEvent: function(event){
    throw new Error("Unknown Event: `" + event + "`");
  }
};
