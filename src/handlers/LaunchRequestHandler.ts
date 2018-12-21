import { HandlerInput } from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import { BaseIntentHandler, getReprompt, Request } from "../utils";

@Request("LaunchRequest")
export class LaunchRequestHandler extends BaseIntentHandler {
  public canHandle(handlerInput: HandlerInput): boolean {
    const session = handlerInput.requestEnvelope.session;
    return super.canHandle(handlerInput) || (session && session.new);
  }

  public async handle(handlerInput: HandlerInput): Promise<Response> {
    return handlerInput.responseBuilder
      .speak("Zu welchem Skigebiet möchtest du den Schneebericht?")
      .reprompt(getReprompt())
      .getResponse();
  }
}
