import { Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropOverlayProps {
  isVisible: boolean;
}

/**
 * Overlay affiché lorsque l'utilisateur glisse des fichiers sur la page
 */
export function DragDropOverlay({ isVisible }: DragDropOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm pointer-events-none"
        >
          <div className="h-full w-full flex items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl border-4 border-dashed border-primary rounded-2xl bg-card p-12 text-center shadow-2xl"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Upload className="h-20 w-20 mx-auto mb-6 text-primary" />
              </motion.div>
              
              <h3 className="text-3xl font-bold mb-3">
                Déposez vos fichiers ici
              </h3>
              
              <p className="text-lg text-muted-foreground mb-6">
                Relâchez pour uploader vos documents
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  PDF
                </span>
                <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  Word
                </span>
                <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  Excel
                </span>
                <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  PowerPoint
                </span>
                <span className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  Images
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
