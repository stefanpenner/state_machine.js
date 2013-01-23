
```javascript
var userState, authPopup;

var transitionTo = SM.transitionTo;

authPopup = new StateMachine({
  initialState: 'closed',

  closed: {
    signUpViaFacebook: transitionTo('signingUpViaFacebook'),
    signUpViaEmail:    transitionTo('loggingInViaEmail'),
    loginViaFacebook:  transitionTo('loggingInViaFacebook'),
    loginViaEmail:     transitionTo('loggingInViaEmail'),

    welcomeBack:       transitionTo('welcomingBack')
  },

  signingUpViaFacebook: { },
  signingUpViaEmail:    { },

  loggingInViaFacebook: { },
  loggingInViaEmail:    { },

  recoveringPassword:   { },
  welcomingBack:        { }
});

authPopup.beforeTransition({ from: '*',      to: 'closed' }, function(){ console.log('close window'); });
authPopup.afterTransition({  from: 'closed', to: '*'      }, function(){ console.log('open window');  });

userState = new StateMachine({
  initialState: 'unknownUser',
  unknownUser:{
    openAuthDialog: function(){ authPopup.send('signupViaFacebook'); }
  },

  isAuthenticated:{
    openAuthDialog: function(){ authPopup.send('signingUpViaFacebook'); }
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
});

```
