const path = require('node:path');

const repository = require('../package.json').repository.url
  .replace(/^https:\/\/github\.com\//, '')
  .replace(/\.git$/, '');
const upstreamRepository = require('../src/shared/upstream/manifest.json').repository;
const channels = {};
for (const channel of ['bw2', 'swsh']) {
  const version = require(path.join(__dirname, '..', 'src', channel, 'package.json')).version;
  channels[channel] = { version, tag: `${channel}-v${version}` };
}

module.exports = { repository, upstreamRepository, channels };
