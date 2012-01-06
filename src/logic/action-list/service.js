/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */

define( function ( require ) {

  // XXX why is this long path required, unlike in the graphics service?
  var ActionList = require('logic/action-list/component/action-list');
  var Action = require('logic/action-list/resource/action');
    
	return function( engine ) {

		var ActionListService = engine.base.Service({
			type: 'Logic',
			time: engine.scheduler.simulationTime
		},
		
		function actionListServiceInstanceConstructor( options ) {

			var that = this;

			this.update = function() {			
			};
			
      // load and export our components
      var _components = {
        ActionList : ActionList( engine )
      };

      Object.defineProperty(this, 'component', {
        get : function() {
          return _components;
        }
      });
      
      // load and export our resources
      var _resources = {
        Action: Action( engine, that )
      };
   
      Object.defineProperty( this, "resource", {
        get: function() {
          return _resources;
        }
      });
      
		});

		return ActionListService;
	};

});