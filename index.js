document.addEventListener('DOMContentLoaded', () => {
    // AudioContext 생성 (한 번만)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const Timer = {
        // 초기 설정 (초 단위)
        focusDuration: 25 * 60,
        breakDuration: 5 * 60,
        timeLeft: 25 * 60,
        totalTime: 25 * 60,
        isFocus: true,
        running: false,
        isPaused: false,
        timerId: null,
        cycleCount: 0,
        totalFocusTime: 0,

        // 타이머 디스플레이 업데이트 (분:초)
        updateTimerDisplay() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            document.getElementById("timer").innerText =
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            this.updateProgressCircle();
            
            // 남은 시간 조절 슬라이더 업데이트: 최대값은 totalTime, 현재 값은 timeLeft
            const timeSlider = document.getElementById("timeAdjustSlider");
            if (timeSlider) {
                timeSlider.max = this.totalTime;
                timeSlider.value = this.timeLeft;
            }
        },

        // 원형 진행바 업데이트 및 pulse 애니메이션 조건 적용
        updateProgressCircle() {
            const progressEl = document.getElementById("progress");
            const angle = 360 - (this.timeLeft / this.totalTime) * 360;
            progressEl.style.background =
                `conic-gradient(#f7f7f7 0deg ${angle}deg, red ${angle}deg 360deg)`;

            // 전체 시간이 5분 미만이면 남은 시간 비율 20% 이하 시 pulse,
            // 5분 이상이면 남은 시간이 1분 이하일 때 pulse 적용
            if (this.totalTime < 300) {
                if ((this.timeLeft / this.totalTime) <= 0.2) {
                    progressEl.style.animation = "pulse 2s infinite";
                } else {
                    progressEl.style.animation = "none";
                }
            } else {
                if (this.timeLeft <= 60) {
                    progressEl.style.animation = "pulse 2s infinite";
                } else {
                    progressEl.style.animation = "none";
                }
            }
        },

        // 상태 텍스트 업데이트
        updateStateDisplay() {
            const stateEl = document.getElementById("state");
            stateEl.innerText = this.running
                ? (this.isFocus ? "집중!" : "휴식!")
                : "준비";
        },

        // 타이머 실행: 1초마다 카운트 다운
        run() {
            this.timerId = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.updateTimerDisplay();
                } else {
                    clearInterval(this.timerId);
                    this.running = false;
                    playTone(600, 660);
                    // 집중/휴식 전환
                    if (this.isFocus) {
                        this.cycleCount++;
                        this.totalFocusTime += this.focusDuration / 60;
                        document.getElementById("cycleCount").innerText = this.cycleCount;
                        document.getElementById("totalFocusTime").innerText = this.totalFocusTime;
                        this.isFocus = false;
                        this.totalTime = this.breakDuration;
                        this.timeLeft = this.breakDuration;
                    } else {
                        this.isFocus = true;
                        this.totalTime = this.focusDuration;
                        this.timeLeft = this.focusDuration;
                    }
                    this.updateStateDisplay();
                    this.updateTimerDisplay();
                    if (!this.isPaused) {
                        this.run();
                    }
                }
            }, 1000);
        },

        // 타이머 시작
        start() {
            if (this.running) return;
            playTone(600, 660);
            document.getElementById("startBtn").disabled = true;
            document.getElementById("pauseBtn").disabled = false;
            document.getElementById("pauseBtn").textContent = "일시정지";
            this.running = true;
            this.isPaused = false;
            this.updateStateDisplay();
            this.run();
        },

        // 타이머 일시정지
        pause() {
            clearInterval(this.timerId);
            this.running = false;
            this.isPaused = true;
            document.getElementById("pauseBtn").textContent = "다시시작";
            document.getElementById("pauseBtn").classList.replace("btn-pause", "btn-paused");
            document.getElementById("state").textContent = "일시정지";
            this.updateStateDisplay();
        },

        // 타이머 재개
        resume() {
            if (this.running) return;
            this.running = true;
            this.isPaused = false;
            document.getElementById("pauseBtn").textContent = "일시정지";
            document.getElementById("pauseBtn").classList.replace("btn-paused", "btn-pause");
            this.updateStateDisplay();
            this.run();
        },

        // 타이머 리셋
        reset() {
            clearInterval(this.timerId);
            this.running = false;
            this.isPaused = false;
            this.isFocus = true;
            this.focusDuration = parseInt(document.getElementById("focusDurationDisplay").value) * 60;
            this.breakDuration = parseInt(document.getElementById("breakDurationDisplay").value) * 60;
            this.totalTime = this.focusDuration;
            this.timeLeft = this.focusDuration;
            this.cycleCount = 0;
            this.totalFocusTime = 0;
            document.getElementById("cycleCount").innerText = this.cycleCount;
            document.getElementById("totalFocusTime").innerText = this.totalFocusTime;
            this.updateTimerDisplay();
            this.updateStateDisplay();
            document.getElementById("startBtn").disabled = false;
            document.getElementById("pauseBtn").textContent = "일시정지";
            document.getElementById("pauseBtn").disabled = true;
        },

        // 설정 적용: 읽기 전용 input 값을 타이머 설정에 반영
        setSettings() {
            clearInterval(this.timerId);
            this.running = false;
            this.isPaused = false;
            document.getElementById("startBtn").disabled = false;
            this.focusDuration = parseInt(document.getElementById("focusDurationDisplay").value) * 60;
            this.breakDuration = parseInt(document.getElementById("breakDurationDisplay").value) * 60;
            if (this.isFocus) {
                this.totalTime = this.focusDuration;
                this.timeLeft = this.focusDuration;
            } else {
                this.totalTime = this.breakDuration;
                this.timeLeft = this.breakDuration;
            }
            this.updateTimerDisplay();
            window.scrollTo(0, 0);
        }
    };

    // 남은 시간 조절 슬라이더 이벤트: 슬라이더를 움직이면 타이머의 남은 시간이 업데이트됨
    const timeSlider = document.getElementById("timeAdjustSlider");
    if (timeSlider) {
        timeSlider.addEventListener("input", function() {
            Timer.timeLeft = parseInt(this.value);
            Timer.updateTimerDisplay();
        });
    }

    // beep 소리 재생 함수
    function playTone(duration = 600, frequency = 660, type = 'triangle') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.gain.setValueAtTime(
            parseFloat(document.getElementById("beepVolume").value),
            audioCtx.currentTime
        );
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), duration);
    }

    // 배경 소리 미리 듣기
    function previewBackgroundSound() {
        const bgAudio = document.getElementById("backgroundSound");
        bgAudio.volume = parseFloat(document.getElementById("bgVolume").value);
        bgAudio.play().catch(error => console.log("오디오 자동 재생 차단:", error));
        setTimeout(() => {
            bgAudio.pause();
            bgAudio.currentTime = 0;
        }, 6000);
    }

    // Beep 소리 미리 듣기
    function previewBeepSound() {
        playTone(600, 660);
    }

    // 배경 소리 토글
    function toggleBackgroundSound() {
        const bgAudio = document.getElementById("backgroundSound");
        bgAudio.volume = parseFloat(document.getElementById("bgVolume").value);
        if (bgAudio.paused) {
            bgAudio.play().catch(error => console.log("오디오 자동 재생 차단:", error));
        } else {
            bgAudio.pause();
        }
    }

    document.getElementById("bgVolume").addEventListener("input", function() {
        const bgAudio = document.getElementById("backgroundSound");
        bgAudio.volume = parseFloat(this.value);
    });
    
    // 이벤트 리스너 등록
    document.getElementById("startBtn").addEventListener("click", () => Timer.start());
    document.getElementById("pauseBtn").addEventListener("click", () => {
        if (Timer.isPaused) {
            Timer.resume();
        } else {
            Timer.pause();
        }
    });
    document.getElementById("resetBtn").addEventListener("click", () => Timer.reset());
    document.getElementById("setBtn").addEventListener("click", () => Timer.setSettings());
    document.getElementById("previewBgSound").addEventListener("click", previewBackgroundSound);
    document.getElementById("previewBeep").addEventListener("click", previewBeepSound);
    document.getElementById("toggleBgSound").addEventListener("click", toggleBackgroundSound);

    // 별도 집중 시간 + 버튼
    document.getElementById("manualFocusPlusBtn").addEventListener("click", () => {
        const input = document.getElementById("manualTotalFocusTime");
        let current = parseInt(input.value);
        if (current < 120) {
            input.value = current + 1;
            Timer.totalFocusTime += 1;
            document.getElementById("totalFocusTime").innerText = Timer.totalFocusTime;
        }
    });

    // 별도 집중 시간 - 버튼
    document.getElementById("manualFocusMinusBtn").addEventListener("click", () => {
        const input = document.getElementById("manualTotalFocusTime");
        let current = parseInt(input.value);
        if (current > 0) {
            input.value = current - 1;
            Timer.totalFocusTime -=  1;
            document.getElementById("totalFocusTime").innerText = Timer.totalFocusTime;
        }
    });

    // 집중 시간 + 버튼
    document.getElementById("focusPlusBtn").addEventListener("click", () => {
        const input = document.getElementById("focusDurationDisplay");
        let current = parseInt(input.value);
        if (current < 120) {
            input.value = current + 1;
        }
    });

    // 집중 시간 - 버튼
    document.getElementById("focusMinusBtn").addEventListener("click", () => {
        const input = document.getElementById("focusDurationDisplay");
        let current = parseInt(input.value);
        if (current > 1) {
            input.value = current - 1;
        }
    });

    // 휴식 시간 + 버튼
    document.getElementById("breakPlusBtn").addEventListener("click", () => {
        const input = document.getElementById("breakDurationDisplay");
        let current = parseInt(input.value);
        if (current < 60) {
            input.value = current + 1;
        }
    });

    // 휴식 시간 - 버튼
    document.getElementById("breakMinusBtn").addEventListener("click", () => {
        const input = document.getElementById("breakDurationDisplay");
        let current = parseInt(input.value);
        if (current > 1) {
            input.value = current - 1;
        }
    });

    // Shortcut 버튼 이벤트: 집중 시간 설정 (10분, 25분, 50분)
    document.getElementById("shortcut10").addEventListener("click", () => {
        document.getElementById("focusDurationDisplay").value = 10;
    });
    document.getElementById("shortcut25").addEventListener("click", () => {
        document.getElementById("focusDurationDisplay").value = 25;
    });
    document.getElementById("shortcut50").addEventListener("click", () => {
        document.getElementById("focusDurationDisplay").value = 50;
    });


    Timer.updateTimerDisplay();
    Timer.updateStateDisplay();
});
