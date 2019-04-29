import { VirtualAlexa } from "virtual-alexa";
import { handler } from "../src";

describe("RegionIntent", () => {
  let alexa: VirtualAlexa;
  beforeEach(() => {
    alexa = VirtualAlexa.Builder()
      .handler(handler)
      .interactionModelFile("models/de-DE.json")
      .create();
  });

  it("should reprompt, if no slot value was given", async () => {
    const result: any = await alexa.intend("RegionIntent");
    expect(result.response.outputSpeech.ssml).toContain("Ich habe dich nicht verstanden");
    expect(result.response.shouldEndSession).toBe(false);
  });

  it("should reprompt, if a region was not found", async () => {
    const result: any = await alexa.intend("RegionIntent", {
      region: "Invalid Region",
    });
    expect(result.response.outputSpeech.ssml).toContain("Das Skigebiet Invalid Region ist nicht in meiner Datenbank.");
    expect(result.response.shouldEndSession).toBe(false);
  });

  it("should answer with snow report", async () => {
    const result: any = await alexa.utter("wieviel Schnee hat es in hintertux");
    expect(result.response.outputSpeech.ssml).toContain("Hier ist der Schneebericht für Hintertuxer Gletscher / Hintertux von");
  });
});
