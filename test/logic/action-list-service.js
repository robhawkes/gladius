/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global gladius: false, document: false, window: false, module: false, start,
  test: false, expect: false, ok: false, notEqual: false, stop, QUnit: false,
  asyncTest: false, equal: false, doTest: false */

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

        ok( engine.actionListService.component.ActionList, 
        'action list prototype exists' );
    });

    asyncTest( 'Action and ActionList construction', function() {
        expect( 2 );

        var al = new engine.actionListService.component.ActionList();
        notEqual(al, null, "action list constructed");

        engine.actionListService.resource.Action( {
            source: "assets/test-action.json",
            onsuccess: function (instance) {
                notEqual(instance, null, "action list constructed");
                start();
            }  
        } );
    });

    asyncTest( 'Run an action that finishes', function() {
        expect( 4 );

        var entity = new engine.core.Entity();
        entity.add(new engine.actionListService.component.ActionList());

        var resources = {};

        engine.actionListService.resource.Action({
            source: "assets/qunit-action1.json",
            onsuccess: function( instance ) {
                resources[ 'assets/qunit-action1.json' ] = instance;
                doTest();
            }            
        });

        engine.actionListService.resource.Action( {
            source: "assets/qunit-action2.json",
            onsuccess: function( instance ) {
                resources[ 'assets/qunit-action2.json' ] = instance;
                doTest();
            }
        } );

        var doTest = function() {
            if( Object.keys( resources ).length !== 2 ) {
                return;
            }

            // TD: update this test for multithreaded environments
            var actionList = entity.find( 'Logic' );
            equal(
                    actionList.length,
                    0,
                    'action list is empty'
            );
            actionList.push( resources[ 'assets/quint-action2.json' ] );
            actionList.push( resources[ 'assets/quint-action1.json' ] );
            equal(
                    actionList.length,
                    2,
                    'action list has 2 actions'
            );
        };

    });

    asyncTest( 'Run an action that does not finish', function() {
        expect( 4 );

        var entity = new engine.core.Entity();
        entity.add(new engine.actionListService.component.ActionList());


        engine.actionListService.resource.Action( {
            source: "assets/qunit-action3.json",
            onsuccess: function( instance ) {
                var actionList = entity.find( 'Logic' );
                actionList.counter = 0;
                equal(
                        actionList.length,
                        0,
                        'action list is empty'
                );
                actionList.push( new instance() );
                equal(
                        actionList.length,
                        1,
                        'action list has 1 action'
                );
            }
        } );
    });
    
    // Test that masks work.
    
    // Test that blocking flag works.
    
    // Action environment (can see actionList) is correct.

}());
