@ = require([
  'mho:std',
  {id: 'sjs:sjcl', name: 'crypto'}
]);


//----------------------------------------------------------------------
// Password helper:

// Create a PBKDF-2 derived password
function derivePasswordForStoring(password_string) {
  var salt = @crypto.random.randomWords(4);
  var pass = @crypto.misc.pbkdf2(password_string, salt, 1000);
  return {
    algorithm: 'PBKDF2-HMAC-SHA256',
    count: 1000,
    salt: @crypto.codec.base64.fromBits(salt),
    pass: @crypto.codec.base64.fromBits(pass)
  };
}


// Verify a password string against a PBKDF-2 derived password
function verifyPassword(password_string, derived) {
  if (derived.algorithm !== 'PBKDF2-HMAC-SHA256')
    throw new Error("unknown password derivation algorithm #{derived.algorithm}");

  var pass = @crypto.codec.base64.fromBits(
    @crypto.misc.pbkdf2(password_string,
                      @crypto.codec.base64.toBits(derived.salt),
                      derived.count));

  return pass === derived.pass;
};


//----------------------------------------------------------------------

// Username -> credentials 'db', to be implemented by a real db. In
// current github conductance, we could e.g. use LocalDB or LevelDB
// (see e.g. https://github.com/onilabs/conductance/blob/master/modules/flux/kv.sjs#L304)
var Users = {};


/**
   @function verifyUser
   @param {String} [username]
   @param {String} [password]
   @summary Verify that the given user exists and the password matches; throw error if not
*/
exports.verifyUser = function(username, password) {
  var record = Users[username];
  if (!record) throw new Error("Unknown user");

  if (!verifyPassword(password, record)) 
    throw new Error("Invalid password");

  return true;
};

/**
   @function registerUser
   @param {String} [username]
   @param {String} [password]
   @summary Register a new user under the given username; throw error if user already exists
*/
exports.registerUser = function(username, password) {
  if (Users[username]) throw new Error("User already exists");

  Users[username] = derivePasswordForStoring(password);

  return true;
};

