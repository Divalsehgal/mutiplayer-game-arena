import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { DiagramNodeConfig } from "../diagram.types";
import { MemberList } from "./MemberList";

const RISE_PX = 12;
const DURATION_S = 0.18;

interface DetailPanelProps {
  node: DiagramNodeConfig | null;
  onClose: () => void;
}

export function DetailPanel({ node, onClose }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          role="dialog"
          aria-label={`${node.data.label} details`}
          className="absolute bottom-3 left-3 right-3 z-10 flex max-h-[60%] flex-col rounded-xl border border-border bg-card/75 p-4 shadow-lg backdrop-blur-md sm:right-auto sm:w-full sm:max-w-[360px]"
          initial={{ opacity: 0, y: RISE_PX }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: RISE_PX }}
          transition={{ duration: DURATION_S, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 break-words text-base font-semibold text-foreground">{node.data.label}</h2>
            <button
              type="button"
              aria-label="Close details"
              onClick={onClose}
              className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {node.data.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {node.data.description}
            </p>
          )}
          {node.data.members && <MemberList members={node.data.members} />}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
