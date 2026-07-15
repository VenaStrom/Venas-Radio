import { isArr, isObj, isSet } from "@/types";
import fs from "node:fs";

const cacheDir = "scripts/.cache";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;
const resultDir = "scripts/.cache/results";
const channelsResultFile = `${resultDir}/channels.json`;
const programsResultFile = `${resultDir}/programs.json`;
const episodesResultFile = `${resultDir}/episodes.json`;
const defaultEpisodeSampleSize = 25;
const defaultEpisodeSeed = 20260416;
const defaultEpisodeDaysBack = 30;

const typeGenOutputDir = "src/types/sr-api";
const typeGenChannelsFile = `${typeGenOutputDir}/channels.d.ts`;
const typeGenProgramsFile = `${typeGenOutputDir}/programs.d.ts`;
const typeGenEpisodesFile = `${typeGenOutputDir}/episodes.d.ts`;

// The Android client is a sibling package in this monorepo, so the same scanner
// feeds both. Each response gets its own package: `Program` has a different shape
// under /programs than under /episodes, and they would collide in one namespace.
const kotlinGenRootDir = "../android/app/src/main/kotlin/se/venastrom/vradio/api/sr";
const kotlinGenBasePackage = "se.venastrom.vradio.api.sr";

// Declared above main()'s call site: main() runs synchronously, so anything it
// reaches must already be initialised.

/** Leaf names the tree uses for numbers. TS collapses these back to `number`. */
const numericLeaves = new Set(["integer", "long", "float", "double"]);

/** Kotlin hard keywords. Soft/modifier keywords are legal identifiers, so they are absent. */
const kotlinHardKeywords = new Set([
  "as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if",
  "in", "interface", "is", "null", "object", "package", "return", "super",
  "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while",
]);

const kotlinLeafTypes: Record<string, string> = {
  string: "String",
  boolean: "Boolean",
  integer: "Int",
  long: "Long",
  float: "Double",
  double: "Double",
};

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);
if (!fs.existsSync(typeGenOutputDir)) fs.mkdirSync(typeGenOutputDir);

const main = async () => {
  const testDataObj = {
    stringProp: "string",
    numberProp: 123,
    booleanProp: true,
    undefinedProp: undefined,
    arrayOfStrings: ["a", "b", "c"],
    arrayOfNumbers: [1, 2, 3],
    arrayOfBooleans: [true, false],
    arrayOfObjects: [
      { nestedString: "nested", nestedNumber: 456 },
      { nestedString: "nested2", nestedNumber: 789 },
      { nestedString: "nested2", nestedNumber: 789, optional: true },
    ],
  };
  const { arrayOfStrings: _ignoredArrayOfStrings, ...testDataObjWithoutArrayOfStrings } = testDataObj;
  const testDataArray = [
    JSON.parse(JSON.stringify(testDataObj)),
    JSON.parse(JSON.stringify(testDataObjWithoutArrayOfStrings)),
  ];

  const testTypeTree = parseTypeOfTree(testDataObj);
  const testTypeTree2 = parseTypeOfTree(testDataArray);
  generateTSFiles(testTypeTree, `${typeGenOutputDir}/test-object.d.ts`, "TestObject");
  generateTSFiles(testTypeTree2, `${typeGenOutputDir}/test-array.d.ts`, "TestArray");

  const rawChannels = await fetchChannels();
  const channelProps = parseTypeOfTree(rawChannels);
  fs.writeFileSync(channelsResultFile, JSON.stringify(channelProps, null, 2));
  generateTSFiles(channelProps, typeGenChannelsFile, "SR_Channels_Response");
  generateKotlin(channelProps, "channels", "ChannelsResponse");
  console.info("Channels done");

  const rawPrograms = await fetchPrograms();
  const programProps = parseTypeOfTree(rawPrograms);
  fs.writeFileSync(programsResultFile, JSON.stringify(programProps, null, 2));
  generateTSFiles(programProps, typeGenProgramsFile, "SR_Programs_Response");
  generateKotlin(programProps, "programs", "ProgramsResponse");
  console.info("Programs done");

  const programIDs = (rawPrograms.programs as { id: number }[]).map(p => p.id);

  const rawEpisodes = await fetchEpisodesForSampledPrograms(programIDs);
  const episodeProps = parseTypeOfTree(rawEpisodes);
  fs.writeFileSync(episodesResultFile, JSON.stringify(episodeProps, null, 2));
  // Episodes are fetched per program, so the tree is an array of responses;
  // the merged first element is the shape of a single response.
  const episodeTree = Array.isArray(episodeProps) && typeof episodeProps[0] === "object"
    ? episodeProps[0]
    : episodeProps;
  generateTSFiles(episodeTree, typeGenEpisodesFile, "SR_Episodes_Response");
  generateKotlin(episodeTree, "episodes", "EpisodesResponse");
  console.info("Episodes done");

  // Make index file in types/api that exports all generated types
  const indexContent = `export type * from "./channels";\nexport type * from "./programs";\nexport type * from "./programs-single";\nexport type * from "./episodes";`;
  fs.writeFileSync(`${typeGenOutputDir}/index.d.ts`, indexContent);
};

