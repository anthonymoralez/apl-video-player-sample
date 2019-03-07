const videoItems = require('./videoData.json');

const videoListLoader = {
  async process(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (!sessionAttributes.hasOwnProperty('videos') || sessionAttributes.videos.length == 0 ) {
      sessionAttributes.videos = videoItems;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
}

const requestInterceptor = {
  async process(handlerInput) {
    const { attributesManager } = handlerInput;
    console.log('RequestInterceptor: pre-processing response');
    console.log(`REQUEST: ${JSON.stringify(handlerInput.requestEnvelope)}`);
  }
};
const responseInterceptor = {
  async process(handlerInput) {
    const {
      attributesManager,
      responseBuilder,
    } = handlerInput;
    console.log('Global.ResponseInterceptor: post-processing response');

    const resp = responseBuilder.getResponse();
    if (resp.hasOwnProperty('shouldEndSession')
      && !resp.shouldEndSession
      && !resp.hasOwnProperty('reprompt') ) {
      console.log(`SHOULD END SESSION FALSE AND NO REPROMPT`);
    }
    console.log(`RESPONSE: ${JSON.stringify(resp)}`);
    return resp;
  }
};

module.exports = {
  videoListLoader,
  requestInterceptor,
  responseInterceptor
};
