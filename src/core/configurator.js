/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */


define( function ( require ) {

    require( './lang' );
    var ConfNode = require( './configurator/confnode' ),

    // Constants
        KEY_GAME_ID = '/id',
        KEY_DB_NAME = '/registry/dbName',
        KEY_STORE_NAME = '/registry/storeName',

    // DB opening modes
        DB_READ_ONLY = 0,
        DB_READ_WRITE = 1,

    /* Configurator
     *
     * Loads and stores configuration data. Allows external code to listen for
     * changes in configuration subtrees.
     *
     * In Gladius, a configurator can be obtained in 3 ways.
     */
    Configurator = function( options ) {

        options = options || {};

        // Options
        var configuration           = options.configuration || {},
            debug                   = options.debug || function() {},
            rootConf                = options.rootConf,

        // Instance Variables
            that = this,
            canUseDB = true,

            // Should dbVersion be picked up from default.js too?
            dbVersion               = '0.01',
            dbName                  = '',
            objectStoreName         = '',
            gameId                  = '',

            _injectDB = function( options ) {
                // At the moment, indexedDB.open() fails on locally hosted pages on firefox
                // Use python -m SimpleHTTPServer 8000 or make test
                var dbConsumer = options && options.consumer,
                    req = indexedDB.open( dbName );

                req.onsuccess = function( event ) {
                    dbConsumer( req.result );
                };

                req.onerror = function( event ) {
                    dbConsumer();
                };
            },

            _ensureObjectStore = function( options ) {
                var db = options && options.db,
                    consumer = options && options.consumer;

                if ( !db ) {
                    debug( "Gladius/Configurator-_ensureObjectStore: passed empty db value! Aborting.");
                    return;
                }

                var containsObjectStore = db.objectStoreNames.contains( objectStoreName ),
                    onerror = function( event ) {
                        debug( 'Gladius/Configurator-_ensureObjectStore: encountered error! Aborting.');
                    },

                    createObjectStore = function() {
                        try {
                            var versionRequest = db.setVersion( dbVersion );
                            versionRequest.onerror = onerror;
                            versionRequest.onsuccess = function( event ) {
                                db.createObjectStore( objectStoreName );

                                consumer();
                            };
                        } catch ( e ) {
                            debug( 'Encountered Error: ' + e.toString() );
                        }
                    };

                // If we don't have requisite object store, create it
                if ( containsObjectStore && db.version === dbVersion ) {
                    consumer();
                } else {
                    // Downgrade db version if required
                    if ( db.version === '' ) {
                        createObjectStore();
                    } else {
                        var versionRequest = db.setVersion( '' );
                        versionRequest.onerror = onerror;
                        versionRequest.onsuccess = function( event ) {
                            // Delete object store if it's around
                            if ( containsObjectStore ) {
                                db.deleteObjectStore( objectStoreName );
                            }
                            createObjectStore();
                        };
                    }
                }
            },

            _injectObjectStore = function( options ) {
                var mode = options && options.mode,
                    objectStoreConsumer = options && options.consumer;

                _injectDB( {
                    consumer: function( db ) {
                        _ensureObjectStore( {
                            db: db,
                            consumer: function() {
                                objectStoreConsumer( db.transaction(
                                        [objectStoreName],
                                        mode == DB_READ_ONLY ?  IDBTransaction.READ_ONLY :
                                                                IDBTransaction.READ_WRITE
                                    ).objectStore( objectStoreName )
                                );
                            }
                        });
                    }
                });
            },

            _getStoredJSON = function( options ) {
                var jsonConsumer = options && options.consumer;

                _injectObjectStore( {
                    mode: DB_READ_ONLY,
                    consumer: function( objectStore ) {
                        var onerror = function( event ) {
                            jsonConsumer( {} );
                        };

                        if ( objectStore ) {
                            // Does objectStore have entry for this gameID?
                            var req = objectStore.get( rootConf.get( KEY_GAME_ID ) );
                            req.onsuccess = function( event ) {
                                // Did we find a value?
                                var result = req.result;
                                if ( result ) {
                                    jsonConsumer( JSON.parse( unescape( result ) ) );
                                } else {
                                    onerror();
                                }
                            };

                            // If not, give out empty json
                            req.onerror = onerror;
                        } else {
                            onerror();
                        }
                    }
                });
            },

            _storeJSON = function( options ) {
                var json = options.json,
                    resultConsumer = options && options.consumer;

                _injectObjectStore( {
                    mode: DB_READ_WRITE,
                    consumer: function( objectStore ) {
                        var onerror = function( event ) {
                            resultConsumer( false );
                        };

                        if ( objectStore ) {
                            var req = objectStore.put(
                                escape( JSON.stringify( json ) ),
                                rootConf.get( KEY_GAME_ID )
                            );

                            req.onsuccess = function( event ) {
                                resultConsumer( true );
                            };

                            req.onerror = onerror;
                        } else {
                            onerror();
                        }
                    }
                });
            };

        // Get a value based on a given path
        this.get = function( path ) {
            var resultVal = '',
                targetNode = this.node.traverse( path );

            if ( targetNode !== undefined ) {
                resultVal = targetNode.value;
            }

            return resultVal;
        };

        // Set a value based on a given path
        this.set = function( path, value ) {
            var targetNode = this.node.traverse( path, true );

            targetNode.value = value;
        };

        // Update configuration with given json object
        this.update = function( json ) {
            for ( var key in json ) {
                if ( json.hasOwnProperty( key ) ) {
                    this.set( key, json[key] );
                }
            }
        };

        // Create a new configurator tied to the root node
        this.create = function( options ) {
            options = options || {};
            options.rootConf = options.rootConf || rootConf;
            options.debug = options.debug || debug;
            return new Configurator( options );
        };

        /**
         * Get a new configurator client for a node reachable using the given path.
         * If provided, associate listenerFunc with the newly created configurator client.
         * The listener func should accept upto 3 parameters:
         *      path, newVal, oldVal
         *      path -- the relative path to the changed value
         *      newVal -- the value the given path has been set to
         *      oldVal -- the prior value of the given path
         */
        this.getPath = function( path, listenerFunc ) {
            var targetNode = this.node.traverse( path, true ),
                resultConf = this.create();

            resultConf.node = targetNode;

            if ( listenerFunc ) {
                targetNode.listeners[resultConf.id] = listenerFunc;
            }

            return resultConf;
        };

        // Remove listener currently associated with client.
        this.ignore = function() {
            var curListener = this.node.listeners[this.id];
            if ( curListener ) {
                delete this.node.listeners[this.id];
            }
        };

        // Set listener function for this client. If another listener is
        // associated with this client then that listener is first removed.
        // See getPath() for listenerFunc parameter descriptions.
        this.listen = function( listenerFunc ) {
            if ( listenerFunc ) {
                this.ignore();

                this.node.listeners[this.id] = listenerFunc;
            }
        };

        /**
         * getJSON()
         *
         * Returns a JSON representation of this configurator instance.
         */
        this.getJSON = function() {
            return this.node.getJSON();
        };

        /**
         * clear()
         * Recursively clears all configuration options.
         */
        this.clear = function() {
            this.node.clear();
        };

        /**
         * store( options )
         *
         *  Stores configuration options to local storage.
         *  Accepts an options object with named parameters.
         *
         *  Options:
         *  callback    <function>( configurator )
         *              If a callback is provided then it is called once the
         *              configuration has been stored. The callback function
         *              will be passed the configurator object.
         *
         *  error:      <function>( errorMsg )
         *              If an error was triggered, this function will be called.
         */
        this.store = function( options ) {

            var callback = options && options.callback,
                error = options && options.error,
                targetJSON = {},
                myJSON = this.getJSON(),
                parentPath = this.node.getParentPath(),
                targetStr = null;

            if ( canUseDB ) {
                for ( var jsonKey in myJSON ) {
                    if ( myJSON.hasOwnProperty( jsonKey ) ) {
                        targetJSON[parentPath + jsonKey] = myJSON[jsonKey];
                    }
                }

                // Load existing myJSON and merge/filter
                _getStoredJSON( {
                    consumer: function( json ) {
                        var jsonKeys = Object.keys( json );

                        for ( var i = 0, maxlen = jsonKeys.length; i < maxlen; ++i ) {
                            var loadedJSONKey = jsonKeys[i];
                            if ( loadedJSONKey.indexOf( parentPath ) !== 0 ) {
                                targetJSON[loadedJSONKey] = json[loadedJSONKey];
                            }
                        }

                        // Store
                        _storeJSON( {
                            json: targetJSON,
                            consumer: function( storeResult ) {
                                // Log result of store
                                if ( !storeResult ) {
                                    debug( 'Gladius/Configurator-store: DB write failed, parent path: ' + that.node.getParentPath() + '/' );
                                }

                                if ( callback ) {
                                    callback( that );
                                }
                            }
                        });
                    }
                });
            } else {
                if ( error ) {
                    error( 'Configurator store failed, db not accessible.' );
                }
            }
        };

        /**
         * load( options )
         *
         *  Loads registry from local storage ( IndexedDB ). Accepts an
         *  options object.
         *
         *  Parameters:
         *  callback:   <function>( configurator )
         *              If a callback is provided then it is called once the
         *              configuration has been loaded. The callback will be
         *              passed the configurator object.
         *
         *  error:      <function>( errorMsg )
         *              If an error was triggered, this function will be called.
         *
         *  clear:      <boolean>
         *              If clear is true, this configurator's configuration
         *              options are cleared before new ones are loaded.
         *              If false, contents are not cleared prior and any
         *              colliding configuration options are overwritten,
         *              this is the default.
         *              If the db could not be used, clear is not called.
         */
        this.load = function( options ) {
            var callback = options && options.callback,
                error = options && options.error,
                clear = options && options.clear;

            if ( canUseDB ) {
                if ( clear ) {
                    this.clear();
                }

                _getStoredJSON( {
                    consumer: function( json ) {
                        // Create the parent path
                        var parentPath = that.node.getParentPath(),
                            parentPathLen = parentPath.length;

                        // Find relevant values and set them
                        for ( var jsonKey in json ) {
                            if ( json.hasOwnProperty( jsonKey ) ) {
                                if ( jsonKey.indexOf( parentPath ) === 0 ) {

                                    // Found valid string, set internal value
                                    that.set(
                                        jsonKey.substr(
                                            parentPathLen,
                                            jsonKey.length - parentPathLen
                                        ),
                                        json[ jsonKey ]
                                    );
                                }
                            }
                        }

                        // Call callback if provided
                        if ( callback ) {
                            callback( that );
                        }
                    }
                });
            } else {
                if ( error ) {
                    error( 'Configurator load failed, db not accessible.' );
                }
            }
        };

        // Define read only access
        var defReadOnly = function( name, val ) {
            Object.defineProperty( that, name, {
                get: function() {
                    return val;
                }
            });
        };

        defReadOnly( 'KEY_GAME_ID', KEY_GAME_ID );
        defReadOnly( 'KEY_DB_NAME', KEY_DB_NAME );
        defReadOnly( 'KEY_STORE_NAME', KEY_STORE_NAME );

        this.id = window.guid();

        var isRootConf = false;
        if ( rootConf ) {
            this.node = rootConf.node;
            canUseDB = rootConf.canUseDB;
        } else {
            isRootConf = true;
            rootConf = this;
            this.node = new ConfNode( 'ROOT' );

            // Pick up default.js
            this.update( require( '../config/default' ) );
        }

        // Load incoming configuration
        this.update( configuration );

        // Load user provided values
        dbName = rootConf.get( KEY_DB_NAME );
        objectStoreName = rootConf.get( KEY_STORE_NAME );
        gameId = rootConf.get( KEY_GAME_ID );

        // Can the db be used?
        if ( isRootConf ) {
            if ( !dbName || !objectStoreName || !gameId ) {
                canUseDB = false;
            } else {
                try {
                    window.indexedDB.open( dbName );
                } catch( e ) {
                    canUseDB = false;
                }
            }
        }

        defReadOnly( 'canUseDB', canUseDB );
    };

    // Taken from Mozilla's docs
    // https://developer.mozilla.org/en/IndexedDB/IDBDatabase
    // Taking care of the browser-specific prefixes.
    if ( !window.indexedDB ) {
        if ('webkitIndexedDB' in window) {
           window.indexedDB = window.webkitIndexedDB;
           window.IDBTransaction = window.webkitIDBTransaction;
        } else if ('mozIndexedDB' in window) {
           window.indexedDB = window.mozIndexedDB;
        }
    }

    return Configurator;
});
