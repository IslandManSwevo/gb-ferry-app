try {
  var pkg = require('nest-keycloak-connect');
  console.log('Successfully required nest-keycloak-connect');
  console.log('Exports:', Object.keys(pkg));
} catch (error) {
  console.error('Failed to require nest-keycloak-connect:', error);
  console.log('Require paths:', module.paths);
}
