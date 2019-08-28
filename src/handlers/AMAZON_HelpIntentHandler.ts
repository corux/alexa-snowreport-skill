import { BaseRequestHandler, IExtendedHandlerInput, Intents } from "@corux/ask-extensions";
import { Response } from "ask-sdk-model";
import { getReprompt } from "../utils";

@Intents("AMAZON.HelpIntent")
export class AmazonHelpIntentHandler extends BaseRequestHandler {
  public async handle(handlerInput: IExtendedHandlerInput): Promise<Response> {
    return handlerInput.getResponseBuilder()
      .speak(`Dieser Skill erlaubt dir, den aktuellen Schneebericht zu den Skigebieten in den Alpen abzurufen.
        Nenne ein Skigebiet um den Bericht zu erhalten.`)
      .reprompt(getReprompt())
      .getResponse();
  }
}
