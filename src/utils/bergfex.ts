import axios from "axios";
import * as cheerio from "cheerio";

export interface IRegion {
  altNames: string[];
  code: string;
  country: string;
  name: string;
}

export interface IReport {
  name: string;
  village: number;
  villageNew: number;
  lower: number;
  lowerNew: number;
  upper: number;
  upperNew: number;
  condition: string;
  lastSnow: string;
  avalanche: string;
  time: string;
  openLifts: number;
  totalLifts: number;
  conditionPiste: string;
}

export class Bergfex {
  /**
   * Gets the list of supported countries.
   * Use the code to retrieve available skiing regions.
   */
  public getCountries() {
    return [
      {
        code: "oesterreich",
        name: "Österreich",
      },
      {
        code: "deutschland",
        name: "Deutschland",
      },
      {
        code: "schweiz",
        name: "Schweiz",
      },
      {
        code: "italien",
        name: "Italien",
      },
    ];
  }

  /** Gets the list of all available skiing regions for the given countries. */
  public async getSkiRegions(...countries: string[]): Promise<IRegion[]> {
    let items: IRegion[] = [];
    for (const country of countries) {
      const url = `https://www.bergfex.de/${country}/`;
      try {
        console.log(`Request: ${url}`);
        const body = (await axios.get(url, { timeout: 2000 })).data;

        const $ = cheerio.load(body);
        items = items.concat($(".content .section-left .txt_markup li a:first-child").get()
          .map((elem) => {
            const name = $(elem).text();
            const code = $(elem).attr("href").match(/^\/([a-z\-_0-9]+)\//)[1];
            const altNames = this.getAlternativeNames(name);
            altNames.push(code);

            return {
              altNames: this.removeDuplicates(altNames),
              code,
              country,
              name,
            };
          }));
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    // find duplicate alternative names
    const allAltNames = items.map((n) => n.altNames)
      .reduce((a, b) => a.concat(b), [])
      .map((item) => item.toUpperCase());
    const duplicates = this.removeDuplicates(allAltNames
      .filter((elem, index) => index !== allAltNames.indexOf(elem)));

    // remove duplicate alternative names
    for (const entry of items) {
      entry.altNames = entry.altNames
        .filter((value) => !duplicates.some((n) => n === value.toUpperCase()));
    }

    return items;
  }
  /** Gets the snow report for the given skiing region. */
  public async getSnowReport(skiRegion: string): Promise<IReport> {
    const url = `https://www.bergfex.de/${skiRegion}/schneebericht/`;
    try {
      console.log(`Request: ${url}`);
      const body = (await axios.get(url, { timeout: 2000 })).data;

      const $ = cheerio.load(body);

      const extractData = <T>(key: string, postProcFn: ((elem: any) => T)) => {
        const items = $(".content dl dt,dd").get();
        try {
          const dtIndex = items.findIndex((elem) =>
            $(elem).text().trim().toUpperCase().indexOf(key.toUpperCase()) !== -1);
          const ddIndex = dtIndex + 1;
          if (ddIndex && ddIndex < items.length) {
            return postProcFn($(items[ddIndex]));
          }
        } catch (e) {
          // invalid value or unable to parse -> treat as non-existent
        }
      };

      const fnText = (elem) => {
        const text = $(elem).text().trim();
        if (text.toUpperCase().indexOf("Keine Meldung".toUpperCase()) === -1
          && text !== "-") {
          return text;
        }
      };
      const fnTextFirstLine = (elem) => fnText(elem).split("\n")[0].trim();
      const fnCm = (elem) => parseInt(elem.text().match(/([0-9]+)/)[1].trim(), 10);
      const fnCmNew = (elem) => parseInt(elem.text().match(/neu[^0-9]*([0-9]+)/)[1].trim(), 10);
      const fnName = () => {
        try {
          const headerText = $("header h1").contents().get().filter((n) => n.nodeType === 3 && !!n.data.trim());
          return $(headerText).text()
            .replace(" - ", " ").trim();
        } catch (e) {
          // ignore
        }
      };
      const fnDateTime = (elem) => {
        const text = fnText(elem);
        if (text) {
          const match = text.match(/(^[^,]*)[^\d]*(\d{1,2})\.(\d{1,2})\.,\s*(\d{1,2}):(\d{1,2})/);
          if (match) {
            const weekdays = {
              Di: "Dienstag",
              Do: "Donnerstag",
              Fr: "Freitag",
              Mi: "Mittwoch",
              Mo: "Montag",
              Sa: "Samstag",
              So: "Sonntag",
            };
            return `${weekdays[match[1]] || match[1]}
              <say-as interpret-as="date">????${match[3]}${match[2]}</say-as> ${match[4]}:${match[5]}`;
          }
        }

        return text;
      };

      const lifts = extractData("Offene Lifte", fnTextFirstLine).match("([0-9]+)[^0-9]*([0-9]+)");
      let liftsOpen: number;
      let liftsTotal: number;
      if (lifts && lifts.length === 3) {
        liftsOpen = parseInt(lifts[1], 10);
        liftsTotal = parseInt(lifts[2], 10);
      }

      return {
        avalanche: extractData("Lawinenwarnstufe", fnTextFirstLine),
        condition: extractData("Schneezustand", fnText),
        conditionPiste: extractData("Pistenzustand", fnText),
        lastSnow: extractData("Letzter Schneefall", fnDateTime),
        lower: extractData("Tal", fnCm) || extractData("Schneehöhe Ort", fnCm),
        lowerNew: extractData("Tal", fnCmNew) || extractData("Schneehöhe Ort", fnCmNew),
        name: fnName(),
        openLifts: liftsOpen,
        time: extractData("Schneebericht", fnDateTime),
        totalLifts: liftsTotal,
        upper: extractData("Berg", fnCm),
        upperNew: extractData("Berg", fnCmNew),
        village: extractData("Ort", fnCm),
        villageNew: extractData("Ort", fnCmNew),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private removeDuplicates(array: string[]): string[] {
    const upper = array.map((item) => item.toUpperCase());
    return array.filter((elem, index) => index === upper.indexOf(elem.toUpperCase()));
  }

  private getAlternativeNames(name: string): string[] {
    const split = name.split(/\s-|\/\s/);
    if (split.length > 1) {
      return split.map((n) => n.trim());
    }
    return [];
  }
}
