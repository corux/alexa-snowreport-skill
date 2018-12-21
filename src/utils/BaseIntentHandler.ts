import { HandlerInput, RequestHandler } from "ask-sdk-core";
import { Response } from "ask-sdk-model";

export function Fallback() {
  return <T extends BaseIntentHandler>(target: new () => T) => {
    target.prototype.isFallback = true;
  };
}

export function Intents(...intents: string[]) {
  return <T extends BaseIntentHandler>(target: new () => T) => {
    target.prototype.intents = intents;
  };
}

export function Request(...types: string[]) {
  return <T extends BaseIntentHandler>(target: new () => T) => {
    target.prototype.types = types;
  };
}

export abstract class BaseIntentHandler implements RequestHandler {
  private readonly types: string[];
  private readonly intents: string[];
  private readonly isFallback: boolean;

  public canHandle(handlerInput: HandlerInput): boolean {
    if (this.isFallback) {
      return true;
    }

    const request = handlerInput.requestEnvelope.request;

    if (this.intents && request.type === "IntentRequest") {
      return this.intents.indexOf(request.intent.name) !== -1;
    }

    return (this.types || []).indexOf(request.type) !== -1;
  }

  public abstract handle(handlerInput: HandlerInput): Promise<Response> | Response;
}
