var assert = require( 'chai' ).assert;

var setUpClient = require( '../config/client' );
var setUpService = require( '../config/service' );

require( 'dotenv' ).load( );

const SERVICE_DOMAIN = 'service-test';
const SERVICE_LANE = 'singleton';

const ECHO_DATA = 'echo-data';
const RECEIVE_DATA = 'receive-data';
const RETURN_NULL_RESPONSE_RUNNER = 'return-null-response-runner';
const RETURN_UNDEFINED_RESPONSE_RUNNER = 'return-undefined-response-runner';
const RETURN_NULL_RESPONSE_RESOLVER = 'return-null-response-resolver';
const RETURN_UNDEFINED_RESPONSE_RESOLVER = 'return-undefined-response-resolver';
const NO_RETURN_RESPONSE_RESOLVER = 'no-return-response-resolver';
const NO_RETURN_RESPONSE_RUNNER = 'no-return-response-runner';

const ERROR_NO_ACKNOWLEDGE_EXPLICIT = 'error-no-acknowledge-explicit';
const ERROR_YES_ACKNOWLEDGE_EXPLICIT = 'error-yes-acknowledge-explicit';
const ERROR_YES_ACKNOWLEDGE_IMPLICIT = 'error-yes-acknowledge-implicit';

const THROW_ERROR = 'throw-error';

describe( 'Service', function ( ) {

  var client;
  var service;

  before( function ( ) {
    return setUpClient( ).then( function ( reefClient ) {
      client = reefClient;
      return setUpService( )
    }).then( function ( reefService ) {
      service = reefService;
      return;
    });
  });

  describe( 'Queries', function ( ) {

    it( 'It should return an echo', function ( done ) {
      client.query(SERVICE_DOMAIN, SERVICE_LANE, ECHO_DATA, { data: "data" }).then( function ( response ) {
        console.log( response );
        done(assert.equal( "data", response ));
      }).catch( function ( error ) {
        done( error );
      });
    });

    it( 'Resolver sent a null response', function ( done ) {
      client.query( SERVICE_DOMAIN, SERVICE_LANE, RETURN_NULL_RESPONSE_RESOLVER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });
    });

    it( 'Resolver sent a undefined response', function ( done ) {
      client.query( SERVICE_DOMAIN, SERVICE_LANE, RETURN_UNDEFINED_RESPONSE_RESOLVER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });
    });

    it( 'Resolver do not send a response', function ( done ) {
      client.query( SERVICE_DOMAIN, SERVICE_LANE, NO_RETURN_RESPONSE_RESOLVER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });
    });

  });

  describe( 'Commands', function ( ) {

    it( 'It should return an success true', function ( done ) {
      client.execute( SERVICE_DOMAIN, SERVICE_LANE, RECEIVE_DATA, '' ).then( function ( response ) {
        done(assert.equal( true, response.success ));
      }).catch( function ( error ) {
        done( error );
      });
    });

    it( 'Runner sent a null response', function ( done ) {
      client.execute( SERVICE_DOMAIN, SERVICE_LANE, RETURN_NULL_RESPONSE_RUNNER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });
    });

    it( 'Runner sent a undefined response', function ( done ) {
      client.execute( SERVICE_DOMAIN, SERVICE_LANE, RETURN_UNDEFINED_RESPONSE_RUNNER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });
    });

    it( 'Runner do not send a response', function ( done ) {
      client.execute( SERVICE_DOMAIN, SERVICE_LANE, NO_RETURN_RESPONSE_RUNNER, '' ).then( function ( response ) {
        done(new Error( "Should have sent an error" ));
      }).catch( function ( error ) {
        done(assert.equal( "Empty response", error.message ));
      });

    });
  });

  describe( 'Fire and forgets', function ( ) {
    it( 'Runner no acknowledge implicit', function ( done ) {
      client.fireAndForget( SERVICE_DOMAIN, SERVICE_LANE, ERROR_YES_ACKNOWLEDGE_IMPLICIT, '' ).then( function ( ) {
        setTimeout( function ( ) {
          done( );
        }, 5000);
      }).catch( function ( error ) {
        done( error );
      });
    });

    it( 'Runner no acknowledge explicit', function ( done ) {
      client.fireAndForget( SERVICE_DOMAIN, SERVICE_LANE, ERROR_NO_ACKNOWLEDGE_EXPLICIT, '' ).then( function ( ) {
        setTimeout( function ( ) {
          done( );
        }, 5000);
      }).catch( function ( error ) {
        done( error );
      });
    });

    it( 'Runner yes acknowledge explicit', function ( done ) {
      client.fireAndForget( SERVICE_DOMAIN, SERVICE_LANE, ERROR_YES_ACKNOWLEDGE_EXPLICIT, '' ).then( function ( ) {
        setTimeout( function ( ) {
          done( );
        }, 5000);
      }).catch( function ( error ) {
        done( error );
      });
    });

  });

  describe( 'Error handling (runner/resolver)', function ( ) {
    it( 'Runner throws error and message is recieved', function ( done ) {
      client.execute( SERVICE_DOMAIN, SERVICE_LANE, THROW_ERROR, '' ).then( function ( ) {
        done(new Error( ));
      }).catch( function ( error ) {
        done(assert.equal( "See error", error.message ));
      });
    });

    it( 'Resolver throws error and message is recieved', function ( done ) {
      client.query( SERVICE_DOMAIN, SERVICE_LANE, THROW_ERROR, '' ).then( function ( ) {
        done(new Error( ));
      }).catch( function ( error ) {
        done(assert.equal( "See error", error.message ));
      });
    });

  });

});
