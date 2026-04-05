import { useState, useEffect } from 'react';
import { Plus, Loader2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { TaskModal } from './TaskModal';
import { ColumnModal } from './ColumnModal';
import { AuthForm } from './AuthForm';
import type { Column, Task } from '../types/kanban';

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(true);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeBoard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (event === 'SIGNED_OUT') {
          setColumns([]);
          setBoardId(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initializeBoard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      let { data: boards } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!boards) {
        const { data: newBoard } = await supabase
          .from('boards')
          .insert({ title: 'My Kanban Board', user_id: user.id })
          .select()
          .single();

        if (newBoard) {
          boards = newBoard;
          await createDefaultColumns(newBoard.id);
        }
      }

      if (boards) {
        setBoardId(boards.id);
        await loadColumns(boards.id);
      }
    } catch (error) {
      console.error('Error initializing board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setLoading(true);
    initializeBoard();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setColumns([]);
    setBoardId(null);
  };

  const createDefaultColumns = async (boardId: string) => {
    const defaultColumns = [
      { board_id: boardId, title: 'To Do', position: 0 },
      { board_id: boardId, title: 'In Progress', position: 1 },
      { board_id: boardId, title: 'Done', position: 2 },
    ];

    await supabase.from('columns').insert(defaultColumns);
  };

  const loadColumns = async (boardId: string) => {
    const { data: columnsData } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position');

    if (columnsData) {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('column_id', columnsData.map(c => c.id))
        .order('position');

      const columnsWithTasks: Column[] = columnsData.map(column => ({
        ...column,
        tasks: (tasksData || []).filter(task => task.column_id === column.id),
      }));

      setColumns(columnsWithTasks);
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingTask(null);
    setTaskModalMode('create');
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedColumnId(task.column_id);
    setTaskModalMode('edit');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (title: string, description: string) => {
    if (!selectedColumnId) return;

    try {
      if (taskModalMode === 'edit' && editingTask) {
        await supabase
          .from('tasks')
          .update({ title, description, updated_at: new Date().toISOString() })
          .eq('id', editingTask.id);
      } else {
        const column = columns.find(c => c.id === selectedColumnId);
        const maxPosition = Math.max(...(column?.tasks.map(t => t.position) || [-1]));

        await supabase
          .from('tasks')
          .insert({
            column_id: selectedColumnId,
            title,
            description,
            position: maxPosition + 1,
          });
      }

      if (boardId) {
        await loadColumns(boardId);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      if (boardId) {
        await loadColumns(boardId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddColumn = () => {
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (title: string) => {
    if (!boardId) return;

    try {
      const maxPosition = Math.max(...columns.map(c => c.position), -1);
      await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          title,
          position: maxPosition + 1,
        });

      await loadColumns(boardId);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await supabase.from('columns').delete().eq('id', columnId);
      if (boardId) {
        await loadColumns(boardId);
      }
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedTask || draggedTask.column_id === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    try {
      const targetColumn = columns.find(c => c.id === targetColumnId);
      const maxPosition = Math.max(...(targetColumn?.tasks.map(t => t.position) || [-1]));

      await supabase
        .from('tasks')
        .update({
          column_id: targetColumnId,
          position: maxPosition + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggedTask.id);

      if (boardId) {
        await loadColumns(boardId);
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }

    setDraggedTask(null);
  };

  if (!isAuthenticated && !loading) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
              <p className="text-gray-600 mt-1">Organize your tasks efficiently</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full px-8 py-6">
            <div className="flex gap-6 h-full">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                  onDeleteColumn={handleDeleteColumn}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}

              <button
                onClick={handleAddColumn}
                className="min-w-80 max-w-80 h-full bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-blue-600 group"
              >
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Add Column</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        mode={taskModalMode}
      />

      <ColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onSave={handleSaveColumn}
      />
    </div>
  );
}