/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global gladius: false, document: false, window: false, module: false, start,
  test: false, expect: false, ok: false, notEqual: false, stop, QUnit: false */

(function() {

    var engine = null;

    module( 'logic/action-list-service', {
        setup: function () {
            stop();

            gladius.create({
                  debug: true,
                  services: {
                    actionListService: 'logic/action-list/service'
                  }
              }, function( instance ) {       
                  engine = instance;
                  start();
            });
        },

        teardown: function () {
            engine = null;
        }
    });

    test( 'Service Construction', function() {
        expect( 2 );
        ok( engine.actionListService, 'action-list service instantiation' );

        ok( engine.actionListService.component.actionList, 
            'action list prototype exists' );
    });

    test( 'Action and ActionList construction', function() {
        expect( 2 );

        var al = new engine.actionListService.component.ActionList();
        notEqual(al, null, "action list constructed");

        engine.actionListService.resource.Action( {
          source: "assets/test-action.json",
          onsuccess: function (instance) {
            notEqual(instance, null, "action list constructed");            
          }  
        } );
    });

}());
