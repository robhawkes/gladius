/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
 /*global define: false */

define( function ( require ) {

    return function( engine ) {
    
        var Action = engine.base.Resource({
            type: 'Action',
            cache: null
        },
        function( options ) {

            options = options || {};
            options.mask = XXXSHOOTME
            
            source.script = source.script || '';
            //TD: need to test parameter functionality
            source.parameters = source.parameters || [];
            this.blocking = source.blocking || false;
            this.mask = source.mask || 0;

            var _script = new Function( source.parameters, source.script );

            Object.defineProperty( this, 'update', {
                get: function() {
                    return _script;
                }
            });
            
        });
        
        return Action;
        
    };
    
});

