@ = require([
  'mho:std',
  'mho:app',
  {id: 'sjs:sjcl', name: 'crypto' }
]);

//----------------------------------------------------------------------
// helpers

// We never use the user's cleartext password, but a hash derived from
// the password. Note that this is just a complementary security
// measure to prevent any casual inspection of a password that the
// user might use elsewhere. A proper salted password will be derived
// from this on the server.
function obscurePassword(cleartext) {
  return "session-test-app #{cleartext}" .. 
    @crypto.hash.sha256.hash .. 
    @crypto.codec.base64.fromBits;
}

function removeStoredCredentials() {
  delete localStorage['session_test_app_credentials'];
}
exports.removeStoredCredentials = removeStoredCredentials;


// The @Input signature has changed since Conductance v 0.5.1; make
// our code compatible with all Conductance versions:
var Input;
if (@TextInput) {
  // conductance v 0.5.1
  Input = (settings) -> @Input(settings.type, settings.value);
}
else {
  Input = @Input;
}
  

//----------------------------------------------------------------------
/**
   @function withSession
   @param {Function} [block] Function to execute with session
   @summary Execute `block` with an authenticated server api session, 
            prompting for username/password if neccessary. 
*/
function withSession(block) {
  @withAPI('./main.api') { 
    |api|
    
    while (1) {
      var session;
      // attempt to login in with stored credentials:
      if (localStorage['session_test_app_credentials']) {
        try {
          session = api.login(localStorage['session_test_app_credentials']);
        }
        catch (e) {
          // credentials are invalid
          removeStoredCredentials();
          // go round loop again
          continue;
        }
      }
      else {
        // display a login/register dialog
        session = doLoginDialog(api);
      }      
      
      // we've got a session; run our block:
      block(session);
      return;
    }
  }
}
exports.withSession = withSession;

//----------------------------------------------------------------------

// helper to display a login/register dialog that returns a session:
function doLoginDialog(api) {

  var Command = @Emitter();
  var Username = @ObservableVar();
  var Password = @ObservableVar();
  var ErrorMessage = @ObservableVar();

  @doModal(
    {
      title: 'Log in...',

      body:
        [
          'Username:', Input({type: 'text', value: Username}) .. @Autofocus,
          'Password:', Input({type: 'password', value: Password}),
          @Span(ErrorMessage) .. @Style('color:red')
        ],

      footer: 
        [
          @Button('Register') .. @OnClick(-> Command.emit('register')),
          @Button('Log in') .. @OnClick(-> Command.emit('login'))
        ],
      
      close_button: false,
      keyboard: false,
      backdrop: 'static'
    }
  ) {
    ||

    while (1) {

      var command = Command .. @wait();
      
      var credentials = {
        username: Username .. @current,
        password: Password .. @current .. obscurePassword
      } .. JSON.stringify;
    
      try {
        var session;
        if (command === 'register') {
          session = api.register(credentials);
        }
        else if (command === 'login') {
          session = api.login(credentials);
        }
        // no error thrown -> we've got a session
        // store credentials for future use:
        localStorage['session_test_app_credentials'] = credentials;
        return session;
      }
      catch (e) {
        ErrorMessage.set(e.message);
        // go round loop again
      }
    }
  }
}


