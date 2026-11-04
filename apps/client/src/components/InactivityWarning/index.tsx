import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';

interface InactivityWarningProps {
  ttlWarning: number | null;
  onExtend: () => void;
}

export function InactivityWarning({ ttlWarning, onExtend }: InactivityWarningProps) {
  return (
    <AnimatePresence>
      {ttlWarning !== null && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center p-6">
          <motion.div
            role="alertdialog"
            aria-labelledby="inactivity-title"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            className="pointer-events-auto flex w-full max-w-sm flex-col gap-3 rounded-xl bg-raised p-5 shadow-pop"
          >
            <h2 id="inactivity-title" className="text-lg font-semibold">Still there?</h2>
            <p className="text-muted-foreground">
              Room closes in <span className="tabular">{ttlWarning}s</span>.
            </p>
            <Button onClick={onExtend} className="w-full">
              I'm still here
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
