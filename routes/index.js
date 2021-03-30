var express = require('express');
var router = express.Router();

const config = require('../config');
const CandidateService = require('../services/CandidateService');
const IndeedOAuthService = require('../services/IndeedOAuthService');

/* GET home page. */
router.get('/', async function(req, res) {
  const indeedOAuth = new IndeedOAuthService(config, req.session);

  // get query params
  employer = req.query.employer;
  city = req.query.city;
  keywords = req.query.keywords;

  // try to get token set
  const tokenSet = await indeedOAuth.getTokenSet(employer);
  if (!tokenSet) {
    const authorizeURL = await indeedOAuth.getAuthorizeURL('employer_access offline_access');
    res.redirect(authorizeURL);
  } else {
    console.dir(tokenSet);

    let results, pageError;
    if (keywords) {
      try {
        const candidateService = new CandidateService(config, tokenSet);
        results = await candidateService.findCandidates(employer, city, keywords);
        console.info(JSON.stringify(results, null, 5));
      } catch (ex) {
        console.dir(ex);
        pageError = 'Couldn\'t retrieve a list of candidates. Your account might not be approved.';
      }
    }

    res.render('index', {
      title: 'Find Candidates',
      results,
      pageError,
      employers: indeedOAuth.getEmployers(),
      employer,
      city,
      keywords
    });
  }
});

module.exports = router;
