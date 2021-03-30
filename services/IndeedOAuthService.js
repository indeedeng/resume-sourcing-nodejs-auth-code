const { token } = require('morgan');
const {Issuer, TokenSet, generators} = require('openid-client');

class IndeedOAuthService {
    constructor(config, session) {
        this.config = config;
        this.session = session;
    }

    async getTokenSet(employer) {
        // try to get token set from session state
        let tokenSet = this.session.tokenSet;
        if (!tokenSet) {
            return null;
        }
        
        // hydrate the token set
        tokenSet = new TokenSet(tokenSet);

        // if token set expired or new employer then use Refresh Token
        if (tokenSet.expired() || employer !== this.session.employer) {
            console.info('Using Refresh Token');
            const client = await this.getOAuthClient();
            if (employer) {
                console.info('Getting Refresh Token for %s', employer);
                tokenSet = await client.refresh(tokenSet, {
                    exchangeBody: { employer },
                });      
                this.session.employer = employer;    
            } else {
                tokenSet = await client.refresh(tokenSet);
            }
            this.session.tokenSet = tokenSet;
        }

        return tokenSet;
    }    

    getEmployers() {
        return this.session.claims.employers;
    }

    async getOAuthClient() {
        const issuer = await Issuer.discover(this.config.oauthDiscovery);
        return new issuer.Client({
          client_id: this.config.oauthClientId,
          client_secret: this.config.oauthClientSecret,
          redirect_uris: [this.config.oauthRedirectURL],
          response_types: ['code'],
        });
    }
    
    async getAuthorizeURL(scope) {
        // create code challenge (for PKCE)
        const codeVerifier = generators.codeVerifier();
        const codeChallenge = generators.codeChallenge(codeVerifier);

        // store code verifier in session state
        this.session.oauthCodeVerifier = codeVerifier;
    
        const client = await this.getOAuthClient();
        return client.authorizationUrl({
            scope, 
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',    
        });
    }

    async validateAuthorizationCode(req) {
        const client = await this.getOAuthClient();

        // get OAuth callback parameters including Auth Code, Scope
        const params = client.callbackParams(req);

        // get code verifier from session state
        const codeVerifier = this.session.oauthCodeVerifier;
    
        // validate
        const tokenSet = await client.oauthCallback(
            this.config.oauthRedirectURL, 
            params, 
            {code_verifier: codeVerifier}
        );    

        // store token set (Access Token, Refresh Token, ID Token)
        // in session state
        this.session.tokenSet = tokenSet;
        this.session.claims = tokenSet.claims();
    }
        
}

module.exports = IndeedOAuthService;

