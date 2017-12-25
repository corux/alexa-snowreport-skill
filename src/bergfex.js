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
        name: 'Österreich',
        code: 'oesterreich'
      },
      {
        name: 'Deutschland',
        code: 'deutschland'
      },
      {
        name: 'Schweiz',
        code: 'schweiz'
      },
      {
        name: 'Italien',
        code: 'italien'
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
        console.log(`Request: ${url}`);

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
    const url = `https://www.bergfex.de/${skiRegion}/schneebericht/`;
    try {
      const body = await request(url);
      console.log(`Request: ${url}`);

      const $ = cheerio.load(body);
      const items = $('.content dl dt,dd').get();

      function extractData(key, postProcFn) {
        try {
          const dtIndex = items.findIndex(elem => $(elem).text().trim().toUpperCase().indexOf(key.toUpperCase()) !== -1);
          const ddIndex = dtIndex + 1;
          if (ddIndex && ddIndex < items.length) {
            return postProcFn($(items[ddIndex]));
          }
        } catch (e) {
          // invalid value or unable to parse -> treat as non-existent
        }
      }

      const fnText = elem => {
        const text = $(elem).text().trim();
        if (text.toUpperCase().indexOf('Keine Meldung'.toUpperCase()) === -1
          && text !== '-') {
          return text;
        }
      };
      const fnTextFirstLine = elem => fnText(elem).split('\n')[0].trim();
      const fnCm = elem => elem.text().match(/([0-9]+)/)[1].trim();
      const fnCmNew = elem => elem.text().match(/neu[^0-9]*([0-9]+)/)[1].trim();
      const fnName = () => {
        try {
          return $($('h1.has-sup').contents().get().filter(n => n.nodeType === 3)[0]).text()
            .replace(' - ', ' ').trim();
        } catch (e) {}
      };
      const fnDateTime = elem => {
        const text = fnText(elem);
        if (text) {
          const match = text.match(/(^[^,]*)[^\d]*(\d{1,2})\.(\d{1,2})\.,\s*(\d{1,2}):(\d{1,2})/);
          if (match) {
            const weekdays = {
              'Mo': 'Montag',
              'Di': 'Dienstag',
              'Mi': 'Mittwoch',
              'Do': 'Donnerstag',
              'Fr': 'Freitag',
              'Sa': 'Samstag',
              'So': 'Sonntag'
            };
            return `${weekdays[match[1]] || match[1]} <say-as interpret-as="date">????${match[3]}${match[2]}</say-as> ${match[4]}:${match[5]}`;
          }
        }

        return text;
      };

      let lifts = extractData('Offene Lifte', fnTextFirstLine).match('([0-9]+)[^0-9]*([0-9]+)');
      if (lifts && lifts.length === 3) {
        lifts = {
          open: parseInt(lifts[1]),
          total: parseInt(lifts[2])
        };
      } else {
        lifts = {};
      }

      return {
        name: fnName(),
        village: extractData('Ort', fnCm),
        villageNew: extractData('Ort', fnCmNew),
        lower: extractData('Tal', fnCm),
        lowerNew: extractData('Tal', fnCmNew),
        upper: extractData('Berg', fnCm),
        upperNew: extractData('Berg', fnCmNew),
        condition: extractData('Schneezustand', fnText),
        lastSnow: extractData('Letzter Schneefall', fnDateTime),
        avalanche: extractData('Lawinenwarnstufe', fnTextFirstLine),
        time: extractData('Schneebericht', fnDateTime),
        openLifts: lifts.open,
        totalLifts: lifts.total,
        conditionPiste: extractData('Pistenzustand', fnText)
      };
    } catch (e) {
      console.error(e);
      return {};
    }
  }
};
