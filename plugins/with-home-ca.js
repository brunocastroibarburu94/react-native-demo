const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const CA_CERT_SOURCE = 'server_CA_cert/root_CA.pem';
const CA_CERT_RESOURCE_NAME = 'root_ca';
const NETWORK_SECURITY_CONFIG_NAME = 'network_security_config';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getNetworkSecurityConfigXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config>
    <domain includeSubdomains="true">home.home.arpa</domain>
    <trust-anchors>
      <certificates src="@raw/${CA_CERT_RESOURCE_NAME}" />
      <certificates src="system" />
    </trust-anchors>
  </domain-config>
</network-security-config>
`;
}

function withHomeCa(config) {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    mainApplication.$['android:networkSecurityConfig'] =
      `@xml/${NETWORK_SECURITY_CONFIG_NAME}`;
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    return config;
  });

  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidMainPath = path.join(projectRoot, 'android', 'app', 'src', 'main');
      const certSourcePath = path.join(projectRoot, CA_CERT_SOURCE);
      const certDestinationPath = path.join(
        androidMainPath,
        'res',
        'raw',
        `${CA_CERT_RESOURCE_NAME}.pem`
      );
      const configDestinationPath = path.join(
        androidMainPath,
        'res',
        'xml',
        `${NETWORK_SECURITY_CONFIG_NAME}.xml`
      );

      if (!fs.existsSync(certSourcePath)) {
        throw new Error(`Missing Android CA certificate: ${certSourcePath}`);
      }

      ensureDir(path.dirname(certDestinationPath));
      ensureDir(path.dirname(configDestinationPath));

      fs.copyFileSync(certSourcePath, certDestinationPath);
      fs.writeFileSync(configDestinationPath, getNetworkSecurityConfigXml());

      return config;
    },
  ]);
}

module.exports = withHomeCa;
