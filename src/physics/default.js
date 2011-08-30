/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */

define( function( require ) {

  var CubicVR = require( 'CubicVR.js/CubicVR' ),
      lang = require( '../core/lang' );

  function physics( options ) {

    options = options || {};

    this.CubicVR = CubicVR;

  }

  return physics;

});
