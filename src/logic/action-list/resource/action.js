/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
 /*global define: false */

define( function ( require ) {

    return function( engine, context ) {
        
        var Action = engine.base.Resource({
            type: 'Action',
            cache: null
        },
        function( source ) {

            source = source || {};

            this._action = new context.Action( source );
        });

        return Action;
    };

});
