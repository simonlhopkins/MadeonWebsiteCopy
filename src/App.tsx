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
        //update the UI of the app on loop. These have no bearing over what the current state of the sample pad actually is
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
    //here is the ONLY place we should be updating what the sample pad is thinking about playing because this can be set whenever
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
      <h2>
        I also stole the background artwork from this{" "}
        <a href="https://soundcloud.com/porter-robinson/sad-machine-anamanaguchi-remix">
          song on soundcloud!!
        </a>
      </h2>
      <h3>made this for learning</h3>
    </>
  );
}

export default App;
