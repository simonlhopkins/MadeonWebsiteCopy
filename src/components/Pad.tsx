import { useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
} from "../MadeonSamplePad";
import {
  getColorFromPadType,
  mapRange,
  samplePadStateContainsPadConfig,
} from "../Util";

type PadProps = {
  active: boolean;
  queued: boolean;
  debugText: string;
  padConfig: PadConfig;
  onPadClick: (padConfig: PadConfig) => void;
};
export default function Pad({
  active,
  queued,
  padConfig,
  onPadClick,
}: PadProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  //this seems like a fucked up way to do animations in react lol but like none of the other libraries make any sense to me.

  useEffect(() => {
    //each pad have an update callback, this is because we need to start the animation AS SOON as we can
    //if we rely on the active prop, that will be updated ms after the loop already happened, so we would
    //miss the first iteration of the loop
    const loopID = MadeonSamplePadInstance.addSampleLoopCallback(
      (currentState, time, loopDuration) => {
        const actuallyActive = samplePadStateContainsPadConfig(
          currentState,
          padConfig
        );
        //actually active is what the class is giving us completely divorced from rendering
        //I feel like i read somewhere that you shouldn't set state in a use effect block but ¯\_(ツ)_/¯
        //Like technically it is in the callback function lol

        if (actuallyActive) {
          const keyFrames = [
            { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
            { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
            { transform: "scale(1)", easing: "ease-in-out" },
          ];
          divRef.current?.animate(keyFrames, {
            duration: (loopDuration / 8) * 1000,
            iterations: 8,
          });
        }
      }
    );

    return () => {
      if (loopID != null) {
        divRef.current?.getAnimations().forEach((item) => {
          item.cancel();
        });
        divRef.current?.animate(
          [
            {
              transform: "scale(1)",
            },
          ],
          200
        );

        MadeonSamplePadInstance.removeSampleLoopCallback(loopID);
      }
    };
  }, []);

  //if the queued status changes, then add an animation
  useEffect(() => {
    if (queued) {
      const nextLoopStartTime = MadeonSamplePadInstance.getNextLoopStartTime();
      const loopStartTime = MadeonSamplePadInstance.getCurrentLoopStartTime();
      console.log(loopStartTime, nextLoopStartTime);
      const percentThrough =
        loopStartTime < nextLoopStartTime
          ? mapRange(
              MadeonSamplePadInstance.getCurrentTransportTime(),
              loopStartTime,
              nextLoopStartTime,
              0,
              1
            )
          : 1;
      overlayRef.current?.animate(
        { width: [`${percentThrough * 100}%`, "100%"], easing: "linear" },
        (1 - percentThrough) * MadeonSamplePadInstance.getLoopDuration() * 1000
      );
    }
    return () => {
      overlayRef.current?.getAnimations().forEach((item) => item.cancel());
    };
  }, [queued]);

  return (
    <StyledPad
      $padType={padConfig.type}
      $animLength={MadeonSamplePadInstance.getLoopDuration() * 1000}
      className={`${active ? "active" : ""} ${queued ? "queued" : ""}`}
      onClick={() => {
        onPadClick(padConfig);
      }}
      ref={divRef}
    >
      <div className="overlay" ref={overlayRef}></div>
    </StyledPad>
  );
}

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0px rgba(255, 0, 0, 1);
  }
  100% {
    box-shadow: 0 0 0 80px rgba(0, 0, 0, 0);
  }
`;

const StyledPad = styled.div<{ $padType: PadType; $animLength: number }>`
  position: relative;
  background-color: ${(props) => getColorFromPadType(props.$padType, 0.8)};
  border: 2px solid white;
  margin: 5px;
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
