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
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 pointer-events-none">
          <motion.div
            role="alertdialog"
            aria-labelledby="inactivity-title"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="pointer-events-auto bg-card border border-destructive/50 p-5 rounded-2xl flex flex-col gap-3 shadow-2xl max-w-sm w-full"
          >
            <h3 id="inactivity-title" className="text-lg font-semibold">Still there?</h3>
            <p className="text-sm text-muted-foreground">
              This room will close in {ttlWarning}s because nothing has happened for a while.
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
