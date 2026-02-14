import React from 'react';
import { useParams } from 'react-router-dom';
import ResumeList from './ResumeList';
import ResumeUpload from './ResumeUpload';

const ResumeAnalysis: React.FC = () => {
  const { subPage } = useParams<{ subPage?: string }>();

  // 根据路由参数显示不同的页面
  if (subPage === 'upload') {
    return <ResumeUpload />;
  }

  // 默认显示列表
  return <ResumeList />;
};

export default ResumeAnalysis;
