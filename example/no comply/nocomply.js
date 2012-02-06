document.addEventListener("DOMContentLoaded", function (e) {

  var canvas = document.getElementById("test-canvas");
  var resources = {};

  var game = function (engine) {
      var space;
      var math = engine.math;

      function colladaLoader(url, onsuccess, onfailure) {
        // XXX figure out why this is necessary
        window.CubicVR = engine.graphics.target.context;

        try {
          var context = engine.graphics.target.context;
          var scene = context.loadCollada(url, "city");
          onsuccess(scene);
        } catch (e) {
          onfailure(e);
        }
      }

      //
      var CubicVR = engine.graphics.target.context;
      CubicVR.setGlobalAmbient([1, 1, 1]);

      //
      var run = function () {

          canvas = engine.graphics.target.element;

      new space.Entity({
                name: 'cube0',
                components: [
                    new engine.core.component.Transform({
                        position: math.Vector3( -50, 8, 35 ),
                        rotation: math.Vector3( 0, 0, 0 ),
                        scale: math.Vector3(1,2.5, 1)
                    }),
                    new engine.graphics.component.Model({
                        mesh: resources.mesh,
                        material: resources.material
                    })
                ]
            })
      
          var camera = new space.Entity({
            name: 'camera',
            components: [
            new engine.core.component.Transform({
              position: math.Vector3(-33, 15, 30)
            }), new engine.graphics.component.Camera({
              active: true,
              width: canvas.width,
              height: canvas.height,
              fov: 60
            })]
          });
          camera.find('Camera').target = math.Vector3(-60, 10, 30);

          var task = new engine.scheduler.Task({
            schedule: {
              phase: engine.scheduler.phases.UPDATE,
            },
            callback: function () {}
          });

          // Start the engine!
          engine.run();
        };

      engine.core.resource.get([{
        type: engine.core.resource.Collada,
        url: "city/intro_city-anim.dae",
        load: colladaLoader,
        onsuccess: function (instance) {
          space = instance.space;
        },
        onfailure: function (error) {
          console.log("error loading collada resource: " + error);
        }
      },
      
      {type: engine.graphics.resource.Mesh,
        url: 'procedural-mesh.js',                          
        load: engine.core.resource.proceduralLoad,
        onsuccess: function( mesh ) {
            resources['mesh'] = mesh;
        },
        onfailure: function( error ) {}
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
      ], {
        oncomplete: run
      });
    };

  gladius.create({
    debug: true,
    services: {
      graphics: {
        src: 'graphics/service',
        options: {
          canvas: canvas
        }
      }
    }
  }, game);

});