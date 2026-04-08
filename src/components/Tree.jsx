import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  asyncDataLoaderFeature,
  selectionFeature,
  hotkeysCoreFeature,
  dragAndDropFeature,
  renamingFeature,
  expandAllFeature,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import {
  fetchChildren,
  fetchItem,
  addMockNode,
  removeMockNode,
  updateMockNode,
  setMockChildren,
} from '../api/mockTreeApi';
import './Tree.css';

let idCounter = 1000;
const genId = () => `node-${++idCounter}`;

// 子节点 ID 缓存，供 dataLoader 和 DnD 使用
const childrenIdCache = {};

const FileTree = forwardRef(function FileTree({ onSelect, onExpand, onDrop, onDelete }, ref) {
  const [selectedId, setSelectedId] = useState(null);

  const tree = useTree({
    rootItemId: 'root',
    getItemName: (item) => item.getItemData()?.label ?? '...',
    isItemFolder: (item) => item.getItemData()?.type === 'folder',
    indent: 20,
    dataLoader: {
      getItem: async (itemId) => {
        if (itemId === 'root') return { id: 'root', label: 'Root', type: 'folder' };
        const data = await fetchItem(itemId);
        return data || { id: itemId, label: itemId, type: 'file' };
      },
      getChildren: async (itemId) => {
        const key = itemId ?? 'root';
        if (childrenIdCache[key]) return childrenIdCache[key];
        const children = await fetchChildren(key === 'root' ? null : itemId);
        const ids = children.map((c) => c.id);
        childrenIdCache[key] = ids;
        return ids;
      },
    },
    createLoadingItemData: () => ({ id: '__loading__', label: '加载中...', type: 'file' }),
    canDrop: (items, target) => {
      // 只能拖入 folder，不能拖入 file
      const targetItem = target.item;
      if (!targetItem.isFolder()) return false;
      return true;
    },
    canReorder: true,
    onDrop: async (items, target) => {
      const targetParent = target.item;
      const movedIds = items.map((i) => i.getId());

      // 从原父节点移除
      for (const item of items) {
        const parent = item.getParent();
        if (parent) {
          const parentId = parent.getId();
          const oldChildren = parent.getChildren().map((c) => c.getId()).filter((id) => !movedIds.includes(id));
          childrenIdCache[parentId] = oldChildren;
          setMockChildren(parentId, oldChildren);
        }
      }

      // 添加到目标
      const parentId = targetParent.getId();
      let newChildren = (childrenIdCache[parentId] || targetParent.getChildren().map((c) => c.getId()))
        .filter((id) => !movedIds.includes(id));

      if ('childIndex' in target) {
        newChildren.splice(target.childIndex, 0, ...movedIds);
      } else {
        newChildren.push(...movedIds);
      }

      childrenIdCache[parentId] = newChildren;
      setMockChildren(parentId, newChildren);

      tree.rebuildTree();
      onDrop?.(items.map((i) => i.getId()), parentId);
    },
    onRename: (item, value) => {
      updateMockNode(item.getId(), { label: value });
      item.invalidateItemData();
    },
    features: [
      asyncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      renamingFeature,
      expandAllFeature,
    ],
  });

  // 暴露操作 API
  useImperativeHandle(ref, () => ({
    // 新增子节点
    addNode: (parentId, nodeData) => {
      const id = nodeData?.id || genId();
      const node = {
        id,
        label: nodeData?.label || '新节点',
        type: nodeData?.type || 'file',
      };
      addMockNode(parentId, node);
      // 更新缓存
      if (childrenIdCache[parentId]) {
        childrenIdCache[parentId] = [...childrenIdCache[parentId], id];
      } else {
        childrenIdCache[parentId] = [id];
      }
      // 展开父节点并刷新
      const parentItem = tree.getItemInstance(parentId);
      if (parentItem && !parentItem.isExpanded()) {
        parentItem.expand();
      }
      parentItem?.invalidateChildrenIds?.();
      return id;
    },

    // 删除节点
    deleteNode: (nodeId) => {
      // 找到父节点并从缓存中移除
      for (const [key, ids] of Object.entries(childrenIdCache)) {
        const idx = ids.indexOf(nodeId);
        if (idx !== -1) {
          ids.splice(idx, 1);
          childrenIdCache[key] = [...ids];
          const parentItem = tree.getItemInstance(key);
          parentItem?.invalidateChildrenIds?.();
          break;
        }
      }
      removeMockNode(nodeId);
      delete childrenIdCache[nodeId];
      tree.rebuildTree();
      onDelete?.(nodeId);
    },

    // 更新节点
    updateNode: (nodeId, updates) => {
      updateMockNode(nodeId, updates);
      const item = tree.getItemInstance(nodeId);
      item?.invalidateItemData?.();
    },

    // 全部展开
    expandAll: () => tree.expandAll(),

    // 全部收起
    collapseAll: () => tree.collapseAll(),

    // 全选
    selectAll: () => {
      const allItems = tree.getItems().filter((i) => i.getId() !== 'root');
      tree.setSelectedItems(allItems.map((i) => i.getId()));
    },

    // 取消全选
    deselectAll: () => {
      tree.setSelectedItems([]);
    },

    // 获取选中项
    getSelectedItems: () => tree.getSelectedItems(),

    // 获取 tree 实例
    getTree: () => tree,
  }));

  return (
    <div className="file-tree">
      <div {...tree.getContainerProps('文件树')} className="tree-container">
        {tree.getItems().map((item) => (
          <TreeNode
            key={item.getId()}
            item={item}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              onSelect?.(id);
            }}
            onExpand={onExpand}
          />
        ))}
      </div>
    </div>
  );
});

function TreeNode({ item, selectedId, onSelect, onExpand }) {
  const id = item.getId();
  const data = item.getItemData();
  const isFolder = item.isFolder();
  const isExpanded = item.isExpanded();
  const isSelected = item.isSelected?.() || selectedId === id;
  const isLoading = item.isLoading?.();
  const isRenaming = item.isRenaming?.();
  const level = item.getItemMeta().level;
  const isDragTarget = item.isDragTarget?.();

  const handleClick = (e) => {
    if (isFolder) {
      if (isExpanded) {
        item.collapse();
      } else {
        item.expand();
        onExpand?.(id);
      }
    }
    onSelect?.(id);
  };

  return (
    <div
      {...item.getProps()}
      className={[
        'tree-node',
        isSelected ? 'selected' : '',
        isDragTarget ? 'drag-target' : '',
        isFolder ? 'is-folder' : 'is-file',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ paddingLeft: `${level * 20}px` }}
      onClick={handleClick}
    >
      {/* 展开/收起箭头 */}
      <span className="tree-arrow">
        {isLoading ? (
          <span className="loading-icon">⏳</span>
        ) : isFolder ? (
          <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
        ) : (
          <span className="no-arrow" />
        )}
      </span>

      {/* 图标 */}
      <span className="tree-icon">{isFolder ? (isExpanded ? '📂' : '📁') : '📄'}</span>

      {/* 名称 */}
      {isRenaming ? (
        <input {...item.getRenameInputProps()} className="rename-input" autoFocus />
      ) : (
        <span className="tree-label">{data?.label ?? '...'}</span>
      )}
    </div>
  );
}

export default FileTree;
