import React, { useState, useRef, useCallback, useEffect } from 'react';
import { interviewApi } from './api';
import type { Interview, VideoCallStatus, VideoFrameAnalysis } from './types';

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopSquareIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.2 1.28 2 2 0 0 1 3.22.0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.2 7.91" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const VideoOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const VideoOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

interface VideoInterviewProps {
  interview: Interview;
  sessionId: string;
  onEnd: (reportId: string) => void;
  onBack: () => void;
  voice?: string;
  initialDuration?: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const VideoInterview: React.FC<VideoInterviewProps> = ({
  interview,
  sessionId,
  onEnd,
  onBack,
  voice = 'anna',
  initialDuration = 0,
}) => {
  const [callStatus, setCallStatus] = useState<VideoCallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(initialDuration);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(24).fill(2));
  const [videoAnalysisData, setVideoAnalysisData] = useState<VideoFrameAnalysis | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const subtitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCaptureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subtitlesEndRef = useRef<HTMLDivElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef(sessionId);
  const callDurationRef = useRef(callDuration);

  sessionIdRef.current = sessionId;
  callDurationRef.current = callDuration;

  useEffect(() => {
    subtitlesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const saveProgress = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await interviewApi.saveProgress(sessionIdRef.current, {
        elapsedTime: callDurationRef.current,
      });
    } catch (err) {
      console.error('保存进度失败:', err);
    }
  }, []);

  const startCallTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (initialDuration > 0) {
      startCallTimer();
    }

    progressSaveTimerRef.current = setInterval(() => {
      saveProgress();
    }, 30000);

    const handleBeforeUnload = () => {
      saveProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current);
        progressSaveTimerRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress();
    };
  }, [initialDuration, startCallTimer, saveProgress]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
    }
    if (frameCaptureIntervalRef.current) {
      clearInterval(frameCaptureIntervalRef.current);
      frameCaptureIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars = 24;
    const step = Math.floor(bufferLength / bars);
    const newWaveform = Array.from({ length: bars }, (_, i) => {
      const start = i * step;
      const end = Math.min(start + step, bufferLength);
      let sum = 0;
      for (let j = start; j < end; j++) sum += dataArray[j];
      return Math.min(100, Math.max(2, (sum / (end - start) / 255) * 100));
    });

    setWaveformData(newWaveform);
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const playAudioBase64 = useCallback((base64Audio: string, format: string = 'mp3'): Promise<void> => {
    return new Promise((resolve) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const audioDataUrl = `data:audio/${format};base64,${base64Audio}`;
      const audio = new Audio(audioDataUrl);
      currentAudioRef.current = audio;

      setIsAIPlaying(true);

      audio.onended = () => {
        setIsAIPlaying(false);
        currentAudioRef.current = null;
        resolve();
      };

      audio.onerror = () => {
        setIsAIPlaying(false);
        currentAudioRef.current = null;
        resolve();
      };

      audio.play().catch(() => {
        setIsAIPlaying(false);
        resolve();
      });
    });
  }, []);

  const captureVideoFrame = useCallback((): string | null => {
    if (!videoPreviewRef.current || !videoCanvasRef.current || isCameraOff) {
      return null;
    }

    const video = videoPreviewRef.current;
    const canvas = videoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.6);
  }, [isCameraOff]);

  const startRecording = useCallback(async () => {
    if (callStatus !== 'idle' && callStatus !== 'playing') return;
    if (isMuted) return;

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      videoStreamRef.current = stream;
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setCallStatus('recording');

      if (callDuration === 0) startCallTimer();

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('摄像头或麦克风权限被拒绝');
      } else {
        setError('无法启动录制');
      }
    }
  }, [callStatus, isMuted, callDuration, startCallTimer, updateWaveform]);

  const stopRecordingAndSend = useCallback(async () => {
    if (callStatus !== 'recording') return;
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    setCallStatus('processing');
    setCurrentSubtitle('识别中...');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setWaveformData(new Array(24).fill(2));

    const videoFrame = captureVideoFrame();

    mediaRecorderRef.current.onstop = async () => {
      if (audioChunksRef.current.length === 0) {
        setCallStatus('idle');
        setCurrentSubtitle('');
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];

          const result = await interviewApi.sendVideoMessage(sessionId, base64, {
            audioMimeType: 'audio/webm',
            videoFrame: videoFrame || undefined,
            voice,
          });

          setConversations((prev) => [
            ...prev,
            { role: 'user', text: result.userText, timestamp: new Date() },
            { role: 'assistant', text: result.aiText, timestamp: new Date() },
          ]);

          setCurrentSubtitle(`面试官：${result.aiText}`);

          if (result.videoAnalysis) {
            setVideoAnalysisData(result.videoAnalysis);
          }

          setCallStatus('playing');
          await playAudioBase64(result.audioBase64, result.audioFormat);

          if (result.shouldEnd) {
            setCallStatus('ended');
            try {
              const endResult = await interviewApi.endInterview(sessionId);
              onEnd(endResult.reportId);
            } catch {
              setError('结束面试失败，请手动点击结束按钮');
              setCallStatus('idle');
            }
          } else {
            setCallStatus('idle');
            setCurrentSubtitle('请说话...');
            subtitleTimeoutRef.current = setTimeout(() => {
              setCurrentSubtitle('');
            }, 3000);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : '处理失败，请重试');
          setCallStatus('idle');
          setCurrentSubtitle('');
        }
      };

      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  }, [callStatus, sessionId, voice, playAudioBase64, onEnd, captureVideoFrame]);

  const handleEndInterview = useCallback(async () => {
    if (!confirm('确定要结束视频面试吗？')) return;

    cleanup();
    setCallStatus('ended');

    try {
      await saveProgress();
      const result = await interviewApi.endInterview(sessionId);
      onEnd(result.reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束面试失败');
      setCallStatus('idle');
    }
  }, [cleanup, sessionId, onEnd, saveProgress]);

  const handleBack = useCallback(async () => {
    await saveProgress();
    onBack();
  }, [saveProgress, onBack]);

  const toggleCamera = useCallback(() => {
    if (videoStreamRef.current) {
      const videoTrack = videoStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        setIsCameraOff(!isCameraOff);
      }
    }
  }, [isCameraOff]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = () => {
    switch (callStatus) {
      case 'idle': return conversations.length === 0 ? '点击麦克风开始' : '点击麦克风继续';
      case 'recording': return '录音中，点击停止';
      case 'processing': return '处理中...';
      case 'playing': return 'AI 正在回复...';
      case 'ended': return '通话已结束';
      case 'error': return '发生错误';
      default: return '';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😨',
      disgusted: '🤢',
      surprised: '😲',
      neutral: '😐',
    };
    return emojis[emotion] || '😐';
  };

  return (
    <div className="video-interview-page">
      <div className="video-header">
        <button className="back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <div className="video-header-info">
          <div className="video-title">{interview.title || interview.sceneName}</div>
          <div className="video-meta">
            {interview.jobName || '通用岗位'} · {interview.difficultyName}
          </div>
        </div>
        <div className="video-duration">{formatDuration(callDuration)}</div>
      </div>

      {error && (
        <div className="error-message" onClick={() => setError(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}（点击关闭）
        </div>
      )}

      <div className="video-main">
        <div className="video-container">
          <div className="user-video-section">
            <div className={`video-preview ${isCameraOff ? 'camera-off' : ''}`}>
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="user-video"
              />
              {isCameraOff && (
                <div className="camera-off-overlay">
                  <VideoOffIcon />
                  <span>摄像头已关闭</span>
                </div>
              )}
              {callStatus === 'recording' && (
                <div className="recording-indicator">
                  <span className="recording-dot" />
                  录制中
                </div>
              )}
            </div>
            <div className="user-label">你</div>
          </div>

          <div className={`ai-video-section ${isAIPlaying ? 'speaking' : ''}`}>
            <div className="ai-avatar-large">
              <svg className="ai-avatar-svg-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" />
                <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" />
              </svg>
              {isAIPlaying && <div className="ai-speaking-ring-large" />}
            </div>
            <div className="ai-label">AI 面试官</div>
            {isAIPlaying && (
              <div className="ai-waveform-large">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="ai-wave-bar-large"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="video-info-row">
          <div className="subtitles-area">
            {conversations.length === 0 ? (
              <div className="no-subtitles">
                <p>开始录音后，对话内容将显示在这里</p>
              </div>
            ) : (
              <div className="subtitles-list">
                {conversations.map((msg, index) => (
                  <div key={index} className={`subtitle-item ${msg.role}`}>
                    <span className="subtitle-role">
                      {msg.role === 'user' ? '你' : '面试官'}：
                    </span>
                    <span className="subtitle-text">{msg.text}</span>
                  </div>
                ))}
                <div ref={subtitlesEndRef} />
              </div>
            )}

            {currentSubtitle && (
              <div className="current-subtitle">{currentSubtitle}</div>
            )}
          </div>

          {showAnalysisPanel && videoAnalysisData && (
            <div className="analysis-panel">
              <div className="analysis-header">
                <span>实时分析</span>
                <button onClick={() => setShowAnalysisPanel(false)}>×</button>
              </div>
              <div className="analysis-content">
                <div className="analysis-item">
                  <span className="analysis-label">表情</span>
                  <span className="analysis-value">
                    {getEmotionEmoji(videoAnalysisData.dominantEmotion || 'neutral')}
                  </span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">眼神接触</span>
                  <span className={`analysis-value ${videoAnalysisData.eyeContact ? 'good' : 'warn'}`}>
                    {videoAnalysisData.eyeContact ? '良好' : '需改进'}
                  </span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">视线方向</span>
                  <span className="analysis-value">{videoAnalysisData.gazeDirection}</span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">人脸检测</span>
                  <span className={`analysis-value ${videoAnalysisData.faceDetected ? 'good' : 'warn'}`}>
                    {videoAnalysisData.faceDetected ? '正常' : '未检测到'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {callStatus === 'recording' && (
          <div className="user-waveform">
            {waveformData.map((height, i) => (
              <div
                key={i}
                className="user-wave-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        )}

        <div className="video-status-label">{getStatusLabel()}</div>
      </div>

      <div className="video-controls">
        <button
          className={`control-btn mute-btn ${isMuted ? 'muted' : ''}`}
          onClick={() => setIsMuted((prev) => !prev)}
          title={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
          <span>{isMuted ? '取消静音' : '静音'}</span>
        </button>

        <button
          className={`control-btn camera-btn ${isCameraOff ? 'camera-off' : ''}`}
          onClick={toggleCamera}
          title={isCameraOff ? '开启摄像头' : '关闭摄像头'}
        >
          {isCameraOff ? <VideoOffIcon /> : <VideoOnIcon />}
          <span>{isCameraOff ? '开启摄像头' : '关闭摄像头'}</span>
        </button>

        <button
          className={`main-mic-btn ${callStatus === 'recording' ? 'recording' : ''} ${callStatus === 'processing' ? 'processing' : ''}`}
          onClick={callStatus === 'recording' ? stopRecordingAndSend : startRecording}
          disabled={callStatus === 'processing' || callStatus === 'ended' || isMuted}
          title={getStatusLabel()}
        >
          {callStatus === 'processing' ? (
            <span className="btn-spinner" />
          ) : callStatus === 'recording' ? (
            <StopSquareIcon />
          ) : (
            <MicIcon />
          )}
        </button>

        <button
          className={`control-btn analysis-btn ${showAnalysisPanel ? 'active' : ''}`}
          onClick={() => setShowAnalysisPanel((prev) => !prev)}
          title="显示分析面板"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>分析</span>
        </button>

        <button
          className="control-btn end-call-btn"
          onClick={handleEndInterview}
          disabled={callStatus === 'ended'}
          title="结束面试"
        >
          <PhoneOffIcon />
          <span>结束面试</span>
        </button>
      </div>

      <canvas ref={videoCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VideoInterview;
