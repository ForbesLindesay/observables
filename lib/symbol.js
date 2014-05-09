'use strict';

var prefix = '__symbol__' + Math.random() + '__';
var id = 0;

module.exports = Symbol;

function Symbol() {
  this.__symbol__ = prefix + id++;
}
Symbol.prototype.set = function (self, value) {
  Object.defineProperty(self, this.__symbol__, {
    enumerable: false,
    configurable: true,
    writable: false,
    value: value
  });
  return value;
}
Symbol.prototype.get = function (self) {
  return self[this.__symbol__];
}