main()
  .catch((e: unknown) => {
    console.error("Failed to run API scanner", e);
    process.exit(1);
  });

/**
 * Writes the Kotlin mirror of a response into the Android client.
 *
 * Skipped rather than fatal when android/ is absent, so the server's own type
 * generation never depends on the client being checked out.
 */
function generateKotlin(tree: TypeTree, module: string, rootName: string) {
  if (!fs.existsSync("../android")) {
    console.warn(`Skipping Kotlin output for ${module}: ../android not found`);
    return;
  }
  const outputFile = `${kotlinGenRootDir}/${module}/${rootName}.kt`;
  generateKotlinFile(tree, outputFile, `${kotlinGenBasePackage}.${module}`, rootName);
  console.info(`Kotlin written to ${outputFile}`);
}

type Leaf = Set<string>; // All possible primitive types at a leaf node
type TypeTree = Leaf | TypeTree[] | { [key: string]: TypeTree };

function parseTypeOfTree(value: Record<string, unknown> | Record<string, unknown>[]): TypeTree {

  const expanded = expandTree(value as TypeTree);

  return expanded;

  function expandTree(tree: TypeTree): TypeTree {
    const typeofTree = typeof tree;
    if (typeofTree === "string" || typeofTree === "boolean") {
      return new Set([typeofTree]);
    }
    // TS only has `number`, but Kotlin needs Int vs Long vs Double, and `typeof`
    // cannot tell them apart. Narrow it here; the TS emitter widens it back.
    else if (typeofTree === "number") {
      const num = tree as unknown as number;
      if (!Number.isInteger(num)) return new Set(["float"]);
      if (!Number.isSafeInteger(num)) return new Set(["double"]);
      if (Math.abs(num) > 2147483647) return new Set(["long"]);
      return new Set(["integer"]);
    }
    else if (typeofTree === "undefined") {
      return new Set(["undefined"]);
    }
    else if (isSet(tree)) {
      return tree;
    }
    else if (isArr(tree)) {
      return parseArray(tree);
    }
    else if (isObj(tree)) {
      return parseObject(tree);
    }
    console.warn("Unexpected value type during type tree parsing", { tree, typeofTree });
    return new Set(["unknown"]);
  }

  function parseArray(arr: TypeTree[]): TypeTree {
    if (arr.length === 0) return new Set(["unknown"]);

    const serializeTree = (tree: TypeTree): string => JSON.stringify(tree, (_k: string, val: unknown): unknown => {
      if (isSet(val)) return { __set: Array.from(val).sort() };
      return val;
    });

    const isPlainTreeObject = (tree: TypeTree): tree is Record<string, TypeTree> =>
      isObj(tree) && !isArr(tree) && !isSet(tree);

    const normalizeKey = (key: string): string => key.endsWith("?") ? key.slice(0, -1) : key;

    const unionTypeTrees = (trees: TypeTree[]): TypeTree => {
      const unique = new Map<string, TypeTree>();
      trees.forEach((tree) => unique.set(serializeTree(tree), tree));
      const values = [...unique.values()];
      const concreteValues = values.filter((tree) => {
        if (!isSet(tree)) return true;
        const setValues = [...tree];
        return setValues.some(v => v !== "unknown" && v !== "undefined");
      });
      const mergedValues = concreteValues.length > 0 ? concreteValues : values;

      if (mergedValues.length === 0) return new Set(["unknown"]);
      if (mergedValues.length === 1) {
        const first = mergedValues[0];
        if (!first) throw new Error("Unexpected empty union type tree");
        return first;
      }

      if (mergedValues.every(isSet)) {
        const merged = new Set<string>();
        mergedValues.forEach((setVal) => (setVal as Set<string>).forEach(v => merged.add(v)));
        return merged;
      }

      if (mergedValues.every(isArr)) {
        const merged: TypeTree[] = [];
        const seen = new Set<string>();
        mergedValues.forEach((arrVal) => (arrVal as TypeTree[]).forEach((item) => {
          const key = serializeTree(item);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }));
        if (merged.length > 0 && merged.every(isPlainTreeObject)) {
          return [mergeObjectTrees(merged)];
        }
        return merged.length > 0 ? merged : new Set(["unknown"]);
      }

      if (mergedValues.every(isPlainTreeObject)) {
        return mergeObjectTrees(mergedValues);
      }

      return new Set(["unknown"]);
    };

    const mergeObjectTrees = (objects: Record<string, TypeTree>[]): Record<string, TypeTree> => {
      const merged: Record<string, TypeTree> = {};
      const allKeys = new Set<string>();

      objects.forEach((obj) => Object.keys(obj).forEach((k) => allKeys.add(normalizeKey(k))));

      allKeys.forEach((rawKey) => {
        const valuesForKey: TypeTree[] = [];
        let presentCount = 0;
        let explicitlyOptional = false;

        objects.forEach((obj) => {
          const exactKey = rawKey;
          const optKey = `${rawKey}?`;
          if (Object.prototype.hasOwnProperty.call(obj, exactKey)) {
            const val = obj[exactKey];
            if (!val) throw new Error("Unexpected missing value in object merge");
            valuesForKey.push(val);
            presentCount += 1;
          }
          else if (Object.prototype.hasOwnProperty.call(obj, optKey)) {
            const val = obj[optKey];
            if (!val) throw new Error("Unexpected missing optional value in object merge");
            valuesForKey.push(val);
            presentCount += 1;
            explicitlyOptional = true;
          }
        });

        const isOptional = explicitlyOptional || presentCount < objects.length;
        const mergedValue = unionTypeTrees(valuesForKey);
        merged[isOptional ? `${rawKey}?` : rawKey] = mergedValue;
      });

      return merged;
    };

    const itemTrees = arr.map(item => expandTree(item));
    const uniqueItemTrees = new Set<string>();
    const resultTrees: TypeTree[] = [];

    itemTrees.forEach(tree => {
      const treeStr = serializeTree(tree);
      if (!uniqueItemTrees.has(treeStr)) {
        uniqueItemTrees.add(treeStr);
        resultTrees.push(tree);
      }
    });

    if (resultTrees.length > 0 && resultTrees.every(isPlainTreeObject)) {
      return [mergeObjectTrees(resultTrees)];
    }

    if (resultTrees.length === 1) {
      const first = resultTrees[0];
      if (!first) throw new Error("Unexpected empty array after parsing type tree");
      return [first];
    }
    else {
      return resultTrees;
    }
  }
  function parseObject(obj: Record<string, unknown>): TypeTree {
    const result: Record<string, TypeTree> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const hasOptionalMarker = key.endsWith("?");
      const rawKey = hasOptionalMarker ? key.slice(0, -1) : key;
      const expandedVal = expandTree(val as TypeTree);
      if (hasOptionalMarker) {
        // Mark optional properties by including `undefined` in the set of possible types
        if (isSet(expandedVal)) {
          expandedVal.add("undefined");
          result[rawKey] = expandedVal;
        }
        else {
          result[rawKey] = new Set(["undefined", "unknown"]);
        }
      }
      else {
        result[rawKey] = expandedVal;
      }
    });
    return result;
  }
}

function generateTSFiles(typeTree: TypeTree, outputFile: string, typeName: string) {
  const content = `\nexport type ${typeName} = ${generateTSType(typeTree)};\n`;
  fs.writeFileSync(outputFile, content);

  function generateTSType(tree: TypeTree, depth: number = 1): string {
    if (typeof tree !== "object") throw new Error("Unexpected string in type tree");

    // Set of types
    if (isSet(tree)) {
      // The tree narrows numbers so Kotlin can pick Int/Long/Double; TS has only
      // `number`, so widen them back and dedupe.
      const widened = new Set<string>();
      tree.forEach(t => widened.add(numericLeaves.has(t) ? "number" : t));
      return Array.from(widened).join(" | ");
    }
    // Array
    else if (isArr(tree)) {
      if (tree.length === 0) return "unknown[]";

      const itemTypes = new Map<string, string>();
      tree.forEach((item) => {
        const generated = generateTSType(item, depth);
        itemTypes.set(generated, generated);
      });

      const itemType = itemTypes.size === 1
        ? [...itemTypes.values()][0]
        : `(${[...itemTypes.values()].join(" | ")})`;
      if (!itemType) throw new Error("Unexpected empty array item type in type tree");
      return `${itemType}[]`;
    }
    // Else recurse
    else if (isObj(tree)) {
      let result = "{\n";
      Object.entries(tree).forEach(([key, val]) => {
        const hasOptionalMarker = key.endsWith("?");
        const rawKey = hasOptionalMarker ? key.slice(0, -1) : key;
        let gen = generateTSType(val, depth + 1);

        // Mark optional properties when `undefined` appears in the union
        let optional = hasOptionalMarker;
        if (gen.includes("undefined")) {
          optional = true;
          gen = gen.split(" | ").join(" | ") || "unknown";
        }

        // Quote keys that are not valid TS identifiers
        const isValidIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rawKey);
        const printedKey = isValidIdent ? rawKey : `"${rawKey.replace(/"/g, '\\"')}"`;

        result += `${"  ".repeat(depth)}${printedKey}${optional ? "?" : ""}: ${gen};\n`;
      });
      return result + `${"  ".repeat(depth - 1)}}`;
    }
    else {
      console.warn("Unexpected tree node type during TS generation", { tree, depth });
      return "unknown";
    }
  }
}

function pascalCase(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+(.)?/g, (_m, chr: string | undefined) => chr ? chr.toUpperCase() : "")
    .replace(/^(.)/, chr => chr.toUpperCase());
}

/**
 * The SR API uses flat lowercase keys ("broadcastfiles"), which cannot be split
 * into words without a dictionary, so this only strips the plural.
 */
function singularize(value: string): string {
  if (/ies$/i.test(value)) return value.replace(/ies$/i, "y");
  if (/(s|x|z|ch|sh)es$/i.test(value)) return value.replace(/es$/i, "");
  if (/s$/i.test(value) && !/ss$/i.test(value)) return value.slice(0, -1);
  return value;
}

/**
 * Emits kotlinx.serialization data classes for a type tree.
 *
 * Property names mirror the JSON keys verbatim. The API's keys are flat lowercase
 * ("imagetemplate"), and splitting them into camelCase would need a word list, so
 * these stay wire-faithful; map them to nicer domain models by hand.
 *
 * Unlike TS, Kotlin has no anonymous object types, so every nested object is
 * hoisted into its own named data class.
 */
function generateKotlinFile(
  typeTree: TypeTree,
  outputFile: string,
  packageName: string,
  rootName: string,
) {
  const declarations: string[] = [];
  const usedNames = new Set<string>();
  /** "<hint>|<shape>" -> class name, so the same concept emits one class. */
  const classesByShape = new Map<string, string>();
  let usesJsonElement = false;
  let usesSerialName = false;

  const serializeShape = (tree: TypeTree): string => JSON.stringify(tree, (_key: string, val: unknown): unknown => {
    if (isSet(val)) return { __set: [...val].sort() };
    return val;
  });

  const uniqueName = (hint: string): string => {
    const base = pascalCase(hint) || "Node";
    let name = base;
    let suffix = 2;
    while (usedNames.has(name)) name = `${base}${suffix++}`;
    usedNames.add(name);
    return name;
  };

  const safeIdentifier = (key: string): { name: string; serialName: boolean } => {
    const isValid = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
    if (isValid && !kotlinHardKeywords.has(key)) return { name: key, serialName: false };
    // Backticks make almost anything a legal identifier, and the property name
    // still matches the JSON key, so no @SerialName is needed.
    if (!/[.;:/\\[\]<>\n\r]/.test(key)) return { name: `\`${key}\``, serialName: false };
    const sanitized = key.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1");
    return { name: sanitized, serialName: true };
  };

  const leafType = (leaf: Leaf): { type: string; nullable: boolean } => {
    const nullable = leaf.has("undefined");
    const concrete = [...leaf].filter(t => t !== "undefined" && t !== "unknown");

    if (concrete.length === 0) {
      usesJsonElement = true;
      return { type: "JsonElement", nullable: true };
    }
    if (concrete.length === 1) {
      const mapped = kotlinLeafTypes[concrete[0] as string];
      if (mapped) return { type: mapped, nullable };
      usesJsonElement = true;
      return { type: "JsonElement", nullable: true };
    }
    // Several numeric kinds seen across samples: widen to the one that holds all.
    if (concrete.every(t => numericLeaves.has(t))) {
      const type = concrete.some(t => t === "float" || t === "double")
        ? "Double"
        : concrete.includes("long") ? "Long" : "Int";
      return { type, nullable };
    }
    // A genuine union (e.g. string | number). Kotlin has no untagged unions.
    usesJsonElement = true;
    return { type: "JsonElement", nullable: true };
  };

  const typeOf = (tree: TypeTree, hint: string): { type: string; nullable: boolean } => {
    if (isSet(tree)) return leafType(tree);

    if (isArr(tree)) {
      // A single item type means the scanner merged every sample into one shape.
      if (tree.length !== 1) {
        usesJsonElement = true;
        return { type: "List<JsonElement>", nullable: false };
      }
      const item = typeOf(tree[0] as TypeTree, singularize(hint));
      return { type: `List<${item.type}${item.nullable ? "?" : ""}>`, nullable: false };
    }

    if (isObj(tree)) {
      return { type: emitClass(tree, hint), nullable: false };
    }

    usesJsonElement = true;
    return { type: "JsonElement", nullable: true };
  };

  function emitClass(obj: Record<string, TypeTree>, hint: string): string {
    // Keyed on hint *and* shape. Hint alone would merge Playlist with
    // Broadcastfile (identical shapes, different concepts); shape alone would
    // give three copies of `program` the first name that claimed it.
    const shapeKey = `${pascalCase(hint)}|${serializeShape(obj)}`;
    const existing = classesByShape.get(shapeKey);
    if (existing) return existing;

    const className = uniqueName(hint);
    // Registered before recursing, so a self-referencing type cannot loop.
    classesByShape.set(shapeKey, className);
    const props: string[] = [];

    Object.entries(obj).forEach(([rawKey, val]) => {
      const optionalKey = rawKey.endsWith("?");
      const key = optionalKey ? rawKey.slice(0, -1) : rawKey;

      const resolved = typeOf(val, key);
      const nullable = optionalKey || resolved.nullable;
      const identifier = safeIdentifier(key);
      if (identifier.serialName) usesSerialName = true;

      if (identifier.serialName) props.push(`  @SerialName("${key.replace(/"/g, "\\\"")}")`);
      // Nullable + a default makes the key optional to kotlinx.serialization.
      props.push(`  val ${identifier.name}: ${resolved.type}${nullable ? "?" : ""}${nullable ? " = null" : ""},`);
    });

    // Pushed after recursing, so nested classes are declared before their parent.
    declarations.push(`@Serializable\ndata class ${className}(\n${props.join("\n")}\n)`);
    return className;
  }

  const root = typeOf(typeTree, rootName);
  const rootIsClass = usedNames.has(pascalCase(rootName));

  const imports = ["import kotlinx.serialization.Serializable"];
  if (usesSerialName) imports.push("import kotlinx.serialization.SerialName");
  if (usesJsonElement) imports.push("import kotlinx.serialization.json.JsonElement");
  imports.sort();

  const alias = rootIsClass ? "" : `\ntypealias ${pascalCase(rootName)} = ${root.type}\n`;

  const content = [
    "// Generated by scripts/api-scanner.ts from live api.sr.se responses.",
    "// Do not edit by hand; run `yarn api:types` in server/ instead.",
    "",
    `package ${packageName}`,
    "",
    ...imports,
    "",
    declarations.join("\n\n"),
    alias,
  ].join("\n");

  fs.mkdirSync(outputFile.slice(0, outputFile.lastIndexOf("/")), { recursive: true });
  fs.writeFileSync(outputFile, `${content}\n`);
}

async function fetchChannels(): Promise<Record<string, unknown>> {
  const cachedChannels = fs.existsSync(channelsCacheFile)
    ? JSON.parse(fs.readFileSync(channelsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedChannels) {
    console.info(`Using cached channels ${channelsCacheFile.length} from`, channelsCacheFile);
    return cachedChannels;
  }

  console.info("Fetching channels from API...");

  const rawChannels = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch channels", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid channels response", data);
        return null;
      }
      return data;
    });

  if (!rawChannels) {
    console.error("Failed to fetch channels", rawChannels);
    throw new Error("Failed to fetch channels");
  }

  fs.writeFileSync(channelsCacheFile, JSON.stringify(rawChannels, null, 2));

  console.info(`Channels (${(rawChannels.channels as unknown[]).length}) saved to ${channelsCacheFile}`);

  return rawChannels;
}

async function fetchPrograms(): Promise<Record<string, unknown>> {
  const cachedPrograms = fs.existsSync(programsCacheFile)
    ? JSON.parse(fs.readFileSync(programsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedPrograms) {
    console.info(`Using cached programs (${programsCacheFile.length}) from`, programsCacheFile);
    return cachedPrograms;
  }

  console.info("Fetching programs from API...");

  const rawPrograms = await fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch programs", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid programs response", data);
        return null;
      }
      return data;
    });

  if (!rawPrograms) {
    console.error("Failed to fetch programs", rawPrograms);
    throw new Error("Failed to fetch programs");
  }

  fs.writeFileSync(programsCacheFile, JSON.stringify(rawPrograms, null, 2));

  console.info(`Programs (${(rawPrograms as { programs: unknown[] })["programs"].length}) saved to ${programsCacheFile}`);

  return rawPrograms;
}

