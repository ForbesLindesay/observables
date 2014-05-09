'use strict';

var assert = require('assert');
var test = require('testit');
var ob = require('../');

test('value', function () {
  var value = ob.value(null);
  assert(value() === null);
  assert(value(10) === 10);
  assert(value() === 10);
  var expected = [20, 30, 40];
  var unsubscribe = value(function (vA) {
    assert(expected.length > 0);
    var vB = value();
    assert(vA === vB);
    assert(expected.shift() === vA);
  });
  assert(expected.length === 3);
  value(20);
  assert(expected.length === 2);
  assert(value() === 20);
  value(30);
  assert(expected.length === 1);
  assert(value() === 30);
  value(40);
  assert(expected.length === 0);
  assert(value() === 40);
});

test('computed', function () {
  var i = 0;
  var computed = ob.computed(function () {
    return i++;
  });
  computed(function () {
    throw new Error('This should not be called.');
  });
  assert(computed() === 0);
  assert(computed() === 0);
  assert(computed() === 0);
});

test('computed `this` value', function () {
  function Test(value) {
    this._value = value;
  }
  Test.prototype.computed = ob.computed(function () {
    assert(this instanceof Test);
    return this._value + 1;
  });
  var objA = new Test(10);
  var objB = new Test(20);
  objA.computed(function () {
    throw new Error('This should not be called.');
  });
  objB.computed(function () {
    throw new Error('This should not be called.');
  });
  assert(objA.computed() === 11);
  assert(objA.computed() === 11);
  assert(objA.computed() === 11);
  assert(objB.computed() === 21);
  assert(objB.computed() === 21);
  assert(objB.computed() === 21);
});


test('computed dependencies', function () {
  var value = ob.value(0);
  var computed = ob.computed(function () {
    return value() + 1;
  });
  assert(computed() === 1);
  assert(value(10) === 10);
  assert(computed() === 11);
  var expected = [21, 31, 41];
  var unsubscribe = computed(function (vA) {
    assert(expected.length > 0);
    var vB = computed();
    assert(vA === vB);
    assert(expected.shift() === vA);
  });
  assert(expected.length === 3);
  value(20);
  assert(expected.length === 2);
  assert(computed() === 21);
  value(30);
  assert(expected.length === 1);
  assert(computed() === 31);
  value(40);
  assert(expected.length === 0);
  assert(computed() === 41);
});

test('computed `this` value dependencies', function () {
  function Test(value) {
    this._value = ob.value(value);
  }
  Test.prototype.update = function (value) {
    this._value(value);
  };
  Test.prototype.computed = ob.computed(function () {
    assert(this instanceof Test);
    return this._value() + 1;
  });
  var objA = new Test(10);
  var objB = new Test(20);
  objA.computed(function (value) {
    assert(value === 31);
  });
  objB.computed(function (value) {
    assert(value === 41);
  });
  assert(objA.computed() === 11);
  assert(objB.computed() === 21);
  objA.update(30);
  objB.update(40);
});
