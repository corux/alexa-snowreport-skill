import { Skill, Launch, Intent, SessionEnded } from 'alexa-annotations';
import { ask, say } from 'alexa-response';
import Bergfex from './bergfex';

@Skill
export default class AlexaSnowReportSkill {

  _getRandomEntry(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  _getSlotValue(request, name) {
    try {
      const slot = request.intent.slots[name];
      if (slot.resolutions.resolutionsPerAuthority[0].status.code !== 'ER_SUCCESS_MATCH') {
        return null;
      }

      return slot.resolutions.resolutionsPerAuthority[0].values[0].value;
    } catch (e) {
      return null;
    }
  }

  _getReprompt() {
    const randomRegion = this._getRandomEntry(['Kitzbühel', 'Axamer Lizum', 'Ischgl', 'Hintertuxer Gletscher', 'Silvretta Montafon']);
    return `Du kannst zum Beispiel nach dem Schneebericht von ${randomRegion} fragen.`;
  }

  _transformReport(report) {
    if (report.lower === undefined && report.upper === undefined && report.village == undefined) {
      return;
    }

    const time = report.time || 'Heute';
    const texts = [`Hier ist der Schneebericht für ${report.name} von ${time}.`];
    if (report.upper !== undefined) {
      texts.push(`Auf dem Berg beträgt die Schneehöhe ${report.upper} cm.`);
    }
    if (report.upperNew !== undefined) {
      texts.push(`Es gibt ${report.upperNew} cm Neuschnee.`);
    }
    if (report.lower !== undefined) {
      texts.push(`Im Tal beträgt die Schneehöhe ${report.upper} cm.`);
    }
    if (report.lowerNew !== undefined) {
      texts.push(`Und es gibt ${report.upperNew} cm Neuschnee.`);
    }
    if (report.condition) {
      texts.push(`Der Schneezustand ist mit '${report.condition}' angegeben.`);
    }
    if (report.avalanche) {
      texts.push(`Die aktuelle Lawinenwarnstufe ist '${report.avalanche}'.`);
    }

    return texts.join(' ');
  }

  @Launch
  launch() {
    return ask('Zu welchem Skigebiet möchtest du den Schneebericht abrufen?')
      .reprompt(this._getReprompt());
  }

  @Intent('RegionIntent')
  when({ region }, { request }) {
    const slotValue = this._getSlotValue(request, 'region');
    if (!slotValue || !slotValue.id) {
      return ask(`Das Skigebiet ${region} ist nicht in meiner Datenbank. Bitte nenne ein anderes Gebiet.`)
        .reprompt(this._getReprompt());
    }

    const bergfex = new Bergfex();
    const report = bergfex.getSnowReport(slotValue.id);

    const reportText = this._transformReport(report) || `Der Schneebericht für ${region} ist aktuell nicht verfügbar.`;
    return say(reportText);
  }

  @Intent('AMAZON.HelpIntent')
  help() {
    return ask('Dieser Skill erlaubt dir, den aktuellen Schneebericht zu den Skigebieten in den Alpen abzurufen. Nenne ein Skigebiet um den Schneebericht zu erhalten.')
      .reprompt(this._getReprompt());
  }

  @Intent('AMAZON.CancelIntent', 'AMAZON.StopIntent')
  stop() {
    return say('Bis bald!');
  }

  @SessionEnded
  sessionEnded() {
    // need to handle session ended event to circumvent error
    return {};
  }

}
