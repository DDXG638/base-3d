/**
 * 命令模式撤销/重做管理器。
 * 每个编辑器操作（位移/旋转/缩放/添加/删除）封装为 Command，
 * execute 执行操作，undo 撤销操作。
 */

export interface EditorCommand {
  execute(): void;
  undo(): void;
}

class UndoManager {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];

  /** 执行命令并压入撤销栈，同时清空重做栈 */
  execute(cmd: EditorCommand) {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
  }

  /** 撤销：弹出最近的命令，调用其 undo() */
  undo() {
    const cmd = this.undoStack.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
    }
  }

  /** 重做：弹出最近撤销的命令，调用其 execute() */
  redo() {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
    }
  }

  /** 是否有可撤销的命令 */
  get canUndo() { return this.undoStack.length > 0; }
  /** 是否有可重做的命令 */
  get canRedo() { return this.redoStack.length > 0; }
}

export const undoManager = new UndoManager();
