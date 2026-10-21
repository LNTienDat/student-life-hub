function corsOrigins(env) {
  const candidates = [env.FRONTEND_URL, env.RENDER_EXTERNAL_URL,
    ...(env.ADDITIONAL_FRONTEND_URLS || '').split(',')].filter(value => value?.trim());
  if (!candidates.length) candidates.push('http://localhost:5173');
  return [...new Set(candidates.map(value => {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash || value.includes('*')
      || (env.NODE_ENV === 'production' && url.protocol !== 'https:')) {
      throw new Error('Frontend origins must be explicit HTTPS origins in production.');
    }
    return url.origin;
  }))];
}
module.exports = { corsOrigins };
