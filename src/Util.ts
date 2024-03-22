import { PadConfig, PadType, SamplePadState } from "./MadeonSamplePad";

//https://math.stackexchange.com/questions/2108205/function-that-maps-numbers-to-diagonal-co-ordinates
//only works for n x n grids for now :( to get it working for m x n, I would need to add a 3rd case
//for if the coord fell in a middle section, which wouldn't be too bad.
const n = 6;
export const getDiagonalIndexFromRowCol = (row: number, col: number) => {
  const diagonalNum = row + col;
  const decreaseDiagonal = diagonalNum > n - 1;
  let diagonalLength = decreaseDiagonal
    ? n - 1 - (diagonalNum % n)
    : diagonalNum;

  let sum;
  if (decreaseDiagonal) {
    const numTerms = diagonalNum - n + 1;
    const firstTerm = diagonalLength;
    const lastTerm = n - 1;
    const maxDiagonal = (n * (n + 1)) / 2 - 1;
    const decreaseSum = numTerms * ((firstTerm + lastTerm) / 2);
    const rowModifier = n - row - 1;
    sum = maxDiagonal + decreaseSum - rowModifier;
  } else {
    //only increase is easy
    const rowModifier = row;
    sum = (diagonalLength * (diagonalLength + 1)) / 2 + rowModifier;
  }
  return sum;
};

export const getDiagonalIndexFromIndex = (index: number) => {
  const row = Math.floor(index / n);
  const col = index % n;
  return getDiagonalIndexFromRowCol(row, col);
};

export const getPadConfigFromIndex = (index: number): PadConfig => {
  const diagonalIndex = getDiagonalIndexFromIndex(index);
  if (diagonalIndex < 10) {
    return { type: PadType.BASS, index: diagonalIndex };
  } else if (diagonalIndex >= 26) {
    return { type: PadType.DRUM, index: diagonalIndex - 26 };
  } else {
    return { type: PadType.SOUNDS, index: diagonalIndex - 10 };
  }
};

export const padConfigEqual = (a: PadConfig, b: PadConfig) => {
  return a.index == b.index && a.type == b.type;
};

export const samplePadStateContainsPadConfig = (
  samplePadState: SamplePadState,
  padConfig: PadConfig
) => {
  return (
    (samplePadState.drum.find((item) => padConfigEqual(item, padConfig)) ||
      samplePadState.bass.find((item) => padConfigEqual(item, padConfig)) ||
      samplePadState.sounds.find((item) => padConfigEqual(item, padConfig))) !=
    undefined
  );
};

type Predicate<T> = (a: T, b: T) => boolean;

export function differenceWith<T>(
  arr1: T[],
  arr2: T[],
  predicate: Predicate<T>
): T[] {
  // Use a Set to keep track of elements present in both arrays
  const commonElements = new Set<T>();

  // Find common elements based on the comparison predicate
  for (const element1 of arr1) {
    for (const element2 of arr2) {
      if (predicate(element1, element2)) {
        commonElements.add(element1);
        commonElements.add(element2);
      }
    }
  }

  // Filter out elements present in both arrays
  const differenceArray: T[] = [];
  for (const element of arr1.concat(arr2)) {
    if (!commonElements.has(element)) {
      differenceArray.push(element);
    }
  }

  return differenceArray;
}

export function intersectionWith<T>(
  arr1: T[],
  arr2: T[],
  predicate: Predicate<T>
): T[] {
  // Use a Set to keep track of elements present in both arrays
  const commonElements = new Set<T>();

  // Find common elements based on the comparison predicate
  for (const element1 of arr1) {
    for (const element2 of arr2) {
      if (predicate(element1, element2)) {
        commonElements.add(element1);
        commonElements.add(element2);
      }
    }
  }

  // Convert the set to an array and return it
  return Array.from(commonElements);
}

export function unionWith<T>(
  arr1: T[],
  arr2: T[],
  predicate: Predicate<T>
): T[] {
  // Concatenate both arrays
  const mergedArray = arr1.concat(arr2);

  // Use a Set to keep unique elements based on the comparison predicate
  const uniqueElements = new Set<T>();

  // Add elements to the set based on the comparison predicate
  for (const element of mergedArray) {
    let found = false;
    for (const uniqueElement of uniqueElements) {
      if (predicate(element, uniqueElement)) {
        found = true;
        break;
      }
    }
    if (!found) {
      uniqueElements.add(element);
    }
  }

  // Convert the set back to an array
  return Array.from(uniqueElements);
}

export function applyPadConfigListToExistingList(
  queuedList: PadConfig[],
  existingList: PadConfig[],
  maxLength: number
) {
  const sharedList = intersectionWith<PadConfig>(
    queuedList,
    existingList,
    (a, b) => padConfigEqual(a, b)
  );

  //filter out the similarities from both of them
  let returnList = differenceWith<PadConfig>(sharedList, existingList, (a, b) =>
    padConfigEqual(a, b)
  );
  const newQueue = differenceWith<PadConfig>(sharedList, queuedList, (a, b) =>
    padConfigEqual(a, b)
  );

  returnList = unionWith<PadConfig>(returnList, newQueue, (a, b) =>
    padConfigEqual(a, b)
  );

  while (returnList.length > maxLength) {
    returnList.shift();
  }
  return returnList;
}
export function applyQueuedStateToExistingState(
  queuedState: SamplePadState,
  existingState: SamplePadState
): SamplePadState {
  const bass = applyPadConfigListToExistingList(
    queuedState.bass,
    existingState.bass,
    1
  );
  const drum = applyPadConfigListToExistingList(
    queuedState.drum,
    existingState.drum,
    1
  );
  const sounds = applyPadConfigListToExistingList(
    queuedState.sounds,
    existingState.sounds,
    3
  );
  return {
    bass,
    drum,
    sounds,
  };
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export const getColorFromPadType = (padType: PadType, opacity: number) => {
  switch (padType) {
    case PadType.BASS:
      return `rgb(44, 191, 123, ${opacity})`;
    case PadType.DRUM:
      return `rgb(242, 164, 19, ${opacity})`;
    case PadType.SOUNDS:
      return `rgb(242, 81, 22, ${opacity})`;
  }
};
