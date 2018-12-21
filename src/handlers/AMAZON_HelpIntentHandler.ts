import { HandlerInput } from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import { BaseIntentHandler, getReprompt, Intents } from "../utils";

@Intents("AMAZON.HelpIntent")
export class AmazonHelpIntentHandler extends BaseIntentHandler {
  public async handle(handlerInput: HandlerInput): Promise<Response> {
    return handlerInput.responseBuilder
      .speak(`Dieser Skill erlaubt dir, den aktuellen Schneebericht zu den Skigebieten in den Alpen abzurufen.
        Nenne ein Skigebiet um den Bericht zu erhalten.`)
      .reprompt(getReprompt())
      .getResponse();
  }
}
