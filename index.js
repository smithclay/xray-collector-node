
// Miniumum aws-sdk version: 2.7.15
const moment = require('moment');
const xrayClient = require('./lib/xray-client');
const Insights = require('./lib/insights');
const { log } = require('./lib/utils');

const insightsClient = new Insights({
    accountId: process.env.NEWRELIC_ACCOUNT_ID,
    insertKey: process.env.INSIGHTS_INSERT_KEY
});

const COLLECTION_INTERVAL_MINS = process.env.COLLECTION_INTERVAL_MINS || 5; 

exports.handler = function (event, context, callback) {
    const now = moment().toDate();
    const fiveminsago = moment().subtract(COLLECTION_INTERVAL_MINS, 'minutes').toDate();

    if (process.env.DEBUG_ENV) {
        log('[event]', JSON.stringify(event));
    }

    xrayClient.getTraceIds(fiveminsago, now, function (err, ids) {
        if (err) {
            return callback(err, null);
        }
        xrayClient.convertTracesToEvents(ids, function(err, events) {
            if (err) {
                return callback(err, null);
            }
            log('creating events: ', events);
            insightsClient.send(events, function(err) {
                if (err) {
                    return callback(err);
                }
                callback(null, `${events.length} POSTed successfully.`);
            });
        });
    });
};
