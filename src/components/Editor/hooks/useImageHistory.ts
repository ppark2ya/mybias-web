import { useState, useEffect } from "react";
import { getImageDimensions } from "../../../utils/imageEditor";
import { trackUndo, trackRedo } from "../../../utils/analytics";
import type { ImageState } from "./useEditorState";

export function useImageHistory(
  files: File[],
  imageStates: Map<number, ImageState>,
  setImageStates: React.Dispatch<React.SetStateAction<Map<number, ImageState>>>,
  selectedIndex: number
) {
  const [history, setHistory] = useState<Map<number, string[]>>(() => new Map());
  const [historyIndex, setHistoryIndex] = useState<Map<number, number>>(() => new Map());

  // Initialize history from image states only once
  useEffect(() => {
    // Only initialize if history is empty
    if (history.size > 0) return;

    const newHistory = new Map<number, string[]>();
    const newHistoryIndex = new Map<number, number>();

    for (let i = 0; i < files.length; i++) {
      const state = imageStates.get(i);
      if (state) {
        newHistory.set(i, [state.blobUrl]);
        newHistoryIndex.set(i, 0);
      }
    }

    if (newHistory.size > 0) {
      setHistory(newHistory);
      setHistoryIndex(newHistoryIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageStates]);

  const currentHistory = history.get(selectedIndex) || [];
  const currentHistoryIdx = historyIndex.get(selectedIndex) ?? 0;
  const canUndo = currentHistoryIdx > 0;
  const canRedo = currentHistoryIdx < currentHistory.length - 1;

  const updateImageState = async (newBlobUrl: string) => {
    const dimensions = await getImageDimensions(newBlobUrl);

    setImageStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(selectedIndex, {
        blobUrl: newBlobUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
      return newMap;
    });

    setHistory((prev) => {
      const newMap = new Map(prev);
      const currentHistory = newMap.get(selectedIndex) || [];
      const currentIdx = historyIndex.get(selectedIndex) ?? 0;
      const newHistory = [...currentHistory.slice(0, currentIdx + 1), newBlobUrl];
      newMap.set(selectedIndex, newHistory);
      return newMap;
    });

    setHistoryIndex((prev) => {
      const newMap = new Map(prev);
      const currentIdx = prev.get(selectedIndex) ?? 0;
      newMap.set(selectedIndex, currentIdx + 1);
      return newMap;
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;
    trackUndo();

    const newIdx = currentHistoryIdx - 1;
    const previousBlobUrl = currentHistory[newIdx];

    if (previousBlobUrl) {
      setHistoryIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, newIdx);
        return newMap;
      });

      getImageDimensions(previousBlobUrl).then((dimensions) => {
        setImageStates((prevStates) => {
          const newStatesMap = new Map(prevStates);
          newStatesMap.set(selectedIndex, {
            blobUrl: previousBlobUrl,
            width: dimensions.width,
            height: dimensions.height,
          });
          return newStatesMap;
        });
      });
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    trackRedo();

    const newIdx = currentHistoryIdx + 1;
    const nextBlobUrl = currentHistory[newIdx];

    if (nextBlobUrl) {
      setHistoryIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, newIdx);
        return newMap;
      });

      getImageDimensions(nextBlobUrl).then((dimensions) => {
        setImageStates((prevStates) => {
          const newStatesMap = new Map(prevStates);
          newStatesMap.set(selectedIndex, {
            blobUrl: nextBlobUrl,
            width: dimensions.width,
            height: dimensions.height,
          });
          return newStatesMap;
        });
      });
    }
  };

  return {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    canUndo,
    canRedo,
    updateImageState,
    handleUndo,
    handleRedo,
  };
}
