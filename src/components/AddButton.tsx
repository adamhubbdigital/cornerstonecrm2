import React, { useState } from 'react';
import { Plus, Building2, Users, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddButtonProps {
  onAddOrganisation: () => void;
  onAddContact: () => void;
  onAddTask: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({
  onAddOrganisation,
  onAddContact,
  onAddTask
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: Building2, label: 'Add Organisation', onClick: onAddOrganisation },
    { icon: Users, label: 'Add Contact', onClick: onAddContact },
    { icon: CheckSquare, label: 'Add Task', onClick: onAddTask }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6f5192] ${
          isOpen
            ? 'bg-gray-100 text-gray-700'
            : 'bg-[#6f5192] text-white hover:bg-[#5d4379]'
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Plus className="h-5 w-5 mr-2" />
            <span>Add</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
            >
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setIsOpen(false);
                        item.onClick();
                      }}
                      className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="h-5 w-5 mr-3 text-gray-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddButton;