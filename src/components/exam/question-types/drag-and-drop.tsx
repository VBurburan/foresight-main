'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Item {
  id: string;
  text: string;
}

interface Category {
  id: string;
  name: string;
  items?: string[];
}

interface Response {
  answer: {
    categories?: Record<string, string[]>;
    order?: string[];
  };
}

interface DragAndDropProps {
  question: {
    id: string;
    options: Item[];
    correct_answer: { categories?: Record<string, string[]>; order?: string[] };
  };
  response: Response | undefined;
  onAnswer: (answer: any) => void;
  showFeedback: boolean;
}

export default function DragAndDrop({
  question,
  response,
  onAnswer,
  showFeedback,
}: DragAndDropProps) {
  const isAnswered = !!response?.answer;
  const correctAnswer = question.correct_answer;

  // For simplicity, treating as category-based drag and drop
  const isCategorized = !!correctAnswer.categories;

  // Build categories from the correct_answer (which groups items by category)
  // The categories object has category names as keys, item ID arrays as values
  const categories: Category[] = isCategorized
    ? Object.entries(correctAnswer.categories || {}).map(([id]) => ({
        id,
        name: id,
        items: [],
      }))
    : [];

  // Also check raw_options for categories list (may have categories not in correct_answer)
  const rawOpts = (question as any).raw_options;
  if (isCategorized && rawOpts?.categories && Array.isArray(rawOpts.categories)) {
    // Use raw category names from the question data (more complete)
    const existingIds = new Set(categories.map((c) => c.id));
    for (const catName of rawOpts.categories as string[]) {
      if (!existingIds.has(catName)) {
        categories.push({ id: catName, name: catName, items: [] });
      }
    }
  }

  const [placedItems, setPlacedItems] = useState<Record<string, string[]>>(
    response?.answer?.categories || {}
  );
  const [draggedItem, setDraggedItem] = useState<{
    itemId: string;
    source: 'available' | string;
  } | null>(null);

  const availableItems = question.options.filter(
    (opt) =>
      !Object.values(placedItems)
        .flat()
        .includes(opt.id)
  );

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    itemId: string,
    source: 'available' | string
  ) => {
    if (isAnswered) return;
    setDraggedItem({ itemId, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = (
    e: React.DragEvent<HTMLDivElement>,
    categoryId: string
  ) => {
    if (!draggedItem || isAnswered) return;
    e.preventDefault();

    const newPlaced = { ...placedItems };
    if (!newPlaced[categoryId]) {
      newPlaced[categoryId] = [];
    }

    // Remove from previous location
    if (draggedItem.source !== 'available') {
      newPlaced[draggedItem.source] = newPlaced[draggedItem.source].filter(
        (id) => id !== draggedItem.itemId
      );
    }

    // Add to new location
    if (!newPlaced[categoryId].includes(draggedItem.itemId)) {
      newPlaced[categoryId].push(draggedItem.itemId);
    }

    setPlacedItems(newPlaced);
    onAnswer({ categories: newPlaced });
    setDraggedItem(null);
  };

  const handleDropOnAvailable = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedItem || draggedItem.source === 'available' || isAnswered) return;
    e.preventDefault();

    const newPlaced = { ...placedItems };
    newPlaced[draggedItem.source] = newPlaced[draggedItem.source].filter(
      (id) => id !== draggedItem.itemId
    );

    setPlacedItems(newPlaced);
    onAnswer({ categories: newPlaced });
    setDraggedItem(null);
  };

  const allPlaced = availableItems.length === 0;

  const isCorrect = isAnswered && JSON.stringify(placedItems) === JSON.stringify(correctAnswer.categories);

  return (
    <div className="space-y-6">
      {/* Available Items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={handleDragOver}
        onDrop={handleDropOnAvailable}
        className="border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[80px] bg-slate-50"
      >
        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Available Items</p>
        <div className="flex flex-wrap gap-2">
          {availableItems.map((item) => (
            <motion.div
              key={item.id}
              draggable={!isAnswered}
              onDragStart={(e) => handleDragStart(e as any, item.id, 'available')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`px-3 py-2 rounded-lg bg-white border-2 border-slate-200 text-sm font-medium cursor-move hover:shadow-md transition-shadow ${
                isAnswered ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {item.text}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Categories */}
      <div className="grid grid-cols-1 gap-4">
        {categories.map((category, catIndex) => {
          const categoryItems = placedItems[category.id] || [];
          const isCorrectCategory =
            showFeedback &&
            categoryItems.length === (correctAnswer.categories![category.id]?.length || 0) &&
            categoryItems.every((id) => correctAnswer.categories![category.id]?.includes(id));

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnCategory(e as any, category.id)}
              className={`border-2 rounded-lg p-4 min-h-[120px] transition-colors ${
                isCorrectCategory
                  ? 'border-green-300 bg-green-50'
                  : showFeedback && categoryItems.length > 0
                    ? 'border-red-300 bg-red-50'
                    : 'border-dashed border-[#E67E22] bg-orange-50'
              }`}
            >
              <p className="text-sm font-semibold text-slate-700 mb-3">{category.name}</p>
              <div className="space-y-2">
                {categoryItems.map((itemId) => {
                  const item = question.options.find((opt) => opt.id === itemId);
                  return (
                    <motion.div
                      key={itemId}
                      draggable={!isAnswered}
                      onDragStart={(e) => handleDragStart(e as any, itemId, category.id)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium cursor-move ${
                        isCorrect
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-white border-2 border-slate-200 hover:shadow-md'
                      } transition-shadow`}
                    >
                      {item?.text}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Placement hint */}
      {!isAnswered && Object.values(placedItems).some(arr => arr.length > 0) && (
        <p className="text-xs text-slate-500">
          {allPlaced ? 'All items placed. Click Next when ready.' : `${availableItems.length} item${availableItems.length !== 1 ? 's' : ''} remaining. Click Next when done.`}
        </p>
      )}

      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${
            isCorrect
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Correct! All items placed in the right categories.' : 'Incorrect. Review the placement of items.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
