function buildMachine(){
  return new StateMachine({
    initialState: 'alpha',
    states: {
      alpha: {
        sayHi: function() { return 'hi from alpha'; }
      },
      beta: {
        sayHi: function() { return 'hi from beta'; }
      }
    }
  });
}

module('api');
test('SM is StateMachine', function(){
  equal(SM, StateMachine);
});

test("has states", function() {
  var machine = buildMachine()
  ok(machine.states);
});

test("has state", function() {
  var machine = buildMachine()
  ok(machine.state);
});

test("transitions to existing state", function(){
  expect(2);
  var machine = buildMachine()
  equal(machine.state, machine.states.alpha);
  machine.transitionTo('beta');
  equal(machine.state, machine.states.beta);
});

test("willTransition", function(){
  expect(2);
  var machine = buildMachine()
  machine.on('willTransition', function(from, to){
    equal(from, 'alpha');
    equal(to,  'beta');
  });
  machine.transitionTo('beta');
  machine.off('willTransition');
});

test("didTransition", function(){
  expect(3);
  var machine = buildMachine(),
  willTransitionDidRun;

  machine.on('willTransition', function(from, to){
    willTransitionDidRun = true;
  });

  machine.on('didTransition', function(from, to){
    ok(willTransitionDidRun, 'willTransition ran before');
    equal(from,'alpha');
    equal(to,  'beta');
  });

  machine.transitionTo('beta');

  machine.off('willTransition');
  machine.off('didTransition');
});

test("send", function(){
  var machine = buildMachine()
  equal(machine.send("sayHi"), "hi from alpha");
  machine.transitionTo('beta');
  equal(machine.send("sayHi"), "hi from beta");
});

var machine;


test("on", function(){
  var machine = buildMachine()
  expect(2);

  var firstTransition =  function(from, to){
    equal(from,'alpha');
    equal(to,  'beta');
  };

  machine.on('willTransition', firstTransition);
  machine.transitionTo('beta');
  machine.off('willTransition', firstTransition);
});

test("off.global", function(){
  var machine = buildMachine()
  expect(1);

  var shouldRun,
  firstTransition = function(from, to){
    ok(shouldRun)
  };

  shouldRun = true;
  machine.on('willTransition', firstTransition);
  machine.transitionTo('beta');

  machine.off('willTransition');
  shouldRun = false;
  machine.transitionTo('alpha');
});

test("off.specific", function(){
  var machine = buildMachine()
  expect(3);

  var fooShouldRun,
  barShouldRun,
  foo = function(from, to){
    ok(fooShouldRun)
  },
  bar = function(from, to){
    ok(barShouldRun)
  };

  machine.on('willTransition',foo);
  machine.on('willTransition',bar);

  fooShouldRun = true;
  barShouldRun = true;

  machine.transitionTo('beta');

  machine.off('willTransition', bar);
  fooShouldRun = true;
  barShouldRun = false;

  machine.transitionTo('alpha');
});

module('.unhandledEvent');

test("no unhandledEvent", function(){
  var machine = buildMachine()
  expect(1);

  throws(function(){
    machine.send('unknownEventName')
  }, function(error){
    return error.message === "Unknown Event: `unknownEventName`";
  }, "throws an error");
});

test("unhandledEvent", function(){
  var machine = buildMachine()
  expect(1);
  var originalEventName = 'unknownEventName'

  machine.unhandledEvent = function(eventName){
    equal(eventName, originalEventName);
  };

  machine.send(originalEventName)
});

module('.beforeTransition');

test('exact match', function(){
  expect(1);
  var machine = buildMachine()

  machine.beforeTransition('alpha','beta', function(){
    ok(transitionShouldBeCalled);
  });

  transitionShouldBeCalled = true;
  machine.transitionTo('beta')

  transitionShouldBeCalled = true;
  machine.transitionTo('alpha')
});

test('fuzy match', function(){
  expect(1);
  var machine = buildMachine()

  machine.beforeTransition('al*','beta', function(){
    ok(transitionShouldBeCalled);
  });

  transitionShouldBeCalled = true;
  machine.transitionTo('beta')

  transitionShouldBeCalled = true;
  machine.transitionTo('alpha')
});

test('DSL', function(){
  expect(4);

  var beforeWasRun,
  afterWasRun,
  machine = new StateMachine({
    beforeTransitions: [
      {
        to: 'beta',
        fn: function(){ ok(beforeWasRun); }
      }
    ],

    afterTransitions: [
      {
        from: '*',
        to: 'beta',
        fn: function(){ ok(afterWasRun); }
      }
    ],

    initialState: 'alpha',
    states: {
      alpha: {
        sayHi: function() { return 'hi from alpha'; }
      },
      beta: {
        sayHi: function() { return 'hi from beta'; }
      }
    }
  });

  beforeWasRun = true;
  afterWasRun = true;

  machine.transitionTo('beta');

  beforeWasRun = false;
  afterWasRun = false;

  machine.transitionTo('alpha');

  beforeWasRun = true;
  afterWasRun = true;

  machine.transitionTo('beta');
});
