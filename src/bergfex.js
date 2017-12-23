// import request from 'request';
import request from 'request-promise-native';
import cheerio from 'cheerio';

export default class Bergfex {
  /**
   * Gets the list of supported countries.
   * Use the code to retrieve available skiing regions.
   */
  getCountries() {
    return [
      {
        name: "Österreich",
        code: "oesterreich"
      },
      {
        name: "Deutschland",
        code: "deutschland"
      },
      {
        name: "Schweiz",
        code: "schweiz"
      },
      {
        name: "Italien",
        code: "italien"
      }
    ];
  }

  _getAlternativeNames(name) {
    const split = name.split(/\s-|\/\s/);
    if (split.length > 1) {
      return split.map(n => n.trim());
    }
    return [];
  }

  _findDuplicates

  /**
   * Gets the list of all available skiing regions for the given countries.
   */
  async getSkiRegions(...countries) {
    let items = [];
    for (let country of countries) {
      const url = `https://www.bergfex.de/${country}/schneewerte/`;
      try {
        const body = await request(url);
        const $ = cheerio.load(body);
        items = items.concat($('.content table').find('.tr0,.tr1').get()
          .map((elem) => {
            const td = $(elem).find('td').get();
            const link = $($(td[0]).find('a').get()[0]);

            const name = $(td[0]).text();
            const code = link.attr('href').match(/^\/([a-z\-_0-9]+)\/schneebericht\//)[1];
            const altNames = this._getAlternativeNames(name);
            if (!altNames.some(n => n.toUpperCase() == code.toUpperCase())) {
              altNames.push(code);
            }

            return {
              name: name,
              code: code,
              country: country,
              altNames: altNames
            };
          }));
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    // find duplicate alternative names
    const duplicates = [];
    const allAltNames = items.map(n => [...new Set((n.altNames.map(m => m.toUpperCase())))])
      .reduce((a, b) => a.concat(b), []);
    allAltNames.sort().forEach((value, index) => {
      if (index && allAltNames[index - 1] === value && !duplicates.some(n => n === value)) {
        duplicates.push(value);
      }
    });

    // remove duplicate alternative names
    for (let entry of items) {
      entry.altNames = entry.altNames
        .filter(value => !duplicates.some(n => n === value.toUpperCase()));
    }

    return items;
  }

  /**
   * Gets the snow report for the given skiing region.
   */
  async getSnowReport(skiRegion) {
    const url = `https://www.bergfex.de/${skiRegion}/schneewerte/`;
    try {
      const body = await request(url);
      const $ = cheerio.load(body);
      const items = $('.content dl dt,dd').get();

      function extractData(key, postProcFn) {
        const dtIndex = items.findIndex(elem => $(elem).text().toUpperCase().contains(key.toUpperCase()));
        const ddIndex = dtIndex + 1;
        if (ddIndex && ddIndex < items.length) {
          try {
            return postProcFn($(arr[ddIndex]));
          } catch (e) {
            // invalid value or unable to parse -> treat as non-existent
            return;
          }
        }

        // key not found
        return;
      }

      const fnText = elem => {
        const text = elem.text();
        if (text.toUpperCase().contains('Keine Meldung'.toUpperCase())) {
          return;
        }
        return text;
      };
      const fnCm = elem => elem.text().match(/([0-9]+)/)[1];
      const fnCmNew = elem => elem.text().match(/neu[^0-9]*([0-9]+)/)[1];
      const fnName = () => {
        try {
          return $($('h1.has-sup').contents().get().filter(n => n.nodeType === 3)[0]).text().trim();
        } catch(e) {
          return;
        }
      };

      return {
        name: fnName(),
        village: extractData('Ort', fnCm),
        villageNew: extractData('Ort', fnCmNew),
        lower: extractData('Tal', fnCm),
        lowerNew: extractData('Tal', fnCmNew),
        upper: extractData('Berg', fnCm),
        upperNew: extractData('Berg', fnCmNew),
        condition: extractData('Schneezustand', fnText),
        lastSnow: extractData('Letzter Schneefall', fnText),
        avalanche: extractData('Lawinenwarnstufe', fnText),
        time: extractData('Schneebericht', fnText)
      }
    } catch (e) {
      console.error(e);
      return {};
    }
  }
};
