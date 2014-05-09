'use strict';

var assert = require('assert');
var Symbol = require('./lib/symbol.js');

var sentinel = {};

exports.value = value;
exports.computed = computed;
exports.isObservable = isObservable;
exports.unwrap = unwrap;

var getHandlers = [];
function noop() {}
function onGet(observable) {
  assert(isObservable(observable));
  if (getHandlers.length) {
    getHandlers[getHandlers.length - 1](observable);
  }
}

function value(value) {
  var subscriptions = [];
  function accessor(updated) {
    if (arguments.length === 0) {
      onGet(accessor);
      return value;
    } else if (typeof updated === 'function') {
      assert(typeof updated === 'function', 'You must pass a function to subscribe.');
      assert(subscriptions.indexOf(updated) === -1, 'You cannot subscribe the same function to the same observable multiple times.');
      subscriptions.push(updated);
      return function dispose() {
        assert(subscriptions.indexOf(updated) !== -1, 'This subscription has already been disposed.');
        subscriptions.splice(subscriptions.indexOf(updated), 1);
        assert(subscriptions.indexOf(updated) === -1, 'Failed to unsubscribe fn from observable.');
      }
    } else if (value !== updated || typeof value === 'object') {
      value = updated;
      for (var i = 0; i < subscriptions.length; i++) {
        subscriptions[i](value);
      }
      return value;
    }
  }
  accessor.isObservable = sentinel;
  return accessor;
}

function evaluate(fn, onUpdate) {
  var dispose = [];
  function _onUpdate () {
    for (var i = 0; i < dispose.length; i++) {
      dispose[i]();
    }
    onUpdate();
  }
  getHandlers.push(function (observable) {
    dispose.push(observable(_onUpdate));
  });
  var res = fn();
  getHandlers.pop();
  return res;
}

function computed(fn) {
  var usesThis = /\bthis\b/.test(fn.toString());
  var state = usesThis ? new Symbol() : blankState();
  function blankState() {
    return {updated: false, value: value(), listeners: []};
  }
  function getState(self) {
    return usesThis ? (state.get(self) || state.set(self, blankState())) : state;
  }
  function onUpdate() {
    var state = getState(this);
    state.updated = false;
    for (var i = 0; i < state.listeners.length; i++) {
      state.listeners[i](accessor.call(this));
    }
  }
  function accessor(handler) {
    var state = getState(this);
    if (arguments.length === 0) {
      if (state.updated) {
        return state.value;
      } else {
        state.updated = true;
        return state.value = evaluate(fn.bind(this), onUpdate.bind(this));
      }
    } else {
      state.listeners.push(handler);
    }
  }
  accessor.isObservable = sentinel;
  return accessor;
}
 
function isObservable(observable) {
  return typeof observable === 'function' && observable.isObservable === sentinel;
}
 
function unwrap(observable) {
  if (arguments.length === 2) {
    var self = unrwap(observable);
    var key = arguments[1];
    assert(typeof key === 'string', 'Object key must be a string');
    if (isObservable(self[key])) return self[key]();
    else return self[key];
  }
  if (isObservable(observable)) return observable();
  else return observable;
}