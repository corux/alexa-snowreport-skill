import { HandlerInput } from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import { BaseIntentHandler, Request } from "../utils";

@Request("SessionEndedRequest")
export class SessionEndedHandler extends BaseIntentHandler {
  public handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .getResponse();
  }
}
