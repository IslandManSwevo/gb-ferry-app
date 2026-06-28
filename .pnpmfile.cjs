/**
 * Strip chromedriver from keycloak-connect's optionalDependencies.
 * chromedriver@146 runs a postinstall binary download that hangs in CI
 * and Railway builds. keycloak-connect only uses it for integration
 * testing — it is never needed at runtime or in this monorepo's test suite.
 */
function readPackage(pkg) {
  if (pkg.name === 'keycloak-connect' && pkg.optionalDependencies?.chromedriver) {
    delete pkg.optionalDependencies.chromedriver;
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
