/**
 * Generates Kotlin data classes from the API contract in src/types/api.ts.
 *
 * This walks the declarations syntactically rather than inferring from live
 * responses, which matters: sampling our own API would make optionality depend
 * on whatever happened to be in the database that day. One null-free sample and
 * a nullable field silently becomes non-null Kotlin that throws in production.
 *
 * Anything the contract expresses that Kotlin cannot is a hard error, not a
 * fallback. A generated client that guesses is worse than one that refuses.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const dtoSourceFile = "src/types/api.ts";
const kotlinOutputFile = "../android/app/src/main/kotlin/se/venastrom/vradio/api/ApiDto.kt";
const kotlinPackage = "se.venastrom.vradio.api";

/** TS `number` carries no width, so the contract uses these aliases as markers. */
const numericMarkers: Record<string, string> = {
  Int: "Int",
  Long: "Long",
  Double: "Double",
};

/** Kotlin hard keywords. Soft/modifier keywords are legal identifiers, so they are absent. */
const kotlinHardKeywords = new Set([
  "as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if",
  "in", "interface", "is", "null", "object", "package", "return", "super",
  "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while",
]);

main();

function main() {
  if (!fs.existsSync("../android")) {
    console.warn("Skipping Kotlin DTOs: ../android not found");
    return;
  }

  const source = ts.createSourceFile(
    dtoSourceFile,
    fs.readFileSync(dtoSourceFile, "utf-8"),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  // Explicitly annotated: TS only treats a const arrow as never-returning (and so
  // narrows the code after a call to it) when the annotation is on the variable.
  const fail: (node: ts.Node, message: string) => never = (node, message) => {
    const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
    throw new Error(`${dtoSourceFile}:${line + 1}:${character + 1}: ${message}`);
  };

  // Every exported alias, so a property can reference another DTO by name.
  const declared = new Map<string, ts.TypeAliasDeclaration>();
  source.forEachChild((node) => {
    if (!ts.isTypeAliasDeclaration(node)) return;
    const exported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    if (exported) declared.set(node.name.text, node);
  });

  const isNullLiteral = (node: ts.TypeNode): boolean =>
    ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword;

  const kotlinType = (node: ts.TypeNode): { type: string; nullable: boolean } => {
    if (ts.isUnionTypeNode(node)) {
      const concrete = node.types.filter(t => !isNullLiteral(t));
      if (concrete.length !== node.types.length - 1 || concrete.length !== 1) {
        fail(node, "only `T | null` unions are supported; Kotlin has no untagged unions");
      }
      const inner = kotlinType(concrete[0] as ts.TypeNode);
      return { type: inner.type, nullable: true };
    }

    if (ts.isArrayTypeNode(node)) {
      const item = kotlinType(node.elementType);
      return { type: `List<${item.type}${item.nullable ? "?" : ""}>`, nullable: false };
    }

    if (ts.isParenthesizedTypeNode(node)) return kotlinType(node.type);

    // if/else rather than a switch on node.kind: SyntaxKind has ~350 members, so
    // an exhaustiveness check over it is pure noise.
    if (node.kind === ts.SyntaxKind.StringKeyword) return { type: "String", nullable: false };
    if (node.kind === ts.SyntaxKind.BooleanKeyword) return { type: "Boolean", nullable: false };

    if (node.kind === ts.SyntaxKind.NumberKeyword) {
      fail(node, "bare `number` is ambiguous in Kotlin; use Int, Long or Double");
    }
    if (ts.isTypeLiteralNode(node)) {
      fail(node, "inline object types are not supported; extract it into its own exported type");
    }

    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText(source);
      const marker = numericMarkers[name];
      if (marker) return { type: marker, nullable: false };
      if (declared.has(name)) return { type: name, nullable: false };
      fail(node, `unknown type \`${name}\`; only Int/Long/Double and exported types in this file are allowed`);
    }

    return fail(node, `unsupported type \`${node.getText(source)}\``);
  };

  const safeIdentifier = (key: string): { name: string; serialName: boolean } => {
    const valid = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
    if (valid && !kotlinHardKeywords.has(key)) return { name: key, serialName: false };
    if (!/[.;:/\\[\]<>\n\r]/.test(key)) return { name: `\`${key}\``, serialName: false };
    return { name: key.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1"), serialName: true };
  };

  /** Carries the contract's own prose across to the client, where it matters most. */
  const kdocFor = (node: ts.Node, indent: string): string => {
    const docs = ts.getJSDocCommentsAndTags(node)
      .flatMap(doc => (typeof doc.comment === "string" ? [doc.comment] : []));
    if (docs.length === 0) return "";
    const lines = docs.join("\n").split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return "";
    if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`;
    return `${indent}/**\n${lines.map(l => `${indent} * ${l}`).join("\n")}\n${indent} */\n`;
  };

  const classes: string[] = [];
  let usesSerialName = false;

  declared.forEach((decl, name) => {
    // The numeric markers are compiler-side only; they are not DTOs.
    if (numericMarkers[name]) return;

    if (!ts.isTypeLiteralNode(decl.type)) {
      fail(decl, `exported type \`${name}\` must be an object literal to become a data class`);
    }

    const props: string[] = [];
    decl.type.members.forEach((member) => {
      if (!ts.isPropertySignature(member) || !member.type) {
        fail(member, "only plain properties are supported");
      }
      const key = member.name.getText(source);
      const resolved = kotlinType(member.type);
      const optional = member.questionToken !== undefined;
      const nullable = optional || resolved.nullable;
      const identifier = safeIdentifier(key);
      if (identifier.serialName) usesSerialName = true;

      props.push(kdocFor(member, "  "));
      if (identifier.serialName) props.push(`  @SerialName("${key}")\n`);
      // A default is only added for `?` (key may be absent). A `T | null` field
      // must still be present in the payload, so it deliberately gets none.
      props.push(`  val ${identifier.name}: ${resolved.type}${nullable ? "?" : ""}${optional ? " = null" : ""},\n`);
    });

    classes.push(`${kdocFor(decl, "")}@Serializable\ndata class ${name}(\n${props.join("")})`);
  });

  const imports = ["import kotlinx.serialization.Serializable"];
  if (usesSerialName) imports.push("import kotlinx.serialization.SerialName");
  imports.sort();

  const content = [
    "// Generated by scripts/kotlin-dto-gen.ts from src/types/api.ts.",
    "// Do not edit by hand; run `yarn api:kotlin` in server/ instead.",
    "",
    `package ${kotlinPackage}`,
    "",
    ...imports,
    "",
    classes.join("\n\n"),
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(kotlinOutputFile), { recursive: true });
  fs.writeFileSync(kotlinOutputFile, content);
  console.info(`Wrote ${declared.size - Object.keys(numericMarkers).length} DTOs to ${kotlinOutputFile}`);
}
