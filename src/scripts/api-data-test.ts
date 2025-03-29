import apiPrograms from "../../api-programs-response.json" with {type: "json"};

// I don't really know the exact return type of this API, so this script will go through roughly 500 programs and map out the structure, including nested stuff

const programCount = apiPrograms.length;
const propTypes: Record<string, string> = {};
const propCounts: Record<string, number> = {};
const typeMap: Record<string, any> = {};

// Map types widely and count properties
apiPrograms.forEach(program => {
  Object.entries(program).forEach(([key, value]) => {
    propTypes[key] = typeof value;
    propCounts[key] = (propCounts[key] || 0) + 1;
  });
});

// Create type map with the optional properties marked
const optionalProps = Object.keys(propCounts).filter(key => propCounts[key] < programCount);
Object.entries(propTypes).forEach(([key, value]) => {
  typeMap[key] = value + (optionalProps.includes(key) ? "?" : "");
});

console.dir(typeMap, { depth: null });