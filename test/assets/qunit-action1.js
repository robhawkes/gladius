return Action({
  mask: 0,
  blocking: true,
  script: function actionScript() {
    ok( true, 'action has run' );
    return true;
  }
})
