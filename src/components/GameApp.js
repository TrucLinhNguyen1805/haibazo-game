import React, { useState, useEffect, useRef } from "react";

function GameApp() {
  const [points, setPoints] = useState(5);
  const [time, setTime] = useState(0.5);
  const [numbers, setNumbers] = useState([]);
  const [positions, setPositions] = useState({});
  const [score, setScore] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [nextNumber, setNextNumber] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [allCleared, setAllCleared] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fadingNumbers, setFadingNumbers] = useState({});
  const [zIndexes, setZIndexes] = useState({});

  const fadeIntervalsRef = useRef([]);

  const generateNumbers = (num) => {
    const boxSize = 500;
    const newPositions = {};
    const newZIndexes = {};
    const maxOverlap = num >= 2000 ? 5 : 1;

    for (let i = 0; i < num; i++) {
      let top, left;
      let attempts = 0;
      do {
        top = Math.random() * (boxSize - 50);
        left = Math.random() * (boxSize - 50);
        attempts++;
      } while (
        Object.values(newPositions).some(
          (pos) =>
            Math.abs(pos.top - top) < 10 && Math.abs(pos.left - left) < 10
        ) &&
        attempts < maxOverlap
      );

      newPositions[i + 1] = { top, left };
      newZIndexes[i + 1] = 1;
    }

    setNumbers(Array.from({ length: num }, (_, i) => i + 1));
    setPositions(newPositions);
    setFadingNumbers({});
    setZIndexes(newZIndexes);
    setNextNumber(1);
  };

  useEffect(() => {
    if (isPlaying) {
      generateNumbers(points);
    }
  }, [isPlaying, points]);

  useEffect(() => {
    let timer;
    if (isPlaying && !gameOver && !allCleared) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, gameOver, allCleared]);

  useEffect(() => {
    let timer;
    if (autoPlay && isPlaying && !gameOver && !allCleared) {
      timer = setInterval(() => {
        if (numbers.includes(nextNumber)) {
          handleNumberClick(nextNumber);
        }
      }, time * 1000);
    }
    return () => clearInterval(timer);
  }, [autoPlay, nextNumber, time, numbers, isPlaying, gameOver, allCleared]);

  const handleNumberClick = (number) => {
    if (!isPlaying || gameOver || !numbers.includes(number)) return;

    if (number !== nextNumber) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }
    setFadingNumbers((prev) => ({
      ...prev,
      [number]: { opacity: 1.0, color: "orange", countdown: 3.0 },
    }));

    // Đưa số được click lên trên cùng bằng cách tăng zIndex
    setZIndexes((prev) => {
      const maxZIndex = Math.max(...Object.values(prev)) + 1;
      return { ...prev, [number]: maxZIndex };
    });

    const allNumbersClicked =
      Object.keys(fadingNumbers).length + 1 === numbers.length;
    if (allNumbersClicked && !gameOver) {
      setIsAllClearedReady(true);
    }

    if (!gameOver) {
      let fadeInterval = setInterval(() => {
        setFadingNumbers((prev) => {
          if (!prev[number]) return prev;

          const newOpacity = Math.max(prev[number].opacity - 0.033, 0);
          const newCountdown = Math.max(prev[number].countdown - 0.1, 0);

          let newColor = "orange";
          if (newOpacity < 0.5) {
            newColor = "rgba(255, 165, 0, 0.5)";
          }
          if (newCountdown <= 0) {
            clearInterval(fadeInterval);
            return {
              ...prev,
              [number]: { opacity: 0, countdown: newCountdown },
            };
          }
          return {
            ...prev,
            [number]: {
              opacity: newOpacity,
              countdown: newCountdown,
              color: newColor,
            },
          };
        });
      }, 100);
      fadeIntervalsRef.current.push(fadeInterval);
      setNextNumber((prevNext) => prevNext + 1);
    }

    if (gameOver) {
      setNumbers((prevNumbers) => [...prevNumbers, number]);
    }
  };

  const [isAllClearedReady, setIsAllClearedReady] = useState(false);

  useEffect(() => {
    if (isAllClearedReady) {
      const numberFadePromises = Object.keys(fadingNumbers).map((key) => {
        return new Promise((resolve) => {
          const fadingInterval = setInterval(() => {
            if (fadingNumbers[key]?.opacity <= 0) {
              clearInterval(fadingInterval);
              resolve();
            }
          }, 100);
        });
      });

      Promise.all(numberFadePromises).then(() => {
        setAllCleared(true);
        setIsAllClearedReady(false);
      });
    }
  }, [isAllClearedReady, fadingNumbers]);
  const handlePlay = () => {
    setElapsedTime(0);
    setScore(0);
    setGameOver(false);
    setAllCleared(false);
    setIsPlaying(true);
    generateNumbers(points);
  };

  const restartGame = () => {
    // Hủy tất cả các interval khi game được restart
    fadeIntervalsRef.current.forEach((interval) => clearInterval(interval));
    fadeIntervalsRef.current = [];

    setElapsedTime(0);
    setGameOver(false);
    setAllCleared(false);
    setIsPlaying(true);
    setFadingNumbers({});
    generateNumbers(points);
  };

  useEffect(() => {
    if (gameOver) {
      // Dừng mọi fading effect khi game kết thúc và giữ số trên màn hình
      fadeIntervalsRef.current.forEach((interval) => clearInterval(interval));
      fadeIntervalsRef.current = [];

      // Đảm bảo các số đã chọn vẫn hiển thị
      setFadingNumbers((prev) => {
        const updated = {};
        Object.keys(prev).forEach((key) => {
          updated[key] = { ...prev[key], opacity: 1 }; // Giữ opacity là 1 khi game kết thúc
        });
        return updated;
      });
    }
  }, [gameOver]);

  return (
    <div className="container">
      <h3 style={{ color: allCleared ? "green" : gameOver ? "red" : "black" }}>
        {allCleared ? "ALL CLEARED" : gameOver ? "Game Over" : "LET'S PLAY"}
      </h3>
      <div>
        <label>Points: </label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
        />
      </div>
      <p>Time: {elapsedTime.toFixed(1)}s</p>
      {!isPlaying && !gameOver && !allCleared && (
        <button onClick={handlePlay}>Play</button>
      )}
      {(isPlaying || gameOver || allCleared) && (
        <button onClick={restartGame}>Restart</button>
      )}
      {isPlaying && (
        <button onClick={() => setAutoPlay(!autoPlay)}>
          Auto Play {autoPlay ? "OFF" : "ON"}
        </button>
      )}
      <div className="number-area">
        {numbers.map((number) => (
          <div
            key={number}
            className="number"
            style={{
              position: "absolute",
              top: `${positions[number]?.top}px`,
              left: `${positions[number]?.left}px`,
              backgroundColor: fadingNumbers[number]?.color || "white",
              opacity:
                fadingNumbers[number]?.opacity !== undefined
                  ? fadingNumbers[number].opacity
                  : 1,
              transition: "opacity 0.1s linear, background-color 0.1s linear",
              zIndex: zIndexes[number] || 1,
            }}
            onClick={() => handleNumberClick(number)}
          >
            <span>{number}</span>
            {fadingNumbers[number] && (
              <span className="countdown">
                {fadingNumbers[number].countdown.toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>
      {isPlaying && !gameOver && <label>Next: {nextNumber + 1}</label>}
    </div>
  );
}

export default GameApp;
