/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */

define( function ( require ) {

	return function( engine ) {

		var ActionListService = engine.base.Service({
			type: 'Logic',
			time: engine.scheduler.simulationTime
		},
		function actionListServiceInstanceConstructor( options ) {

			var that = this;

			this.update = function() {			
			};
  
      // create prototype actionlist objects
      
		});

		return ActionList;

	};

});