import { PadConfig, PadType, SamplePadState } from "./MadeonSamplePad";

//https://math.stackexchange.com/questions/2108205/function-that-maps-numbers-to-diagonal-co-ordinates
//only works for n x n grids for now :( to get it working for m x n, I would need to add a 3rd case
//for if the coord fell in a middle section, which wouldn't be too bad.
//this shit was hard:( I don't even know if this is the best way to do this but it made sense in the moment
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

//hard coded values ¯\_(ツ)_/¯
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

//can't a fella get an equals overload anymore!!
export const padConfigEqual = (a: PadConfig, b: PadConfig) => {
  return a.index == b.index && a.type == b.type;
};

export const samplePadStateContainsPadConfig = (
  samplePadState: SamplePadState,
  padConfig: PadConfig
) => {
  return (
    samplePadState.drum.some((item) => padConfigEqual(item, padConfig)) ||
    samplePadState.bass.some((item) => padConfigEqual(item, padConfig)) ||
    samplePadState.sounds.some((item) => padConfigEqual(item, padConfig))
  );
};

//chat poo poo pee
function combineUnique<T>(
  list1: T[],
  list2: T[],
  equals: (a: T, b: T) => boolean
): T[] {
  const combined: T[] = [];

  for (const item of list2) {
    if (!list1.some((x) => equals(x, item))) {
      combined.push(item);
    }
  }
  for (const item of list1) {
    if (!list2.some((x) => equals(x, item))) {
      combined.push(item);
    }
  }

  return combined;
}

export function applyPadConfigListToExistingList(
  queuedList: PadConfig[],
  existingList: PadConfig[],
  maxLength: number
) {
  let returnList = combineUnique<PadConfig>(
    queuedList,
    existingList,
    padConfigEqual
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

//chat poo poo pee
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

export const isSamplePadStateEmpty = (samplePadState: SamplePadState) => {
  return (
    samplePadState.sounds.length == 0 &&
    samplePadState.drum.length == 0 &&
    samplePadState.bass.length == 0
  );
};
