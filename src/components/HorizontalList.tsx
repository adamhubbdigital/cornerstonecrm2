import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HorizontalListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onItemClick: (item: T) => void;
  emptyMessage?: string;
}

export function HorizontalList<T>({
  items,
  renderItem,
  onItemClick,
  emptyMessage = 'No items found'
}: HorizontalListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto pb-4 space-x-4 snap-x">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex-none w-80 snap-start bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onItemClick(item)}
        >
          <div className="p-6">
            {renderItem(item)}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}