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

test("transitions to existing root state", function(){
  expect(2);
  var machine = buildMachine()
  equal(machine.state, machine.states.alpha);
  machine.transitionTo('beta');
  equal(machine.state, machine.states.beta);
});

test("fails to transition to none-existent state", function(){
  expect(3);
  var machine = buildMachine()
  equal(machine.state, machine.states.alpha);

  throws(function(){
    machine.transitionTo('OMG');
  }, function(error){
    return error.message === 'Unknown State: `OMG`';
  }, "throws an error");

  equal(machine.state, machine.states.alpha, 'remains in original state if destination state does not exist');
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

test("trySend", function(){
  expect(0);
  var machine = buildMachine()
  machine.trySend("unknownMethod")
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
    return error.message === "Unknown Event: `unknownEventName` for state: `alpha`";
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
  expect(3);
  var machine = buildMachine()

  machine.beforeTransition({ from: 'alpha', to: 'beta'}, function(from, to){
    equal(from, 'alpha');
    equal(to, 'beta');

    ok(transitionShouldBeCalled);
  });

  transitionShouldBeCalled = true;
  machine.transitionTo('beta')

  transitionShouldBeCalled = true;
  machine.transitionTo('alpha')
});

test('fuzzy match simple', function(){
  expect(3);
  var machine = buildMachine()

  machine.beforeTransition({from: 'al*', to: 'beta'}, function(from, to){
    equal(from, 'alpha');
    equal(to, 'beta');

    ok(transitionShouldBeCalled);
  });

  transitionShouldBeCalled = true;
  machine.transitionTo('beta')

  transitionShouldBeCalled = true;
  machine.transitionTo('alpha')
});

test('fuzzy match more complex', function(){
  expect(3);
  var machine = buildMachine()

  machine.transitionTo('beta')
  equal(machine.currentStateName, 'beta');

  var transitionWasCalled = false;

  machine.beforeTransition({from: '*', to: 'bet*'}, function(from, to){
    transitionWasCalled = true;
  });

  transitionShouldBeCalled = true;
  machine.transitionTo('alpha');

  ok(!transitionWasCalled, 'the transition should not have been called');
  equal(machine.currentStateName, 'alpha');
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

module('.transitionTo');

test('it exists', function(){
  ok(StateMachine.transitionTo)
});

test('it works', function(){
  expect(2);

  var machine = buildMachine();

  machine.states.alpha.becomeBeta = StateMachine.transitionTo('beta');
  equal(machine.state, machine.states.alpha);

  machine.send('becomeBeta');
  equal(machine.state, machine.states.beta);
});

var userState, authPopup, authPopupIsOpen, signingUpIsOpen
signingUpViaFacebookIsOpen = signingUpViaEmailIsOpen = null;

module('integration',{
  setup: function(){
    var transitionTo = SM.transitionTo;
    authPopupIsOpen = signingUpIsOpen = signingUpViaFacebookIsOpen = signingUpViaEmailIsOpen = false;

    authPopup = new StateMachine({
      initialState: 'closed',
      states: {
        closed: {
          signUpViaFacebook: transitionTo('open.signingUp.viaFacebook'),
          signUpViaEmail:    transitionTo('open.loggingIn.viaEmail'),
          logInViaFacebook:  transitionTo('open.loggingIn.viaFacebook'),
          logInViaEmail:     transitionTo('open.loggingIn.viaEmail'),

          welcomeBack:       transitionTo('open.welcomingBack')
        },

        'open.signingUp.viaFacebook': { },
        'open.signingUp.viaEmail':    { },

        'open.loggingIn.viaFacebook': { },
        'open.loggingIn.viaEmail':    { },

        'open.recoveringPassword':   { },
        'open.welcomingBack':        { },
      }
    });

    authPopup.beforeTransition({ from: 'open.*',      to: 'closed' }, function(){ authPopupIsOpen = false });
    authPopup.afterTransition({  from: 'closed', to: 'open.*'      }, function(){ authPopupIsOpen = true  });

    authPopup.afterTransition({  from: '*', to: 'open.signingUp.*'           }, function(){ signingUpIsOpen = true  });
    authPopup.afterTransition({  from: '*', to: 'open.signingUp.viaFacebook' }, function(){ signingUpViaFacebookIsOpen = true });
    authPopup.afterTransition({  from: '*', to: 'open.loggingIn.viaEmail' },    function(){ signingUpViaEmailIsOpen = true });

    userState = new StateMachine({
      initialState: 'unknownUser',
      states: {
        unknownUser:{
          openAuthDialog: function(){ authPopup.send('signUpViaFacebook'); }
        },

        isAuthenticated:{
          openAuthDialog: function(){ /* N/A */ }
        },

        isFacebookAuthenticated: {
          openAuthDialog: function(){ authPopup.send('welcomBack'); }
        },

        hasFacebookConnected:{
          openAuthDialog: function(){ authPopup.send('logInViaFacebook'); }
        },

        hasEmailedAuthenticated: {
          openAuthDialog: function(){ authPopup.send('logInViaEmail'); }
        }
      }
    });
  },

  teardown: function(){
    userState = authPopup = undefined;
    authPopupIsOpen = signingUpIsOpen = signingUpViaFacebookIsOpen = signingUpViaEmailIsOpen = false;
  }
});

test("initial states", function(){
  expect(5);

  ok(authPopup.state);
  ok(userState.state);

  equal(authPopup.currentStateName, 'closed');
  equal(userState.currentStateName, 'unknownUser');

  equal(authPopupIsOpen, false);
});

test("userState.send('openAuthDialog') puts the authPopup in the correct state", function(){
  expect(14);

  equal(authPopup.currentStateName, 'closed');
  equal(userState.currentStateName, 'unknownUser');

  equal(authPopupIsOpen, false);
  equal(signingUpIsOpen, false);
  equal(signingUpViaFacebookIsOpen, false);

  userState.send('openAuthDialog');

  equal(authPopupIsOpen, true);
  equal(signingUpIsOpen, true);
  equal(signingUpViaFacebookIsOpen, true);

  equal(authPopup.currentStateName, 'open.signingUp.viaFacebook');
  equal(userState.currentStateName, 'unknownUser');

  signingUpViaFacebookIsOpen  = false;
  userState.transitionTo('hasEmailedAuthenticated');
  authPopup.transitionTo('closed');
  userState.send('openAuthDialog');

  equal(authPopupIsOpen, true, 'authPopup is active');
  equal(signingUpIsOpen, true, 'signingUp is active');
  equal(signingUpViaFacebookIsOpen ,false, 'signingUpViaFacebook is NOT active');
  equal(signingUpViaEmailIsOpen, true, 'signingUpViaEmail is active');
});
