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
                    actionList: 'logic/action-list/service'
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

    test( 'Construction', function() {
        expect( 1 );
        ok( engine.actionList, 'action-list service exists' );
    });

}());
