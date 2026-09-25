import type { DiagramMember, DiagramMemberKind } from "../diagram.types";

const KIND_LABELS: Record<DiagramMemberKind, string> = {
  component: "Components",
  hook: "Hooks",
  class: "Classes",
  method: "Methods",
  function: "Functions",
  const: "Constants",
  route: "HTTP routes",
  listens: "Socket events handled",
  emits: "Socket events emitted",
};

const KIND_ORDER = Object.keys(KIND_LABELS) as DiagramMemberKind[];

export function MemberList({ members }: { members: DiagramMember[] }) {
  if (members.length === 0) {
    return <p className="mt-3 text-xs text-muted-foreground">No exports.</p>;
  }

  return (
    <div className="mt-3 min-h-0 space-y-3 overflow-y-auto pr-1">
      {KIND_ORDER.map((kind) => {
        const group = members.filter((member) => member.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind}>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {KIND_LABELS[kind]} · {group.length}
            </h3>
            <ul className="space-y-0.5 font-mono text-xs">
              {group.map((member) => (
                <li key={member.name} className="break-words text-foreground">
                  {member.name}
                  {member.signature && (
                    <span className="text-muted-foreground">{member.signature}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
