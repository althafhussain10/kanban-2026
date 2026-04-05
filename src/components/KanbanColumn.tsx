import { Plus, Trash2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Column, Task } from '../types/kanban';

interface KanbanColumnProps {
  column: Column;
  onAddTask: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
}

export function KanbanColumn({
  column,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onDeleteColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col min-w-80 max-w-80 h-full">
      <div className="flex items-center justify-between mb-4 group">
        <h3 className="font-semibold text-gray-900 text-lg">{column.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
          <button
            onClick={() => onDeleteColumn(column.id)}
            className="p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete column"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.id)}
        className="flex-1 space-y-3 min-h-32 overflow-y-auto"
      >
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      <button
        onClick={() => onAddTask(column.id)}
        className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:bg-white transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Task
      </button>
    </div>
  );
}
