import { IReport } from "./bergfex";

function getRandomEntry(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getReprompt() {
  const randomRegion = getRandomEntry([
    "Kitzbühel",
    "Axamer Lizum",
    "Ischgl",
    "Hintertuxer Gletscher",
    "Silvretta Montafon",
  ]);
  return `Du kannst zum Beispiel nach dem Schneebericht von ${randomRegion} fragen.`;
}

export function transformReport(report: IReport): string {
  if (!report || (isNaN(report.lower) && isNaN(report.upper) && !report.condition)) {
    return null;
  }

  const time = report.time || "Heute";
  const texts = [`Hier ist der Schneebericht für ${report.name} von ${time}.`];
  if (report.upper) {
    if (report.upperNew) {
      texts.push(`Auf dem Berg beträgt die Schneehöhe ${report.upper} cm und es gibt ${report.upperNew} cm Neuschnee.`);
    } else {
      texts.push(`Auf dem Berg beträgt die Schneehöhe ${report.upper} cm.`);
    }
  }
  if (report.lower) {
    if (report.lowerNew) {
      texts.push(`Im Tal beträgt die Schneehöhe ${report.lower} cm und es gibt ${report.lowerNew} cm Neuschnee.`);
    } else {
      texts.push(`Im Tal beträgt die Schneehöhe ${report.lower} cm.`);
    }
  }
  if (report.condition) {
    if (report.conditionPiste) {
      texts.push(`Der Schneezustand ist ${report.condition} und die Piste ist ${report.conditionPiste}.`);
    } else {
      texts.push(`Der Schneezustand ist ${report.condition}.`);
    }
  }
  if (report.openLifts && report.totalLifts) {
    if (report.openLifts === report.totalLifts) {
      if (report.totalLifts === 1) {
        texts.push("Der Lift ist geöffnet.");
      } else {
        texts.push(`Es sind alle ${report.totalLifts} Lifte geöffnet.`);
      }
    } else if (report.openLifts === 0) {
      texts.push("Es sind keine Lifte geöffnet");
    } else {
      texts.push(`Es sind ${report.openLifts} von ${report.totalLifts} Lifte geöffnet.`);
    }
  }
  if (report.avalanche) {
    texts.push(`Die aktuelle Lawinenwarnstufe ist ${report.avalanche}.`);
  }

  return texts.join(" ");
}
