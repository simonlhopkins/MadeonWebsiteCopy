import { PadConfig, SamplePadState } from "../MadeonSamplePad";
import {
  getPadConfigFromIndex,
  samplePadStateContainsPadConfig,
} from "../Util";
import Pad from "./Pad";

type SamplePadProps = {
  currentSamplePadState: SamplePadState;
  queuedSamplePadState: SamplePadState;
  onPadClick: (padConfig: PadConfig) => void;
};

export default function SamplePad({
  currentSamplePadState,
  queuedSamplePadState,
  onPadClick,
}: SamplePadProps) {
  const n = 6;

  const samplePads = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const index = row * n + col;
      const padConfig = getPadConfigFromIndex(index);
      const isActive = samplePadStateContainsPadConfig(
        currentSamplePadState,
        padConfig
      );

      const isQueued = samplePadStateContainsPadConfig(
        queuedSamplePadState,
        padConfig
      );
      samplePads.push(
        <Pad
          active={isActive}
          key={index}
          debugText={`${index}`}
          queued={isQueued}
          padConfig={padConfig}
          onPadClick={onPadClick}
        />
      );
    }
  }
  return <div className="samplePadParent">{samplePads}</div>;
}
