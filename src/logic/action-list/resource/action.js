/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
 /*global define: false */

define( function ( require ) {

    return function( engine ) {
    
        var Action = engine.base.Resource({
            type: 'Action',
            cache: null
        },
        function( source ) {
            
            source = source || {};
            source.text = source.text || '';
            source.parameters = source.parameters || [];

            var _script = new Function( source.parameters, source.text );
            
            Object.defineProperty( this, 'run', {
                get: function() {
                    return _script;
                }
            });
            
        });
        
        return Action;
        
    };
    
});

