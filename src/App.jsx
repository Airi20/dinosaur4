import React, { useState, useEffect, useRef } from "react";

const obstacleImages = {
  cactus: [
    "/obstacles/cactus2.jpg",
    "/obstacles/cactus3.jpg",
    "/obstacles/cactus4.jpg",
    "/obstacles/cactus5.jpg",
  ],
};

const Obstacle = ({ type, position, variant }) => {
  const imgSrc = obstacleImages[type]?.[variant] || obstacleImages.cactus[0];
  return (
    <img
      src={imgSrc}
      alt={type}
      style={{
        position: "absolute",
        bottom: 20,
        left: position,
        height: 50,
        objectFit: "contain",
      }}
    />
  );
};

export default function DinoGame() {
  const [obstacles, setObstacles] = useState([]);
  const [dinoPos, setDinoPos] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);
  const [started, setStarted] = useState(false);
  const [audioReady, setAudioReady] = useState(false); // ←追記
  const bgmRef = useRef(null);

  // BGMロード
  useEffect(() => {
    const bgm = new Audio("/sounds/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.4;
    bgmRef.current = bgm;

    return () => {
      bgm.pause();
      bgm.currentTime = 0;
    };
  }, []);

  // 初回のクリック・タップでBGM再生
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioReady && bgmRef.current) {
        bgmRef.current.play().catch((e) => {
          console.warn("初回BGM再生失敗:", e);
        });
        setAudioReady(true);
      }
    };
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [audioReady]);

  // ゲーム状態に応じたBGM制御
  useEffect(() => {
    if (started && !gameOver) {
      try {
        bgmRef.current.currentTime = 0;
        bgmRef.current.play();
      } catch (e) {
        console.warn("BGM再生に失敗:", e);
      }
    } else {
      bgmRef.current?.pause();
    }
  }, [started, gameOver]);

  // ジャンプ処理
  useEffect(() => {
    if (!isJumping) return;
    let jumpHeight = 0;
    let goingUp = true;
    const jumpStep = 15;
    const maxHeight = 150;

    const jumpInterval = setInterval(() => {
      if (goingUp) {
        jumpHeight += jumpStep;
        if (jumpHeight >= maxHeight) goingUp = false;
      } else {
        jumpHeight -= jumpStep;
        if (jumpHeight <= 0) {
          jumpHeight = 0;
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
      }
      setDinoPos(jumpHeight);
    }, 20);

    return () => clearInterval(jumpInterval);
  }, [isJumping]);

  // 入力
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " && !isJumping && !gameOver && started) {
        setIsJumping(true);
      }
    };
    const handleTap = () => {
      if (!isJumping && !gameOver && started) {
        setIsJumping(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTap);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTap);
    };
  }, [isJumping, gameOver, started]);

  // 障害物生成
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      const variant = Math.floor(Math.random() * obstacleImages.cactus.length);
      setObstacles((prev) => [
        ...prev,
        { id: Date.now(), type: "cactus", variant, position: 600 },
      ]);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, started]);

  // 障害物移動
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, position: obs.position - 35 }))
          .filter((obs) => obs.position > -50)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, started]);

  // 距離カウント
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      setDistance((prev) => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, started]);

  // 当たり判定
  useEffect(() => {
    if (!started || gameOver) return;
    const checkCollision = () => {
      const dinoRect = {
        left: 50,
        right: 90,
        bottom: 20 + dinoPos,
        top: 60 + dinoPos,
      };

      for (const obs of obstacles) {
        const obsLeft = obs.position;
        const obsRight = obs.position + 30;
        const obsBottom = 20;
        const obsTop = 70;

        const isCollide =
          dinoRect.right > obsLeft &&
          dinoRect.left < obsRight &&
          dinoRect.top > obsBottom &&
          dinoRect.bottom < obsTop;

        if (isCollide) {
          setGameOver(true);
          break;
        }
      }
    };
    const interval = setInterval(checkCollision, 50);
    return () => clearInterval(interval);
  }, [dinoPos, obstacles, gameOver, started]);

  return (
    <div
      style={{
        position: "relative",
        height: "200px",
        width: "600px",
        border: "2px solid black",
        overflow: "hidden",
        backgroundColor: "#d8f3dc",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: "20px",
          width: "100%",
          backgroundColor: "#555",
        }}
      />

      <img
        src="/dino.jpg"
        alt="恐竜"
        style={{
          position: "absolute",
          bottom: 20 + dinoPos,
          left: 50,
          width: "40px",
          height: "40px",
          transition: "bottom 0.1s",
        }}
      />

      {obstacles.map((obs) => (
        <Obstacle
          key={obs.id}
          type={obs.type}
          variant={obs.variant}
          position={obs.position}
        />
      ))}

      {!started && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            fontSize: "18px",
            textAlign: "center",
          }}
        >
         
          <button
            onClick={() => {
              setStarted(true);
              setGameOver(false);
              setObstacles([]);
              setDistance(0);
              setDinoPos(0);
            }}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            スタート！
          </button>
        </div>
      )}

      {gameOver && started && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "5px",
            borderRadius: "10px",
            fontSize: "18px",
            textAlign: "center",
          }}
        >
          <p>ゲームオーバー！</p>
          <button
            onClick={() => {
              bgmRef.current?.play();
              setGameOver(false);
              setObstacles([]);
              setDistance(0);
              setDinoPos(0);
              setIsJumping(false);
            }}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "16px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            もう一度！
          </button>
        </div>
      )}

      <p style={{ position: "absolute", top: 0, left: 10, color: "green" }}>
        スペースキー / タップでジャンプ！
      </p>
      <p style={{ position: "absolute", top: 0, right: 10, fontWeight: "bold", color: "green" }}>
        {distance} m
      </p>

    </div>
  );
}