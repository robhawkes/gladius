/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */

define( function ( require ) {

	return function( engine ) {

		var math = engine.math;
		var Component = require( 'base/component' );
		
		/*
		 * The algorithm below is based on the discussion of action lists here:
		 * http://sonargame.com/2011/06/05/action-lists/
		 */

		return Component({
			type: 'Logic'
		},
		function( options ) {

			options = options || {};

			var _list = [],
			_blockMask = 0,
			_index = 0;
			
			this.push = function( action ) {
			    _list.push( action );
			};
			
			Object.defineProperty( this, 'length', {
			    get: function() {
			        return _list.length;
			    }
			});
			
			Object.defineProperty( this, 'list', {
			    get: function() {
			        return _list;
			    }
			});

		});

	};

});
