const AWS = require('aws-sdk');
const xray = new AWS.XRay({ apiVersion: '2016-04-12' });
const { log } = require('./utils');

const LAMBDA_SERVICE_DOC_ORIGIN = "AWS::Lambda";
const LAMBDA_FN_DOC_ORIGIN = "AWS::Lambda::Function";
const EVENT_NAME = "LambdaTraceEvent";

// Parse metrics from AWS X-Ray Segments
// @returns null|segment
const segmentParser = function(s) {
    try {
        var document = JSON.parse(s.Document);
    } catch (e) {
        log(`Could not parse X-Ray segment document:  "${s.Document}": ${e}`);
        return null;
    }

    // Skip in-progress traces
    if (document.in_progress === true) {
        return null;
    }

    // Only get data from the Lambda function or service.
    if (document.origin === LAMBDA_SERVICE_DOC_ORIGIN || document.origin === LAMBDA_FN_DOC_ORIGIN) {
        var event = {
            // eventType is a required New Relic Insights field
            eventType: EVENT_NAME,
            origin: document.origin,
            docName: document.name,
            traceId: document.trace_id,
            duration: document.end_time - document.start_time
        };
        
        // Capture function init time, if exists.
        if (document.origin === LAMBDA_FN_DOC_ORIGIN) {
            if (document.subsegments) {
                document.subsegments.forEach(function(ss) {
                    if (ss.name === "Initialization") {
                        event.initialization = ss.end_time - ss.start_time;
                    }
                });
            } else {
                event.initialization = 0;
            }
        }

        if (document.aws.function_arn) {
            event.function_arn = document.aws.function_arn;
        }
        return event;
    }
    return null;
}

// Get AWS X-Ray Traces for a time window
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/XRay.html#getTraceSummaries-property
exports.getTraceIds = function (start, end, cb) {

    var params = {
        EndTime: end,
        StartTime: start,
        //FilterExpression: `service(id(name: "${LAMBDA_FUNCTION_NAME}", type: "AWS::Lambda"))`,
        //NextToken: 'STRING_VALUE',
        Sampling: false,
    };

    xray.getTraceSummaries(params, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        if (process.env.DEBUG_ENV) {
            log(JSON.stringify(data.TraceSummaries));
        }

        // TODO: Sample all error and slow traces

        var traceIds = data.TraceSummaries.map((d) => { return d.Id })
        cb(null, traceIds);
    });
};

// Fetch AWS X-Ray detailed trace information
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/XRay.html#batchGetTraces-property
exports.convertTracesToEvents = function (ids, cb) {
    log(`[xray-collector] fetching ${ids.length} traces...`);
    
    // Can only fetch 5 at a time...
    var params = {
        TraceIds: ids.length > 5 ? ids.slice(0, 5) : ids
    };
    xray.batchGetTraces(params, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        var metrics = [];
        data.Traces.forEach(function(t) {
            t.Segments.forEach(function(s) {
                var segment = segmentParser(s);
                if (segment !== null) {
                    metrics.push(segment);
                }
            });
        });
        cb(null, metrics);
    });
};