
// Miniumum aws-sdk version: 2.7.15
const moment = require('moment');
const xrayClient = require('./lib/xray-client');
const Insights = require('./lib/insights');
const { log } = require('./lib/utils');

const insightsClient = new Insights({
    accountId: process.env.NEWRELIC_ACCOUNT_ID,
    insertKey: process.env.INSIGHTS_INSERT_KEY
});

exports.handler = function (event, context, callback) {
    const now = moment().toDate();
    const fiveminsago = moment().subtract(5, 'hours').toDate();

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
