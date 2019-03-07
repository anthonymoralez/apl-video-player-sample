const Alexa = require('ask-sdk');
const {
    CancelAndStopIntentHandler,
    ErrorHandler,
    HelpHandler,
    PauseResumeIntentHandler,
    PlayVideoHandler,
    PreviousNextIntentHandler,
    SessionEndedRequestHandler,
    VideoListHandler
} = require('./lib/handlers');
const {
  videoListLoader,
  requestInterceptor,
  responseInterceptor
} = require('./lib/interceptors');


const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    CancelAndStopIntentHandler,
    PlayVideoHandler,
    PauseResumeIntentHandler,
    PreviousNextIntentHandler,
    SessionEndedRequestHandler,
    VideoListHandler,
    HelpHandler
  )
  .addRequestInterceptors(videoListLoader, requestInterceptor)
  .addResponseInterceptors(responseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
