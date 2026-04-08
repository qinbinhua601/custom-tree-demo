// 模拟树形数据存储
const mockData = {
  root: [
    { id: 'folder-1', label: '项目文档', type: 'folder' },
    { id: 'folder-2', label: '源代码', type: 'folder' },
    { id: 'file-1', label: 'README.md', type: 'file' },
    { id: 'file-2', label: 'package.json', type: 'file' },
  ],
  'folder-1': [
    { id: 'folder-1-1', label: '设计稿', type: 'folder' },
    { id: 'file-1-1', label: '需求文档.docx', type: 'file' },
    { id: 'file-1-2', label: '接口文档.md', type: 'file' },
  ],
  'folder-2': [
    { id: 'folder-2-1', label: 'components', type: 'folder' },
    { id: 'folder-2-2', label: 'utils', type: 'folder' },
    { id: 'file-2-1', label: 'App.jsx', type: 'file' },
    { id: 'file-2-2', label: 'index.js', type: 'file' },
  ],
  'folder-1-1': [
    { id: 'file-1-1-1', label: '首页设计.fig', type: 'file' },
    { id: 'file-1-1-2', label: '组件库.sketch', type: 'file' },
  ],
  'folder-2-1': [
    { id: 'folder-2-1-1', label: 'common', type: 'folder' },
    { id: 'file-2-1-1', label: 'Header.jsx', type: 'file' },
    { id: 'file-2-1-2', label: 'Footer.jsx', type: 'file' },
  ],
  'folder-2-2': [
    { id: 'file-2-2-1', label: 'request.js', type: 'file' },
    { id: 'file-2-2-2', label: 'helpers.js', type: 'file' },
  ],
  'folder-2-1-1': [
    { id: 'file-2-1-1-1', label: 'Button.jsx', type: 'file' },
    { id: 'file-2-1-1-2', label: 'Input.jsx', type: 'file' },
    { id: 'file-2-1-1-3', label: 'Modal.jsx', type: 'file' },
  ],
};

// 节点数据缓存（用于 getItem）
const nodeMap = {};
for (const children of Object.values(mockData)) {
  for (const node of children) {
    nodeMap[node.id] = node;
  }
}
// 根节点
nodeMap['root'] = { id: 'root', label: 'Root', type: 'folder' };

// 模拟网络延迟
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 模拟接口：/api/tree?parentId=xxx
 * parentId 为 null 时返回根节点列表
 * parentId 为文件夹 ID 时返回其直接子节点
 */
export async function fetchChildren(parentId) {
  await delay(300 + Math.random() * 400);
  const key = parentId ?? 'root';
  return mockData[key] || [];
}

/**
 * 获取单个节点数据
 */
export async function fetchItem(itemId) {
  await delay(100);
  return nodeMap[itemId] || null;
}

/**
 * 动态添加节点到 mock 数据（供操作 API 使用）
 */
export function addMockNode(parentId, node) {
  const key = parentId ?? 'root';
  if (!mockData[key]) mockData[key] = [];
  mockData[key].push(node);
  nodeMap[node.id] = node;
}

/**
 * 从 mock 数据中删除节点
 */
export function removeMockNode(nodeId) {
  for (const [key, children] of Object.entries(mockData)) {
    const idx = children.findIndex((n) => n.id === nodeId);
    if (idx !== -1) {
      children.splice(idx, 1);
      break;
    }
  }
  delete nodeMap[nodeId];
  delete mockData[nodeId]; // 同时删除其子节点列表
}

/**
 * 更新节点属性
 */
export function updateMockNode(nodeId, updates) {
  if (nodeMap[nodeId]) {
    Object.assign(nodeMap[nodeId], updates);
  }
}

/**
 * 移动节点：从原父节点移除，添加到新父节点
 */
export function moveMockNode(nodeId, newParentId, index) {
  // 从原位置移除
  for (const children of Object.values(mockData)) {
    const idx = children.findIndex((n) => n.id === nodeId);
    if (idx !== -1) {
      children.splice(idx, 1);
      break;
    }
  }
  // 添加到新位置
  const key = newParentId ?? 'root';
  if (!mockData[key]) mockData[key] = [];
  if (typeof index === 'number') {
    mockData[key].splice(index, 0, nodeMap[nodeId]);
  } else {
    mockData[key].push(nodeMap[nodeId]);
  }
}

/**
 * 获取某个父节点下的子节点 ID 列表（同步，用于 DnD 后更新）
 */
export function getMockChildrenIds(parentId) {
  const key = parentId ?? 'root';
  return (mockData[key] || []).map((n) => n.id);
}

/**
 * 设置某个父节点下的子节点顺序
 */
export function setMockChildren(parentId, childrenIds) {
  const key = parentId ?? 'root';
  mockData[key] = childrenIds.map((id) => nodeMap[id]).filter(Boolean);
}
