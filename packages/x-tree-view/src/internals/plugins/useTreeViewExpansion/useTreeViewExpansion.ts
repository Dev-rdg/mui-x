import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { TreeViewPlugin } from '../../models';
import { populateInstance, populatePublicAPI } from '../../useTreeView/useTreeView.utils';
import { UseTreeViewExpansionSignature } from './useTreeViewExpansion.types';
import { TreeViewItemId } from '../../../models';

export const useTreeViewExpansion: TreeViewPlugin<UseTreeViewExpansionSignature> = ({
  instance,
  publicAPI,
  params,
  models,
}) => {
  const expandedItemsMap = React.useMemo(() => {
    const temp = new Map<TreeViewItemId, boolean>();
    models.expandedItems.value.forEach((id) => {
      temp.set(id, true);
    });

    return temp;
  }, [models.expandedItems.value]);

  const setExpandedItems = (event: React.SyntheticEvent, value: string[]) => {
    params.onExpandedItemsChange?.(event, value);
    models.expandedItems.setControlledValue(value);
  };

  const isItemExpanded = React.useCallback(
    (itemId: string) => expandedItemsMap.has(itemId),
    [expandedItemsMap],
  );

  const isItemExpandable = React.useCallback(
    (itemId: string) => !!instance.getNode(itemId)?.expandable,
    [instance],
  );

  const toggleItemExpansion = useEventCallback((event: React.SyntheticEvent, itemId: string) => {
    const isExpandedBefore = instance.isItemExpanded(itemId);
    instance.setItemExpansion(event, itemId, !isExpandedBefore);
  });

  const setItemExpansion = useEventCallback(
    (event: React.SyntheticEvent, itemId: string, isExpanded: boolean) => {
      const isExpandedBefore = instance.isItemExpanded(itemId);
      if (isExpandedBefore === isExpanded) {
        return;
      }

      let newExpanded: string[];
      if (isExpanded) {
        newExpanded = [itemId].concat(models.expandedItems.value);
      } else {
        newExpanded = models.expandedItems.value.filter((id) => id !== itemId);
      }

      if (params.onItemExpansionToggle) {
        params.onItemExpansionToggle(event, itemId, isExpanded);
      }

      setExpandedItems(event, newExpanded);
    },
  );

  const expandAllSiblings = (event: React.KeyboardEvent, itemId: string) => {
    const node = instance.getNode(itemId);
    const siblings = instance.getChildrenIds(node.parentId);

    const diff = siblings.filter(
      (child) => instance.isItemExpandable(child) && !instance.isItemExpanded(child),
    );

    const newExpanded = models.expandedItems.value.concat(diff);

    if (diff.length > 0) {
      if (params.onItemExpansionToggle) {
        diff.forEach((newlyExpandedItemId) => {
          params.onItemExpansionToggle!(event, newlyExpandedItemId, true);
        });
      }

      setExpandedItems(event, newExpanded);
    }
  };

  populateInstance<UseTreeViewExpansionSignature>(instance, {
    isItemExpanded,
    isItemExpandable,
    setItemExpansion,
    toggleItemExpansion,
    expandAllSiblings,
  });

  populatePublicAPI<UseTreeViewExpansionSignature>(publicAPI, { setItemExpansion });
};

useTreeViewExpansion.models = {
  expandedItems: {
    getDefaultValue: (params) => params.defaultExpandedItems,
  },
};

const DEFAULT_EXPANDED_ITEMS: string[] = [];

useTreeViewExpansion.getDefaultizedParams = (params) => ({
  ...params,
  defaultExpandedItems: params.defaultExpandedItems ?? DEFAULT_EXPANDED_ITEMS,
});

useTreeViewExpansion.params = {
  expandedItems: true,
  defaultExpandedItems: true,
  onExpandedItemsChange: true,
  onItemExpansionToggle: true,
};
