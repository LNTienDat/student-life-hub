import release from '../scripts/release-info.cjs';
export default function lifeHubRelease() {
  return {
    name: 'lifehub-release',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ ...release.releaseInfo(), builtAt: new Date().toISOString() }) });
    },
  };
}
