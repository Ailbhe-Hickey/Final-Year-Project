import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

const ITEM_WIDTH = 140;
const ITEM_SPACING = 20;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_SPACING;

export interface Need {
  id: string;
  label: string;
  score?: number;
}

interface Props {
  data: Need[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  flatListRef: React.RefObject<Animated.FlatList<Need>>;
  onSelect?: (need: Need) => void;
}

function distributeFromCenter(sorted: Need[]) {
  const length = sorted.length;
  const result: Need[] = new Array(length);

  const centerIndex = Math.floor(length / 2);
  result[centerIndex] = sorted[0];

  let left = centerIndex - 1;
  let right = centerIndex + 1;
  let toggleLeft = true;

  for (let i = 1; i < length; i++) {
    if (toggleLeft && left >= 0) {
      result[left--] = sorted[i];
    } else if (right < length) {
      result[right++] = sorted[i];
    }
    toggleLeft = !toggleLeft;
  }

  return result;
}

export default function NeedsCarousel({
  data,
  currentIndex,
  setCurrentIndex,
  flatListRef,
  onSelect,
}: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;

  // Sort by score
  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
  }, [data]);

  // Distribute from center
  const arrangedData = useMemo(() => {
    return distributeFromCenter(sortedData);
  }, [sortedData]);

  // Scroll when index changes
  useEffect(() => {
    if (!arrangedData.length) return;

    flatListRef.current?.scrollToIndex({
      index: currentIndex,
      animated: true,
    });
  }, [currentIndex, arrangedData]);

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={arrangedData}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      bounces={false}
      getItemLayout={(_, index) => ({
        length: SNAP_INTERVAL,
        offset: SNAP_INTERVAL * index,
        index,
      })}
      contentContainerStyle={{
        paddingHorizontal: (width - ITEM_WIDTH) / 2,
      }}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(
          event.nativeEvent.contentOffset.x / SNAP_INTERVAL
        );
        setCurrentIndex(index);
        onSelect?.(arrangedData[index]);
      }}
      renderItem={({ item, index }) => {
        // How far this item's center is from the scroll center
        const inputRange = [
          (index - 1) * SNAP_INTERVAL,
          index * SNAP_INTERVAL,
          (index + 1) * SNAP_INTERVAL,
        ];

        // Center item scales up to 1.2, neighbours stay at 0.9
        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [0.9, 1.2, 0.9],
          extrapolate: "clamp",
        });

        // Center item is fully opaque, neighbours are faded
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.5, 1, 0.5],
          extrapolate: "clamp",
        });

        return (
          <Animated.View style={[styles.itemContainer, { transform: [{ scale }], opacity }]}>
            <TouchableOpacity
              style={styles.touchArea}
              activeOpacity={0.8}
              onPress={() => {
                setCurrentIndex(index);
                onSelect?.(item);
                flatListRef.current?.scrollToIndex({ index, animated: true });
              }}
            >
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  touchArea: {
    width: "100%",
    paddingVertical: 22,
    borderRadius: 14,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 20,
    fontWeight: "600",
  },
});
