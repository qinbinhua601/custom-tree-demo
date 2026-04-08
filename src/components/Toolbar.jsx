import { useState } from 'react';

export default function Toolbar({ treeRef }) {
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('file');

  const getSelectedId = () => {
    const items = treeRef.current?.getSelectedItems?.();
    if (items && items.length > 0) return items[0].getId();
    return null;
  };

  const handleAdd = () => {
    const parentId = getSelectedId();
    if (!parentId) {
      alert('请先选中一个文件夹节点');
      return;
    }
    const label = newNodeName.trim() || (newNodeType === 'folder' ? '新文件夹' : '新文件');
    treeRef.current?.addNode(parentId, { label, type: newNodeType });
    setNewNodeName('');
  };

  const handleDelete = () => {
    const id = getSelectedId();
    if (!id) {
      alert('请先选中要删除的节点');
      return;
    }
    if (id === 'root') {
      alert('不能删除根节点');
      return;
    }
    treeRef.current?.deleteNode(id);
  };

  const handleRename = () => {
    const id = getSelectedId();
    if (!id) {
      alert('请先选中要重命名的节点');
      return;
    }
    const name = prompt('输入新名称:');
    if (name) {
      treeRef.current?.updateNode(id, { label: name });
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <input
          type="text"
          value={newNodeName}
          onChange={(e) => setNewNodeName(e.target.value)}
          placeholder="节点名称"
          className="toolbar-input"
        />
        <select
          value={newNodeType}
          onChange={(e) => setNewNodeType(e.target.value)}
          className="toolbar-select"
        >
          <option value="file">文件</option>
          <option value="folder">文件夹</option>
        </select>
        <button onClick={handleAdd} className="toolbar-btn">添加子节点</button>
      </div>

      <div className="toolbar-group">
        <button onClick={handleDelete} className="toolbar-btn danger">删除节点</button>
        <button onClick={handleRename} className="toolbar-btn">重命名</button>
      </div>

      <div className="toolbar-group">
        <button onClick={() => treeRef.current?.expandAll()} className="toolbar-btn">全部展开</button>
        <button onClick={() => treeRef.current?.collapseAll()} className="toolbar-btn">全部收起</button>
        <button onClick={() => treeRef.current?.selectAll()} className="toolbar-btn">全选</button>
        <button onClick={() => treeRef.current?.deselectAll()} className="toolbar-btn">取消全选</button>
      </div>
    </div>
  );
}
