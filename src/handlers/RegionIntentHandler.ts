import { BaseRequestHandler, IExtendedHandlerInput, Intents } from "@corux/ask-extensions";
import { IntentRequest, Response } from "ask-sdk-model";
import { Bergfex, getReprompt, getSlotId, transformReport } from "../utils";

@Intents("RegionIntent")
export class RegionIntentHandler extends BaseRequestHandler {
  public async handle(handlerInput: IExtendedHandlerInput): Promise<Response> {
    const slot = (handlerInput.requestEnvelope.request as IntentRequest).intent.slots.region;
    const regionId = getSlotId(slot);
    const slotValue = slot && slot.value;

    if (!regionId) {
      const slotInfoText = slotValue
        ? `Das Skigebiet ${slotValue} ist nicht in meiner Datenbank`
        : "Ich habe dich nicht verstanden";
      return handlerInput.getResponseBuilder()
        .speak(`${slotInfoText}. Bitte nenne ein anderes Gebiet.`)
        .reprompt(getReprompt())
        .getResponse();
    }

    const bergfex = new Bergfex();
    const report = await bergfex.getSnowReport(regionId);

    const reportText = transformReport(report) || `Der Schneebericht für ${slotValue} ist aktuell nicht verfügbar.`;
    return handlerInput.getResponseBuilder()
      .speak(reportText)
      .withShouldEndSession(true)
      .getResponse();
  }
}
