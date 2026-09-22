const { join } = require('node:path');
const { signAsync } = require('@electron/osx-sign');

module.exports = async function adhocSignMacos(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = join(
    context.appOutDir,
    context.packager.appInfo.productFilename + '.app',
  );

  await signAsync({
    app: appPath,
    identity: '-',
    identityValidation: false,
    platform: 'darwin',
    type: 'distribution',
    version: context.packager.config.electronVersion,
    preAutoEntitlements: false,
    preEmbedProvisioningProfile: false,
    optionsForFile: () => ({
      timestamp: 'none',
      hardenedRuntime: false,
      signatureFlags: [],
    }),
  });
};
