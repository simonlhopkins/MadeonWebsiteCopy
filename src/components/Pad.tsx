import { useEffect, useRef } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
  SamplePadState,
} from "../MadeonSamplePad";
import {
  getColorFromPadType,
  samplePadStateContainsPadConfig,
  useAddToRenderLoop,
} from "../Util";
import { useAppSelector } from "../store";

type PadProps = {
  debugText: string;
  padConfig: PadConfig;
  onPadClick: (padConfig: PadConfig) => void;
};
export default function Pad({ padConfig, onPadClick }: PadProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  //this seems like a fucked up way to do animations in react lol but like none of the other libraries make any sense to me.

  //this is wayyyy simpler but could be a little bit delayed since it is not starting exactly on the next update
  const currentSamples = useAppSelector(
    (state) => state.samplePad.currentSamples
  );
  const queuedSamples = useAppSelector(
    (state) => state.samplePad.queuedSamples
  );
  const isActive = samplePadStateContainsPadConfig(currentSamples, padConfig);
  const isQueued = samplePadStateContainsPadConfig(queuedSamples, padConfig);

  const keyFrames = [
    { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
    { transform: "scale(1.1)", easing: "ease-in-out", offset: 0.2 },
    { transform: "scale(1)", easing: "ease-in-out" },
  ];

  useAddToRenderLoop(
    (currentSamples: SamplePadState) => {
      if (samplePadStateContainsPadConfig(currentSamples, padConfig)) {
        divRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      if (!isActive) {
        divRef.current?.getAnimations().forEach((i) => i.cancel());
      }
    },
    [isActive]
  );

  //if the queued status changes, then add an animation
  //I think it is appropiate to observe the queue member, instead of adding to the onQueue updated callbacks
  //because we don't need this animation start exactly when it updates in the class, unlike with active,
  //where we need it to start exactly when it happens
  useEffect(() => {
    let queuedAnim: Animation | undefined = undefined;
    if (isQueued) {
      const percentThrough = MadeonSamplePadInstance.getLoopProgress();
      queuedAnim = overlayRef.current!.animate(
        { width: [`${percentThrough * 100}%`, "100%"], easing: "linear" },
        (1 - percentThrough) * MadeonSamplePadInstance.getLoopDuration() * 1000
      );
    }
    return () => {
      if (queuedAnim) {
        queuedAnim.cancel();
      }
    };
  }, [isQueued]);

  return (
    <StyledPad
      $padType={padConfig.type}
      $animLength={MadeonSamplePadInstance.getLoopDuration() * 1000}
      className={`${isActive ? "active" : ""} ${isQueued ? "queued" : ""}`}
      onClick={() => {
        onPadClick(padConfig);
      }}
      ref={divRef}
    >
      <div className="overlay" ref={overlayRef}></div>
    </StyledPad>
  );
}

const StyledPad = styled.div<{ $padType: PadType; $animLength: number }>`
  position: relative;
  background-color: ${(props) => getColorFromPadType(props.$padType, 0.8)};
  border: 0.2rem solid white;
  margin: 0.3rem;
  /* transform: rotate(45deg); */
  cursor: "pointer";

  &.active {
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};

    .overlay {
      opacity: 0%;
      transition: opacity 200ms;
    }
  }
  .overlay {
    opacity: 0%;
    transition: opacity 200ms;
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};
    border-right: 2px solid white;
    position: absolute;
    width: 0%;
    height: 100%;
  }
  &.queued {
    .overlay {
      opacity: 100%;
      transition: opacity 200ms;
    }
    &.active {
      .overlay {
        background-color: black;
      }
    }
  }
`;
