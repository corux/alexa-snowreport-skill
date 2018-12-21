import * as program from "commander";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import { Bergfex, IRegion } from "../src/utils";

program
  .option("--file <path>", "Schema file to update.")
  .parse(process.argv);

const file = program.file;
const schema = JSON.parse(fs.readFileSync(file).toString());

const bergfex = new Bergfex();
const countries = bergfex.getCountries().map((country) => country.code);

bergfex.getSkiRegions(...countries).then((result) => {
  const all = result.reduce((a, b) => a.concat(b), [] as IRegion[]);
  const skiRegions = {
    name: "SKI_REGIONS",
    values: all.map((region) => {
      const altNames = region.altNames.filter((item) => item.toUpperCase() !== region.name.toUpperCase());
      return {
        id: region.code,
        name: {
          synonyms: altNames.length > 0 ? region.altNames : undefined,
          value: region.name,
        },
      };
    }),
  };

  skiRegions.values.sort((a, b) => a.id.localeCompare(b.id));
  schema.interactionModel.languageModel.types = [skiRegions];

  const schemaFile = path.join(process.cwd(), file);
  fs.writeFile(schemaFile, JSON.stringify(schema, null, 2), "utf8", (err) => {
    if (err) {
      process.exit(1);
    }
  });
});
