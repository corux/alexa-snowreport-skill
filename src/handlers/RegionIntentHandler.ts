import { HandlerInput } from "ask-sdk-core";
import { IntentRequest, Response } from "ask-sdk-model";
import { BaseIntentHandler, Bergfex, getReprompt, getSlotId, Intents, transformReport } from "../utils";

@Intents("RegionIntent")
export class RegionIntentHandler extends BaseIntentHandler {
  public async handle(handlerInput: HandlerInput): Promise<Response> {
    const slot = (handlerInput.requestEnvelope.request as IntentRequest).intent.slots.region;
    const regionId = getSlotId(slot);
    const slotValue = slot && slot.value;

    if (!regionId) {
      const slotInfoText = slotValue
        ? `Das Skigebiet ${slotValue} ist nicht in meiner Datenbank`
        : "Ich habe dich nicht verstanden";
      return handlerInput.responseBuilder
        .speak(`${slotInfoText}. Bitte nenne ein anderes Gebiet.`)
        .reprompt(getReprompt())
        .getResponse();
    }

    const bergfex = new Bergfex();
    const report = await bergfex.getSnowReport(regionId);

    const reportText = transformReport(report) || `Der Schneebericht für ${slotValue} ist aktuell nicht verfügbar.`;
    return handlerInput.responseBuilder
      .speak(reportText)
      .withShouldEndSession(true)
      .getResponse();
  }
}
