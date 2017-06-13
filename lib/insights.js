const { log } = require('./utils');
const https = require('https');

const COLLECTOR_URL = 'insights-collector.newrelic.com';

/**
 * Insights
 * @constructor
 */
function Insights(config) {
    this.accountId = config.accountId;
    this.insertKey = config.insertKey;

    if (!this.accountId) {
        throw new Error('Missing accountId');
    }

    if (!this.insertKey) {
        throw new Error('Missing insertKey');
    }
}

/**
* Send an array of custom events to Insights.
*/
Insights.prototype.send = function(events, insightsCb) {
  var requestOptions = {
    host: COLLECTOR_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Insert-Key': this.insertKey
    },
    method: 'POST',
    port: 443,
    path: `/v1/accounts/${this.accountId}/events`
  };

  var request = https.request(requestOptions, function(resp) {
    resp.setEncoding('utf8');
    var body = '';
    resp.on('data', function(chunk) {
      body += chunk;
    });
    resp.on('end', function() {
      log('insights response: ', body);
      if (resp.statusCode >= 400) {
        return insightsCb(new Error(body));
      }
      insightsCb(null);
    });
  }).on('error', function(error) {
    log(`Got error sending data to insights: ${e.message}`);
    insightsCb(e.message);
  });

  log(`Sending "${JSON.stringify(events)}" to New Relic Insights...`);
  request.write(JSON.stringify(events));
  request.end();
};

module.exports = Insights;