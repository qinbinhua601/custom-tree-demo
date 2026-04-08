import { useRef, useState, useCallback } from 'react';
import FileTree from './components/Tree';
import Toolbar from './components/Toolbar';
import './App.css';

function App() {
  const treeRef = useRef(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  return (
    <div className="app">
      <h2>Headless Tree 文件树</h2>

      <Toolbar treeRef={treeRef} />

      <FileTree
        ref={treeRef}
        onSelect={(id) => addLog(`选中: ${id}`)}
        onExpand={(id) => addLog(`展开: ${id}`)}
        onDrop={(ids, parentId) => addLog(`拖拽完成: [${ids.join(', ')}] → ${parentId}`)}
        onDelete={(id) => addLog(`删除: ${id}`)}
      />

      {logs.length > 0 && (
        <div className="event-log">
          <h4>事件日志</h4>
          {logs.map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
