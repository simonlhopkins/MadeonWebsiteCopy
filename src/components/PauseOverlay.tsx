import styled from "styled-components";
import { play } from "../SamplePadSlice";
import { useAppDispatch } from "../store";

export default function PauseOverlay() {
  const dispatch = useAppDispatch();
  return (
    <StyledPauseOverlay>
      <button
        onClick={() => {
          dispatch(play());
        }}
      >
        resume
      </button>
    </StyledPauseOverlay>
  );
}

const StyledPauseOverlay = styled.div`
  width: 100svw;
  height: 100vh;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0px;
  top: 0px;
  z-index: 2;
  background-color: rgba(100, 100, 100, 0.7);
`;
