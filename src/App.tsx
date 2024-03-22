import { useEffect, useState } from "react";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
  SamplePadState,
} from "./MadeonSamplePad";
import { applyPadConfigListToExistingList, getColorFromPadType } from "./Util";
import SamplePad from "./components/SamplePad";

function App() {
  const [currentSamplePadState, setCurrentSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });
  const [queuedSamplePadState, setQueuedSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });

  useEffect(() => {
    const id = MadeonSamplePadInstance.addSampleLoopCallback(
      (newState: SamplePadState) => {
        setCurrentSamplePadState({ ...newState });
        setQueuedSamplePadState({
          drum: [],
          bass: [],
          sounds: [],
        });
      }
    );
    return () => {
      MadeonSamplePadInstance.removeSampleLoopCallback(id);
    };
  }, []);
  //this is only used for queuing
  const onClick = (padConfig: PadConfig) => {
    //logic to unqueue items

    switch (padConfig.type) {
      case PadType.BASS:
        queuedSamplePadState.bass = applyPadConfigListToExistingList(
          [padConfig],
          queuedSamplePadState.bass,
          1
        );
        break;
      case PadType.DRUM:
        queuedSamplePadState.drum = applyPadConfigListToExistingList(
          [padConfig],
          queuedSamplePadState.drum,
          1
        );
        break;
      case PadType.SOUNDS:
        queuedSamplePadState.sounds = applyPadConfigListToExistingList(
          [padConfig],
          queuedSamplePadState.sounds,
          3 //this can be increased if you want to add wiggle room to undo all 3 and then add 3 more or something
        );

        break;
    }

    setQueuedSamplePadState({ ...queuedSamplePadState });
    MadeonSamplePadInstance.setQueuedSamplePadState(queuedSamplePadState);
  };
  return (
    <>
      <h1>Click on a square to begin!</h1>
      <h2>
        You can have one{" "}
        <span style={{ color: getColorFromPadType(PadType.BASS, 1) }}>
          bass
        </span>
        , one{" "}
        <span style={{ color: getColorFromPadType(PadType.DRUM, 1) }}>
          drum
        </span>
        , and 3{" "}
        <span style={{ color: getColorFromPadType(PadType.SOUNDS, 1) }}>
          melody
        </span>
      </h2>
      <SamplePad
        currentSamplePadState={currentSamplePadState}
        queuedSamplePadState={queuedSamplePadState}
        onPadClick={onClick}
      />
      <h2>
        This was 100% stolen from{" "}
        <a href="https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/?t=5,16,34">
          this website
        </a>{" "}
        so credit to them!
      </h2>
    </>
  );
}

export default App;
