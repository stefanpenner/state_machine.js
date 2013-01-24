
```javascript
 var transitionTo = SM.transitionTo;

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
```
