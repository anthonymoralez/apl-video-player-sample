const listTemplate = require('./listTemplate1.json'); // NOTE: maybe don't use require to read the json. require caches and is synchronous.
const videoPlayer = require('./videoPlayer.json'); // NOTE: maybe don't use require to read the json. require caches and is synchronous.

const VideoListHandler = {
  canHandle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    return requestEnvelope.request.type === 'LaunchRequest' ||
      (requestEnvelope.request.type === 'IntentRequest' && requestEnvelope.request.intent.name === 'MainListIntent')
  },
  async handle(handlerInput) {
    if (supportsAPL(handlerInput)) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const speechText = "Welcome, checkout this list.";
      const repromptText = "Welcome, checkout this list.";
      const response = handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          version: '1.0',
          document: listTemplate,
          datasources: { list: { data: sessionAttributes.videos } }
        })
        .getResponse();
      return response;

    } else {
      const msg = 'This skill requires a device with the ability to play videos.';
      handlerInput.responseBuilder
        .withSimpleCard("APL Example Videos", msg)
        .speak(msg)
        .withShouldEndSession(true);
    }

    return handlerInput.responseBuilder.getResponse();
  }
};

const PreviousNextIntentHandler = {
  canHandle(handlerInput) {
    console.log("PreviousNextIntentHandler");
    const request = handlerInput.requestEnvelope.request
    return isNextIntent(handlerInput) || isPreviousIntent(handlerInput);
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const videoItems = sessionAttributes.videos;
    var ordinal = 1;
    if (sessionAttributes.currentVideo) {
      ordinal = Number.parseInt(sessionAttributes.currentVideo.ordinal, 10);
    }
    console.log(`Current Video Ordinal: ${ordinal}`);
    var index = ordinal - 1
    if (isNextIntent(handlerInput)) {
      index = (index + 1) % videoItems.length;
    } else {
      index = (index + videoItems.length - 1) % videoItems.length;
    }
    ordinal = index + 1;
    console.log(`Next Video Ordinal: ${ordinal}`);

    const video = videoItems[index];
    sessionAttributes.currentVideo = { ordinal, videoId: video.id, playing: true };
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        token: "videoPlayer",
        document: videoPlayer,
        datasources: { video }
      }).getResponse();
  }
}

const PauseResumeIntentHandler = {
  canHandle(handlerInput) {
    console.log("PauseResumeIntentHandler");
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent') ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent');
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (handlerInput.requestEnvelope.request.type === 'IntentRequest') {
      if (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent') {
        console.log("Pause")
        sessionAttributes.currentVideo.playing = false;
      }
      if (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent') {
        console.log("Resume")
        sessionAttributes.currentVideo.playing = true;
      }
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder
      .addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: 'videoPlayer',
        commands: [
          {
            type: "ControlMedia",
            componentId: "videoPlayer",
            command: sessionAttributes.currentVideo.playing ? 'play' : 'pause'
          },
        ]
      }).getResponse();
  }
};

const PlayVideoHandler = {
  canHandle(handlerInput) {
    console.log("PlayVideoHandler");
    return (handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
      && handlerInput.requestEnvelope.request['arguments'].includes('PlayVideo')) ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'PlayVideoIntent');
  },
  async handle(handlerInput) {
    var videoId;
    var ordinal;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (handlerInput.requestEnvelope.request.type === 'IntentRequest') {
      ordinal = getSlotValue('videoNumber', handlerInput.requestEnvelope.request.intent);
      videoId = sessionAttributes.videos[ordinal-1].id;
    } else {
      videoId = handlerInput.requestEnvelope.request.arguments.pop();
      ordinal = sessionAttributes.videos.findIndex( (video) => { return video.id === videoId } ) + 1;
    }
    console.log(`${ordinal}: ${videoId}`);

    const video = sessionAttributes.videos[ordinal-1];
    console.log(`video = ${JSON.stringify(video)}`);
    if (!video.hasOwnProperty('source')) {
      const videoInfo = await getVideoInfo(videoId);
      sessionAttributes.videos[ordinal-1].source = videoInfo.source;
    }
    sessionAttributes.currentVideo = { ordinal, videoId };
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        version: '1.0',
        token: "videoPlayer",
        document: videoPlayer,
        datasources: { video }
      }).getResponse();
  }
}

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .addDirective({
        type: 'Alexa.Presentation.APL.ExecuteCommands',
        token: 'videoPlayer',
        commands: [
          {
            "type": "ControlMedia",
            "componentId": "videoPlayer",
            "command": "pause"
          },
        ]
      }).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const speechText = "I'm sorry, I didn't quite understand that. Please try again."

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput, error) {
    const speechText = "You can select a video by touching the screen or by saying play the fifth video.";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

function isNextIntent(handlerInput) {
  const request = handlerInput.requestEnvelope.request;
  return (request.intent && request.intent.name === 'AMAZON.NextIntent')
    || (request.type === 'Alexa.Presentation.APL.UserEvent' && (request['arguments'].includes('NextVideo')));
}

function isPreviousIntent(handlerInput) {
  const request = handlerInput.requestEnvelope.request;
  return (request.intent && request.intent.name === 'AMAZON.PreviousIntent')
    || (request.type === 'Alexa.Presentation.APL.UserEvent' && (request['arguments'].includes('PreviousVideo')));
}

function supportsAPL(handlerInput) {
  const supportedInterfaces = getSupportedInterfaces(handlerInput);
  console.log(supportedInterfaces);
  return supportedInterfaces && supportedInterfaces['Alexa.Presentation.APL'];
}

function getSlotValue(slotName, currentIntent) {
  return Object.prototype.hasOwnProperty.call(currentIntent, "slots")
    && Object.prototype.hasOwnProperty.call(currentIntent.slots, slotName)
    && Object.prototype.hasOwnProperty.call(currentIntent.slots[slotName], "value")
    && currentIntent.slots[slotName].value;
}

function getSupportedInterfaces(handlerInput) {
  const hasSupportedInterfaces =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces

  if (hasSupportedInterfaces) {
    return handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
  }
  return hasSupportedInterfaces;
}

module.exports = {
  CancelAndStopIntentHandler,
  ErrorHandler,
  HelpHandler,
  PlayVideoHandler,
  PreviousNextIntentHandler,
  PauseResumeIntentHandler,
  SessionEndedRequestHandler,
  VideoListHandler
}
