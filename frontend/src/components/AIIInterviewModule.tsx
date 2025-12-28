import React from 'react';

interface AIIInterviewModuleProps {
  className?: string;
}

const AIIInterviewModule: React.FC<AIIInterviewModuleProps> = ({ className = '' }) => {
  return (
    <div className={`module-section ai-interview-module ${className}`}>
      <div className="module-header">
        <h2>AI 面试模块</h2>
        <div className="module-status">
          <span className="status-badge">开发中</span>
        </div>
      </div>
      
      <div className="module-content">
        <p className="module-description">
          智能面试助手，帮助你准备各种面试场景，提升面试技巧和信心。
        </p>
        
        <div className="module-features">
          <h3>功能特点</h3>
          <ul className="feature-list">
            <li>📋 常见面试问题库</li>
            <li>🎯 个性化面试建议</li>
            <li>💬 模拟面试练习</li>
            <li>📊 面试表现评估</li>
            <li>📝 面试记录保存</li>
          </ul>
        </div>
        
        <div className="module-actions">
          <button 
            className="btn-primary btn-disabled" 
            disabled
          >
            功能开发中
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIIInterviewModule;
