exports.request_handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	if (request.method === 'OPTIONS') {
	  const response = {
        status: '204',
        statusDescription: 'No Content',
        headers: {
            'access-control-allow-origin': [{
                key: 'Access-Control-Allow-Origin',
                value: '*'
            }],
            'access-control-allow-methods': [{
                key: 'Access-Control-Allow-Methods',
                value: 'GET, HEAD, POST'
            }],
            'access-control-max-age': [{
                key: 'Access-Control-Max-Age',
                value: '86400'
            }],
            'access-control-allow-headers': [{
                key: 'Access-Control-Allow-Headers',
                value: 'Content-Type'
            }]
        }
    };
    return callback(null, response);
	}
	request.uri = request.uri.replace(/^\/transformation-service/, "");
	callback(null, request);
};

exports.response_handler = (event, context, callback) => {
  //Get contents of response
  const response = event.Records[0].cf.response;
  const headers = response.headers;
  if ('origin' in event.Records[0].cf.request.headers) {
  //The Request contains the Origin Header - Set CORS headers
  headers['access-control-allow-origin'] = [{key: 'Access-Control-Allow-Origin', value: "*"}];
  headers['access-control-allow-methods'] = [{key: 'Access-Control-Allow-Methods', value: "GET, HEAD, POST"}];
  headers['access-control-max-age'] = [{key: 'Access-Control-Max-Age', value: "86400"}];
  }
  //Return modified response
  callback(null, response);
};
