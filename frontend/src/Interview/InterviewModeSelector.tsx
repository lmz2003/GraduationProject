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
  ]);

  // 检测麦克风可用性
  useEffect(() => {
    const checkMicAvailability = async () => {
      try {
        // 检查是否支持 MediaDevices API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return;
        }

        // 检查是否已有麦克风权限
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some((device) => device.kind === 'audioinput');

        if (hasMicrophone) {
          setModes((prev) =>
            prev.map((mode) =>
              mode.code === 'voice' ? { ...mode, available: true } : mode,
            ),
          );
        }
      } catch {
        // 忽略错误，保持 voice 不可用
      }
    };

    checkMicAvailability();
  }, []);

  const handleSelect = async (mode: InterviewModeOption) => {
    if (!mode.available) return;

    if (mode.code === 'voice') {
      // 语音模式需要请求麦克风权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 立即停止流，只需要确认权限
        stream.getTracks().forEach((track) => track.stop());
        onChange(mode.code);
      } catch {
        // 更新权限状态
        setModes((prev) =>
          prev.map((m) =>
            m.code === 'voice'
              ? { ...m, available: false }
              : m,
          ),
        );
        alert('无法访问麦克风，请检查浏览器权限设置后重试');
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
