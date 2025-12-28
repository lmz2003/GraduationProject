import React, { useState, useRef } from 'react';
import styles from './UserSetup.module.scss';

// Theme type definition
type ThemeType = 'light' | 'dark' | 'system';

// UserSetup Component
const UserSetup: React.FC<{ theme?: ThemeType; onComplete?: () => void }> = ({ onComplete }) => {
  // State management
  const [nickname, setNickname] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nicknameValid, setNicknameValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Nickname validation
  const validateNickname = (name: string): boolean => {
    if (!name.trim()) {
      setErrorMessage('昵称不能为空');
      return false;
    }
    if (name.length < 2) {
      setErrorMessage('昵称至少需要2个字符');
      return false;
    }
    if (name.length > 20) {
      setErrorMessage('昵称不能超过20个字符');
      return false;
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(name)) {
      setErrorMessage('昵称只能包含字母、数字、下划线和中文字符');
      return false;
    }
    setErrorMessage('');
    return true;
  };
  
  // Handle nickname change
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameValid(validateNickname(value));
  };
  // 添加图片压缩函数
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // 计算压缩后的尺寸
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // 创建画布并绘制压缩后的图片
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 转换为 base64
          const compressedDataUrl = canvas.toDataURL(file.type, quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Image loading failed'));
      };
      reader.onerror = () => reject(new Error('File reading failed'));
    });
  };

// 在 handleAvatarUpload 中使用
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择图片文件');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('图片大小不能超过5MB');
      return;
    }
    
    try {
      const compressedImage = await compressImage(file);
      setAvatar(compressedImage);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('图片处理失败，请重试');
    } finally {
    }
  }
};
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateNickname(nickname)) {
      setNicknameValid(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Send request to backend API to save user information
      const response = await fetch('http://localhost:3001/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nickname,
          avatar
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Save to localStorage for quick access, but main data is in backend
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        } else {
          // Default behavior: reload page
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user information');
      }
    } catch (error) {
      console.error('Failed to save user information:', error);
      setErrorMessage(error instanceof Error ? error.message : '保存信息失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get initials for default avatar
  const getInitials = (name: string): string => {
    if (!name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };
  
  return (
    <div className={styles['user-setup-container']}>
      <div className={styles['user-setup-card']}>
        <h1 className={styles['user-setup-title']}>欢迎!</h1>
        <p className={styles['user-setup-subtitle']}>请设置你的简介</p>
        
        <div className={styles['avatar-section']}>
          <div className={styles['avatar-container']} onClick={triggerFileInput}>
            <div 
              className={`${styles['avatar-image']} ${avatar ? styles['has-image'] : ''}`}
              style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
            >
              {!avatar && getInitials(nickname || 'U')}
            </div>
            <div className={styles['upload-overlay']}>
              <div>上传头像</div>
            </div>
            <input
              ref={fileInputRef}
              className={styles['hidden-input']}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              title="选择头像图片"
              aria-label="上传头像"
            />
          </div>
        </div>
        
        <div className={styles['nickname-section']}>
          <div className={styles['input-group']}>
            <label className={styles['input-label']}>昵称</label>
            <input
              type="text"
              className={`${styles['input-field']} ${!nicknameValid ? styles['invalid'] : ''}`}
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="请输入昵称"
              maxLength={20}
            />
            <div 
              className={`${styles['character-count']} ${nickname.length > 15 ? styles['near-limit'] : ''} ${nickname.length > 20 ? styles['over-limit'] : ''}`}
            >
              {nickname.length}/20
            </div>
            {!nicknameValid && errorMessage && (
              <div className={styles['error-message']}>{errorMessage}</div>
            )}
          </div>
        </div>
        
        <div className={styles['action-buttons']}>
          <button 
            className={`${styles['button']} ${styles['primary']} ${isLoading ? styles['loading'] : ''}`}
            onClick={handleSubmit}
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? '正在保存...' : '保存并继续'}
          </button> 
        </div>
      </div>
    </div>
  );
};

export default UserSetup;