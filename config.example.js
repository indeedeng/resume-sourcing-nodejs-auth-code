const config = {
    resumeSearchURI: 'https://sourcing.indeed.com/api/v1/resumeSearch',
    oauthDiscovery: 'https://secure.indeed.com/.well-known/openid-configuration',
    oauthClientId: '<Your OAuth Client ID>',
    oauthClientSecret: '<Your OAuth Client Secret>',
    oauthRedirectURL: 'http://localhost:3000/oauth-callback',
    sessionSecret: '<Your Random Secret String>'
};

module.exports = config;
  