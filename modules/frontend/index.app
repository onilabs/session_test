@ = require([
  'mho:std', 
  'mho:app',
  {id: './auth', name: 'auth'}
]);

//----------------------------------------------------------------------

// add some static html:
@mainContent .. @appendContent(
  @PageHeader('Session test app')
);

// main program logic:
function main() {
  @auth.withSession { 
    |session|
    
    @mainContent .. @appendContent(
      [
        @H4(`You are logged in as ${session.user}`),
        @Button('Log out') .. @OnClick({|| @auth.removeStoredCredentials();
                                           return; // bail out of main()
                                       }),
        @H4(`The time at the server is ${session.time}`)
      ]
    ) {
      ||
      // display this content 'forever' (or until retracted, by virtue
      // of the session going away):
      hold();
    }
  }
}

// kick things off in a loop, so that the user logging out leads to
// another login dialog:
while (1) {
  main();
}


