document.addEventListener( "DOMContentLoaded", function( e ){

    var printd = function( div, str ) {
        document.getElementById( div ).innerHTML = str + '<p>';
    };
    var cleard = function( div ) {
        document.getElementById( div ).innerHTML = '';
    };

    var canvas = document.getElementById( "test-canvas" );    
    var resources = {};

    var game = function( engine ) {
        var math = engine.math;

        var CubicVR = engine.graphics.target.context;
        
        var MotionService = engine.base.Service({
            type: 'Motion',
            schedule: {
                update: {
                    phase: engine.scheduler.phases.UPDATE
                }
            },
            time: engine.scheduler.simulationTime
        },
        function( options ) {
            var that = this;
            var service = this;
            options = options || {};
            
            this.update = function() {
                var updateEvent = new engine.core.Event({
                    type: 'Update',
                    queue: false,
                    data: {
                        delta: that.time.delta
                    }
                });
                for( var componentType in that.components ) {
                    for( var entityId in that.components[componentType] ) {
                        var component = that.components[componentType][entityId];
                        while( component.handleQueuedEvent() ) {}
                        updateEvent.dispatch( [component] );
                    }
                }
            };
            
            var SimpleMotionComponent = engine.base.Component({
                type: 'Motion',
                depends: ['Transform']
            },
            function( options ) {
                var that = this;
                var _up = options.up || math.Vector3( 0, 1, 0 );    // Up direction vector in absolute space
                var _directions = {
                    forward: options.forward || math.Vector3( 0, 0, -1 ),
                    right: options.right || math.Vector3( 1, 0, 0 ),
                    reverse: options.reverse || math.Vector3( 0, 0, 1 ),
                    left: options.left || math.Vector3( -1, 0, 0 )
                };
                var _move = null;
                var _jump = null;
                
                this.onMoveStart = function( event ) {
                    _move = event.data.direction;
                };
                
                this.onMoveStop = function( event ) {
                    _move = null;
                };
                
                this.onJump = function( event ) {
                    _jump = true;
                };
                
                this.onUpdate = function( event ) {
                    if( _move ) {
                        var transform = this.owner.find( 'Transform' );
                        var direction = math.vector3.multiply( _directions[_move], event.data.delta / 1000 );                        
                        transform.position = math.vector3.add( transform.position, direction );
                    }
                    if( _jump ) {
                        
                    }
                };
                
                // Boilerplate component registration; Lets our service know that we exist and want to do things
                this.onComponentOwnerChanged = function( e ){
                    if( e.data.previous === null && this.owner !== null ) {
                        service.registerComponent( this.owner.id, this );
                    }

                    if( this.owner === null && e.data.previous !== null ) {
                        service.unregisterComponent( e.data.previous.id, this );
                    }
                };

                this.onEntityManagerChanged = function( e ) {
                    if( e.data.previous === null && e.data.current !== null && this.owner !== null ) {
                        service.registerComponent( this.owner.id, this );
                    }

                    if( e.data.previous !== null && e.data.current === null && this.owner !== null ) {
                        service.unregisterComponent( this.owner.id, this );
                    }
                };
            });
            
            var RollingMotionComponent = engine.base.Component({
                type: 'Motion',
                depends: ['Transform']
            },
            function( options ) {
                var that = this;
                var _up = options.up || math.Vector3( 0, 1, 0 );    // Up direction vector in absolute space
                var _directions = {
                    forward: math.Vector3( 0, 0, -1 ),
                    right: math.Vector3( 1, 0, 0 ),
                    reverse: math.Vector3( 0, 0, 1 ),
                    left: math.Vector3( -1, 0, 0 )
                };
                var _rotations = {
                    forward: math.Vector3( -1, 0, 0 ),
                    right: math.Vector3( 0, 0, -1 ),
                    reverse: math.Vector3( 1, 0, 0 ),
                    left: math.Vector3( 0, 0, 1 )
                };
                var _move = null;
                var _jump = null;
                
                this.onMoveStart = function( event ) {
                    _move = event.data.direction;
                };
                
                this.onMoveStop = function( event ) {
                    _move = null;
                };
                
                this.onJump = function( event ) {
                    _jump = true;
                };
                
                this.onUpdate = function( event ) {
                    var transform = this.owner.find( 'Transform' );
                    if( _move ) {
                        var direction = math.vector3.multiply( _directions[_move], event.data.delta / 1000 );
                        transform.position = math.vector3.add( transform.position, direction );
                        
                        var rotation = math.vector3.multiply( _rotations[_move], event.data.delta / 1000 );
                        transform.rotation = math.vector3.add( transform.rotation, rotation );
                    }
                };
                
                // Boilerplate component registration; Lets our service know that we exist and want to do things
                this.onComponentOwnerChanged = function( e ){
                    if( e.data.previous === null && this.owner !== null ) {
                        service.registerComponent( this.owner.id, this );
                    }

                    if( this.owner === null && e.data.previous !== null ) {
                        service.unregisterComponent( e.data.previous.id, this );
                    }
                };

                this.onEntityManagerChanged = function( e ) {
                    if( e.data.previous === null && e.data.current !== null && this.owner !== null ) {
                        service.registerComponent( this.owner.id, this );
                    }

                    if( e.data.previous !== null && e.data.current === null && this.owner !== null ) {
                        service.unregisterComponent( this.owner.id, this );
                    }
                };
            });
            
            var _components = {
                SimpleMotion: SimpleMotionComponent,
                RollingMotion: RollingMotionComponent
            };
            Object.defineProperty( this, 'component', {
                get: function() {
                    return _components;
                }
            });
        });
        engine.motion = new MotionService();

        var run = function() {

            // Make a new space for our entities
            var space = new engine.core.Space();

            canvas = engine.graphics.target.element;

            var player = new space.Entity({
                name: 'player',
                components: [
                             new engine.core.component.Transform({
                                 position: math.Vector3( 0, 0, 0 ),
                                 rotation: math.Vector3( 0, 0, 0 )
                             }),
                             new engine.graphics.component.Model({
                                 mesh: resources.mesh,
                                 material: resources.material
                             }),
                             new engine.input.component.Controller({
                                 onKey: function(e) {
                                     var move = {
                                         A: 'left',
                                         D: 'right',
                                         S: 'reverse',
                                         W: 'forward'
                                     };
                                     var event;
                                     if( this.owner ) {
                                         // If we have an owner, dispatch a game event for it to enjoy
                                         if( move.hasOwnProperty( e.data.code ) ) {
                                             event = new engine.core.Event({
                                                 type: e.data.state === 'down' ? 'MoveStart' : 'MoveStop',
                                                         data: {
                                                             direction: move[e.data.code]
                                                         }
                                             });
                                         } else if( 'SPACE' === e.data.code && 'down' === e.data.state ) {
                                             event = new engine.core.Event({
                                                 type: 'Jump'
                                             });
                                         }
                                         if( event ) {
                                             event.dispatch( [this.owner] );
                                         }
                                     }
                                 }
                             }),
                             // NB: Swap this component with engine.motion.component.RollingMotion() to change
                             // the way the cube moves.
                             new engine.motion.component.SimpleMotion(),
                             ]
            });
            
            var light = new space.Entity({
                parent: player,
                components: [
                             new engine.core.component.Transform({
                                 position: math.Vector3( 0, 0, 2 )
                             }),
                             new engine.graphics.component.Light({
                                 intensity: 1,
                                 radius: 50,
                                 target: player.find( 'Transform' ).position
                             })
                             ]
            });

            var camera = new space.Entity({
                name: 'camera',
                components: [
                             new engine.core.component.Transform({
                                 position: math.Vector3( 0, 3, 5 )
                             }),
                             new engine.graphics.component.Camera({
                                 active: true,
                                 width: canvas.width,
                                 height: canvas.height,
                                 fov: 60
                             }),
                             ]
            });
            camera.find( 'Camera' ).target = player.find( 'Transform' ).position;

            /*
            var task = new engine.scheduler.Task({
                schedule: {
                    phase: engine.scheduler.phases.UPDATE,
                },
                callback: function() {
                    var delta = engine.scheduler.simulationTime.delta/1000;
                }
            });
            */

            // Start the engine!
            engine.run();

        };

        engine.core.resource.get(
                [
                 {
                     type: engine.graphics.resource.Mesh,
                     url: 'procedural-mesh.js',                          
                     load: engine.core.resource.proceduralLoad,
                     onsuccess: function( mesh ) {
                         resources['mesh'] = mesh;
                     },
                     onfailure: function( error ) {
                     }
                 },
                 {
                     type: engine.graphics.resource.Material,
                     url: 'procedural-material.js',
                     load: engine.core.resource.proceduralLoad,
                     onsuccess: function( material ) {
                         resources['material'] = material;
                     },
                     onfailure: function( error ) {
                     }
                 },
                 ],
                 {
                    oncomplete: run
                 }
        );

    };


    gladius.create(
            {
                debug: true,
                services: {
                    graphics: {
                        src: 'graphics/service',
                        options: {
                            canvas: canvas
                        }
                    },
                    input: {
                        src: 'input/service',
                        options: {

                        }
                    },
                    logic: 'logic/game/service'
                }
            },
            game
    );

});
