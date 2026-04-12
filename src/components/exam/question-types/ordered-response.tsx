'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, ChevronUp, ChevronDown, Check, X } from 'lucide-react';

interface Item {
  id: string;
  text: string;
}

interface Response {
  answer: string[];
}

interface OrderedResponseProps {
  question: {
    id: string;
    options: Item[];
    correct_answer: { order: string[] };
  };
  response: Response | undefined;
  onAnswer: (order: string[]) => void;
  showFeedback: boolean;
}

function shuffleIds(ids: string[]): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function OrderedResponse({
  question,
  response,
  onAnswer,
  showFeedback,
}: OrderedResponseProps) {
  const isAnswered = !!response?.answer && response.answer.length === question.options.length;
  // Shuffle initial order so items don't start in the correct sequence
  const [order, setOrder] = useState<string[]>(
    response?.answer || shuffleIds(question.options.map((item) => item.id))
  );

  const correctOrder = question.correct_answer.order;
  const isCorrect = isAnswered && JSON.stringify(order) === JSON.stringify(correctOrder);

  const handleMoveUp = (index: number) => {
    if (index === 0 || isAnswered) return;

    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
    onAnswer(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === order.length - 1 || isAnswered) return;

    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrder(newOrder);
    onAnswer(newOrder);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isAnswered) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('dragIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    if (isAnswered) return;
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'), 10);

    if (dragIndex !== dropIndex) {
      const newOrder = [...order];
      const [draggedItem] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);
      setOrder(newOrder);
      onAnswer(newOrder);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-blue-900">Arrange these items in the correct order</p>
      </div>

      <div className="space-y-2">
        {order.map((itemId, index) => {
          const item = question.options.find((opt) => opt.id === itemId);
          const isCorrectPosition = showFeedback && itemId === correctOrder[index];

          return (
            <motion.div
              key={`${itemId}-${index}`}
              draggable={!isAnswered}
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
              onDragOver={handleDragOver as any}
              onDrop={(e) => handleDrop(e as unknown as React.DragEvent<HTMLDivElement>, index)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                isCorrectPosition
                  ? 'border-green-300 bg-green-50'
                  : showFeedback && !isCorrectPosition && isAnswered
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              } ${!isAnswered ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            >
              {/* Drag Handle */}
              {!isAnswered && (
                <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}

              {/* Number Badge */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isCorrectPosition
                    ? 'bg-green-200 text-green-700'
                    : showFeedback && !isCorrectPosition && isAnswered
                      ? 'bg-red-200 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {index + 1}
              </div>

              {/* Item Text */}
              <div className="flex-1">
                <p className="text-slate-900 font-medium">{item?.text}</p>
              </div>

              {/* Up/Down Controls (for accessibility) */}
              {!isAnswered && (
                <div className="flex-shrink-0 flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === order.length - 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              )}

              {/* Feedback Icon */}
              {isAnswered && (
                <div className="flex-shrink-0">
                  {isCorrectPosition ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

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
            {isCorrect
              ? 'Correct! Items are in the right order.'
              : 'Incorrect. Check the order of items.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