async function fetchEpisodesForSampledPrograms(programIDs: number[]): Promise<Record<string, unknown>[]> {
  const seed = Number(process.env.API_SCANNER_EPISODE_SEED ?? defaultEpisodeSeed);
  const sampleSize = Number(process.env.API_SCANNER_EPISODE_SAMPLE_SIZE ?? defaultEpisodeSampleSize);
  const daysBack = Number(process.env.API_SCANNER_EPISODE_DAYS_BACK ?? defaultEpisodeDaysBack);

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - daysBack);

  const toDateStr = formatDateYYYYMMDD(toDate);
  const fromDateStr = formatDateYYYYMMDD(fromDate);
  const episodesCacheFile = `${cacheDir}/episodes-seed-${seed}-sample-${sampleSize}-from-${fromDateStr}-to-${toDateStr}.json`;

  const cachedEpisodes = fs.existsSync(episodesCacheFile)
    ? JSON.parse(fs.readFileSync(episodesCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedEpisodes) {
    console.info(`Using cached episodes (${cachedEpisodes.length}) from`, episodesCacheFile);
    return cachedEpisodes;
  }

  const sampledProgramIds = sampleWithoutReplacement(programIDs, sampleSize, seed);

  console.info(`Fetching one-month episode payloads for ${sampledProgramIds.length} sampled programs...`, {
    seed,
    sampleSize,
    fromDate: fromDateStr,
    toDate: toDateStr,
  });

  const episodesByProgram: (Record<string, unknown> | null)[] = await Promise.all(
    sampledProgramIds.map(async (programId) => {
      let data: unknown;

      try {
        const response = await fetch(`https://api.sr.se/api/v2/episodes/index?fromdate=${fromDateStr}&todate=${toDateStr}&format=json&pagination=false&audioquality=high&programid=${programId}`);
        data = await response.json() as unknown;
      }
      catch (err: unknown) {
        console.error("Failed to fetch episodes for program", { programId, err });
        return null;
      }

      if (!isObj(data)) {
        console.error("Invalid episodes response structure", { programId, data });
        return null;
      }

      return data;
    }),
  );

  const episodes: Record<string, unknown>[] = [];
  for (const episodesForProgram of episodesByProgram) {
    if (!episodesForProgram) continue;
    episodes.push(episodesForProgram);
  }

  fs.writeFileSync(episodesCacheFile, JSON.stringify(episodes, null, 2));

  console.info(`Episodes (${episodes.length}) saved to ${episodesCacheFile}`);

  return episodes;
}

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sampleWithoutReplacement(values: number[], requestedCount: number, seed: number): number[] {
  const rng = seededRng(seed);
  const sampled = [...values];

  for (let i = sampled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sampled[i], sampled[j]] = [sampled[j] as number, sampled[i] as number];
  }

  return sampled.slice(0, Math.max(0, Math.min(requestedCount, sampled.length)));
}

function seededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}