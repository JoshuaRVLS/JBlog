"use client";

import { motion, AnimatePresence } from "motion/react";

interface CreateCollectionModalProps {
  show: boolean;
  name: string;
  color: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export default function CreateCollectionModal({
  show,
  name,
  color,
  onNameChange,
  onColorChange,
  onCreate,
  onClose,
}: CreateCollectionModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl p-6 shadow-lg max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">Create Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-12 rounded-lg border border-border"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCreate}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

