import React from 'react';
import { Avatar, Button, Card, Space, Tag } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, HeartFilled, HeartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Activity } from '../api/activity';
import './ActivityCard.css';

export interface ActivityCardProps {
  activity: Activity;
  showActions?: boolean;
  onJoin?: (activityId: string) => void;
  onLeave?: (activityId: string) => void;
  isJoined?: boolean;
  loading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (activityId: string) => void;
  favoriteLoading?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity, showActions = true, onJoin, onLeave, isJoined = false, loading = false,
  isFavorite = false, onToggleFavorite, favoriteLoading = false
}) => {
  const navigate = useNavigate();
  const full = activity.currentParticipants >= activity.maxParticipants;
  const past = dayjs(activity.startTime).isBefore(dayjs());
  const disabled = full || past;

  const handleEnrollment = () => {
    if (isJoined) onLeave?.(activity._id);
    else onJoin?.(activity._id);
  };

  const handleFavorite = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onToggleFavorite?.(activity._id);
  };

  return (
    <Card className="activity-card" styles={{ body: { padding: 0 } }}>
      <button className="activity-cover" onClick={() => navigate(`/activities/${activity._id}`)} aria-label={`查看${activity.title}详情`}>
        {activity.images?.[0]
          ? <img alt="" src={activity.images[0]} className="activity-image" />
          : <div className="activity-image-placeholder"><CalendarOutlined /></div>}
        <Tag color="blue" className="activity-category">{activity.category}</Tag>
        {(past || full) && <Tag className="activity-state">{past ? '已结束' : '已满员'}</Tag>}
      </button>

      <div className="activity-card-body">
        <button className="activity-title-link" onClick={() => navigate(`/activities/${activity._id}`)}>{activity.title}</button>
        <p className="activity-desc-text">{activity.description}</p>
        <div className="activity-meta">
          <span><CalendarOutlined />{dayjs(activity.startTime).format('MM月DD日 HH:mm')}</span>
          <span><EnvironmentOutlined />{activity.location}</span>
          <span><TeamOutlined />{activity.currentParticipants}/{activity.maxParticipants} 人</span>
        </div>
        <div className="activity-card-footer">
          <Space size={8} className="activity-organizer">
            <Avatar size={24} src={activity.organizer.avatar} icon={<UserOutlined />} />
            <span>{activity.organizer.username}</span>
          </Space>
          {onToggleFavorite && <Button type="text" shape="circle" loading={favoriteLoading}
            aria-label={isFavorite ? '取消收藏' : '收藏活动'}
            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleFavorite} />}
          <strong className="activity-price">{activity.price === 0 ? '免费' : `¥${activity.price}`}</strong>
        </div>
        {showActions && (
          <Button block type={isJoined ? 'default' : 'primary'} loading={loading}
            disabled={!isJoined && disabled} onClick={handleEnrollment}>
            {isJoined ? '取消报名' : past ? '活动已结束' : full ? '名额已满' : '参加活动'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ActivityCard;
