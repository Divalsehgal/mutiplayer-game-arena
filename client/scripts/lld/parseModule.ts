import ts from "typescript";
import type { LldMember as DiagramMember } from "./types";

const MAX_SIGNATURE = 90;
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const SOCKET_LISTEN = new Set(["on", "once"]);

export interface ParsedModule {
  /** Import specifiers with runtime effect (type-only imports are skipped). */
  imports: string[];
  members: DiagramMember[];
  lines: number;
}

const isExported = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

const truncate = (text: string) => {
  const flat = text.replace(/\s+/g, " ");
  return flat.length > MAX_SIGNATURE ? `${flat.slice(0, MAX_SIGNATURE - 1)}…` : flat;
};

function signatureOf(fn: ts.SignatureDeclarationBase, source: ts.SourceFile) {
  const params = fn.parameters.map((p) => p.getText(source)).join(", ");
  const returns = fn.type ? `: ${fn.type.getText(source)}` : "";
  return truncate(`(${params})${returns}`);
}

function functionKind(name: string, isTsx: boolean): DiagramMember["kind"] {
  if (/^use[A-Z]/.test(name)) return "hook";
  if (isTsx && /^[A-Z]/.test(name)) return "component";
  return "function";
}

const stringArg = (call: ts.CallExpression) => {
  const [first] = call.arguments;
  return first && ts.isStringLiteralLike(first) ? first.text : undefined;
};

export function parseModule(fileName: string, text: string): ParsedModule {
  const isTsx = fileName.endsWith(".tsx");
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const imports: string[] = [];
  const members: DiagramMember[] = [];
  const seen = new Set<string>();
  const add = (member: DiagramMember) => {
    const key = `${member.kind}:${member.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    members.push(member);
  };

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly) {
      imports.push((statement.moduleSpecifier as ts.StringLiteral).text);
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && !statement.isTypeOnly) {
      imports.push((statement.moduleSpecifier as ts.StringLiteral).text);
    } else if (ts.isFunctionDeclaration(statement) && isExported(statement)) {
      const name = statement.name?.text ?? "default";
      add({ kind: functionKind(name, isTsx), name, signature: signatureOf(statement, source) });
    } else if (ts.isClassDeclaration(statement) && isExported(statement)) {
      const className = statement.name?.text ?? "default";
      add({ kind: "class", name: className });
      for (const member of statement.members) {
        const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
        const isPrivate = (modifiers ?? []).some(
          (m) => m.kind === ts.SyntaxKind.PrivateKeyword,
        );
        if (ts.isMethodDeclaration(member) && !isPrivate && member.name) {
          add({
            kind: "method",
            name: `${className}.${member.name.getText(source)}`,
            signature: signatureOf(member, source),
          });
        }
      }
    } else if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const decl of statement.declarationList.declarations) {
        const name = decl.name.getText(source);
        const init = decl.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          add({ kind: functionKind(name, isTsx), name, signature: signatureOf(init, source) });
        } else {
          add({ kind: "const", name });
        }
      }
    }
  }

  // Walk the whole tree for lazy imports, socket events and Express routes.
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const arg = stringArg(node);
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword && arg) {
        imports.push(arg);
      } else if (arg && ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text;
        if (SOCKET_LISTEN.has(method)) add({ kind: "listens", name: arg });
        else if (method === "emit") add({ kind: "emits", name: arg });
        else if (HTTP_METHODS.has(method) && arg.startsWith("/")) {
          add({ kind: "route", name: `${method.toUpperCase()} ${arg}` });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return { imports, members, lines: text.split("\n").length };
}
