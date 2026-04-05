/*
  # Kanban Board Schema

  ## Overview
  Creates a complete kanban board system with boards, columns, and tasks.
  Implements proper security with Row Level Security policies.

  ## New Tables

  ### `boards`
  Stores kanban board information
  - `id` (uuid, primary key) - Unique board identifier
  - `title` (text) - Board title
  - `created_at` (timestamptz) - Creation timestamp
  - `user_id` (uuid) - Owner of the board

  ### `columns`
  Stores columns within boards
  - `id` (uuid, primary key) - Unique column identifier
  - `board_id` (uuid, foreign key) - Reference to parent board
  - `title` (text) - Column title
  - `position` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### `tasks`
  Stores tasks within columns
  - `id` (uuid, primary key) - Unique task identifier
  - `column_id` (uuid, foreign key) - Reference to parent column
  - `title` (text) - Task title
  - `description` (text) - Task description
  - `position` (integer) - Display order within column
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security
  All tables have RLS enabled with restrictive policies:
  
  #### Boards
  - Authenticated users can view only their own boards
  - Authenticated users can insert boards (automatically set as owner)
  - Authenticated users can update their own boards
  - Authenticated users can delete their own boards
  
  #### Columns
  - Authenticated users can view columns in their boards
  - Authenticated users can insert columns in their boards
  - Authenticated users can update columns in their boards
  - Authenticated users can delete columns in their boards
  
  #### Tasks
  - Authenticated users can view tasks in their board columns
  - Authenticated users can insert tasks in their board columns
  - Authenticated users can update tasks in their board columns
  - Authenticated users can delete tasks in their board columns

  ## Notes
  - All IDs use uuid with automatic generation
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys have CASCADE delete for data consistency
  - Position fields allow flexible ordering of columns and tasks
*/

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view columns in own boards"
  ON columns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert columns in own boards"
  ON columns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update columns in own boards"
  ON columns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete columns in own boards"
  ON columns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = columns.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in own board columns"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in own board columns"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in own board columns"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in own board columns"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      WHERE columns.id = tasks.column_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);