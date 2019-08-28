import { BaseRequestHandler, IExtendedHandlerInput, Intents } from "@corux/ask-extensions";
import { Response } from "ask-sdk-model";

@Intents("AMAZON.CancelIntent", "AMAZON.StopIntent")
export class AmazonStopIntentHandler extends BaseRequestHandler {
  public handle(handlerInput: IExtendedHandlerInput): Response {
    return handlerInput.getResponseBuilder()
      .speak("Bis bald!")
      .withShouldEndSession(true)
      .getResponse();
  }
}
