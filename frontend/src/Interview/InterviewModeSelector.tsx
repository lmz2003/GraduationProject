import React, { useState, useEffect } from 'react';
import type { InterviewMode, InterviewModeOption } from './types';

interface InterviewModeSelectorProps {
  value: InterviewMode;
  onChange: (mode: InterviewMode) => void;
}

/**
 * M-FE-11: 面试形式选择组件
 * 允许用户选择面试形式：文字对话 或 语音通话
 * 自动检测设备可用性
 */
const InterviewModeSelector: React.FC<InterviewModeSelectorProps> = ({ value, onChange }) => {
  const [modes, setModes] = useState<InterviewModeOption[]>([
    {
      code: 'text',
      name: '文字对话',
      description: '纯文字交互，支持语音输入辅助',
      icon: '💬',
      requirements: [],
      available: true,
    },
    {
      code: 'voice',
      name: '语音通话',
      description: '纯语音交互，模拟真实电话面试',
      icon: '📞',
      requirements: ['麦克风'],
      available: false,
    },
    {
      code: 'video',
      name: '视频面试',
      description: '视频语音交互，支持表情分析反馈',
      icon: '📹',
      requirements: ['摄像头', '麦克风'],
      available: false,
    },
  ]);

  useEffect(() => {
    const checkDeviceAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some((device) => device.kind === 'audioinput');
        const hasCamera = devices.some((device) => device.kind === 'videoinput');

        setModes((prev) =>
          prev.map((mode) => {
            if (mode.code === 'voice') {
              return { ...mode, available: hasMicrophone };
            }
            if (mode.code === 'video') {
              return { ...mode, available: hasMicrophone && hasCamera };
            }
            return mode;
          }),
        );
      } catch {
        // 忽略错误，保持设备不可用
      }
    };

    checkDeviceAvailability();
  }, []);

  const handleSelect = async (mode: InterviewModeOption) => {
    if (!mode.available) return;

    if (mode.code === 'voice') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        onChange(mode.code);
      } catch {
        setModes((prev) =>
          prev.map((m) =>
            m.code === 'voice'
              ? { ...m, available: false }
              : m,
          ),
        );
        alert('无法访问麦克风，请检查浏览器权限设置后重试');
      }
    } else if (mode.code === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => track.stop());
        onChange(mode.code);
      } catch {
        setModes((prev) =>
          prev.map((m) =>
            m.code === 'video'
              ? { ...m, available: false }
              : m,
          ),
        );
        alert('无法访问摄像头或麦克风，请检查浏览器权限设置后重试');
      }
    } else {
      onChange(mode.code);
    }
  };

  return (
    <div className="interview-mode-selector">
      <div className="mode-options">
        {modes.map((mode) => (
          <div
            key={mode.code}
            className={`mode-card ${value === mode.code ? 'selected' : ''} ${!mode.available ? 'disabled' : ''}`}
            onClick={() => handleSelect(mode)}
            title={!mode.available ? `需要设备：${mode.requirements.join('、')}` : ''}
          >
            <div className="mode-icon">{mode.icon}</div>
            <div className="mode-info">
              <h4 className="mode-name">{mode.name}</h4>
              <p className="mode-desc">{mode.description}</p>
              {mode.requirements.length > 0 && (
                <div className="mode-requirements">
                  {mode.requirements.map((req) => (
                    <span key={req} className={`requirement-tag ${mode.available ? 'available' : 'unavailable'}`}>
                      {mode.available ? '✓' : '✗'} {req}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {value === mode.code && (
              <div className="mode-selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewModeSelector;
